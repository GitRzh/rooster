// ============================================================
//  stage1-hero.js — Hero page: finished / featured / upcoming
// ============================================================

import { API_BASE, flagImg, flagUrl } from './config.js';
import { buildNav, buildTicker, attachNavListeners } from './nav.js';

let heroData       = null;
let pinnedMatch    = null;
let searchDebounce = null;

const MAX_CARDS = 4; // max visible cards before fade/scroll

// ── Render ────────────────────────────────────────────────────
export function renderHero(container, state, onNavigate) {
  pinnedMatch = state.pinnedMatch || null;

  container.innerHTML = `
    ${buildNav('hero', onNavigate)}
    <div id="hero-ticker">${buildTicker([])}</div>
    <div class="hero-body stage">

      <!-- Search — full width -->
      <div class="hero-search-row">
        <div class="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" id="search-input" placeholder="Search team or match…" autocomplete="off" aria-label="Search matches">
          <div class="search-results hidden" id="search-results" role="listbox"></div>
        </div>
      </div>

      <!-- Finished (left) -->
      <div class="hero-col finished-col">
        <div class="section-head">
          <span class="section-title">Finished</span>
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
          <span class="section-title" id="featured-label">Featured</span>
        </div>
        <div id="featured-card-wrap">
          ${renderFeaturedEmpty()}
        </div>
        <div id="today-section"></div>
      </div>

      <!-- Upcoming (right) -->
      <div class="hero-col upcoming-col">
        <div class="section-head">
          <span class="section-title">Upcoming</span>
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
  loadHero(container, state, onNavigate);
}

// ── Data load ─────────────────────────────────────────────────
async function loadHero(container, state, onNavigate) {
  try {
    const res = await fetch(`${API_BASE}/hero`);
    heroData   = await res.json();

    const liveMatches = heroData.live || [];
    const tickerEl    = container.querySelector('#hero-ticker');
    if (tickerEl) tickerEl.innerHTML = buildTicker(liveMatches);

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
  el.innerHTML = matches.map(m => matchCard(m, 'sch')).join('');

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
        Today
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
  if (labelEl) labelEl.textContent = isPinned ? 'Pinned' : 'Featured';

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
        ${isPinned ? 'Pinned Match' : 'Featured Match'}
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
          ? `<button class="btn-featured-insight" id="featured-insight-btn">Analyze this Match →</button>`
          : `<button class="btn-sch btn-full" disabled>Upcoming · No analysis yet</button>`}
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
}

function renderFeaturedEmpty() {
  return `
    <div class="featured-card featured-card-empty">
      <div class="featured-badge">Featured Match</div>
      <div class="featured-body">
        <div class="featured-empty-msg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4l3 3"/>
          </svg>
          <span>Click any match to feature it here</span>
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

  document.addEventListener('click', e => {
    if (!container.querySelector('.search-wrap')?.contains(e.target)) {
      results.classList.add('hidden');
    }
  });
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
    ? `<button class="btn-insight mc-btn" aria-label="Insight for ${m.home} vs ${m.away}">Insight</button>`
    : `<button class="btn-sch mc-btn" aria-label="Scheduled: ${m.home} vs ${m.away}">TBD</button>`;

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
  state.pinnedMatch = match;
  window._roosterState = state;
  onNavigate('insight');
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

// ── Skeletons / empty states ──────────────────────────────────
function skeletons(n) {
  return Array(n).fill('<div class="skeleton"></div>').join('');
}

function emptyState(msg) {
  return `<div class="empty-state">${msg}</div>`;
}

function errorMsg(msg) {
  return `<div class="empty-state error-state">${msg}</div>`;
}