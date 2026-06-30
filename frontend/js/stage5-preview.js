// ============================================================
//  stage5-preview.js — Upcoming match preview
//  No score, no Docling — pure LLM from team names + context
// ============================================================

import { flagUrl, flagImg, fetchWikiData, escapeHtml, API_BASE, t } from './config.js';
import { attachNavListeners } from './nav.js';

export async function renderPreview(container, state, onNavigate) {
  const match = state.pinnedMatch;
  if (!match) { onNavigate('hero'); return; }

  // No result yet, or stale result with empty team data — go through the
  // proper loading stage (cinematic wipe + callPreview in stage3-loading.js)
  const hasTeamData = state.previewResult?.team_home?.style
    || state.previewResult?.team_home?.danger
    || state.previewResult?.team_away?.style;

  if (!state.previewResult || !hasTeamData) {
    state.previewResult = null;
    state.isPreview     = true;
    window._roosterState = state;
    try { sessionStorage.removeItem('rooster_state'); } catch (_) {}
    onNavigate('loading');
    return;
  }

  renderPreviewContent(container, state, onNavigate);
}

async function renderPreviewContent(container, state, onNavigate) {
  const match  = state.pinnedMatch;
  const result = state.previewResult;

  const hFlag = flagUrl(match.home, 80);
  const aFlag = flagUrl(match.away, 80);

  container.innerHTML = `
    <div class="result-body stage" id="preview-stage">

      <!-- LEFT 65% -->
      <div class="result-left">

        <!-- Pinned bar — same pattern as result -->
        <div class="result-pinned-bar">
          <div class="result-pinned-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            ${t('pv_upcoming')}
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
              <div class="result-score-str pv-vs-str">VS</div>
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
            <span class="result-q-badge">${t('pv_preview')}</span>
            <button class="btn-back" id="pv-back-btn" aria-label="Back">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="11" height="11" aria-hidden="true">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              ${t('pv_change_match')}
            </button>
          </div>
        </div>

        <!-- Scrollable content -->
        <div class="pv-left-scroll">
          <div class="pv-content-frame-wrap"><div class="pv-content-frame">

            <!-- Headline -->
            ${result.headline ? `
              <div class="pv-headline"><span class="pv-this-time-inline">THIS TIME:</span> ${escapeHtml(result.headline)}</div>
            ` : ''}

            <!-- Fight card — two team columns -->
            <div class="pv-fightcard">
              ${buildTeamColumn(match.home, hFlag, result.team_home, 'home')}
              <div class="pv-fightcard-divider"></div>
              ${buildTeamColumn(match.away, aFlag, result.team_away, 'away')}
            </div>

            <!-- H2H banner -->
            ${buildH2H(result)}

            <!-- Tactical contrast -->
            ${result.tactical_contrast ? `
              <div class="pv-section">
                <div class="pv-section-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11" aria-hidden="true">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                  ${t('pv_tactical_contrast')}
                </div>
                <div class="pv-section-body">${escapeHtml(result.tactical_contrast)}</div>
              </div>
            ` : ''}

            <!-- Unmissable storyline -->
            ${result.unmissable_storyline ? `
              <div class="pv-section pv-section-story">
                <div class="pv-section-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11" aria-hidden="true">
                    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" fill="currentColor"/>
                  </svg>
                  ${t('pv_why_unmissable')}
                </div>
                <div class="pv-section-body pv-story-body">${escapeHtml(result.unmissable_storyline)}</div>
              </div>
            ` : ''}

          </div></div><!-- /pv-content-frame-wrap -->
        </div><!-- /pv-left-scroll -->

      </div>

      <!-- RIGHT 35% — players + managers to watch -->
      <aside class="result-right" id="pv-right-panel">
        <div class="pv-watch-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          ${t('pv_watch')}
        </div>

        <div class="pv-entity-scroll-wrap" id="pv-scroll-wrap">
          <div id="pv-entity-list">
            <div class="entity-loading">
              <div class="mvp-spinner"></div>
              <span>Loading profiles…</span>
            </div>
          </div>
        </div>
      </aside>

    </div>

    <style>
      /* ── Preview-specific styles ── */
      /* ── Content frame: border-only fade via pseudo, content unaffected ── */
      .pv-content-frame-wrap {
        flex: 1;
        min-height: 0;
        margin: 0 28px;
        position: relative;
        overflow: hidden;
      }

      /* The fading border lives on a pseudo-element — never touches content */
      .pv-content-frame-wrap::before {
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

      /* Fade hue at bottom — disappears when scrolled to end */
      .pv-content-frame-wrap::after {
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
      .pv-content-frame-wrap.at-end::after { opacity: 0; }

      .pv-content-frame {
        height: 100%;
        overflow-y: auto;
        padding: 16px 0 80px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        position: relative;
        z-index: 0;
      }

      .pv-this-time-inline {
        color: var(--yellow);
        font-weight: 700;
        letter-spacing: 0.08em;
      }

      .pv-match-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 10px 16px;
      }
      .pv-pin-flag {
        width: 28px;
        height: 18px;
        object-fit: cover;
        border-radius: 2px;
        flex-shrink: 0;
      }
      .pv-pin-name {
        font-family: 'IBM Plex Sans', sans-serif;
        font-size: 16px;
        font-weight: 700;
        letter-spacing: -0.01em;
        color: var(--white);
        white-space: nowrap;
      }
      .pv-pin-center {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1px;
        flex-shrink: 0;
        padding: 0 12px;
      }
      .pv-pin-vs {
        font-family: 'IBM Plex Sans', sans-serif;
        font-size: 16px;
        font-weight: 800;
        color: var(--muted);
        letter-spacing: 0.04em;
      }
      .pv-pin-meta {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 8px;
        color: var(--muted);
        letter-spacing: 0.06em;
      }
      .pv-pin-date {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 9px;
        font-weight: 700;
        color: var(--yellow);
        letter-spacing: 0.06em;
      }

      .pv-vs {
        font-size: 18px !important;
        color: var(--muted) !important;
        letter-spacing: 0.08em;
      }

      .pv-headline {
        font-family: 'IBM Plex Sans', sans-serif;
        font-size: 17px;
        font-weight: 700;
        color: var(--yellow);
        line-height: 1.35;
        padding: 4px 16px 0;
        letter-spacing: -0.01em;
        text-align: center;
      }

      /* ── Fight card ── */
      .pv-fightcard {
        display: grid;
        grid-template-columns: 1fr 2px 1fr;
        gap: 0;
        margin: 0 28px;
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        background: var(--bg-card);
      }

      .pv-team-col {
        padding: 18px 16px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .pv-team-col.home { border-right: 1px solid var(--border); }

      .pv-team-head {
        display: flex;
        align-items: center;
        gap: 8px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--border);
      }

      .pv-team-flag {
        width: 28px;
        height: 18px;
        object-fit: cover;
        border-radius: 2px;
        flex-shrink: 0;
      }

      .pv-team-name {
        font-family: 'IBM Plex Sans', sans-serif;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: -0.01em;
        color: var(--white);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .pv-team-row {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .pv-row-label {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 8px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--muted);
      }

      .pv-row-val {
        font-family: 'IBM Plex Sans', sans-serif;
        font-size: 12px;
        color: var(--muted-bright);
        line-height: 1.45;
      }

      .pv-row-val.danger { color: var(--yellow); }
      .pv-row-val.weakness { color: rgba(239,68,68,0.75); }

      .pv-manager-row {
        margin-top: auto;
        padding-top: 10px;
        border-top: 1px solid var(--border);
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .pv-manager-icon {
        color: var(--muted);
        flex-shrink: 0;
      }

      .pv-manager-name {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 9px;
        font-weight: 700;
        color: #60a5fa;
        letter-spacing: 0.04em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .pv-fightcard-divider {
        width: 2px;
        background: var(--yellow);
        opacity: 0.35;
      }

      /* ── H2H banner ── */
      .pv-h2h {
        margin: 0 16px;
        padding: 10px 14px;
        border: 1px solid var(--border-y);
        border-radius: var(--radius-sm);
        background: var(--yellow-ghost);
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .pv-h2h-icon { color: var(--yellow); flex-shrink: 0; }

      .pv-h2h-text {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 10px;
        color: var(--muted-bright);
        line-height: 1.5;
      }

      .pv-h2h-badge {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 8px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--yellow);
        background: rgba(245,230,66,0.12);
        border: 1px solid var(--border-y);
        border-radius: 3px;
        padding: 2px 6px;
        flex-shrink: 0;
      }

      /* ── Sections (tactical / storyline) ── */
      .pv-section {
        margin: 0 16px;
        padding: 14px 16px;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        background: var(--bg-card);
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .pv-section-story {
        border-color: rgba(245,230,66,0.2);
        background: linear-gradient(135deg, rgba(245,230,66,0.05) 0%, var(--bg-card) 60%);
        margin-bottom: 24px;
      }

      .pv-section-label {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--yellow);
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .pv-section-body {
        font-family: 'IBM Plex Sans', sans-serif;
        font-size: 13px;
        color: var(--muted-bright);
        line-height: 1.6;
      }

      .pv-this-time-heading {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: var(--yellow);
      }

      .pv-story-body {
        font-size: 14px;
        color: var(--white);
        font-weight: 500;
      }

      /* ── Layout lock: pinned bar fixed, content scrolls ── */
      body { overflow: hidden !important; height: 100vh !important; }

      #preview-stage {
        height: calc(100vh - var(--nav-h) - var(--ticker-h));
        min-height: unset;
        overflow: hidden;
      }

      #preview-stage .result-left {
        height: 100%;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        padding-bottom: 0;
      }

      #preview-stage .result-pinned-bar { flex-shrink: 0; }

      .pv-left-scroll {
        flex: 1;
        min-height: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        padding: 16px 0 0;
      }

      #preview-stage .result-right {
        height: 100%;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      /* ── Right panel ── */
      .pv-watch-label {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--yellow);
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 0 0 12px;
        border-bottom: 1px solid var(--border);
        margin-bottom: 14px;
        flex-shrink: 0;
      }

      /* Watch tabs: Players / Managers */
      .pv-watch-tabs {
        display: flex;
        gap: 6px;
        margin-bottom: 12px;
        flex-shrink: 0;
      }
      .pv-watch-tab {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 8px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        padding: 3px 8px;
        border-radius: 3px;
        border: 1px solid var(--border);
        background: transparent;
        color: var(--muted);
        cursor: pointer;
        transition: all 0.15s;
      }
      .pv-watch-tab.active-players {
        color: #4ade80;
        background: rgba(74,222,128,0.1);
        border-color: rgba(74,222,128,0.3);
      }
      .pv-watch-tab.active-managers {
        color: #60a5fa;
        background: rgba(96,165,250,0.1);
        border-color: rgba(96,165,250,0.3);
      }

      /* ── Entity list with scroll fade hue ── */
      .pv-entity-scroll-wrap {
        position: relative;
        flex: 1;
        min-height: 0;
      }

      #pv-entity-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        overflow-y: auto;
        height: 100%;
        padding-bottom: 4px;
      }

      /* Fade hue at bottom — disappears when scrolled to end */
      .pv-entity-scroll-wrap::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 52px;
        background: linear-gradient(to top, var(--bg-card) 0%, transparent 100%);
        pointer-events: none;
        border-radius: 0 0 var(--radius-sm) var(--radius-sm);
        transition: opacity 0.25s;
      }
      .pv-entity-scroll-wrap.at-end::after { opacity: 0; }

      .pv-entity-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        transition: border-color 0.15s;
      }

      .pv-entity-card:hover { border-color: var(--border-y); }

      .pv-entity-top {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .pv-entity-photo {
        width: 42px;
        height: 42px;
        border-radius: var(--radius-sm);
        object-fit: cover;
        flex-shrink: 0;
        background: var(--bg-card-alt);
      }

      .pv-entity-initials {
        width: 42px;
        height: 42px;
        border-radius: var(--radius-sm);
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 13px;
        font-weight: 700;
        color: var(--bg);
        letter-spacing: 0.04em;
      }

      .pv-entity-meta {
        display: flex;
        flex-direction: column;
        gap: 3px;
        min-width: 0;
      }

      .pv-entity-name {
        font-family: 'IBM Plex Sans', sans-serif;
        font-size: 13px;
        font-weight: 700;
        color: var(--white);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .pv-entity-name a {
        color: inherit;
        text-decoration: none;
      }
      .pv-entity-name a:hover { color: var(--yellow); }

      .pv-entity-badges {
        display: flex;
        align-items: center;
        gap: 5px;
        flex-wrap: wrap;
      }

      .pv-entity-team {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 8px;
        font-weight: 700;
        letter-spacing: 0.09em;
        text-transform: uppercase;
        color: var(--muted);
        background: var(--bg-card-alt);
        border: 1px solid var(--border);
        border-radius: 3px;
        padding: 2px 6px;
      }

      .pv-entity-why {
        font-family: 'IBM Plex Sans', sans-serif;
        font-size: 11px;
        color: var(--muted-bright);
        line-height: 1.5;
        border-top: 1px solid var(--border);
        padding-top: 7px;
      }

      /* manager badge reuse */
      .manager-badge {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 8px;
        font-weight: 700;
        letter-spacing: 0.09em;
        text-transform: uppercase;
        color: #60a5fa;
        background: rgba(96,165,250,0.1);
        border: 1px solid rgba(96,165,250,0.3);
        border-radius: 3px;
        padding: 2px 6px;
      }

      .player-badge {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 8px;
        font-weight: 700;
        letter-spacing: 0.09em;
        text-transform: uppercase;
        color: #4ade80;
        background: rgba(74,222,128,0.1);
        border: 1px solid rgba(74,222,128,0.25);
        border-radius: 3px;
        padding: 2px 6px;
      }

      /* RTL */
      [dir="rtl"] .pv-fightcard   { direction: ltr; }
      [dir="rtl"] .pv-team-name   { direction: rtl; text-align: right; }
      [dir="rtl"] .pv-section-label { flex-direction: row-reverse; }
      [dir="rtl"] .pv-h2h         { flex-direction: row-reverse; text-align: right; }
      [dir="rtl"] .pv-entity-top  { flex-direction: row-reverse; }
      [dir="rtl"] .pv-entity-meta { text-align: right; }
      [dir="rtl"] .pv-watch-label { flex-direction: row-reverse; }
      [dir="rtl"] .pv-manager-row { flex-direction: row-reverse; }
    </style>
  `;

  attachNavListeners(container, onNavigate);
  container.querySelector('#pv-back-btn').addEventListener('click', () => {
    document.body.style.overflow = '';
    document.body.style.height   = '';
    onNavigate('hero');
  });

  // Load entity cards asynchronously
  loadWatchList(container, result, match);

  // ── Scroll fade hue on content frame ──
  const frameEl = container.querySelector('.pv-content-frame');
  const frameWrapEl = container.querySelector('.pv-content-frame-wrap');
  if (frameEl && frameWrapEl) {
    const checkFrameFade = () => {
      const atEnd = frameEl.scrollHeight - frameEl.scrollTop - frameEl.clientHeight < 8;
      frameWrapEl.classList.toggle('at-end', atEnd);
    };
    frameEl.addEventListener('scroll', checkFrameFade, { passive: true });
    setTimeout(checkFrameFade, 100);
  }
}

