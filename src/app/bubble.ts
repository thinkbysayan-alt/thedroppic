/**
 * A very subtle follow for the home-page speech bubble: as the cursor moves around the page the bubble drifts a few
 * pixels toward it and tilts a fraction of a degree, easing in and settling. It uses the independent `translate` and
 * `rotate` properties so it never fights the bubble's entrance animation. Mouse only; off for reduced motion.
 */
const MAX_X = 6; // px
const MAX_Y = 4; // px
const MAX_TILT = 0.9; // degrees
const EASE = 0.08;

export function trackBubble(bubble: HTMLElement): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let tx = 0;
  let ty = 0;
  let cx = 0;
  let cy = 0;
  let raf = 0;

  const frame = (): void => {
    if (!bubble.isConnected) return; // page changed
    cx += (tx - cx) * EASE;
    cy += (ty - cy) * EASE;
    bubble.style.translate = `${cx.toFixed(2)}px ${cy.toFixed(2)}px`;
    bubble.style.rotate = `${((cx / MAX_X) * MAX_TILT).toFixed(3)}deg`;
    raf = Math.abs(tx - cx) > 0.02 || Math.abs(ty - cy) > 0.02 ? requestAnimationFrame(frame) : 0;
  };

  const onMove = (e: PointerEvent): void => {
    if (!bubble.isConnected) {
      window.removeEventListener('pointermove', onMove);
      return;
    }
    if (e.pointerType !== 'mouse') return;
    // Pointer position across the window, -1 (left/top) to 1 (right/bottom).
    tx = (e.clientX / window.innerWidth - 0.5) * 2 * MAX_X;
    ty = (e.clientY / window.innerHeight - 0.5) * 2 * MAX_Y;
    if (!raf) raf = requestAnimationFrame(frame);
  };

  window.addEventListener('pointermove', onMove, { passive: true });
}
