/**
 * Minimal client-side router, matching the rest of this app's vanilla-TS
 * style. Each route maps to one page module that renders into the shared
 * shell's #view-root (see chrome.ts / app.ts). There are no dynamic routes:
 * each article is its own fixed named route, so this file stays a plain
 * lookup table.
 *
 * Uses the History API (real paths, not #hashes). Every route is also
 * prerendered to static HTML at build time (scripts/prerender.ts) and served
 * with `cleanUrls` (see vercel.json), so crawlers get real pages and unknown
 * URLs return a real 404.
 */
export type Route =
  | 'home'
  | 'convert'
  | 'remove-background'
  | 'optimize'
  | 'about'
  | 'learn'
  | 'article-formats'
  | 'article-browser-processing'
  | 'not-found';

/** Routes that exist as real, indexable pages. `not-found` is deliberately not one. */
export type PageRoute = Exclude<Route, 'not-found'>;

export const ROUTE_PATHS: Record<PageRoute, string> = {
  home: '/',
  convert: '/tools/convert',
  'remove-background': '/tools/remove-background',
  optimize: '/tools/optimize',
  about: '/about',
  learn: '/learn',
  'article-formats': '/learn/best-image-format',
  'article-browser-processing': '/learn/browser-based-image-processing',
};

const PATH_ROUTES: Record<string, PageRoute> = Object.fromEntries(
  (Object.entries(ROUTE_PATHS) as Array<[PageRoute, string]>).map(([route, path]) => [path, route]),
);

export function pathForRoute(route: PageRoute): string {
  return ROUTE_PATHS[route];
}

function normalizePath(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

export function routeForPath(pathname: string): Route {
  return PATH_ROUTES[normalizePath(pathname)] ?? 'not-found';
}

export function getCurrentRoute(): Route {
  return routeForPath(window.location.pathname);
}

type RouteListener = (route: Route) => void;
const listeners = new Set<RouteListener>();

function scrollToHash(hash: string): void {
  const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
  if (target) target.scrollIntoView({ block: 'start' });
  else window.scrollTo(0, 0);
}

/** Navigates to a route, pushing a new history entry, and notifies listeners. Scrolls to the `#hash` target, or to the top like a real page load. */
export function navigate(route: PageRoute, hash = ''): void {
  const path = pathForRoute(route) + hash;
  if (window.location.pathname + window.location.hash !== path) {
    window.history.pushState({}, '', path);
  }
  for (const listener of listeners) listener(route);
  scrollToHash(hash);
}

export function onRouteChange(listener: RouteListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Wires the browser back/forward buttons to the same listeners `navigate` notifies. Call once at startup. */
export function initRouter(): void {
  window.addEventListener('popstate', () => {
    for (const listener of listeners) listener(getCurrentRoute());
  });
}

/**
 * Intercepts clicks on same-origin, in-app `<a href="/...">` links so they
 * navigate via the router instead of a full page reload. Ignores modified
 * clicks (cmd/ctrl/shift/middle-click) so "open in new tab" keeps working.
 * A link to `#section` on the page you are already on is left to the browser.
 */
export function installLinkInterceptor(): void {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const anchor = (e.target as HTMLElement).closest('a');
    if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;
    if (anchor.target && anchor.target !== '_self') return;
    const href = anchor.getAttribute('href');
    if (!href || !href.startsWith('/') || href.startsWith('//')) return;
    const [pathPart = '', hashPart = ''] = href.split('#');
    const route = PATH_ROUTES[normalizePath(pathPart)];
    if (!route) return;
    const hash = hashPart ? `#${hashPart}` : '';
    if (getCurrentRoute() === route && hash) return; // same page: native anchor scroll
    e.preventDefault();
    navigate(route, hash);
  });
}
