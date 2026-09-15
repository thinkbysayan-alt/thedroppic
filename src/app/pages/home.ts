import { renderUploadCard, listenForClipboardPaste } from '../../components/upload/upload';
import { renderFeatureStrip, renderHowItWorks, renderCtaBand, renderToolFaq } from '../sections';
import { navigate, pathForRoute } from '../router';
import { initScrollReveal } from '../../utils/reveal';

const ICON_UPLOAD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M4 15.5V17a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 15V4m0 0-4 4m4-4 4 4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_GEAR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>`;
const ICON_DOWNLOAD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M4 15.5V17a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 4v11m0 0-4-4m4 4 4-4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_CONVERT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M17 2.5 21 6.5m0 0-4 4m4-4H8a5 5 0 0 0-5 5" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 21.5 3 17.5m0 0 4-4m-4 4h13a5 5 0 0 0 5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_CUTOUT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-dasharray="3 3" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="m9 15 3-4 2 2.5L17 9" stroke-dasharray="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_OPTIMIZE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M4 4v6h6M20 20v-6h-6" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 10a8 8 0 0 0-14.3-4.3M4 14a8 8 0 0 0 14.3 4.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_SHIELD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M12 3 4.5 6v6c0 4.5 3.2 7.7 7.5 9 4.3-1.3 7.5-4.5 7.5-9V6L12 3Z" stroke-linejoin="round"/></svg>`;
const ICON_BOLT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" stroke-linejoin="round"/></svg>`;
const ICON_IMAGES = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><rect x="3" y="5" width="14" height="14" rx="2"/><path d="m7 15 3-4 2.5 3L15 11l4 5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_STACK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M12 2 3 7l9 5 9-5-9-5Z" stroke-linejoin="round"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5" stroke-linejoin="round"/></svg>`;
const ICON_USER = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" stroke-linecap="round"/></svg>`;

export function renderHomePage(): HTMLElement {
  document.title = 'thedroppic — Private Image Tools That Run in Your Browser';
  setMetaDescription(
    'Convert images, remove backgrounds, and optimize file size — entirely in your browser. No account, no upload, nothing leaves your device.',
  );

  const wrap = document.createElement('div');
  wrap.appendChild(renderHero());
  wrap.appendChild(renderToolsSection());
  wrap.appendChild(
    renderHowItWorks(
      'Three simple steps',
      'Everything happens on your device. Fast, private and hassle-free.',
      [
        { title: 'Drop', description: 'Choose your image (up to 5 files).', icon: ICON_IMAGES },
        { title: 'Process', description: 'Your browser does the work locally.', icon: ICON_GEAR },
        { title: 'Download', description: 'Get your result instantly. No upload. No waiting.', icon: ICON_DOWNLOAD },
      ],
      'accent-brand',
    ),
  );
  wrap.appendChild(renderBenefits());
  wrap.appendChild(
    renderCtaBand(
      'Get the image you need in seconds.',
      'Private. Simple. Powerful.',
      'Choose Images',
      'No account. No upload. Runs 100% in your browser.',
      'accent-brand',
      () => document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    ),
  );
  wrap.appendChild(renderToolFaq(HOME_FAQ));

  requestAnimationFrame(() => initScrollReveal(wrap));
  return wrap;
}

function renderHero(): HTMLElement {
  const hero = document.createElement('section');
  hero.className = 'home-hero';

  const copy = document.createElement('div');
  copy.className = 'home-hero__copy';
  copy.innerHTML = `
    <span class="eyebrow">PRIVATE · INSTANT · BROWSER BASED</span>
    <h1>Your images.<br />Your device.<br /><span class="home-hero__accent">Your control.</span></h1>
    <p>Convert images, remove backgrounds and optimize files directly in your browser. Nothing is uploaded.</p>
  `;
  hero.appendChild(copy);

  const uploadWrap = document.createElement('div');
  uploadWrap.id = 'upload';
  uploadWrap.appendChild(
    renderUploadCard({
      onFiles: (files) => {
        // Homepage upload is a shortcut straight into the Convert tool — it decodes there so any bad-file error shows in context.
        void routeFilesToConvert(files);
      },
    }),
  );
  hero.appendChild(uploadWrap);

  listenForClipboardPaste((file) => void routeFilesToConvert([file]));

  return hero;
}

/** Homepage upload doesn't run its own pipeline — it hands the files to the Convert tool page via a short-lived in-memory handoff, matching "no fourth path" simplicity. */
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
  section.innerHTML = `<p class="eyebrow eyebrow--center">OUR TOOLS</p><h2>What would you like to do?</h2><p class="section-sub">Pick a tool and get started. All tools run locally in your browser.</p>`;

  const grid = document.createElement('div');
  grid.className = 'tool-cards';

  const cards: Array<{ route: 'convert' | 'remove-background' | 'optimize'; accent: string; icon: string; title: string; description: string; formats: string }> = [
    {
      route: 'convert',
      accent: 'accent-blue',
      icon: ICON_CONVERT,
      title: 'Convert Images',
      description: 'Change image formats in seconds.',
      formats: 'JPG, PNG, WebP, AVIF, TIFF, HEIC',
    },
    {
      route: 'remove-background',
      accent: 'accent-mint',
      icon: ICON_CUTOUT,
      title: 'Remove Background',
      description: 'Get clean cutouts with AI (no upload).',
      formats: '',
    },
    {
      route: 'optimize',
      accent: 'accent-lavender',
      icon: ICON_OPTIMIZE,
      title: 'Optimize / Compress',
      description: 'Reduce file size without losing quality.',
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
      <span class="icon-badge tool-card__icon">${card.icon}</span>
      <h3></h3>
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
  section.innerHTML = `<h2 class="visually-hidden">Why people choose thedroppic</h2><p class="benefits-compact__heading">Why people choose thedroppic</p>`;

  section.appendChild(
    renderFeatureStrip(
      [
        { icon: ICON_SHIELD, title: 'Completely private', description: 'Nothing is uploaded.' },
        { icon: ICON_BOLT, title: 'Fast & simple', description: 'No queues. No fuss.' },
        { icon: ICON_IMAGES, title: 'All major formats', description: 'JPG, PNG, WebP, AVIF, TIFF, HEIC.' },
        { icon: ICON_STACK, title: 'Convert up to 5 images', description: 'Batch without the clutter.' },
        { icon: ICON_USER, title: 'No account required', description: 'Just drop and go.' },
        { icon: ICON_DOWNLOAD, title: 'Direct downloads', description: 'One image, one click.' },
      ],
      'benefits-compact__grid',
    ),
  );

  return section;
}

const HOME_FAQ = [
  { question: 'Are my images uploaded?', answer: 'No. Every tool processes your image locally in your browser — nothing is sent to a server.' },
  { question: 'Do I need an account?', answer: 'No. thedroppic does not require an account or sign-in.' },
  { question: 'How many images can I process at once?', answer: 'Up to 5 images at a time, in Convert, Remove Background, and Optimize.' },
  { question: 'What tools does thedroppic offer?', answer: 'Three: Convert Images (format conversion), Remove Background (AI cutouts), and Optimize/Compress (file-size reduction).' },
];

function setMetaDescription(text: string): void {
  const el = document.querySelector('meta[name="description"]');
  if (el) el.setAttribute('content', text);
}

// re-export ICON_UPLOAD so it isn't flagged unused if a future tweak needs it inline
void ICON_UPLOAD;
