// ============================================================
//  app.js — Router only. No UI logic here.
// ============================================================

import { runIntro } from './js/stage0-intro.js';

import { renderHero }    from './js/stage1-hero.js';
import { renderInsight } from './js/stage2-insight.js';
import { renderLoading } from './js/stage3-loading.js';
import { renderResult, renderTech } from './js/stage4-result.js';
import { renderPreview } from './js/stage5-preview.js';
import { setCurrentLang, getCurrentLang, LANGUAGES } from './js/config.js';
import { mountNav, mountTicker, updateNavActive, updateTicker } from './js/nav.js';

// Shared state object — passed to every stage
const state = {
  pinnedMatch:      null,
  selectedQuestion: null,
  analysisResult:   null,
  previewResult:    null,
  isCustomQA:       false,
  isPreview:        false,
};

// Restore from session (e.g. on page refresh mid-session)
try {
  const saved = sessionStorage.getItem('rooster_state');
  if (saved) Object.assign(state, JSON.parse(saved));
} catch (_) {}

window._roosterState = state;

const app = document.getElementById('app');

let currentStageName = 'hero';
let isTransitioning  = false; // guard against double-fire

function getEnterClass(from, to) {
  if (from === 'result'  && to === 'insight') return 'page-enter-left';
  if (from === 'insight' && (to === 'loading' || to === 'result')) return 'page-enter-right';
  return 'page-enter';
}

function getNavState() {
  const m = state.pinnedMatch;
  return {
    // Analysis only makes sense for finished matches (has a score)
    hasAnalysis: !!(m && m.score_home != null),
    // Preview only makes sense after a preview has been fetched
    hasPreview:  !!(state.previewResult),
  };
}

function renderStage(stage, enterClass) {
  app.innerHTML = '';
  switch (stage) {
    case 'hero':           renderHero(app, state, navigate);    break;
    case 'insight':        renderInsight(app, state, navigate); break;
    case 'loading':        renderLoading(app, state, navigate); break;
    case 'result':         renderResult(app, state, navigate);  break;
    case 'tech':           renderTech(app, state, navigate);    break;
    case 'preview-result': renderPreview(app, state, navigate); break;
    default:               renderHero(app, state, navigate);
  }
  const stageEl = app.querySelector('.stage');
  if (stageEl && enterClass) {
    stageEl.classList.add(enterClass);
    stageEl.addEventListener('animationend', () => stageEl.classList.remove(enterClass), { once: true });
  }
  currentStageName = stage;

  // Map internal stage names to nav link data-nav values
  const stageToNav = {
    'hero':           'hero',
    'insight':        'insight',
    'loading':        'loading',
    'result':         'insight',   // result is under Analysis
    'tech':           'tech',
    'preview-result': 'preview',   // preview-result is under Preview
  };
  updateNavActive(stageToNav[stage] ?? stage, getNavState());
  isTransitioning  = false;

  // Show watermark only on tech + loading stages
  const wm = document.getElementById('wc-watermark');
  if (wm) wm.classList.toggle('wm-visible', stage === 'tech' || stage === 'loading');
}

function navigate(stage) {
  if (window._roosterState) Object.assign(state, window._roosterState);
  try { sessionStorage.setItem('rooster_state', JSON.stringify(state)); } catch (_) {}

  const from       = currentStageName;
  const enterClass = getEnterClass(from, stage);

  // Loading stage has its own animation — skip exit fade
  if (from === 'loading' || stage === 'loading') {
    renderStage(stage, enterClass);
    return;
  }

  // Guard: prevent double-trigger during transition
  if (isTransitioning) return;
  isTransitioning = true;

  // Force reflow so the class addition actually triggers a CSS transition
  void app.offsetHeight;
  app.classList.add('page-exit');

  setTimeout(() => {
    app.classList.remove('page-exit');
    renderStage(stage, enterClass);
  }, 180);
}

// Apply saved language on boot
const lang = LANGUAGES.find(l => l.code === getCurrentLang());
if (lang) {
  document.documentElement.setAttribute('dir', lang.dir);
  document.documentElement.setAttribute('lang', lang.code);
}

// Lang change — named handler prevents stacking if navigate() is called during boot
function onLangChange(e) {
  setCurrentLang(e.detail);
  const stage = currentStageName;
  navigate(stage === 'result' || stage === 'insight' ? 'hero' : stage);
}
document.removeEventListener('rooster:lang-change', onLangChange);
document.addEventListener('rooster:lang-change', onLangChange);

// Boot — run intro every time, then start the app
runIntro(() => {
  const shell = document.getElementById('nav-shell');
  if (shell) shell._onNavigate = navigate;
  mountNav(navigate, getNavState());
  mountTicker([]);
  navigate('hero');
});