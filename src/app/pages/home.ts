import { pathForRoute } from '../router';
import { renderCharacter, trackEyes } from '../character';
import { trackHair } from '../hair';
import { trackBubble } from '../bubble';

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
    <h1 class="home__title"><strong>Wrong format?</strong> Not for long.</h1>
    <p class="home__lead">Drop in the picture that won't cooperate. Get back the one you actually needed.</p>
    <p class="home__text">JPG, PNG, WebP, HEIC, and background removal too. It all happens right here in your browser, in about the time it takes to blink.</p>
    <div class="home__actions">
      <a class="home__cta" href="${pathForRoute('jpeg-to-png')}">
        <span>Fix my photo</span>
        <svg viewBox="0 0 40 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M2 12h34M26 3l10 9-10 9" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>
      <a class="home__cta home__cta--ghost" href="${pathForRoute('remove-background')}"><span>Ditch the background</span></a>
    </div>
  `;
  section.appendChild(copy);

  const art = document.createElement('div');
  art.className = 'home__art';
  const character = renderCharacter();
  art.appendChild(character);
  const bubble = document.createElement('p');
  bubble.className = 'home__bubble';
  bubble.textContent = "Go on, drop it. I don't bite.";
  art.appendChild(bubble);
  trackBubble(bubble);
  section.appendChild(art);
  trackEyes(character);
  trackHair(character);

  return section;
}
