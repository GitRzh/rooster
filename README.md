# Rooster — AI Football Match Autopsy

> Pick any FIFA World Cup 2026 match, ask why a team won or lost, and get a sharp ESPN-anchor-style breakdown — in 10 languages, with every player name backed by a real Wikipedia profile.

---

## What it does

Rooster turns post-match coverage into something you can actually interrogate. Most World Cup recaps are a scoreline and a wire-service paragraph, written for one language and one football culture, with nowhere to go once the article ends. Rooster fixes that by letting any fan, in their own language, ask the question they actually have.

**Features:**
- Pick a finished match and ask "Why did they win?", "Who dominated?", "Who underperformed?" — or type your own question
- Get a punchy TL;DR plus a 4–6 sentence narrative that names real players and real moments, not "the defense struggled" filler
- Click any player or manager name to pull up a validated card — nationality, position, club, age, honours — sourced live from Wikipedia
- Switch the whole experience into Spanish, French, Arabic, Portuguese, German, Korean, Chinese, Japanese, or Turkish, with player names kept in Latin script alongside the native-script translation
- Preview an upcoming match before kickoff — squad styles, head-to-head history, storylines worth watching — generated from football knowledge when no live data exists yet

---

## Tech Stack

| Layer | Details |
|---|---|
| Backend | Python, FastAPI |
| LLM | Llama 3.3 70B (analysis) + Llama 3.1 8B (auxiliary tasks) via Groq API |
| Match data | football-data.org API (fixtures, scores, stages, coaches) |
| Match reports | Docling — fetches and parses the relevant Wikipedia match article, with a 3-query fallback search |
| Player validation | Wikipedia API |
| Frontend | Vanilla JS, no framework, client-side router across five stages |
| Typography | IBM Plex |

---

## How it's built

**Data layer**
- `org_client.py` talks to football-data.org for live fixtures, scores, stages, and coach data.
- `docling_client.py` uses Docling to fetch and parse the relevant Wikipedia match article into clean, match-relevant text. If nothing relevant turns up, a 3-query fallback search kicks in, and if that still comes up empty the pipeline degrades gracefully instead of failing outright.

**Reasoning layer**
- Groq runs Llama 3.3 70B for the actual match analysis, and the much cheaper Llama 3.1 8B for auxiliary work — topic classification, name extraction, entity-field parsing — so the expensive model is only spent where it matters.
- A carefully engineered system prompt enforces an "ESPN anchor" voice: confident, specific, never hedging, and always naming real individuals instead of vague group phrases.
- For matches with no real report to draw from (upcoming or under-reported fixtures), the model is told explicitly that it has no play-by-play available, so it reasons about team-level style and history instead of inventing specific moments.

**Multilingual layer**
- Every analysis call can target any of 10 languages in a single pass, with a strict rule that player and manager names always carry their Latin-script form alongside the native-script rendering — so names stay accurate and stay linkable to English Wikipedia no matter what language the response is in.
- Pre-match previews are split into two smaller, independently-validated Groq calls instead of one big JSON blob. Non-Latin scripts burn through more tokens per character, and splitting the call made generation far more reliable for Korean, Japanese, Chinese, and Arabic output.

**Frontend**
- Vanilla JS, no framework — a small client-side router across five stages (hero search, question selection, loading, results, preview), with a persistent nav.
- Player names in the AI's output are checked against real Wikipedia data before they're highlighted or linked, so a name only becomes clickable once it's confirmed to actually correspond to a footballer or manager.

---

## Why this matters for the World Cup

Most football analysis tooling is built English-first and stats-first, but the World Cup is the one event on Earth that genuinely isn't. Two things matter here:

1. **Language shouldn't be the barrier to understanding the game.** A fan in Seoul or Riyadh deserves the same sharp, confident breakdown as a fan in London — not a flattened machine translation, but analysis that reads naturally in their language while staying factually grounded.
2. **Insight should be a conversation, not a wall of text.** Letting fans ask their own follow-up questions turns a static recap into something closer to how people actually talk about football with each other.

---

## What's next

- Full multilingual coverage across the whole app — UI chrome, error states, the entire Q&A flow — plus more languages beyond the current 10
- A visual layer per match: player heatmaps, fatigue/stress indicators over the 90 minutes, and playstyle fingerprints (possession-heavy vs counter-attacking, high press vs low block)
- Real squad-level grounding, pulling actual squad lists so every named player is verified eligible before the model generates a sentence
- Live, in-match analysis, extending the same breakdown style to matches still in progress
- Breaking past the World Cup 2026-only scope — supporting any historical match, any club competition, any continental tournament, and any era of football, not just FIFA fixtures, so the same "ask why they won" breakdown works for any match a fan wants to dig into

---

## Running locally

**1. Backend**
```bash
cd backend
pip install -r requirements.txt
```

Add your keys to `backend/.env`:
```
GROQ_API_KEY=gsk_your_key_here
ORG_API_KEY=your_football_data_org_key_here
```

Start it:
```bash
python main.py
```

Runs on `http://localhost:8000`.

**2. Frontend**
```bash
cd frontend
# open index.html directly, or use the Live Server extension in VS Code
```

The frontend expects the backend at `http://localhost:8000` — check `config.js` if you've moved it.

---

## Notes

- **Two-model setup is deliberate.** Llama 3.3 70B is reserved for the actual analysis; everything cheaper and more mechanical runs on Llama 3.1 8B, which keeps the whole thing fast without sacrificing the quality of the part that needs it.
- **Player links are never just generated text.** Every highlighted name has been checked against Wikipedia first — if it can't be confirmed, it doesn't get linked.
- **Pre-match previews don't hallucinate plays.** When there's no real match report to ground on, the model is explicitly told so, and reasons about team style and history instead.

---

*Built for the IBM SkillsBuild AI Builders Challenge — June: AI Inside the Match*