// ============================================================
//  nav.js — Shared nav renderer + ticker
// ============================================================

import { LANGUAGES, getCurrentLang, setCurrentLang, t } from './config.js';

// Inject disabled nav link styles once
(function injectNavStyles() {
  if (document.getElementById('r-nav-styles')) return;
  const s = document.createElement('style');
  s.id = 'r-nav-styles';
  s.textContent = `
    .nav-link-disabled {
      opacity: 0.35;
      cursor: not-allowed;
      pointer-events: none;
    }
  `;
  document.head.appendChild(s);
})();

const NAV_ITEMS = [
  { id: 'home',     labelKey: 'nav_home',     stage: 'hero' },
  { id: 'analysis', labelKey: 'nav_analysis', stage: 'insight' },
  { id: 'preview',  labelKey: 'nav_preview',  stage: 'preview' },
  { id: 'tech',     labelKey: 'nav_tech',     stage: 'tech' },
];

const LOGO_MAP = {
  ar: './assets/rooster-logo-ar.png',
  ja: './assets/rooster-logo-ja.png',
  ko: './assets/rooster-logo-ko.png',
  zh: './assets/rooster-logo-zh.png',
};
const DEFAULT_LOGO = './assets/rooster-logo-en-es-fr-pt-de-tr.png';

function getLogoSrc() {
  return LOGO_MAP[getCurrentLang()] ?? DEFAULT_LOGO;
}

export function buildNav(activeStage, onNavigate, navState = {}) {
  // navState: { hasAnalysis: bool, hasPreview: bool }
  const hasAnalysis = !!navState.hasAnalysis;
  const hasPreview  = !!navState.hasPreview;

  return `
    <nav class="r-nav">
      <a class="logo-wrap" href="#" data-nav="hero" aria-label="ROOSTER Home">
        <img src="${getLogoSrc()}" alt="ROOSTER" class="logo-img" id="rooster-logo">
      </a>
      <div class="nav-links">
        ${NAV_ITEMS.map(n => {
          let disabled = false;
          if (n.stage === 'insight'  && !hasAnalysis) disabled = true;
          if (n.stage === 'preview'  && !hasPreview)  disabled = true;
          return `<a href="#"
            class="nav-link${n.stage === activeStage ? ' active' : ''}${disabled ? ' nav-link-disabled' : ''}"
            data-nav="${n.stage}"
            ${disabled ? 'aria-disabled="true" tabindex="-1"' : ''}
            >${t(n.labelKey)}</a>`;
        }).join('')}
      </div>
      <div class="lang-drop" id="lang-drop" aria-label="Language">
        <button class="lang-drop-btn" id="lang-drop-btn" aria-haspopup="listbox" aria-expanded="false">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <span class="lang-drop-label" id="lang-drop-label">${LANGUAGES.find(l => l.code === getCurrentLang())?.label ?? 'English'}</span>
        </button>
        <ul class="lang-drop-menu" id="lang-drop-menu" role="listbox">
          ${LANGUAGES.map(l =>
            `<li class="lang-drop-item${l.code === getCurrentLang() ? ' active' : ''}" data-lang="${l.code}" data-label="${l.label}" role="option">${l.label}</li>`
          ).join('')}
        </ul>
      </div>
    </nav>
  `;
}

export function buildTicker(matches = []) {
  let items;
  if (matches.length) {
    items = matches.map(m =>
      `<span class="ticker-item">
        ${m.home}
        <span class="t-score">${m.score_home ?? '?'}–${m.score_away ?? '?'}</span>
        ${m.away}
      </span>`
    ).join('');
  } else {
    items =
      `<span class="ticker-item">ROOSTER — AI Football Match Autopsy</span>` +
      `<span class="ticker-item">Select a match · Get the autopsy</span>` +
      `<span class="ticker-item">Powered by Groq · Docling · IBM Plex</span>`;
  }

  // Duplicate for seamless loop
  return `
    <div class="r-ticker" role="marquee" aria-label="Live ticker">
      <span class="ticker-label">Live</span>
      <div class="ticker-track">
        <div class="ticker-inner">${items}${items}</div>
      </div>
    </div>
  `;
}

