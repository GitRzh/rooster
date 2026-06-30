// ============================================================
//  stage1-hero.js — Hero page: finished / featured / upcoming
// ============================================================

import { API_BASE, flagImg, flagUrl, t } from './config.js';
import { attachNavListeners, updateTicker } from './nav.js';

let heroData         = null;
let pinnedMatch      = null;
let searchDebounce   = null;
let calendarData     = null;   // full tournament match list
let calendarLoadFailed = false; // true only when the LAST fetch attempt errored —
                                 // keeps calendarData=[] (a failed load) from being
                                 // mistaken for "successfully loaded, zero matches"
let calendarOpen     = false;

const MAX_CARDS = 4; // max visible cards before fade/scroll

// ── Render ────────────────────────────────────────────────────
export function renderHero(container, state, onNavigate) {
  pinnedMatch = state.pinnedMatch || null;

  container.innerHTML = `
    <div class="hero-body stage">

      <!-- Search — full width -->
      <div class="hero-search-row">
        <div class="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" id="search-input" placeholder="${t('hero_search_placeholder')}" autocomplete="off" aria-label="Search matches">
          <div class="search-results hidden" id="search-results" role="listbox"></div>
        </div>
        <button class="cal-icon-btn" id="cal-icon-btn" aria-label="Open match calendar" title="Search match using dates">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>${t('hero_search_by_date')}</span>
        </button>
      </div>
      <!-- Calendar overlay -->
      <div class="cal-overlay hidden" id="cal-overlay" role="dialog" aria-modal="true" aria-label="Match Calendar">
        <div class="cal-backdrop" id="cal-backdrop"></div>
        <div class="cal-panels">
          <!-- Left: Calendar -->
          <div class="cal-panel cal-panel-left" id="cal-panel-left">
            <div class="cal-panel-head">
              <button class="cal-nav-btn" id="cal-prev" aria-label="Previous month">&#8249;</button>
              <span class="cal-month-label" id="cal-month-label"></span>
              <button class="cal-nav-btn" id="cal-next" aria-label="Next month">&#8250;</button>
            </div>
            <div class="cal-grid-head">
              <span>Su</span><span>Mo</span><span>Tu</span><span>We</span>
              <span>Th</span><span>Fr</span><span>Sa</span>
            </div>
            <div class="cal-grid" id="cal-grid"></div>
          </div>
          <!-- Right: Search + results -->
          <div class="cal-panel cal-panel-right" id="cal-panel-right">
            <div class="cal-search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" id="cal-search-input" placeholder="Search team…" autocomplete="off" aria-label="Search team in calendar">
            </div>
            <div class="cal-right-content" id="cal-right-content">
              <div class="cal-right-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>
                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/>
                </svg>
                <span>Click a date to see matches</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Finished (left) -->
      <div class="hero-col finished-col">
        <div class="section-head">
          <span class="section-title">${t('section_finished')}</span>
          <span class="section-count" id="finished-count"></span>
        </div>
        <div class="scroll-fade-wrap" id="finished-fade">
          <div class="match-scroll-box" id="finished-list">
            ${skeletons(4)}
          </div>
        </div>
      </div>

      <!-- Featured / Pinned (center) -->
      <div class="hero-col featured-col">
        <div class="section-head">
          <span class="section-title" id="featured-label">${t('section_featured')}</span>
        </div>
        <div id="featured-card-wrap">
          ${renderFeaturedEmpty()}
        </div>
        <div id="today-section"></div>
      </div>

      <!-- Upcoming (right) -->
      <div class="hero-col upcoming-col">
        <div class="section-head">
          <span class="section-title">${t('section_upcoming')}</span>
          <span class="section-count" id="upcoming-count"></span>
        </div>
        <div class="scroll-fade-wrap" id="upcoming-fade">
          <div class="upcoming-scroll-box" id="upcoming-list">
            ${skeletons(4)}
          </div>
        </div>
      </div>

    </div>
  `;

  attachNavListeners(container, onNavigate);
  attachScrollFade(container, '#finished-list',  '#finished-fade');
  attachScrollFade(container, '#upcoming-list',  '#upcoming-fade');
  attachSearch(container, onNavigate);
  attachCalendar(container, onNavigate);
  loadHero(container, state, onNavigate);
}

