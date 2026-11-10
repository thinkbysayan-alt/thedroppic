import { pathForRoute } from '../router';
import { renderArt } from '../sections';

/**
 * The home page, from the Figma design: a two-part headline (the problem in
 * bold, the line under it light), one line of copy, a single call to action
 * and a wide scanline image bleeding off the right edge. Never scrolls on
 * desktop (see .home in site.css).
 */
export function renderHomePage(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'home';

  const copy = document.createElement('div');
  copy.className = 'home__copy';
  copy.innerHTML = `
    <h1 class="home__title"><strong>HEIC? JPEG? PNG?</strong> Your photo is having an identity crisis.</h1>
    <p class="home__text">Sort it out in seconds, right in your browser. Free, and your photo stays with you the whole time.</p>
    <a class="home__cta" href="${pathForRoute('jpeg-to-png')}">
      <span>Fix My Photo</span>
      <svg viewBox="0 0 40 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M2 12h34M26 3l10 9-10 9" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </a>
  `;
  section.appendChild(copy);

  const art = document.createElement('div');
  art.className = 'home__art';
  art.appendChild(
    renderArt({
      src: '/art/hero.svg',
      alt: 'Glitch line drawing of an image icon',
      width: 1250,
      height: 1000,
      priority: true,
    }),
  );
  section.appendChild(art);

  return section;
}
