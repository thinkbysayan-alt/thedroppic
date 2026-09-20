import { renderHowItWorks, renderCtaBand, renderScrollCard } from '../sections';
import { ICON } from '../icons';
import { navigate, pathForRoute, type Route } from '../router';


interface ToolInfo {
  route: Route;
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
    description: 'Convert images between popular formats quickly and easily, without requiring desktop software.',
    cta: 'Convert Images',
  },
  {
    route: 'remove-background',
    accent: 'accent-mint',
    icon: ICON.scissors,
    title: 'Remove Backgrounds',
    description: 'Create clean, transparent image cutouts directly in your browser.',
    cta: 'Remove Backgrounds',
  },
  {
    route: 'optimize',
    accent: 'accent-lavender',
    icon: ICON.arrowsInLineVertical,
    title: 'Optimize Image Files',
    description: 'Reduce image file sizes while keeping your images useful for everyday sharing, websites, and projects.',
    cta: 'Optimize Images',
  },
];

export function renderAboutPage(): HTMLElement {
  document.title = 'About thedroppic: Private, Browser-Based Image Tools';
  setMetaDescription(
    'thedroppic was built to make everyday image tasks faster, simpler, and more private: converting, removing backgrounds, and optimizing images entirely in your browser.',
  );

  const wrap = document.createElement('div');
  wrap.appendChild(renderHero());
  wrap.appendChild(renderIntro());
  wrap.appendChild(renderToolsSection());
  wrap.appendChild(renderPrivacySection());
  wrap.appendChild(
    renderHowItWorks(
      'Designed to stay simple.',
      "We don't believe an image utility needs dozens of complicated controls. No account. No complicated setup. No unnecessary distractions.",
      [
        { icon: ICON.uploadSimple, title: 'Drop your images', description: 'Choose or drop the files you need to work with.' },
        { icon: ICON.slidersHorizontal, title: 'Choose what you need', description: 'Pick a tool: convert, remove background, or optimize.' },
        { icon: ICON.shieldCheck, title: 'Process them', description: 'Your browser does the work. Nothing is uploaded.' },
        { icon: ICON.downloadSimple, title: 'Download the result', description: 'Get exactly what you need, instantly.' },
      ],
      'accent-brand',
    ),
  );
  wrap.appendChild(renderEverydayUse());
  wrap.appendChild(
    renderCtaBand(
      'Ready to work with your images?',
      'Choose a tool and get started.',
      'Choose images',
      'No account. No upload. Runs 100% in your browser.',
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
      <p>Working with images shouldn't always mean installing heavy software, creating an account, or uploading your files to another server.</p>
    </div>
  `;
  return hero;
}

function renderIntro(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'section about-intro';
  section.innerHTML = `
    <h2>Why thedroppic?</h2>
    <p>thedroppic was created to make everyday image tasks faster, simpler, and more private. It brings together a few useful tools that you can access directly from your browser, without unnecessary complexity.</p>
    <p>Most image tools are built around uploading your files to a server. While that can be convenient, it isn't always necessary for simple tasks. thedroppic takes a different approach: our tools are designed to process images directly in your browser, so your files can stay on your device instead of being sent to a remote server.</p>
  `;

  const callout = document.createElement('p');
  callout.className = 'about-callout';
  callout.textContent = 'Runs 100% in your browser. Nothing is uploaded.';
  section.appendChild(callout);

  return section;
}

function renderToolsSection(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'section about-tools';
  section.innerHTML = `<h2>What can you do with thedroppic?</h2><p class="section-sub">thedroppic focuses on three everyday image tasks.</p>`;

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
    <p>Privacy isn't an extra feature we added later. It's part of how thedroppic is designed. Whenever possible, image processing happens locally in your browser. Your images can be processed without ever leaving your device.</p>
    <p>Whether you're working with personal photos, product images, design assets, or files for your next project, you stay in control.</p>
    <p class="about-privacy__highlight">Your images. Your device. Your control.</p>
  `;
  return renderScrollCard('Your images belong to you.', '', content, 'accent-brand');
}

function renderEverydayUse(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'section about-everyday';
  section.innerHTML = `
    <h2>Built for everyday use.</h2>
    <p>thedroppic is for anyone who occasionally needs to work with images without opening complicated editing software. Whether you're preparing images for a website, optimizing files before sending them, converting formats for a project, or removing a background from a product photo, the goal is the same: make the task easier.</p>
  `;
  return section;
}

function renderToolLinksRow(): HTMLElement {
  const row = document.createElement('div');
  row.className = 'about-cta-links';
  TOOLS.forEach((tool) => {
    const link = document.createElement('a');
    link.href = pathForRoute(tool.route);
    link.className = 'btn btn-secondary';
    link.textContent = tool.title;
    row.appendChild(link);
  });
  return row;
}

function setMetaDescription(text: string): void {
  const el = document.querySelector('meta[name="description"]');
  if (el) el.setAttribute('content', text);
}