// ── Data load ─────────────────────────────────────────────────
async function loadHero(container, state, onNavigate) {
  try {
    // Use the promise started during the intro (window.__heroPromise) if
    // available — it's been running in parallel for ~2.5s already.
    // Falls back to a fresh fetch if called outside the normal boot flow.
    heroData = window.__heroPromise
      ? await window.__heroPromise
      : await fetch(`${API_BASE}/hero`).then(r => r.json());
    window.__heroPromise = null; // consume once

    const liveMatches = heroData.live || [];
    updateTicker(liveMatches);

    // Finished = yesterday + two_days_ago, newest first, deduplicated by ID
    const finishedRaw = [...(heroData.yesterday || []), ...(heroData.two_days_ago || [])];
    const seenIds = new Set();
    const finished = finishedRaw.filter(m => {
      if (seenIds.has(m.id)) return false;
      seenIds.add(m.id);
      return true;
    });
    renderFinished(container, finished, state, onNavigate);

    // Upcoming sorted soonest first
    const upcoming = [...(heroData.upcoming || [])].sort((a, b) => a.date.localeCompare(b.date));
    renderUpcoming(container, upcoming, onNavigate);
    renderToday(container, heroData.today || [], state, onNavigate);

    if (pinnedMatch) {
      renderFeatured(container, pinnedMatch, true, onNavigate);
    } else if (liveMatches.length) {
      renderFeatured(container, liveMatches[0], false, onNavigate);
    } else if ((heroData.today || []).length) {
      renderFeatured(container, heroData.today[0], false, onNavigate);
    } else if (finished.length) {
      renderFeatured(container, finished[0], false, onNavigate);
    }

  } catch (err) {
    console.error('Hero load failed:', err);
    container.querySelector('#finished-list').innerHTML  = errorMsg('Backend unavailable — check FastAPI is running on :8000');
    container.querySelector('#upcoming-list').innerHTML  = errorMsg('Could not load upcoming matches.');
  }
}

// ── Finished ──────────────────────────────────────────────────
function renderFinished(container, matches, state, onNavigate) {
  const el = container.querySelector('#finished-list');
  const countEl = container.querySelector('#finished-count');
  if (!matches.length) { el.innerHTML = emptyState('No recent finished matches'); return; }

  if (countEl) countEl.textContent = matches.length;
  el.innerHTML = matches.map((m, i) => matchCard(m, 'insight', pinnedMatch?.id === m.id)).join('');

  el.querySelectorAll('.btn-insight').forEach((btn, i) => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      goInsight(matches[i], state, onNavigate);
    });
  });
  el.querySelectorAll('.match-card').forEach((card, i) => {
    card.addEventListener('click', () => goInsight(matches[i], state, onNavigate));
  });

  // Re-check fade after render
  setTimeout(() => attachScrollFade(container, '#finished-list', '#finished-fade'), 50);
}

// ── Upcoming ──────────────────────────────────────────────────
function renderUpcoming(container, matches, onNavigate) {
  const el = container.querySelector('#upcoming-list');
  const countEl = container.querySelector('#upcoming-count');
  if (!matches.length) { el.innerHTML = emptyState('No upcoming matches scheduled'); return; }

  if (countEl) countEl.textContent = matches.length;
  el.innerHTML = matches.map(m => matchCard(m, 'preview')).join('');

  // Wire preview buttons
  el.querySelectorAll('.match-card').forEach((card, i) => {
    const btn = card.querySelector('.btn-preview.mc-btn');
    if (btn) {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        goPreview(matches[i], onNavigate);
      });
    }
  });

  setTimeout(() => attachScrollFade(container, '#upcoming-list', '#upcoming-fade'), 50);
}

// ── Today ─────────────────────────────────────────────────────
function renderToday(container, matches, state, onNavigate) {
  const el = container.querySelector('#today-section');
  if (!matches.length) { el.innerHTML = ''; return; }

  el.innerHTML = `
    <div class="today-section">
      <div class="today-head">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        ${t('today_label')}
      </div>
      ${matches.map((m, i) => {
        const hf = flagUrl(m.home, 20);
        const af = flagUrl(m.away, 20);
        return `
        <div class="today-row" data-idx="${i}" role="button" tabindex="0" aria-label="${m.home} vs ${m.away}">
          ${hf
            ? `<img src="${hf}" class="t-flag" alt="${m.home}"
                onerror="this.outerHTML='<div class=\\'t-flag flag-placeholder\\'></div>'">`
            : `<div class="t-flag flag-placeholder"></div>`}
          <span class="t-team">${m.home}</span>
          <span class="t-vs">vs</span>
          <span class="t-team t-team-right">${m.away}</span>
          ${af
            ? `<img src="${af}" class="t-flag" alt="${m.away}"
                onerror="this.outerHTML='<div class=\\'t-flag flag-placeholder\\'></div>'">`
            : `<div class="t-flag flag-placeholder"></div>`}
          <span class="t-score">${m.score_home != null ? `${m.score_home}–${m.score_away}` : 'TBD'}</span>
        </div>
      `}).join('')}
    </div>
  `;

  el.querySelectorAll('.today-row').forEach((row, i) => {
    const pin = () => {
      pinnedMatch = matches[i];
      state.pinnedMatch = matches[i];
      window._roosterState = state;
      renderFeatured(container, matches[i], true, onNavigate);
    };
    row.addEventListener('click', pin);
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') pin(); });
  });
}

// ── Featured ──────────────────────────────────────────────────
function truncWord(name, max = 10) {
  if (name.length <= max) return name;
  const cut = name.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 3 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
}

