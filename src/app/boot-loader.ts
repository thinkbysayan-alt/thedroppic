/**
 * Hides the initial boot loader (the cat-on-a-loading-bar screen in
 * index.html) once the app has actually mounted. Deliberately lives
 * outside the router/component system — it's removed from the DOM
 * entirely after this runs, so there is no code path that can bring it
 * back during in-app navigation, only a fresh page load re-adds it (it's
 * static markup in index.html, not something this app renders).
 *
 * Enforces a small minimum visible time so a near-instant mount (warm
 * cache, fast machine) doesn't flash the loader for one frame — but never
 * waits longer than necessary: `window.__bootStart` is stamped by an
 * inline script the instant the loader itself is parsed (see index.html),
 * so this measures real elapsed time instead of guessing.
 */
const MIN_VISIBLE_MS = 450;
const FADE_MS = 220;

declare global {
  interface Window {
    __bootStart?: number;
  }
}

export function hideBootLoader(): void {
  const loader = document.getElementById('boot-loader');
  if (!loader) return;

  const elapsed = Date.now() - (window.__bootStart ?? Date.now());
  const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

  window.setTimeout(() => {
    loader.classList.add('is-hiding');
    window.setTimeout(() => loader.remove(), FADE_MS);
  }, remaining);
}