// ── Fight card team column ────────────────────────────────────
function buildTeamColumn(teamName, flagSrc, teamData, side) {
  if (!teamData) return `<div class="pv-team-col ${side}"></div>`;

  const flagHtml = flagSrc
    ? `<img src="${flagSrc}" alt="${teamName}" class="pv-team-flag"
        onerror="this.style.display='none'">`
    : `<div class="pv-team-flag flag-placeholder"></div>`;

  const managerHtml = '';

  return `
    <div class="pv-team-col ${side}">
      <div class="pv-team-head">
        ${flagHtml}
        <span class="pv-team-name">${escapeHtml(teamName)}</span>
      </div>
      ${teamData.style ? `
        <div class="pv-team-row">
          <span class="pv-row-label">${t('pv_style')}</span>
          <span class="pv-row-val">${escapeHtml(teamData.style)}</span>
        </div>
      ` : ''}
      ${teamData.danger ? `
        <div class="pv-team-row">
          <span class="pv-row-label">${t('pv_danger')}</span>
          <span class="pv-row-val danger">${escapeHtml(teamData.danger)}</span>
        </div>
      ` : ''}
      ${teamData.weakness ? `
        <div class="pv-team-row">
          <span class="pv-row-label">${t('pv_vulnerability')}</span>
          <span class="pv-row-val weakness">${escapeHtml(teamData.weakness)}</span>
        </div>
      ` : ''}
      ${managerHtml}
    </div>
  `;
}

