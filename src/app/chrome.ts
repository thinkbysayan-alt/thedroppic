import { navigate, pathForRoute, type PageRoute, type Route } from './router';
import { ICON } from './icons';
import { getTheme, toggleTheme } from './theme';

/**
 * Renders the app shell (header + footer + #view-root) once at startup.
 * Individual pages only ever touch #view-root — see app.ts. Logo mark and
 * brand color are the established TheDropPic identity (see variables.css)
 * and are never touched by per-tool theming.
 */
export function mountChrome(root: HTMLElement): { viewRoot: HTMLElement } {
  root.innerHTML = `
    <a class="skip-link" href="#main">Skip to content</a>
    <div class="app-shell">
      <header class="site-header">
        <div class="container site-header__bar">
          <a href="/" class="brand" aria-label="thedroppic home">
            <span class="brand__mark" aria-hidden="true">
              <svg width="30" height="30" viewBox="0 0 32 32">
                <rect x="3" y="11" width="17" height="17" rx="5.5" fill="#2563ff" />
                <rect x="12" y="4" width="17" height="17" rx="5.5" fill="#3bb2f6" fill-opacity="0.92" />
              </svg>
            </span>
            <span>the<span class="brand__word-accent">droppic</span></span>
          </a>
          <nav class="site-header__nav" id="site-header-nav" aria-label="Primary">
            <div class="nav-dropdown">
              <button type="button" class="nav-dropdown__trigger" aria-haspopup="true" aria-expanded="false">
                Tools
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="m5 7.5 5 5 5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
              <div class="nav-dropdown__menu" role="menu">
                <a href="${pathForRoute('convert')}" role="menuitem">Convert Images</a>
                <a href="${pathForRoute('remove-background')}" role="menuitem">Remove Background</a>
                <a href="${pathForRoute('optimize')}" role="menuitem">Optimize / Compress</a>
              </div>
            </div>
            <a href="${pathForRoute('learn')}">Learn</a>
            <a href="${pathForRoute('about')}">About</a>
          </nav>
          <div class="site-header__actions">
            <button type="button" class="theme-toggle" id="theme-toggle" aria-pressed="false" aria-label="Dark mode">
              <span class="theme-toggle__moon" aria-hidden="true">${ICON.moon}</span>
              <span class="theme-toggle__sun" aria-hidden="true">${ICON.sun}</span>
            </button>
            <a href="/#upload" class="btn btn-primary btn-sm site-header__cta">Choose images</a>
            <button type="button" class="mobile-nav-toggle" id="mobile-nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav-panel">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>
        <div class="mobile-nav-panel" id="mobile-nav-panel" hidden>
          <a href="${pathForRoute('convert')}">Convert Images</a>
          <a href="${pathForRoute('remove-background')}">Remove Background</a>
          <a href="${pathForRoute('optimize')}">Optimize / Compress</a>
          <a href="${pathForRoute('learn')}">Learn</a>
          <a href="${pathForRoute('about')}">About</a>
          <a href="/#upload" class="btn btn-primary btn-block">Choose images</a>
        </div>
      </header>
      <main id="main" class="app-main">
        <div class="container" id="view-root"></div>
      </main>
      <footer class="site-footer">
        <div class="container">
          <p class="site-footer__brand">the<span class="brand__word-accent">droppic</span></p>
          <p class="site-footer__tagline">Private image tools that run in your browser.</p>
          <ul class="site-footer__links">
            <li><a href="${pathForRoute('convert')}">Convert images</a></li>
            <li><a href="${pathForRoute('remove-background')}">Remove background</a></li>
            <li><a href="${pathForRoute('optimize')}">Compress images</a></li>
            <li><a href="${pathForRoute('learn')}">Learn</a></li>
            <li><a href="${pathForRoute('about')}">About</a></li>
            <li><a href="${pathForRoute('about')}#privacy">Privacy</a></li>
          </ul>
          <p>&copy; ${new Date().getFullYear()} thedroppic</p>
        </div>
      </footer>
    </div>
  `;

  // Tap/click-to-toggle dropdown (also works via CSS :hover on desktop — see components.css).
  const dropdown = root.querySelector<HTMLElement>('.nav-dropdown')!;
  const trigger = dropdown.querySelector<HTMLButtonElement>('.nav-dropdown__trigger')!;
  trigger.addEventListener('click', () => {
    const open = dropdown.classList.toggle('is-open');
    trigger.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target as Node)) {
      dropdown.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    }
  });

  const themeToggle = root.querySelector<HTMLButtonElement>('#theme-toggle')!;
  const syncThemeToggle = (): void => {
    const dark = getTheme() === 'dark';
    themeToggle.setAttribute('aria-pressed', String(dark));
    themeToggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  };
  syncThemeToggle();
  themeToggle.addEventListener('click', () => {
    toggleTheme();
    syncThemeToggle();
  });

  const mobileToggle = root.querySelector<HTMLButtonElement>('#mobile-nav-toggle')!;
  const mobilePanel = root.querySelector<HTMLElement>('#mobile-nav-panel')!;
  mobileToggle.addEventListener('click', () => {
    const open = mobilePanel.hidden;
    mobilePanel.hidden = !open;
    mobileToggle.setAttribute('aria-expanded', String(open));
  });
  mobilePanel.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      mobilePanel.hidden = true;
      mobileToggle.setAttribute('aria-expanded', 'false');
    }),
  );

  const viewRoot = root.querySelector<HTMLElement>('#view-root')!;
  return { viewRoot };
}

export function setActiveNavRoute(root: HTMLElement, route: Route): void {
  root.querySelectorAll<HTMLAnchorElement>('.nav-dropdown__menu a').forEach((a) => {
    a.classList.toggle('is-active', route !== 'not-found' && a.getAttribute('href') === pathForRoute(route));
  });
}

/** Small helper so page modules can navigate without importing the router directly everywhere. */
export function goTo(route: PageRoute): void {
  navigate(route);
}
