// ============================================================
//  stage2-insight.js — Question tabs + MVP panel
// ============================================================

import { flagUrl, flagImg, API_BASE, getApiLang, t } from './config.js';
import { attachNavListeners } from './nav.js';

export function renderInsight(container, state, onNavigate) {
  const match = state.pinnedMatch;
  if (!match) { onNavigate('hero'); return; }

  const isDraw   = match.is_draw || (match.score_home != null && match.score_home === match.score_away);

  const homeScore = match.score_home ?? null;
  const awayScore = match.score_away ?? null;
  let winner, loser;
  if (isDraw || homeScore === null) {
    winner = match.winner || match.home || '';
    loser  = match.loser  || match.away || '';
  } else if (homeScore > awayScore) {
    winner = match.home || '';
    loser  = match.away || '';
  } else {
    winner = match.away || '';
    loser  = match.home || '';
  }

  const scoreStr = homeScore != null ? `${homeScore}–${awayScore}` : 'vs';

  container.innerHTML = `
    <div class="insight-body stage">

      <!-- Pinned bar -->
      <div class="pinned-bar">
        <div class="pb-left">
          <span class="pinned-label">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
            Pinned
          </span>
          <div class="pinned-match-info">
            ${match.home_flag
              ? match.home_flag.replace(/class="[^"]*"/, 'class="p-flag"').replace(/\s*width="[^"]*"/, '').replace(/\s*height="[^"]*"/, '')
              : flagImg(match.home, 'p-flag', 80)}
            <span class="p-teams">${match.home}</span>
            <span class="p-score">${scoreStr}</span>
            <span class="p-teams">${match.away}</span>
            ${match.away_flag
              ? match.away_flag.replace(/class="[^"]*"/, 'class="p-flag"').replace(/\s*width="[^"]*"/, '').replace(/\s*height="[^"]*"/, '')
              : flagImg(match.away, 'p-flag', 80)}
            ${match.stage ? `<span class="p-meta">${match.stage}</span>` : ''}
          </div>
        </div>
        <button class="btn-back" id="change-match-btn" aria-label="Change match">
          Change Match
        </button>
      </div>

      <!-- Layout -->
      <div class="insight-layout">
        <div class="q-grid">
          ${buildQTab(match, 'why_winner', winner, loser, isDraw)}
          ${buildQTab(match, 'who_dominated', winner, loser, isDraw)}
          ${buildQTab(match, 'custom', winner, loser, isDraw)}
          ${buildQTab(match, 'why_loser', winner, loser, isDraw)}
          ${buildQTab(match, 'who_underperformed', winner, loser, isDraw)}
        </div>
      </div>

    </div>
  `;

  attachNavListeners(container, onNavigate);

  container.querySelector('#change-match-btn').addEventListener('click', () => onNavigate('hero'));
  attachQTabs(container, match, state, onNavigate, isDraw);
}

