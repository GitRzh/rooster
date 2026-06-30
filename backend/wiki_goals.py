"""
wiki_goals.py
Tier 2 of the goals waterfall (after org_client's football-data.org tier 1,
which is empty in practice — see org_client._fmt_match).

api-football was evaluated and rejected (free plan only allows querying a
rolling ~3-day window around "today" — no lookback to when this app actually
needs goals, hours/days after a match ends). See org_client.py for that note.

This module instead parses Wikipedia's own {{footballbox}} infobox template.
The template wraps each match in a <div class="footballbox">, containing a
<table class="fevent"> with the home team's scorers in one
<td class="fhgoal"> and the away team's in a separate <td class="fagoal">.
That's a hard structural boundary — unlike docling's markdown export, which
flattens everything to text and forces team-attribution to be guessed from
proximity (the exact flaw that broke the previous _extract_goals_from_markdown
attempt, confirmed in a prior session's handoff notes).

Uses Wikipedia's REST API page/html endpoint directly (not docling), so the
table structure survives intact.

Populates the same shape prompts.py already expects:
{minute, team, scorer, assist, type} — no downstream changes needed.
Assist is always "" here — the footballbox template doesn't carry assists,
only scorer + minute.

LOOKUP STRATEGY (fixed this session — see handoff notes for the bug this
replaces):

Group-stage World Cup matches do NOT get a standalone Wikipedia article —
the goal-by-goal footballbox for e.g. Algeria vs Austria lives inside the
GROUP OVERVIEW PAGE "2026 FIFA World Cup Group J", alongside the other 5
matches in that group, each as its own footballbox table. Verified live
against Group A, B, C, E, F, G, H, I and J — naming is consistently
"{year} FIFA World Cup Group {letter}".

The same turns out to be true for the round of 32: there's no standalone
article per knockout match either — they all live on one shared
"2026 FIFA World Cup round of 32" page, again as separate footballbox
tables. Verified live. Later knockout rounds (round of 16 onward) hadn't
been played yet at the time this was written, so those page-title guesses
(same naming pattern) are untested — kept as best-effort attempts, with the
old standalone-article search kept as a fallback in case a later round does
get its own page (the final, e.g., already has one: "2026 FIFA World Cup
final").

Because an overview page can hold several matches' footballbox tables, the
lookup can no longer just grab "the first footballbox on the page" (that
was the second latent bug from the previous session — on a multi-match page
it would silently return the WRONG match's goals). Instead it finds ALL
footballbox tables on the page and picks the one whose fhome/faway header
cells (Wikipedia's own Module:Football_box classes for the team-name cells)
match the home/away teams being requested.
"""

import re
from copy import deepcopy
import requests
from bs4 import BeautifulSoup
import cache

WIKI_SEARCH_URL = "https://en.wikipedia.org/w/api.php"
WIKI_REST_HTML  = "https://en.wikipedia.org/api/rest_v1/page/html/{title}"
WIKI_HEADERS    = {"User-Agent": "ROOSTER/1.0 (football match analysis; hackathon)"}

# e.g. "Riyad Mahrez 60'", "Riyad Mahrez 90+3'", "Sasa Kalajdzic 90+6'\u00a0(o.g.)"
# A scorer with multiple goals is often written as ONE line with multiple
# comma-separated minutes, e.g. "Riyad Mahrez 60', 90+3'" — GOAL_LINE_RE
# captures the whole minutes block, MINUTE_ENTRY_RE then pulls each
# individual minute (+ its own optional note, e.g. one goal of a brace
# could be the penalty/o.g. while the other isn't) out of that block.
GOAL_LINE_RE = re.compile(
    r"^(?P<scorer>.+?)\s+"
    r"(?P<minutes>\d+(?:\+\d+)?\s*'(?:\s*\([^)]+\))?"
    r"(?:\s*,\s*\d+(?:\+\d+)?\s*'(?:\s*\([^)]+\))?)*)\s*$"
)
MINUTE_ENTRY_RE = re.compile(
    r"(?P<minute>\d+(?:\+\d+)?)\s*'(?:\s*\((?P<note>[^)]+)\))?"
)