// ── H2H banner ────────────────────────────────────────────────
function buildH2H(result) {
  if (result.h2h_exists && result.h2h_snippet) {
    return `
      <div class="pv-h2h">
        <svg class="pv-h2h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" aria-hidden="true">
          <polyline points="17 1 21 5 17 9"/>
          <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
          <polyline points="7 23 3 19 7 15"/>
          <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
        </svg>
        <span class="pv-h2h-text">${escapeHtml(result.h2h_snippet)}</span>
      </div>
    `;
  }
  return `
    <div class="pv-h2h">
      <svg class="pv-h2h-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span class="pv-h2h-text">${t('pv_first_meeting_text')}</span>
      <span class="pv-h2h-badge">${t('pv_first_meeting_badge')}</span>
    </div>
  `;
}

// ── Name color hash (matches config.js) ──────────────────────
const NAME_COLORS = [
  '#F5E642','#2D35E8','#4ade80','#f97316',
  '#a78bfa','#38bdf8','#fb7185','#34d399',
  '#fbbf24','#60a5fa','#7EF7E8','#F77EAA',
];
function nameColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return NAME_COLORS[hash % NAME_COLORS.length];
}

// ── Load watch list — players + managers from right panel ─────
async function loadWatchList(container, result, match) {
  const listEl   = container.querySelector('#pv-entity-list');
  const wrapEl   = container.querySelector('#pv-scroll-wrap');
  const tabPlayers  = container.querySelector('#pv-tab-players');
  const tabManagers = null;
  if (!listEl) return;

  // ── Body lock (only left panel scrolls) ──
  document.body.style.overflow = 'hidden';
  document.body.style.height   = '100vh';

  // ── Scroll fade hue ──
  if (wrapEl) {
    const scrollEl = listEl;
    const checkFade = () => {
      const atEnd = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight < 8;
      wrapEl.classList.toggle('at-end', atEnd);
    };
    scrollEl.addEventListener('scroll', checkFade, { passive: true });
    // Initial check after content loads
    setTimeout(checkFade, 100);
  }

  const allEntities = result.players_to_watch || [];
  if (!allEntities.length) {
    listEl.innerHTML = `<div class="entity-card-empty">No watch list available.</div>`;
    return;
  }

  // Separate players vs managers
  const players  = allEntities.filter(p => !p.role || !/manager|coach/i.test(p.role));

  // Build and render card HTML (shared)
  const renderList = async (list, idPrefix) => {
    listEl.innerHTML = list.map((_, i) => `
      <div class="pv-entity-card" id="${idPrefix}-${i}">
        <div class="skeleton" style="height:42px;border-radius:var(--radius-sm);"></div>
        <div class="skeleton" style="height:28px;border-radius:var(--radius-sm);margin-top:4px;"></div>
      </div>
    `).join('');
    await Promise.all(list.map(async (p, i) => {
      const cardEl = container.querySelector(`#${idPrefix}-${i}`);
      if (!cardEl) return;
      await fillCard(cardEl, p, match);
    }));
    setTimeout(() => wrapEl?.classList.toggle('at-end', listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight < 8), 100);
  };

  let activeTab = 'players';

  const switchTab = (tab) => {
    activeTab = tab;
    if (tab === 'players') {
      tabPlayers?.classList.add('active-players');
      tabManagers?.classList.remove('active-managers');
      renderList(players, 'pv-pl');
    } else {
      tabManagers?.classList.add('active-managers');
      tabPlayers?.classList.remove('active-players');
      renderList(managers.length ? managers : allEntities.filter(p => p.role && /manager|coach/i.test(p.role)), 'pv-mg');
    }
  };

  tabPlayers?.addEventListener('click',  () => switchTab('players'));
  tabManagers?.addEventListener('click', () => switchTab('managers'));

  // Default: show players — defer so DOM is fully painted
  setTimeout(() => renderList(players.length ? players : allEntities, 'pv-pl'), 0);
}

