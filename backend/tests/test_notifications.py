import asyncio
import time
import pytest

import backend.app.notifications as notifications


class FakeDoc:
    def __init__(self, store):
        self.store = store

    async def update(self, data):
        lb = self.store.setdefault("last_broadcast", {})
        if "last_broadcast" in data:
            self.store["last_broadcast"] = data["last_broadcast"]
        if "drivers" in data:
            self.store["drivers"] = data["drivers"]


class FakeDB:
    def __init__(self, store):
        self.store = store


@pytest.mark.asyncio
async def test_notifications_flows(monkeypatch):
    store = {
        "peds": ["ped1", "ped2"],
        "drivers": {
            "drv_expired": {"distance": 5.0, "speed": 3.0, "ts": time.time() - 10_000},
            "drv1": {"distance": 12.0, "speed": 2.0, "ts": time.time()},
            "drv2": {"distance": 8.2, "speed": 2.0, "ts": time.time()},
        },
        "last_broadcast": {},
    }

    events = []

    async def fake_emit_to_sids(sids, event, payload):
        events.append((tuple(sids), event, payload))

    def fake_crosswalk_ref(db, cid):
        return FakeDoc(store)

    async def fake_get_client():
        return FakeDB(store)

    async def fake_get_crosswalk(db, cid):
        return dict(store)

    async def fake_remove_running_task(db, cid):
        return None

    monkeypatch.setattr(notifications, "emit_to_sids", fake_emit_to_sids)
    monkeypatch.setattr(notifications, "crosswalk_ref", fake_crosswalk_ref)
    monkeypatch.setattr(notifications, "get_client", fake_get_client)
    monkeypatch.setattr(notifications, "get_crosswalk", fake_get_crosswalk)
    monkeypatch.setattr(notifications, "remove_running_task", fake_remove_running_task)

    await notifications.handle_distance_based_notifications(1)

    assert any(ev == "driver_critical" and sids == ("drv2",) for sids, ev, _ in events)
    assert any(ev == "ped_critical" for _, ev, _ in events)
    assert any(ev == "presence" for _, ev, _ in events)

    store["peds"] = []
    store["drivers"]["drv2"]["distance"] = 1000.0

    events.clear()
    await notifications.handle_distance_based_notifications(1)

    assert any(ev == "alert_end" for _, ev, _ in events)
    assert any(ev == "presence" for _, ev, _ in events)
