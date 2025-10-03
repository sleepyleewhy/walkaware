import asyncio
from app.state import (
    PRUNE_LOOP_INTERVAL,
    get_client,
    list_crosswalk_ids,
    get_crosswalk,
)
from app.notifications import handle_distance_based_notifications


async def prune_loop():
    """
    Periodically:
      - Enumerate crosswalk documents
      - Run distance / TTL logic so stale drivers are pruned even if no new updates arrive
      - Optionally delete empty crosswalk docs (left as a TODO / comment)
    """
    while True:
        db = await get_client()
        try:
            ids = await list_crosswalk_ids(db)
            for crosswalk_id in ids:
                cw = await get_crosswalk(db, crosswalk_id)
                if not cw:
                    continue
                if not cw.get("peds") and not cw.get("drivers"):
                    # Optional: delete empty docs to keep collection small
                    # await crosswalk_ref(db, crosswalk_id).delete()
                    continue
                await handle_distance_based_notifications(crosswalk_id)
        except Exception:
            # Swallow errors to keep loop alive; could log here
            pass
        await asyncio.sleep(PRUNE_LOOP_INTERVAL)


def register_prune(app):
    asyncio.create_task(prune_loop())