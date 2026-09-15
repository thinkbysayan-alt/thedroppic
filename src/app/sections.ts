import { setRevealDelay } from '../utils/reveal';
import type { Route } from './router';
import { pathForRoute } from './router';

export interface IconItem {
  icon: string;
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
    el.innerHTML = `<span class="icon-badge ${block}__icon">${item.icon}</span><h3></h3><p></p>`;
    el.querySelector('h3')!.textContent = item.title;
    el.querySelector('p')!.textContent = item.description;
    wrap.appendChild(el);
  });
  return wrap;
}

export interface Step {
  title: string;
  description: string;
  icon: string;
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
    <p class="eyebrow eyebrow--center">HOW IT WORKS</p>
    <h2 id="how-it-works-heading"></h2>
    <p class="section-sub"></p>
  `;
  section.querySelector('h2')!.textContent = heading;
  section.querySelector('.section-sub')!.textContent = supporting;

  const row = document.createElement('div');
  row.className = 'steps steps--connected';
  steps.forEach((step, index) => {
    const card = document.createElement('div');
    card.className = 'step step--simple';
    card.setAttribute('data-reveal', '');
    setRevealDelay(card, index, 120);
    card.innerHTML = `<span class="icon-badge step__icon">${step.icon}</span><h3></h3><p></p>`;
    card.querySelector('h3')!.textContent = `${index + 1}. ${step.title}`;
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

  section.innerHTML = `<p class="eyebrow">FAQ</p><h2 id="faq-heading">Frequently asked questions</h2>`;

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

/** The pastel closing CTA band every page ends with. */
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
  eyebrow: string,
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
  header.innerHTML = `<p class="eyebrow eyebrow--center"></p><h2></h2><p class="section-sub"></p>`;
  header.querySelector('.eyebrow')!.textContent = eyebrow;
  header.querySelector('h2')!.textContent = heading;
  header.querySelector('.section-sub')!.textContent = description;
  section.appendChild(header);

  content.classList.add('scroll-card__content');
  section.appendChild(content);

  return section;
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
