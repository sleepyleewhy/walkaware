import asyncio
import time
from app.state import CROSSWALKS, ROLE, RUNNING_TASKS
from backend.prediction import predictImageIsCrosswalk
from sockets import sio_server
from app.notifications import get_crosswalk_lock, handle_distance_based_notifications

_role_lock = asyncio.Lock()

@sio_server.event
async def connect(sid, environ):
    async with _role_lock:
        ROLE[sid] = None

@sio_server.event
async def disconnect(sid):
    async with _role_lock:
        role = ROLE.pop(sid, None)
        
    crosswalks_to_update = []

    
    # First, collect crosswalks that need updates
    for crosswalk_id, cr in CROSSWALKS.items():
        lock = await get_crosswalk_lock(crosswalk_id)
        async with lock:
            modified = False
            if role == "ped" and sid in cr.get("peds", set()):
                cr["peds"].remove(sid)
                modified = True
            elif role == "driver" and sid in cr.get("drivers", {}):
                cr["drivers"].pop(sid, None)
                modified = True
            
            if modified:
                crosswalks_to_update.append(crosswalk_id)
    for crosswalk_id in crosswalks_to_update:
        ensure_background_task_running(crosswalk_id)
    
@sio_server.event
async def predict(sid, username, imageAsBase64):
    try:
        result = predictImageIsCrosswalk(imageAsBase64)
        await sio_server.emit('predict_result_'+ username, result, to=sid)
    except Exception as e:
        await sio_server.emit('predict_error_'+ username, str(e), to=sid)
        

@sio_server.event
async def ped_enter(sid, data):
    crosswalk_id = data["crosswalk_id"]
    
    async with _role_lock:
        ROLE[sid] = "ped"
        
    lock = await get_crosswalk_lock(crosswalk_id)
    async with lock:
        CROSSWALKS.setdefault(crosswalk_id, {
                                "peds" : set(),
                                "drivers" : {},
                                "last_broadcast": {}
                                })
        CROSSWALKS[crosswalk_id]["peds"].add(sid)
    await ensure_background_task_running(crosswalk_id)

@sio_server.event
async def ped_leave(sid, data):
    crosswalk_id = data["crosswalk_id"]
    if crosswalk_id is None:
        return
    lock = await get_crosswalk_lock(crosswalk_id)
    async with lock:
        cr = CROSSWALKS.get(crosswalk_id)
        if cr and sid in cr.get("peds", set()):
            cr["peds"].remove(sid)
    await ensure_background_task_running(crosswalk_id)
    
@sio_server.event
async def driver_enter(sid, data):
    crosswalk_id = data["crosswalk_id"]
    async with _role_lock:
        ROLE[sid] = "driver"
        
    lock = await get_crosswalk_lock(crosswalk_id)
    async with lock:
        
        CROSSWALKS.setdefault(crosswalk_id, {
                                    "peds" : set(),
                                    "drivers" : {},
                                    "last_broadcast": {}
                                    })
        CROSSWALKS[crosswalk_id]["drivers"][sid] = {"distance" : data.get("distance"), "ts": time.time()}
    await ensure_background_task_running(crosswalk_id)
    
@sio_server.event
async def driver_update(sid, data):
    crosswalk_id = data["crosswalk_id"]
    lock = await get_crosswalk_lock(crosswalk_id)
    
    async with lock:
        
        cr = CROSSWALKS.get(crosswalk_id)
        if cr and sid in cr["drivers"]:
            cr["drivers"][sid]["distance"] = data.get("distance")
            cr["drivers"][sid]["ts"] = time.time()
    await ensure_background_task_running(crosswalk_id)

@sio_server.event
async def driver_leave(sid, data):
    crosswalk_id = data["crosswalk_id"]
    lock = await get_crosswalk_lock(crosswalk_id)
    async with lock:    
        cr = CROSSWALKS.get(crosswalk_id)
        if cr and sid in cr["drivers"]:
            cr["drivers"].pop(sid, None)
    await ensure_background_task_running(crosswalk_id)
    
    
_running_tasks_lock = asyncio.Lock()
async def ensure_background_task_running(crosswalk_id):
    async with _running_tasks_lock:
            if crosswalk_id not in RUNNING_TASKS:
                RUNNING_TASKS.add(crosswalk_id)
                # Start the background task
                sio_server.start_background_task(handle_distance_based_notifications, crosswalk_id)