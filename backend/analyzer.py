"""
analyzer.py
Builds match context using Docling (Wikipedia),
then runs a single Groq call in the target language.
"""

from datetime import datetime, timezone, timedelta
from prompts import SYSTEM_PROMPT, QUESTION_MAP, DRAW_ALLOWED, RTL_LANGUAGES, custom_question_prompt
from groq_client import complete, is_football_question
from docling_client import get_match_context

# Minimum hours after match end before Wikipedia is reliable enough
WIKI_MIN_DELAY_HOURS = 1


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

    # Fetch Wikipedia context via Docling (cached 3hrs)
    wiki_context = get_match_context(
        match_id=match["id"],
        home=match["home"],
        away=match["away"],
        date=match["date"]
    )
    match["wiki_context"] = wiki_context

    # Build prompt
    if question_type == "custom":
        user_prompt = custom_question_prompt(match, custom_question)
    else:
        prompt_fn   = QUESTION_MAP[question_type]
        user_prompt = prompt_fn(match)

    answer = complete(SYSTEM_PROMPT, user_prompt, language)

    return {
        "answer":        answer,
        "language":      language,
        "rtl":           language in RTL_LANGUAGES,
        "question_type": question_type,
        "match":         f"{match['home']} vs {match['away']}",
        "score":         f"{match['score_home']}-{match['score_away']}",
        "draw_blocked":  False
    }