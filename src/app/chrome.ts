import { navigate, pathForRoute, type PageRoute, type Route } from './router';
import { logoMarkup } from './logo';

/**
 * Renders the app shell (header + footer + #view-root) once at startup.
 * Individual pages only ever touch #view-root, see app.ts. The nav is flat on
 * purpose: the three converters are the product, so each one is a top-level link.
 */
const CONVERTER_ROUTES = new Set<Route>(['jpeg-to-png', 'png-to-jpeg', 'heic-to-jpeg', 'webp-to-jpeg', 'webp-to-png', 'jpeg-to-webp', 'png-to-webp']);

/** The nav is three links: Convert (opens the first converter tab), Blog and About. */
const NAV_ITEMS: Array<{ route: PageRoute; label: string }> = [
  { route: 'jpeg-to-png', label: 'Convert' },
  { route: 'blog', label: 'Blog' },
  { route: 'about', label: 'About' },
];

const navLink = (item: { route: PageRoute; label: string }): string =>
  `<a href="${pathForRoute(item.route)}" data-route="${item.route}">${item.label}</a>`;

export function mountChrome(root: HTMLElement): { viewRoot: HTMLElement } {
  root.innerHTML = `
    <a class="skip-link" href="#main">Skip to content</a>
    <div class="app-shell">
      <header class="site-header">
        <div class="container site-header__bar">
          <a href="/" class="brand" aria-label="thedroppic home">${logoMarkup('brand__logo')}</a>
          <nav class="site-header__nav" id="site-header-nav" aria-label="Primary">
            ${NAV_ITEMS.map(navLink).join('')}
          </nav>
          <div class="site-header__end">
            <button type="button" class="mobile-nav-toggle" id="mobile-nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav-panel">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="square"/></svg>
            </button>
          </div>
        </div>
        <div class="mobile-nav-panel" id="mobile-nav-panel" hidden>
          ${NAV_ITEMS.map(navLink).join('')}
        </div>
      </header>
      <main id="main" class="app-main">
        <div class="container" id="view-root"></div>
      </main>
      <footer class="site-footer">
        <div class="container site-footer__bar">
          <p>&copy; ${new Date().getFullYear()} thedroppic</p>
          <p class="site-footer__tagline">Free. Private. In your browser.</p>
          <ul class="site-footer__links">
            <li><a href="${pathForRoute('about')}">About</a></li>
            <li><a href="${pathForRoute('blog')}">Blog</a></li>
            <li><a href="${pathForRoute('about')}#privacy">Privacy</a></li>
          </ul>
        </div>
      </footer>
    </div>
  `;

  const mobileToggle = root.querySelector<HTMLButtonElement>('#mobile-nav-toggle')!;
  const mobilePanel = root.querySelector<HTMLElement>('#mobile-nav-panel')!;
  const setMenu = (open: boolean): void => {
    mobilePanel.hidden = !open;
    mobileToggle.setAttribute('aria-expanded', String(open));
    mobileToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  mobileToggle.addEventListener('click', () => setMenu(mobilePanel.hidden));
  mobilePanel.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !mobilePanel.hidden) {
      setMenu(false);
      mobileToggle.focus();
    }
  });

  const viewRoot = root.querySelector<HTMLElement>('#view-root')!;
  return { viewRoot };
}

/** Which top-level nav item a route belongs to (articles live under Blog, converters under Convert). */
function navRouteFor(route: Route): Route | null {
  if (route === 'article-formats' || route === 'article-browser-processing') return 'blog';
  // All three converter tabs live under the single "Convert" nav item.
  if (CONVERTER_ROUTES.has(route)) return 'jpeg-to-png';
  return route;
}

/** Marks the current page in the nav and tags the shell with the route so CSS can lay out the home page differently. */
export function setActiveNavRoute(root: HTMLElement, route: Route): void {
  root.querySelector<HTMLElement>('.app-shell')?.setAttribute('data-route', route);
  const active = navRouteFor(route);
  root.querySelectorAll<HTMLAnchorElement>('.site-header__nav a, .mobile-nav-panel a').forEach((a) => {
    if (a.dataset.route === active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

/** Small helper so page modules can navigate without importing the router directly everywhere. */
export function goTo(route: PageRoute): void {
  navigate(route);
}