function renderFeatured(container, match, isPinned, onNavigate) {
  const labelEl = container.querySelector('#featured-label');
  if (labelEl) labelEl.textContent = isPinned ? t('section_pinned') : t('section_featured');

  const wrap = container.querySelector('#featured-card-wrap');
  const hFlag = flagUrl(match.home, 80);
  const aFlag = flagUrl(match.away, 80);
  const scoreStr = match.score_home != null ? `${match.score_home}–${match.score_away}` : null;
  const hasScore = scoreStr !== null;

  wrap.innerHTML = `
    <div class="featured-card">
      <div class="featured-badge">
        <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" aria-hidden="true">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
        </svg>
        ${isPinned ? t('pinned_match') : t('featured_match')}
      </div>
      <div class="featured-body">
        <div class="featured-teams">
          <div class="featured-team">
            ${hFlag
              ? `<img src="${hFlag}" alt="${match.home}" class="f-flag"
                  onerror="this.outerHTML='<div class=\\'f-flag flag-placeholder\\'></div>'">`
              : `<div class="f-flag flag-placeholder"></div>`}
            <span class="f-name">${truncWord(match.home)}</span>
          </div>
          <div class="featured-vs">
            ${hasScore
              ? `<span class="featured-score">${scoreStr}</span>`
              : `<span class="featured-score vs-text">VS</span>`}
          </div>
          <div class="featured-team">
            ${aFlag
              ? `<img src="${aFlag}" alt="${match.away}" class="f-flag"
                  onerror="this.outerHTML='<div class=\\'f-flag flag-placeholder\\'></div>'">`
              : `<div class="f-flag flag-placeholder"></div>`}
            <span class="f-name">${truncWord(match.away)}</span>
          </div>
        </div>
        <div class="featured-info">${match.stage || ''}${match.date ? ' · ' + match.date : ''}</div>
        ${hasScore
          ? `<button class="btn-featured-insight" id="featured-insight-btn">${t('analyze_match_btn')}</button>`
          : `<button class="btn-featured-preview" id="featured-preview-btn">${t('preview_btn')}</button>`}
      </div>
    </div>
  `;

  const btn = wrap.querySelector('#featured-insight-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      window._roosterState = window._roosterState || {};
      window._roosterState.pinnedMatch = match;
      onNavigate('insight');
    });
  }

  const pvBtn = wrap.querySelector('#featured-preview-btn');
  if (pvBtn) {
    pvBtn.addEventListener('click', () => {
      goPreview(match, onNavigate);
    });
  }
}

function renderFeaturedEmpty() {
  return `
    <div class="featured-card featured-card-empty">
      <div class="featured-badge">${t('featured_match')}</div>
      <div class="featured-body">
        <div class="featured-empty-msg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4l3 3"/>
          </svg>
          <span>${t('click_to_feature')}</span>
        </div>
      </div>
    </div>
  `;
}

// ── Search ────────────────────────────────────────────────────
function attachSearch(container, onNavigate) {
  const input   = container.querySelector('#search-input');
  const results = container.querySelector('#search-results');

  input.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    const q = input.value.trim();
    if (!q) { results.classList.add('hidden'); return; }
    searchDebounce = setTimeout(() => doSearch(q, results, container, onNavigate), 300);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') results.classList.add('hidden');
  });

  // Previous Home visits leave their own document click listener attached
  // (it closes over the now-detached old #search-results node) — remove it
  // before adding a new one, or repeated Home → other stage → Home navigation
  // during a demo silently stacks up dead listeners.
  if (attachSearch._docClickHandler) {
    document.removeEventListener('click', attachSearch._docClickHandler);
  }
  attachSearch._docClickHandler = e => {
    if (!container.querySelector('.search-wrap')?.contains(e.target)) {
      results.classList.add('hidden');
    }
  };
  document.addEventListener('click', attachSearch._docClickHandler);
}

