// ============================================================
//  stage3-loading.js — Cinematic wipe loading screen
// ============================================================

import { API_BASE, getApiLang, t } from './config.js';
import { attachNavListeners } from './nav.js';

function getLoadingLabels() {
  return {
    why_winner:         t('q_why_winner_title'),
    why_loser:          t('q_why_loser_title'),
    who_dominated:      t('q_who_dominated_title'),
    who_underperformed: t('q_who_underperformed_title'),
  };
}

function getQuestionLabel(qtype, winner, loser) {
  const labels = getLoadingLabels();
  const label  = labels[qtype];
  if (!label) return t('loading_analyzing') + '…';
  return label
    .replace('[team]', winner || 'winner')
    .replace('[team]', loser  || 'loser');
}

// Bumped on every renderLoading() call. The async runner captures the value
// at start and checks it before touching the DOM or navigating — if a newer
// loading run has started in the meantime (e.g. a re-entrant navigate call
// slipped past the app.js guard), the stale run silently no-ops instead of
// firing a second onNavigate or writing into a torn-down container.
let loadingGen = 0;

export async function renderLoading(container, state, onNavigate) {
  const myGen = ++loadingGen;
  const match = state.pinnedMatch;
  if (!match) { onNavigate('hero'); return; }

  // ── Preview flow ──────────────────────────────────────────────
  if (state.isPreview) {
    container.innerHTML = `
      <div class="loading-body stage" id="loading-stage">
        <div class="loading-question-wrap">
          <div class="loading-question-label">Building Preview</div>
          <div class="loading-question-text">${match.home} vs ${match.away}</div>
          <div class="loading-match-meta">${match.stage || ''} · ${match.date || ''}</div>
        </div>
        <div class="loading-corner-bar">
          <div class="loading-corner-track"></div>
          <div class="loading-corner-fill" id="corner-fill"></div>
        </div>
        <div class="loading-pct" id="loading-pct">0%</div>
        <div class="loading-wipe-yellow" id="wipe-yellow"></div>
        <div class="loading-wipe-blue"   id="wipe-blue"></div>
      </div>
    `;
    attachNavListeners(container, onNavigate);
    await runPreview(container, state, onNavigate, match, myGen);
    return;
  }

  // ── Standard analysis ─────────────────────────────────────────
  const qtype = state.selectedQuestion;
  if (!qtype) { onNavigate('hero'); return; }

  const winner = match.winner || match.home;
  const loser  = match.loser  || match.away;
  const qLabel = getQuestionLabel(qtype, winner, loser);

  // ── Standard analysis (all question types, including custom) ──
  container.innerHTML = `
    <div class="loading-body stage" id="loading-stage">

      <div class="loading-question-wrap">
        <div class="loading-question-label">${t('loading_analyzing')}</div>
        <div class="loading-question-text">${qtype === 'custom' ? (state.customQuestion || qLabel) : qLabel}</div>
        <div class="loading-match-meta">${match.home} ${match.score_home ?? ''}–${match.score_away ?? ''} ${match.away}</div>
      </div>

      <!-- Progress bar: fills right→left -->
      <div class="loading-corner-bar">
        <div class="loading-corner-track"></div>
        <div class="loading-corner-fill" id="corner-fill"></div>
      </div>
      <div class="loading-pct" id="loading-pct">0%</div>

      <!-- Wipe layers: yellow from top-right, blue behind with delay -->
      <div class="loading-wipe-yellow" id="wipe-yellow"></div>
      <div class="loading-wipe-blue"   id="wipe-blue"></div>

    </div>
  `;

  attachNavListeners(container, onNavigate);
  await runAnalysis(container, state, onNavigate, match, qtype, state.customQuestion || null, myGen);
}

// ── Shared analysis runner ────────────────────────────────────
async function runAnalysis(container, state, onNavigate, match, qtype, customQuestion, myGen) {
  let pct     = 0;
  let apiDone = false;

  const fillEl = container.querySelector('#corner-fill');
  const pctEl  = container.querySelector('#loading-pct');

  // Show pct label once analysis starts
  if (pctEl) pctEl.style.opacity = '1';

  const interval = setInterval(() => {
    if (apiDone) return;
    const step = 1.5 + Math.random() * 3;
    pct = Math.min(92, pct + step);
    setBar(fillEl, pctEl, pct);
  }, 120);

  const apiResult = await callAnalyze(match, qtype, customQuestion);
  apiDone = true;
  clearInterval(interval);

  if (myGen !== loadingGen) return; // a newer loading run started — abandon this one, no double-navigate

  pct = 100;
  setBar(fillEl, pctEl, 100);

  await delay(400);
  await wipeTransition(container);

  state.analysisResult  = apiResult;
  state.isCustomQA      = qtype === 'custom';
  state.customQuestion  = customQuestion;
  // Sync to window._roosterState so app.js navigate() doesn't wipe it out
  if (window._roosterState) {
    window._roosterState.analysisResult = apiResult;
    window._roosterState.isCustomQA     = qtype === 'custom';
    window._roosterState.customQuestion = customQuestion;
  }
  onNavigate('result');
}

