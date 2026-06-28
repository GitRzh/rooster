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

For the TL;DR: 2 punchy sentences max. The gut-punch verdict.
For the Full Narrative: 4-6 sentences. Cover the key moments, who stepped up, who failed, and what it means — enough for a fan who didn't watch to feel like they were there. Not a stats dump. Storytelling with teeth."""


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

    return f"""MATCH: {home} (HOME) vs {away} (AWAY) | {stage} | {date}
{result_line}

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

NARRATIVE: [4-6 sentences. Key moments, who delivered for {winner}, how the match unfolded, what {loser} couldn't handle. Name players. Make it feel like you watched it live.]"""


def why_loser(match: dict) -> str:
    ctx    = build_context(match)
    loser  = match.get("loser")
    winner = match.get("winner")
    return f"""{ctx}

{loser} LOST this match to {winner}. Why did {loser} lose?

Respond in EXACTLY this format — two blocks, nothing else before or after:

TLDR: [2 punchy sentences. The brutal verdict on {loser}'s failure.]

NARRATIVE: [4-6 sentences. What went wrong for {loser}, when it went wrong, who failed to deliver, and what {winner} exploited. Name players. Be honest and specific.]"""


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

NARRATIVE: [4-6 sentences. How they shifted the game — specific moments, actions, influence on the scoreline. If it was a team collective effort, say that and explain why no individual stands above the rest.]"""


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

NARRATIVE: [4-6 sentences. What was expected vs what they delivered. Missed chances, poor decisions, defensive errors — be specific. Name names.]"""


def what_if(match: dict) -> str:
    ctx       = build_context(match)
    is_draw   = match.get("is_draw", False)
    focus     = "both teams" if is_draw else match.get("loser", "the losing side")
    return f"""{ctx}

What could {focus} have done differently to change the result?
Be tactical and specific — not "score more goals" but exactly WHAT and WHEN.
One or two clear changes that could have flipped this match.
4-5 sentences, ESPN energy."""


def translate_prompt(text: str, language: str) -> str:
    return f"""Translate this football analysis into {language}.
Keep the ESPN anchor energy — confident, sharp, direct.
For RTL languages (Arabic, Urdu), ensure natural flow in that direction.
Return ONLY the translated text.

TEXT:
{text}"""


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