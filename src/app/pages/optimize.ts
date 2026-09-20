import { createOptimizeWorkspace } from '../optimize-workspace';
import { ICON } from '../icons';
import { renderBreadcrumb, renderHowItWorks, renderCtaBand, renderToolFaq, renderScrollCard, renderSwipeStack, renderMediaCard } from '../sections';
import { renderFeatureCarousel } from '../feature-carousel';


const USE_CASES = [
  { title: 'Websites', description: 'Faster loading pages.', image: '/img/use-cases/laptop.jpg', alt: 'A laptop on a wooden desk next to a coffee cup' },
  { title: 'Email', description: 'Easier sharing.', image: '/img/use-cases/design-desk.jpg', alt: 'A desk with monitor, tablet and keyboard' },
  { title: 'Social Media', description: 'Meet size limits.', image: '/img/use-cases/portrait.jpg', alt: 'Portrait of a person holding wildflowers' },
  { title: 'E-commerce', description: 'Smaller product images.', image: '/img/use-cases/mug.jpg', alt: 'A printed ceramic mug on a wooden table' },
  { title: 'Documents', description: 'Smaller attachments.', image: '/img/use-cases/brand-books.jpg', alt: 'Books, notebooks and a phone on a work desk' },
  { title: 'Portfolio', description: 'High-quality visuals.', image: '/img/use-cases/camera.jpg', alt: 'A vintage film camera resting on piano keys' },
];

export function renderOptimizePage(): HTMLElement {
  document.title = 'Image Compressor: Reduce Image Size in Your Browser | thedroppic';
  setMetaDescription('Reduce image file size directly in your browser, no upload, no quality compromise. JPG, PNG, WebP, AVIF, TIFF, HEIC.');

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
        { icon: ICON.chartLineDown, title: 'Smaller file sizes', description: 'Reduce file size without losing visible quality.' },
        { icon: ICON.images, title: 'All major formats', description: 'JPG, PNG, WebP, AVIF, TIFF, HEIC and more.' },
        { icon: ICON.lightning, title: 'Fast & private', description: 'Optimized in seconds. Nothing is uploaded.' },
        { icon: ICON.slidersHorizontal, title: 'Simple controls', description: 'Choose quality, see the difference, and download.' },
      ],
      'accent-lavender',
    ),
  );

  wrap.appendChild(
    renderHowItWorks(
      'Three simple steps',
      'Optimize your images in seconds. All on your device.',
      [
        { icon: ICON.uploadSimple, title: 'Add your images', description: 'Choose or drop up to 5 files from your device.' },
        { icon: ICON.gearSix, title: 'Adjust (optional)', description: 'Choose Small, Medium, or Original.' },
        { icon: ICON.downloadSimple, title: 'Download', description: 'Get your optimized images instantly. No upload.' },
      ],
      'accent-lavender',
    ),
  );

  wrap.appendChild(renderUseCases());
  wrap.appendChild(renderToolFaq(OPTIMIZE_FAQ));
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
    <h1>Smaller files.<br /><span class="tool-hero__accent">Same quality.</span></h1>
    <p>Reduce image file size directly in your browser. No upload. Your images stay on your device.</p>
  `;
  return hero;
}

function renderUseCases(): HTMLElement {
  const cards = USE_CASES.map((u) => renderMediaCard(u));

  return renderScrollCard(
    'Optimize for what matters.',
    'Smaller images, bigger possibilities.',
    renderSwipeStack(cards, 'accent-lavender'),
    'accent-lavender',
  );
}

const OPTIMIZE_FAQ = [
  { question: 'Will this reduce the image quality?', answer: 'Small and Medium trade some visual quality for a smaller file; Original keeps quality as high as possible while still re-encoding.' },
  { question: 'Is my image uploaded to your server?', answer: 'No. Optimization runs entirely in your browser.' },
  { question: 'What formats are supported?', answer: 'JPG, PNG, WebP, AVIF, TIFF and HEIC. PNG and TIFF are lossless formats, so the compression level has limited effect on their size. The app tells you when that applies.' },
  { question: 'How much smaller will my file be?', answer: "It depends on the image and format. You'll see the exact before/after size and percentage saved for every result, never an estimate." },
  { question: 'Can I optimize multiple images at once?', answer: 'Yes, up to 5 at a time, each with its own compression level.' },
  { question: 'Is it really free to use?', answer: 'Yes, with no limits on how many times you use it.' },
];

function setMetaDescription(text: string): void {
  const el = document.querySelector('meta[name="description"]');
  if (el) el.setAttribute('content', text);
}
