// ============================================================
//  nav.js — Shared nav renderer + ticker
// ============================================================

import { LANGUAGES, getCurrentLang, setCurrentLang } from './config.js';

const NAV_ITEMS = [
  { id: 'home',     label: 'Home',      stage: 'hero' },
  { id: 'analysis', label: 'Analysis',  stage: 'insight' },
  { id: 'tech',     label: 'Used Tech', stage: 'tech' },
];

export function buildNav(activeStage, onNavigate) {
  return `
    <nav class="r-nav">
      <a class="logo-wrap" href="#" data-nav="hero" aria-label="ROOSTER Home">
        <img src="./assets/rooster-logo.png" alt="ROOSTER" class="logo-img">
      </a>
      <div class="nav-links">
        ${NAV_ITEMS.map(n =>
          `<a href="#" class="nav-link${n.stage === activeStage ? ' active' : ''}" data-nav="${n.stage}">${n.label}</a>`
        ).join('')}
      </div>
      <div class="lang-drop" id="lang-drop" aria-label="Language">
        <button class="lang-drop-btn" id="lang-drop-btn" aria-haspopup="listbox" aria-expanded="false">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <span class="lang-drop-label" id="lang-drop-label">${LANGUAGES.find(l => l.code === getCurrentLang())?.label ?? 'English'}</span>
          <svg class="lang-drop-caret" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
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
      onNavigate(el.dataset.nav);
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
        document.dispatchEvent(new CustomEvent('rooster:lang-change', { detail: item.dataset.lang }));
        langDrop.classList.remove('open');
        langBtn.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('click', () => {
      langDrop.classList.remove('open');
      langBtn.setAttribute('aria-expanded', 'false');
    });
  }
}