# Best-guess Wikipedia overview-page titles per football-data.org stage code.
# Group stage is handled separately (needs the group letter folded in).
# Only LAST_32 has been verified live as of writing — later rounds are kept
# as best-effort attempts using the same naming convention, with the
# standalone-article search as a fallback if a guess turns out wrong.
STAGE_PAGE_TITLES = {
    "LAST_32":        "{year} FIFA World Cup round of 32",
    "LAST_16":        "{year} FIFA World Cup round of 16",
    "QUARTER_FINALS": "{year} FIFA World Cup quarter-finals",
    "SEMI_FINALS":    "{year} FIFA World Cup semi-finals",
    "FINAL":          "{year} FIFA World Cup final",
    "3RD_PLACE":      "{year} FIFA World Cup third place play-off",
}


def _group_letter(raw_group: str) -> str | None:
    """'GROUP_J' -> 'J'. None if raw_group isn't a recognizable group code."""
    if not raw_group:
        return None
    letter = raw_group.replace("GROUP_", "").strip()
    return letter or None


def _candidate_overview_titles(date: str, stage: str | None, group: str | None) -> list[str]:
    """Ordered list of overview-page titles worth trying directly (no search
    needed — these are constructed straight from data we already have)."""
    year = date[:4]
    titles = []
    letter = _group_letter(group or "")
    if stage == "GROUP_STAGE" and letter:
        titles.append(f"{year} FIFA World Cup Group {letter}")
    if stage in STAGE_PAGE_TITLES:
        titles.append(STAGE_PAGE_TITLES[stage].format(year=year))
    return titles


def _search_match_article(home: str, away: str, date: str) -> str | None:
    """Fallback: find a standalone match article. Most World Cup matches
    DON'T have one (see module docstring) — this only succeeds for stages
    that do get individual articles (e.g. the final), or as a last resort
    if the overview-page guess above was wrong."""
    year = date[:4]
    queries = [
        f"{home} v {away} {year} FIFA World Cup",
        f"{away} v {home} {year} FIFA World Cup",
        f"{home} {away} {year} FIFA World Cup match report",
    ]
    for query in queries:
        params = {"action": "query", "list": "search", "srsearch": query, "format": "json", "srlimit": 5}
        try:
            res = requests.get(WIKI_SEARCH_URL, params=params, headers=WIKI_HEADERS, timeout=8)
            for r in res.json().get("query", {}).get("search", []):
                title = r["title"]
                home_match = home.split()[0].lower() in title.lower()
                away_match = away.split()[0].lower() in title.lower()
                if home_match and away_match:
                    return title
        except Exception:
            continue
    return None


def _fetch_page_html(title: str) -> str | None:
    url = WIKI_REST_HTML.format(title=title.replace(" ", "_"))
    try:
        res = requests.get(url, headers=WIKI_HEADERS, timeout=10)
        if res.status_code != 200:
            return None
        return res.text
    except Exception:
        return None


def _team_in_cell(cell, team_name: str) -> bool:
    if not cell or not team_name:
        return False
    text = cell.get_text(" ", strip=True).lower()
    return team_name.split()[0].lower() in text


def _find_match_table(soup, home: str, away: str):
    """Scan every footballbox table on the page (an overview page holds
    several) and return the one whose fhome/faway header cells match the
    teams we're looking for. fhome/faway are Wikipedia's own
    Module:Football_box classes for the home/away team-name cells.

    Returns (table, wiki_home, wiki_away) where wiki_home/wiki_away are the
    home/away teams AS WIKIPEDIA HAS THEM for that table — these can be
    swapped relative to our caller's home/away if our org_client's "home"
    isn't the side Wikipedia lists first; using these (not the caller's
    values) keeps fhgoal/fagoal correctly attributed downstream.
    Returns (None, home, away) if no table matches.
    """
    # NOTE: the {{Football box}} template wraps everything in a <div
    # class="footballbox">, but the actual <table> inside it carries
    # class="fevent" (confirmed against Module:Football_box source:
    # root:tag('table'):addClass('fevent')). Searching for "footballbox"
    # on a <table> element matches nothing. Anchor the search on "fevent".
    tables = soup.find_all("table", class_=re.compile(r"\bfevent\b"))
    for table in tables:
        fhome = table.find(class_=re.compile(r"\bfhome\b"))
        faway = table.find(class_=re.compile(r"\bfaway\b"))
        if _team_in_cell(fhome, home) and _team_in_cell(faway, away):
            return table, home, away
        if _team_in_cell(fhome, away) and _team_in_cell(faway, home):
            return table, away, home
    return None, home, away


