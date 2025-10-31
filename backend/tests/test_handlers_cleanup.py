import pytest

import backend.app.handlers as handlers


@pytest.mark.asyncio
async def test_cleanup_sid_membership_ped(monkeypatch):
    async def fake_get_client():
        return object()

    async def fake_list_ids(db):
        return [5]

    cw_store = {"peds": ["sid"], "drivers": {}}
    async def fake_get_cw(db, cid):
        return dict(cw_store)

    called = {"remove_ped": 0, "notif": 0}

    async def fake_remove_ped(db, cid, sid):
        called["remove_ped"] += 1

    async def fake_notify(cid):
        called["notif"] += 1

    monkeypatch.setattr(handlers, "get_client", fake_get_client)
    monkeypatch.setattr(handlers, "list_crosswalk_ids", fake_list_ids)
    monkeypatch.setattr(handlers, "get_crosswalk", fake_get_cw)
    monkeypatch.setattr(handlers, "remove_ped", fake_remove_ped)
    monkeypatch.setattr(handlers, "handle_distance_based_notifications", fake_notify)

    await handlers._cleanup_sid_membership("sid", role="ped")

    assert called["remove_ped"] == 1
    assert called["notif"] == 1


@pytest.mark.asyncio
async def test_cleanup_sid_membership_driver(monkeypatch):
    async def fake_get_client():
        return object()

    async def fake_list_ids(db):
        return [1]

    cw_store = {"peds": [], "drivers": {"sid": {}}}
    async def fake_get_cw(db, cid):
        return dict(cw_store)

    called = {"remove_driver": 0, "notif": 0}

    async def fake_remove_driver(db, cid, sid):
        called["remove_driver"] += 1

    async def fake_notify(cid):
        called["notif"] += 1

    monkeypatch.setattr(handlers, "get_client", fake_get_client)
    monkeypatch.setattr(handlers, "list_crosswalk_ids", fake_list_ids)
    monkeypatch.setattr(handlers, "get_crosswalk", fake_get_cw)
    monkeypatch.setattr(handlers, "remove_driver", fake_remove_driver)
    monkeypatch.setattr(handlers, "handle_distance_based_notifications", fake_notify)

    await handlers._cleanup_sid_membership("sid", role="driver")

    assert called["remove_driver"] == 1
    assert called["notif"] == 1
