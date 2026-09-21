import { renderRelatedLinks } from '../sections';

/** Shown for any URL that is not a real page. The host also serves it with a 404 status (see vercel.json and scripts/prerender.ts). */
export function renderNotFoundPage(): HTMLElement {
  const wrap = document.createElement('div');

  const hero = document.createElement('section');
  hero.className = 'tool-hero accent-blue';
  hero.innerHTML = `
    <h1>Page not found</h1>
    <p>This page does not exist. Open one of the tools instead.</p>
  `;
  wrap.appendChild(hero);

  wrap.appendChild(
    renderRelatedLinks('Open a tool', [
      { route: 'convert', label: 'Convert images', description: 'Change the format of JPG, PNG, WebP, AVIF, TIFF and HEIC files.' },
      { route: 'remove-background', label: 'Remove image backgrounds', description: 'Get a transparent PNG cutout with AI.' },
      { route: 'optimize', label: 'Compress images', description: 'Reduce file size in your browser.' },
      { route: 'home', label: 'Go to the home page', description: 'See everything thedroppic offers.' },
    ]),
  );
  return wrap;
}