function setBar(fillEl, pctEl, pct) {
  if (fillEl) fillEl.style.height = `${pct}%`;
  if (pctEl)  pctEl.textContent   = `${Math.round(pct)}%`;
}

// ── Cinematic wipe — diagonal top-right → bottom-left ─────────
function wipeTransition(container) {
  return new Promise(resolve => {
    const yellow = container.querySelector('#wipe-yellow');
    const blue   = container.querySelector('#wipe-blue');
    if (!yellow || !blue) { resolve(); return; }
    // Yellow sweeps first
    yellow.classList.add('go');
    // Blue follows with slight delay, peeks out from behind
    setTimeout(() => blue.classList.add('go'), 140);
    setTimeout(resolve, 700);
  });
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Preview runner ────────────────────────────────────────────
async function runPreview(container, state, onNavigate, match, myGen) {
  let pct     = 0;
  let apiDone = false;

  const fillEl = container.querySelector('#corner-fill');
  const pctEl  = container.querySelector('#loading-pct');
  if (pctEl) pctEl.style.opacity = '1';

  const interval = setInterval(() => {
    if (apiDone) return;
    const step = 1.5 + Math.random() * 3;
    pct = Math.min(92, pct + step);
    setBar(fillEl, pctEl, pct);
  }, 120);

  const apiResult = await callPreview(match);
  apiDone = true;
  clearInterval(interval);

  if (myGen !== loadingGen) return; // a newer loading run started — abandon this one, no double-navigate

  pct = 100;
  setBar(fillEl, pctEl, 100);

  await delay(400);
  await wipeTransition(container);

  state.previewResult = apiResult;
  state.isPreview     = false;
  // Sync to window._roosterState so app.js navigate() doesn't wipe it out
  if (window._roosterState) {
    window._roosterState.previewResult = apiResult;
    window._roosterState.isPreview     = false;
  }
  onNavigate('preview-result');
}

// ── Preview API call ──────────────────────────────────────────
async function callPreview(match) {
  try {
    const body = {
      home:     match.home,
      away:     match.away,
      date:     match.date  || '',
      stage:    match.stage || '',
      language: getApiLang(),
    };
    const controller = new AbortController();
    // /preview can run up to 5 sequential Groq calls server-side (3 analysis
    // retry attempts + 2 player retry attempts), so 45s is no longer enough —
    // bumped to 100s to cover a worst-case full retry chain plus headroom.
    const timeout = setTimeout(() => controller.abort(), 100000);
    const res = await fetch(`${API_BASE}/preview`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try { detail = (await res.json()).detail || detail; } catch {}
      console.error('Preview HTTP error:', res.status, detail);
      return { error: true, headline: `Preview failed: ${detail}` };
    }
    return await res.json();
  } catch (err) {
    console.error('Preview error:', err);
    return { error: true, headline: 'Preview unavailable. Check backend is running on :8000.' };
  }
}

// ── API call ──────────────────────────────────────────────────
async function callAnalyze(match, qtype, customQuestion) {
  try {
    const lang = getApiLang();
    const body = {
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
      // Pass through what org_client._fmt_match() already computed for this
      // match (raw_stage, group, goals — including its wiki_goals fallback)
      // instead of letting the backend re-derive raw_stage by reverse-
      // parsing `stage` and re-fetch goals from Wikipedia a second time.
      // match here is the full /hero response object (stage1-hero.js stores
      // it as-is into pinnedMatch), so these are already present.
      raw_stage:       match.raw_stage,
      group:           match.group,
      goals:           match.goals,
      question_type:   qtype,
      custom_question: customQuestion || null,
      language:        getApiLang(),
    };
    const controller = new AbortController();
    // Non-English questions chain up to 3 sequential Groq calls server-side
    // (English generation, name extraction, translation), and the generation +
    // translation calls each retry up to 3x with backoff up to 10s — worst case
    // comfortably exceeds the old 45s budget and aborts a still-healthy request,
    // showing a false "Analysis failed" error mid-demo. Matched to /preview's
    // 100s budget for the same reason.
    const timeout = setTimeout(() => controller.abort(), 100000);
    const res = await fetch(`${API_BASE}/analyze`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try { detail = (await res.json()).detail || detail; } catch {}
      console.error('Analyze HTTP error:', res.status, detail);
      return { answer: `Analysis failed: ${detail}`, error: true };
    }
    return await res.json();
  } catch (err) {
    console.error('Analyze error:', err);
    return { answer: 'Analysis failed. Please check the backend is running on :8000.', error: true };
  }
}