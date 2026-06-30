"""
analyzer.py
Builds match context using Docling (Wikipedia),
then runs a single Groq call in the target language.
"""

import hashlib
import re
from datetime import datetime, timezone, timedelta
from prompts import SYSTEM_PROMPT, QUESTION_MAP, DRAW_ALLOWED, RTL_LANGUAGES, custom_question_prompt
from groq_client import complete, translate, extract_names, is_football_question, NON_LATIN_LANGS
from docling_client import get_match_context
from wiki_goals import get_goals
from org_client import get_coaches, STAGE_LABELS
import cache

_RAW_STAGE_BY_LABEL = {label: code for code, label in STAGE_LABELS.items()}


def _stage_and_group_for_goals(match: dict) -> tuple[str | None, str | None]:
    """wiki_goals.get_goals() needs the RAW football-data.org stage/group
    codes (e.g. "GROUP_STAGE" / "GROUP_J") to build its overview-page title
    guess. main.py's AnalyzeRequest currently only carries the HUMANIZED
    display string that org_client._fmt_match() produces (e.g. "Group Stage
    · Group J", "Round of 32", "Final") — the raw codes themselves aren't
    plumbed through main.py's request model.

    Prefers match["raw_stage"]/match["group"] if main.py's AnalyzeRequest
    forwarded them from the real match object org_client._fmt_match()
    produced (these are now optional pass-through fields — see main.py).
    Falls back to reversing org_client's own STAGE_LABELS mapping when
    those weren't sent, so it's exact for every stage org_client can
    produce — not a guess — and additionally pulls the group letter out of
    the "Group Stage · Group X" compound label for the group-stage case."""
    if match.get("raw_stage"):
        return match["raw_stage"], match.get("group")

    stage_display = (match.get("stage") or "")

    if stage_display.startswith("Group Stage"):
        m = re.search(r"group\s+([A-Za-z])\s*$", stage_display, re.IGNORECASE)
        return "GROUP_STAGE", (f"GROUP_{m.group(1).upper()}" if m else None)

    return _RAW_STAGE_BY_LABEL.get(stage_display), None

# Minimum hours after match end before Wikipedia is reliable enough
WIKI_MIN_DELAY_HOURS = 1


def _split_tldr_narrative(text: str) -> tuple[str, str] | None:
    """Split an English 'TLDR: ... NARRATIVE: ...' answer into its two bodies.
    Returns None if the expected structure isn't present (e.g. draw-blocked /
    too-soon messages, or a generation that didn't follow the format), in
    which case the caller should fall back to translating the whole text."""
    m = re.search(r"TLDR[:\s-]*([\s\S]*?)NARRATIVE[:\s-]*([\s\S]*)$", text, re.IGNORECASE)
    if not m:
        return None
    tldr = m.group(1).strip()
    narr = m.group(2).strip()
    if not tldr or not narr:
        return None
    return tldr, narr


def _translated_answer(english_answer: str, language: str, known_names: list[str] | None) -> str:
    """Translate an English TLDR/NARRATIVE answer into another language.

    Relying on the LLM to selectively leave the 'TLDR:'/'NARRATIVE:' labels
    untranslated inside text it's otherwise told to translate proved
    unreliable in practice (it would translate them, or transliterate them
    phonetically) — the frontend's parser only matches the literal English
    words, so any drift breaks the TL;DR/Full Narrative split.

    Instead: split into the two bodies in Python (deterministic, since the
    source is always English), translate each body on its own with no labels
    in the prompt at all, and reassemble with the literal English labels
    added back by this code — never by the model. Falls back to translating
    the whole text if the structure isn't present (e.g. draw/too-soon
    messages, which have no TLDR/NARRATIVE structure to begin with)."""
    split = _split_tldr_narrative(english_answer)
    if split is None:
        return translate(english_answer, language, known_names)

    tldr_en, narr_en = split
    tldr_t = translate(tldr_en, language, known_names)
    narr_t = translate(narr_en, language, known_names)
    if not (tldr_t or "").strip():
        tldr_t = tldr_en
    if not (narr_t or "").strip():
        narr_t = narr_en
    return f"TLDR: {tldr_t}\n\nNARRATIVE: {narr_t}"


def _score_in_answer_matches(answer: str, match: dict) -> bool:
    """Loose sanity check: if the answer states a numeric scoreline that
    contradicts the real score, flag it. This won't catch every hallucination
    (most don't restate the score at all, they just get the *story* wrong),
    but it catches the cheapest, most embarrassing failure mode — the model
    asserting a different result than what actually happened — for free.
    Returns True when no contradicting score is found (i.e. safe to use)."""
    score_home = match.get("score_home")
    score_away = match.get("score_away")
    if score_home is None or score_away is None:
        return True
    
    found = re.findall(r"(\d+)\s*[-–]\s*(\d+)", answer)
    if not found:
        return True
    real_pair = {(score_home, score_away), (score_away, score_home)}
    for a, b in found:
        if (int(a), int(b)) not in real_pair:
            return False
    return True

def _english_answer(match: dict, question_type: str, custom_question: str | None, user_prompt: str) -> str:
    """Get the canonical ENGLISH answer for this question, from cache if present,
    otherwise generate it once and cache it. Every other language is a translation
    of THIS exact text — never an independent generation — so all languages stay
    factually consistent with each other.

    Custom questions are keyed by a hash of the question text (lowercased/trimmed)
    so identical questions reuse the same English source across users/languages,
    same as the standard question types.

    Includes one retry if the generated answer states a scoreline that
    contradicts the real match result (cheap, deterministic guard against
    the most visible kind of hallucination)."""
    if question_type == "custom":
        qhash = hashlib.md5((custom_question or "").strip().lower().encode()).hexdigest()[:16]
        english_key = f"analysis_en_src:{match['id']}:custom:{qhash}"
    else:
        english_key = f"analysis_en_src:{match['id']}:{question_type}"

    english_answer = cache.get(english_key)
    if not isinstance(english_answer, str) or not english_answer.strip():
        english_answer = complete(SYSTEM_PROMPT, user_prompt, "English")
        if not _score_in_answer_matches(english_answer, match):
            retry = complete(SYSTEM_PROMPT, user_prompt, "English")
            if _score_in_answer_matches(retry, match):
                english_answer = retry
        cache.set(english_key, english_answer)

    return english_answer


