/**
 * The About page's one illustration — communicates "convert → remove
 * background → optimize, all happening privately on your device" without
 * three separate UI screenshots or any text. Three small panels connected
 * by arrows, each a distinct visual metaphor:
 *
 *   1. Convert   — a two-tone split square with a looping rotate glyph.
 *   2. Remove BG — a checkerboard-transparency square with a solid
 *                  rounded "subject" silhouette cut into it.
 *   3. Optimize  — a smaller solid square nested inside a larger dashed
 *                  outline, implying "shrunk," with a small down-arrow.
 *
 * Pure CSS (gradients, a repeating-conic-gradient checkerboard, transforms)
 * — no images, no canvas, no animation library. Same reduced-motion /
 * pure transform+opacity discipline as the rest of the app's decorative
 * animations.
 */
export function renderAboutVisual(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'about-visual';
  wrap.setAttribute('role', 'img');
  wrap.setAttribute(
    'aria-label',
    'Illustration of an image being converted between formats, then having its background removed, then being optimized for a smaller file size — all steps happening locally.',
  );

  wrap.innerHTML = `
    <div class="about-visual__glow" aria-hidden="true"></div>
    <div class="about-visual__row" aria-hidden="true">
      <div class="about-visual__panel about-visual__panel--convert">
        <svg class="about-visual__glyph" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 2.5 21 6.5m0 0-4 4m4-4H8a5 5 0 0 0-5 5" />
          <path d="M7 21.5 3 17.5m0 0 4-4m-4 4h13a5 5 0 0 0 5-5" />
        </svg>
      </div>
      <svg class="about-visual__arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m7 4 6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <div class="about-visual__panel about-visual__panel--cutout">
        <span class="about-visual__subject"></span>
      </div>
      <svg class="about-visual__arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m7 4 6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <div class="about-visual__panel about-visual__panel--optimize">
        <span class="about-visual__shrink"></span>
      </div>
    </div>
  `;

  return wrap;
}
