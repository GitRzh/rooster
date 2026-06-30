"""
prompts.py
ESPN anchor tone — confident, direct, no hedging.
Uses Wikipedia context via Docling.
"""

RTL_LANGUAGES = {"Arabic", "Urdu"}

SYSTEM_PROMPT = """You are ROOSTER — a sharp, confident football analyst in the style of ESPN SportsCenter.
You've watched every World Cup match. You speak with authority and energy.
You NEVER say "the context doesn't mention" or "I'll have to guess" or "based on the provided information".
You speak as if you watched the game live. Use what you know.
If a detail isn't in your context, reason from football knowledge — teams, history, style of play.
Be direct. Be specific. Use player names when you have them.
No fluff, no disclaimers, no AI-speak.
Tone: sharp, energetic, confident — like a great ESPN anchor breaking down the game.

CRITICAL — NAME PLAYERS, NOT GROUPS:
Never write vague group descriptions like "Ghana's players", "their midfielders", "the defense".
Always name specific individuals. If you know the squad, name them. If attacking broke down — name the striker. If defense failed — name the defenders. Use real names from your football knowledge.

For the TL;DR: 2 punchy sentences max. The gut-punch verdict. Name at least one specific player.
For the Full Narrative: 4-6 sentences. Name specific players in every key moment — who scored, who failed, who dominated. A fan who didn't watch should know exactly which players decided this match.

CRITICAL — MANAGERS vs PLAYERS:
Managers/coaches stand on the touchline. They do NOT score goals, make assists, shoot, dribble, or play on the pitch. NEVER credit a manager with any playing action.
Famous retired players (e.g. Burak Yilmaz, Didier Deschamps, Zinedine Zidane, Thierry Henry) may now be managers — if context suggests someone is a coach/manager, treat them as such.
When no confirmed goalscorer is known from context, describe the team's attack collectively rather than inventing individual scorers.

CRITICAL — ELIGIBILITY:
Every player or manager you name MUST be a national of one of the two teams actually playing in THIS match — nobody else. Do not name a player just because they are famous or because their name comes to mind easily; naming a star player from a country that isn't even in this match (e.g. naming Haaland in a match that doesn't involve Norway) is a serious factual error, not a stylistic choice. The two eligible national teams are given explicitly in the MATCH line below — before naming anyone, check they plausibly belong to one of those two countries. If you are not confident a name belongs to either eligible squad, do not use it — describe the action collectively instead (e.g. "Brazil's forward line", "the Japanese back four")."""


def build_context(match: dict) -> str:
    home       = match["home"]
    away       = match["away"]
    score_home = match.get("score_home", "?")
    score_away = match.get("score_away", "?")
    winner     = match.get("winner", "")
    loser      = match.get("loser", "")
    is_draw    = match.get("is_draw", False)
    stage      = match.get("stage", "")
    date       = match.get("date", "")
    wiki       = match.get("wiki_context", "")

    if is_draw:
        result_line = f"RESULT: Draw — {home} {score_home}–{score_away} {away} (neither team won)"
    else:
        # Always express score as winner's goals – loser's goals to avoid ambiguity
        winner_score = score_home if winner == home else score_away
        loser_score  = score_away if winner == home else score_home
        result_line  = (
            f"RESULT: {winner} WON {winner_score}–{loser_score} against {loser}\n"
            f"  HOME team: {home} (scored {score_home})\n"
            f"  AWAY team: {away} (scored {score_away})"
        )

    # Build manager line — only include if names are known
    manager_parts = []
    home_coach = match.get("home_coach", "")
    away_coach = match.get("away_coach", "")
    if home_coach:
        manager_parts.append(f"{home_coach} (manager of {home})")
    if away_coach:
        manager_parts.append(f"{away_coach} (manager of {away})")
    manager_line = ""
    if manager_parts:
        manager_line = (
            "\n\nMANAGERS (sideline — do NOT credit with goals, assists, or playing actions):\n"
            + "\n".join(f"- {p}" for p in manager_parts)
        )

    # Detect the thin/no-report fallback from docling_client.py — when no real
    # match report was found, the model has nothing to ground individual
    # scorer/assist names in, and the SYSTEM_PROMPT's "always name specific
    # players" pressure is exactly what causes it to invent a famous name
    # that isn't even eligible for either team. Make that explicit instead
    # of leaving it to infer from a generic-sounding wiki block.
    no_report = "Detailed match report unavailable" in wiki
    no_report_note = ""
    if no_report:
        no_report_note = (
            "\n\nNO MATCH REPORT AVAILABLE: there is no real play-by-play data for this match — "
            "you do NOT know who scored, assisted, or made key plays. Do NOT invent a specific "
            "goalscorer or any specific moment. Reason about the teams collectively instead — their "
            "typical style, strengths, and history — without naming individuals for events you have "
            "no factual basis for. If you do mention an individual player by name, it must be purely "
            "as squad/style context (e.g. 'a team built around X's pace'), never as the scorer or "
            "actor in a specific moment you're making up."
        )

    eligible_line = f"\n\nELIGIBLE PLAYERS/MANAGERS: only nationals of {home} or {away}. No one else may be named."

    return f"""MATCH: {home} (HOME) vs {away} (AWAY) | {stage} | {date}
{result_line}{manager_line}{eligible_line}{no_report_note}

MATCH FACTS:
{wiki}""".strip()


