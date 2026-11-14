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
export function loadGsap(): Promise<Gsap | null> {
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

const INTERACTIVE_SELECTOR = '.btn-primary, .tile';

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
  // Opacity only: a transform on the view container would become the containing block for the home page's
  // absolutely positioned illustration and shift it. Props are cleared afterwards so nothing is left behind.
  // If the exit fade can't run (a throttled background tab pauses animation frames), never hold navigation hostage to it.
  await new Promise<void>((resolve) => {
    const guard = window.setTimeout(resolve, 400);
    gsap.to(viewRoot, {
      opacity: 0,
      duration: 0.15,
      ease: 'power1.in',
      onComplete: () => {
        window.clearTimeout(guard);
        resolve();
      },
    });
  });
  swap();
  gsap.fromTo(viewRoot, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out', clearProps: 'opacity', overwrite: true });
  // Fail-safe: whatever happens to the animation, the new page is fully visible shortly after.
  window.setTimeout(() => {
    gsap.killTweensOf(viewRoot);
    viewRoot.style.opacity = '';
  }, 700);
}

/** Elements that gently rise in as they scroll into view. Kept short on purpose: sections and tiles only. */
const SCROLL_TARGETS = '.page-section:not(.faq), .conv-faq, .conv-cta__inner';

let scrollTriggers: Array<{ kill: () => void }> = [];
let removeSafetyNet: (() => void) | null = null;

/**
 * Subtle GSAP ScrollTrigger entrance: a short fade and 14px rise, once per element.
 * Skipped for reduced motion, for the one-screen home page and in the prerender shim.
 * Elements already in view when the page loads are left alone (no flash), and every
 * element gets a fail-safe so it can never stay hidden.
 */
export async function initScrollMotion(root: HTMLElement, route: string): Promise<void> {
  for (const t of scrollTriggers) t.kill();
  scrollTriggers = [];
  removeSafetyNet?.();
  removeSafetyNet = null;
  if (route === 'home' || prefersReducedMotion() || /HappyDOM/i.test(navigator.userAgent)) return;

  try {
    const [gsap, st] = await Promise.all([loadGsap(), import('gsap/ScrollTrigger')]);
    if (!gsap) return;
    const ScrollTrigger = st.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);
    if (!root.isConnected) return;

    root.querySelectorAll<HTMLElement>(SCROLL_TARGETS).forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return; // already visible
      const tween = gsap.from(el, {
        opacity: 0,
        y: 14,
        duration: 0.6,
        ease: 'power2.out',
        clearProps: 'opacity,transform',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
          // Fail-safe: if the animation can't run (throttled tab), the element still appears.
          onEnter: () =>
            window.setTimeout(() => {
              gsap.killTweensOf(el);
              gsap.set(el, { clearProps: 'opacity,transform' });
            }, 1200),
        },
      });
      scrollTriggers.push(tween.scrollTrigger!);
    });

    // Safety net independent of ScrollTrigger and animation frames: anything scrolled into view is
    // forced visible after a moment, so a throttled tab can never leave a section hidden.
    const check = (): void => {
      root.querySelectorAll<HTMLElement>(SCROLL_TARGETS).forEach((el) => {
        if (el.style.opacity !== '0' || el.getBoundingClientRect().top > window.innerHeight * 0.88) return;
        window.setTimeout(() => {
          gsap.killTweensOf(el);
          gsap.set(el, { clearProps: 'opacity,transform' });
        }, 1200);
      });
    };
    window.addEventListener('scroll', check, { passive: true });
    removeSafetyNet = () => window.removeEventListener('scroll', check);
  } catch {
    root.querySelectorAll<HTMLElement>(SCROLL_TARGETS).forEach((el) => {
      el.style.opacity = '';
      el.style.transform = '';
    });
  }
}

let aboutCleanup: (() => void) | null = null;

