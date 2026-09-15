import { createToolWorkspace } from '../tool-workspace';
import { renderBreadcrumb, renderHowItWorks, renderCtaBand, renderToolFaq, renderScrollCard } from '../sections';
import { renderFeatureCarousel } from '../feature-carousel';

const ICON_SPARKLE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" stroke-linecap="round"/></svg>`;
const ICON_LOCK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke-linecap="round"/></svg>`;
const ICON_BOLT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" stroke-linejoin="round"/></svg>`;
const ICON_EDIT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M12 20h9" stroke-linecap="round"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" stroke-linejoin="round"/></svg>`;
const ICON_IMAGES = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><rect x="3" y="5" width="14" height="14" rx="2"/><path d="m7 15 3-4 2.5 3L15 11l4 5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_GEAR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>`;
const ICON_DOWNLOAD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M4 15.5V17a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 4v11m0 0-4-4m4 4 4-4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_BAG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M6 8h12l1 12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L6 8Z" stroke-linejoin="round"/><path d="M9 8V6a3 3 0 0 1 6 0v2" stroke-linecap="round"/></svg>`;
const ICON_CAMERA = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.5"/></svg>`;
const ICON_PALETTE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M12 3a9 8 0 1 0 0 16c1.1 0 1.8-.9 1.6-1.8-.2-.9.5-1.7 1.4-1.7H17a4 4 0 0 0 4-4c0-4.7-4-8.5-9-8.5Z" stroke-linejoin="round"/><circle cx="7.5" cy="12" r="1"/><circle cx="9.5" cy="8" r="1"/><circle cx="14.5" cy="8" r="1"/></svg>`;
const ICON_USER_IMAGE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m4 18 5-5 4 4 3-3 4 4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_TAG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M11.6 3H5a2 2 0 0 0-2 2v6.6a2 2 0 0 0 .6 1.4l9 9a2 2 0 0 0 2.8 0l6.6-6.6a2 2 0 0 0 0-2.8l-9-9a2 2 0 0 0-1.4-.6Z" stroke-linejoin="round"/><circle cx="8" cy="8" r="1.5"/></svg>`;

const USE_CASES = [
  { icon: ICON_BAG, title: 'E-commerce', description: 'Product photos ready for your store.' },
  { icon: ICON_CAMERA, title: 'Social Media', description: 'Stand out with clean visuals.' },
  { icon: ICON_PALETTE, title: 'Design Projects', description: 'Use in presentations, mockups and more.' },
  { icon: ICON_USER_IMAGE, title: 'Personal Photos', description: 'Make memories more creative.' },
  { icon: ICON_TAG, title: 'Logos & Graphics', description: 'Isolate elements with ease.' },
];

export function renderRemoveBackgroundPage(): HTMLElement {
  document.title = 'AI Background Remover — No Upload, Runs in Your Browser | thedroppic';
  setMetaDescription('Remove image backgrounds with AI, entirely in your browser. Clean, professional cutouts — nothing is uploaded.');

  const wrap = document.createElement('div');
  wrap.appendChild(renderBreadcrumb('Remove Background', 'remove-background'));
  wrap.appendChild(renderHero());

  const workspaceHost = document.createElement('div');
  workspaceHost.id = 'upload';
  wrap.appendChild(workspaceHost);

  const workspace = createToolWorkspace({
    forceRemoveBackground: true,
    showFormatSelector: false,
    showBackgroundToggle: false,
  });
  workspace.mount(workspaceHost);

  wrap.appendChild(
    renderFeatureCarousel(
      [
        { icon: ICON_SPARKLE, title: 'AI-Powered Cutouts', description: 'Get clean, accurate results for people, products, pets and more.' },
        { icon: ICON_LOCK, title: 'Completely Private', description: 'Everything runs locally in your browser. Nothing is uploaded.' },
        { icon: ICON_BOLT, title: 'Fast & Simple', description: 'Remove backgrounds in seconds. No queues, no hassle.' },
        { icon: ICON_EDIT, title: 'Crop Your Result', description: 'Square-crop the cutout in-app if you need one.' },
      ],
      'accent-mint',
    ),
  );

  wrap.appendChild(
    renderHowItWorks(
      'Three simple steps',
      'Remove backgrounds in seconds. All on your device.',
      [
        { title: 'Add your image', description: 'Choose or drop up to 5 images from your device.', icon: ICON_IMAGES },
        { title: 'AI processes locally', description: 'Your browser removes the background using an on-device model.', icon: ICON_GEAR },
        { title: 'Download', description: 'Get your transparent image instantly. No upload.', icon: ICON_DOWNLOAD },
      ],
      'accent-mint',
    ),
  );

  wrap.appendChild(renderUseCases());
  wrap.appendChild(renderToolFaq(BG_FAQ));
  wrap.appendChild(
    renderCtaBand(
      'Ready to remove a background?',
      'Fast. Private. No upload. Just results.',
      'Choose Images',
      '',
      'accent-mint',
      () => document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    ),
  );

  return wrap;
}

function renderHero(): HTMLElement {
  const hero = document.createElement('section');
  hero.className = 'tool-hero accent-mint';
  hero.innerHTML = `
    <span class="eyebrow">AI BACKGROUND REMOVER</span>
    <h1>Remove backgrounds<br /><span class="tool-hero__accent">in seconds.</span></h1>
    <p>Get clean, professional cutouts with AI — directly in your browser. Nothing is uploaded. Your images stay on your device.</p>
    <p class="tool-hero__note">Works best on people and portraits — the on-device model is trained for portrait subjects, so results on other objects may vary.</p>
  `;
  return hero;
}

function renderUseCases(): HTMLElement {
  const grid = document.createElement('div');
  grid.className = 'use-cases__grid';
  USE_CASES.forEach((u) => {
    const card = document.createElement('div');
    card.className = 'use-case';
    card.innerHTML = `<span class="icon-badge use-case__icon">${u.icon}</span><h3></h3><p></p>`;
    card.querySelector('h3')!.textContent = u.title;
    card.querySelector('p')!.textContent = u.description;
    grid.appendChild(card);
  });

  return renderScrollCard(
    'USE IT ANYWHERE',
    'Perfect for every use case',
    'Create clean, transparent images for your projects.',
    grid,
    'accent-mint',
  );
}

const BG_FAQ = [
  { question: 'Is my image uploaded to your server?', answer: 'No. Background removal runs entirely in your browser using an on-device AI model.' },
  { question: 'Is the result high quality?', answer: 'The model produces a soft alpha matte (not a hard cutout), so edges and hair blend naturally instead of looking like a sticker.' },
  { question: 'How many images can I process at once?', answer: 'Up to 5 images at a time, each processed independently.' },
  { question: 'Can I edit the cutout after removal?', answer: 'You can crop the result to a square. Fine-grained erase/restore brush editing is not available yet.' },
  { question: 'What image formats are supported?', answer: 'Upload JPG, PNG, WebP, AVIF, TIFF or HEIC — the result always downloads as a transparent PNG.' },
  { question: 'Is it really free to use?', answer: 'Yes, with no limits on how many times you use it.' },
];

function setMetaDescription(text: string): void {
  const el = document.querySelector('meta[name="description"]');
  if (el) el.setAttribute('content', text);
}
