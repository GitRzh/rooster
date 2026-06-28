"""
groq_client.py
Single Groq call, language-aware, rate limit retry.
"""

import os
import time
import requests
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL     = "https://api.groq.com/openai/v1/chat/completions"
MODEL        = "llama-3.3-70b-versatile"
FALLBACK     = "llama-3.1-8b-instant"
MAX_TOKENS   = 500  # bumped from 350 — custom questions may need more room


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

    res = requests.post(GROQ_URL, headers=headers, json=payload, timeout=30)

    if res.status_code == 429:
        time.sleep(12)
        payload["model"] = FALLBACK
        res = requests.post(GROQ_URL, headers=headers, json=payload, timeout=30)
        if res.status_code == 429:
            time.sleep(20)
            res = requests.post(GROQ_URL, headers=headers, json=payload, timeout=30)

    if not res.ok:
        return f"Analysis unavailable right now (API error {res.status_code}). Try again in a moment."
    return res.json()["choices"][0]["message"]["content"].strip()

def extract_names(text: str) -> list[str]:
    """Lightweight Groq call to extract footballer/manager full names from analysis text.
    Uses 8b-instant (cheapest/fastest) with max_tokens=80 — minimal token cost."""
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {
                "role": "system",
                "content": (
                    "You extract names of footballers and managers from text. "
                    "Return ONLY a comma-separated list of full names exactly as they appear. "
                    "No explanation, no numbering, no punctuation other than commas. "
                    "Include hyphenated names (Al-Hussein), accented names (Éló), prefixes (De Bruyne, Van Dijk). "
                    "If no names found, return empty string."
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
        return [n.strip() for n in raw.split(",") if n.strip()]
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
        "type=manager if they currently coach/manage a team, else type=player. "
        "club: players only — just the club name, never a league, never includes and/who/national. "
        "currently_manages: managers only — the team they manage RIGHT NOW, not clubs they played for. "
        "awards: real trophies or individual honours won — NOT leagues they merely play in. "
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