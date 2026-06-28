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


def complete(system: str, user_prompt: str, language: str = "English") -> str:
    lang_note = (
        "" if language.lower() == "english"
        else f"\n\nRespond entirely in {language}. Do not use English at all."
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
