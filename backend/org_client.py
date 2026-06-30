"""
org_client.py
football-data.org client.
Fixed: stage labels humanized, flag emojis, draw detection.
Hero data: live, today finished, yesterday, two_days_ago, upcoming.
"""

import os
import requests
from dotenv import load_dotenv
import cache

load_dotenv()

API_KEY  = os.getenv("ORG_API_KEY")
BASE_URL = "https://api.football-data.org/v4"
HEADERS  = {"X-Auth-Token": API_KEY}
WC_CODE  = "WC"

# ─── STAGE LABELS ────────────────────────────────────────────
STAGE_LABELS = {
    "GROUP_STAGE":    "Group Stage",
    "LAST_32":        "Round of 32",
    "LAST_16":        "Round of 16",
    "QUARTER_FINALS": "Quarter Final",
    "SEMI_FINALS":    "Semi Final",
    "FINAL":          "Final",
    "3RD_PLACE":      "3rd Place",
}

# ─── TEAM FLAGS (ISO 3166-1 alpha-2 for flagcdn.com) ─────────
TEAM_FLAGS = {
    "Albania":              "al",
    "Algeria":              "dz",
    "Bosnia-Herzegovina":   "ba",
    "Bosnia and Herzegovina": "ba",
    "Argentina":            "ar",
    "Australia":            "au",
    "Austria":              "at",
    "Belgium":              "be",
    "Bolivia":              "bo",
    "Brazil":               "br",
    "Cameroon":             "cm",
    "Canada":               "ca",
    "Chile":                "cl",
    "Colombia":             "co",
    "Costa Rica":           "cr",
    "Croatia":              "hr",
    "Curacao":              "cw",
    "Curaçao":              "cw",
    "Cape Verde Islands":   "cv",
    "Cape Verde":           "cv",
    "Czech Republic":       "cz",
    "Czechia":              "cz",
    "Denmark":              "dk",
    "Ecuador":              "ec",
    "Egypt":                "eg",
    "England":              "gb-eng",
    "France":               "fr",
    "Georgia":              "ge",
    "Germany":              "de",
    "Ghana":                "gh",
    "Greece":               "gr",
    "Honduras":             "hn",
    "Hungary":              "hu",
    "Iran":                 "ir",
    "Iraq":                 "iq",
    "Jamaica":              "jm",
    "Japan":                "jp",
    "Jordan":               "jo",
    "Korea Republic":       "kr",
    "Mexico":               "mx",
    "Morocco":              "ma",
    "Netherlands":          "nl",
    "New Zealand":          "nz",
    "Nigeria":              "ng",
    "Norway":               "no",
    "Panama":               "pa",
    "Paraguay":             "py",
    "Peru":                 "pe",
    "Poland":               "pl",
    "Portugal":             "pt",
    "Qatar":                "qa",
    "Romania":              "ro",
    "Saudi Arabia":         "sa",
    "Scotland":             "gb-sct",
    "Senegal":              "sn",
    "Serbia":               "rs",
    "Slovakia":             "sk",
    "Slovenia":             "si",
    "South Africa":         "za",
    "South Korea":          "kr",
    "Spain":                "es",
    "Switzerland":          "ch",
    "Tunisia":              "tn",
    "Turkey":               "tr",
    "Türkiye":              "tr",
    "Ukraine":              "ua",
    "United States":        "us",
    "USA":                  "us",
    "Uruguay":              "uy",
    "Venezuela":            "ve",
    "Wales":                "gb-wls",
    "Congo DR":             "cd",
    "DR Congo":             "cd",
    "Haiti":                "ht",
    "Uzbekistan":           "uz",
    "El Salvador":          "sv",
    "Guatemala":            "gt",
    "Trinidad and Tobago":  "tt",
    "Ivory Coast":          "ci",
    "Côte d'Ivoire":        "ci",
    "North Korea":          "kp",
    "Sweden":               "se",
    "Finland":              "fi",
    "Iceland":              "is",
    "Ireland":              "ie",
    "Northern Ireland":     "gb-nir",
    "Cyprus":               "cy",
    "Bulgaria":             "bg",
    "Israel":               "il",
    "Montenegro":           "me",
    "North Macedonia":      "mk",
    "Kosovo":               "xk",
    "Belarus":              "by",
    "Lithuania":            "lt",
    "Latvia":               "lv",
    "Estonia":              "ee",
    "Kazakhstan":           "kz",
    "Azerbaijan":           "az",
    "Armenia":              "am",
    "Kyrgyzstan":           "kg",
    "Tajikistan":           "tj",
    "Oman":                 "om",
    "Kuwait":               "kw",
    "UAE":                  "ae",
    "United Arab Emirates": "ae",
    "Syria":                "sy",
    "Lebanon":              "lb",
    "China":                "cn",
    "Indonesia":            "id",
    "Thailand":             "th",
    "Vietnam":              "vn",
    "Malaysia":             "my",
    "Philippines":          "ph",
    "Cuba":                 "cu",
    "Dominican Republic":   "do",
    "Suriname":             "sr",
    "Guyana":               "gy",
    "Nicaragua":            "ni",
    "Belize":               "bz",
}

