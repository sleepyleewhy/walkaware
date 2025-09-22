
from typing import Any, Set
from pyparsing import Dict


PED_CRITICAL_DISTANCE = 100.0
DRIVER_CRITICAL_DISTANCE = 50.0
DEBOUNCE_MIN_DISTANCE_DELTA = 3.0
DRIVER_PRESENCE_TTL = 3.0
PED_PRESENCE_TTL = 15.0
PRUNE_LOOP_INTERVAL = 1.0


CROSSWALKS: Dict[int, Dict[str, Any]] = {}
SUBSCRIPTIONS: Dict[str, Set[int]] = {}
ROLE: Dict[str, str] = {}
