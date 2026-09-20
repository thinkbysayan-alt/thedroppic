import type { IconItem } from './sections';

/**
 * Horizontal, scroll-snapping carousel for the tool pages' short "why use
 * it" feature strip (replaces the old static 2/4/5-column grid). Native
 * CSS scroll-snap + `scrollBy` does the actual scrolling — no carousel
 * library, no JS-driven position tracking. Touch/trackpad swipe works for
 * free; the two arrow buttons are a convenience on top for mouse users,
 * each moving by exactly one card, and disable themselves at the ends so
 * it's always obvious there's nothing more in that direction.
 */
export function renderFeatureCarousel(items: IconItem[], accentClass: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = `feature-carousel ${accentClass}`;

  const track = document.createElement('div');
  track.className = 'feature-carousel__track';
  track.setAttribute('role', 'list');

  items.forEach((item) => {
    const el = document.createElement('div');
    el.className = 'feature-carousel__item';
    el.setAttribute('role', 'listitem');
    el.innerHTML = `${item.icon ? `<span class="icon-badge feature-carousel__icon">${item.icon}</span>` : ''}<h3></h3><p></p>`;
    el.querySelector('h3')!.textContent = item.title;
    el.querySelector('p')!.textContent = item.description;
    track.appendChild(el);
  });
  wrap.appendChild(track);

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'feature-carousel__arrow feature-carousel__arrow--prev';
  prevBtn.setAttribute('aria-label', 'Show previous');
  prevBtn.innerHTML = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m12.5 4.5-5 5.5 5 5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'feature-carousel__arrow feature-carousel__arrow--next';
  nextBtn.setAttribute('aria-label', 'Show next');
  nextBtn.innerHTML = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m7.5 4.5 5 5.5-5 5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  wrap.append(prevBtn, nextBtn);

  function step(): number {
    const card = track.querySelector<HTMLElement>('.feature-carousel__item');
    if (!card) return 260;
    const style = getComputedStyle(track);
    const gap = parseFloat(style.columnGap || style.gap || '0') || 0;
    return card.getBoundingClientRect().width + gap;
  }

  function updateArrowState(): void {
    const max = track.scrollWidth - track.clientWidth;
    prevBtn.disabled = track.scrollLeft <= 4;
    nextBtn.disabled = track.scrollLeft >= max - 4;
    // No overflow at all (fits without scrolling, e.g. wide desktop) — hide both, nothing to navigate.
    wrap.classList.toggle('feature-carousel--no-overflow', max <= 4);
  }

  prevBtn.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  nextBtn.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  track.addEventListener('scroll', updateArrowState, { passive: true });
  // A ResizeObserver on the track (not `window`) so this self-disconnects
  // in spirit — it only ever fires while `track` is actually laid out on
  // screen, and simply stops mattering once the router discards this DOM
  // subtree on the next page navigation (no listener left on `window` to
  // leak). Also covers the initial layout (widths are 0 on the same tick
  // the element is created), so no separate rAF call is needed.
  const resizeObserver = new ResizeObserver(updateArrowState);
  resizeObserver.observe(track);

  return wrap;
}
