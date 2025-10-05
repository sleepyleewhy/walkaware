import time
from typing import List, Dict, Any
from sockets import sio_server
from app.state import (
    get_client,
    get_crosswalk,
    crosswalk_ref,
    set_last_broadcast_value,
    clear_last_broadcast_key,
    remove_driver,
    remove_running_task,
    DRIVER_PRESENCE_TTL,
    PED_CRITICAL_DISTANCE,
    DRIVER_CRITICAL_DISTANCE,
    DEBOUNCE_MIN_DISTANCE_DELTA,
)

async def emit_to_sids(sids: List[str], event: str, payload: dict):
    for sid in sids:
        try:
            await sio_server.emit(event, payload, to=sid)
        except Exception:
            pass


async def emit_presence(crosswalk_id: int, peds: List[str], drivers: List[str]):
    payload = {
        "crosswalk_id": crosswalk_id,
        "ped_count": len(peds),
        "driver_count": len(drivers),
        "ts": int(time.time())
    }
    await emit_to_sids(peds, "presence", payload)
    await emit_to_sids(drivers, "presence", payload)


async def handle_distance_based_notifications(crosswalk_id: int, cw: Dict[str, Any] = None):
    """
    Reads crosswalk document, applies TTL pruning + critical distance logic,
    updates last_broadcast fields, and emits events.
    Persists driver critical state in last_broadcast.driver_critical_active (map sid -> last distance).
    """
    db = await get_client()
    if cw is None:
        cw = await get_crosswalk(db, crosswalk_id)
    if not cw:
        await remove_running_task(db, crosswalk_id)
        return
    try:
        cw = await get_crosswalk(db, crosswalk_id)
        if not cw:
            await remove_running_task(db, crosswalk_id)
            return

        now = time.time()
        peds: List[str] = cw.get("peds", [])
        drivers_map: Dict[str, Dict[str, Any]] = cw.get("drivers", {}) or {}
        last_broadcast: Dict[str, Any] = cw.get("last_broadcast", {}) or {}

        # Track driver critical state map
        driver_active_map: Dict[str, float] = last_broadcast.get("driver_critical_active", {}) or {}

        # Expire drivers by timestamp
        cutoff = now - DRIVER_PRESENCE_TTL
        expired = [sid for sid, info in drivers_map.items() if info.get("ts", 0) < cutoff]
        for sid in expired:
            drivers_map.pop(sid, None)
            driver_active_map.pop(sid, None)

        distances = [
            info.get("distance")
            for info in drivers_map.values()
            if info.get("distance") is not None
        ]
        distances = [d for d in distances if d is not None]

        ped_count = len(peds)
        prev_ped_critical = last_broadcast.get("ped_critical_min_distance")

        ped_alert_end_to_emit = False
        ped_alert_payload = None
        ped_alert_end_payload = None

        driver_events = []  # list[(event_type, sid)]

        # Driver critical logic using driver_active_map
        if distances:
            min_dist = min(distances)
        else:
            min_dist = None

        # Ped critical handling
        if not distances or min_dist is None:
            # No active drivers => end alert if was active
            if prev_ped_critical is not None:
                ped_alert_end_to_emit = True
                last_broadcast.pop("ped_critical_min_distance", None)
        else:
            if min_dist <= PED_CRITICAL_DISTANCE and ped_count > 0:
                # Emit only if new or debounce threshold exceeded
                if (
                    prev_ped_critical is None
                    or abs(prev_ped_critical - min_dist) >= DEBOUNCE_MIN_DISTANCE_DELTA
                ):
                    last_broadcast["ped_critical_min_distance"] = min_dist
                    ped_alert_payload = {
                        "crosswalk_id": crosswalk_id,
                        "min_distance": min_dist,
                        "ts": int(now),
                    }
            else:
                if prev_ped_critical is not None:
                    ped_alert_end_to_emit = True
                    last_broadcast.pop("ped_critical_min_distance", None)

        # Driver per-sid critical / end logic
        for sid, info in list(drivers_map.items()):
            d = info.get("distance")
            if d is None:
                continue
            prev_for_sid = driver_active_map.get(sid)
            active_condition = (
                d <= DRIVER_CRITICAL_DISTANCE and ped_count > 0
            )
            if active_condition:
                # Debounce on distance
                if (
                    prev_for_sid is None
                    or abs(prev_for_sid - d) >= DEBOUNCE_MIN_DISTANCE_DELTA
                ):
                    driver_events.append(("driver_critical", sid))
                    driver_active_map[sid] = d
            else:
                if prev_for_sid is not None:
                    driver_events.append(("alert_end", sid))
                    driver_active_map.pop(sid, None)

        # Persist updated maps (single update write)
        last_broadcast["driver_critical_active"] = driver_active_map
        await crosswalk_ref(db, crosswalk_id).update(
            {
                "drivers": drivers_map,
                "last_broadcast": last_broadcast,
            }
        )

        # Emit events (network IO after persistence)
        if ped_alert_payload:
            await emit_to_sids(peds, "ped_critical", ped_alert_payload)

        if ped_alert_end_to_emit:
            ped_alert_end_payload = {
                "crosswalk_id": crosswalk_id,
                "ts": int(now),
            }
            await emit_to_sids(peds, "alert_end", ped_alert_end_payload)

        for evt, sid in driver_events:
            payload = {"crosswalk_id": crosswalk_id, "ts": int(now)}
            await emit_to_sids([sid], evt, payload)

        # Presence always after other notifications
        await emit_presence(crosswalk_id, peds, list(drivers_map.keys()))

    except Exception:
        pass
    finally:
        # Attempt to clear running task marker; ignore errors
        try:
            await remove_running_task(await get_client(), crosswalk_id)
        except Exception:
            pass