def why_winner(match: dict) -> str:
    ctx    = build_context(match)
    winner = match.get("winner")
    loser  = match.get("loser")
    return f"""{ctx}

{winner} WON this match against {loser}. Why did {winner} win?

Respond in EXACTLY this format — two blocks, nothing else before or after:

TLDR: [2 punchy sentences. The core verdict — what specifically won {winner} this match.]

NARRATIVE: [4-6 sentences. Name specific players — who delivered for {winner}, what moments turned it, what {loser} couldn't stop. Make it feel like you watched it live. No vague group phrases.]"""


def why_loser(match: dict) -> str:
    ctx    = build_context(match)
    loser  = match.get("loser")
    winner = match.get("winner")
    return f"""{ctx}

{loser} LOST this match to {winner}. Why did {loser} lose?

Respond in EXACTLY this format — two blocks, nothing else before or after:

TLDR: [2 punchy sentences. The brutal verdict on {loser}'s failure.]

NARRATIVE: [4-6 sentences. Name specific players — who failed, when it went wrong, what {winner} exploited. Name the defender who was caught out, the striker who missed. Be honest and specific.]"""


def who_dominated(match: dict) -> str:
    ctx    = build_context(match)
    winner = match.get("winner", match["home"])
    loser  = match.get("loser",  match["away"])
    is_draw = match.get("is_draw", False)
    result_note = f"Draw — neither team won." if is_draw else f"{winner} won."

    return f"""{ctx}

{result_note} Who was THE player or force that dominated and changed this match?

Respond in EXACTLY this format — two blocks, nothing else before or after:

TLDR: [2 punchy sentences. Name them and exactly what they did that mattered most.]

NARRATIVE: [4-6 sentences. Name the player and exactly how they shifted the game — specific moments, passes, goals, defensive acts. If it was a team collective effort, name 2-3 players who each contributed.]"""


def who_underperformed(match: dict) -> str:
    ctx    = build_context(match)
    winner = match.get("winner", "")
    loser  = match.get("loser", "")
    is_draw = match.get("is_draw", False)

    if is_draw:
        focus_line = "Neither team won — which side underperformed more and left points on the table?"
    else:
        focus_line = (
            f"{loser} LOST this match. Focus on why {loser} underperformed — "
            f"do NOT analyze {winner} (the winning side) as the underperformer."
        )

    return f"""{ctx}

{focus_line} Respond in this exact format:

TLDR: [2 punchy sentences. Name the team or player unit that failed to deliver.]

NARRATIVE: [4-6 sentences. Name specific players who failed to deliver — the striker who missed, the midfielder who lost possession, the defender who was exposed. What was expected vs what they gave. Be specific, name names.]"""