/**
 * About hero. Desktop: the page holds still at the top while two wheel notches (or a swipe, or the arrow keys) play
 * a short change: the second paragraph arrives, the mouth opens (the calm picture swaps for the shouting one in a
 * single step, so the two never show together) and the closing line appears; after that the page scrolls normally.
 * Phones and small windows: the same change plays on its own when the hero scrolls into view. Without motion nothing
 * is hidden.
 */
export async function initAboutHero(root: HTMLElement, route: string): Promise<void> {
  aboutCleanup?.();
  aboutCleanup = null;
  const hero = root.querySelector<HTMLElement>('.about-hero');
  if (route !== 'about' || !hero || prefersReducedMotion() || /HappyDOM/i.test(navigator.userAgent)) {
    hero?.classList.remove('about-hero--intro');
    return;
  }

  try {
    const [gsap, st] = await Promise.all([loadGsap(), import('gsap/ScrollTrigger')]);
    if (!gsap || !hero.isConnected) {
      hero.classList.remove('about-hero--intro');
      return;
    }
    gsap.registerPlugin(st.ScrollTrigger);
    const calm = hero.querySelector<HTMLImageElement>('.about-hero__img--calm');
    const shout = hero.querySelector<HTMLImageElement>('.about-hero__img--shout');
    const line = hero.querySelector<HTMLElement>('.about-hero__solution');
    if (!calm || !shout || !line) {
      hero.classList.remove('about-hero--intro');
      return;
    }
    const second = hero.querySelector<HTMLElement>('.about-hero__agitation--second');
    const copy = hero.querySelector<HTMLElement>('.about-hero__copy');

    // The change itself: the calm picture and the shouting picture are the same size and place, and the page swaps
    // from one to the other in a single step (never both on screen), so nothing ghosts or overlaps.
    let isOpen = false;
    const setOpen = (open: boolean): void => {
      if (open === isOpen) return;
      isOpen = open;
      calm.style.visibility = open ? 'hidden' : '';
      shout.style.visibility = open ? 'visible' : 'hidden';
    };

    const mm = gsap.matchMedia();
    mm.add('(min-width: 1000px)', () => {
      // Desktop: the hero fills the screen under the menu and the page holds still at the top while two wheel notches
      // (or a swipe, or the arrow keys) play the change; after that the page scrolls normally. Nothing is pinned, so
      // there is no jump: the scroll is read directly and eased, exactly like the home page.
      const fit = (): void => {
        hero.style.height = `${Math.max(460, window.innerHeight - (hero.getBoundingClientRect().top + window.scrollY))}px`;
      };
      fit();
      hero.classList.add('about-hero--intro');
      gsap.set([second, line].filter(Boolean), { autoAlpha: 0, y: 16 });

      // How much room the two hidden paragraphs take, so the visible text can start centred and settle as they arrive.
      let hidden = { second: 0, line: 0 };
      const measure = (): void => {
        const size = (el: HTMLElement | null): number => {
          if (!el) return 0;
          const style = getComputedStyle(el);
          return el.offsetHeight + parseFloat(style.marginTop || '0');
        };
        hidden = { second: size(second), line: size(line) };
      };
      measure();

      const NOTCHES = 2;
      const smooth = (x: number): number => x * x * (3 - 2 * x);
      const span = (p: number, from: number, to: number): number => Math.min(1, Math.max(0, (p - from) / (to - from)));
      let target = 0;
      let current = 0;

      const render = (): void => {
        const p = current;
        const s2 = smooth(span(p, 0.04, 0.42)); // the second paragraph
        const s3 = smooth(span(p, 0.56, 0.94)); // "That's the whole thing."
        if (second) gsap.set(second, { autoAlpha: s2, y: 16 * (1 - s2) });
        if (line) gsap.set(line, { autoAlpha: s3, y: 16 * (1 - s3) });
        // The words start centred on the screen with only the first paragraph, and drift up as the others arrive.
        if (copy) gsap.set(copy, { y: (hidden.second * (1 - s2) + hidden.line * (1 - s3)) / 2 });
        // Halfway through the scroll the mouth opens, in one step.
        setOpen(p >= 0.5);
      };
      render();

      const atTop = (): boolean => window.scrollY <= 1;
      const move = (delta: number): void => {
        target = Math.min(1, Math.max(0, target + delta));
      };
      // Reads the scroll only while it is the hero's turn: at the top of the page, going down before the change has
      // played, or going up after it has. Otherwise the page scrolls natively.
      const wants = (down: boolean): boolean => atTop() && (down ? target < 1 : target > 0);
      const onWheel = (e: WheelEvent): void => {
        if (e.ctrlKey) return;
        const px = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
        if (!px || !wants(px > 0)) return;
        e.preventDefault();
        move(px / (100 * NOTCHES));
      };
      let touchY: number | null = null;
      const onTouchStart = (e: TouchEvent): void => {
        touchY = e.touches[0]?.clientY ?? null;
      };
      const onTouchMove = (e: TouchEvent): void => {
        const y = e.touches[0]?.clientY;
        if (y === undefined || touchY === null) return;
        const dy = touchY - y;
        touchY = y;
        if (!dy || !wants(dy > 0)) return;
        move(dy / 500);
        e.preventDefault();
      };
      const onKey = (e: KeyboardEvent): void => {
        if (e.altKey || e.ctrlKey || e.metaKey) return;
        const tag = (e.target as HTMLElement | null)?.tagName ?? '';
        if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
        const down = e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey && tag !== 'A' && tag !== 'BUTTON');
        const up = e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey);
        if ((down && wants(true)) || (up && wants(false))) {
          e.preventDefault();
          move((down ? 1 : -1) / NOTCHES);
        }
      };
      const loop = (_t: number, deltaMs: number): void => {
        if (current === target) return; // nothing to draw while it is at rest
        const dt = Math.min(0.1, deltaMs / 1000);
        current += (target - current) * (1 - Math.exp(-dt * 5));
        if (Math.abs(target - current) < 0.0004) current = target;
        render();
      };
      const onResize = (): void => {
        fit();
        measure();
        render();
      };
      window.addEventListener('wheel', onWheel, { passive: false });
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('keydown', onKey);
      window.addEventListener('resize', onResize);
      gsap.ticker.add(loop);
      void document.fonts?.ready.then(onResize);

      return () => {
        gsap.ticker.remove(loop);
        window.removeEventListener('wheel', onWheel);
        window.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('keydown', onKey);
        window.removeEventListener('resize', onResize);
        hero.classList.remove('about-hero--intro');
        hero.style.height = '';
        setOpen(false);
        gsap.set([line, second, copy].filter(Boolean), { clearProps: 'opacity,visibility,y,transform' });
      };
    });
    mm.add('(max-width: 999px)', () => {
      // Phones and small windows: the mouth opens and the closing line appears on their own as the hero scrolls in.
      hero.classList.remove('about-hero--intro');
      gsap.set(line, { opacity: 0, y: 14 });
      const trigger = st.ScrollTrigger.create({
        trigger: hero,
        start: 'top 55%',
        onToggle: (self) => {
          setOpen(self.isActive);
          gsap.to(line, { opacity: self.isActive ? 1 : 0, y: self.isActive ? 0 : 14, duration: 0.4, ease: 'power2.out' });
        },
      });
      return () => {
        trigger.kill();
        gsap.killTweensOf(line);
        setOpen(false);
        gsap.set(line, { clearProps: 'opacity,transform' });
      };
    });
    aboutCleanup = () => {
      mm.revert();
      calm.style.visibility = '';
      shout.style.visibility = '';
    };
  } catch {
    // Motion failed to load: the calm picture and all the copy stay visible.
    hero.classList.remove('about-hero--intro');
  }
}
