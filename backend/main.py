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
from groq_client import extract_names, extract_entity_info
import asyncio
import logging
import threading
import cache
from org_client import get_live, get_today, get_upcoming, get_yesterday, get_two_days_ago, get_calendar

app = FastAPI(title="ROOSTER API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Per-key in-flight locks ───────────────────────────────────
# Guards against multiple concurrent requests (different tabs, page reloads,
# or a stray frontend double-fire) for the SAME match each independently
# kicking off their own 5-call Groq retry chain. The frontend's loadingInFlight
# guard only protects a single tab's in-memory state and resets on reload, so
# it can't prevent this case — this is the actual backend-side fix for that.
# Threading locks (not asyncio.Lock) because these endpoints are sync `def`
# functions, which FastAPI runs in a worker threadpool, not the event loop.
_inflight_locks = {}
_inflight_locks_guard = threading.Lock()

def _lock_for(key: str) -> threading.Lock:
    with _inflight_locks_guard:
        lock = _inflight_locks.get(key)
        if lock is None:
            lock = threading.Lock()
            _inflight_locks[key] = lock
        return lock


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
    # Optional pass-through of the raw data org_client._fmt_match() already
    # computes (raw_stage, group) and already fetches (goals — including
    # its own wiki_goals fallback for FINISHED matches). If the frontend
    # forwards these from the match object it already has (e.g. from
    # /hero), analyzer.py uses them directly instead of re-deriving
    # raw_stage by reverse-parsing the humanized `stage` string and
    # re-fetching goals from Wikipedia a second time.
    raw_stage:  str | None = None
    group:      str | None = None
    goals:      list[dict] | None = None
    question_type: str
    custom_question: str | None = None
    language:      str = "English"

class ExtractNamesRequest(BaseModel):
    text: str

class ExtractEntityRequest(BaseModel):
    name:    str
    extract: str

class PreviewRequest(BaseModel):
    home:     str
    away:     str
    date:     str = ""
    stage:    str = ""
    language: str = "English"


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
        # Cache key: standard questions cache per fixture+type+language for 6hrs.
        # Custom questions ALSO cache now, keyed by a hash of the question text —
        # analyzer.py already dedupes the underlying ENGLISH generation this way,
        # but without this outer cache, every repeat of the same custom question
        # (e.g. re-testing the same QA prompt, or two users asking the same thing)
        # was re-running the TRANSLATION step from scratch even when nothing about
        # the answer changed. This caches the full (possibly translated) response,
        # not just the English source — that's the step that was actually wasting
        # Groq tokens on repeats.
        import hashlib
        if req.question_type == "custom":
            qhash = hashlib.md5((req.custom_question or "").strip().lower().encode()).hexdigest()[:16]
            cache_key = f"analysis:{req.fixture_id}:custom:{qhash}:{req.language}"
        else:
            cache_key = f"analysis:{req.fixture_id}:{req.question_type}:{req.language}"
        cached = cache.get(cache_key)
        if cached is not None:
            cached_ok = (cached.get("answer") or "").strip() or cached.get("draw_blocked") or cached.get("too_soon")
            if cached_ok:
                return cached
            # Bad/empty cached entry from before this guard existed — drop it and regenerate.
            logging.warning(f"[ANALYZE STALE EMPTY CACHE] invalidating {cache_key}")
            with cache._lock:
                cache._cache.pop(cache_key, None)

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
            "raw_stage":  req.raw_stage,
            "group":      req.group,
            "goals":      req.goals or [],
        }
        result = analyze(match, req.question_type, req.language, req.custom_question)

        # An empty/missing answer is never a valid result to cache or return —
        # without this guard, a single bad generation (e.g. a transient Groq
        # failure) gets cached for 6hrs and silently served as "no analysis"
        # for that fixture+language for everyone until the TTL expires.
        if not (result.get("answer") or "").strip() and not result.get("draw_blocked") and not result.get("too_soon"):
            logging.error(f"[ANALYZE EMPTY ANSWER] fixture={req.fixture_id} type={req.question_type} lang={req.language}")
            raise HTTPException(status_code=502, detail="Analysis generation returned empty. Try again.")

        if cache_key and not result.get("too_soon") and not result.get("error"):
            cache.set(cache_key, result)

        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── PREVIEW (upcoming matches) ──────────────────────────────