async function fillCard(cardEl, p, match) {
  const wikiData = await fetchWikiData(p.name);
  const initials = p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const color    = nameColor(p.name);
  const isManager = p.role && /manager|coach/i.test(p.role);
  // p.team is now the literal team name (e.g. "Norway"), not an abstract 'home'/'away' label —
  // match it case-insensitively against the real match teams, with a safe fallback to whichever
  // side it most resembles so a stray casing/whitespace difference from the model never breaks display.
  const normalize = s => (s || '').trim().toLowerCase();
  const teamLabel = normalize(p.team) === normalize(match.away) ? match.away : match.home;
  const wikiUrl  = wikiData?.url || `https://en.wikipedia.org/wiki/${encodeURIComponent(p.name.replace(/ /g, '_'))}`;

  const photoHtml = wikiData?.thumbnail
    ? `<img src="${wikiData.thumbnail}" alt="${escapeHtml(p.name)}" class="pv-entity-photo"
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';

  cardEl.innerHTML = `
    <div class="pv-entity-top">
      ${photoHtml}
      <div class="pv-entity-initials" style="background:${color};${wikiData?.thumbnail ? 'display:none;' : ''}">${initials}</div>
      <div class="pv-entity-meta">
        <div class="pv-entity-name">
          <a href="${wikiUrl}" target="_blank" rel="noopener">${escapeHtml(p.name)}<svg style="display:inline-block;vertical-align:middle;margin-left:4px;flex-shrink:0;opacity:0.5;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>
        </div>
        <div class="pv-entity-badges">
          <span class="${isManager ? 'manager-badge' : 'player-badge'}">${isManager ? t('pv_manager') : (p.role || t('pv_player'))}</span>
          <span class="pv-entity-team">${escapeHtml(teamLabel)}</span>
        </div>
      </div>
    </div>
    ${p.why ? `<div class="pv-entity-why">${escapeHtml(p.why)}</div>` : ''}
  `;

  if (wikiData?.thumbnail) {
    const imgEl  = cardEl.querySelector('.pv-entity-photo');
    const initEl = cardEl.querySelector('.pv-entity-initials');
    if (imgEl && initEl) {
      initEl.style.display = 'none';
      imgEl.addEventListener('error', () => {
        imgEl.style.display = 'none';
        initEl.style.display = 'flex';
      });
    }
  }
}