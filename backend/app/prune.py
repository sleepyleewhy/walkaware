import asyncio
from app.state import (
    PRUNE_LOOP_INTERVAL,
    get_client,
)
from app.notifications import handle_distance_based_notifications


async def prune_loop():
    while True:
        db = await get_client()
        try:
            docs = await db.collection("crosswalks").get()
            for doc in docs:
                crosswalk_id = int(doc.id)
                cw_data = doc.to_dict() if doc.exists else None
                await handle_distance_based_notifications(crosswalk_id, cw_data)
        except Exception:
            pass
        await asyncio.sleep(PRUNE_LOOP_INTERVAL)


def register_prune(app):
    asyncio.create_task(prune_loop())