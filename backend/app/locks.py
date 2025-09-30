import asyncio

# All locks in one place to avoid circular imports
_crosswalk_locks = {}
_locks_lock = asyncio.Lock()
_running_tasks_lock = asyncio.Lock()
_role_lock = asyncio.Lock()
async def get_crosswalk_lock(crosswalk_id: int) -> asyncio.Lock:
    """Get or create a lock for a specific crosswalk"""
    async with _locks_lock:
        if crosswalk_id not in _crosswalk_locks:
            _crosswalk_locks[crosswalk_id] = asyncio.Lock()
        return _crosswalk_locks[crosswalk_id]