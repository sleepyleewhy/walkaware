from typing import Any, Dict, Optional, List, Set
from google.cloud.firestore_v1 import (
    AsyncClient,
    AsyncTransaction,
    async_transactional,
    ArrayUnion,
    ArrayRemove,
    DELETE_FIELD
)
from google.api_core.exceptions import AlreadyExists, NotFound
import asyncio
import time

PED_CRITICAL_DISTANCE = 100.0
DRIVER_CRITICAL_DISTANCE = 50.0
DEBOUNCE_MIN_DISTANCE_DELTA = 3.0
DRIVER_PRESENCE_TTL = 15.0
PED_PRESENCE_TTL = 15.0
PRUNE_LOOP_INTERVAL = 20.0

# CROSSWALKS: dict[int, dict[str, Any]] = {}
# SUBSCRIPTIONS: dict[str, Set[int]] = {}
# ROLE: dict[str, str] = {}
# RUNNING_TASKS = set()

# Singleton Firestore client
_client: Optional[AsyncClient] = None
_client_lock = asyncio.Lock()

async def get_client() -> AsyncClient:
    global _client
    if _client is None:
        async with _client_lock:
            if _client is None:
                _client = AsyncClient(database="walkaware-db")
    return _client

def crosswalk_ref(db: AsyncClient, crosswalk_id: int):
    return db.collection("crosswalks").document(str(crosswalk_id))

def session_ref(db: AsyncClient, sid: str):
    return db.collection("sessions").document(sid)

def runtime_ref(db: AsyncClient, crosswalk_id : int):
    return db.collection("runtime").document(str(crosswalk_id))
# Crosswalk operations
async def ensure_crosswalk(db: AsyncClient, crosswalk_id: int):
    ref = crosswalk_ref(db, crosswalk_id)
    snap = await ref.get()
    if not snap.exists:
        await ref.set({
            "peds": [],
            "drivers": {},
            "last_broadcast": {}
        })

async def add_ped(db: AsyncClient, crosswalk_id: int, sid: str):
    await ensure_crosswalk(db, crosswalk_id)
    await crosswalk_ref(db, crosswalk_id).update({
        "peds": ArrayUnion([sid])
    })

async def remove_ped(db: AsyncClient, crosswalk_id: int, sid: str):
    await crosswalk_ref(db, crosswalk_id).update({
        "peds": ArrayRemove([sid])
    })

async def add_driver(db: AsyncClient, crosswalk_id: int, sid: str, distance: Optional[float], speed: Optional[float] = None):
    await ensure_crosswalk(db, crosswalk_id)
    await crosswalk_ref(db, crosswalk_id).update({
        f"drivers.{sid}": {"distance": distance, "speed": speed if speed is not None else None, "ts": time.time()}
    })

async def update_driver(db: AsyncClient, crosswalk_id: int, sid: str, distance: Optional[float], speed: Optional[float] = None):
    updates = {
        f"drivers.{sid}.distance": distance,
        f"drivers.{sid}.ts": time.time()
    }
    if speed is not None:
        updates[f"drivers.{sid}.speed"] = speed
    else:
        updates.setdefault(f"drivers.{sid}.speed", None)

    await crosswalk_ref(db, crosswalk_id).update(updates)

async def remove_driver(db: AsyncClient, crosswalk_id: int, sid: str):
    cw_ref = crosswalk_ref(db, crosswalk_id)
    await cw_ref.update({
        f"drivers.{sid}": DELETE_FIELD,
        f"last_broadcast.driver_critical_active.{sid}": DELETE_FIELD
    })
    

async def get_crosswalk(db: AsyncClient, crosswalk_id: int) -> Optional[Dict[str, Any]]:
    snap = await crosswalk_ref(db, crosswalk_id).get()
    return snap.to_dict() if snap.exists else None

async def set_last_broadcast_value(db: AsyncClient, crosswalk_id: int, key: str, value: Any):
    await crosswalk_ref(db, crosswalk_id).update({
        f"last_broadcast.{key}": value
    })

async def clear_last_broadcast_key(db: AsyncClient, crosswalk_id: int, key: str):
    cw_ref = crosswalk_ref(db, crosswalk_id)

    @async_transactional
    async def txn(transaction: AsyncTransaction):
        snap = await cw_ref.get(transaction=transaction)
        if not snap.exists:
            return
        data = snap.to_dict() or {}
        lb = data.get("last_broadcast", {})
        if key in lb:
            lb.pop(key, None)
            transaction.update(cw_ref, {"last_broadcast": lb})

    await txn(db.transaction())

# Session / role
async def set_role(db: AsyncClient, sid: str, role: Optional[str]):
    await session_ref(db, sid).set({"role": role, "subscriptions": []}, merge=True)

async def remove_session(db: AsyncClient, sid: str):
    await session_ref(db, sid).delete()

# Running tasks
async def add_running_task(db: AsyncClient, crosswalk_id: int):
    ref = runtime_ref(db, crosswalk_id)
    payload = {"ts" : time.time()}
    try:
        await ref.create(payload)
        return True
    except AlreadyExists:
        return False
    except Exception:
        return False

async def remove_running_task(db: AsyncClient, crosswalk_id: int):
    ref = runtime_ref(db, crosswalk_id)
    try:
        await ref.delete()
        return True
    except NotFound:
        pass
    except Exception:
        # swallow or handle based on your logging strategy
        pass

async def list_crosswalk_ids(db: AsyncClient) -> List[int]:
    docs = await db.collection("crosswalks").select([]).get()
    return [int(d.id) for d in docs]
