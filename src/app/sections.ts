import { setRevealDelay } from '../utils/reveal';
import type { Route } from './router';
import { pathForRoute } from './router';

export interface IconItem {
  /** Kept for callers that still pass one; the redesigned layouts are text-only. */
  icon?: string;
  title: string;
  description: string;
}

/**
 * Compact benefit grid (icon + title + one-line description). Used by the
 * homepage's "Why people choose thedroppic" panel — the tool pages' own
 * shorter strips now render as a carousel instead, see feature-carousel.ts.
 *
 * `className` may be a space-separated list (a base class plus a layout
 * modifier, e.g. "feature-strip feature-strip--four") — only the FIRST
 * token is the real BEM block name used for children's `__item`/`__icon`
 * classes; naively appending the whole (possibly multi-class) string here
 * previously produced classes like "feature-strip--four__item" that never
 * matched any CSS rule, silently losing all of the item spacing/icon
 * styling and falling back to the browser's raw default <p> margins.
 */
export function renderFeatureStrip(items: IconItem[], className = 'feature-strip'): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = className;
  const block = className.split(' ')[0]!;
  items.forEach((item, index) => {
    const el = document.createElement('div');
    el.className = `${block}__item`;
    el.setAttribute('data-reveal', '');
    setRevealDelay(el, index, 80);
    el.innerHTML = `${item.icon ? `<span class="icon-badge ${block}__icon">${item.icon}</span>` : ''}<h3></h3><p></p>`;
    el.querySelector('h3')!.textContent = item.title;
    el.querySelector('p')!.textContent = item.description;
    wrap.appendChild(el);
  });
  return wrap;
}

export interface Step {
  title: string;
  description: string;
  icon?: string;
}

