import time
from typing import List
from sockets import sio_server
from app.locks import get_crosswalk_lock,_running_tasks_lock
from app.state import CROSSWALKS, DEBOUNCE_MIN_DISTANCE_DELTA, DRIVER_PRESENCE_TTL, PED_CRITICAL_DISTANCE, DRIVER_CRITICAL_DISTANCE, RUNNING_TASKS, SUBSCRIPTIONS, ROLE

async def emit_to_sids(sids: List[str], event: str, payload: dict):
    for sid in sids:
        try:
            await sio_server.emit(event, payload, to=sid)
        except Exception:
            pass

    
async def emit_presence(crosswalk_id: int):
    lock = await get_crosswalk_lock(crosswalk_id)
    payload = None
    async with lock:
        
        cr= CROSSWALKS.get(crosswalk_id)
        if not cr:
            return
        ped_sids = list(cr.get("peds", set()))
        driver_sids = list(cr.get("drivers", {}).keys())
        payload = {
            "crosswalk_id": crosswalk_id,
            "ped_count": len(cr.get("peds", set())),
            "driver_count": len(cr.get("drivers", {})),
            "ts": int(time.time())
        }
    if payload:    
        await emit_to_sids(ped_sids, "presence", payload)
        await emit_to_sids(driver_sids, "presence", payload)
    
async def handle_distance_based_notifications(crosswalk_id: int):
    lock = await get_crosswalk_lock(crosswalk_id)
    send_ped_alert_end = False
    try: 
        async with lock:
            cr = CROSSWALKS.get(crosswalk_id)
            if not cr:
                return
            
            now = time.time()
            driver_cutoff = now - DRIVER_PRESENCE_TTL
            
            expired_drivers = [d for d, info in cr["drivers"].items() 
                            if info.get("ts", 0) < driver_cutoff]
            
            for d in expired_drivers:
                cr["drivers"].pop(d, None)
                cr.get("driver_last_critical", {}).pop(d, None)
                
            distances: List[float] = [v["distance"] for v in cr["drivers"].values() 
                                        if v.get("distance") is not None]
            ped_count = len(cr.get("peds", set()))
            ped_sids = list(cr.get("peds", set()))
            prev_ped_critical = cr["last_broadcast"].get("ped_critical_min_distance")
            
            if not distances:
                if prev_ped_critical is not None:
                    cr["last_broadcast"].pop("ped_critical_min_distance", None)
                    send_ped_alert_end = True
            else:
                min_dist = min(distances)
                
                cr.setdefault("driver_last_critical", {})
                driver_notifications = []
                
                for drv_sid, info in list(cr["drivers"].items()):
                    drv_dist = info.get("distance")
                    if drv_dist is None:
                        continue
                        
                    prev_for_driver = cr["driver_last_critical"].get(drv_sid)
                    if drv_dist <= DRIVER_CRITICAL_DISTANCE and ped_count > 0:
                        if prev_for_driver is None or abs(prev_for_driver - drv_dist) >= DEBOUNCE_MIN_DISTANCE_DELTA:
                            driver_notifications.append(("driver_critical", drv_sid))
                            cr["driver_last_critical"][drv_sid] = drv_dist    
                    else:
                        if prev_for_driver is not None:
                            driver_notifications.append(("alert_end", drv_sid))
                            cr["driver_last_critical"].pop(drv_sid, None)
            
        if send_ped_alert_end:
            payload_end = {"crosswalk_id": crosswalk_id, "ts": int(now)}
            await emit_to_sids(ped_sids, "alert_end", payload_end)
            await emit_presence(crosswalk_id)
            return
        # All network operations outside the lock
        if distances:
            if min_dist <= PED_CRITICAL_DISTANCE:
                if prev_ped_critical is None or abs(prev_ped_critical - min_dist) >= DEBOUNCE_MIN_DISTANCE_DELTA:
                    async with lock:
                        cr["last_broadcast"]["ped_critical_min_distance"] = min_dist
                    payload = {"crosswalk_id": crosswalk_id, "min_distance": min_dist, "ts": int(now)}
                    await emit_to_sids(ped_sids, "ped_critical", payload)
                    
            if ped_count == 0 or min_dist > PED_CRITICAL_DISTANCE:
                if prev_ped_critical is not None:
                    payload_end = {"crosswalk_id": crosswalk_id, "ts": int(now)}
                    await emit_to_sids(ped_sids, "alert_end", payload_end)
                    async with lock:
                        cr["last_broadcast"].pop("ped_critical_min_distance", None)
            
            # Send driver notifications
            for event_type, drv_sid in driver_notifications:
                payload = {"crosswalk_id": crosswalk_id, "ts": int(now)}
                await emit_to_sids([drv_sid], event_type, payload)
                        
            await emit_presence(crosswalk_id)
        
    finally:
        async with _running_tasks_lock:
            RUNNING_TASKS.discard(crosswalk_id)