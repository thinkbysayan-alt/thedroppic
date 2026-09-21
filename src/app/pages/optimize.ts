import { createOptimizeWorkspace } from '../optimize-workspace';
import { ICON } from '../icons';
import {
  renderBreadcrumb,
  renderHowItWorks,
  renderCtaBand,
  renderToolFaq,
  renderScrollCard,
  renderSwipeStack,
  renderMediaCard,
  renderRelatedLinks,
} from '../sections';
import { renderFeatureCarousel } from '../feature-carousel';

const USE_CASES = [
  { title: 'Websites', description: 'Pages load faster.', image: '/img/use-cases/laptop.jpg', alt: 'A laptop on a wooden desk next to a coffee cup' },
  { title: 'Email', description: 'Stay under attachment limits.', image: '/img/use-cases/design-desk.jpg', alt: 'A desk with monitor, tablet and keyboard' },
  { title: 'Social Media', description: 'Meet upload size limits.', image: '/img/use-cases/portrait.jpg', alt: 'Portrait of a person holding wildflowers' },
  { title: 'E-commerce', description: 'Lighter product images.', image: '/img/use-cases/mug.jpg', alt: 'A printed ceramic mug on a wooden table' },
  { title: 'Documents', description: 'Smaller attachments.', image: '/img/use-cases/brand-books.jpg', alt: 'Books, notebooks and a phone on a work desk' },
  { title: 'Portfolio', description: 'Lighter files for your work.', image: '/img/use-cases/camera.jpg', alt: 'A vintage film camera resting on piano keys' },
];

export function renderOptimizePage(): HTMLElement {
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
        { icon: ICON.chartLineDown, title: 'Smaller files', description: 'See the exact size before and after.' },
        { icon: ICON.images, title: 'Six formats', description: 'JPG, PNG, WebP, AVIF, TIFF and HEIC.' },
        { icon: ICON.lightning, title: 'Private', description: 'Files stay on your device.' },
        { icon: ICON.slidersHorizontal, title: 'Simple controls', description: 'Pick a level, check the result, download.' },
      ],
      'accent-lavender',
      'Why use the image compressor',
    ),
  );

  wrap.appendChild(
    renderHowItWorks(
      'How to compress an image',
      '',
      [
        { icon: ICON.uploadSimple, title: 'Add your images', description: 'Choose or drop up to 5 files.' },
        { icon: ICON.gearSix, title: 'Pick a level', description: 'Small, Medium or Original. This step is optional.' },
        { icon: ICON.downloadSimple, title: 'Download', description: 'Save the smaller file.' },
      ],
      'accent-lavender',
    ),
  );

  wrap.appendChild(renderUseCases());
  wrap.appendChild(renderToolFaq(OPTIMIZE_FAQ, 'Image compressor questions'));
  wrap.appendChild(
    renderRelatedLinks('Related tools and guides', [
      { route: 'convert', label: 'Convert image formats', description: 'Switch to WebP or AVIF for smaller files.' },
      { route: 'article-formats', label: 'Which image format should you use?', description: 'Compare formats by size and quality.' },
      { route: 'remove-background', label: 'Remove an image background', description: 'Get a transparent PNG cutout.' },
    ]),
  );
  wrap.appendChild(
    renderCtaBand(
      'Ready to make your images smaller?',
      '',
      'Choose images',
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
    <h1>Reduce image file size <br /><span class="tool-hero__accent">in your browser.</span></h1>
    <p>Pick Small, Medium or Original quality. Nothing is uploaded.</p>
  `;
  return hero;
}

function renderUseCases(): HTMLElement {
  const cards = USE_CASES.map((u) => renderMediaCard(u));

  return renderScrollCard(
    'Where smaller images help',
    'Faster pages and easier sharing.',
    renderSwipeStack(cards, 'accent-lavender'),
    'accent-lavender',
  );
}

const OPTIMIZE_FAQ = [
  { question: 'Will this reduce image quality?', answer: 'Small and Medium trade some quality for a smaller file. Original keeps quality as high as possible while still re-encoding.' },
  { question: 'Is my image uploaded?', answer: 'No. Compression runs in your browser. Your image never leaves your device.' },
  { question: 'Which formats are supported?', answer: 'JPG, PNG, WebP, AVIF, TIFF and HEIC. PNG and TIFF are lossless, so the level has limited effect on their size. The app tells you when that applies.' },
  { question: 'How much smaller will my file be?', answer: 'It depends on the image and format. Every result shows the exact before and after size and the percentage saved.' },
  { question: 'Can I compress several images at once?', answer: 'Yes, up to 5. Each one has its own level.' },
  { question: 'Is it free?', answer: 'Yes. There is no limit on how often you use it.' },
];
