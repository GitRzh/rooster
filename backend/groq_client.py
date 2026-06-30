"""
groq_client.py
Single Groq call, language-aware, rate limit retry.
"""

import os
import re
import time
import random
import logging
import requests
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions"
MODEL        = "llama-3.3-70b-versatile"
FALLBACK     = "llama-3.1-8b-instant"
MAX_TOKENS         = 800   # raised: 500 was too short for 4-6 sentence narratives with player names

# Preview is now split into two smaller calls (analysis block + players block) instead of one
# big JSON blob — far more reliable for non-Latin-script languages, which use more tokens per
# character and used to truncate mid-object on the old single-call/2000-token design.
PREVIEW_TOKENS_ANALYSIS       = 1100
PREVIEW_TOKENS_ANALYSIS_WIDE  = 1800   # CJK/Arabic need more tokens per character
PREVIEW_TOKENS_PLAYERS        = 600
PREVIEW_TOKENS_PLAYERS_WIDE   = 1000

WIDE_TOKEN_LANGS = {"Korean", "Japanese", "Chinese (Simplified)", "Arabic"}


def preview_token_budget(call: str, language: str = "English") -> int:
    """call: 'analysis' or 'players'. Returns the right max_tokens for this call + language."""
    wide = language in WIDE_TOKEN_LANGS
    if call == "players":
        return PREVIEW_TOKENS_PLAYERS_WIDE if wide else PREVIEW_TOKENS_PLAYERS
    return PREVIEW_TOKENS_ANALYSIS_WIDE if wide else PREVIEW_TOKENS_ANALYSIS


def is_football_question(question: str) -> bool:
    """Fast classifier — cheap call on llama-3.1-8b-instant to check topic before analysis."""
    payload = {
        "model": "llama-3.1-8b-instant",  # smallest/fastest, classifier doesn't need 70b
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a topic classifier. Answer only YES or NO — nothing else, no punctuation. "
                    "Answer YES if the question is about: football, soccer, a match, players, tactics, "
                    "teams, goals, referees, coaching decisions, hypothetical match scenarios, "
                    "World Cup, or anything related to the sport. "
                    "Answer NO only if the question is clearly about something completely unrelated to football "
                    "such as: cooking, politics, coding, history unrelated to sport, or personal advice."
                )
            },
            {"role": "user", "content": question}
        ],
        "temperature": 0,
        "max_tokens": 3,
    }
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type":  "application/json",
    }
    try:
        res = requests.post(GROQ_URL, headers=headers, json=payload, timeout=10)
        res.raise_for_status()
        answer = res.json()["choices"][0]["message"]["content"].strip().upper()
        return answer.startswith("YES")
    except Exception:
        return True  # on error, allow through — don't block legitimate questions


NON_LATIN_LANGS = {"Arabic", "Japanese", "Korean", "Chinese (Simplified)"}

def complete(system: str, user_prompt: str, language: str = "English") -> str:
    if language.lower() == "english":
        lang_note = ""
    else:
        lang_note = f"\n\nRespond entirely in {language}. Do not use English at all."
        if language in NON_LATIN_LANGS:
            lang_note += (
                "\n\nNAME FORMAT: Include each player's and manager's Latin-script name "
                "in parentheses immediately after their first mention in non-Latin script. "
                "Example (Arabic): ميسي (Messi), هالاند (Haaland). "
                "Example (Japanese): メッシ (Messi), ハーランド (Haaland). "
                "Example (Korean): 메시 (Messi), 홀란드 (Haaland). "
                "Example (Chinese): 梅西 (Messi), 哈兰德 (Haaland). "
                "Never omit the Latin form on first mention."
            )

    no_hedge = (
        "\n\nCRITICAL: Never say 'the context doesn't mention', "
        "'I'll have to guess', 'based on provided information', or any similar hedge. "
        "Speak as if you watched the match live. Use football knowledge to fill gaps."
    )

    on_topic_guard = (
        "\n\nSCOPE: You only answer questions about this specific football match — "
        "tactics, players, goals, performance, moments, and decisions within the game. "
        "If the question is not about football or this match (e.g. politics, history unrelated to the match, "
        "personal topics, other sports), respond with exactly: "
        "'I only analyse football matches. Ask me something about this game.'"
    )

    full_system = system + no_hedge + on_topic_guard + lang_note
    return _call(full_system, user_prompt, MODEL)


