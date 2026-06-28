"""
docling_client.py
Fetches Wikipedia match article with 3-query fallback search.
Extracts only match-relevant content for Groq context.
"""

import time
import requests
from docling.document_converter import DocumentConverter
import cache

WIKI_SEARCH_URL = "https://en.wikipedia.org/w/api.php"
WIKI_HEADERS    = {"User-Agent": "ROOSTER/1.0 (football match analysis; hackathon)"}

_converter = DocumentConverter()

RELEVANT_KW = [
    "goal", "score", "minute", "card", "penalty", "assist",
    "substitute", "half", "keeper", "shot", "foul", "header",
    "striker", "defender", "midfielder", "goalkeeper", "scored",
    "booked", "sent off", "equaliz", "opener", "winner"
]


def _search_wikipedia(home: str, away: str, date: str) -> str | None:
    """
    Try 3 progressively broader queries.
    Returns best matching article URL or None.
    """
    year  = date[:4]
    month = date[5:7]

    queries = [
        # Most specific — exact match article
        f"{home} v {away} {year} FIFA World Cup",
        # Try reversed team order
        f"{away} v {home} {year} FIFA World Cup",
        # Broader — group stage article
        f"{home} {away} 2026 FIFA World Cup group",
    ]

    for query in queries:
        params = {
            "action":   "query",
            "list":     "search",
            "srsearch": query,
            "format":   "json",
            "srlimit":  5,
        }
        try:
            res     = requests.get(WIKI_SEARCH_URL, params=params, headers=WIKI_HEADERS, timeout=8)
            results = res.json().get("query", {}).get("search", [])

            for r in results:
                title = r["title"]
                # Must mention both teams or be a clear match article
                home_match = home.split()[0].lower() in title.lower()
                away_match = away.split()[0].lower() in title.lower()
                wc_match   = any(w in title for w in ["FIFA", "World Cup", "2026"])

                if (home_match and away_match) or (wc_match and (home_match or away_match)):
                    slug = title.replace(" ", "_")
                    return f"https://en.wikipedia.org/wiki/{slug}"

        except Exception:
            continue

    return None


def _extract_relevant(full_text: str) -> str:
    """Keep only match-relevant paragraphs. Cap at 3000 chars."""
    paragraphs = [p.strip() for p in full_text.split("\n") if len(p.strip()) > 40]
    kept = [p for p in paragraphs if any(kw in p.lower() for kw in RELEVANT_KW)]
    result = "\n".join(kept)
    return result[:3000] if len(result) > 3000 else result


def get_match_context(match_id: int, home: str, away: str, date: str) -> str:
    """
    Returns clean Wikipedia match context. Cached 3hrs per match.
    Falls back to structured minimal context if not found.
    """
    cache_key = f"wiki_{match_id}"
    cached    = cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        url = _search_wikipedia(home, away, date)
        if not url:
            raise ValueError("No Wikipedia article found after 3 queries")

        result   = _converter.convert(url)
        raw_text = result.document.export_to_markdown()
        context  = _extract_relevant(raw_text)

        if len(context) < 100:
            raise ValueError("Article found but no useful match content extracted")

        cache.set(cache_key, context)
        return context

    except Exception as e:
        # Structured fallback — enough for ESPN-style reasoning
        fallback = (
            f"FIFA World Cup {date[:4]} match: {home} vs {away}.\n"
            f"Note: Detailed match report unavailable. Use the scoreline and team context to reason accurately."
        )
        # Short cache — 30 min, retry later
        cache._cache[cache_key] = {
            "data":       fallback,
            "fetched_at": time.time() - (cache.TTL.get("wiki", 10800) - 1800)
        }
        return fallback