def _flag(team_name: str) -> str:
    cc = TEAM_FLAGS.get(team_name)
    if not cc:
        return '<div class="flag-placeholder"></div>'
    return f'<img class="r-flag" src="https://flagcdn.com/w40/{cc}.png" alt="{team_name}">'

def _get(endpoint: str, params: dict = {}) -> dict:
    res = requests.get(f"{BASE_URL}{endpoint}", headers=HEADERS, params=params, timeout=10)
    res.raise_for_status()
    return res.json()

def _fmt_match(m: dict, include_goals: bool = True) -> dict:
    """Normalize a match object from org API.

    include_goals=False skips the goals lookup entirely (both the API tier 1
    field and the wiki_goals tier 2 fallback). Use this for callers that list
    many matches at once but never display goal detail — e.g. get_calendar(),
    which only renders date/score dots and would otherwise trigger a
    wiki_goals Wikipedia lookup per FINISHED match for the WHOLE tournament
    in a single request. That cost is pure waste for that view and was
    likely the cause of /calendar timing out / 500ing as more matches
    finished over the course of the tournament."""
    home = m["homeTeam"]["name"]
    away = m["awayTeam"]["name"]

    score_h = m["score"]["fullTime"]["home"]
    score_a = m["score"]["fullTime"]["away"]

    is_draw = False
    winner  = None
    loser   = None

    if score_h is not None and score_a is not None:
        if score_h > score_a:
            winner, loser = home, away
        elif score_a > score_h:
            winner, loser = away, home
        else:
            is_draw = True
            winner  = "Draw"
            loser   = "Draw"

    raw_stage = m.get("stage", "")
    stage_label = STAGE_LABELS.get(raw_stage, raw_stage)
    raw_group = m.get("group") or ""
    if raw_group and stage_label == "Group Stage":
        group_label = raw_group.replace("GROUP_", "Group ").replace("_", " ").title()
        stage_label = f"Group Stage \u00b7 {group_label}"

    # Coach names — present in v4 API under homeTeam.coach / awayTeam.coach
    # Gracefully absent on free tier or older fixtures — never crashes
    home_coach = (m.get("homeTeam") or {}).get("coach", {}) or {}
    away_coach = (m.get("awayTeam") or {}).get("coach", {}) or {}
    home_coach_name = home_coach.get("name") or ""
    away_coach_name = away_coach.get("name") or ""

    # Goal events — present in v4 API under top-level "goals" for finished
    # matches (each: minute, team.name, scorer.name, assist.name, type).
    # This is structured ground truth straight from the data provider —
    # far more reliable than scraping Wikipedia for "what happened", and
    # it's what lets the LLM know the real scorers/minutes even when no
    # Wikipedia match report exists yet (very common right after a match
    # just finished). Never crashes — falls back to an empty list.
    #
    # Skipped entirely when include_goals=False (see _fmt_match docstring) —
    # callers that need this (analysis) request it explicitly; bulk listing
    # views (the calendar) don't pay the per-match Wikipedia cost for data
    # they never display.
    goals = []
    if include_goals:
        for g in m.get("goals") or []:
            try:
                scorer_name = (g.get("scorer") or {}).get("name") or "Unknown"
                assist_obj  = g.get("assist") or {}
                assist_name = assist_obj.get("name") or ""
                team_name   = (g.get("team") or {}).get("name") or ""
                goals.append({
                    "minute":  g.get("minute"),
                    "team":    team_name,
                    "scorer":  scorer_name,
                    "assist":  assist_name,
                    "type":    g.get("type") or "",  # e.g. REGULAR, PENALTY, OWN
                })
            except Exception:
                continue
        # Keep goals in chronological order regardless of API ordering
        goals.sort(key=lambda g: (g["minute"] if isinstance(g["minute"], int) else 9999))

        # Tier 2 fallback — football-data.org's free tier currently returns
        # goals: null for this competition, so tier 1 above is always empty in
        # practice. api-football was evaluated and rejected (free plan blocks
        # any date outside a rolling ~3-day window, confirmed via direct API
        # error — not viable since this app needs goals hours/days after a
        # match ends). Using wiki_goals instead: parses Wikipedia's structured
        # footballbox infobox table (real <td> column boundaries for home vs
        # away scorers), not docling's flattened markdown.
        if not goals and m.get("status") == "FINISHED":
            try:
                import wiki_goals
                goals = wiki_goals.get_goals(
                    home, away, m["utcDate"][:10],
                    stage=raw_stage, group=raw_group
                )
            except Exception:
                pass

    return {
        "id":             m["id"],
        "home":           home,
        "away":           away,
        "home_flag":      _flag(home),
        "away_flag":      _flag(away),
        "score_home":     score_h,
        "score_away":     score_a,
        "status":         m["status"],
        "minute":         m.get("minute"),
        "date":           m["utcDate"][:10],
        "time":           m["utcDate"][11:16],
        "stage":          stage_label,
        "raw_stage":      raw_stage,
        "group":          raw_group,
        "winner":         winner,
        "loser":          loser,
        "is_draw":        is_draw,
        "home_coach":     home_coach_name,
        "away_coach":     away_coach_name,
        "goals":          goals,
    }


