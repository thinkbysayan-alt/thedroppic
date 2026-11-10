import { TOOL_LINKS } from '../tools';
import { renderArt, renderToolLinks } from '../sections';

/** Shown for any URL that is not a real page. The host also serves it with a 404 status (see vercel.json and scripts/prerender.mjs). */
export function renderNotFoundPage(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'not-found';

  const head = document.createElement('section');
  head.className = 'page-head';
  head.innerHTML = `
    <div>
      <h1 class="page-head__title">Page not found</h1>
      <div class="pas"><p class="pas__problem">That page isn't here.</p><p class="pas__solution">Pick a converter below and you're one click from done.</p></div>
    </div>
  `;
  head.appendChild(renderArt({ src: '/art/not-found.svg', alt: '', width: 800, height: 800, className: 'page-head__art' }));
  wrap.appendChild(head);

  wrap.appendChild(
    renderToolLinks(TOOL_LINKS),
  );
  return wrap;
}
