import asyncio
import pytest

import backend.app.state as state


# Simple stand-ins for Firestore sentinels/exceptions
class _ArrayUnion:
    def __init__(self, values):
        self.values = list(values)

class _ArrayRemove:
    def __init__(self, values):
        self.values = list(values)

DELETE = object()

class AlreadyExists(Exception):
    pass

class NotFound(Exception):
    pass


class FakeDocRef:
    def __init__(self, store, doc_id):
        self.store = store
        self.id = str(doc_id)

    async def get(self, transaction=None):
        return self

    @property
    def exists(self):
        return self.id in self.store

    def to_dict(self):
        return dict(self.store.get(self.id, {})) if self.exists else None

    async def set(self, data, merge=False):
        if not merge or self.id not in self.store:
            self.store[self.id] = dict(data)
        else:
            self.store[self.id].update(data)

    async def update(self, updates: dict):
        doc = self.store.setdefault(self.id, {})
        for key, val in updates.items():
            if "." in key:
                # nested update e.g., drivers.sid.field
                parts = key.split(".")
                d = doc
                for p in parts[:-1]:
                    d = d.setdefault(p, {})
                last = parts[-1]
                if val is DELETE:
                    d.pop(last, None)
                else:
                    d[last] = val
            else:
                if isinstance(val, _ArrayUnion):
                    arr = doc.setdefault(key, [])
                    for v in val.values:
                        if v not in arr:
                            arr.append(v)
                elif isinstance(val, _ArrayRemove):
                    arr = doc.setdefault(key, [])
                    for v in val.values:
                        while v in arr:
                            arr.remove(v)
                else:
                    doc[key] = val

    async def create(self, payload):
        if self.id in self.store:
            raise AlreadyExists()
        self.store[self.id] = dict(payload)

    async def delete(self):
        if self.id not in self.store:
            raise NotFound()
        self.store.pop(self.id, None)


class FakeCollection:
    def __init__(self, db, name):
        self.db = db
        self.name = name
        self._sub = db._data.setdefault(name, {})

    def document(self, doc_id):
        return FakeDocRef(self._sub, doc_id)

    def select(self, fields):
        return self

    async def get(self):
        return [FakeDocRef(self._sub, k) for k in list(self._sub.keys())]


class FakeDB:
    def __init__(self):
        self._data = {}
        self._runtime = {}

    def collection(self, name):
        return FakeCollection(self, name)

    def transaction(self):
        class _T:
            def update(self, ref, data):
                return asyncio.create_task(ref.update(data))
        return _T()


@pytest.fixture(autouse=True)
def patch_firestormonkey(monkeypatch):
    monkeypatch.setattr(state, "ArrayUnion", _ArrayUnion)
    monkeypatch.setattr(state, "ArrayRemove", _ArrayRemove)
    monkeypatch.setattr(state, "DELETE_FIELD", DELETE)
    monkeypatch.setattr(state, "AlreadyExists", AlreadyExists)
    monkeypatch.setattr(state, "NotFound", NotFound)

    def passthrough_deco(fn):
        async def wrapper(transaction):
            return await fn(transaction)
        return wrapper

    monkeypatch.setattr(state, "async_transactional", lambda f: passthrough_deco(f))


@pytest.mark.asyncio
async def test_add_remove_ped_and_list_ids():
    db = FakeDB()
    await state.add_ped(db, 1, "p1")
    await state.add_ped(db, 1, "p1")
    cw = await state.get_crosswalk(db, 1)
    assert cw["peds"] == ["p1"]

    await state.remove_ped(db, 1, "p1")
    cw2 = await state.get_crosswalk(db, 1)
    assert cw2["peds"] == []

    ids = await state.list_crosswalk_ids(db)
    assert ids == [1]


@pytest.mark.asyncio
async def test_add_update_remove_driver_and_broadcast_fields():
    db = FakeDB()
    await state.add_driver(db, 2, "d1", distance=10.0, speed=3.2)
    cw = await state.get_crosswalk(db, 2)
    assert "d1" in cw["drivers"] and cw["drivers"]["d1"]["distance"] == 10.0

    await state.update_driver(db, 2, "d1", distance=8.0, speed=None)
    cw2 = await state.get_crosswalk(db, 2)
    assert cw2["drivers"]["d1"]["distance"] == 8.0
    assert "speed" in cw2["drivers"]["d1"]

    await state.set_last_broadcast_value(db, 2, "ped_critical_min_distance", 7.0)
    cw3 = await state.get_crosswalk(db, 2)
    assert cw3["last_broadcast"]["ped_critical_min_distance"] == 7.0

    await state.clear_last_broadcast_key(db, 2, "ped_critical_min_distance")
    cw4 = await state.get_crosswalk(db, 2)
    assert "ped_critical_min_distance" not in cw4.get("last_broadcast", {})


    ref = state.crosswalk_ref(db, 2)
    await ref.update({"last_broadcast": {"driver_critical_active": {"d1": 5.0}}})
    await state.remove_driver(db, 2, "d1")
    cw5 = await state.get_crosswalk(db, 2)
    assert "d1" not in cw5["drivers"]
    assert "driver_critical_active" in cw5.get("last_broadcast", {})
    assert "d1" not in cw5["last_broadcast"]["driver_critical_active"]


@pytest.mark.asyncio
async def test_running_tasks_markers():
    db = FakeDB()
    def runtime_ref(db_, crosswalk_id):
        return db_.collection("runtime").document(str(crosswalk_id))

    orig_runtime_ref = state.runtime_ref
    state.runtime_ref = runtime_ref
    try:
        assert await state.add_running_task(db, 3) is True
        assert await state.add_running_task(db, 3) is False
        assert await state.remove_running_task(db, 3) is True
        await state.remove_running_task(db, 3)
    finally:
        state.runtime_ref = orig_runtime_ref


@pytest.mark.asyncio
async def test_get_client_singleton(monkeypatch):
    class StubClient:
        def __init__(self, database=None):
            self.database = database

    monkeypatch.setattr(state, "AsyncClient", StubClient)
    monkeypatch.setattr(state, "_client", None)

    c1 = await state.get_client()
    c2 = await state.get_client()
    assert isinstance(c1, StubClient) and c1 is c2