/** The "Three simple steps" section — same shape on every page, different copy/accent per tool. */
export function renderHowItWorks(
  heading: string,
  supporting: string,
  steps: Step[],
  accentClass: string,
): HTMLElement {
  const section = document.createElement('section');
  section.className = `section how-it-works ${accentClass}`;
  section.setAttribute('aria-labelledby', 'how-it-works-heading');

  section.innerHTML = `
    <h2 id="how-it-works-heading"></h2>
    <p class="section-sub"></p>
  `;
  section.querySelector('h2')!.textContent = heading;
  section.querySelector('.section-sub')!.textContent = supporting;

  const row = document.createElement('div');
  row.className = `steps steps--connected steps--${steps.length}`;
  steps.forEach((step, index) => {
    const card = document.createElement('div');
    card.className = 'step step--simple';
    card.setAttribute('data-reveal', '');
    setRevealDelay(card, index, 120);
    card.innerHTML = `${step.icon ? `<span class="icon-badge step__icon">${step.icon}</span>` : ''}<h3></h3><p></p>`;
    card.querySelector('h3')!.textContent = step.title;
    card.querySelector('p')!.textContent = step.description;
    row.appendChild(card);
  });
  section.appendChild(row);

  return section;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function renderToolFaq(items: FaqItem[]): HTMLElement {
  const section = document.createElement('section');
  section.className = 'faq';
  section.setAttribute('aria-labelledby', 'faq-heading');

  section.innerHTML = `<h2 id="faq-heading">Frequently asked questions</h2>`;

  items.forEach((item, index) => {
    const details = document.createElement('details');
    details.className = 'faq-item';
    details.setAttribute('data-reveal', '');
    setRevealDelay(details, index, 70);

    const summary = document.createElement('summary');
    const questionSpan = document.createElement('span');
    questionSpan.textContent = item.question;
    summary.innerHTML = `<svg class="faq-item__icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 7.5 5 5 5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    summary.prepend(questionSpan);
    details.appendChild(summary);

    const answer = document.createElement('p');
    answer.textContent = item.answer;
    details.appendChild(answer);

    section.appendChild(details);
  });

  return section;
}

/** The closing call to action every page ends with. */
export function renderCtaBand(
  heading: string,
  supporting: string,
  buttonLabel: string,
  footnote: string,
  accentClass: string,
  onClick: () => void,
): HTMLElement {
  const section = document.createElement('section');
  section.className = `cta-band ${accentClass}`;

  const text = document.createElement('div');
  text.className = 'cta-band__text';
  text.innerHTML = `<h2></h2><p></p>`;
  text.querySelector('h2')!.textContent = heading;
  text.querySelector('p')!.textContent = supporting;
  section.appendChild(text);

  const actionWrap = document.createElement('div');
  actionWrap.className = 'cta-band__action';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn-primary';
  btn.textContent = buttonLabel;
  btn.addEventListener('click', onClick);
  actionWrap.appendChild(btn);

  const note = document.createElement('p');
  note.className = 'cta-band__note';
  note.textContent = footnote;
  actionWrap.appendChild(note);

  section.appendChild(actionWrap);
  return section;
}

/**
 * A single premium "scroll-reveal" card — the shared shell behind the
 * Formats, Use Cases, and Optimize-use-cases sections. Each page has
 * exactly one of these (they're on separate routes, so there's no
 * cross-page pinned/stacking sequence to build); the "reveal" is a single
 * IntersectionObserver-triggered entrance (subtle translate+scale+fade,
 * see `.scroll-card` in components.css) rather than a scroll-scrubbed
 * animation — deliberately simple per the "if it feels forced, simplify"
 * guidance: a real scroll-scrubbed multi-card stack doesn't fit three
 * single-card sections living on three different pages.
 */
export function renderScrollCard(
  heading: string,
  description: string,
  content: HTMLElement,
  accentClass: string,
): HTMLElement {
  const section = document.createElement('section');
  section.className = `section scroll-card ${accentClass}`;
  section.setAttribute('data-reveal-card', '');

  const header = document.createElement('div');
  header.className = 'scroll-card__header';
  header.innerHTML = `<h2></h2>${description ? '<p class="section-sub"></p>' : ''}`;
  header.querySelector('h2')!.textContent = heading;
  if (description) header.querySelector('.section-sub')!.textContent = description;
  section.appendChild(header);

  content.classList.add('scroll-card__content');
  section.appendChild(content);

  return section;
}

export interface MediaCardItem {
  title: string;
  description: string;
  image: string;
  alt: string;
}

/** A card with a photo on top and a title + one line below it (used inside the swipe stack). */
export function renderMediaCard(item: MediaCardItem): HTMLElement {
  const card = document.createElement('div');
  card.className = 'scroll-card-item scroll-card-item--media';
  card.innerHTML = `<img class="scroll-card-item__photo" width="380" height="220" draggable="false" /><div class="scroll-card-item__body"><h3></h3><p></p></div>`;
  const img = card.querySelector('img')!;
  img.src = item.image;
  img.alt = item.alt;
  card.querySelector('h3')!.textContent = item.title;
  card.querySelector('p')!.textContent = item.description;
  return card;
}

const ARROW_LEFT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 5 8 12l7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ARROW_RIGHT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 5 7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/**
 * Tinder-style swipeable card stack — an alternative to a flat grid for a
 * handful of short cards (Formats / Use Cases). Only the top card is
 * interactive: drag it (pointer events, mouse+touch+pen) left or right past
 * a threshold to send it to the back of the stack, or use the prev/next
 * buttons / arrow keys. Cards cycle endlessly rather than "running out."
 *
 * `cards` should already carry their content classes (e.g. `scroll-card-item`
 * from the shared mini-card styles) — this only adds the stacking/drag
 * behavior on top, it doesn't own their inner markup.
 */
export function renderSwipeStack(cards: HTMLElement[], accentClass: string): HTMLElement {
  const root = document.createElement('div');
  root.className = `swipe-stack ${accentClass}`;
  if (cards.some((c) => c.classList.contains('scroll-card-item--media'))) root.classList.add('swipe-stack--media');
  root.tabIndex = 0;

  const viewport = document.createElement('div');
  viewport.className = 'swipe-stack__viewport';
  root.appendChild(viewport);

  const controls = document.createElement('div');
  controls.className = 'swipe-stack__controls';
  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'swipe-stack__btn';
  prevBtn.setAttribute('aria-label', 'Previous card');
  prevBtn.innerHTML = ARROW_LEFT;
  const hint = document.createElement('span');
  hint.className = 'swipe-stack__hint';
  hint.textContent = 'Drag or use the arrows';
  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'swipe-stack__btn';
  nextBtn.setAttribute('aria-label', 'Next card');
  nextBtn.innerHTML = ARROW_RIGHT;
  controls.append(prevBtn, hint, nextBtn);
  root.appendChild(controls);

  const MAX_LAYERS = Math.min(4, cards.length);
  let order = cards.map((_, i) => i);

  function layout(): void {
    viewport.replaceChildren();
    for (let pos = MAX_LAYERS - 1; pos >= 0; pos--) {
      const card = cards[order[pos]!]!;
      card.classList.add('swipe-stack__card');
      card.style.setProperty('--pos', String(pos));
      card.style.transform = '';
      card.style.opacity = '';
      viewport.appendChild(card);
    }
  }

  function advance(dir: 1 | -1): void {
    if (dir === 1) order.push(order.shift()!);
    else order.unshift(order.pop()!);
    layout();
  }

  let dragging = false;
  let pointerId: number | null = null;
  let startX = 0;
  let dx = 0;

  viewport.addEventListener('pointerdown', (e) => {
    const target = (e.target as HTMLElement).closest('.swipe-stack__card');
    if (!target || target !== cards[order[0]!]) return;
    dragging = true;
    pointerId = e.pointerId;
    startX = e.clientX;
    dx = 0;
    (target as HTMLElement).setPointerCapture(e.pointerId);
    target.classList.add('swipe-stack__card--dragging');
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!dragging || e.pointerId !== pointerId) return;
    const top = cards[order[0]!]!;
    dx = e.clientX - startX;
    top.style.transform = `translateX(${dx}px) rotate(${dx / 14}deg)`;
    top.style.opacity = String(Math.max(0.4, 1 - Math.abs(dx) / 400));
  });

  function endDrag(e: PointerEvent): void {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    const top = cards[order[0]!]!;
    top.classList.remove('swipe-stack__card--dragging');
    const SWIPE_THRESHOLD = 90;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      const dir = dx > 0 ? 1 : -1;
      top.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
      top.style.transform = `translateX(${dir * 480}px) rotate(${dir * 26}deg)`;
      top.style.opacity = '0';
      window.setTimeout(() => {
        top.style.transition = '';
        advance(1);
      }, 240);
    } else {
      top.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
      top.style.transform = '';
      top.style.opacity = '';
      window.setTimeout(() => {
        top.style.transition = '';
      }, 250);
    }
    dx = 0;
  }
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  prevBtn.addEventListener('click', () => advance(-1));
  nextBtn.addEventListener('click', () => advance(1));
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') advance(-1);
    else if (e.key === 'ArrowRight') advance(1);
  });

  layout();
  return root;
}

/** "Home > Tools > Convert Images" style breadcrumb at the top of each tool page. */
export function renderBreadcrumb(toolLabel: string, toolRoute: Route): HTMLElement {
  const nav = document.createElement('nav');
  nav.className = 'breadcrumb';
  nav.setAttribute('aria-label', 'Breadcrumb');
  nav.innerHTML = `
    <a href="/">Home</a>
    <span aria-hidden="true">›</span>
    <span>Tools</span>
    <span aria-hidden="true">›</span>
    <a aria-current="page"></a>
  `;
  const current = nav.querySelector('a[aria-current]')!;
  current.textContent = toolLabel;
  current.setAttribute('href', pathForRoute(toolRoute));
  return nav;
}