def _sleep_for_retry(res, attempt: int, max_wait: float) -> float:
    """
    Compute backoff duration, capped at max_wait. Prefers Groq's Retry-After
    header when present (authoritative signal for when the window clears),
    but still capped — main.py's /preview endpoint already retries each sub-call
    up to 3x (analysis) / 2x (players) with no gap of its own, so this inner
    layer must stay small or the two retry layers compound past the frontend's
    100s abort. Falls back to exponential backoff with jitter when no header.
    """
    retry_after = res.headers.get("Retry-After") or res.headers.get("retry-after")
    if retry_after:
        try:
            return min(max_wait, max(0.5, float(str(retry_after).rstrip("s"))))
        except ValueError:
            pass
    base = min(2 ** attempt, max_wait)
    return min(max_wait, base + random.uniform(0, base * 0.5))


def _post_with_backoff(headers: dict, payload: dict, timeout: int,
                        max_retries: int = 1, max_wait: float = 4.0,
                        allow_fallback: bool = True):
    """
    POST with bounded backoff on 429: respects Retry-After (capped) when sent,
    otherwise short exponential backoff with jitter. Optionally falls back to
    the smaller model after the first 429, since the 8b model often has a
    separate/lighter quota and may succeed immediately.

    allow_fallback=False for any call where output QUALITY/STRUCTURE matters
    (translation, preview JSON in non-Latin scripts) — llama-3.1-8b-instant is
    far more prone to degenerate repetition loops ("中国五一中国五一...") under
    those workloads, which burns the whole token budget and truncates mid
    \\uXXXX escape, producing a JSONDecodeError downstream. It also dumps extra
    traffic onto the 8b model's own (separate, smaller) rate limit, making that
    quota worse for the calls that legitimately use 8b as their primary model
    (classifier, name extraction). Better to just keep retrying the real model.

    max_retries/max_wait default to a SMALL budget (1 retry, ≤4s) because some
    callers (e.g. /preview's _run loop in main.py) already retry the whole call
    3-5 times with no gap of their own — that outer loop is the real retry
    spread. Callers without an outer loop (e.g. /analyze, a single _call) can
    pass a larger budget since they have no other safety net.

    Returns the final requests.Response (caller checks res.ok).
    """
    res = requests.post(GROQ_URL, headers=headers, json=payload, timeout=timeout)
    attempt = 0
    switched_fallback = False

    while res.status_code == 429 and attempt < max_retries:
        wait = _sleep_for_retry(res, attempt, max_wait)
        time.sleep(wait)

        # After the first 429, try the smaller fallback model once —
        # it's often on a separate/lighter quota and may succeed immediately.
        if allow_fallback and not switched_fallback and payload.get("model") == MODEL:
            payload = {**payload, "model": FALLBACK}
            switched_fallback = True

        res = requests.post(GROQ_URL, headers=headers, json=payload, timeout=timeout)
        attempt += 1

    return res


def _call(system: str, user_prompt: str, model: str) -> str:
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type":  "application/json",
    }
    payload = {
        "model":       model,
        "messages":    [
            {"role": "system", "content": system},
            {"role": "user",   "content": user_prompt},
        ],
        "temperature": 0.7,
        "max_tokens":  MAX_TOKENS,
    }

    # No outer retry loop wraps /analyze — this is the only safety net,
    # so it gets the larger budget (up to 3 retries, ≤10s each).
    res = _post_with_backoff(headers, payload, timeout=30, max_retries=3, max_wait=10.0)

    if not res.ok:
        return f"Analysis unavailable right now (API error {res.status_code}). Try again in a moment."
    return res.json()["choices"][0]["message"]["content"].strip()

