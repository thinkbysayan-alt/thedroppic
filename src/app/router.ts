/**
 * Minimal client-side router — no framework, matches the rest of this app's
 * vanilla-TS style. Four routes total; each maps to one page module that
 * renders into the shared shell's #view-root (see chrome.ts / app.ts).
 *
 * Uses the History API (real paths, not #hashes) so links look like
 * `/tools/convert` — this needs a host-level rewrite so refreshing a
 * sub-route doesn't 404 on a static host; see vercel.json's `rewrites`.
 */
export type Route = 'home' | 'convert' | 'remove-background' | 'optimize';

const ROUTE_PATHS: Record<Route, string> = {
  home: '/',
  convert: '/tools/convert',
  'remove-background': '/tools/remove-background',
  optimize: '/tools/optimize',
};

const PATH_ROUTES: Record<string, Route> = {
  '/': 'home',
  '/tools/convert': 'convert',
  '/tools/remove-background': 'remove-background',
  '/tools/optimize': 'optimize',
};

export function pathForRoute(route: Route): string {
  return ROUTE_PATHS[route];
}

export function getCurrentRoute(): Route {
  return PATH_ROUTES[window.location.pathname] ?? 'home';
}

type RouteListener = (route: Route) => void;
const listeners = new Set<RouteListener>();

/** Navigates to a route, pushing a new history entry, and notifies listeners. Scrolls to top like a real page load. */
export function navigate(route: Route): void {
  const path = pathForRoute(route);
  if (window.location.pathname !== path) {
    window.history.pushState({}, '', path);
  }
  window.scrollTo(0, 0);
  for (const listener of listeners) listener(route);
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
 * navigate via the router instead of a full page reload — attach once on
 * the document. Ignores modified clicks (cmd/ctrl/shift/middle-click) so
 * "open in new tab" keeps working.
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
    const route = PATH_ROUTES[href.split('#')[0]!];
    if (!route) return; // not a known app route (e.g. an in-page #anchor) — let it behave normally
    e.preventDefault();
    navigate(route);
  });
}
