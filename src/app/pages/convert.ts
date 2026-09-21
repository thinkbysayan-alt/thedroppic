import { createToolWorkspace } from '../tool-workspace';
import { ICON } from '../icons';
import {
  renderBreadcrumb,
  renderHowItWorks,
  renderCtaBand,
  renderToolFaq,
  renderScrollCard,
  renderSwipeStack,
  renderRelatedLinks,
} from '../sections';
import { renderFeatureCarousel } from '../feature-carousel';
import { takePendingHandoffFiles } from './home';

const FORMAT_CARDS = [
  { label: 'JPG', note: 'Best for photos and everyday sharing.' },
  { label: 'PNG', note: 'Lossless, and keeps transparency.' },
  { label: 'WebP', note: 'Small files for websites.' },
  { label: 'AVIF', note: 'High compression for modern browsers.' },
  { label: 'TIFF', note: 'Large, high-quality files for print and editing.' },
  { label: 'HEIC', note: 'The format iPhones use for photos. Input only.' },
];

export function renderConvertPage(): HTMLElement {
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
    // Fired from the homepage's own upload card: feed it straight into this tool's pipeline.
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
        { icon: ICON.shieldCheck, title: 'Private', description: 'Files stay on your device.' },
        { icon: ICON.lightning, title: 'Fast', description: 'Converts in seconds, with no queue.' },
        { icon: ICON.images, title: 'Six input formats', description: 'Open JPG, PNG, WebP, AVIF, TIFF and HEIC.' },
        { icon: ICON.stack, title: 'Batch support', description: 'Convert up to 5 images at once.' },
        { icon: ICON.downloadSimple, title: 'Direct downloads', description: 'One image, one file. No zip.' },
      ],
      'accent-blue',
      'Why use the image converter',
    ),
  );

  wrap.appendChild(
    renderHowItWorks(
      'How to convert an image',
      '',
      [
        { icon: ICON.uploadSimple, title: 'Add your images', description: 'Choose or drop up to 5 files.' },
        { icon: ICON.slidersHorizontal, title: 'Pick a format', description: 'Choose JPG, PNG, WebP, AVIF or TIFF.' },
        { icon: ICON.downloadSimple, title: 'Download', description: 'Save each converted file.' },
      ],
      'accent-blue',
    ),
  );

  wrap.appendChild(renderFormatsSection());
  wrap.appendChild(renderToolFaq(CONVERT_FAQ, 'Image converter questions'));
  wrap.appendChild(
    renderRelatedLinks('Related tools and guides', [
      { route: 'article-formats', label: 'Which image format should you use?', description: 'A short guide to JPG, PNG, WebP, AVIF, TIFF and HEIC.' },
      { route: 'optimize', label: 'Compress images', description: 'Reduce the file size after you convert.' },
      { route: 'remove-background', label: 'Remove an image background', description: 'Get a transparent PNG cutout.' },
    ]),
  );
  wrap.appendChild(
    renderCtaBand(
      'Ready to convert an image?',
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
    <h1>Convert images <br /><span class="tool-hero__accent">in your browser.</span></h1>
    <p>Change JPG, PNG, WebP, AVIF, TIFF and HEIC files to another format. Nothing is uploaded.</p>
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
    'Supported image formats',
    'What each format is best for.',
    renderSwipeStack(cards, 'accent-blue'),
    'accent-blue',
  );
}

const CONVERT_FAQ = [
  { question: 'Is my image uploaded?', answer: 'No. Conversion runs in your browser using WebAssembly. Your image never leaves your device.' },
  { question: 'Which formats can I convert?', answer: 'You can open JPG, PNG, WebP, AVIF, TIFF and HEIC. You can save as JPG, PNG, WebP, AVIF or TIFF.' },
  { question: 'How many images can I convert at once?', answer: 'Up to 5. Each one is converted and downloaded separately.' },
  { question: 'Is there a file size limit?', answer: 'Images over roughly 100 megapixels are rejected so your browser does not run out of memory.' },
  { question: 'Do I need an account?', answer: 'No. There is no sign-up.' },
  { question: 'Is it free?', answer: 'Yes. There is no limit on how often you use it.' },
];