def _call_preview(system: str, user_prompt: str, max_tokens: int) -> str:
    """Preview helper call with JSON mode forced — Groq can't drift out of valid JSON structure.
    max_tokens is passed explicitly per-call (see preview_token_budget) since the two split preview
    calls (analysis vs players) and different languages need different budgets."""
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type":  "application/json",
    }
    payload = {
        "model":           MODEL,
        "messages":        [
            {"role": "system", "content": system},
            {"role": "user",   "content": user_prompt},
        ],
        "temperature":     0.7,
        "max_tokens":       max_tokens,
        "response_format": {"type": "json_object"},
    }
    # main.py's _run() loop already calls this up to 3x (analysis) / 2x
    # (players) with no gap of its own — that's the real retry spread.
    # Keep this inner layer tight (1 retry, ≤4s) so 5 stacked outer attempts
    # can't multiply into minutes and blow the frontend's 100s abort.
    res = _post_with_backoff(headers, payload, timeout=45, max_retries=1, max_wait=4.0)
    if res.status_code == 400:
        # response_format unsupported on this model/account — retry without it
        payload = {k: v for k, v in payload.items() if k != "response_format"}
        res = _post_with_backoff(headers, payload, timeout=45, max_retries=1, max_wait=4.0)
    if not res.ok:
        return f'{{"error":true,"headline":"API error {res.status_code}"}}'
    return res.json()["choices"][0]["message"]["content"].strip()


TRANSLATE_TOKENS      = 900
TRANSLATE_TOKENS_WIDE  = 1500   # CJK/Arabic need more tokens per character


def translate(text: str, language: str, known_names: list[str] | None = None) -> str:
    """Translate an already-generated ENGLISH analysis into another language.
    This is the ONLY path non-English answers should take — every language must
    be a faithful translation of the same English source text, never an
    independent generation, or different languages will disagree with each other.

    known_names (player/manager full names extracted from the ENGLISH source)
    are passed through explicitly so the model preserves their Latin-script
    spelling verbatim rather than having to invent the pairing itself — relying
    on the model to remember every name unprompted was unreliable and caused
    most names to lose their Latin form (breaking the frontend's hover-link
    highlighting, which matches on that exact Latin substring).

    Fails safe: on any API error, returns the original English text rather than
    crashing or returning garbage."""
    from prompts import translate_prompt

    prompt = translate_prompt(text, language, known_names if language in NON_LATIN_LANGS else None)

    tokens  = TRANSLATE_TOKENS_WIDE if language in WIDE_TOKEN_LANGS else TRANSLATE_TOKENS
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type":  "application/json",
    }
    payload = {
        "model":       MODEL,
        "messages":    [
            {"role": "system", "content": "You are a precise, faithful sports-analysis translator. Translate meaning exactly — never add, omit, or invent facts, names, or events that aren't in the source text."},
            {"role": "user",   "content": prompt},
        ],
        "temperature": 0.3,  # lower than generation — translation should be faithful, not creative
        "max_tokens":  tokens,
    }
    # allow_fallback=False: never downgrade to 8b-instant for translation — it's
    # prone to repetition-loop degeneration on non-Latin scripts, which is worse
    # than just waiting a bit longer for the real model.
    res = _post_with_backoff(headers, payload, timeout=30, max_retries=4, max_wait=10.0, allow_fallback=False)
    if not res.ok:
        logging.error(f"[TRANSLATE HTTP FAIL] lang={language} status={res.status_code} body={res.text[:300]!r}")
        return text  # fail-safe: show English rather than nothing
    try:
        return res.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        logging.error(f"[TRANSLATE PARSE FAIL] lang={language} error={e!r}")
        return text