@app.post("/preview")
def preview_match(req: PreviewRequest):
    """Generate a pre-match narrative briefing from team names only.
    No Docling, no match data — pure LLM from football knowledge.

    Split into two Groq calls (analysis block + players block) instead of one big JSON blob.
    This is far more reliable for non-English/non-Latin-script languages (Korean, Japanese,
    Chinese, Arabic) — those scripts use more tokens per character, so a single large response
    has more chances to truncate mid-object or drift out of valid JSON. Two smaller calls each
    have an easier job, and a failure in one doesn't take the other down with it. The merged
    output keeps the exact same shape the frontend already expects, so no frontend changes
    are needed."""
    try:
        import json
        from prompts import preview_match_analysis, preview_match_players, SYSTEM_PROMPT
        from groq_client import _call_preview, preview_token_budget

        def _parse(raw: str):
            cleaned = raw.strip()
            if "```" in cleaned:
                parts = cleaned.split("```")
                cleaned = parts[1] if len(parts) >= 2 else cleaned
                lines = cleaned.splitlines()
                if lines and lines[0].strip().lower() in ("json", ""):
                    cleaned = "\n".join(lines[1:])
                cleaned = cleaned.strip()
            try:
                return json.loads(cleaned)
            except Exception:
                start, end = raw.find("{"), raw.rfind("}")
                if start != -1 and end != -1 and end > start:
                    return json.loads(raw[start:end + 1])
                raise

        def _is_valid_analysis(r):
            th = r.get("team_home") or {}
            ta = r.get("team_away") or {}
            teams_ok    = bool(th.get("style") or th.get("danger")) and bool(ta.get("style") or ta.get("danger"))
            headline_ok = bool((r.get("headline") or "").strip())
            tactical_ok = bool((r.get("tactical_contrast") or "").strip())
            story_ok    = bool((r.get("unmissable_storyline") or "").strip())
            return teams_ok and headline_ok and tactical_ok and story_ok

        def _is_valid_players(r):
            players = r.get("players_to_watch") or []
            return len(players) >= 2 and all((p.get("name") or "").strip() for p in players)

        def _is_full_result_valid(r):
            return _is_valid_analysis(r) and _is_valid_players(r)

        cache_key_en = f"preview:{req.home}:{req.away}:English"
        cache_key    = f"preview:{req.home}:{req.away}:{req.language}"

        cached = cache.get(cache_key)
        if cached is not None:
            if _is_full_result_valid(cached):
                return cached
            logging.warning(f"[PREVIEW STALE CACHE] invalidating {cache_key}")
            with cache._lock:
                cache._cache.pop(cache_key, None)

        # Lock on the ENGLISH key — every language for this match shares the same
        # underlying English generation, so requests for different languages on
        # the same match also serialize on that shared step instead of each
        # independently hammering Groq.
        lock = _lock_for(cache_key_en)
        with lock:
            # Double-checked: someone else may have just populated our key while we waited.
            cached = cache.get(cache_key)
            if cached is not None and _is_full_result_valid(cached):
                return cached

            def _run(call_name: str, build_prompt_fn, is_valid_fn, max_attempts: int):
                """Run a single preview sub-call (ALWAYS in English) with its own retry
                loop. Returns the best candidate it got, even if it never passed
                validation — caller decides what to do with that."""
                prompt = build_prompt_fn(req.home, req.away, req.stage, req.date, "English")
                tokens = preview_token_budget(call_name, "English")
                best = None
                for attempt in range(1, max_attempts + 1):
                    raw = _call_preview(SYSTEM_PROMPT, prompt, tokens)
                    try:
                        candidate = _parse(raw)
                    except Exception:
                        logging.error(f"[PREVIEW {call_name.upper()} PARSE FAIL attempt {attempt}] raw={raw[:300]}")
                        continue
                    best = candidate
                    if is_valid_fn(candidate):
                        return candidate, True
                    logging.warning(
                        f"[PREVIEW {call_name.upper()} INCOMPLETE attempt {attempt}] "
                        f"{req.home} vs {req.away} (English) raw_tail={raw[-150:]!r}"
                    )
                return best, False

            english = cache.get(cache_key_en)
            if english is None or not _is_full_result_valid(english):
                analysis, analysis_ok = _run("analysis", preview_match_analysis, _is_valid_analysis, max_attempts=3)
                players,  players_ok  = _run("players",  preview_match_players,  _is_valid_players,  max_attempts=2)

                # Analysis is the core of the page — if it never came back usable, the whole preview fails.
                if analysis is None:
                    return {"error": True, "headline": "Preview generation failed. Try again."}

                english = dict(analysis)

                # Graceful degradation on players: use whatever named entries we got rather than
                # discarding the entire preview because the watch list came back short or empty.
                if players:
                    named = [p for p in (players.get("players_to_watch") or []) if (p.get("name") or "").strip()]
                    english["players_to_watch"] = named
                else:
                    english["players_to_watch"] = []

                if analysis_ok:
                    cache.set(cache_key_en, english)

            if english is None:
                return {"error": True, "headline": "Preview generation failed. Try again."}

            if req.language == "English":
                result = english
            else:
                from groq_client import translate_preview
                result = translate_preview(english, req.language)

            if _is_full_result_valid(result):
                cache.set(cache_key, result)
            return result

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


# ─── EXTRACT ENTITY ──────────────────────────────────────────
@app.post("/extract-entity")
def extract_entity_endpoint(req: ExtractEntityRequest):
    """Extract structured player/manager info from a Wikipedia extract via Groq 8b.
    Cached by name so repeated hovers on the same player skip the LLM call."""
    try:
        import hashlib
        cache_key = f"entity:{hashlib.md5(req.name.encode()).hexdigest()[:16]}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        info = extract_entity_info(req.name, req.extract)
        cache.set(cache_key, info)
        return info
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


@app.get("/calendar")
def calendar():
    try:
        return {"matches": get_calendar()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "*bok bok*"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)