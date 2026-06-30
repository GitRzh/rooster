// ============================================================
//  stage4-result.js — Results: 65/35 split, rich player/manager cards
// ============================================================

import {
  flagUrl, wikiUrl, fetchWikiData,
  extractPlayerNames, extractPlayerNamesFromBackend, highlightPlayersAsync, highlightPlayersDeduped,
  escapeHtml, getApiLang, API_BASE, t,
} from './config.js';
import { attachNavListeners } from './nav.js';

// ── Section header icons ────────────────────────────────────
const ICON_TLDR = `<svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11" aria-hidden="true"><path d="M13 2 3 14h7l-1 8 11-13h-7l1-7z"/></svg>`;
const ICON_NARRATIVE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/></svg>`;

// Bumped on every renderResult() call. Async highlight passes capture the
// value at start and check it before writing to the DOM — if a newer render
// has started in the meantime, the stale pass silently no-ops instead of
// stomping fresh HTML with a half-finished/race-corrupted string.
let resultRenderGen = 0;

function getQuestionLabel(qtype) {
  const map = {
    why_winner:         t('q_why_winner_title'),
    why_loser:          t('q_why_loser_title'),
    who_dominated:      t('q_who_dominated_title'),
    who_underperformed: t('q_who_underperformed_title'),
    custom:             t('q_custom_sub'),
  };
  return map[qtype] || 'Analysis';
}

// ── Error / info card builders ──────────────────────────────
// Used for backend failures, draw-blocked questions, and "too soon" states.
// message is expected to already be escaped by the caller where it comes
// from untrusted/dynamic text (see escapeHtml() calls at each call site).
function errorCard(message) {
  return `
    <div class="answer-card answer-card-error">
      <div class="answer-card-head">⚠ Error</div>
      <div class="answer-card-body">${message}</div>
    </div>
  `;
}

function infoCard(title, message) {
  return `
    <div class="answer-card">
      <div class="answer-card-head">${title}</div>
      <div class="answer-card-body">${message}</div>
    </div>
  `;
}

export function renderResult(container, state, onNavigate) {
  const myGen  = ++resultRenderGen;
  const match  = state.pinnedMatch;
  const result = state.analysisResult;
  const qtype  = state.selectedQuestion;
  const isQA   = qtype === 'custom' || state.isCustomQA;

  if (!match) { onNavigate('hero'); return; }

  const winner = match.winner || match.home;
  const loser  = match.loser  || match.away;
  const qLabel = getQuestionLabel(qtype);

  const hFlag = flagUrl(match.home, 80);
  const aFlag = flagUrl(match.away, 80);

  container.innerHTML = `
    <div class="result-body stage" id="result-stage">

      <!-- LEFT 65% -->
      <div class="result-left">

        <div class="result-pinned-bar">
          <div class="result-pinned-badge">
            <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
            PINNED
          </div>
          <div class="result-match-display">
            <div class="result-team-block">
              ${hFlag
                ? `<img src="${hFlag}" alt="${match.home}" class="result-team-flag"
                    onerror="this.outerHTML='<div class=\\'result-team-flag flag-placeholder\\'></div>'">`
                : `<div class="result-team-flag flag-placeholder"></div>`}
              <span class="result-team-name">${match.home}</span>
            </div>
            <div class="result-score-block">
              <div class="result-match-meta">${match.stage || ''}</div>
              <div class="result-score-str">${match.score_home ?? ''}–${match.score_away ?? ''}</div>
              <div class="result-match-date">${match.date || ''}</div>
            </div>
            <div class="result-team-block">
              ${aFlag
                ? `<img src="${aFlag}" alt="${match.away}" class="result-team-flag"
                    onerror="this.outerHTML='<div class=\\'result-team-flag flag-placeholder\\'></div>'">`
                : `<div class="result-team-flag flag-placeholder"></div>`}
              <span class="result-team-name">${match.away}</span>
            </div>
          </div>
          <div class="result-header-right">
            <span class="result-q-badge">${qLabel}</span>
            <button class="btn-back" id="back-to-insight" aria-label="Back to questions">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="11" height="11" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
              ${t('questions_btn')}
            </button>
          </div>
        </div>

        <!-- Scrollable content frame — same border-fade + bottom hue as preview -->
        <div class="result-content-frame-wrap" id="result-frame-wrap">
          <div id="answer-area" class="answer-section result-content-frame">
            <div class="answer-card">
              <div class="answer-card-head">Loading analysis…</div>
            </div>
          </div>
        </div>

      </div>

      <!-- RIGHT 35% -->
      <aside class="result-right" id="result-right">
        <div class="result-right-label" id="result-right-label" style="display:none"></div>
        <div id="entity-panel">
          <div class="entity-card-empty">${t('hover_hint')}</div>
          <div class="result-right-hint">${t('hover_hint')}</div>
        </div>
      </aside>

    </div>

    <style>
      body { overflow: hidden !important; height: 100vh !important; }

      #result-stage {
        height: calc(100vh - var(--nav-h) - var(--ticker-h));
        min-height: unset;
        overflow: hidden;
      }

      #result-stage .result-left {
        height: 100%;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        padding-bottom: 0;
      }

      #result-stage .result-pinned-bar { flex-shrink: 0; }

      #result-stage .result-right {
        height: 100%;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      /* ── Content frame: border-fade top, bottom hue, internal scroll ── */
      .result-content-frame-wrap {
        flex: 1;
        min-height: 0;
        margin: 16px 28px 0;
        position: relative;
        overflow: hidden;
      }

      .result-content-frame-wrap::before {
        content: '';
        position: absolute;
        inset: 0;
        border-top: 1px solid rgba(245,230,66,0.3);
        border-left: 1px solid rgba(245,230,66,0.3);
        border-right: 1px solid rgba(245,230,66,0.3);
        border-bottom: none;
        border-radius: var(--radius-md) var(--radius-md) 0 0;
        -webkit-mask-image: linear-gradient(to bottom, black 0%, transparent 40%);
        mask-image: linear-gradient(to bottom, black 0%, transparent 40%);
        pointer-events: none;
        z-index: 1;
      }

      .result-content-frame-wrap::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 52px;
        background: linear-gradient(to top, var(--bg) 0%, transparent 100%);
        pointer-events: none;
        border-radius: 0 0 var(--radius-md) var(--radius-md);
        transition: opacity 0.25s;
        z-index: 2;
      }
      .result-content-frame-wrap.at-end::after { opacity: 0; }

      .result-content-frame {
        height: 100%;
        overflow-y: auto;
        padding: 16px 16px 60px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        position: relative;
        z-index: 0;
      }

      .answer-card-head { display: flex; align-items: center; gap: 6px; }
      .answer-card-head svg { flex-shrink: 0; }
    </style>
  `;

  attachNavListeners(container, onNavigate);
  container.querySelector('#back-to-insight').addEventListener('click', () => {
    document.body.style.overflow = '';
    document.body.style.height   = '';
    onNavigate('insight');
  });
  container.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => {
      document.body.style.overflow = '';
      document.body.style.height   = '';
    });
  });

  if (isQA) {
    attachQAResult(container, result, match, state, onNavigate, myGen).catch(e => console.error("QA result error:", e));
  } else {
    renderAnswerCards(container, result, match, myGen);
  }

  // ── Scroll fade hue on content frame ──
  const frameEl     = container.querySelector('.result-content-frame');
  const frameWrapEl = container.querySelector('.result-content-frame-wrap');
  if (frameEl && frameWrapEl) {
    const checkFrameFade = () => {
      const atEnd = frameEl.scrollHeight - frameEl.scrollTop - frameEl.clientHeight < 8;
      frameWrapEl.classList.toggle('at-end', atEnd);
    };
    frameEl.addEventListener('scroll', checkFrameFade, { passive: true });
    setTimeout(checkFrameFade, 100);
    // Re-check after async content (answer cards / QA) finishes rendering
    const mo = new MutationObserver(() => setTimeout(checkFrameFade, 50));
    mo.observe(frameEl, { childList: true, subtree: true });
  }
}

// ── Answer cards (async — validates player names) ─────────────
async function renderAnswerCards(container, result, match, myGen) {
  const areaEl = container.querySelector('#answer-area');
  if (!areaEl) return;

  if (!result) {
    areaEl.innerHTML = errorCard('No analysis returned. Make sure the backend is running on :8000.');
    return;
  }

  if (result.draw_blocked) { areaEl.innerHTML = infoCard('Draw Match', escapeHtml(result.answer)); return; }
  if (result.too_soon)     { areaEl.innerHTML = infoCard('Too Soon',   escapeHtml(result.answer)); return; }
  if (result.error)        { areaEl.innerHTML = errorCard(escapeHtml(result.answer));              return; }

  const answer = result.answer || 'No analysis available.';

  // Parse TLDR/NARRATIVE by label (robust), strip labels from output
  const parseAnswer = (raw) => {
    const tldrMatch = raw.match(/TLDR[;,]?[:\s-]*([\s\S]*?)(?=NARRATIVE[:\s-]|$)/i);
    const narrMatch = raw.match(/NARRATIVE[:\s-]*([\s\S]*?)$/i);
    const tldr = (tldrMatch ? tldrMatch[1] : raw).trim();
    const narr = (narrMatch ? narrMatch[1] : '').trim();
    return { tldr: tldr || raw, narr: narr || raw };
  };

  const { tldr, narr: full } = parseAnswer(answer);

  if (myGen !== resultRenderGen) return; // a newer render started — abandon this one

  areaEl.innerHTML = `
    <div class="answer-card" id="card-tldr">
      <div class="answer-card-head">${ICON_TLDR}${t('tldr')}</div>
      <div class="answer-card-body" id="tldr-body">${escapeHtml(tldr)}</div>
    </div>
    <div class="answer-card answer-card-narrative" id="card-full">
      <div class="answer-card-head">${ICON_NARRATIVE}${t('full_narrative')}</div>
      <div class="answer-card-body answer-card-body-scroll" id="full-body">${escapeHtml(full)}</div>
      <div class="answer-fade-hue" aria-hidden="true"></div>
    </div>
  `;
  attachNarrativeFade(container);

  const names = await extractPlayerNamesFromBackend(answer);
  if (myGen !== resultRenderGen) return; // bail before kicking off Wikipedia validation for a stale render

  if (names.length) {
    // Highlight across both blocks so each name only gets a link on first occurrence.
    const { tldrHl, fullHl } = await highlightPlayersDeduped(tldr, full, names);
    if (myGen !== resultRenderGen) return; // bail before the final DOM write

    const tldrEl = container.querySelector('#tldr-body');
    const fullEl = container.querySelector('#full-body');
    if (tldrEl) tldrEl.innerHTML = tldrHl;
    if (fullEl) fullEl.innerHTML = fullHl;

    attachPlayerHovers(container, match);
    attachNarrativeFade(container);
  }
}

// ── Q&A result — TLDR + Narrative like other tabs ─────────────
async function attachQAResult(container, result, match, state, onNavigate, myGen) {
  const areaEl = container.querySelector('#answer-area');
  if (!areaEl) return;

  if (!result) {
    areaEl.innerHTML = errorCard('No analysis returned. Make sure the backend is running on :8000.');
    return;
  }

  // Off-topic — show the question asked + warning below it, no analysis cards
  if (result.off_topic || result.rejected) {
    const qAsked = state.customQuestion ? escapeHtml(state.customQuestion) : '';
    areaEl.innerHTML = `
      ${qAsked ? `<div class="qa-result-question">"${qAsked}"</div>` : ''}
      <div class="answer-card" style="border-color:rgba(239,68,68,0.35);">
        <div class="answer-card-body" style="display:flex;flex-direction:column;gap:0.5rem;padding:1.25rem;">
          <div style="color:#ef4444;font-weight:700;font-size:0.95rem;">
            ⚠ ${t('off_topic_msg')}
          </div>
          <div style="color:rgba(255,255,255,0.4);font-size:0.8rem;">
            ${t('off_topic_hint')}
          </div>
        </div>
      </div>
    `;
    // Show try-again prompt in the right entity panel
    const panelEl = container.querySelector('#entity-panel');
    if (panelEl) {
      panelEl.innerHTML = `
        <div style="padding:24px 18px;display:flex;flex-direction:column;gap:12px;align-items:center;text-align:center;">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--yellow);">Ask Again</div>
          <div style="font-size:12px;color:var(--muted-bright);line-height:1.6;">
            Ask something about the match — a player's performance, a tactical decision, a key moment, or a "what if" scenario.
          </div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--muted);line-height:1.7;text-align:left;width:100%;padding:10px 12px;background:var(--bg-card);border-radius:var(--radius-sm);border:1px solid var(--border);">
            e.g. "Why didn't the manager sub earlier?"<br>
            e.g. "Who was the best player on the pitch?"<br>
            e.g. "What if Haaland had started?"
          </div>
          <button id="qa-ask-again-btn" style="font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;background:var(--blue);color:var(--yellow);border:none;border-radius:var(--radius-sm);padding:8px 16px;cursor:pointer;width:100%;margin-top:4px;display:flex;align-items:center;justify-content:center;gap:7px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>
            ${t('ask_again_btn')}
          </button>
        </div>
      `;
    }
    // Wire ask-again to navigate back to insight
    const askAgainBtn = container.querySelector('#qa-ask-again-btn');
    if (askAgainBtn && onNavigate) askAgainBtn.addEventListener('click', () => onNavigate('insight'));
    return;
  }

  // Blocked / error — centred neutral message
  if (result.draw_blocked || result.too_soon || result.error) {
    const msg = escapeHtml(result.answer || 'This question could not be answered.');
    areaEl.innerHTML = `
      <div class="qa-rejected-wrap">
        <div class="qa-rejected-icon" aria-hidden="true">✦</div>
        <div class="qa-rejected-msg">${msg}</div>
      </div>
    `;
    return;
  }

  // Normal answer — same TLDR + Full Narrative layout as other tabs
  const answer = result.answer || 'No analysis available.';


  // Parse TLDR/NARRATIVE by label (robust), strip labels from output
  const parseAnswer = (raw) => {
    const tldrMatch = raw.match(/TLDR[;,]?[:\s-]*([\s\S]*?)(?=NARRATIVE[:\s-]|$)/i);
    const narrMatch = raw.match(/NARRATIVE[:\s-]*([\s\S]*?)$/i);
    const tldr = (tldrMatch ? tldrMatch[1] : raw).trim();
    const narr = (narrMatch ? narrMatch[1] : '').trim();
    return { tldr: tldr || raw, narr: narr || raw };
  };

  const { tldr: tldrClean, narr: fullClean } = parseAnswer(answer);
  const qAsked = state.customQuestion ? escapeHtml(state.customQuestion) : '';

  areaEl.innerHTML = `
    ${qAsked ? `<div class="qa-result-question">"${qAsked}"</div>` : ''}
    <div class="answer-card" id="card-tldr">
      <div class="answer-card-head">${ICON_TLDR}${t('tldr')}</div>
      <div class="answer-card-body" id="tldr-body">${escapeHtml(tldrClean)}</div>
    </div>
    <div class="answer-card answer-card-narrative" id="card-full">
      <div class="answer-card-head">${ICON_NARRATIVE}${t('full_narrative')}</div>
      <div class="answer-card-body answer-card-body-scroll" id="full-body">${escapeHtml(fullClean)}</div>
      <div class="answer-fade-hue" aria-hidden="true"></div>
    </div>
  `;
  attachNarrativeFade(container);

  const names = await extractPlayerNamesFromBackend(answer);
  if (myGen !== resultRenderGen) return; // a newer render started — abandon this one

  if (names.length) {
    // Dedup: first occurrence across tldr+full gets the link, rest are plain
    const { tldrHl, fullHl } = await highlightPlayersDeduped(tldrClean, fullClean, names);
    if (myGen !== resultRenderGen) return; // bail before the final DOM write

    const tldrEl = container.querySelector('#tldr-body');
    const fullEl = container.querySelector('#full-body');
    if (tldrEl) tldrEl.innerHTML = tldrHl;
    if (fullEl) fullEl.innerHTML = fullHl;
    attachPlayerHovers(container, match);
    attachNarrativeFade(container);
  }
}


function renderQAShell() {
  return `
    <div class="qa-chat-wrap">
      <div class="qa-messages" id="qa-messages">
        <div class="entity-card-empty qa-hint">
          Ask anything about this match — tactics, players, moments, decisions.
        </div>
      </div>
      <div class="qa-input-row">
        <textarea class="qa-input" id="qa-input"
          placeholder="Why didn't the manager make a sub earlier?…"
          rows="1"
          aria-label="Ask a question about this match"></textarea>
        <button class="qa-send-btn" id="qa-send" aria-label="Send question">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  `;
}

function attachQAChat(container, match, state) {
  const input   = container.querySelector('#qa-input');
  const sendBtn = container.querySelector('#qa-send');
  const msgList = container.querySelector('#qa-messages');
  if (!input || !sendBtn || !msgList) return;

  async function sendQuestion() {
    const q = input.value.trim();
    if (!q) return;
    input.value = '';
    input.style.height = 'auto';

    msgList.querySelector('.qa-hint')?.remove();

    const tempId = `qa-msg-${Date.now()}`;
    const tempEl = document.createElement('div');
    tempEl.className = 'qa-msg';
    tempEl.id = tempId;
    tempEl.innerHTML = `
      <div class="qa-msg-q">${escapeHtml(q)}</div>
      <div class="qa-thinking">Analyzing<span class="qa-dots">…</span></div>
    `;
    msgList.appendChild(tempEl);
    msgList.scrollTop = msgList.scrollHeight;

    try {
      const lang = getApiLang();
      const res  = await fetch(`${API_BASE}/analyze`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fixture_id:      match.id,
          home:            match.home,
          away:            match.away,
          date:            match.date,
          score_home:      match.score_home,
          score_away:      match.score_away,
          winner:          match.winner,
          loser:           match.loser,
          is_draw:         match.is_draw || false,
          stage:           match.stage || '',
          // Pass through what org_client._fmt_match() already computed for
          // this match (raw_stage, group, goals — including its wiki_goals
          // fallback) instead of letting the backend re-derive raw_stage by
          // reverse-parsing `stage` and re-fetch goals from Wikipedia a
          // second time. Falls back to undefined (backend handles that)
          // if this match object came from a path that doesn't carry them.
          raw_stage:       match.raw_stage,
          group:           match.group,
          goals:           match.goals,
          question_type:   'custom',
          custom_question: q,
          language:        lang,
        }),
      });

      const data   = await res.json();
      const answer = data.answer || 'No response.';
      const names  = await extractPlayerNamesFromBackend(answer);
      const ansHl  = names.length ? await highlightPlayersAsync(answer, names) : escapeHtml(answer);

      const el = container.querySelector(`#${tempId}`);
      if (el) {
        el.innerHTML = `
          <div class="qa-msg-q">${escapeHtml(q)}</div>
          <div class="qa-answer">${ansHl}</div>
        `;
        attachPlayerHovers(container, match);
      }
    } catch (err) {
      const el = container.querySelector(`#${tempId}`);
      if (el) el.innerHTML = `
        <div class="qa-msg-q">${escapeHtml(q)}</div>
        <div class="qa-error">Failed to get answer. Check backend is running.</div>
      `;
    }

    msgList.scrollTop = msgList.scrollHeight;
  }

  sendBtn.addEventListener('click', sendQuestion);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendQuestion(); }
  });
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
  });
}

