import { setRevealDelay } from '../utils/reveal';
import { renderArcCarousel } from './arc-carousel';
import type { PageRoute } from './router';
import { pathForRoute } from './router';

export interface FaqItem {
  question: string;
  answer: string;
}

export function renderToolFaq(items: FaqItem[], heading = 'Frequently asked questions'): HTMLElement {
  const section = document.createElement('section');
  section.className = 'faq';
  section.id = 'faq';
  section.setAttribute('aria-labelledby', 'faq-heading');

  section.innerHTML = `<h2 id="faq-heading"></h2>`;
  section.querySelector('h2')!.textContent = heading;

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

export interface ArtOptions {
  /** Path under /art, e.g. "/art/hero.svg". */
  src: string;
  /** Empty for decorative images. */
  alt: string;
  width: number;
  height: number;
  className?: string;
  /** Marks an above-the-fold image so the browser fetches it first. */
  priority?: boolean;
}

/** A glitch-line illustration. Sizes are the SVG's own, so the browser reserves space and the layout never shifts. */
export function renderArt(opts: ArtOptions): HTMLImageElement {
  const img = document.createElement('img');
  img.className = `art ${opts.className ?? ''}`.trim();
  img.src = opts.src;
  img.alt = opts.alt;
  img.width = opts.width;
  img.height = opts.height;
  img.decoding = 'async';
  if (opts.priority) img.setAttribute('fetchpriority', 'high');
  else img.loading = 'lazy';
  return img;
}

/** "Home > Page" breadcrumb, matching the BreadcrumbList structured data. */
export function renderCrumbs(label: string, route: PageRoute, parent?: { label: string; route: PageRoute }): HTMLElement {
  const nav = document.createElement('nav');
  nav.className = 'breadcrumb';
  nav.setAttribute('aria-label', 'Breadcrumb');
  nav.innerHTML = `<a href="/">Home</a><span aria-hidden="true">/</span>`;
  if (parent) {
    const a = document.createElement('a');
    a.href = pathForRoute(parent.route);
    a.textContent = parent.label;
    nav.append(a, Object.assign(document.createElement('span'), { textContent: '/' }));
    nav.lastElementChild!.setAttribute('aria-hidden', 'true');
  }
  const current = document.createElement('a');
  current.href = pathForRoute(route);
  current.textContent = label;
  current.setAttribute('aria-current', 'page');
  nav.appendChild(current);
  return nav;
}

export interface ToolLink {
  route: PageRoute;
  name: string;
  hint: string;
}

/** Big pixel-type links, one per converter, used wherever a page ends by pointing at the tools. */
export function renderToolLinks(links: ToolLink[]): HTMLElement {
  const list = document.createElement('ul');
  list.className = 'tool-links';
  for (const link of links) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = pathForRoute(link.route);
    a.innerHTML = `<span class="tool-links__name"></span><span class="tool-links__hint"></span><span class="tool-links__arrow" aria-hidden="true">→</span>`;
    a.querySelector('.tool-links__name')!.textContent = link.name;
    a.querySelector('.tool-links__hint')!.textContent = link.hint;
    li.appendChild(a);
    list.appendChild(li);
  }
  return list;
}

/** The tools as a slowly rotating arc of tiles (see arc-carousel.ts). */
export function renderToolCarousel(links: ToolLink[], label = 'Tools'): HTMLElement {
  return renderArcCarousel(links, label);
}

/** A section with a heading, used to give every page the same rhythm. */
export function renderPageSection(heading: string, content: HTMLElement, id?: string): HTMLElement {
  const section = document.createElement('section');
  section.className = 'page-section';
  if (id) section.id = id;
  const h2 = document.createElement('h2');
  h2.textContent = heading;
  section.append(h2, content);
  return section;
}