def get_live() -> list:
    cached = cache.get("live")
    if cached is not None:
        return cached
    data = _get(f"/competitions/{WC_CODE}/matches", {"status": "LIVE"})
    matches = [_fmt_match(m) for m in data.get("matches", [])]
    cache.set("live", matches)
    return matches


def get_today() -> list:
    cached = cache.get("today")
    if cached is not None:
        return cached
    from datetime import date
    today = str(date.today())
    data = _get(f"/competitions/{WC_CODE}/matches", {
        "dateFrom": today,
        "dateTo":   today,
    })
    finished = [
        _fmt_match(m) for m in data.get("matches", [])
        if m["status"] in ("FINISHED", "IN_PLAY", "PAUSED", "HALFTIME")
    ]
    cache.set("today", finished)
    return finished


def get_yesterday() -> list:
    cached = cache.get("yesterday")
    if cached is not None:
        return cached
    from datetime import date, timedelta
    yesterday = str(date.today() - timedelta(days=1))
    data = _get(f"/competitions/{WC_CODE}/matches", {
        "dateFrom": yesterday,
        "dateTo":   yesterday,
        "status":   "FINISHED"
    })
    matches = [_fmt_match(m) for m in data.get("matches", [])]
    cache.set("yesterday", matches)
    return matches


def get_two_days_ago() -> list:
    cached = cache.get("two_days_ago")
    if cached is not None:
        return cached
    from datetime import date, timedelta
    two_days_ago = str(date.today() - timedelta(days=2))
    data = _get(f"/competitions/{WC_CODE}/matches", {
        "dateFrom": two_days_ago,
        "dateTo":   two_days_ago,
        "status":   "FINISHED"
    })
    matches = [_fmt_match(m) for m in data.get("matches", [])]
    cache.set("two_days_ago", matches)
    return matches


def get_upcoming() -> list:
    cached = cache.get("upcoming")
    if cached is not None:
        return cached
    from datetime import date, timedelta
    today  = str(date.today())
    future = str(date.today() + timedelta(days=14))
    data = _get(f"/competitions/{WC_CODE}/matches", {
        "dateFrom": today,
        "dateTo":   future,
        "status":   "SCHEDULED,TIMED"
    })
    matches = []
    for m in data.get("matches", []):
        if not m["homeTeam"].get("name") or not m["awayTeam"].get("name"):
            continue
        fmt = _fmt_match(m)
        matches.append(fmt)
    cache.set("upcoming", matches)
    return matches


def get_hero_data() -> dict:
    return {
        "live":         get_live(),
        "today":        get_today(),
        "yesterday":    get_yesterday(),
        "two_days_ago": get_two_days_ago(),
        "upcoming":     get_upcoming(),
    }


def get_coaches(home: str, away: str) -> dict:
    """
    Fetch coach names for two teams from /competitions/WC/teams (free tier endpoint).
    Returns {"home_coach": "...", "away_coach": "..."} — empty strings on any failure.
    Cached under key "coaches" for 24 hrs (TTL handled by cache layer).
    """
    cached = cache.get("coaches")
    if cached is None:
        try:
            data = _get(f"/competitions/{WC_CODE}/teams")
            coaches = {}
            for team in data.get("teams", []):
                name  = team.get("name", "")
                coach = (team.get("coach") or {}).get("name") or ""
                if name:
                    coaches[name] = coach
            cache.set("coaches", coaches, ttl=86400)  # 24 hrs
        except Exception:
            coaches = {}
    else:
        coaches = cached

    return {
        "home_coach": coaches.get(home, ""),
        "away_coach": coaches.get(away, ""),
    }


def get_calendar() -> list:
    cached = cache.get("calendar")
    if cached is not None:
        return cached
    data = _get(f"/competitions/{WC_CODE}/matches")
    # include_goals=False: this lists the WHOLE tournament in one request —
    # paying a wiki_goals Wikipedia lookup per FINISHED match here (data the
    # calendar grid never displays, it only needs date/score for the dots)
    # made this endpoint progressively slower/more failure-prone as more
    # matches finished over the tournament.
    matches = [_fmt_match(m, include_goals=False) for m in data.get("matches", [])]
    cache.set("calendar", matches)
    return matches