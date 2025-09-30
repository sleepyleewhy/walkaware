import asyncio
from app.state import CROSSWALKS, PRUNE_LOOP_INTERVAL
from app.notifications import handle_distance_based_notifications


async def prune_loop():
    while True:
        for crosswalk_id in list(CROSSWALKS.keys()):
            crosswalk = CROSSWALKS[crosswalk_id]
            if not crosswalk.get("peds") and not crosswalk.get("drivers"):
                del CROSSWALKS[crosswalk_id]
                continue
            
            await handle_distance_based_notifications(crosswalk_id)
        await asyncio.sleep(PRUNE_LOOP_INTERVAL)

def register_prune(app):
    import asyncio
    asyncio.create_task(prune_loop())