import { renderUploadCard, listenForClipboardPaste } from '../../components/upload/upload';
import { ICON } from '../icons';
import { renderFeatureStrip, renderHowItWorks, renderCtaBand, renderToolFaq, renderRelatedLinks } from '../sections';
import { navigate, pathForRoute } from '../router';
import { initScrollReveal } from '../../utils/reveal';

export function renderHomePage(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.appendChild(renderHero());
  wrap.appendChild(renderToolsSection());
  wrap.appendChild(
    renderHowItWorks(
      'How it works',
      'Everything runs in your browser.',
      [
        { icon: ICON.cursorClick, title: 'Drop', description: 'Choose up to 5 images.' },
        { icon: ICON.cpu, title: 'Process', description: 'Your browser does the work. Nothing is sent to a server.' },
        { icon: ICON.downloadSimple, title: 'Download', description: 'Save the result. There is no upload to wait for.' },
      ],
      'accent-brand',
    ),
  );
  wrap.appendChild(renderBenefits());
  wrap.appendChild(
    renderCtaBand(
      'Drop an image to get started.',
      '',
      'Choose images',
      'No account. No upload.',
      'accent-brand',
      () => document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    ),
  );
  wrap.appendChild(renderToolFaq(HOME_FAQ));
  wrap.appendChild(
    renderRelatedLinks('Learn more', [
      { route: 'article-formats', label: 'Which image format should you use?', description: 'A short guide to JPG, PNG, WebP, AVIF, TIFF and HEIC.' },
      { route: 'article-browser-processing', label: 'How browser-based image processing works', description: 'What happens to your image, step by step.' },
      { route: 'about', label: 'About thedroppic', description: 'Why the tools run in your browser.' },
    ]),
  );

  requestAnimationFrame(() => initScrollReveal(wrap));
  return wrap;
}

function renderHero(): HTMLElement {
  const hero = document.createElement('section');
  hero.className = 'home-hero';

  const copy = document.createElement('div');
  copy.className = 'home-hero__copy';
  copy.innerHTML = `
    <h1>Convert, cut out and compress images <br /><span class="home-hero__accent"><span class="flip-word">for free.</span></span></h1>
    <p>Change formats, remove backgrounds and reduce file size in your browser. No account, no upload.</p>
  `;
  hero.appendChild(copy);
  startFlipWords(copy.querySelector<HTMLElement>('.flip-word')!);

  const uploadWrap = document.createElement('div');
  uploadWrap.id = 'upload';
  uploadWrap.appendChild(
    renderUploadCard({
      onFiles: (files) => {
        // Homepage upload is a shortcut straight into the Convert tool: it decodes there so any bad-file error shows in context.
        void routeFilesToConvert(files);
      },
    }),
  );
  hero.appendChild(uploadWrap);

  listenForClipboardPaste((file) => void routeFilesToConvert([file]));

  return hero;
}

const FLIP_WORDS = ['for free.', 'no login needed.', 'no upload needed.'];
const FLIP_HALF_MS = 260;
const FLIP_INTERVAL_MS = 3200;

/** Cycles the accent words with a subtle vertical flip. Static "for free." when the user prefers reduced motion. */
function startFlipWords(el: HTMLElement): void {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  let index = 0;
  window.setInterval(() => {
    if (!el.isConnected) return;
    el.classList.add('is-out');
    window.setTimeout(() => {
      index = (index + 1) % FLIP_WORDS.length;
      el.textContent = FLIP_WORDS[index]!;
      el.classList.remove('is-out');
      el.classList.add('is-in');
      void el.offsetWidth; // commit the "in" start state before transitioning to rest
      el.classList.remove('is-in');
    }, FLIP_HALF_MS);
  }, FLIP_INTERVAL_MS);
}