// ── Player click → rich right panel ──────────────────────────
// ── Scroll fade hue on the Full Narrative card (same pattern as preview) ──
function attachNarrativeFade(container) {
  const scrollEl = container.querySelector('#full-body');
  const cardEl   = container.querySelector('#card-full');
  if (!scrollEl || !cardEl) return;
  const checkFade = () => {
    const atEnd = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight < 8;
    cardEl.classList.toggle('at-end', atEnd);
  };
  scrollEl.addEventListener('scroll', checkFade, { passive: true });
  setTimeout(checkFade, 100);
}

function attachPlayerHovers(container, match) {
  container.querySelectorAll('.player-hl').forEach(hl => {
    const fresh = hl.cloneNode(true);
    hl.replaceWith(fresh);
  });

  // Known managers for THIS match — ground truth from football-data.org,
  // not a guess. Used to force-classify hover cards instead of trusting
  // the LLM/regex classifier, which can be fooled by ambiguous bios.
  const knownCoaches = [match?.home_coach, match?.away_coach]
    .filter(Boolean)
    .map(n => n.toLowerCase().trim());

  let activeName = null;

  container.querySelectorAll('.player-hl').forEach(hl => {
    hl.addEventListener('click', async (e) => {
      e.preventDefault();
      const name = hl.dataset.name;
      if (!name || activeName === name) return;
      activeName = name;
      const forcedType = knownCoaches.includes(name.toLowerCase().trim()) ? 'manager' : null;
      await loadEntityCard(container, name, forcedType);
    });
  });
}

