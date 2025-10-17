import time
from typing import Optional
from sockets import sio_server
from prediction import predictImageIsCrosswalk
from app.notifications import handle_distance_based_notifications
from app.drive_upload import (
    async_upload_image_base64_to_drive,
    DRIVE_FOLDER_CROSSWALK_ID,
    DRIVE_FOLDER_NO_CROSSWALK_ID,
)
from app.state import (
    get_client,
    set_role,
    add_ped,
    remove_ped,
    add_driver,
    update_driver,
    remove_driver,
    list_crosswalk_ids,
    get_crosswalk,
    add_running_task,
)
# If you still have per-crosswalk asyncio locks you can import them; otherwise omitted:
# from app.locks import get_crosswalk_lock

async def _cleanup_sid_membership(sid: str, role: Optional[str]):
    """
    Naive cleanup: scan all crosswalks and remove sid from peds/drivers.
    For large scale, maintain an inverse index (session doc listing memberships).
    """
    db = await get_client()
    try:
        ids = await list_crosswalk_ids(db)
        for crosswalk_id in ids:
            cw = await get_crosswalk(db, crosswalk_id)
            if not cw:
                continue
            modified = False
            if role == "ped" and sid in cw.get("peds", []):
                await remove_ped(db, crosswalk_id, sid)
                modified = True
            elif role == "driver" and sid in cw.get("drivers", {}):
                await remove_driver(db, crosswalk_id, sid)
                modified = True
            if modified:
                # Trigger notification logic to reflect presence change
                await handle_distance_based_notifications(crosswalk_id)
    except Exception:
        pass


@sio_server.event
async def connect(sid, environ):
    db = await get_client()
    await set_role(db, sid, None)


@sio_server.event
async def disconnect(sid):
    db = await get_client()
    try:
        ids = await list_crosswalk_ids(db)
        for crosswalk_id in ids:
            cw = await get_crosswalk(db, crosswalk_id)
            if not cw:
                continue
            modified = False
            if sid in (cw.get("peds") or []):
                await remove_ped(db, crosswalk_id, sid)
                modified = True
            if sid in (cw.get("drivers") or {}):
                await remove_driver(db, crosswalk_id, sid)
                modified = True
            if modified:
                await handle_distance_based_notifications(crosswalk_id)
    except Exception:
        pass
    await set_role(db, sid, None)


@sio_server.event
async def predict(sid, username, imageAsBase64, save: bool = False):
    try:
        result = predictImageIsCrosswalk(imageAsBase64)
        await sio_server.emit("predict_result_" + username, result, to=sid)

        if save:
            folder_id = DRIVE_FOLDER_CROSSWALK_ID if result else DRIVE_FOLDER_NO_CROSSWALK_ID
            try:
                sio_server.start_background_task(
                    async_upload_image_base64_to_drive,
                    imageAsBase64,
                    folder_id,
                    None,
                )
            except Exception:
                pass
    except Exception as e:
        await sio_server.emit("predict_error_" + username, str(e), to=sid)


@sio_server.event
async def ped_enter(sid, data):
    crosswalk_id = data["crosswalk_id"]
    db = await get_client()
    await set_role(db, sid, "ped")
    await add_ped(db, crosswalk_id, sid)

    # If there was an active ped critical alert, re-send it to this new ped
    cw = await get_crosswalk(db, crosswalk_id)
    if cw:
        existing_alert = (cw.get("last_broadcast") or {}).get("ped_critical_min_distance")
        if existing_alert is not None:
            payload = {
                "crosswalk_id": crosswalk_id,
                "min_distance": existing_alert,
                "ts": int(time.time())
            }
            await sio_server.emit("ped_critical", payload, to=sid)

    await _ensure_background_task_running(crosswalk_id)


@sio_server.event
async def ped_leave(sid, data):
    crosswalk_id = data.get("crosswalk_id")
    if crosswalk_id is None:
        return
    db = await get_client()
    await remove_ped(db, crosswalk_id, sid)
    await _ensure_background_task_running(crosswalk_id)


@sio_server.event
async def driver_enter(sid, data):
    crosswalk_id = data["crosswalk_id"]
    distance = data.get("distance")
    db = await get_client()
    await set_role(db, sid, "driver")
    await add_driver(db, crosswalk_id, sid, distance)
    await _ensure_background_task_running(crosswalk_id)


@sio_server.event
async def driver_update(sid, data):
    crosswalk_id = data["crosswalk_id"]
    distance = data.get("distance")
    db = await get_client()
    await update_driver(db, crosswalk_id, sid, distance)
    await _ensure_background_task_running(crosswalk_id)


@sio_server.event
async def driver_leave(sid, data):
    crosswalk_id = data["crosswalk_id"]
    print(crosswalk_id)
    db = await get_client()
    await remove_driver(db, crosswalk_id, sid)
    await _ensure_background_task_running(crosswalk_id)


async def _ensure_background_task_running(crosswalk_id: int):
    """
    Uses Firestore-backed running_tasks to guarantee single task per crosswalk cluster-wide.
    """
    db = await get_client()
    try:
        started = await add_running_task(db, crosswalk_id)
        if started:
            sio_server.start_background_task(handle_distance_based_notifications, crosswalk_id)
    except Exception:
        pass
    