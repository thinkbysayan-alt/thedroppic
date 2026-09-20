import { createToolWorkspace } from '../tool-workspace';
import { ICON } from '../icons';
import { renderBreadcrumb, renderHowItWorks, renderCtaBand, renderToolFaq, renderScrollCard, renderSwipeStack } from '../sections';
import { renderFeatureCarousel } from '../feature-carousel';
import { takePendingHandoffFiles } from './home';


const FORMAT_CARDS = [
  { label: 'JPG', color: 'fmt-jpg', note: 'Best for photos and everyday use.' },
  { label: 'PNG', color: 'fmt-png', note: 'Supports transparency.' },
  { label: 'WebP', color: 'fmt-webp', note: 'Great for the web. Smaller file sizes.' },
  { label: 'AVIF', color: 'fmt-avif', note: 'Modern format with high compression.' },
  { label: 'TIFF', color: 'fmt-tiff', note: 'High-quality image files.' },
  { label: 'HEIC', color: 'fmt-heic', note: 'Apple photos and iPhone images.' },
];

export function renderConvertPage(): HTMLElement {
  document.title = 'Image Converter: JPG, PNG, WebP, AVIF, TIFF & HEIC | thedroppic';
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
    renderFeatureCarousel(
      [
        { icon: ICON.shieldCheck, title: 'Completely private', description: 'Nothing is uploaded. Everything runs locally in your browser.' },
        { icon: ICON.lightning, title: 'Fast & simple', description: 'Convert images in seconds. No queues. No fuss.' },
        { icon: ICON.images, title: 'All major formats', description: 'JPG, PNG, WebP, AVIF, TIFF, HEIC: all in one place.' },
        { icon: ICON.stack, title: 'Batch support', description: 'Convert up to 5 images at once without the clutter.' },
        { icon: ICON.downloadSimple, title: 'Direct downloads', description: 'One image, one download. No zip files required.' },
      ],
      'accent-blue',
    ),
  );

  wrap.appendChild(
    renderHowItWorks(
      'Three simple steps',
      'Convert your images in seconds. No upload. No waiting.',
      [
        { icon: ICON.uploadSimple, title: 'Add your images', description: 'Choose or drop up to 5 files from your device.' },
        { icon: ICON.slidersHorizontal, title: 'Choose output format', description: 'Select the format you need (JPG, PNG, WebP, AVIF, TIFF, HEIC).' },
        { icon: ICON.downloadSimple, title: 'Download', description: 'Get your converted images instantly. Nothing is uploaded.' },
      ],
      'accent-blue',
    ),
  );

  wrap.appendChild(renderFormatsSection());
  wrap.appendChild(renderToolFaq(CONVERT_FAQ));
  wrap.appendChild(
    renderCtaBand(
      'Ready to convert your images?',
      '',
      'Choose images',
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
    <h1>Convert images<br /><span class="tool-hero__accent">in seconds.</span></h1>
    <p>Change image formats directly in your browser. Nothing is uploaded. Your images stay on your device.</p>
  `;
  return hero;
}

function renderFormatsSection(): HTMLElement {
  const cards = FORMAT_CARDS.map((f) => {
    const item = document.createElement('div');
    item.className = 'scroll-card-item';
    item.innerHTML = `<span class="scroll-card-item__label"></span><p></p>`;
    item.querySelector('.scroll-card-item__label')!.textContent = f.label;
    item.querySelector('p')!.textContent = f.note;
    return item;
  });

  return renderScrollCard(
    'Works with the formats you need',
    'Convert between all popular image formats.',
    renderSwipeStack(cards, 'accent-blue'),
    'accent-blue',
  );
}

const CONVERT_FAQ = [
  { question: 'Is my image uploaded to your server?', answer: 'No. Conversion happens entirely in your browser using WebAssembly. Your image never leaves your device.' },
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
