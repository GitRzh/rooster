// ============================================================
//  stage0-intro.js  (~2.5s total)
//
//  Sequence:
//   200ms  — black hold
//   700ms  — black → yellow fade
//   snap   — instant cut to blue + logo fades in
//   950ms  — hold
//   350ms  — fade out → onDone()
//
//  Hero prefetch: /hero fetch starts immediately on boot,
//  result stored in window.__heroPromise. loadHero() in
//  stage1-hero.js awaits this instead of fetching fresh.
// ============================================================

import { API_BASE } from './config.js';

export function runIntro(onDone) {

  // ── Kick off /hero fetch RIGHT NOW, in parallel ───────────
  // stage1-hero.js reads window.__heroPromise instead of
  // doing its own fetch, so data is ready by the time the
  // hero renders (~2.5s from now).
  window.__heroPromise = fetch(`${API_BASE}/hero`)
    .then(r => r.json())
    .catch(err => { console.warn('Hero prefetch failed:', err); return null; });

  // ── DOM ───────────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = 'intro-overlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    background: #000;
    display: flex; align-items: center; justify-content: center;
  `;

  const logo = document.createElement('img');
  logo.src = './assets/rooster-logo-en-es-fr-pt-de-tr.png';
  logo.style.cssText = `
    width: min(400px, 68vw);
    opacity: 0;
    position: relative; z-index: 2;
    pointer-events: none;
    will-change: opacity;
  `;

  overlay.appendChild(logo);
  document.body.prepend(overlay);

  const raf  = () => new Promise(r => requestAnimationFrame(r));
  const wait = ms  => new Promise(r => setTimeout(r, ms));

  async function play() {
    await raf(); await raf();

    // black hold
    await wait(200);

    // black → yellow (700ms)
    overlay.style.transition = 'background 0.7s ease';
    await raf();
    overlay.style.background = '#F5E642';
    await wait(720);

    // snap to blue + logo fades in
    overlay.style.transition = 'none';
    await raf();
    overlay.style.background = '#2D35E8';
    await raf(); await raf();

    logo.style.transition = 'opacity 0.3s ease';
    await raf();
    logo.style.opacity = '1';

    // hold
    await wait(950);

    // fade out everything
    overlay.style.transition = 'opacity 0.35s ease';
    await raf();
    overlay.style.opacity = '0';
    await wait(370);

    overlay.remove();
    onDone();
  }

  play().catch(console.error);
}