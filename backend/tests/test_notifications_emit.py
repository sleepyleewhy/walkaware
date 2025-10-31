import pytest

import backend.app.notifications as notifications


@pytest.mark.asyncio
async def test_emit_to_sids_handles_exceptions(monkeypatch):
    calls = {"emits": 0}

    class FakeSio:
        async def emit(self, event, payload, to=None):
            calls["emits"] += 1
            if calls["emits"] == 1:
                raise RuntimeError("fail once")

    monkeypatch.setattr(notifications, "sio_server", FakeSio())

    await notifications.emit_to_sids(["a", "b"], "evt", {"x": 1})
    assert calls["emits"] == 2
