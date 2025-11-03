import pytest

import backend.app.notifications as notifications


@pytest.mark.asyncio
async def test_presence_emission_only(monkeypatch):
    store = {"peds": [], "drivers": {}, "last_broadcast": {}}

    async def fake_get_client():
        return object()

    async def fake_get_crosswalk(db, cid):
        return dict(store)

    updated = {"val": False}
    class FakeDoc:
        async def update(self, data):
            updated["val"] = True
    def fake_crosswalk_ref(db, cid):
        return FakeDoc()

    emitted = []
    async def fake_emit_to_sids(sids, evt, payload):
        emitted.append((evt, payload))

    async def fake_remove_running_task(db, cid):
        return None

    monkeypatch.setattr(notifications, "get_client", fake_get_client)
    monkeypatch.setattr(notifications, "get_crosswalk", fake_get_crosswalk)
    monkeypatch.setattr(notifications, "crosswalk_ref", fake_crosswalk_ref)
    monkeypatch.setattr(notifications, "emit_to_sids", fake_emit_to_sids)
    monkeypatch.setattr(notifications, "remove_running_task", fake_remove_running_task)

    await notifications.handle_distance_based_notifications(7)

    # Only presence is expected as there are no peds/drivers
    assert any(evt == "presence" for evt, _ in emitted)
    assert updated["val"] is True
