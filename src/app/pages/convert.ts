import { createToolWorkspace } from '../tool-workspace';
import { renderBreadcrumb, renderFeatureStrip, renderHowItWorks, renderCtaBand, renderToolFaq } from '../sections';
import { takePendingHandoffFiles } from './home';

const ICON_SHIELD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M12 3 4.5 6v6c0 4.5 3.2 7.7 7.5 9 4.3-1.3 7.5-4.5 7.5-9V6L12 3Z" stroke-linejoin="round"/></svg>`;
const ICON_BOLT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" stroke-linejoin="round"/></svg>`;
const ICON_IMAGES = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><rect x="3" y="5" width="14" height="14" rx="2"/><path d="m7 15 3-4 2.5 3L15 11l4 5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_STACK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M12 2 3 7l9 5 9-5-9-5Z" stroke-linejoin="round"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5" stroke-linejoin="round"/></svg>`;
const ICON_DOWNLOAD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M4 15.5V17a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 4v11m0 0-4-4m4 4 4-4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_GEAR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>`;

const FORMAT_CARDS = [
  { label: 'JPG', color: 'fmt-jpg', note: 'Best for photos and everyday use.' },
  { label: 'PNG', color: 'fmt-png', note: 'Supports transparency.' },
  { label: 'WebP', color: 'fmt-webp', note: 'Great for the web. Smaller file sizes.' },
  { label: 'AVIF', color: 'fmt-avif', note: 'Modern format with high compression.' },
  { label: 'TIFF', color: 'fmt-tiff', note: 'High-quality image files.' },
  { label: 'HEIC', color: 'fmt-heic', note: 'Apple photos and iPhone images.' },
];

export function renderConvertPage(): HTMLElement {
  document.title = 'Image Converter — JPG, PNG, WebP, AVIF, TIFF & HEIC | thedroppic';
  setMetaDescription('Convert images between JPG, PNG, WebP, AVIF, TIFF and HEIC directly in your browser. Nothing is uploaded.');

  const wrap = document.createElement('div');
  wrap.appendChild(renderBreadcrumb('Convert Images', 'convert'));
  wrap.appendChild(renderHero());

  const workspaceHost = document.createElement('div');
  workspaceHost.id = 'upload';
  wrap.appendChild(workspaceHost);

  const workspace = createToolWorkspace({
    forceRemoveBackground: false,
    showFormatSelector: true,
    showBackgroundToggle: true,
  });
  workspace.mount(workspaceHost);

  const handoff = takePendingHandoffFiles();
  if (handoff && handoff.length > 0) {
    // Fired from the homepage's own upload card — feed it straight into this tool's pipeline.
    const input = workspaceHost.querySelector<HTMLInputElement>('#file-input');
    if (input) {
      const dt = new DataTransfer();
      handoff.forEach((f) => dt.items.add(f));
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  wrap.appendChild(
    renderFeatureStrip(
      [
        { icon: ICON_SHIELD, title: 'Completely private', description: 'Nothing is uploaded. Everything runs locally in your browser.' },
        { icon: ICON_BOLT, title: 'Fast & simple', description: 'Convert images in seconds. No queues. No fuss.' },
        { icon: ICON_IMAGES, title: 'All major formats', description: 'JPG, PNG, WebP, AVIF, TIFF, HEIC — all in one place.' },
        { icon: ICON_STACK, title: 'Batch support', description: 'Convert up to 5 images at once without the clutter.' },
        { icon: ICON_DOWNLOAD, title: 'Direct downloads', description: 'One image, one download. No zip files required.' },
      ],
      'feature-strip feature-strip--five',
    ),
  );

  wrap.appendChild(
    renderHowItWorks(
      'Three simple steps',
      'Convert your images in seconds. No upload. No waiting.',
      [
        { title: 'Add your images', description: 'Choose or drop up to 5 files from your device.', icon: ICON_IMAGES },
        { title: 'Choose output format', description: 'Select the format you need (JPG, PNG, WebP, AVIF, TIFF, HEIC).', icon: ICON_GEAR },
        { title: 'Download', description: 'Get your converted images instantly. Nothing is uploaded.', icon: ICON_DOWNLOAD },
      ],
      'accent-blue',
    ),
  );

  wrap.appendChild(renderFormatsSection());
  wrap.appendChild(renderToolFaq(CONVERT_FAQ));
  wrap.appendChild(
    renderCtaBand(
      'Ready to convert your images?',
      'Fast. Private. No upload. Just results.',
      'Choose Images',
      '',
      'accent-blue',
      () => document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    ),
  );

  return wrap;
}

function renderHero(): HTMLElement {
  const hero = document.createElement('section');
  hero.className = 'tool-hero accent-blue';
  hero.innerHTML = `
    <span class="eyebrow">IMAGE CONVERTER</span>
    <h1>Convert images<br /><span class="tool-hero__accent">in seconds.</span></h1>
    <p>Change image formats directly in your browser. Nothing is uploaded. Your images stay on your device.</p>
  `;
  return hero;
}

function renderFormatsSection(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'section formats-section';
  section.innerHTML = `<p class="eyebrow eyebrow--center">FORMATS SUPPORTED</p><h2>Works with the formats you need</h2><p class="section-sub">Convert between all popular image formats.</p>`;

  const grid = document.createElement('div');
  grid.className = 'format-cards';
  FORMAT_CARDS.forEach((f) => {
    const card = document.createElement('div');
    card.className = `format-card ${f.color}`;
    card.innerHTML = `<span class="format-card__label"></span><p></p>`;
    card.querySelector('.format-card__label')!.textContent = f.label;
    card.querySelector('p')!.textContent = f.note;
    grid.appendChild(card);
  });
  section.appendChild(grid);
  return section;
}

const CONVERT_FAQ = [
  { question: 'Is my image uploaded to your server?', answer: 'No. Conversion happens entirely in your browser using WebAssembly — your image never leaves your device.' },
  { question: 'How many images can I convert at once?', answer: 'Up to 5 images per batch, each converted and downloaded independently.' },
  { question: 'What formats are supported?', answer: 'Input: JPG, PNG, WebP, AVIF, TIFF, HEIC. Output: JPG, PNG, WebP, AVIF, TIFF.' },
  { question: 'Is there a file size limit?', answer: "Very large images (roughly over 100 megapixels) are rejected up front so your browser doesn't run out of memory." },
  { question: 'Do I need to create an account?', answer: 'No. thedroppic never requires sign-up.' },
  { question: 'Is it really free to use?', answer: 'Yes, with no limits on how many times you use it.' },
];

function setMetaDescription(text: string): void {
  const el = document.querySelector('meta[name="description"]');
  if (el) el.setAttribute('content', text);
}
