/**
 * Shared "floating perspective cards" hero illustration used by all three
 * tool pages (Convert / Remove Background / Optimize) — three overlapping
 * rounded white cards, each tilted at a different angle and floating on
 * its own gentle loop, with one small icon as its only content (per the
 * "minimal UI details" brief — no fake toolbars or text-heavy mockups).
 * Colors come entirely from the page's existing `--tool-accent` /
 * `--tool-accent-soft` custom properties (set by the accent-blue /
 * accent-mint / accent-lavender classes already on each page), so this
 * one component automatically matches whichever tool page mounts it.
 */
export function renderToolHeroVisual(icons: [string, string, string]): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'tool-hero-visual';
  wrap.setAttribute('aria-hidden', 'true');

  wrap.innerHTML = `
    <div class="tool-hero-visual__glow"></div>
    <div class="tool-hero-visual__stack">
      <div class="tool-hero-visual__card tool-hero-visual__card--back">
        <span class="tool-hero-visual__icon">${icons[0]}</span>
      </div>
      <div class="tool-hero-visual__card tool-hero-visual__card--mid">
        <span class="tool-hero-visual__icon">${icons[1]}</span>
      </div>
      <div class="tool-hero-visual__card tool-hero-visual__card--front">
        <span class="tool-hero-visual__icon">${icons[2]}</span>
      </div>
    </div>
  `;

  return wrap;
}