def _translate_preview_block(prompt: str, language: str, tokens: int) -> dict | None:
    """Single translate-preview sub-call. Returns the parsed dict, or None on
    any HTTP/parse failure (logged either way)."""
    import json
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type":  "application/json",
    }
    payload = {
        "model":           MODEL,
        "messages":        [
            {"role": "system", "content": "You are a precise, faithful sports-analysis translator. Translate meaning exactly — never add, omit, or invent facts."},
            {"role": "user",   "content": prompt},
        ],
        "temperature":     0.3,
        "max_tokens":      tokens,
        "response_format": {"type": "json_object"},
    }
    # allow_fallback=False: this is the exact call from the bug report — 8b-instant
    # degenerates into repeated-character loops on CJK/Arabic JSON output, eating
    # the whole token budget and truncating mid \uXXXX escape (the JSONDecodeError
    # seen in production). Retry the real model with backoff instead of downgrading.
    res = _post_with_backoff(headers, payload, timeout=45, max_retries=3, max_wait=10.0, allow_fallback=False)
    if res.status_code == 400:
        payload = {k: v for k, v in payload.items() if k != "response_format"}
        res = _post_with_backoff(headers, payload, timeout=45, max_retries=3, max_wait=10.0, allow_fallback=False)
    if not res.ok:
        logging.error(f"[TRANSLATE_PREVIEW HTTP FAIL] lang={language} status={res.status_code} body={res.text[:300]!r}")
        return None

    raw = None
    try:
        raw = res.json()["choices"][0]["message"]["content"].strip()
        if "```" in raw:
            parts = raw.split("```")
            raw = parts[1] if len(parts) >= 2 else raw
            lines = raw.splitlines()
            if lines and lines[0].strip().lower() in ("json", ""):
                raw = "\n".join(lines[1:])
            raw = raw.strip()
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            # Recover from stray text around the JSON object (e.g. a leading
            # "Here is the translation:" the model added despite instructions) —
            # same fallback main.py's preview-generation _parse() already uses.
            start, end = raw.find("{"), raw.rfind("}")
            if start != -1 and end != -1 and end > start:
                candidate = raw[start:end + 1]
                try:
                    return json.loads(candidate)
                except json.JSONDecodeError as inner:
                    # Specific failure mode seen in production: hitting max_tokens
                    # mid-string cuts a multi-byte CJK/Arabic escape sequence in half
                    # (e.g. "...\u4e2" with no closing 4 hex digits), so the LAST
                    # value in the JSON is truncated garbage rather than the object
                    # itself being malformed. Snip back to the last syntactically
                    # complete value (last comma/opening-brace boundary before the
                    # error column) and close the structure — partial-but-valid
                    # beats a full retry round-trip for a one-field truncation.
                    pos = getattr(inner, "pos", None)
                    if pos is not None:
                        safe_cut = candidate.rfind(",", 0, pos)
                        if safe_cut != -1:
                            repaired = candidate[:safe_cut]
                            # Close any open strings/objects/arrays as best-effort
                            opens = repaired.count("{") - repaired.count("}")
                            arr_opens = repaired.count("[") - repaired.count("]")
                            repaired += "]" * max(arr_opens, 0) + "}" * max(opens, 0)
                            try:
                                return json.loads(repaired)
                            except Exception:
                                pass
                    raise
            raise
    except Exception as e:
        raw_tail = raw[-200:] if raw is not None else "(no response body)"
        logging.error(f"[TRANSLATE_PREVIEW PARSE FAIL] lang={language} error={e!r} raw_tail={raw_tail!r}")
        return None