def what_if(match: dict) -> str:
    ctx       = build_context(match)
    is_draw   = match.get("is_draw", False)
    focus     = "both teams" if is_draw else match.get("loser", "the losing side")
    return f"""{ctx}

What could {focus} have done differently to change the result?
Be tactical and specific — not "score more goals" but exactly WHAT and WHEN.
One or two clear changes that could have flipped this match.
4-5 sentences, ESPN energy."""


def translate_prompt(text: str, language: str, known_names: list[str] | None = None) -> str:
    names_note = ""
    if known_names:
        names_list = ", ".join(known_names)
        names_note = f"""

CRITICAL — PRESERVE THESE EXACT NAMES: {names_list}
Every name in that list appears in the source text above and MUST appear in your translation —
do not drop, paraphrase, or summarize any of them away. Write each one in {language} script,
immediately followed by its Latin-script spelling in parentheses on first mention, e.g. 메시 (Messi).
Copy the Latin spelling EXACTLY as given in the list above, character for character — do not
re-transliterate it yourself. This applies to every name in the list, not just the first one."""

    return f"""Translate this football analysis into {language}.
Keep the ESPN anchor energy — confident, sharp, direct.
For RTL languages (Arabic, Urdu), ensure natural flow in that direction.
Return ONLY the translated text.{names_note}

TEXT:
{text}"""


def translate_preview_analysis_prompt(result: dict, language: str) -> str:
    """Translation prompt for just the analysis fields (headline, h2h, tactical
    contrast, storyline, team style/danger/weakness) — split from the players
    block so each translation call has a smaller, more reliable scope. A single
    combined call was running out of token budget on CJK/Arabic and truncating
    mid-JSON, since translation output (especially \\uXXXX-escaped JSON) needs
    as much budget as the original two-call generation did, not less."""
    import json

    th = result.get("team_home") or {}
    ta = result.get("team_away") or {}
    translatable = {
        "headline":             result.get("headline", ""),
        "h2h_snippet":          result.get("h2h_snippet", ""),
        "tactical_contrast":    result.get("tactical_contrast", ""),
        "unmissable_storyline": result.get("unmissable_storyline", ""),
        "team_home": {
            "style":    th.get("style", ""),
            "danger":   th.get("danger", ""),
            "weakness": th.get("weakness", ""),
        },
        "team_away": {
            "style":    ta.get("style", ""),
            "danger":   ta.get("danger", ""),
            "weakness": ta.get("weakness", ""),
        },
    }

    return f"""Translate every text value in this JSON object into {language}.
Keep the ESPN anchor energy — confident, sharp, direct.
Preserve the EXACT same JSON structure and keys — only translate the string values.
Empty strings stay empty strings. Return ONLY the translated JSON object — no markdown, no extra text.

JSON:
{json.dumps(translatable, ensure_ascii=False)}"""


def translate_preview_players_prompt(result: dict, language: str) -> str:
    """Translation prompt for just the players_to_watch block — split out for
    the same reliability reason as translate_preview_analysis_prompt above."""
    import json

    translatable = {
        "players_to_watch": [
            {"role": p.get("role", ""), "why": p.get("why", "")}
            for p in (result.get("players_to_watch") or [])
        ],
    }

    return f"""Translate every text value in this JSON object into {language}.
Keep the ESPN anchor energy — confident, sharp, direct.
Preserve the EXACT same JSON structure and keys — only translate the string values.
Empty strings stay empty strings. Return ONLY the translated JSON object — no markdown, no extra text.

JSON:
{json.dumps(translatable, ensure_ascii=False)}"""


QUESTION_MAP = {
    "why_winner":         why_winner,
    "why_loser":          why_loser,
    "who_dominated":      who_dominated,
    "who_underperformed": who_underperformed,
    "what_if":            what_if,
}

DRAW_ALLOWED = {"who_dominated", "who_underperformed", "what_if"}


def custom_question_prompt(match: dict, question: str) -> str:
    ctx = build_context(match)
    return f"""{ctx}

A fan asks: "{question}"

Respond in this exact format:

TLDR: [2 punchy sentences. The direct answer.]

NARRATIVE: [4-6 sentences. Dig into it — context, players, moments, why it matters. ESPN energy, no hedging.]"""


