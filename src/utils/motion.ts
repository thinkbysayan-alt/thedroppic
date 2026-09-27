/**
 * GSAP motion layer: CTA/card micro-interactions and route-change page
 * transitions. Purely additive — it never gates content visibility, so a
 * slow or failed GSAP load can only mean "no extra motion," never a stuck
 * or invisible page. The existing CSS-driven scroll reveal (utils/reveal.ts)
 * is untouched and still owns section-entrance animation on its own; this
 * module covers the two things CSS alone can't do well: coordinated
 * route-transition timing and pointer-driven hover/press feedback.
 *
 * Respects prefers-reduced-motion by never importing GSAP at all in that
 * case — zero extra bytes downloaded, not just "animation skipped."
 */
import type { gsap as GsapNS } from 'gsap';

type Gsap = typeof GsapNS;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

let gsapPromise: Promise<Gsap | null> | null = null;

/** Lazy singleton load of GSAP core. Resolves to null (never rejects) if motion is off or the import fails. */
function loadGsap(): Promise<Gsap | null> {
  if (prefersReducedMotion()) return Promise.resolve(null);
  if (!gsapPromise) {
    gsapPromise = import('gsap')
      .then((mod) => mod.gsap)
      .catch(() => null);
  }
  return gsapPromise;
}

/**
 * Kicks off the GSAP download during idle time so it's already cached by
 * the time the user hovers something or navigates. Fire-and-forget: never
 * blocks or delays anything else on the page.
 */
export function warmMotion(): void {
  if (prefersReducedMotion()) return;
  const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
  idle(() => void loadGsap());
}

/** y/scale offsets kept small so hover reads as feedback, not motion (see ui-ux-pro-max gsap guidance). */
const HOVER_LIFT = { y: -3, scale: 1.015, duration: 0.2, ease: 'power2.out' };
const HOVER_RESET = { y: 0, scale: 1, duration: 0.2, ease: 'power2.out' };
const PRESS = { y: -1, scale: 0.97, duration: 0.1, ease: 'power1.out' };

const INTERACTIVE_SELECTOR = '.tool-card, .btn-primary, .theme-toggle';

/**
 * Delegated hover/press micro-interactions for cards and primary buttons.
 * Bound once on the persistent app root (never replaced across route
 * changes), so it keeps working for every future page without re-binding.
 * Uses transform/scale only (compositor-only props, no layout cost) and
 * always pairs a hover-in with a matching hover-out so nothing gets stuck.
 */
export function bindMicroInteractions(root: HTMLElement): void {
  if (prefersReducedMotion()) return;

  const tweenables = new WeakMap<Element, ReturnType<Gsap['quickTo']>[]>();

  function tweensFor(el: HTMLElement, gsap: Gsap): ReturnType<Gsap['quickTo']>[] {
    let t = tweenables.get(el);
    if (!t) {
      t = [gsap.quickTo(el, 'y', { duration: 0.2, ease: 'power2.out' }), gsap.quickTo(el, 'scale', { duration: 0.2, ease: 'power2.out' })];
      tweenables.set(el, t);
    }
    return t;
  }

  async function apply(el: HTMLElement, target: { y: number; scale: number }): Promise<void> {
    const gsap = await loadGsap();
    if (!gsap) return;
    const [y, scale] = tweensFor(el, gsap);
    y!(target.y);
    scale!(target.scale);
  }

  // mouseover/mouseout bubble (unlike mouseenter/mouseleave), which is what makes one delegated
  // listener work for every current and future match under `root` without per-element binding.
  root.addEventListener('mouseover', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>(INTERACTIVE_SELECTOR);
    if (!el || el.contains(e.relatedTarget as Node)) return;
    void apply(el, HOVER_LIFT);
  });
  root.addEventListener('mouseout', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>(INTERACTIVE_SELECTOR);
    if (!el || el.contains(e.relatedTarget as Node)) return;
    void apply(el, HOVER_RESET);
  });
  root.addEventListener('pointerdown', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>(INTERACTIVE_SELECTOR);
    if (el) void apply(el, PRESS);
  });
  root.addEventListener('pointerup', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>(INTERACTIVE_SELECTOR);
    if (el) void apply(el, HOVER_LIFT);
  });
}

/**
 * Runs `swap` (the router's DOM replacement) wrapped in a brief cross-fade
 * so navigating between pages doesn't feel like a hard cut. Asymmetric
 * timing (exit faster than entrance) keeps back/forward navigation feeling
 * responsive rather than delayed. Never blocks navigation on GSAP: if it
 * isn't loaded yet (e.g. the very first click before the idle warm-up
 * finished), `swap` just runs immediately with no transition.
 */
export async function transitionPage(viewRoot: HTMLElement, swap: () => void): Promise<void> {
  const gsap = prefersReducedMotion() ? null : await Promise.race([loadGsap(), new Promise<null>((r) => setTimeout(() => r(null), 120))]);
  if (!gsap) {
    swap();
    return;
  }
  await gsap.to(viewRoot, { opacity: 0, y: 6, duration: 0.15, ease: 'power1.in' });
  swap();
  gsap.fromTo(viewRoot, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
}
