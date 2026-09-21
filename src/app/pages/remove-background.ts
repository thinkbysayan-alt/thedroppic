import { createToolWorkspace } from '../tool-workspace';
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
  { title: 'E-commerce', description: 'Clean product photos for your store.', image: '/img/use-cases/mug.jpg', alt: 'A printed ceramic mug on a wooden table' },
  { title: 'Social Media', description: 'Cutouts for posts and profile images.', image: '/img/use-cases/portrait.jpg', alt: 'Portrait of a person holding wildflowers' },
  { title: 'Design Projects', description: 'Use subjects in slides and mockups.', image: '/img/use-cases/design-desk.jpg', alt: 'A designer desk with monitor, tablet and keyboard' },
  { title: 'Personal Photos', description: 'Turn snapshots into collages and stickers.', image: '/img/use-cases/puppy.jpg', alt: 'A black puppy looking up at the camera' },
  { title: 'Logos & Graphics', description: 'Isolate an object from its background.', image: '/img/use-cases/brand-books.jpg', alt: 'A brand identity book open on a desk' },
];

export function renderRemoveBackgroundPage(): HTMLElement {
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
        { icon: ICON.magicWand, title: 'AI cutouts', description: 'Works on people, products and pets.' },
        { icon: ICON.lockKey, title: 'Private', description: 'Your image stays on your device.' },
        { icon: ICON.lightning, title: 'No upload wait', description: 'Processing runs on your own device.' },
        { icon: ICON.crop, title: 'Square crop', description: 'Crop the cutout in the app if you need to.' },
      ],
      'accent-mint',
      'Why use the background remover',
    ),
  );

  wrap.appendChild(
    renderHowItWorks(
      'How to remove a background',
      '',
      [
        { icon: ICON.uploadSimple, title: 'Add your image', description: 'Choose or drop up to 5 images.' },
        { icon: ICON.cpu, title: 'AI removes the background', description: 'A model running in your browser finds the subject.' },
        { icon: ICON.downloadSimple, title: 'Download', description: 'Save a transparent PNG.' },
      ],
      'accent-mint',
    ),
  );

  wrap.appendChild(renderUseCases());
  wrap.appendChild(renderToolFaq(BG_FAQ, 'Background remover questions'));
  wrap.appendChild(
    renderRelatedLinks('Related tools and guides', [
      { route: 'optimize', label: 'Compress images', description: 'Make a large PNG cutout smaller.' },
      { route: 'convert', label: 'Convert image formats', description: 'Change the format of any image.' },
      { route: 'article-formats', label: 'Which image format should you use?', description: 'Learn when PNG and its transparency are the right choice.' },
    ]),
  );
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
    <h1>Remove image backgrounds <br /><span class="tool-hero__accent">with AI, in your browser.</span></h1>
    <p>Get a transparent PNG cutout. Nothing is uploaded.</p>
    <p class="tool-hero__note">Works best on people and portraits. Results on other subjects may vary.</p>
  `;
  return hero;
}

function renderUseCases(): HTMLElement {
  const cards = USE_CASES.map((u) => renderMediaCard(u));

  return renderScrollCard(
    'Common uses for cutouts',
    'Transparent images for stores, posts and design work.',
    renderSwipeStack(cards, 'accent-mint'),
    'accent-mint',
  );
}

const BG_FAQ = [
  { question: 'Is my image uploaded?', answer: 'No. The AI model runs in your browser. Your image never leaves your device.' },
  { question: 'Why is the first cutout slower?', answer: 'The AI model is a large one-time download that your browser keeps. After that, cutouts start faster.' },
  { question: 'How good are the results?', answer: 'Edges are soft, so hair and fine detail blend in. Results are best on people and portraits and vary on other subjects.' },
  { question: 'How many images can I process at once?', answer: 'Up to 5. Each one is processed separately.' },
  { question: 'Can I edit the cutout?', answer: 'You can crop it to a square. There is no brush for touching up edges yet.' },
  { question: 'Which formats can I use?', answer: 'Upload JPG, PNG, WebP, AVIF, TIFF or HEIC. The result downloads as a transparent PNG.' },
  { question: 'Is it free?', answer: 'Yes. There is no limit on how often you use it.' },
];
