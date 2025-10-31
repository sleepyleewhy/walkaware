import asyncio
import pytest

import backend.app.prune as prune


class FakeDoc:
    def __init__(self, id, data):
        self.id = str(id)
        self._data = data
        self.exists = True

    def to_dict(self):
        return dict(self._data)


class FakeCollection:
    def __init__(self, docs):
        self._docs = [FakeDoc(i, d) for i, d in docs]

    async def get(self):
        return self._docs


class FakeDB:
    def __init__(self, docs):
        self._docs = docs

    def collection(self, name):
        if name == "crosswalks":
            return FakeCollection(self._docs)
        raise KeyError(name)


@pytest.mark.asyncio
async def test_prune_loop_one_iteration(monkeypatch):
    fake_db = FakeDB(docs=[(1, {"peds": [], "drivers": {}})])

    async def fake_get_client():
        return fake_db

    called = {"val": 0}

    async def fake_handle(cid, cw):
        called["val"] += 1
        raise asyncio.CancelledError

    async def fast_sleep(_):
        return None

    monkeypatch.setattr(prune, "get_client", fake_get_client)
    monkeypatch.setattr(prune, "handle_distance_based_notifications", fake_handle)
    monkeypatch.setattr(prune, "PRUNE_LOOP_INTERVAL", 0)
    monkeypatch.setattr(asyncio, "sleep", fast_sleep)

    with pytest.raises(asyncio.CancelledError):
        await prune.prune_loop()

    assert called["val"] == 1


def test_register_prune_creates_task(monkeypatch):
    created = {"val": False}

    def fake_create_task(coro):
        created["val"] = True
        class T:
            pass
        return T()

    monkeypatch.setattr(prune.asyncio, "create_task", fake_create_task)
    prune.register_prune(object())
    assert created["val"] is True


@pytest.mark.asyncio
async def test_prune_loop_except_and_sleep(monkeypatch):
    class BoomCollection:
        async def get(self):
            raise RuntimeError("boom")

    class FakeDB:
        def collection(self, name):
            if name == "crosswalks":
                return BoomCollection()
            raise KeyError(name)

    async def fake_get_client():
        return FakeDB()

    sleep_called = {"v": False}

    async def fake_sleep(_):
        sleep_called["v"] = True
        raise asyncio.CancelledError

    monkeypatch.setattr(prune, "get_client", fake_get_client)
    monkeypatch.setattr(prune.asyncio, "sleep", fake_sleep)

    with pytest.raises(asyncio.CancelledError):
        await prune.prune_loop()

    assert sleep_called["v"] is True