def _known_names_for(english_answer: str) -> list[str]:
    """Player/manager names extracted from the ENGLISH source, used to force
    correct Latin-script preservation when translating into non-Latin scripts.
    Cached under the same 'names:{hash}' key scheme as the /extract-names
    endpoint in main.py, so this never costs more than one extra Groq call
    per unique English answer."""
    text_hash = hashlib.md5(english_answer.encode()).hexdigest()[:16]
    cache_key = f"names:{text_hash}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    names = extract_names(english_answer)
    cache.set(cache_key, names)
    return names


def analyze(match: dict, question_type: str, language: str = "English", custom_question: str | None = None) -> dict:
    if question_type not in QUESTION_MAP and question_type != "custom":
        raise ValueError(f"Unknown question type: {question_type}")

    is_draw = match.get("is_draw", False)

    # Block winner/loser questions for draws
    if is_draw and question_type not in DRAW_ALLOWED and question_type != "custom":
        return {
            "answer": (
                "This match ended in a draw — there's no winner or loser to analyze here. "
                "Try 'Who Dominated', 'Who Underperformed', or 'What Could've Changed'."
            ),
            "language":      language,
            "rtl":           language in RTL_LANGUAGES,
            "question_type": question_type,
            "match":         f"{match['home']} vs {match['away']}",
            "score":         f"{match['score_home']}-{match['score_away']}",
            "draw_blocked":  True
        }

    # Custom question requires text
    if question_type == "custom" and not (custom_question or "").strip():
        raise ValueError("custom_question is required for question_type=custom")

    # Two-step classifier — ONLY for custom questions
    if question_type == "custom":
        if not is_football_question(custom_question):
            return {
                "answer":        "I only analyse football matches. Ask me something about this game.",
                "language":      language,
                "rtl":           language in RTL_LANGUAGES,
                "question_type": question_type,
                "match":         f"{match['home']} vs {match['away']}",
                "score":         f"{match.get('score_home', '?')}-{match.get('score_away', '?')}",
                "draw_blocked":  False,
                "off_topic":     True,
            }

    # ── 3-hour freshness check ────────────────────────────────
    # football-data.org utcDate is the kickoff time — add ~2hrs for match duration
    try:
        match_date_str = match.get("date", "")       # "YYYY-MM-DD"
        match_time_str = match.get("time", "00:00")  # "HH:MM" UTC — may not be in match dict
        kickoff = datetime.strptime(f"{match_date_str} {match_time_str}", "%Y-%m-%d %H:%M").replace(tzinfo=timezone.utc)
        estimated_end = kickoff + timedelta(hours=2)
        available_at  = estimated_end + timedelta(hours=WIKI_MIN_DELAY_HOURS)
        now = datetime.now(timezone.utc)
        if now < available_at:
            mins_left = int((available_at - now).total_seconds() / 60)
            return {
                "answer": (
                    f"Analysis will be available approximately {mins_left} minutes after the match ends. "
                    f"Wikipedia needs time to be updated with full match details before ROOSTER can give you an accurate breakdown."
                ),
                "language":      language,
                "rtl":           language in RTL_LANGUAGES,
                "question_type": question_type,
                "match":         f"{match['home']} vs {match['away']}",
                "score":         f"{match.get('score_home', '?')}-{match.get('score_away', '?')}",
                "too_soon":      True,
                "draw_blocked":  False
            }
    except Exception:
        pass  # If time parsing fails, proceed anyway

    # Enrich match with coach names (fetched independently — free tier doesn't include them in match objects)
    if not match.get("home_coach") and not match.get("away_coach"):
        coaches = get_coaches(match["home"], match["away"])
        match.setdefault("home_coach", coaches["home_coach"])
        match.setdefault("away_coach", coaches["away_coach"])

    # Fetch Wikipedia context via Docling (cached 3hrs)
    wiki_context = get_match_context(
        match_id=match["id"],
        home=match["home"],
        away=match["away"],
        date=match["date"]
    )
    match["wiki_context"] = wiki_context


    if not match.get("goals"):
        raw_stage, raw_group = _stage_and_group_for_goals(match)
        match["goals"] = get_goals(
            home=match["home"],
            away=match["away"],
            date=match["date"],
            stage=raw_stage,
            group=raw_group,
        )

    # Build prompt
    if question_type == "custom":
        user_prompt = custom_question_prompt(match, custom_question)
    else:
        prompt_fn   = QUESTION_MAP[question_type]
        user_prompt = prompt_fn(match)

    english_answer = _english_answer(match, question_type, custom_question, user_prompt)
    if language == "English":
        answer = english_answer
    else:
        known_names = _known_names_for(english_answer) if language in NON_LATIN_LANGS else None
        answer = _translated_answer(english_answer, language, known_names)
        if not (answer or "").strip():
            answer = english_answer

    return {
        "answer":        answer,
        "language":      language,
        "rtl":           language in RTL_LANGUAGES,
        "question_type": question_type,
        "match":         f"{match['home']} vs {match['away']}",
        "score":         f"{match['score_home']}-{match['score_away']}",
        "draw_blocked":  False
    }