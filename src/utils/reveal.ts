/**
 * Lightweight scroll-reveal: fades/slides `[data-reveal]` elements in as
 * they enter the viewport. Purely decorative — respects
 * `prefers-reduced-motion` by skipping straight to the visible state, and
 * degrades to "just show everything" if IntersectionObserver is
 * unavailable. Must be called after the elements are attached to the DOM
 * (the app re-renders its whole view on each state change).
 */
export function initScrollReveal(root: ParentNode): void {
  const items = root.querySelectorAll<HTMLElement>('[data-reveal]');
  if (items.length === 0) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion || typeof IntersectionObserver === 'undefined') {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
  );

  items.forEach((el) => observer.observe(el));
}

/** Sets a staggered reveal delay (ms) on an element via the --reveal-delay CSS variable. */
export function setRevealDelay(el: HTMLElement, index: number, stepMs = 80): void {
  el.style.setProperty('--reveal-delay', `${index * stepMs}ms`);
}
