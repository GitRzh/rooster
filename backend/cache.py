import time
import threading

_cache = {}
_lock  = threading.Lock()

TTL = {
    "live":         60,
    "today":        900,
    "yesterday":    21600,
    "two_days_ago": 21600,
    "upcoming":     3600,
    "wiki":         10800,
    "analysis":     21600,   # 6hrs — analysis of a finished match won't change
    "names":        21600,   # 6hrs — same text = same names
    "calendar":     86400,
}

def _ttl_for(key: str) -> int:
    for prefix, ttl in TTL.items():
        if key.startswith(prefix):
            return ttl
    return 3600

def get(key: str):
    with _lock:
        entry = _cache.get(key)
        if not entry:
            return None
        if time.time() - entry["fetched_at"] > _ttl_for(key):
            return None
        return entry["data"]

def set(key: str, data):
    with _lock:
        _cache[key] = {"data": data, "fetched_at": time.time()}

def age(key: str) -> float:
    with _lock:
        entry = _cache.get(key)
        return -1 if not entry else time.time() - entry["fetched_at"]

def info() -> dict:
    with _lock:
        now = time.time()
        return {
            k: {
                "age_seconds": round(now - v["fetched_at"]),
                "ttl":         _ttl_for(k),
                "fresh":       (now - v["fetched_at"]) < _ttl_for(k)
            }
            for k, v in _cache.items()
        }