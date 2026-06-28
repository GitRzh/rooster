// ============================================================
//  stage4-result.js — Results: 65/35 split, rich player/manager cards
// ============================================================

import {
  flagUrl, wikiUrl, fetchWikiData,
  extractPlayerNames, extractPlayerNamesFromBackend, highlightPlayersAsync, highlightPlayersDeduped,
  escapeHtml, getApiLang, API_BASE, t,
} from './config.js';
import { buildNav, buildTicker, attachNavListeners } from './nav.js';

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

export function renderResult(container, state, onNavigate) {
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
    ${buildNav('insight', onNavigate)}
    ${buildTicker([])}
    <div class="result-body stage">

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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              ${t('questions_btn')}
            </button>
          </div>
        </div>

        <div id="answer-area" class="answer-section">
          <div class="answer-card">
            <div class="answer-card-head">Loading analysis…</div>
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
  `;

  attachNavListeners(container, onNavigate);
  container.querySelector('#back-to-insight').addEventListener('click', () => onNavigate('insight'));

  if (isQA) {
    attachQAResult(container, result, match, state, onNavigate).catch(e => console.error("QA result error:", e));
  } else {
    renderAnswerCards(container, result, match);
  }
}

// ── Answer cards (async — validates player names) ─────────────
async function renderAnswerCards(container, result, match) {
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

  areaEl.innerHTML = `
    <div class="answer-card" id="card-tldr">
      <div class="answer-card-head">${t('tldr')}</div>
      <div class="answer-card-body" id="tldr-body">${escapeHtml(tldr)}</div>
    </div>
    <div class="answer-card answer-card-narrative" id="card-full">
      <div class="answer-card-head">${t('full_narrative')}</div>
      <div class="answer-card-body answer-card-body-scroll" id="full-body">${escapeHtml(full)}</div>
    </div>
  `;

  const names = await extractPlayerNamesFromBackend(answer);
  if (names.length) {
    // Highlight across both blocks so each name only gets a link on first occurrence.
    const { tldrHl, fullHl } = await highlightPlayersDeduped(tldr, full, names);

    const tldrEl = container.querySelector('#tldr-body');
    const fullEl = container.querySelector('#full-body');
    if (tldrEl) tldrEl.innerHTML = tldrHl;
    if (fullEl) fullEl.innerHTML = fullHl;

    attachPlayerHovers(container);
  }
}

// ── Q&A result — TLDR + Narrative like other tabs ─────────────
async function attachQAResult(container, result, match, state, onNavigate) {
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
            ⚠ ${escapeHtml(result.answer || 'Ask something about this match.')}
          </div>
          <div style="color:rgba(255,255,255,0.4);font-size:0.8rem;">
            Try: tactics, players, goals, moments, decisions, "what if…"
          </div>
        </div>
      </div>
    `;
    // Show try-again prompt in the right entity panel
    const panelEl = container.querySelector('#entity-panel');
    if (panelEl) {
      panelEl.innerHTML = `
        <div style="padding:24px 18px;display:flex;flex-direction:column;gap:12px;align-items:center;text-align:center;">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--yellow);">Try Again</div>
          <div style="font-size:12px;color:var(--muted-bright);line-height:1.6;">
            Ask something about the match — a player's performance, a tactical decision, a key moment, or a "what if" scenario.
          </div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--muted);line-height:1.7;text-align:left;width:100%;padding:10px 12px;background:var(--bg-card);border-radius:var(--radius-sm);border:1px solid var(--border);">
            e.g. "Why didn't the manager sub earlier?"<br>
            e.g. "Who was the best player on the pitch?"<br>
            e.g. "What if Haaland had started?"
          </div>
          <button id="qa-ask-again-btn" style="font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;background:var(--blue);color:var(--yellow);border:none;border-radius:var(--radius-sm);padding:8px 16px;cursor:pointer;width:100%;margin-top:4px;">
            ← Ask Again
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
      <div class="answer-card-head">${t('tldr')}</div>
      <div class="answer-card-body" id="tldr-body">${escapeHtml(tldrClean)}</div>
    </div>
    <div class="answer-card answer-card-narrative" id="card-full">
      <div class="answer-card-head">${t('full_narrative')}</div>
      <div class="answer-card-body answer-card-body-scroll" id="full-body">${escapeHtml(fullClean)}</div>
    </div>
  `;

  const names = await extractPlayerNamesFromBackend(answer);
  if (names.length) {
    // Dedup: first occurrence across tldr+full gets the link, rest are plain
    const { tldrHl, fullHl } = await highlightPlayersDeduped(tldrClean, fullClean, names);
    const tldrEl = container.querySelector('#tldr-body');
    const fullEl = container.querySelector('#full-body');
    if (tldrEl) tldrEl.innerHTML = tldrHl;
    if (fullEl) fullEl.innerHTML = fullHl;
    attachPlayerHovers(container);
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
        attachPlayerHovers(container);
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

// ── Player hover → rich right panel ──────────────────────────
function attachPlayerHovers(container) {
  container.querySelectorAll('.player-hl').forEach(hl => {
    const fresh = hl.cloneNode(true);
    hl.replaceWith(fresh);
  });

  let hoverTimer = null;
  let activeName = null;

  container.querySelectorAll('.player-hl').forEach(hl => {
    hl.addEventListener('mouseenter', () => {
      hoverTimer = setTimeout(async () => {
        const name = hl.dataset.name;
        if (!name || activeName === name) return;
        activeName = name;
        await loadEntityCard(container, name);
      }, 1500);
    });
    hl.addEventListener('mouseleave', () => clearTimeout(hoverTimer));
  });
}

// ── Rich entity card ──────────────────────────────────────────
async function loadEntityCard(container, name) {
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

  const isMgr = info
    ? info.type === 'manager'
    : /manager|coach|head coach|managed|coaching/i.test(extract);

  const labelEl = container.querySelector('#result-right-label');
  if (labelEl) {
    labelEl.textContent = isMgr ? t('manager_info') : t('player_info');
    labelEl.style.display = 'block';
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

        <div class="entity-stats">
          ${rows.map(r => `
            <div class="entity-stat">
              <span class="es-label">${r.label}</span>
              <span class="es-val" ${r.color ? `style="color:${r.color};font-weight:600"` : ''}>${r.val}</span>
            </div>
          `).join('')}
        </div>
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

        <div class="entity-stats">
          ${rows.map(r => `
            <div class="entity-stat">
              <span class="es-label">${r.label}</span>
              <span class="es-val">${r.val}</span>
            </div>
          `).join('')}
        </div>
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
    { name: 'FastAPI',       desc: 'Python backend — all endpoints, routing, CORS' },
    { name: 'Groq',          desc: 'LLM inference via llama-3.3-70b-versatile — ultra-fast analysis' },
    { name: 'Docling',       desc: 'IBM-qualifying component — Wikipedia page parsing & context extraction' },
    { name: 'football-data', desc: 'football-data.org API — live scores, fixtures, match data' },
    { name: 'Vanilla JS',    desc: 'No framework — ES modules, no build step needed' },
    { name: 'Wikipedia API', desc: 'Player photos, articles, and biographical validation' },
    { name: 'flagcdn.com',   desc: 'Country flag images — PNG, no API key required' },
    { name: 'IBM Plex',      desc: 'IBM Plex Sans + Mono — typography throughout' },
  ];

  container.innerHTML = `
    ${buildNav('tech', onNavigate)}
    ${buildTicker([])}
    <div class="tech-body stage">
      <div>
        <div class="tech-title">What powers ROOSTER</div>
        <ul class="tech-list">
          ${TECH.map(t => `
            <li>
              <span class="tech-arrow">→</span>
              <span><strong class="tech-name">${t.name}</strong> — ${t.desc}</span>
            </li>
          `).join('')}
        </ul>
      </div>
      <div>
        <div class="tech-title">Stack at a glance</div>
        <div class="tech-logos">
          ${TECH.map(t => `
            <div class="tech-logo-item">
              <div class="tech-logo-box">${t.name.toUpperCase()}</div>
              <div class="tech-logo-name">${t.name}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  attachNavListeners(container, onNavigate);
}

// ── Card helpers ──────────────────────────────────────────────
function errorCard(msg) {
  return `<div class="answer-card answer-card-error">
    <div class="answer-card-head">Error</div>
    <div class="answer-card-body">${msg}</div>
  </div>`;
}

function infoCard(head, body) {
  return `<div class="answer-card">
    <div class="answer-card-head">${head}</div>
    <div class="answer-card-body">${body}</div>
  </div>`;
}