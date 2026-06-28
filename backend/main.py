import warnings
warnings.filterwarnings("ignore", category=UserWarning)

"""
main.py
ROOSTER FastAPI backend.
Endpoints:
  GET  /hero          → live + today + yesterday + two_days_ago + upcoming (parallel)
  GET  /yesterday     → yesterday's finished matches
  GET  /search?q=...  → search across all cached matches by team name
  POST /analyze       → AI match analysis via Docling + Groq
  GET  /cache/info    → debug cache state
  GET  /health        → health check
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from org_client import get_live, get_today, get_upcoming, get_yesterday, get_two_days_ago
from analyzer import analyze
from groq_client import extract_names
import asyncio
import cache

app = FastAPI(title="ROOSTER API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    fixture_id: int
    home:       str
    away:       str
    date:       str
    score_home: int | None = None
    score_away: int | None = None
    winner:     str | None = None
    loser:      str | None = None
    is_draw:    bool       = False
    stage:      str        = ""
    question_type: str
    custom_question: str | None = None
    language:      str = "English"

class ExtractNamesRequest(BaseModel):
    text: str


# ─── HERO PAGE ────────────────────────────────────────────────
@app.get("/hero")
async def hero():
    """Sequential fetch — football-data.org free tier rate-limits parallel requests."""
    try:
        loop = asyncio.get_event_loop()
        # Run sequentially in executor to avoid rate limiting
        def fetch_all():
            import time
            live         = get_live();         time.sleep(0.7)
            today        = get_today();        time.sleep(0.7)
            upcoming     = get_upcoming();     time.sleep(0.7)
            yesterday    = get_yesterday();    time.sleep(0.7)
            two_days_ago = get_two_days_ago()
            return {
                "live":         live,
                "today":        today,
                "upcoming":     upcoming,
                "yesterday":    yesterday,
                "two_days_ago": two_days_ago,
            }
        result = await loop.run_in_executor(None, fetch_all)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── YESTERDAY ───────────────────────────────────────────────
@app.get("/yesterday")
def yesterday():
    try:
        return {"matches": get_yesterday()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── SEARCH ──────────────────────────────────────────────────
@app.get("/search")
def search(q: str = Query("", min_length=1)):
    """Search across all cached matches by team name. Returns top 10."""
    q_lower = q.strip().lower()
    if not q_lower:
        return {"matches": []}

    # Gather all matches from cache buckets
    all_matches = []
    for bucket in ("live", "today", "yesterday", "two_days_ago", "upcoming"):
        cached = cache.get(bucket)
        if cached:
            for m in cached:
                m_copy = dict(m)
                m_copy["_bucket"] = bucket
                all_matches.append(m_copy)

    results = []
    seen_ids = set()
    for m in all_matches:
        if m["id"] in seen_ids:
            continue
        if q_lower in m["home"].lower() or q_lower in m["away"].lower():
            seen_ids.add(m["id"])
            results.append(m)

    # Sort: live first, then today, yesterday, two_days_ago, upcoming
    bucket_order = {"live": 0, "today": 1, "yesterday": 2, "two_days_ago": 3, "upcoming": 4}
    results.sort(key=lambda m: bucket_order.get(m.get("_bucket", "upcoming"), 5))

    return {"matches": results[:10]}


# ─── ANALYSIS ─────────────────────────────────────────────────
@app.post("/analyze")
def analyze_match(req: AnalyzeRequest):
    try:
        # Cache key: custom questions are NOT cached (unique per user)
        # Standard questions cached per fixture+type+language for 6hrs
        cache_key = None
        if req.question_type != "custom":
            cache_key = f"analysis:{req.fixture_id}:{req.question_type}:{req.language}"
            cached = cache.get(cache_key)
            if cached is not None:
                return cached

        match = {
            "id":         req.fixture_id,
            "home":       req.home,
            "away":       req.away,
            "date":       req.date,
            "score_home": req.score_home,
            "score_away": req.score_away,
            "winner":     req.winner,
            "loser":      req.loser,
            "is_draw":    req.is_draw,
            "stage":      req.stage,
        }
        result = analyze(match, req.question_type, req.language, req.custom_question)

        if cache_key and not result.get("too_soon") and not result.get("error"):
            cache.set(cache_key, result)

        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── EXTRACT NAMES ────────────────────────────────────────────
@app.post("/extract-names")
def extract_names_endpoint(req: ExtractNamesRequest):
    """Extract footballer/manager names from text via lightweight Groq call.
    Cached per text hash so repeated result pages don't re-call Groq."""
    try:
        import hashlib
        text_hash = hashlib.md5(req.text.encode()).hexdigest()[:16]
        cache_key = f"names:{text_hash}"
        cached = cache.get(cache_key)
        if cached is not None:
            return {"names": cached}

        names = extract_names(req.text)
        cache.set(cache_key, names)
        return {"names": names}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── DEBUG ───────────────────────────────────────────────────
@app.get("/cache/info")
def cache_info():
    return cache.info()

@app.post("/cache/clear")
def cache_clear(bucket: str | None = None):
    """Clear all cache or a specific bucket (live, today, upcoming, yesterday, two_days_ago)."""
    with cache._lock:
        if bucket:
            keys = [k for k in cache._cache if k.startswith(bucket)]
            for k in keys:
                del cache._cache[k]
            return {"cleared": keys}
        cache._cache.clear()
    return {"cleared": "all"}

@app.get("/health")
def health():
    return {"status": "*bok bok*"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)