import { createToolWorkspace } from '../tool-workspace';
import { ICON } from '../icons';
import { renderBreadcrumb, renderHowItWorks, renderCtaBand, renderToolFaq, renderScrollCard, renderSwipeStack, renderMediaCard } from '../sections';
import { renderFeatureCarousel } from '../feature-carousel';


const USE_CASES = [
  { title: 'E-commerce', description: 'Product photos ready for your store.', image: '/img/use-cases/mug.jpg', alt: 'A printed ceramic mug on a wooden table' },
  { title: 'Social Media', description: 'Stand out with clean visuals.', image: '/img/use-cases/portrait.jpg', alt: 'Portrait of a person holding wildflowers' },
  { title: 'Design Projects', description: 'Use in presentations, mockups and more.', image: '/img/use-cases/design-desk.jpg', alt: 'A designer desk with monitor, tablet and keyboard' },
  { title: 'Personal Photos', description: 'Make memories more creative.', image: '/img/use-cases/puppy.jpg', alt: 'A black puppy looking up at the camera' },
  { title: 'Logos & Graphics', description: 'Isolate elements with ease.', image: '/img/use-cases/brand-books.jpg', alt: 'A brand identity book open on a desk' },
];

export function renderRemoveBackgroundPage(): HTMLElement {
  document.title = 'AI Background Remover: No Upload, Runs in Your Browser | thedroppic';
  setMetaDescription('Remove image backgrounds with AI, entirely in your browser. Clean, professional cutouts: nothing is uploaded.');

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
        { icon: ICON.magicWand, title: 'AI-Powered Cutouts', description: 'Get clean, accurate results for people, products, pets and more.' },
        { icon: ICON.lockKey, title: 'Completely Private', description: 'Everything runs locally in your browser. Nothing is uploaded.' },
        { icon: ICON.lightning, title: 'Fast & Simple', description: 'Remove backgrounds in seconds. No queues, no hassle.' },
        { icon: ICON.crop, title: 'Crop Your Result', description: 'Square-crop the cutout in-app if you need one.' },
      ],
      'accent-mint',
    ),
  );

  wrap.appendChild(
    renderHowItWorks(
      'Three simple steps',
      'Remove backgrounds in seconds. All on your device.',
      [
        { icon: ICON.uploadSimple, title: 'Add your image', description: 'Choose or drop up to 5 images from your device.' },
        { icon: ICON.cpu, title: 'AI processes locally', description: 'Your browser removes the background using an on-device model.' },
        { icon: ICON.downloadSimple, title: 'Download', description: 'Get your transparent image instantly. No upload.' },
      ],
      'accent-mint',
    ),
  );

  wrap.appendChild(renderUseCases());
  wrap.appendChild(renderToolFaq(BG_FAQ));
  wrap.appendChild(
    renderCtaBand(
      'Ready to remove a background?',
      '',
      'Choose images',
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
    <h1>Remove backgrounds<br /><span class="tool-hero__accent">in seconds.</span></h1>
    <p>Get clean, professional cutouts with AI, directly in your browser. Nothing is uploaded. Your images stay on your device.</p>
    <p class="tool-hero__note">Works best on people and portraits. The on-device model is trained for portrait subjects, so results on other objects may vary.</p>
  `;
  return hero;
}

function renderUseCases(): HTMLElement {
  const cards = USE_CASES.map((u) => renderMediaCard(u));

  return renderScrollCard(
    'Perfect for every use case',
    'Create clean, transparent images for your projects.',
    renderSwipeStack(cards, 'accent-mint'),
    'accent-mint',
  );
}

const BG_FAQ = [
  { question: 'Is my image uploaded to your server?', answer: 'No. Background removal runs entirely in your browser using an on-device AI model.' },
  { question: 'Is the result high quality?', answer: 'The model produces a soft alpha matte (not a hard cutout), so edges and hair blend naturally instead of looking like a sticker.' },
  { question: 'How many images can I process at once?', answer: 'Up to 5 images at a time, each processed independently.' },
  { question: 'Can I edit the cutout after removal?', answer: 'You can crop the result to a square. Fine-grained erase/restore brush editing is not available yet.' },
  { question: 'What image formats are supported?', answer: 'Upload JPG, PNG, WebP, AVIF, TIFF or HEIC. The result always downloads as a transparent PNG.' },
  { question: 'Is it really free to use?', answer: 'Yes, with no limits on how many times you use it.' },
];

function setMetaDescription(text: string): void {
  const el = document.querySelector('meta[name="description"]');
  if (el) el.setAttribute('content', text);
}
