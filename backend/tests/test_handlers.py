import asyncio
import pytest

import backend.app.handlers as handlers


class CaptureSio:
    def __init__(self):
        self.emits = []
        self.bg_tasks = []

    async def emit(self, event, data=None, to=None):
        self.emits.append((event, data, to))

    def start_background_task(self, target, *args, **kwargs):
        self.bg_tasks.append((target, args, kwargs))


@pytest.mark.asyncio
async def test_predict_emit_and_save(monkeypatch):
    sio = CaptureSio()
    monkeypatch.setattr(handlers, "sio_server", sio)
    monkeypatch.setattr(handlers, "predictImageIsCrosswalk", lambda img: True)

    sid = "sid1"
    await handlers.predict(sid, "user", "data:image/jpeg;base64,AA==", save=True)

    assert ("predict_result_user", True, sid) in sio.emits
    assert len(sio.bg_tasks) == 1


@pytest.mark.asyncio
async def test_predict_error_path(monkeypatch):
    sio = CaptureSio()
    monkeypatch.setattr(handlers, "sio_server", sio)
    def boom(_):
        raise RuntimeError("fail")
    monkeypatch.setattr(handlers, "predictImageIsCrosswalk", boom)

    sid = "sid2"
    await handlers.predict(sid, "bob", "data:image/jpeg;base64,AA==", save=False)

    assert any(evt == "predict_error_bob" for evt, *_ in sio.emits)


@pytest.mark.asyncio
async def test_connect_and_disconnect_cleanup(monkeypatch):
    # Patch state helpers
    calls = {"set_role": [], "remove_ped": [], "remove_driver": [], "notif": []}

    async def fake_get_client():
        return object()

    async def fake_list_ids(db):
        return [1]

    fake_cw = {"peds": ["sid"], "drivers": {"sid": {}}}

    async def fake_get_cw(db, cid):
        return fake_cw

    async def fake_remove_ped(db, cid, sid):
        calls["remove_ped"].append((cid, sid))

    async def fake_remove_driver(db, cid, sid):
        calls["remove_driver"].append((cid, sid))

    async def fake_set_role(db, sid, role):
        calls["set_role"].append((sid, role))

    async def fake_notify(cid):
        calls["notif"].append(cid)

    monkeypatch.setattr(handlers, "get_client", fake_get_client)
    monkeypatch.setattr(handlers, "list_crosswalk_ids", fake_list_ids)
    monkeypatch.setattr(handlers, "get_crosswalk", fake_get_cw)
    monkeypatch.setattr(handlers, "remove_ped", fake_remove_ped)
    monkeypatch.setattr(handlers, "remove_driver", fake_remove_driver)
    monkeypatch.setattr(handlers, "set_role", fake_set_role)
    monkeypatch.setattr(handlers, "handle_distance_based_notifications", fake_notify)

    await handlers.connect("sid", {})
    await handlers.disconnect("sid")

    assert calls["set_role"][0] == ("sid", None)
    assert (1, "sid") in calls["remove_ped"]
    assert (1, "sid") in calls["remove_driver"]
    assert 1 in calls["notif"]
    assert calls["set_role"][-1] == ("sid", None)


@pytest.mark.asyncio
async def test_ped_enter_leave_triggers(monkeypatch):
    sio = CaptureSio()
    monkeypatch.setattr(handlers, "sio_server", sio)

    async def fake_get_client():
        return object()

    async def fake_set_role(db, sid, role):
        return None

    async def fake_add_ped(db, cid, sid):
        return None

    cw = {"last_broadcast": {"ped_critical_min_distance": 7.5}}
    async def fake_get_cw(db, cid):
        return cw

    started = {"val": False}
    async def fake_add_running_task(db, cid):
        started["val"] = True
        return True

    monkeypatch.setattr(handlers, "get_client", fake_get_client)
    monkeypatch.setattr(handlers, "set_role", fake_set_role)
    monkeypatch.setattr(handlers, "add_ped", fake_add_ped)
    monkeypatch.setattr(handlers, "get_crosswalk", fake_get_cw)
    monkeypatch.setattr(handlers, "add_running_task", fake_add_running_task)

    await handlers.ped_enter("sidp", {"crosswalk_id": 42})

    assert any(evt == "ped_critical" and payload["crosswalk_id"] == 42 for evt, payload, to in sio.emits)
    assert len(sio.bg_tasks) == 1
    
    async def fake_remove_ped(db, cid, sid):
        return None
    monkeypatch.setattr(handlers, "remove_ped", fake_remove_ped)

    await handlers.ped_leave("sidp", {"crosswalk_id": 42})
    assert len(sio.bg_tasks) == 2 


@pytest.mark.asyncio
async def test_ped_leave_missing_crosswalk_id(monkeypatch):
    async def fake_get_client():
        return object()
    monkeypatch.setattr(handlers, "get_client", fake_get_client)
    await handlers.ped_leave("sidp", {})


@pytest.mark.asyncio
async def test_driver_enter_update_leave(monkeypatch):
    sio = CaptureSio()
    monkeypatch.setattr(handlers, "sio_server", sio)

    async def fake_get_client():
        return object()

    monkeypatch.setattr(handlers, "get_client", fake_get_client)

    async def fake_set_role(db, sid, role):
        return None

    async def fake_add_driver(db, cid, sid, distance, speed=None):
        return None

    async def fake_update_driver(db, cid, sid, distance, speed=None):
        return None

    async def fake_remove_driver(db, cid, sid):
        return None

    async def fake_add_running_task(db, cid):
        return True

    monkeypatch.setattr(handlers, "set_role", fake_set_role)
    monkeypatch.setattr(handlers, "add_driver", fake_add_driver)
    monkeypatch.setattr(handlers, "update_driver", fake_update_driver)
    monkeypatch.setattr(handlers, "remove_driver", fake_remove_driver)
    monkeypatch.setattr(handlers, "add_running_task", fake_add_running_task)

    await handlers.driver_enter("sidd", {"crosswalk_id": 9, "distance": 12.3, "speed": 3.4})
    await handlers.driver_update("sidd", {"crosswalk_id": 9, "distance": 10.0, "speed": 2.5})
    await handlers.driver_leave("sidd", {"crosswalk_id": 9})

    assert len(sio.bg_tasks) == 3


@pytest.mark.asyncio
async def test_ensure_background_task_not_started_when_flag_false(monkeypatch):
    sio = CaptureSio()
    monkeypatch.setattr(handlers, "sio_server", sio)
    async def fake_get_client():
        return object()
    async def fake_add_running_task(db, cid):
        return False
    monkeypatch.setattr(handlers, "get_client", fake_get_client)
    monkeypatch.setattr(handlers, "add_running_task", fake_add_running_task)
    await handlers._ensure_background_task_running(123)
    assert len(sio.bg_tasks) == 0
