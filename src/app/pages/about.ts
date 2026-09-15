import { renderHowItWorks, renderCtaBand, renderScrollCard } from '../sections';
import { renderAboutVisual } from '../about-visual';
import { navigate, pathForRoute, type Route } from '../router';

const ICON_CONVERT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M17 2.5 21 6.5m0 0-4 4m4-4H8a5 5 0 0 0-5 5" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 21.5 3 17.5m0 0 4-4m-4 4h13a5 5 0 0 0 5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_CUTOUT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-dasharray="3 3" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="m9 15 3-4 2 2.5L17 9" stroke-dasharray="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_OPTIMIZE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M4 4v6h6M20 20v-6h-6" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 10a8 8 0 0 0-14.3-4.3M4 14a8 8 0 0 0 14.3 4.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_IMAGES = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><rect x="3" y="5" width="14" height="14" rx="2"/><path d="m7 15 3-4 2.5 3L15 11l4 5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_GEAR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>`;
const ICON_DOWNLOAD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M4 15.5V17a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 4v11m0 0-4-4m4 4 4-4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_UPLOAD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M4 15.5V17a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 15V4m0 0-4 4m4-4 4 4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_SHIELD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M12 3 4.5 6v6c0 4.5 3.2 7.7 7.5 9 4.3-1.3 7.5-4.5 7.5-9V6L12 3Z" stroke-linejoin="round"/><path d="m9 12 2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

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
    icon: ICON_CONVERT,
    title: 'Convert Images',
    description: 'Convert images between popular formats quickly and easily, without requiring desktop software.',
    cta: 'Convert Images',
  },
  {
    route: 'remove-background',
    accent: 'accent-mint',
    icon: ICON_CUTOUT,
    title: 'Remove Backgrounds',
    description: 'Create clean, transparent image cutouts directly in your browser.',
    cta: 'Remove Backgrounds',
  },
  {
    route: 'optimize',
    accent: 'accent-lavender',
    icon: ICON_OPTIMIZE,
    title: 'Optimize Image Files',
    description: 'Reduce image file sizes while keeping your images useful for everyday sharing, websites, and projects.',
    cta: 'Optimize Images',
  },
];

export function renderAboutPage(): HTMLElement {
  document.title = 'About thedroppic — Private, Browser-Based Image Tools';
  setMetaDescription(
    'thedroppic was built to make everyday image tasks faster, simpler, and more private — converting, removing backgrounds, and optimizing images entirely in your browser.',
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
        { title: 'Drop your images', description: 'Choose or drop the files you need to work with.', icon: ICON_UPLOAD },
        { title: 'Choose what you need', description: 'Pick a tool — convert, remove background, or optimize.', icon: ICON_GEAR },
        { title: 'Process them', description: 'Your browser does the work. Nothing is uploaded.', icon: ICON_SHIELD },
        { title: 'Download the result', description: 'Get exactly what you need, instantly.', icon: ICON_DOWNLOAD },
      ],
      'accent-brand',
    ),
  );
  wrap.appendChild(renderEverydayUse());
  wrap.appendChild(
    renderCtaBand(
      'Ready to work with your images?',
      'Choose a tool and get started.',
      'Choose Images',
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
      <span class="eyebrow">ABOUT THEDROPPIC</span>
      <h1>Simple image tools, built with privacy in mind.</h1>
      <p>Working with images shouldn't always mean installing heavy software, creating an account, or uploading your files to another server.</p>
    </div>
  `;
  hero.appendChild(renderAboutVisual());
  return hero;
}

function renderIntro(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'section about-intro';
  section.innerHTML = `
    <h2>Why thedroppic?</h2>
    <p>thedroppic was created to make everyday image tasks faster, simpler, and more private. It brings together a few useful tools that you can access directly from your browser — without unnecessary complexity.</p>
    <p>Most image tools are built around uploading your files to a server. While that can be convenient, it isn't always necessary for simple tasks. thedroppic takes a different approach: our tools are designed to process images directly in your browser, so your files can stay on your device instead of being sent to a remote server.</p>
  `;

  const callout = document.createElement('p');
  callout.className = 'about-callout';
  callout.innerHTML = `${ICON_SHIELD}<span>Runs 100% in your browser. Nothing is uploaded.</span>`;
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
      <span class="icon-badge tool-card__icon">${tool.icon}</span>
      <h3></h3>
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
    <p>Privacy isn't an extra feature we added later. It's part of how thedroppic is designed. Whenever possible, image processing happens locally in your browser — your images can be processed without ever leaving your device.</p>
    <p>Whether you're working with personal photos, product images, design assets, or files for your next project, you stay in control.</p>
    <p class="about-privacy__highlight">Your images. Your device. Your control.</p>
  `;
  return renderScrollCard('PRIVACY', 'Your images belong to you.', '', content, 'accent-brand');
}

function renderEverydayUse(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'section about-everyday';
  section.innerHTML = `
    <span class="icon-badge about-everyday__icon">${ICON_IMAGES}</span>
    <h2>Built for everyday use.</h2>
    <p>thedroppic is for anyone who occasionally needs to work with images without opening complicated editing software. Whether you're preparing images for a website, optimizing files before sending them, converting formats for a project, or removing a background from a product photo — the goal is the same: make the task easier.</p>
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