// Short-form / abbreviation → full country name for search expansion
const SEARCH_ALIASES = {
  'us': 'United States', 'usa': 'United States', 'u.s.': 'United States', 'u.s.a.': 'United States',
  'uk': 'England', 'gb': 'England',
  'uae': 'United Arab Emirates', 'ksa': 'Saudi Arabia',
  'jp': 'Japan', 'jpn': 'Japan',
  'kr': 'South Korea', 'kor': 'South Korea',
  'de': 'Germany', 'ger': 'Germany',
  'fr': 'France', 'fra': 'France',
  'br': 'Brazil', 'bra': 'Brazil',
  'ar': 'Argentina', 'arg': 'Argentina',
  'es': 'Spain', 'esp': 'Spain',
  'pt': 'Portugal', 'por': 'Portugal',
  'it': 'Italy', 'ita': 'Italy',
  'nl': 'Netherlands', 'ned': 'Netherlands',
  'au': 'Australia', 'aus': 'Australia',
  'mx': 'Mexico', 'mex': 'Mexico',
  'ca': 'Canada', 'can': 'Canada',
  'ng': 'Nigeria', 'nga': 'Nigeria',
  'ma': 'Morocco', 'mar': 'Morocco',
  'sn': 'Senegal', 'sen': 'Senegal',
  'gh': 'Ghana', 'gha': 'Ghana',
  'eg': 'Egypt', 'egy': 'Egypt',
  'cm': 'Cameroon', 'cmr': 'Cameroon',
  'za': 'South Africa', 'rsa': 'South Africa',
  'hr': 'Croatia', 'cro': 'Croatia',
  'rs': 'Serbia', 'srb': 'Serbia',
  'pl': 'Poland', 'pol': 'Poland',
  'be': 'Belgium', 'bel': 'Belgium',
  'dk': 'Denmark', 'den': 'Denmark',
  'ch': 'Switzerland', 'sui': 'Switzerland',
  'at': 'Austria', 'aut': 'Austria',
  'tr': 'Turkey', 'tur': 'Turkey',
  'ir': 'Iran', 'iri': 'Iran',
  'sa': 'Saudi Arabia',
  'qa': 'Qatar', 'qat': 'Qatar',
  'cn': 'China', 'chn': 'China',
  'in': 'India', 'ind': 'India',
  'cl': 'Chile', 'chi': 'Chile',
  'co': 'Colombia', 'col': 'Colombia',
  'pe': 'Peru', 'per': 'Peru',
  'uy': 'Uruguay', 'uru': 'Uruguay',
  'ec': 'Ecuador', 'ecu': 'Ecuador',
  'py': 'Paraguay', 'par': 'Paraguay',
  've': 'Venezuela', 'ven': 'Venezuela',
  'cv': 'Cape Verde', 'cpv': 'Cape Verde Islands',
  'ci': "Côte d'Ivoire", 'civ': "Côte d'Ivoire",
  'nz': 'New Zealand', 'nzl': 'New Zealand',
  'eng': 'England', 'sco': 'Scotland', 'wal': 'Wales', 'nir': 'Northern Ireland',
  'se': 'Sweden', 'swe': 'Sweden',
  'no': 'Norway', 'nor': 'Norway',
  'fi': 'Finland', 'fin': 'Finland',
  'cd': 'Congo DR', 'drc': 'Congo DR',
  'uz': 'Uzbekistan', 'uzb': 'Uzbekistan',
  'jo': 'Jordan', 'jor': 'Jordan',
  'pa': 'Panama', 'pan': 'Panama',
};

function expandSearchQuery(q) {
  const lower = q.trim().toLowerCase();
  return SEARCH_ALIASES[lower] || q;
}