// ── Rich entity card ──────────────────────────────────────────
async function loadEntityCard(container, name, forcedType = null) {
  const panel = container.querySelector('#entity-panel');
  if (!panel) return;

  panel.innerHTML = `
    <div class="entity-loading">
      <div class="mvp-spinner"></div>
      <span>Loading ${escapeHtml(name)}…</span>
    </div>
  `;

  const wikiData = await fetchWikiData(name, true);

  if (!wikiData) {
    panel.innerHTML = `
      <div class="entity-card-empty">
        No footballer Wikipedia article found for
        <strong style="color:var(--yellow)">${escapeHtml(name)}</strong>.
      </div>
    `;
    return;
  }

  const extract  = wikiData.extract || '';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  // LLM-powered structured extraction — replaces all brittle regex parsers
  let info = null;
  try {
    const res = await fetch(`${API_BASE}/extract-entity`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, extract }),
    });
    if (res.ok) info = await res.json();
  } catch { /* fall through to regex fallback */ }

  const isMgr = forcedType === 'manager'
    ? true
    : info && info.type !== 'unknown'
      ? info.type === 'manager'
      : /manager|coach|head coach|managed|coaching/i.test(extract);

  const labelEl = container.querySelector('#result-right-label');
  if (labelEl) {
    const icon = isMgr
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9h18"/><path d="M9 4v5"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>`;
    labelEl.innerHTML = `${icon}<span>${isMgr ? t('manager_info') : t('player_info')}</span>`;
    labelEl.style.display = 'flex';
  }

  panel.innerHTML = isMgr
    ? buildManagerCard(name, wikiData, extract, initials, info)
    : buildPlayerCard(name, wikiData, extract, initials, info);
}