def translate_preview(result: dict, language: str) -> dict:
    """Translate the prose fields of an English /preview result into another
    language, merging translations back into a copy of the original. Player/
    manager 'name' values and the literal 'team' strings are NEVER translated —
    the frontend matches 'team' against the exact team name, and names should
    stay in Latin script per the existing preview prompt convention.

    Split into two Groq calls (analysis fields + players block), mirroring the
    generation split in main.py — a single combined call was running out of
    token budget on CJK/Arabic (translation output needs as much budget as the
    original two-call generation did, not less) and silently truncating
    mid-JSON, which fell back to untranslated English with no visible error.

    Each sub-call fails independently and safely: if one comes back invalid,
    that block stays in English while the other block (if it succeeded)
    still gets translated — partial translation beats none."""
    import copy
    from prompts import translate_preview_analysis_prompt, translate_preview_players_prompt

    wide = language in WIDE_TOKEN_LANGS
    analysis_tokens = (PREVIEW_TOKENS_ANALYSIS_WIDE if wide else PREVIEW_TOKENS_ANALYSIS) + (900 if wide else 600)
    players_tokens  = (PREVIEW_TOKENS_PLAYERS_WIDE  if wide else PREVIEW_TOKENS_PLAYERS)  + (500 if wide else 200)

    merged = copy.deepcopy(result)

    analysis_translated = _translate_preview_block(
        translate_preview_analysis_prompt(result, language), language, analysis_tokens
    )
    if analysis_translated:
        for field in ("headline", "h2h_snippet", "tactical_contrast", "unmissable_storyline"):
            if (analysis_translated.get(field) or "").strip():
                merged[field] = analysis_translated[field]
        for side in ("team_home", "team_away"):
            t_side = analysis_translated.get(side) or {}
            merged.setdefault(side, {})
            for field in ("style", "danger", "weakness"):
                if (t_side.get(field) or "").strip():
                    merged[side][field] = t_side[field]

    if result.get("players_to_watch"):
        players_translated = _translate_preview_block(
            translate_preview_players_prompt(result, language), language, players_tokens
        )
        if players_translated:
            t_players = players_translated.get("players_to_watch") or []
            for i, p in enumerate(merged.get("players_to_watch") or []):
                if i < len(t_players):
                    if (t_players[i].get("role") or "").strip():
                        p["role"] = t_players[i]["role"]
                    if (t_players[i].get("why") or "").strip():
                        p["why"] = t_players[i]["why"]

    return merged


def extract_names(text: str) -> list[str]:
    """Lightweight Groq call to extract individual footballer/manager full names from analysis text.
    Uses 8b-instant (cheapest/fastest) with max_tokens=80 — minimal token cost."""
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {
                "role": "system",
                "content": (
                    "You extract INDIVIDUAL footballer and manager full names from text. "
                    "Return ONLY a comma-separated list of real person full names. "
                    "LANGUAGE RULE: the text may be in a non-English language and may write a name in "
                    "native script followed by the Latin-script form in parentheses, e.g. '메시 (Messi)' "
                    "or 'ميسي (Messi)' or 'メッシ (Messi)'. In every such case you MUST return ONLY the "
                    "Latin-script form inside the parentheses ('Messi'), never the native-script form, "
                    "and never both. If a name appears ONLY in native script with no Latin form given "
                    "anywhere in the text, omit it entirely rather than transliterating it yourself. "
                    "Your entire output must be plain Latin/ASCII characters only — never include "
                    "Korean, Japanese, Chinese, Arabic, Cyrillic, or any other non-Latin script. "
                    "STRICT RULES — never include: "
                    "team names (e.g. 'Ghana', 'Croatia'), "
                    "group phrases (e.g. 'Ghana's players', 'Croatian midfielders', 'their defenders'), "
                    "possessives (anything with 's or of), "
                    "collective nouns (players, team, squad, defense, attack, forwards, midfielders, defenders, goalkeeper), "
                    "any phrase longer than 3 words. "
                    "ONLY include proper names of specific individual people like: Lionel Messi, Luka Modric, Hansi Flick. "
                    "No explanation, no numbering, no punctuation other than commas. "
                    "If no individual names found, return empty string."
                )
            },
            {"role": "user", "content": text}
        ],
        "temperature": 0,
        "max_tokens": 80,
    }
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type":  "application/json",
    }
    try:
        res = requests.post(GROQ_URL, headers=headers, json=payload, timeout=10)
        res.raise_for_status()
        raw = res.json()["choices"][0]["message"]["content"].strip()
        if not raw:
            return []
        names = [n.strip() for n in raw.split(",") if n.strip()]
        # Client-side safety filter: reject anything with possessives, plurals of group nouns,
        # or more than 4 words (no individual has a 5-word name in football context)
        GROUP_WORDS = {
            'players','player','team','squad','defense','defence','attack','midfielders',
            'midfielder','defenders','defender','goalkeeper','forwards','forward','strikers',
            'striker','backline','lineup','side','nation','nationals','stars','black',
        }
        filtered = []
        for name in names:
            low = name.lower()
            # Reject possessives
            if "'s" in low or "s'" in low:
                continue
            # Reject if any word is a group noun
            words = low.split()
            if any(w in GROUP_WORDS for w in words):
                continue
            # Reject if too many words (> 4)
            if len(words) > 4:
                continue
            # Reject single-word entries (not a full name)
            if len(words) < 2:
                continue
            # Safety net: the model is instructed to always normalize to the
            # Latin-script form (e.g. "Messi" not "메시"), but on non-English
            # answers it can still slip and return the native-script form or a
            # stray fragment. A name containing non-Latin characters is useless
            # downstream — the frontend's highlight regex only matches Latin
            # script, and an English-Wikipedia lookup on it either fails or
            # (worse) matches an unrelated article — so drop it here rather
            # than letting it surface as a broken highlight or a wrong player card.
            if not re.fullmatch(r"[A-Za-z\u00C0-\u024F'\-\.\s]+", name):
                continue
            filtered.append(name)
        return filtered
    except Exception:
        return []  # fail silently — frontend falls back to regex