export function attachNavListeners(container, onNavigate) {
  container.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      // Skip disabled nav links (analysis/preview not yet unlocked)
      if (el.classList.contains('nav-link-disabled')) return;
      const target = el.dataset.nav;
      // Enforce correct stage for analysis/preview nav items
      if (target === 'insight') { onNavigate('insight'); return; }
      if (target === 'preview') { onNavigate('preview-result'); return; }
      onNavigate(target);
    });
  });

  const langBtn   = container.querySelector('#lang-drop-btn');
  const langMenu  = container.querySelector('#lang-drop-menu');
  const langDrop  = container.querySelector('#lang-drop');
  const langLabel = container.querySelector('#lang-drop-label');
  if (langBtn && langMenu) {
    langBtn.addEventListener('click', e => {
      e.stopPropagation();
      const open = langDrop.classList.toggle('open');
      langBtn.setAttribute('aria-expanded', open);
    });
    langMenu.querySelectorAll('.lang-drop-item').forEach(item => {
      item.addEventListener('click', () => {
        langMenu.querySelectorAll('.lang-drop-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        if (langLabel) langLabel.textContent = item.dataset.label;
        setCurrentLang(item.dataset.lang);
        // Swap logo immediately
        const logoEl = container.querySelector('#rooster-logo');
        if (logoEl) logoEl.src = getLogoSrc();
        document.dispatchEvent(new CustomEvent('rooster:lang-change', { detail: item.dataset.lang }));
        langDrop.classList.remove('open');
        langBtn.setAttribute('aria-expanded', 'false');
      });
    });
    // Remove previous close-on-outside-click handler before adding a new one
    // so it doesn't stack up across re-renders
    if (attachNavListeners._docClickHandler) {
      document.removeEventListener('click', attachNavListeners._docClickHandler);
    }
    attachNavListeners._docClickHandler = () => {
      langDrop.classList.remove('open');
      langBtn.setAttribute('aria-expanded', 'false');
    };
    document.addEventListener('click', attachNavListeners._docClickHandler);
  }
}
// ── Persistent nav helpers ────────────────────────────────────

export function mountNav(onNavigate, navState = {}) {
  const shell = document.getElementById('nav-shell');
  if (!shell) return;
  // Store latest navState on the shell so lang-change rebuilds use it
  shell._navState = navState;
  shell.innerHTML = buildNav('hero', onNavigate, navState);
  attachNavListeners(shell, onNavigate);

  // Rebuild nav labels when language changes
  if (!mountNav._langHandler) {
    mountNav._langHandler = () => {
      const active = document.querySelector('.nav-link.active')?.dataset.nav ?? 'hero';
      shell.innerHTML = buildNav(active, onNavigate, shell._navState || {});
      attachNavListeners(shell, onNavigate);
    };
    document.addEventListener('rooster:lang-change', mountNav._langHandler);
  }
}

export function updateNavActive(stage, navState = {}) {
  const shell = document.getElementById('nav-shell');
  if (shell) {
    // Merge new navState into shell's stored state
    shell._navState = { ...(shell._navState || {}), ...navState };
  }
  // Re-render nav fully so disabled states update correctly
  const onNavigate = shell?._onNavigate;
  if (shell && onNavigate) {
    shell.innerHTML = buildNav(stage, onNavigate, shell._navState || {});
    attachNavListeners(shell, onNavigate);
    return;
  }
  // Fallback: just toggle active class (no state update possible)
  document.querySelectorAll('.nav-link[data-nav]').forEach(el => {
    el.classList.toggle('active', el.dataset.nav === stage);
  });
}

export function mountTicker(matches = []) {
  const shell = document.getElementById('ticker-shell');
  if (shell) shell.innerHTML = buildTicker(matches);
}

export function updateTicker(matches = []) {
  const shell = document.getElementById('ticker-shell');
  if (shell) shell.innerHTML = buildTicker(matches);
}