// ── Flag helper ───────────────────────────────────────────────
function makeQtFlag(prebuilt, teamName) {
  if (prebuilt && typeof prebuilt === 'string' && prebuilt.includes('<img')) {
    return prebuilt
      .replace(/class="[^"]*"/, 'class="qt-flag"')
      .replace(/\/w\d+\//g, '/w160/')   // upgrade to hi-res
      .replace(/\s*width="[^"]*"/, '')
      .replace(/\s*height="[^"]*"/, '');
  }
  const url = flagUrl(teamName, 160);
  return url
    ? `<img src="${url}" alt="${teamName}" class="qt-flag" onerror="this.style.display='none'">`
    : `<div class="qt-flag flag-placeholder"></div>`;
}

// ── Question tab builder ──────────────────────────────────────
function buildQTab(match, type, winner, loser, isDraw) {
  const homeFlag = makeQtFlag(match.home_flag, match.home);
  const awayFlag = makeQtFlag(match.away_flag, match.away);

  // Pick flag based on which team is winner/loser; draws fall back to home/away
  const winnerFlag = isDraw ? homeFlag : (winner === match.away ? awayFlag : homeFlag);
  const loserFlag  = isDraw ? awayFlag : (loser  === match.away ? awayFlag : homeFlag);

  const defs = {
    why_winner: {
      flag:    winnerFlag,
      title:   t('q_why_winner_title'),
      sub:     t('q_why_winner_sub'),
      cls:     '',
      blocked: isDraw,
    },
    why_loser: {
      flag:    loserFlag,
      title:   t('q_why_loser_title'),
      sub:     t('q_why_loser_sub'),
      cls:     '',
      blocked: isDraw,
    },
    who_dominated: {
      flag:    isDraw
        ? `<div class="qt-flag qt-flag-unknown" style="display:flex;align-items:center;justify-content:center">?</div>`
        : winnerFlag,
      title:   t('q_who_dominated_title'),
      sub:     t('q_who_dominated_sub'),
      cls:     '',
      blocked: false,
    },
    who_underperformed: {
      flag:    isDraw
        ? `<div class="qt-flag qt-flag-unknown" style="display:flex;align-items:center;justify-content:center">?</div>`
        : loserFlag,
      title:   t('q_who_underperformed_title'),
      sub:     t('q_who_underperformed_sub'),
      cls:     '',
      blocked: false,
    },
    custom: {
      flag:    null,
      title:   t('q_custom_title'),
      sub:     t('q_custom_sub'),
      cls:     'q-qa',
      blocked: false,
    },
  };

  const d        = defs[type];
  const isQA     = type === 'custom';
  const isBlocked = d.blocked;

  if (isQA) {
    return `
      <div class="q-tab q-qa q-qa-inline" data-qtype="custom" aria-label="${d.title}"
           style="position:relative;">
        <span class="sparkle" aria-hidden="true"></span>
        <span class="sparkle" aria-hidden="true"></span>
        <span class="sparkle" aria-hidden="true"></span>

        <!-- Info icon — top right -->
        <div class="qa-info-wrap" style="position:absolute;top:12px;right:14px;z-index:10;">
          <button class="qa-info-btn" aria-label="What can I ask?" tabindex="0">i</button>
          <div class="qa-info-tooltip" role="tooltip">
            <div class="qa-info-title">${t('tooltip_title')}</div>
            <div class="qa-info-section">
              <div class="qa-info-label">${t('tooltip_ask_about_label')}</div>
              ${toBullets(t('tooltip_ask_about_body'))}
            </div>
            <div class="qa-info-section">
              <div class="qa-info-label">${t('tooltip_wont_work_label')}</div>
              ${toBullets(t('tooltip_wont_work_body'), 'qa-info-wont')}
            </div>
            <div class="qa-info-section">
              <div class="qa-info-label">${t('tooltip_examples_label')}</div>
              ${toBullets(t('tooltip_examples_body'))}
            </div>
          </div>
        </div>

        <div class="q-tab-header">
          <span class="q-tab-title">${d.title}</span>
        </div>
        <span class="q-tab-sub">${d.sub}</span>
        <div class="q-inline-input-wrap">
          <textarea
            class="q-inline-input"
            id="q-inline-input"
            placeholder="${t('q_custom_placeholder')}"
            rows="1"
            style="overflow:hidden;resize:none;"
            aria-label="Your question about this match"></textarea>
          <button class="q-inline-btn" id="q-inline-submit" aria-label="Analyze question">
            ${t('analyze_btn')}
          </button>
        </div>
        <div class="q-inline-reject" id="q-inline-reject"></div>
      </div>
    `;
  }

  return `
    <div class="q-tab ${d.cls}${isBlocked ? ' q-blocked' : ''}"
         data-qtype="${type}"
         ${isBlocked ? 'aria-disabled="true" title="Match was a draw"' : 'role="button" tabindex="0"'}
         aria-label="${d.title}">
      <div class="q-tab-header">
        ${d.flag || `<div class="qt-flag flag-placeholder"></div>`}
        <span class="q-tab-title">${isBlocked ? `<s>${d.title}</s>` : d.title}</span>
      </div>
      <span class="q-tab-sub">${isBlocked ? t('draw_match') : d.sub}</span>
      ${isBlocked
        ? `<span class="q-blocked-badge">${t('draw_match')}</span>`
        : ``}
    </div>
  `;
}

// Convert dot-separated or <br>-separated string into <ul><li> list
function toBullets(str, cls = '') {
  const items = str.split(/\s*·\s*|<br\s*\/?>/).map(s => s.trim()).filter(Boolean);
  return `<ul class="qa-info-examples${cls ? ' ' + cls : ''}">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
}

function attachQTabs(container, match, state, onNavigate, isDraw) {
  container.querySelectorAll('.q-tab:not(.q-blocked):not(.q-qa-inline)').forEach(tab => {
    const activate = () => {
      container.querySelectorAll('.q-tab').forEach(t => t.classList.remove('selected'));
      tab.classList.add('selected');
      const qtype = tab.dataset.qtype;
      state.selectedQuestion = qtype;
      state.pinnedMatch      = match;
      window._roosterState   = state;
      state.isCustomQA     = false;
      state.analysisResult = null;
      onNavigate('loading');
    };
    tab.addEventListener('click', activate);
    tab.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') activate(); });
  });

  const inputEl   = container.querySelector('#q-inline-input');
  const submitEl  = container.querySelector('#q-inline-submit');
  const rejectEl  = container.querySelector('#q-inline-reject');
  if (!inputEl || !submitEl) return;

  const clearReject = () => {
    if (rejectEl) { rejectEl.textContent = ''; rejectEl.classList.remove('visible'); }
  };

  // Auto-grow textarea — only scroll when content actually needs it
  inputEl.addEventListener('input', () => {
    clearReject();
    inputEl.style.height = 'auto';
    inputEl.style.height = `${inputEl.scrollHeight}px`;
  });

  // ── Relaxed client-side football topic check ──────────────────
  // Allows: match questions, player/manager Qs, tactics, hypotheticals,
  //         stats, comparisons, "what if" scenarios, referee decisions.
  // Blocks: cooking, coding, politics, geography, maths, personal advice —
  //         things clearly unrelated to any football match.
  function looksFootballRelated(q) {
    const text = q.toLowerCase();

    // Hard block: obviously off-topic domains
    const offTopic = [
      /\brecipe\b|\bcook(ing)?\b|\bingredient/,
      /\bpython\b|\bjavascript\b|\bcode\b|\bprogram(ming)?\b/,
      /\bpolitics\b|\belection\b|\bpresident\b|\bgovernment\b/,
      /\bweather\b|\bforecast\b|\bclimate\b/,
      /\bmath(s)?\b|\bcalcul|\bequation\b/,
      /\brelationship\b|\bdivorce\b|\bdate me\b|\blovesick\b/,
    ];
    if (offTopic.some(r => r.test(text))) return false;

    // Explicit football signals — pass immediately
    const footballSignals = [
      /\bgoal|\bscore|\bshoot|\bshot|\bpenalt|\bfoul|\bcard|\boffside/,
      /\bplayer|\bmanager|\bcoach|\bteam|\bclub|\bsubstitut|\btactic/,
      /\bwon|\blost|\bdraw|\bdefeat|\bvictory|\bfinal|\bgroup\s+stage/,
      /\bwhat if|\bhow did|\bwhy did|\bwho (was|is|scored|played|started)/,
      /\bformation|\bpressing|\bpossession|\bcounterattack|\bcorner|\bcross/,
      /\bworld cup|\bfifa|\buefa|\bchampions|\bleague|\btournament/,
      /\bhalftime|\bfull.?time|\bextra.?time|\binjury.?time|\bvar\b/,
      /\bhaaland|\bmbappe|\bmbapp|\bgirou|\bkant|\bodegaard|\bstrandberg/,
    ];
    if (footballSignals.some(r => r.test(text))) return true;

    // Reject meaningless input: too short, single chars, or pure numbers
    const words = q.trim().split(/\s+/);
    const hasRealWord = words.some(w => w.length >= 3);
    if (!hasRealWord || q.trim().length < 4) return false;

    // Short vague questions with real words — assume football context
    // e.g. "why?", "who played best?", "was it fair?"
    if (words.length <= 6 && hasRealWord) return true;

    // Anything else with a question word — assume match-related
    if (/\b(who|what|why|how|when|where|which|could|would|should|did|was|were)\b/.test(text)) return true;

    // Default: allow (better to let the backend handle edge cases)
    return true;
  }

  const submitInline = async () => {
    const q = inputEl.value.trim();
    if (!q) {
      inputEl.classList.add('qa-prompt-shake');
      setTimeout(() => inputEl.classList.remove('qa-prompt-shake'), 400);
      return;
    }

    // Client-side topic gate — fast, no API call needed
    if (!looksFootballRelated(q)) {
      if (rejectEl) {
        rejectEl.textContent = t('q_too_short');
        rejectEl.classList.add('visible');
      }
      inputEl.focus();
      return;
    }

    clearReject();
    state.selectedQuestion = 'custom';
    state.pinnedMatch      = match;
    state.isCustomQA       = true;
    state.customQuestion   = q;
    state.analysisResult   = null;
    window._roosterState   = state;
    onNavigate('loading');
  };

  submitEl.addEventListener('click', submitInline);
  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitInline(); }
  });
}