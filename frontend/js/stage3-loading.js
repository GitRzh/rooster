// ============================================================
//  stage3-loading.js — Cinematic wipe loading screen
// ============================================================

import { API_BASE, getApiLang } from './config.js';
import { buildNav, buildTicker } from './nav.js';
import { attachNavListeners }    from './nav.js';

// Match the exact display text shown on the question tabs in stage2-insight.js
const LOADING_LABELS = {
  why_winner:         'Why did [winner] win?',
  why_loser:          'Why did [loser] lose?',
  who_dominated:      'Who ran the show?',
  who_underperformed: 'Who was underwhelming?',
};

function getQuestionLabel(qtype, winner, loser) {
  const label = LOADING_LABELS[qtype];
  if (!label) return 'Analyzing…';
  return label
    .replace('[winner]', winner || 'winner')
    .replace('[loser]',  loser  || 'loser');
}

export async function renderLoading(container, state, onNavigate) {
  const match = state.pinnedMatch;
  const qtype = state.selectedQuestion;
  if (!match || !qtype) { onNavigate('hero'); return; }

  const winner = match.winner || match.home;
  const loser  = match.loser  || match.away;
  const qLabel = getQuestionLabel(qtype, winner, loser);

  // ── Standard analysis (all question types, including custom) ──
  container.innerHTML = `
    ${buildNav('insight', onNavigate)}
    ${buildTicker([])}
    <div class="loading-body stage" id="loading-stage">

      <div class="loading-question-wrap">
        <div class="loading-question-label">Analyzing</div>
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
  await runAnalysis(container, state, onNavigate, match, qtype, state.customQuestion || null);
}

// ── Shared analysis runner ────────────────────────────────────
async function runAnalysis(container, state, onNavigate, match, qtype, customQuestion) {
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

  pct = 100;
  setBar(fillEl, pctEl, 100);

  await delay(400);
  await wipeTransition(container);

  state.analysisResult  = apiResult;
  state.isCustomQA      = qtype === 'custom';
  state.customQuestion  = customQuestion;
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
      question_type:   qtype,
      custom_question: customQuestion || null,
      language:        getApiLang(),
    };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    const res = await fetch(`${API_BASE}/analyze`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  controller.signal,
    });
    clearTimeout(timeout);
    return await res.json();
  } catch (err) {
    console.error('Analyze error:', err);
    return { answer: 'Analysis failed. Please check the backend is running on :8000.', error: true };
  }
}