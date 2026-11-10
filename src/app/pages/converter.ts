import { createToolWorkspace } from '../tool-workspace';
import { renderArt } from '../sections';
import { pathForRoute, type ConverterRoute, type PageRoute } from '../router';
import type { OutputFormat, SourceFormat } from '../../types';

/**
 * The Convert page, from the Figma design: one bordered box with a tab per
 * converter (JPEG to PNG, PNG to JPEG, HEIC to JPEG) holding the upload tool,
 * a privacy note with three fact cards beside it, then an FAQ, a call-to-action
 * band and a "Learn more" list.
 *
 * Each tab is still its own URL (and its own page title), so every converter
 * stays directly linkable and indexable; the tab just swaps which one is open.
 */
interface ConverterDef {
  from: SourceFormat;
  to: OutputFormat;
  fromLabel: string;
  toLabel: string;
  title: string;
  accept: string;
  /** The third fact card (the other two are the same on every converter). */
  fact: { value: string; label: string; text: string };
}

const TAB_ORDER: ConverterRoute[] = ['jpeg-to-png', 'png-to-jpeg', 'heic-to-jpeg', 'webp-to-jpeg', 'webp-to-png', 'jpeg-to-webp', 'png-to-webp'];

const SOURCE_LABEL: Record<SourceFormat, string> = {
  jpeg: 'a JPEG',
  png: 'a PNG',
  webp: 'a WebP',
  avif: 'an AVIF',
  tiff: 'a TIFF',
  heic: 'a HEIC',
};

const CONVERTERS: Record<ConverterRoute, ConverterDef> = {
  'jpeg-to-png': {
    from: 'jpeg',
    to: 'png',
    fromLabel: 'JPEG',
    toLabel: 'PNG',
    title: 'JPEG to PNG',
    accept: 'image/jpeg,.jpg,.jpeg,.jfif',
    fact: { value: '100%', label: 'Lossless', text: 'PNG keeps every pixel of your JPEG.' },
  },
  'png-to-jpeg': {
    from: 'png',
    to: 'jpeg',
    fromLabel: 'PNG',
    toLabel: 'JPEG',
    title: 'PNG to JPEG',
    accept: 'image/png,.png',
    fact: { value: '1-100', label: 'Quality you choose', text: 'Balance file size against detail.' },
  },
  'heic-to-jpeg': {
    from: 'heic',
    to: 'jpeg',
    fromLabel: 'HEIC',
    toLabel: 'JPEG',
    title: 'HEIC to JPEG',
    accept: '.heic,.heif,image/heic,image/heif',
    fact: { value: 'JPEG', label: 'Opens anywhere', text: 'Works on any PC, phone, app or website.' },
  },
  'webp-to-jpeg': {
    from: 'webp',
    to: 'jpeg',
    fromLabel: 'WebP',
    toLabel: 'JPEG',
    title: 'WebP to JPEG',
    accept: 'image/webp,.webp',
    fact: { value: 'JPEG', label: 'Opens anywhere', text: 'Works on any PC, phone, app or website.' },
  },
  'webp-to-png': {
    from: 'webp',
    to: 'png',
    fromLabel: 'WebP',
    toLabel: 'PNG',
    title: 'WebP to PNG',
    accept: 'image/webp,.webp',
    fact: { value: 'Alpha', label: 'Keeps transparency', text: 'Transparent areas stay transparent.' },
  },
  'jpeg-to-webp': {
    from: 'jpeg',
    to: 'webp',
    fromLabel: 'JPEG',
    toLabel: 'WebP',
    title: 'JPEG to WebP',
    accept: 'image/jpeg,.jpg,.jpeg,.jfif',
    fact: { value: '1-100', label: 'Quality you choose', text: 'WebP files are usually lighter than JPEG.' },
  },
  'png-to-webp': {
    from: 'png',
    to: 'webp',
    fromLabel: 'PNG',
    toLabel: 'WebP',
    title: 'PNG to WebP',
    accept: 'image/png,.png',
    fact: { value: 'Lighter', label: 'Smaller files', text: 'WebP files are usually much smaller than PNG.' },
  },
};

const FAQ = [
  { question: 'Are my images uploaded?', answer: 'No. The conversion runs in your browser. Your image never leaves your device.' },
  { question: 'Do I need an account?', answer: 'No. There is no sign-up or login.' },
  { question: 'What can thedroppic do?', answer: 'It converts images between JPEG, PNG, WebP and HEIC, right in your browser.' },
  { question: 'How many images can I process at once?', answer: 'Up to 5. Each one is converted and downloaded separately.' },
  { question: 'Which image formats are supported?', answer: 'JPEG, PNG, WebP and HEIC. Pick the tab for the conversion you need.' },
  { question: 'Is it free?', answer: 'Yes. There is no limit on how often you use it.' },
];

const LEARN_MORE: Array<{ route: PageRoute; label: string; text: string }> = [
  { route: 'article-formats', label: 'Which image format should you use?', text: 'A short guide to JPG, PNG, WebP, AVIF, TIFF and HEIC.' },
  { route: 'article-browser-processing', label: 'How browser-based image processing works', text: 'What happens to your image, step by step.' },
  { route: 'about', label: 'About thedroppic', text: 'Why the tools run in your browser.' },
];