// ── Position → colour (matches ROOSTER palette) ───────────────
function positionColor(pos) {
  if (!pos) return 'var(--muted)';
  const p = pos.toLowerCase();
  if (/goalkeeper/.test(p))                       return '#F5E642'; // --yellow
  if (/defender|back/.test(p))                    return '#2D35E8'; // --blue
  if (/midfielder/.test(p))                       return '#22c55e'; // green
  if (/forward|striker|winger|attacker/.test(p))  return '#ef4444'; // --red
  return 'var(--muted)';
}

// ── Sanitize LLM string fields — treat placeholder strings as missing ─
function clean(val) {
  if (!val) return null;
  const s = String(val).trim();
  if (/^(empty|unknown|n\/a|none|null|undefined|-)$/i.test(s)) return null;
  return s || null;
}

// ── Player card ───────────────────────────────────────────────
function buildPlayerCard(name, wikiData, extract, initials, info = null) {
  const url      = wikiData.url;
  // Prefer LLM-extracted info; fall back to regex for each field individually
  const nat      = clean(info?.nationality) || parseNationality(extract);
  const pos      = clean(info?.position)    || parsePosition(extract);
  const club     = clean(info?.club)        || parseClub(extract);
  const posColor = positionColor(pos);
  const born     = clean(info?.born)        || parseBorn(extract);
  const age      = clean(info?.age)         || (born ? computeAge(born) : null);
  const wcGoals  = parseWCGoals(extract);
  const awards   = (info?.awards?.length ? info.awards : null) || parseAwards(extract);

  const rows = [
    nat     && { label: t('stat_nationality'),  val: nat,               color: null },
    pos     && { label: t('stat_position'),     val: pos,               color: posColor },
    club    && { label: t('stat_club'),         val: club,              color: null },
    age     && { label: t('stat_age'),          val: age,               color: null },
    wcGoals && { label: t('stat_wc_goals'),     val: wcGoals,           color: null },
    awards.length && { label: t('stat_awards'), val: awards.join(', '), color: null },
  ].filter(Boolean);

  return `
    <div class="entity-card">
      <div class="entity-photo-wrap">
        ${wikiData.thumbnail
          ? `<img src="${wikiData.thumbnail}" alt="${escapeHtml(name)}" class="entity-photo-img"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
          : ''}
        <div class="entity-photo-placeholder" style="${wikiData.thumbnail ? 'display:none' : ''}">${initials}</div>
      </div>
      <div class="entity-info">
        <div class="entity-name-row">
          <div class="entity-name">
            <a href="${url}" target="_blank" rel="noopener">${escapeHtml(name)}</a>
          </div>
          <a href="${url}" target="_blank" rel="noopener" class="wiki-link-icon" title="Wikipedia">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </div>
        <span class="entity-type-badge player-badge">Player</span>
      </div>

      <div class="entity-stats">
        ${rows.map(r => `
          <div class="entity-stat">            <span class="es-label">${r.label}</span>
            <span class="es-val" ${r.color ? `style="color:${r.color};font-weight:600"` : ''}>${r.val}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ── Manager card ──────────────────────────────────────────────
function buildManagerCard(name, wikiData, extract, initials, info = null) {
  const url         = wikiData.url;
  const nat         = clean(info?.nationality)       || parseNationality(extract);
  // For managers, LLM returns currently_manages (team they manage now)
  // club field on managers = team they manage, not a playing club
  const curRole     = clean(info?.currently_manages) || clean(info?.club) || parseCurrentRole(extract);
  const prevManaged = parsePreviouslyManaged(extract);
  const yearsActive = parseYearsActive(extract);
  const trophies    = (info?.awards?.length ? info.awards : null) || parseHonours(extract);

  const rows = [
    nat         && { label: t('stat_nationality'),        val: nat },
    curRole     && { label: t('stat_currently_manages'),  val: curRole },
    prevManaged && { label: t('stat_previously_managed'), val: prevManaged },
    yearsActive && { label: t('stat_years_active'),       val: yearsActive },
    trophies.length && { label: t('stat_trophies'),       val: trophies.join(', ') },
  ].filter(Boolean);

  return `
    <div class="entity-card">
      <div class="entity-photo-wrap">
        ${wikiData.thumbnail
          ? `<img src="${wikiData.thumbnail}" alt="${escapeHtml(name)}" class="entity-photo-img"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
          : ''}
        <div class="entity-photo-placeholder" style="${wikiData.thumbnail ? 'display:none' : ''}">${initials}</div>
      </div>
      <div class="entity-info">
        <div class="entity-name-row">
          <div class="entity-name">
            <a href="${url}" target="_blank" rel="noopener">${escapeHtml(name)}</a>
          </div>
          <a href="${url}" target="_blank" rel="noopener" class="wiki-link-icon" title="Wikipedia">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </div>
        <span class="entity-type-badge manager-badge">Manager</span>
      </div>

      <div class="entity-stats">
        ${rows.map(r => `
          <div class="entity-stat">
            <span class="es-label">${r.label}</span>
            <span class="es-val">${r.val}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ── Parsers ───────────────────────────────────────────────────
function parseNationality(text) {
  // Two-pass: find nationality adjective before footballer/manager/coach
  // Pass 1: strict — nationality word immediately before football keyword (skip adjectives)
  const SKIP = /^(?:professional|former|retired|international|association)$/i;
  const NAT_RE = /is (?:a |an )?((?:[A-Z][a-z]+(?:-[A-Z][a-z]+)?\s+)*)([A-Z][a-z]+(?:-[A-Z][a-z]+)?)\s+(?:football(?:er| manager| coach)?|manager|coach)/i;
  const m = text.match(NAT_RE);
  if (!m) return null;
  // m[2] is the last capitalised word before the football keyword
  // m[1] is any words before it — walk backwards to find the nationality
  const candidate = m[2].trim();
  if (!SKIP.test(candidate)) return candidate;
  // candidate was an adjective — try the word before it
  const words = (m[1] || '').trim().split(/\s+/).filter(Boolean);
  for (let i = words.length - 1; i >= 0; i--) {
    if (!SKIP.test(words[i])) return words[i].replace(/-$/, '');
  }
  return null;
}

function parsePosition(text) {
  const m = text.match(/(goalkeeper|defender|centre-back|full-back|wing-back|midfielder|central midfielder|attacking midfielder|defensive midfielder|winger|forward|striker|centre-forward)/i);
  return m ? capitalize(m[1]) : null;
}

function parseBorn(text) {
  const m = text.match(/born\s+(?:on\s+)?(\d+\s+\w+\s+\d{4}|\d{4})/i);
  return m ? m[1] : null;
}

function parseClub(text) {
  const LEAGUES = [
    'Bundesliga', 'Premier League', 'La Liga', 'Serie A', 'Ligue 1',
    'MLS', 'Eredivisie', 'Primeira Liga', 'Super Lig', 'Süper Lig',
  ];
  // Stop capture at: in the, since, on loan, and, who, where, ,  .  (
  const m = text.match(/(?:plays|playing|contracted to|joining|joined)\s+for\s+([A-Z][A-Za-z\s]+?)(?:\s+(?:in the|since|on loan|and\s|who\s|where\s|F\.?C\.?)|[,.(]|$)/i)
         || text.match(/(?:is a|was a)\s+[A-Za-z\s]+?\s+for\s+([A-Z][A-Za-z\s]{2,25}?)(?:\s*(?:and|who|where)|[,.(]|$)/i);
  if (!m) return null;
  const club = m[1].trim();
  if (LEAGUES.some(l => club === l || club.endsWith(l))) return null;
  // Reject if it looks like a sentence fragment (contains lowercase connector words)
  if (/\b(and|the|who|where|captains|national)\b/i.test(club)) return null;
  return club;
}

function parseFormerClub(text) {
  const m = text.match(/(?:played for|career at|clubs? include[ds]?)\s+([A-Z][A-Za-z\s,&]+?)(?:\.|,|and|before)/i);
  return m ? m[1].trim().slice(0, 40) : null;
}

function parseCurrentRole(text) {
  const m = text.match(/(?:is (?:the |a )?(?:current )?(?:head )?(?:manager|coach|assistant manager|assistant coach) of\s+)([A-Z][A-Za-z\s]+?)(?:\s+F\.?C\.?)?[,.\s]/i);
  return m ? m[1].trim() : null;
}

function parsePreviouslyManaged(text) {
  const m = text.match(/(?:previously|formerly|previously managed|managed|coached)\s+(?:by\s+)?([A-Z][A-Za-z\s]+?)(?:\s+F\.?C\.?)?(?:\s+from|\s+between|\s+in|,|\.)/i)
         || text.match(/(?:manager|coach) of\s+([A-Z][A-Za-z\s]+?)(?:\s+F\.?C\.?)?(?:\s+from|\s+between|\s+in|,|\.)/i);
  return m ? m[1].trim().slice(0, 40) : null;
}

function parseGoals(text) {
  // Look for "X goals" or "scored X" patterns
  const m = text.match(/(?:scored|scoring)\s+(\d+)\s+goals/i)
         || text.match(/(\d+)\s+(?:career\s+)?goals/i);
  return m ? m[1] : null;
}

function parseCaps(text) {
  const m = text.match(/(\d+)\s+(?:international\s+)?caps/i)
         || text.match(/(?:earned|won|gained)\s+(\d+)\s+caps/i);
  return m ? m[1] : null;
}

function parseWCGoals(text) {
  // Look for goals at the current / most recent World Cup (2026)
  const m = text.match(/(?:2026\s+(?:FIFA\s+)?World\s+Cup[^.]*?scored?\s+(\d+)\s+goals?|(\d+)\s+goals?\s+(?:at|in)\s+(?:the\s+)?2026)/i);
  return m ? (m[1] || m[2]) : null;
}

function parsePrevWCGoals(text) {
  // Look for goals at the 2022 World Cup
  const m = text.match(/(?:2022\s+(?:FIFA\s+)?World\s+Cup[^.]*?scored?\s+(\d+)\s+goals?|(\d+)\s+goals?\s+(?:at|in)\s+(?:the\s+)?2022)/i);
  return m ? (m[1] || m[2]) : null;
}

function parseAwards(text) {
  // Individual awards — present in text = won it
  const INDIVIDUAL = [
    "Ballon d'Or", 'FIFA Best', 'Golden Boot', 'Golden Ball', 'Golden Glove',
    'UEFA Best Player', "PFA Players' Player of the Year", 'FWA Footballer of the Year',
    'Premier League Player of the Season', 'UEFA Champions League Player',
  ];
  // Team trophies — only count if adjacent to trophy/winner language, not just mentioned as a league
  const TEAM_TROPHIES = [
    { label: 'Champions League', pattern: /won|winner|champion|trophy|title|lifted|medal/i },
    { label: 'World Cup',        pattern: /won|winner|champion|trophy|title|lifted|medal/i },
    { label: 'Copa América',     pattern: /won|winner|champion|trophy|title|lifted|medal/i },
    { label: 'Euro ',            pattern: /won|winner|champion|trophy|title|lifted|medal/i },
    { label: 'FA Cup',           pattern: /won|winner|champion|trophy|title|lifted|medal/i },
    { label: 'Copa del Rey',     pattern: /won|winner|champion|trophy|title|lifted|medal/i },
    { label: 'La Liga',          pattern: /won|winner|champion|trophy|title|lifted|medal/i },
    { label: 'Serie A',          pattern: /won|winner|champion|trophy|title|lifted|medal/i },
    { label: 'Bundesliga',       pattern: /won|winner|champion|trophy|title|lifted|medal/i },
    { label: 'Ligue 1',         pattern: /won|winner|champion|trophy|title|lifted|medal/i },
    { label: 'Premier League',   pattern: /won|winner|champion|trophy|title|lifted|medal/i },
  ];

  const found = [
    ...INDIVIDUAL.filter(a => text.includes(a)),
    ...TEAM_TROPHIES
      .filter(({ label, pattern }) => {
        const idx = text.indexOf(label);
        if (idx === -1) return false;
        // Check a 120-char window around the mention for trophy language
        const window = text.slice(Math.max(0, idx - 60), idx + label.length + 60);
        return pattern.test(window);
      })
      .map(({ label }) => label.trim()),
  ];

  return [...new Set(found)].slice(0, 4);
}

function parseHonours(text) {
  const known = [
    'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1',
    'Champions League', 'Europa League', 'FA Cup', 'Copa del Rey',
    'World Cup', 'Euro', 'Copa América', 'Manager of the Month',
    'Manager of the Year', 'LMA Manager',
  ];
  return known.filter(a => text.includes(a)).slice(0, 4);
}

function computeAge(bornStr) {
  const m = bornStr.match(/(\d{4})/);
  if (!m) return null;
  const age = new Date().getFullYear() - parseInt(m[1]);
  return (age > 10 && age < 60) ? String(age) : null;
}

function parseYearsActive(text) {
  const m = text.match(/(?:managing|coaching|managerial career)[^.]*?(?:since|from)\s+(\d{4})/i)
         || text.match(/(?:began|started)[^.]*?(?:managing|coaching)[^.]*?(\d{4})/i)
         || text.match(/managerial career[^.]*?(\d{4})/i);
  if (!m) return null;
  return `${m[1]}–present`;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Used Tech page ────────────────────────────────────────────
export function renderTech(container, state, onNavigate) {
  const TECH = [
    { name: 'FastAPI',       bullets: () => [t('tech_fastapi_b1'), t('tech_fastapi_b2'), t('tech_fastapi_b3')], color: '#009688', icon: 'img',  src: './assets/icon-fastapi.webp'      },
    { name: 'Groq',          bullets: () => [t('tech_groq_b1'),   t('tech_groq_b2'),   t('tech_groq_b3')],   color: '#F55036', icon: 'img',  src: './assets/icon-groq.webp'         },
    { name: 'Docling',       bullets: () => [t('tech_docling_b1'),t('tech_docling_b2'),t('tech_docling_b3')],color: '#FF832B', icon: 'img',  src: './assets/icon-docling.webp'      },
    { name: 'football-data', bullets: () => [t('tech_fd_b1'),     t('tech_fd_b2'),     t('tech_fd_b3')],     color: '#7a9abf', icon: 'img',  src: './assets/icon-footballdata.webp' },
    { name: 'Vanilla JS',    bullets: () => [t('tech_js_b1'),     t('tech_js_b2'),     t('tech_js_b3')],     color: '#C9B800', icon: 'img',  src: './assets/icon-js.webp'           },
    { name: 'Wikipedia API', bullets: () => [t('tech_wiki_b1'),   t('tech_wiki_b2'),   t('tech_wiki_b3')],   color: '#a0a0a0', icon: 'img',  src: './assets/icon-wikipedia.webp'    },
    { name: 'flagcdn.com',   bullets: () => [t('tech_flag_b1'),   t('tech_flag_b2'),   t('tech_flag_b3')],   color: '#7a9abf', icon: 'img',  src: './assets/icon-flagcdn.webp'      },
    { name: 'IBM Plex',      bullets: () => [t('tech_plex_b1'),   t('tech_plex_b2')],                        color: '#4589FF', icon: 'text', text: 'Rr'                             },
  ];

  container.innerHTML = `
    <div class="tech-body stage">

      <div class="tech-grid">
        ${TECH.map(tech => `
          <div class="tc-card" style="--accent:${tech.color};">
            <div class="tc-icon-wrap">
              <div class="tc-icon">
                ${tech.icon === 'img'
                  ? `<img src="${tech.src}" alt="${tech.name}" class="tc-img">`
                  : `<span class="tc-letters" style="color:${tech.color};">${tech.text}</span>`
                }
              </div>
              <div class="tc-name">${tech.name}</div>
            </div>
            <ul class="tc-bullets">
              ${tech.bullets().map(pt => `<li>${pt}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>

    </div>

    <style>
      .tech-body {
        padding: 48px 40px;
        max-width: 1140px;
        margin: 0 auto;
        position: relative;
        min-height: 80vh;
      }
      .tech-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-auto-rows: 1fr;
        gap: 20px;
      }
      .tc-card {
        background: color-mix(in srgb, var(--accent) 6%, #0f0f0f);
        border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
        border-radius: 0;
        padding: 20px 18px;
        transition: background 0.15s, border-color 0.15s;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .tc-card:hover {
        background: color-mix(in srgb, var(--accent) 10%, #0f0f0f);
        border-color: color-mix(in srgb, var(--accent) 45%, transparent);
      }
      .tc-icon-wrap {
        display: flex; align-items: center; gap: 10px;
      }
      .tc-icon {
        width: 32px; height: 32px; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
      }
      .tc-img { width: 28px; height: 28px; object-fit: contain; }
      .tc-letters {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 13px; font-weight: 700;
        width: 28px; height: 28px;
        display: flex; align-items: center; justify-content: center;
        border: 1px solid currentColor;
        opacity: 0.85;
      }
      .tc-name {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 13px; font-weight: 700;
        letter-spacing: 0.04em;
        color: color-mix(in srgb, var(--accent) 85%, #fff);
      }
      .tc-bullets {
        list-style: none; margin: 0; padding: 0;
        display: flex; flex-direction: column; gap: 6px;
      }
      .tc-bullets li {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 12px; color: rgba(255,255,255,0.42);
        line-height: 1.4; padding-left: 14px; position: relative;
      }
      [dir="rtl"] .tc-bullets li {
        padding-left: 0; padding-right: 14px;
      }
      .tc-bullets li::before {
        content: '·';
        position: absolute; left: 0;
        color: var(--accent); opacity: 0.5;
        font-size: 16px; line-height: 1;
      }
      [dir="rtl"] .tc-bullets li::before {
        left: auto; right: 0;
      }
      .tc-footer {
        margin-top: 32px;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 11px;
        color: rgba(255,255,255,0.22);
        letter-spacing: 0.04em;
      }
      .tc-footer-author {
        color: rgba(255,255,255,0.38);
      }
    </style>
  `;

  attachNavListeners(container, onNavigate);
}