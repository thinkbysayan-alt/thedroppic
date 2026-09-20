import { renderUploadCard, listenForClipboardPaste } from '../../components/upload/upload';
import { ICON } from '../icons';
import { renderFeatureStrip, renderHowItWorks, renderCtaBand, renderToolFaq } from '../sections';
import { navigate, pathForRoute } from '../router';
import { initScrollReveal } from '../../utils/reveal';


export function renderHomePage(): HTMLElement {
  document.title = 'thedroppic: Private Image Tools That Run in Your Browser';
  setMetaDescription(
    'Convert images, remove backgrounds, and optimize file size, entirely in your browser. No account, no upload, nothing leaves your device.',
  );

  const wrap = document.createElement('div');
  wrap.appendChild(renderHero());
  wrap.appendChild(renderToolsSection());
  wrap.appendChild(
    renderHowItWorks(
      'Three simple steps',
      'Everything happens on your device. Fast, private and hassle-free.',
      [
        { icon: ICON.cursorClick, title: 'Drop', description: 'Choose your image (up to 5 files).' },
        { icon: ICON.cpu, title: 'Process', description: 'Your browser does the work locally.' },
        { icon: ICON.downloadSimple, title: 'Download', description: 'Get your result instantly. No upload. No waiting.' },
      ],
      'accent-brand',
    ),
  );
  wrap.appendChild(renderBenefits());
  wrap.appendChild(
    renderCtaBand(
      'Get the image you need in seconds.',
      '',
      'Choose images',
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
  section.innerHTML = `<h2>What would you like to do?</h2>`;

  const grid = document.createElement('div');
  grid.className = 'tool-cards';

  const cards: Array<{ route: 'convert' | 'remove-background' | 'optimize'; accent: string; icon: string; title: string; description: string; formats: string }> = [
    {
      route: 'convert',
      accent: 'accent-blue',
      icon: ICON.arrowsLeftRight,
      title: 'Convert Images',
      description: 'Change image formats in seconds.',
      formats: 'JPG, PNG, WebP, AVIF, TIFF, HEIC',
    },
    {
      route: 'remove-background',
      accent: 'accent-mint',
      icon: ICON.scissors,
      title: 'Remove Background',
      description: 'Get clean cutouts with AI (no upload).',
      formats: '',
    },
    {
      route: 'optimize',
      accent: 'accent-lavender',
      icon: ICON.arrowsInLineVertical,
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
  section.innerHTML = `<h2>Why people choose thedroppic</h2>`;

  section.appendChild(
    renderFeatureStrip(
      [
        { icon: ICON.shieldCheck, title: 'Completely private', description: 'Nothing is uploaded.' },
        { icon: ICON.lightning, title: 'Fast & simple', description: 'No queues. No fuss.' },
        { icon: ICON.images, title: 'All major formats', description: 'JPG, PNG, WebP, AVIF, TIFF, HEIC.' },
        { icon: ICON.stack, title: 'Convert up to 5 images', description: 'Batch without the clutter.' },
        { icon: ICON.userCheck, title: 'No account required', description: 'Just drop and go.' },
        { icon: ICON.downloadSimple, title: 'Direct downloads', description: 'One image, one click.' },
      ],
      'benefits-compact__grid',
    ),
  );

  return section;
}

const HOME_FAQ = [
  { question: 'Are my images uploaded?', answer: 'No. Every tool processes your image locally in your browser. Nothing is sent to a server.' },
  { question: 'Do I need an account?', answer: 'No. thedroppic does not require an account or sign-in.' },
  { question: 'How many images can I process at once?', answer: 'Up to 5 images at a time, in Convert, Remove Background, and Optimize.' },
  { question: 'What tools does thedroppic offer?', answer: 'Three: Convert Images (format conversion), Remove Background (AI cutouts), and Optimize/Compress (file-size reduction).' },
];

function setMetaDescription(text: string): void {
  const el = document.querySelector('meta[name="description"]');
  if (el) el.setAttribute('content', text);
}

