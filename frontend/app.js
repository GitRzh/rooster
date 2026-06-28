// ============================================================
//  app.js — Router only. No UI logic here.
// ============================================================

// app.js — change these 4 lines:
import { renderHero }    from './js/stage1-hero.js';
import { renderInsight } from './js/stage2-insight.js';
import { renderLoading } from './js/stage3-loading.js';
import { renderResult, renderTech } from './js/stage4-result.js';
import { setCurrentLang, getCurrentLang, LANGUAGES } from './js/config.js';

// Shared state object — passed to every stage
const state = {
  pinnedMatch:      null,
  selectedQuestion: null,
  analysisResult:   null,
  isCustomQA:       false,
};

// Restore from session (e.g. on page refresh mid-session)
try {
  const saved = sessionStorage.getItem('rooster_state');
  if (saved) Object.assign(state, JSON.parse(saved));
} catch (_) {}

// Sync window shorthand used in stage JS
window._roosterState = state;

const app = document.getElementById('app');

function navigate(stage) {
  // Sync window state → app state
  if (window._roosterState) Object.assign(state, window._roosterState);

  // Persist
  try { sessionStorage.setItem('rooster_state', JSON.stringify(state)); } catch (_) {}

  app.innerHTML = '';

  switch (stage) {
    case 'hero':    renderHero(app, state, navigate);    break;
    case 'insight': renderInsight(app, state, navigate); break;
    case 'loading': renderLoading(app, state, navigate); break;
    case 'result':  renderResult(app, state, navigate);  break;
    case 'tech':    renderTech(app, state, navigate);    break;
    default:        renderHero(app, state, navigate);
  }
}

// Apply saved language on boot
const lang = LANGUAGES.find(l => l.code === getCurrentLang());
if (lang) {
  document.documentElement.setAttribute('dir', lang.dir);
  document.documentElement.setAttribute('lang', lang.code);
}

// Listen for lang changes
document.addEventListener('rooster:lang-change', e => {
  setCurrentLang(e.detail);
  // Re-render current stage (simplest approach)
  navigate(currentStage());
});

function currentStage() {
  if (app.querySelector('.result-body'))  return 'result';
  if (app.querySelector('.loading-body')) return 'loading';
  if (app.querySelector('.insight-body')) return 'insight';
  return 'hero';
}

// Boot
navigate('hero');