async function doSearch(q, resultsEl, container, onNavigate) {
  try {
    // Always send lowercase for case-insensitive matching
    const expandedQ = expandSearchQuery(q);
    const queryToSend = expandedQ.toLowerCase();
    const res     = await fetch(`${API_BASE}/search?q=${encodeURIComponent(queryToSend)}`);
    const data    = await res.json();
    const matches = data.matches || [];

    resultsEl.classList.remove('hidden');

    if (!matches.length) {
      resultsEl.innerHTML = `<div class="search-result-item search-empty">No matches found for "${q}"</div>`;
      return;
    }

    resultsEl.innerHTML = matches.map((m, i) => {
      const homeName = m.home || '';
      const awayName = m.away || '';
      const hasScore = m.score_home != null;
      const scoreStr = hasScore ? `${m.score_home}–${m.score_away}` : '–';
      const bucketLabel = hasScore ? 'Finished' : m.date ? 'Upcoming' : 'TBA';
      const bucketCls   = hasScore ? 'finished' : m.date ? 'upcoming' : 'tba';

      function resolveFlag(prebuilt, name) {
        if (prebuilt && typeof prebuilt === 'string' && prebuilt.includes('<img')) {
          return prebuilt
            .replace(/class="[^"]*"/, 'class="s-flag"')
            .replace(/\s*width="[^"]*"/, '')
            .replace(/\s*height="[^"]*"/, '');
        }
        const url = flagUrl(name, 24);
        return url
          ? `<img src="${url}" alt="${name}" class="s-flag" onerror="this.style.display='none'">`
          : `<div class="s-flag flag-placeholder"></div>`;
      }

      const hFlagHtml = resolveFlag(m.home_flag, homeName);
      const aFlagHtml = resolveFlag(m.away_flag, awayName);

      return `
        <div class="search-result-item${hasScore ? '' : ' sri-disabled'}" ${hasScore ? `data-idx="${i}" role="option" tabindex="0"` : 'aria-disabled="true"'}>
          <div class="sri-row">
            ${hFlagHtml}
            <span class="s-home">${homeName}</span>
            <span class="s-score${hasScore ? ' has-score' : ''}">${scoreStr}</span>
            <span class="s-away">${awayName}</span>
            ${aFlagHtml}
            <span class="s-date">${m.date || '—'}</span>
          </div>
          <div class="sri-status">
            <span class="s-bucket ${bucketCls}">${bucketLabel}</span>
            ${m.stage ? `<span class="s-stage-label">${m.stage}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Scroll fade — only when 4+ results (meaning content overflows)
    const needsFade = matches.length >= 4;
    resultsEl.classList.toggle('has-fade', needsFade);
    if (needsFade) {
      const checkSearchFade = () => {
        const atEnd = resultsEl.scrollTop + resultsEl.clientHeight >= resultsEl.scrollHeight - 8;
        resultsEl.classList.toggle('at-end', atEnd);
      };
      resultsEl.removeEventListener('scroll', resultsEl._searchFadeHandler);
      resultsEl._searchFadeHandler = checkSearchFade;
      resultsEl.addEventListener('scroll', checkSearchFade, { passive: true });
      setTimeout(checkSearchFade, 50);
    } else {
      resultsEl.classList.remove('at-end');
    }

    resultsEl.querySelectorAll('.search-result-item[data-idx]').forEach((row, i) => {
      const m = matches.filter(x => x.score_home != null)[i];
      if (!m) return;
      const select = () => {
        resultsEl.classList.add('hidden');
        window._roosterState = window._roosterState || {};
        window._roosterState.pinnedMatch = m;
        onNavigate('insight');
      };
      row.addEventListener('click', select);
      row.addEventListener('keydown', e => { if (e.key === 'Enter') select(); });
    });

  } catch (err) {
    console.error('Search error:', err);
  }
}

// ── Match card ────────────────────────────────────────────────
function matchCard(m, btnType, isPinned = false) {
  const hFlag    = flagUrl(m.home, 80);
  const aFlag    = flagUrl(m.away, 80);
  const scoreStr = m.score_home != null ? `${m.score_home}–${m.score_away}` : 'vs';
  const hasScore = m.score_home != null;

  const btn = btnType === 'insight'
    ? `<button class="btn-insight mc-btn" aria-label="Insight for ${m.home} vs ${m.away}">${t('insight_btn')}</button>`
    : `<button class="btn-preview mc-btn" aria-label="Preview: ${m.home} vs ${m.away}">${t('preview_btn')}</button>`;

  return `
    <div class="match-card" data-id="${m.id}" role="button" tabindex="0" aria-label="${m.home} vs ${m.away}">
      ${isPinned ? `<span class="pinned-badge-card">Pinned</span>` : ''}
      <div class="mc-inner">
        <div class="mc-team">
          ${hFlag
            ? `<img src="${hFlag}" alt="${m.home}" class="mc-flag"
                onerror="this.outerHTML='<div class=\\'mc-flag flag-placeholder\\'></div>'">`
            : `<div class="mc-flag flag-placeholder"></div>`}
          <span class="mc-name">${m.home}</span>
        </div>
        <div class="mc-center">
          ${m.date ? `<span class="mc-date">${m.date}</span>` : ''}
          <span class="mc-score${hasScore ? '' : ' mc-vs'}">${scoreStr}</span>
          ${m.stage ? `<span class="mc-stage">${m.stage}</span>` : ''}
        </div>
        <div class="mc-team">
          ${aFlag
            ? `<img src="${aFlag}" alt="${m.away}" class="mc-flag"
                onerror="this.outerHTML='<div class=\\'mc-flag flag-placeholder\\'></div>'">`
            : `<div class="mc-flag flag-placeholder"></div>`}
          <span class="mc-name">${m.away}</span>
        </div>
      </div>
      ${btn}
    </div>
  `;
}

// ── Navigation helper ─────────────────────────────────────────
function goInsight(match, state, onNavigate) {
  state.pinnedMatch    = match;
  state.analysisResult = null;   // clear old result for new match
  state.previewResult  = null;   // upcoming match preview no longer relevant
  state.isPreview      = false;
  window._roosterState = state;
  onNavigate('insight');
}

function goPreview(match, onNavigate) {
  const s = window._roosterState || {};
  s.pinnedMatch    = match;
  s.isPreview      = true;
  s.previewResult  = null;   // always fetch fresh for the new match
  s.analysisResult = null;   // finished match analysis no longer relevant
  window._roosterState = s;
  onNavigate('loading');
}

// ── Scroll fade helper ─────────────────────────────────────────
function attachScrollFade(container, scrollSel, wrapSel) {
  const box  = container.querySelector(scrollSel);
  const wrap = container.querySelector(wrapSel);
  if (!box || !wrap) return;

  function check() {
    const atEnd = box.scrollTop + box.clientHeight >= box.scrollHeight - 8;
    wrap.classList.toggle('at-end', atEnd);
  }
  box.addEventListener('scroll', check, { passive: true });
  setTimeout(check, 100);
}

// ── Calendar ──────────────────────────────────────────────────

function attachCalendar(container, onNavigate) {
  const btn      = container.querySelector('#cal-icon-btn');
  const overlay  = container.querySelector('#cal-overlay');
  const backdrop = container.querySelector('#cal-backdrop');
  if (!btn || !overlay) return;

  btn.addEventListener('click', e => {
    e.stopPropagation();
    openCalendar(container, onNavigate);
  });

  backdrop.addEventListener('click', () => closeCalendar(container));

  if (attachCalendar._escHandler) {
    document.removeEventListener('keydown', attachCalendar._escHandler);
  }
  attachCalendar._escHandler = e => {
    if (e.key === 'Escape' && calendarOpen) closeCalendar(container);
  };
  document.addEventListener('keydown', attachCalendar._escHandler);
}

function openCalendar(container, onNavigate) {
  calendarOpen = true;
  const overlay = container.querySelector('#cal-overlay');
  overlay.classList.remove('hidden');
  // trigger transition
  requestAnimationFrame(() => overlay.classList.add('cal-visible'));

  // Init calendar state
  container._calState = {
    year:          new Date().getFullYear(),
    month:         new Date().getMonth(),
    selectedDate:  null,
    searchQuery:   '',
    onNavigate,
  };

  // Fetch calendar data then render
  fetchCalendarData(container);
  wireCalendarControls(container, onNavigate);
}

function closeCalendar(container) {
  calendarOpen = false;
  const overlay = container.querySelector('#cal-overlay');
  overlay.classList.remove('cal-visible');
  setTimeout(() => overlay.classList.add('hidden'), 250);

  // Clear cal search
  const ci = container.querySelector('#cal-search-input');
  if (ci) ci.value = '';
}

async function fetchCalendarData(container) {
  // Only treat a PRIOR SUCCESSFUL load as cached — a failed load (HTTP error
  // or network error) must retry next time the calendar opens, not get stuck
  // showing a permanently-empty grid for the rest of the session.
  if (calendarData && !calendarLoadFailed) {
    renderCalendarGrid(container);
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/calendar`);
    // main.py's /calendar returns {"detail": "..."} (no "matches" key) on a
    // 500 — fetch() does NOT throw for that, it resolves normally. Without
    // this check, `data.matches || []` silently becomes an empty array that
    // looks identical to "successfully loaded, zero matches" — which then
    // gets cached as success above, permanently disabling every date.
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    calendarData = data.matches || [];
    calendarLoadFailed = false;
  } catch (err) {
    console.error('Calendar fetch failed, falling back to hero data:', err);
    // Fallback: build from heroData if calendar endpoint errored/unavailable.
    // Still marked as failed — heroData only covers a few days around today,
    // not the full tournament, so we want to keep retrying the real
    // endpoint on subsequent calendar opens rather than treating this
    // partial fallback as the permanent answer.
    calendarData = [
      ...((heroData?.yesterday)    || []),
      ...((heroData?.two_days_ago) || []),
      ...((heroData?.today)        || []),
      ...((heroData?.upcoming)     || []),
    ];
    calendarLoadFailed = true;
  }
  renderCalendarGrid(container);
}

function renderCalendarGrid(container) {
  const s          = container._calState;
  const labelEl    = container.querySelector('#cal-month-label');
  const gridEl     = container.querySelector('#cal-grid');
  if (!labelEl || !gridEl || !s) return;
  const onNavigate = s.onNavigate;

  const monthNames = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
  labelEl.textContent = `${monthNames[s.month]} ${s.year}`;

  const firstDay = new Date(s.year, s.month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(s.year, s.month + 1, 0).getDate();

  // Group calendar data by date string
  const matchesByDate = {};
  (calendarData || []).forEach(m => {
    if (!m.date) return;
    if (!m.home || m.home === 'null' || !m.away || m.away === 'null') return;
    (matchesByDate[m.date] = matchesByDate[m.date] || []).push(m);
  });

  // Highlighted dates from search
  const q = (s.searchQuery || '').toLowerCase().trim();
  const highlightedDates = new Set();
  if (q) {
    (calendarData || []).forEach(m => {
      if (!m.date) return;
      if ((m.home || '').toLowerCase().includes(q) || (m.away || '').toLowerCase().includes(q)) {
        highlightedDates.add(m.date);
      }
    });
  }

  let html = '';

  // Leading empty cells
  for (let i = 0; i < firstDay; i++) html += `<div class="cal-cell cal-cell-empty"></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr  = `${s.year}-${String(s.month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayMatches = matchesByDate[dateStr] || [];
    const hasMatches = dayMatches.length > 0;
    const isSelected = !s.searchQuery && s.selectedDate === dateStr;
    const isToday    = dateStr === new Date().toISOString().slice(0,10);
    const isHL       = q && highlightedDates.has(dateStr);
    const isHLOnly   = isHL && !isSelected; // highlighted by search but not clicked

    let cls = 'cal-cell';
    if (!hasMatches)  cls += ' cal-cell-empty-day';
    if (hasMatches)   cls += ' cal-cell-has-matches';
    if (isSelected)   cls += ' cal-cell-selected';
    if (isToday)      cls += ' cal-cell-today';
    if (isHLOnly)     cls += ' cal-cell-hl';

    // Dot indicators: one per match, capped at 4
    const dots = hasMatches
      ? `<div class="cal-dots">${dayMatches.slice(0,4).map(m => {
          const finished = m.score_home != null;
          return `<span class="cal-dot${finished ? ' cal-dot-done' : ' cal-dot-upcoming'}${isHLOnly ? ' cal-dot-hl' : ''}"></span>`;
        }).join('')}${dayMatches.length > 4 ? `<span class="cal-dot-more">+${dayMatches.length-4}</span>` : ''}</div>`
      : '';

    html += `<div class="${cls}" data-date="${dateStr}" data-has="${hasMatches ? '1' : '0'}" role="button" tabindex="${hasMatches ? 0 : -1}">
      <span class="cal-day-num">${d}</span>
      ${dots}
    </div>`;
  }

  gridEl.innerHTML = html;

  // Click handlers on date cells
  gridEl.querySelectorAll('.cal-cell-has-matches').forEach(cell => {
    cell.addEventListener('click', () => {
      const date = cell.dataset.date;
      s.selectedDate = date;
      s.searchQuery  = '';
      const ci = container.querySelector('#cal-search-input');
      if (ci) ci.value = '';
      renderCalendarGrid(container);
      renderCalendarDateMatches(container, matchesByDate[date] || [], onNavigate);
    });
    cell.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') cell.click();
    });
  });
}

function renderCalendarDateMatches(container, matches, onNavigate) {
  const el     = container.querySelector('#cal-right-content');
  const panel  = container.querySelector('#cal-panel-right');
  if (!el) return;

  if (!matches.length) {
    el.innerHTML = `<div class="cal-right-placeholder"><span>No matches on this date</span></div>`;
    return;
  }

  el.innerHTML = matches.map(m => {
    const hasScore = m.score_home != null;
    const scoreStr = hasScore ? `${m.score_home}–${m.score_away}` : 'vs';
    const hf = flagUrl(m.home, 24);
    const af = flagUrl(m.away, 24);

    const hFlagHtml = hf
      ? `<img src="${hf}" alt="${m.home}" class="cal-m-flag" onerror="this.style.display='none'">`
      : `<div class="cal-m-flag flag-placeholder"></div>`;
    const aFlagHtml = af
      ? `<img src="${af}" alt="${m.away}" class="cal-m-flag" onerror="this.style.display='none'">`
      : `<div class="cal-m-flag flag-placeholder"></div>`;

    return `
      <div class="cal-match-row cal-match-clickable${hasScore ? '' : ' cal-match-upcoming'}" data-id="${m.id}">
        <div class="cal-match-stage">${m.stage || ''}</div>
        <div class="cal-match-teams">
          ${hFlagHtml}
          <span class="cal-m-name">${m.home}</span>
          <span class="cal-m-score${hasScore ? ' cal-m-score-done' : ''}">${scoreStr}</span>
          <span class="cal-m-name cal-m-name-away">${m.away}</span>
          ${aFlagHtml}
        </div>
        ${hasScore
          ? `<div class="cal-match-status cal-status-done">${t('section_finished')}</div>`
          : `<div class="cal-match-status-row">
               <button class="cal-match-status cal-status-preview" data-preview-id="${m.id}" type="button">${t('preview_btn')}</button>
               <div class="cal-match-status cal-status-upcoming">${m.time || 'TBD'}</div>
             </div>`}
      </div>
    `;
  }).join('');

  // Click row: finished → insight, upcoming → preview
  el.querySelectorAll('.cal-match-clickable').forEach(row => {
    const m = matches.find(x => String(x.id) === row.dataset.id);
    if (!m) return;
    row.addEventListener('click', () => {
      closeCalendar(container);
      if (m.score_home != null) {
        window._roosterState = window._roosterState || {};
        window._roosterState.pinnedMatch = m;
        onNavigate('insight');
      } else {
        goPreview(m, onNavigate);
      }
    });
  });

  // Click PREVIEW button on upcoming matches
  el.querySelectorAll('.cal-status-preview').forEach(btn => {
    const m = matches.find(x => String(x.id) === btn.dataset.previewId);
    if (!m) return;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      closeCalendar(container);
      goPreview(m, onNavigate);
    });
  });

  // Scroll-fade
  if (panel) {
    const checkFade = () => {
      const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
      panel.classList.toggle('at-end', atEnd);
    };
    el.removeEventListener('scroll', el._calFadeHandler);
    el._calFadeHandler = checkFade;
    el.addEventListener('scroll', checkFade, { passive: true });
    setTimeout(checkFade, 50);
  }
}

function renderCalendarSearchResults(container, onNavigate) {
  const s     = container._calState;
  const el    = container.querySelector('#cal-right-content');
  const panel = container.querySelector('#cal-panel-right');
  if (!el || !s) return;

  const q = (s.searchQuery || '').toLowerCase().trim();
  if (!q) {
    // If a date was selected before searching, restore it
    if (s.selectedDate) {
      const matchesByDate = {};
      (calendarData || []).forEach(m => {
        if (!m.date) return;
        if (!m.home || m.home === 'null' || !m.away || m.away === 'null') return;
        (matchesByDate[m.date] = matchesByDate[m.date] || []).push(m);
      });
      renderCalendarDateMatches(container, matchesByDate[s.selectedDate] || [], onNavigate);
    } else {
      el.innerHTML = `<div class="cal-right-placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>
          <line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/>
        </svg>
        <span>Click a date to see matches</span>
      </div>`;
    }
    return;
  }

  const results = (calendarData || []).filter(m =>
    m.home && m.home !== 'null' && m.away && m.away !== 'null' &&
    ((m.home || '').toLowerCase().includes(q) ||
    (m.away || '').toLowerCase().includes(q))
  );

  if (!results.length) {
    el.innerHTML = `<div class="cal-right-placeholder"><span>No matches found for "${s.searchQuery}"</span></div>`;
    return;
  }

  el.innerHTML = results.map(m => {
    const hasScore = m.score_home != null;
    const scoreStr = hasScore ? `${m.score_home}–${m.score_away}` : 'vs';
    const hf = flagUrl(m.home, 24);
    const af = flagUrl(m.away, 24);
    const hFlagHtml = hf ? `<img src="${hf}" alt="${m.home}" class="cal-m-flag" onerror="this.style.display='none'">` : `<div class="cal-m-flag flag-placeholder"></div>`;
    const aFlagHtml = af ? `<img src="${af}" alt="${m.away}" class="cal-m-flag" onerror="this.style.display='none'">` : `<div class="cal-m-flag flag-placeholder"></div>`;

    return `
      <div class="cal-match-row cal-match-clickable${hasScore ? '' : ' cal-match-upcoming'}" data-id="${m.id}">
        <div class="cal-match-stage">${m.stage || ''} · ${m.date || ''}</div>
        <div class="cal-match-teams">
          ${hFlagHtml}
          <span class="cal-m-name">${m.home}</span>
          <span class="cal-m-score${hasScore ? ' cal-m-score-done' : ''}">${scoreStr}</span>
          <span class="cal-m-name cal-m-name-away">${m.away}</span>
          ${aFlagHtml}
        </div>
        ${hasScore
          ? `<div class="cal-match-status cal-status-done">${t('section_finished')}</div>`
          : `<div class="cal-match-status-row">
               <button class="cal-match-status cal-status-preview" data-preview-id="${m.id}" type="button">${t('preview_btn')}</button>
               <div class="cal-match-status cal-status-upcoming">${m.time || 'TBD'}</div>
             </div>`}
      </div>
    `;
  }).join('');

  el.querySelectorAll('.cal-match-clickable').forEach(row => {
    const m = results.find(x => String(x.id) === row.dataset.id);
    if (!m) return;
    row.addEventListener('click', () => {
      closeCalendar(container);
      if (m.score_home != null) {
        window._roosterState = window._roosterState || {};
        window._roosterState.pinnedMatch = m;
        onNavigate('insight');
      } else {
        goPreview(m, onNavigate);
      }
    });
  });

  // Click PREVIEW button on upcoming matches
  el.querySelectorAll('.cal-status-preview').forEach(btn => {
    const m = results.find(x => String(x.id) === btn.dataset.previewId);
    if (!m) return;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      closeCalendar(container);
      goPreview(m, onNavigate);
    });
  });

  // Scroll-fade
  if (panel) {
    const checkFade = () => {
      const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
      panel.classList.toggle('at-end', atEnd);
    };
    el.removeEventListener('scroll', el._calFadeHandler);
    el._calFadeHandler = checkFade;
    el.addEventListener('scroll', checkFade, { passive: true });
    setTimeout(checkFade, 50);
  }
}

function wireCalendarControls(container, onNavigate) {
  const prevBtn = container.querySelector('#cal-prev');
  const nextBtn = container.querySelector('#cal-next');
  const calSearchInput = container.querySelector('#cal-search-input');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const s = container._calState;
      if (!s) return;
      s.month--;
      if (s.month < 0) { s.month = 11; s.year--; }
      s.selectedDate = null;
      renderCalendarGrid(container);
      resetCalRight(container);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const s = container._calState;
      if (!s) return;
      s.month++;
      if (s.month > 11) { s.month = 0; s.year++; }
      s.selectedDate = null;
      renderCalendarGrid(container);
      resetCalRight(container);
    });
  }

  let calSearchDebounce = null;
  if (calSearchInput) {
    calSearchInput.addEventListener('input', () => {
      const s = container._calState;
      if (!s) return;
      s.searchQuery = calSearchInput.value;
      clearTimeout(calSearchDebounce);
      calSearchDebounce = setTimeout(() => {
        renderCalendarGrid(container);
        renderCalendarSearchResults(container, onNavigate);
      }, 200);
    });
  }
}

function resetCalRight(container) {
  const el = container.querySelector('#cal-right-content');
  if (!el) return;
  el.innerHTML = `<div class="cal-right-placeholder">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/>
    </svg>
    <span>Click a date to see matches</span>
  </div>`;
}


function skeletons(n) {
  return Array(n).fill('<div class="skeleton"></div>').join('');
}

function emptyState(msg) {
  return `<div class="empty-state">${msg}</div>`;
}

function errorMsg(msg) {
  return `<div class="empty-state error-state">${msg}</div>`;
}