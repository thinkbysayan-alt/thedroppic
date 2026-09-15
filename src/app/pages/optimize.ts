import { createOptimizeWorkspace } from '../optimize-workspace';
import { renderBreadcrumb, renderHowItWorks, renderCtaBand, renderToolFaq, renderScrollCard } from '../sections';
import { renderFeatureCarousel } from '../feature-carousel';
import { renderToolHeroVisual } from '../tool-hero-visual';

const ICON_CHART = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M5 19V9M12 19V5M19 19v-7" stroke-linecap="round"/></svg>`;
const ICON_IMAGES = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><rect x="3" y="5" width="14" height="14" rx="2"/><path d="m7 15 3-4 2.5 3L15 11l4 5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_BOLT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" stroke-linejoin="round"/></svg>`;
const ICON_SLIDERS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M5 6h9M5 12h5M5 18h11" stroke-linecap="round"/><circle cx="17" cy="6" r="2"/><circle cx="13" cy="12" r="2"/><circle cx="19" cy="18" r="2"/></svg>`;
const ICON_GEAR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>`;
const ICON_DOWNLOAD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M4 15.5V17a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 4v11m0 0-4-4m4 4 4-4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_GLOBE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 4 6 4 9s-1.5 6.5-4 9c-2.5-2.5-4-6-4-9s1.5-6.5 4-9Z" stroke-linejoin="round"/></svg>`;
const ICON_MAIL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 6.5 8 6 8-6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_PHONE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2" stroke-linecap="round"/></svg>`;
const ICON_CART = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/><path d="M2.5 3h2.5l2.3 12.1a2 2 0 0 0 2 1.6h8a2 2 0 0 0 2-1.6L21 7H6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_FOLDER = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z" stroke-linejoin="round"/></svg>`;
const ICON_FRAME = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m4 18 5-5 4 4 3-3 4 4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const USE_CASES = [
  { icon: ICON_GLOBE, title: 'Websites', description: 'Faster loading pages.' },
  { icon: ICON_MAIL, title: 'Email', description: 'Easier sharing.' },
  { icon: ICON_PHONE, title: 'Social Media', description: 'Meet size limits.' },
  { icon: ICON_CART, title: 'E-commerce', description: 'Smaller product images.' },
  { icon: ICON_FOLDER, title: 'Documents', description: 'Smaller attachments.' },
  { icon: ICON_FRAME, title: 'Portfolio', description: 'High-quality visuals.' },
];

export function renderOptimizePage(): HTMLElement {
  document.title = 'Image Compressor — Reduce Image Size in Your Browser | thedroppic';
  setMetaDescription('Reduce image file size directly in your browser — no upload, no quality compromise. JPG, PNG, WebP, AVIF, TIFF, HEIC.');

  const wrap = document.createElement('div');
  wrap.appendChild(renderBreadcrumb('Optimize / Compress', 'optimize'));
  wrap.appendChild(renderHero());

  const workspaceHost = document.createElement('div');
  workspaceHost.id = 'upload';
  wrap.appendChild(workspaceHost);

  const workspace = createOptimizeWorkspace();
  workspace.mount(workspaceHost);

  wrap.appendChild(
    renderFeatureCarousel(
      [
        { icon: ICON_CHART, title: 'Smaller file sizes', description: 'Reduce file size without losing visible quality.' },
        { icon: ICON_IMAGES, title: 'All major formats', description: 'JPG, PNG, WebP, AVIF, TIFF, HEIC and more.' },
        { icon: ICON_BOLT, title: 'Fast & private', description: 'Optimized in seconds. Nothing is uploaded.' },
        { icon: ICON_SLIDERS, title: 'Simple controls', description: 'Choose quality, see the difference, and download.' },
      ],
      'accent-lavender',
    ),
  );

  wrap.appendChild(
    renderHowItWorks(
      'Three simple steps',
      'Optimize your images in seconds. All on your device.',
      [
        { title: 'Add your images', description: 'Choose or drop up to 5 files from your device.', icon: ICON_IMAGES },
        { title: 'Adjust (optional)', description: 'Choose Small, Medium, or Original.', icon: ICON_GEAR },
        { title: 'Download', description: 'Get your optimized images instantly. No upload.', icon: ICON_DOWNLOAD },
      ],
      'accent-lavender',
    ),
  );

  wrap.appendChild(renderUseCases());
  wrap.appendChild(renderToolFaq(OPTIMIZE_FAQ));
  wrap.appendChild(
    renderCtaBand(
      'Ready to make your images smaller?',
      'Fast. Private. No upload. Just results.',
      'Choose Images',
      '',
      'accent-lavender',
      () => document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    ),
  );

  return wrap;
}

function renderHero(): HTMLElement {
  const hero = document.createElement('section');
  hero.className = 'tool-hero accent-lavender';
  hero.innerHTML = `
    <span class="eyebrow">IMAGE OPTIMIZER</span>
    <h1>Smaller files.<br /><span class="tool-hero__accent">Same quality.</span></h1>
    <p>Reduce image file size directly in your browser. No upload. Your images stay on your device.</p>
  `;
  hero.appendChild(renderToolHeroVisual([ICON_IMAGES, ICON_CHART, ICON_DOWNLOAD]));
  return hero;
}

function renderUseCases(): HTMLElement {
  const grid = document.createElement('div');
  grid.className = 'scroll-card-items';
  USE_CASES.forEach((u) => {
    const card = document.createElement('div');
    card.className = 'scroll-card-item';
    card.innerHTML = `<span class="icon-badge scroll-card-item__icon">${u.icon}</span><h3></h3><p></p>`;
    card.querySelector('h3')!.textContent = u.title;
    card.querySelector('p')!.textContent = u.description;
    grid.appendChild(card);
  });

  return renderScrollCard(
    'PERFECT FOR EVERY USE CASE',
    'Optimize for what matters.',
    'Smaller images, bigger possibilities.',
    grid,
    'accent-lavender',
  );
}

const OPTIMIZE_FAQ = [
  { question: 'Will this reduce the image quality?', answer: 'Small and Medium trade some visual quality for a smaller file; Original keeps quality as high as possible while still re-encoding.' },
  { question: 'Is my image uploaded to your server?', answer: 'No. Optimization runs entirely in your browser.' },
  { question: 'What formats are supported?', answer: 'JPG, PNG, WebP, AVIF, TIFF and HEIC. PNG and TIFF are lossless formats, so the compression level has limited effect on their size — the app tells you when that applies.' },
  { question: 'How much smaller will my file be?', answer: "It depends on the image and format — you'll see the exact before/after size and percentage saved for every result, never an estimate." },
  { question: 'Can I optimize multiple images at once?', answer: 'Yes, up to 5 at a time, each with its own compression level.' },
  { question: 'Is it really free to use?', answer: 'Yes, with no limits on how many times you use it.' },
];

function setMetaDescription(text: string): void {
  const el = document.querySelector('meta[name="description"]');
  if (el) el.setAttribute('content', text);
}