def _parse_goal_cell(cell, team_name: str) -> list[dict]:
    """Each <br>-separated line in a fhgoal/fagoal cell is one goal entry."""
    goals = []
    # get_text(separator) turns <br> into newlines reliably
    text = cell.get_text(separator="\n")
    for line in text.split("\n"):
        line = line.strip()
        if not line:
            continue
        m = GOAL_LINE_RE.match(line)
        if not m:
            continue
        scorer = m.group("scorer").strip()
        minute_raw = m.group("minute")
        note = (m.group("note") or "").lower()
        goal_type = "OWN" if "o.g" in note else ("PENALTY" if "pen" in note else "REGULAR")
        # minute like "90+3" stays as a string elsewhere in this codebase's
        # shape is an int; keep the base minute as int, folding stoppage in
        # isn't reliable — store as the int part, matching org_client's own
        # handling of api fields (it also just takes a plain int minute).
        base_minute = int(minute_raw.split("+")[0])
        goals.append({
            "minute": base_minute,
            "team":   team_name,
            "scorer": scorer,
            "assist": "",
            "type":   goal_type,
        })
    return goals


def _extract_goals_from_table(table, home: str, away: str) -> list[dict]:
    fhgoal = table.find(class_=re.compile(r"\bfhgoal\b"))
    fagoal = table.find(class_=re.compile(r"\bfagoal\b"))

    goals = []
    if fhgoal:
        goals.extend(_parse_goal_cell(fhgoal, home))
    if fagoal:
        goals.extend(_parse_goal_cell(fagoal, away))

    goals.sort(key=lambda g: g["minute"])
    return goals


def _extract_goals_from_standalone_html(html: str, home: str, away: str) -> list[dict]:
    """Standalone match articles only ever have one footballbox on the
    page, so no team-matching is needed here — unlike overview pages."""
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table", class_=re.compile(r"\bfevent\b"))
    if not table:
        return []
    return _extract_goals_from_table(table, home, away)


def get_goals(home: str, away: str, date: str, stage: str | None = None, group: str | None = None) -> list[dict]:
    """Returns goals in the {minute, team, scorer, assist, type} shape, or []
    on any failure (no page found, no matching footballbox table, parse
    failure). Cached 6hrs per home/away/date.

    stage/group should be the raw football-data.org values (e.g.
    "GROUP_STAGE" / "GROUP_J") — org_client._fmt_match already has both
    available as raw_stage/raw_group before they get humanized for display.
    """
    cache_key = f"wikigoals_{home}_{away}_{date}".replace(" ", "_")
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    goals: list[dict] = []
    try:
        # Tier A: shared overview page (group stage / knockout rounds).
        # Title is constructed directly, not searched, so it can't be
        # thrown off by an unrelated page matching a fuzzy search query.
        for title in _candidate_overview_titles(date, stage, group):
            html = _fetch_page_html(title)
            if not html:
                continue
            soup = BeautifulSoup(html, "html.parser")
            table, t_home, t_away = _find_match_table(soup, home, away)
            if table:
                found = _extract_goals_from_table(table, t_home, t_away)
                if found:
                    goals = found
                    break

        # Tier B: standalone match article search — fallback for stages
        # whose overview-page guess was wrong/missing, or any stage (e.g.
        # the final) that does get its own standalone article.
        if not goals:
            title = _search_match_article(home, away, date)
            if title:
                html = _fetch_page_html(title)
                if html:
                    goals = _extract_goals_from_standalone_html(html, home, away)

        cache.set(cache_key, goals, ttl=21600 if goals else 1800)
        return goals

    except Exception:
        return []