/** Homepage upload doesn't run its own pipeline: it hands the files to the Convert tool page via a short-lived in-memory handoff. */
let pendingHandoffFiles: File[] | null = null;
export function takePendingHandoffFiles(): File[] | null {
  const files = pendingHandoffFiles;
  pendingHandoffFiles = null;
  return files;
}
async function routeFilesToConvert(files: File[]): Promise<void> {
  if (files.length === 0) return;
  pendingHandoffFiles = files;
  navigate('convert');
}

function renderToolsSection(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'section tools-section';
  section.id = 'tools';
  section.innerHTML = `<h2>Choose a tool</h2>`;

  const grid = document.createElement('div');
  grid.className = 'tool-cards';

  const cards: Array<{ route: 'convert' | 'remove-background' | 'optimize'; accent: string; icon: string; title: string; description: string; formats: string }> = [
    {
      route: 'convert',
      accent: 'accent-blue',
      icon: ICON.arrowsLeftRight,
      title: 'Convert Images',
      description: 'Change the format of any image.',
      formats: 'JPG, PNG, WebP, AVIF, TIFF, HEIC',
    },
    {
      route: 'remove-background',
      accent: 'accent-mint',
      icon: ICON.scissors,
      title: 'Remove Background',
      description: 'Cut out a subject with AI and get a transparent PNG.',
      formats: '',
    },
    {
      route: 'optimize',
      accent: 'accent-lavender',
      icon: ICON.arrowsInLineVertical,
      title: 'Optimize / Compress',
      description: 'Make files smaller. Pick Small, Medium or Original quality.',
      formats: '',
    },
  ];

  cards.forEach((card, index) => {
    const el = document.createElement('a');
    el.href = pathForRoute(card.route);
    el.className = `tool-card ${card.accent}`;
    el.setAttribute('data-reveal', '');
    el.style.setProperty('--reveal-delay', `${index * 100}ms`);
    el.innerHTML = `
      <div class="tool-card__head"><span class="icon-badge tool-card__icon">${card.icon}</span><h3></h3></div>
      <p></p>
      ${card.formats ? `<p class="tool-card__formats"></p>` : ''}
      <span class="tool-card__arrow" aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7.5 4.5 13 10l-5.5 5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
    `;
    el.querySelector('h3')!.textContent = card.title;
    el.querySelector('p')!.textContent = card.description;
    if (card.formats) el.querySelector('.tool-card__formats')!.textContent = card.formats;
    grid.appendChild(el);
  });

  section.appendChild(grid);
  return section;
}

function renderBenefits(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'section benefits-compact';
  section.id = 'privacy';
  section.innerHTML = `<h2>Why use thedroppic</h2>`;

  section.appendChild(
    renderFeatureStrip(
      [
        { icon: ICON.shieldCheck, title: 'Private', description: 'Images never leave your device.' },
        { icon: ICON.userCheck, title: 'No account', description: 'Open the page and start.' },
        { icon: ICON.images, title: 'Six formats', description: 'JPG, PNG, WebP, AVIF, TIFF, HEIC.' },
        { icon: ICON.stack, title: 'Up to 5 at once', description: 'Process a small batch in one go.' },
        { icon: ICON.downloadSimple, title: 'Direct downloads', description: 'One image, one file.' },
        { icon: ICON.lightning, title: 'Free', description: 'No limit on how often you use it.' },
      ],
      'benefits-compact__grid',
    ),
  );

  return section;
}

const HOME_FAQ = [
  { question: 'Are my images uploaded?', answer: 'No. Every tool runs in your browser and nothing is sent to a server. The background remover downloads an AI model once, but never your image.' },
  { question: 'Do I need an account?', answer: 'No. There is no sign-up or login.' },
  { question: 'What can thedroppic do?', answer: 'It converts image formats, removes backgrounds with AI and reduces file size.' },
  { question: 'How many images can I process at once?', answer: 'Up to 5 in each tool.' },
  { question: 'Which image formats are supported?', answer: 'You can open JPG, PNG, WebP, AVIF, TIFF and HEIC. Converted images save as JPG, PNG, WebP, AVIF or TIFF.' },
  { question: 'Is it free?', answer: 'Yes. There is no limit on how often you use it.' },
];