def extract_entity_info(name: str, extract: str) -> dict:
    """
    Use 8b-instant to parse a Wikipedia extract into structured player/manager fields.
    Returns a dict with keys: type, nationality, position, club, currently_manages, age, born, awards
    Falls back to empty strings on any failure — never crashes.
    """
    schema = (
        '{"type":"player or manager",'
        '"nationality":"e.g. Turkish",'
        '"position":"e.g. Midfielder (players only, else empty)",'
        '"club":"current club for PLAYERS e.g. Inter Milan (empty for managers)",'
        '"currently_manages":"team managed NOW for MANAGERS e.g. Turkey (empty for players)",'
        '"born":"e.g. 1985 or 8 February 1985 (empty if unknown)",'
        '"age":"e.g. 39 (empty if unknown)",'
        '"awards":["actual trophies or individual awards won, max 4"]}'
    )
    rules = (
        "Rules: "
        "type=manager ONLY if the text explicitly states they currently coach/manage a team "
        "(e.g. 'is the manager of', 'head coach of', 'appointed manager'). "
        "type=player if the text describes them as an active or former footballer with no current "
        "managerial role stated. "
        "If the text is ambiguous, contradictory, or doesn't clearly support either role with direct "
        "evidence, do NOT guess — set type to \"unknown\" instead of forcing player or manager. "
        "Never infer type from name, team, or context outside the given text. "
        "club: players only — just the club name, never a league, never includes and/who/national. "
        "currently_manages: managers only — the team they manage RIGHT NOW, not clubs they played for. "
        "awards: real trophies or individual honours that are explicitly named in the text — never invent "
        "or assume awards that aren't directly stated. "
        "Empty string for unknown/not-applicable fields. Return ONLY the JSON object, nothing else."
    )
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {
                "role": "system",
                "content": (
                    "You extract structured biographical data about footballers and managers "
                    f"from Wikipedia text. Return ONLY valid JSON. Schema: {schema} {rules}"
                )
            },
            {
                "role": "user",
                "content": f"Name: {name}\n\nWikipedia extract:\n{extract[:1500]}"
            }
        ],
        "temperature": 0,
        "max_tokens": 220,
    }
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type":  "application/json",
    }
    empty = {
        "type": "player", "nationality": "", "position": "",
        "club": "", "currently_manages": "", "born": "", "age": "", "awards": []
    }
    try:
        res = requests.post(GROQ_URL, headers=headers, json=payload, timeout=10)
        res.raise_for_status()
        raw = res.json()["choices"][0]["message"]["content"].strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        import json
        data = json.loads(raw)
        return {
            "type":               data.get("type", "player"),
            "nationality":        data.get("nationality", ""),
            "position":           data.get("position", ""),
            "club":               data.get("club", ""),
            "currently_manages":  data.get("currently_manages", ""),
            "born":               data.get("born", ""),
            "age":                data.get("age", ""),
            "awards":             data.get("awards", [])[:4],
        }
    except Exception:
        return empty