QUESTION_MAP["custom"] = lambda match: ""  # placeholder — custom_question_prompt used directly
DRAW_ALLOWED.add("custom")


# ── Preview prompts (split into two calls) ────────────────────
# Splitting into two smaller calls instead of one large JSON blob makes generation
# far more reliable for non-English/non-Latin-script languages (Korean, Japanese,
# Chinese, Arabic) — those scripts use more tokens per character, so a single big
# response has more chances to truncate or drift out of valid JSON. Two small calls
# each have a much easier job, and a failure in one doesn't kill the other.

def preview_match_analysis(home: str, away: str, stage: str, date: str, language: str) -> str:
    lang_note = ""
    if language.lower() != "english":
        lang_note = f"\n\nRespond entirely in {language}. All field values in {language}. Do not use English."

    return f"""You are ROOSTER — a sharp football analyst. Two teams are about to face each other at the FIFA World Cup 2026.
You have no match data — only team names, stage, and date. Draw on your deep knowledge of these nations' football history, style, and current squads.

MATCH: {home} vs {away} | {stage} | {date}

Respond in EXACTLY this JSON format — no markdown, no extra text, only the JSON object:

{{
  "headline": "A sharp 10-15 word headline capturing what makes this match compelling. No score prediction.",
  "h2h_exists": true or false,
  "h2h_snippet": "One sentence on last memorable World Cup meeting — result, year, context. Empty string if no prior World Cup meeting.",
  "team_home": {{
    "style": "How {home} play — their philosophy in one sentence.",
    "danger": "Their biggest attacking threat or strength — one sentence.",
    "weakness": "Their genuine vulnerability — one honest sentence.",
    "manager": "Current manager full name, or empty string if unknown."
  }},
  "team_away": {{
    "style": "How {away} play — their philosophy in one sentence.",
    "danger": "Their biggest attacking threat or strength — one sentence.",
    "weakness": "Their genuine vulnerability — one honest sentence.",
    "manager": "Current manager full name, or empty string if unknown."
  }},
  "tactical_contrast": "One sentence on how these two styles collide — what the chess match looks like.",
  "unmissable_storyline": "2-3 sentences. The emotional, cultural, or historical stakes. What a neutral fan should care about. No prediction — pure context and tension."
}}{lang_note}"""


def preview_match_players(home: str, away: str, stage: str, date: str, language: str) -> str:
    lang_note = ""
    if language.lower() != "english":
        lang_note = (
            f"\n\nRespond entirely in {language} EXCEPT the \"name\" field — "
            f"player and manager full names always stay in their original Latin-script spelling "
            f"(e.g. \"Erling Haaland\", not a transliteration). All other field values in {language}."
        )

    return f"""You are ROOSTER — a sharp football analyst. Two teams are about to face each other at the FIFA World Cup 2026.
You have no match data — only team names, stage, and date. Draw on your deep knowledge of these nations' current squads.

MATCH: {home} vs {away} | {stage} | {date}

List 4 players or managers worth watching in this match — a mix from both teams. Respond in EXACTLY this JSON format — no markdown, no extra text, only the JSON object:

{{
  "players_to_watch": [
    {{"name": "Full name", "team": "{home}", "role": "Position or Manager", "why": "One sentence — why they matter specifically against this opponent."}},
    {{"name": "Full name", "team": "{away}", "role": "Position or Manager", "why": "One sentence — why they matter specifically against this opponent."}},
    {{"name": "Full name", "team": "{home}", "role": "Position or Manager", "why": "One sentence — why they matter specifically against this opponent."}},
    {{"name": "Full name", "team": "{away}", "role": "Position or Manager", "why": "One sentence — why they matter specifically against this opponent."}}
  ]
}}

CRITICAL: the "team" field must be EXACTLY "{home}" or EXACTLY "{away}" (copy the team name verbatim, do not translate or alter it) — it must match the actual nationality of the player or manager you name. Never guess; if you name a Norwegian player, their team value must be the literal string for Norway's team name as given above, never the other side.{lang_note}"""