const CHEVRON =
  '<svg class="conv-faq__chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m5 7.5 5 5 5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function renderConverterPage(route: ConverterRoute): HTMLElement {
  const def = CONVERTERS[route];
  const wrap = document.createElement('div');
  wrap.className = 'conv';

  // The page's h1: the design has no visible heading, only the tabs.
  const h1 = document.createElement('h1');
  h1.className = 'visually-hidden';
  h1.textContent = def.title;
  wrap.appendChild(h1);

  // ---- Tool box with tabs
  const row = document.createElement('section');
  row.className = 'conv-row';

  const box = document.createElement('div');
  box.className = 'conv-box';

  const tabs = document.createElement('nav');
  tabs.className = 'conv-tabs';
  tabs.setAttribute('aria-label', 'Converters');
  for (const tabRoute of TAB_ORDER) {
    const a = document.createElement('a');
    a.href = pathForRoute(tabRoute);
    a.textContent = CONVERTERS[tabRoute].title;
    if (tabRoute === route) a.setAttribute('aria-current', 'page');
    tabs.appendChild(a);
  }
  box.appendChild(tabs);

  const body = document.createElement('div');
  body.className = 'conv-box__body';
  const host = document.createElement('div');
  host.id = 'upload';
  body.appendChild(host);
  box.appendChild(body);
  row.appendChild(box);

  const workspace = createToolWorkspace({
    forceRemoveBackground: false,
    showFormatSelector: false,
    showBackgroundToggle: false,
    fixedOutputFormat: def.to,
    allowedSources: [def.from],
    convertLabel: `Convert to ${def.toLabel}`,
    wrongFormatMessage: (detected) => {
      const that = `That file is ${SOURCE_LABEL[detected]}.`;
      const tabsForIt = TAB_ORDER.filter((r) => CONVERTERS[r].from === detected).map((r) => CONVERTERS[r].title);
      if (tabsForIt.length === 0) return `${that} This tab converts ${def.fromLabel} to ${def.toLabel}.`;
      return `${that} Use the ${tabsForIt.join(' or ')} tab instead.`;
    },
    upload: {
      title: `Drop up to 5 ${def.fromLabel} images here`,
      buttonLabel: 'Choose images',
      accept: def.accept,
      formats: null,
      minimal: true,
    },
  });
  workspace.mount(host);

  // ---- Side column: lock, privacy note, three fact cards
  const side = document.createElement('aside');
  side.className = 'conv-side';
  side.appendChild(renderArt({ src: '/art/lock-sm.svg', alt: '', width: 460, height: 600, className: 'conv-side__lock', priority: true }));

  const note = document.createElement('p');
  note.className = 'conv-side__text';
  note.textContent = 'Your photo never leaves your device. Your browser does the work, so there is no upload, no queue and nothing to delete afterwards.';
  side.appendChild(note);

  const cards = document.createElement('div');
  cards.className = 'conv-cards';
  const facts = [
    { cls: 'a', value: 'Free', label: 'Always', text: 'No account, no limits, no watermark.' },
    { cls: 'b', value: '5', label: 'Files at once', text: 'Drop up to 5 images and convert them together.' },
    { cls: 'c', ...def.fact },
  ];
  for (const fact of facts) {
    const card = document.createElement('div');
    card.className = `stat-card stat-card--${fact.cls}`;
    card.innerHTML = '<p class="stat-card__value"></p><p class="stat-card__label"></p><p class="stat-card__text"></p>';
    card.querySelector('.stat-card__value')!.textContent = fact.value;
    card.querySelector('.stat-card__label')!.textContent = fact.label;
    card.querySelector('.stat-card__text')!.textContent = fact.text;
    cards.appendChild(card);
  }
  side.appendChild(cards);
  row.appendChild(side);
  wrap.appendChild(row);

  // ---- FAQ
  const faq = document.createElement('section');
  faq.className = 'conv-faq';
  faq.setAttribute('aria-labelledby', 'faq-heading');
  faq.innerHTML = '<h2 id="faq-heading">Frequently asked questions</h2>';
  for (const item of FAQ) {
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
  wrap.appendChild(faq);

  // ---- Call-to-action band
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
  // "Choose images" takes you back up to the drop area at the top of the page.
  cta.querySelector<HTMLButtonElement>('.conv-cta__btn')!.addEventListener('click', () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    document.getElementById('file-input')?.focus({ preventScroll: true });
  });
  wrap.appendChild(cta);

  // ---- Learn more
  const more = document.createElement('section');
  more.className = 'conv-more';
  more.setAttribute('aria-labelledby', 'more-heading');
  more.innerHTML = '<h2 id="more-heading">Learn more</h2><ul class="conv-more__list"></ul>';
  const list = more.querySelector('ul')!;
  for (const item of LEARN_MORE) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = pathForRoute(item.route);
    a.innerHTML = '<span class="conv-more__label"></span><span class="conv-more__text"></span>';
    a.querySelector('.conv-more__label')!.textContent = item.label;
    a.querySelector('.conv-more__text')!.textContent = item.text;
    li.appendChild(a);
    list.appendChild(li);
  }
  wrap.appendChild(more);

  return wrap;
}
