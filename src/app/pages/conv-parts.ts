
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


/** The page's own heading: the plain tool name as a small label (for clarity and search), a headline and a one-liner. */
export function renderConvHead(label: string, headline: string, oneLiner: string): HTMLElement {
  const head = document.createElement('header');
  head.className = 'conv-head';
  const h1 = document.createElement('h1');
  h1.className = 'conv-head__title';
  const tag = document.createElement('span');
  tag.className = 'conv-head__label';
  tag.textContent = label;
  h1.append(tag, ` ${headline}`);
  const p = document.createElement('p');
  p.className = 'conv-head__text';
  p.textContent = oneLiner;
  head.append(h1, p);
  return head;
}

/** The right-hand column: privacy note and three fact cards. */
export function renderConvSide(note: string, facts: [Fact, Fact, Fact]): HTMLElement {
  const side = document.createElement('aside');
  side.className = 'conv-side';
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
  faq.innerHTML = '<h2 id="faq-heading">Things people ask us</h2>';
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

/** The grey band: "Pick photos" returns to the drop area at the top of the page. */
export function renderConvCta(): HTMLElement {
  const cta = document.createElement('section');
  cta.className = 'conv-cta';
  cta.innerHTML = `
    <div class="conv-cta__inner">
      <h2 class="conv-cta__title">Got one more? Drop it in.</h2>
      <div class="conv-cta__action">
        <button type="button" class="conv-cta__btn">Pick photos</button>
        <p>Pixel's ready when you are.</p>
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

