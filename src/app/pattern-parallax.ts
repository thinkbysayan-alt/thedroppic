/**
 * Subtle mouse-reactive parallax for the decorative dot-grid background
 * (`#bg-pattern` in index.html). Purely cosmetic: nudges the pattern a few
 * pixels opposite the cursor, eased every frame via `requestAnimationFrame`
 * so it glides rather than snaps. Uses `transform` only (GPU-composited —
 * never triggers layout or paint), and the animation loop only runs while
 * actually catching up to the cursor, going fully idle the instant it
 * settles, so it costs nothing when the mouse is still.
 *
 * Disabled entirely for `prefers-reduced-motion` and for touch/coarse-pointer
 * devices — there's no hovering mouse to react to there, and it keeps the
 * effect from ever competing with scrolling on a phone.
 */
const MAX_OFFSET = 10; // px — how far the pattern can drift from center
const EASE = 0.08; // 0-1, lower = smoother/slower catch-up

export function initPatternParallax(): void {
  const layer = document.getElementById('bg-pattern');
  if (!layer) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  if (reducedMotion || coarsePointer) return;

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let rafId: number | null = null;

  function tick(): void {
    currentX += (targetX - currentX) * EASE;
    currentY += (targetY - currentY) * EASE;
    layer!.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;

    if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return; // ignore synthetic touch/pen pointermove events
      const nx = e.clientX / window.innerWidth - 0.5; // -0.5..0.5
      const ny = e.clientY / window.innerHeight - 0.5;
      targetX = nx * MAX_OFFSET * -2;
      targetY = ny * MAX_OFFSET * -2;
      if (rafId === null) rafId = requestAnimationFrame(tick);
    },
    { passive: true },
  );
}
