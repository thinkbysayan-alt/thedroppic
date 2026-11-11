import { renderArt } from '../sections';

/** Page sections shared by the Convert page and the Remove Background page (the Figma "Convert" layout). */

export interface Fact {
  value: string;
  label: string;
  text: string;
}

export interface FaqEntry {
  question: string;
  answer: string;
}

const CHEVRON =
  '<svg class="conv-faq__chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m5 7.5 5 5 5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>';


/** The right-hand column: lock picture, privacy note and three fact cards. */
export function renderConvSide(note: string, facts: [Fact, Fact, Fact]): HTMLElement {
  const side = document.createElement('aside');
  side.className = 'conv-side';
  side.appendChild(renderArt({ src: '/art/lock-sm.svg', alt: '', width: 460, height: 600, className: 'conv-side__lock', priority: true }));

  const p = document.createElement('p');
  p.className = 'conv-side__text';
  p.textContent = note;
  side.appendChild(p);

  const cards = document.createElement('div');
  cards.className = 'conv-cards';
  facts.forEach((fact, i) => {
    const card = document.createElement('div');
    card.className = `stat-card stat-card--${'abc'[i]}`;
    card.innerHTML = '<p class="stat-card__value"></p><p class="stat-card__label"></p><p class="stat-card__text"></p>';
    card.querySelector('.stat-card__value')!.textContent = fact.value;
    card.querySelector('.stat-card__label')!.textContent = fact.label;
    card.querySelector('.stat-card__text')!.textContent = fact.text;
    cards.appendChild(card);
  });
  side.appendChild(cards);
  return side;
}

/** Accordion FAQ. Items carry `.faq-item` so FAQPage markup is built from what is visible. */
export function renderConvFaq(items: FaqEntry[]): HTMLElement {
  const faq = document.createElement('section');
  faq.className = 'conv-faq';
  faq.setAttribute('aria-labelledby', 'faq-heading');
  faq.innerHTML = '<h2 id="faq-heading">Frequently asked questions</h2>';
  for (const item of items) {
    const details = document.createElement('details');
    details.className = 'faq-item conv-faq__item';
    const summary = document.createElement('summary');
    const q = document.createElement('span');
    q.textContent = item.question;
    summary.appendChild(q);
    summary.insertAdjacentHTML('beforeend', CHEVRON);
    const answer = document.createElement('p');
    answer.textContent = item.answer;
    details.append(summary, answer);
    faq.appendChild(details);
  }
  return faq;
}

/** The grey band: "Choose images" returns to the drop area at the top of the page. */
export function renderConvCta(): HTMLElement {
  const cta = document.createElement('section');
  cta.className = 'conv-cta';
  cta.innerHTML = `
    <div class="conv-cta__inner">
      <h2 class="conv-cta__title">Drop an image to get started.</h2>
      <div class="conv-cta__action">
        <button type="button" class="conv-cta__btn">Choose images</button>
        <p>No account. No upload.</p>
      </div>
    </div>
  `;
  cta.querySelector<HTMLButtonElement>('.conv-cta__btn')!.addEventListener('click', () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    document.getElementById('file-input')?.focus({ preventScroll: true });
  });
  return cta;
}

