import { describe, expect, it } from 'vitest';
import { PAGE_META, buildSeo, canonicalFor, SITE_URL } from '../src/app/seo';
import { ROUTE_PATHS, routeForPath, type PageRoute } from '../src/app/router';

const routes = Object.keys(ROUTE_PATHS) as PageRoute[];

describe('routing', () => {
  it('maps every path back to its route, ignoring a trailing slash', () => {
    for (const route of routes) {
      expect(routeForPath(ROUTE_PATHS[route])).toBe(route);
      if (ROUTE_PATHS[route] !== '/') expect(routeForPath(`${ROUTE_PATHS[route]}/`)).toBe(route);
    }
  });

  it('treats unknown paths, including the old article slugs, as not-found', () => {
    expect(routeForPath('/nope')).toBe('not-found');
    expect(routeForPath('/learn/which-image-format-should-you-use')).toBe('not-found');
  });

  it('uses short lowercase hyphenated slugs', () => {
    for (const path of Object.values(ROUTE_PATHS)) expect(path).toMatch(/^\/[a-z0-9\-/]*$/);
  });
});

describe('page metadata', () => {
  it('gives every page a unique title and description within search-result limits', () => {
    const titles = routes.map((r) => PAGE_META[r].title);
    const descriptions = routes.map((r) => PAGE_META[r].description);
    expect(new Set(titles).size).toBe(routes.length);
    expect(new Set(descriptions).size).toBe(routes.length);
    for (const t of titles) expect(t.length).toBeLessThanOrEqual(65);
    for (const d of descriptions) expect(d.length).toBeLessThanOrEqual(160);
  });

  it('has no em or en dashes in titles or descriptions', () => {
    for (const r of routes) expect(PAGE_META[r].title + PAGE_META[r].description).not.toMatch(/[\u2014\u2013]/);
  });

  it('builds self-referencing HTTPS canonicals with no trailing slash except the home page', () => {
    expect(canonicalFor('home')).toBe(`${SITE_URL}/`);
    for (const r of routes.filter((x) => x !== 'home')) {
      const c = canonicalFor(r);
      expect(c.startsWith('https://')).toBe(true);
      expect(c.endsWith('/')).toBe(false);
      expect(c).toBe(`${SITE_URL}${ROUTE_PATHS[r]}`);
    }
  });

  it('marks not-found as noindex with no canonical or structured data', () => {
    const seo = buildSeo('not-found');
    expect(seo.noindex).toBe(true);
    expect(seo.canonical).toBeNull();
    expect(seo.jsonld).toBeNull();
  });

  it('never marks real pages noindex', () => {
    for (const r of routes) expect(buildSeo(r).noindex).toBe(false);
  });
});

describe('structured data', () => {
  const types = (route: PageRoute, faq: Array<{ question: string; answer: string }> = []) =>
    ((buildSeo(route, faq).jsonld as { '@graph': Array<{ '@type': string }> })['@graph']).map((n) => n['@type']);

  it('describes the site once on the home page', () => {
    expect(types('home')).toEqual(['Organization', 'WebSite']);
  });

  it('describes each tool as a WebApplication with breadcrumbs', () => {
    for (const r of ['convert', 'remove-background', 'optimize'] as const) {
      expect(types(r)).toContain('WebApplication');
      expect(types(r)).toContain('BreadcrumbList');
    }
  });

  it('only adds FAQPage when the page actually shows FAQ entries', () => {
    expect(types('convert')).not.toContain('FAQPage');
    expect(types('convert', [{ question: 'Q?', answer: 'A.' }])).toContain('FAQPage');
  });

  it('never repeats a schema type on one page', () => {
    for (const r of routes) {
      const t = types(r, [{ question: 'Q?', answer: 'A.' }]);
      expect(new Set(t).size).toBe(t.length);
    }
  });
});
