import { renderHowItWorks, renderCtaBand, renderScrollCard } from '../sections';
import { ICON } from '../icons';
import { navigate, pathForRoute, type PageRoute } from '../router';

interface ToolInfo {
  route: PageRoute;
  accent: string;
  icon: string;
  title: string;
  description: string;
  cta: string;
}

const TOOLS: ToolInfo[] = [
  {
    route: 'convert',
    accent: 'accent-blue',
    icon: ICON.arrowsLeftRight,
    title: 'Convert Images',
    description: 'Convert images between JPG, PNG, WebP, AVIF, TIFF and HEIC.',
    cta: 'Convert images',
  },
  {
    route: 'remove-background',
    accent: 'accent-mint',
    icon: ICON.scissors,
    title: 'Remove Backgrounds',
    description: 'Cut out a subject and download a transparent PNG.',
    cta: 'Remove a background',
  },
  {
    route: 'optimize',
    accent: 'accent-lavender',
    icon: ICON.arrowsInLineVertical,
    title: 'Optimize Image Files',
    description: 'Reduce file size and see the exact before and after.',
    cta: 'Compress images',
  },
];

export function renderAboutPage(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.appendChild(renderHero());
  wrap.appendChild(renderIntro());
  wrap.appendChild(renderToolsSection());
  wrap.appendChild(renderPrivacySection());
  wrap.appendChild(
    renderHowItWorks(
      'How it works',
      'No account and no setup.',
      [
        { icon: ICON.uploadSimple, title: 'Drop your images', description: 'Choose or drop up to 5 files.' },
        { icon: ICON.slidersHorizontal, title: 'Pick a tool', description: 'Convert, remove a background or compress.' },
        { icon: ICON.shieldCheck, title: 'Your browser does the work', description: 'Nothing is uploaded.' },
        { icon: ICON.downloadSimple, title: 'Download the result', description: 'Save each file when it is ready.' },
      ],
      'accent-brand',
    ),
  );
  wrap.appendChild(renderEverydayUse());
  wrap.appendChild(
    renderCtaBand(
      'Try a tool',
      '',
      'Choose images',
      'No account. No upload.',
      'accent-brand',
      () => navigate('convert'),
    ),
  );
  wrap.appendChild(renderToolLinksRow());

  return wrap;
}

function renderHero(): HTMLElement {
  const hero = document.createElement('section');
  hero.className = 'about-hero';
  hero.innerHTML = `
    <div class="about-hero__copy">
      <h1>Simple image tools, built with privacy in mind.</h1>
      <p>Working with images should not mean installing software, creating an account or uploading files to a server.</p>
    </div>
  `;
  return hero;
}

function renderIntro(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'section about-intro';
  section.innerHTML = `
    <h2>Why thedroppic exists</h2>
    <p>Most image tools upload your files to a server. For simple tasks, that is often not needed.</p>
    <p>thedroppic does the work in your browser instead. Your files stay on your device.</p>
  `;

  const callout = document.createElement('p');
  callout.className = 'about-callout';
  callout.textContent = 'Runs in your browser. Nothing is uploaded.';
  section.appendChild(callout);

  return section;
}

function renderToolsSection(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'section about-tools';
  section.innerHTML = `<h2>What thedroppic does</h2>`;

  const grid = document.createElement('div');
  grid.className = 'tool-cards';
  TOOLS.forEach((tool, index) => {
    const card = document.createElement('a');
    card.href = pathForRoute(tool.route);
    card.className = `tool-card ${tool.accent}`;
    card.setAttribute('data-reveal', '');
    card.style.setProperty('--reveal-delay', `${index * 100}ms`);
    card.innerHTML = `
      <div class="tool-card__head"><span class="icon-badge tool-card__icon">${tool.icon}</span><h3></h3></div>
      <p></p>
      <span class="tool-card__cta"></span>
    `;
    card.querySelector('h3')!.textContent = tool.title;
    card.querySelector('p')!.textContent = tool.description;
    card.querySelector('.tool-card__cta')!.textContent = `${tool.cta} →`;
    grid.appendChild(card);
  });
  section.appendChild(grid);

  return section;
}

function renderPrivacySection(): HTMLElement {
  const content = document.createElement('div');
  content.className = 'about-privacy__content';
  content.innerHTML = `
    <p>Image processing happens in your browser. Your images are not sent to a server.</p>
    <p>The background remover downloads an AI model once. That download contains none of your image data.</p>
    <p class="about-privacy__highlight">Your images. Your device. Your control.</p>
  `;
  const section = renderScrollCard('How your privacy is protected', '', content, 'accent-brand');
  section.id = 'privacy';
  return section;
}

function renderEverydayUse(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'section about-everyday';
  section.innerHTML = `
    <h2>Who it is for</h2>
    <p>Anyone who needs to work with an image without opening editing software. For example:</p>
    <ul class="about-list">
      <li>Preparing images for a website</li>
      <li>Shrinking files before sending them</li>
      <li>Converting formats for a project</li>
      <li>Removing the background from a product photo</li>
    </ul>
  `;
  return section;
}

function renderToolLinksRow(): HTMLElement {
  const row = document.createElement('div');
  row.className = 'about-cta-links';
  const links: Array<{ route: PageRoute; label: string }> = [
    ...TOOLS.map((t) => ({ route: t.route, label: t.title })),
    { route: 'learn', label: 'Read the guides' },
  ];
  links.forEach((item) => {
    const link = document.createElement('a');
    link.href = pathForRoute(item.route);
    link.className = 'btn btn-secondary';
    link.textContent = item.label;
    row.appendChild(link);
  });
  return row;
}
