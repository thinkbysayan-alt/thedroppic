import { ROUTE_PATHS, type PageRoute, type Route } from './router';
import { ARTICLE_FORMATS_META } from './pages/article-formats';
import { ARTICLE_BROWSER_META } from './pages/article-browser-processing';

/**
 * Single source of truth for per-page metadata (title, description,
 * canonical, Open Graph, Twitter, JSON-LD). Used at runtime on every
 * client-side navigation (applySeo) and at build time by scripts/prerender.ts
 * so the static HTML crawlers receive matches what the app renders.
 */
export const SITE_URL = 'https://thedroppic.com';
export const SITE_NAME = 'thedroppic';
const OG_IMAGE = `${SITE_URL}/og-image.png`;
const LOGO = `${SITE_URL}/icon-512.png`;

interface PageMeta {
  title: string;
  description: string;
  /** Label used for this page in breadcrumbs. */
  crumb: string;
  /** Route shown before this one in breadcrumbs (Home is implicit). */
  parent?: PageRoute;
}

export const PAGE_META: Record<PageRoute, PageMeta> = {
  home: {
    title: 'thedroppic: Private Image Tools That Run in Your Browser',
    description:
      'Convert image formats, remove backgrounds and reduce file size in your browser. No account and no upload. Your images stay on your device.',
    crumb: 'Home',
  },
  convert: {
    title: 'Image Converter: JPG, PNG, WebP, AVIF, TIFF & HEIC | thedroppic',
    description:
      'Convert images between JPG, PNG, WebP, AVIF, TIFF and HEIC in your browser. Up to 5 files at once. Nothing is uploaded.',
    crumb: 'Convert Images',
  },
  'remove-background': {
    title: 'AI Background Remover: No Upload Needed | thedroppic',
    description:
      'Remove image backgrounds with AI in your browser and download a transparent PNG. Works best on people and portraits. Nothing is uploaded.',
    crumb: 'Remove Background',
  },
  optimize: {
    title: 'Image Compressor: Reduce Image File Size | thedroppic',
    description:
      'Reduce image file size in your browser. Choose Small, Medium or Original quality and see the exact before and after size. Nothing is uploaded.',
    crumb: 'Optimize / Compress',
  },
  about: {
    title: 'About thedroppic: Private, Browser-Based Image Tools',
    description:
      'thedroppic offers three image tools that run in your browser: convert formats, remove backgrounds and reduce file size. See how it protects your privacy.',
    crumb: 'About',
  },
  learn: {
    title: 'Learn: Image Format Guides | thedroppic',
    description:
      'Short guides on choosing image formats and on how browser-based image processing keeps your files private.',
    crumb: 'Learn',
  },
  'article-formats': {
    title: 'Which Image Format to Use: JPG, PNG, WebP, AVIF | thedroppic',
    description: ARTICLE_FORMATS_META.excerpt,
    crumb: ARTICLE_FORMATS_META.title,
    parent: 'learn',
  },
  'article-browser-processing': {
    title: 'How Browser-Based Image Processing Works | thedroppic',
    description: ARTICLE_BROWSER_META.excerpt,
    crumb: ARTICLE_BROWSER_META.title,
    parent: 'learn',
  },
};

const NOT_FOUND_TITLE = 'Page not found | thedroppic';
const NOT_FOUND_DESCRIPTION = 'This page does not exist. Use the links to open one of the image tools.';

export function canonicalFor(route: PageRoute): string {
  return route === 'home' ? `${SITE_URL}/` : `${SITE_URL}${ROUTE_PATHS[route]}`;
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export interface SeoData {
  title: string;
  description: string;
  canonical: string | null;
  noindex: boolean;
  ogType: 'website' | 'article';
  jsonld: object | null;
}

const ORGANIZATION = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  logo: LOGO,
};

const TOOL_APPS: Partial<Record<PageRoute, { name: string; features: string[] }>> = {
  convert: {
    name: 'thedroppic Image Converter',
    features: [
      'Convert between JPG, PNG, WebP, AVIF, TIFF and HEIC',
      'Up to 5 images at once',
      'Runs in your browser, nothing is uploaded',
    ],
  },
  'remove-background': {
    name: 'thedroppic Background Remover',
    features: [
      'AI background removal',
      'Transparent PNG output',
      'Runs in your browser, nothing is uploaded',
    ],
  },
  optimize: {
    name: 'thedroppic Image Optimizer',
    features: [
      'Small, Medium and Original quality levels',
      'Shows the exact file size before and after',
      'Runs in your browser, nothing is uploaded',
    ],
  },
};

function breadcrumbList(route: PageRoute): object {
  const meta = PAGE_META[route];
  const trail: Array<{ name: string; url: string }> = [{ name: 'Home', url: canonicalFor('home') }];
  if (meta.parent) trail.push({ name: PAGE_META[meta.parent].crumb, url: canonicalFor(meta.parent) });
  trail.push({ name: meta.crumb, url: canonicalFor(route) });
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

function buildGraph(route: PageRoute, faq: FaqEntry[]): object[] {
  const meta = PAGE_META[route];
  const url = canonicalFor(route);
  const graph: object[] = [];

  if (route === 'home') {
    graph.push(ORGANIZATION, {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      description: meta.description,
      publisher: { '@id': `${SITE_URL}/#organization` },
    });
  } else {
    graph.push(breadcrumbList(route));
  }

  const app = TOOL_APPS[route];
  if (app) {
    graph.push({
      '@type': 'WebApplication',
      name: app.name,
      url,
      description: meta.description,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Any (runs in a web browser)',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: app.features,
      publisher: { '@id': `${SITE_URL}/#organization` },
    });
  }
  if (route === 'about') graph.push({ '@type': 'AboutPage', url, name: meta.title, description: meta.description });
  if (route === 'learn') graph.push({ '@type': 'CollectionPage', url, name: meta.title, description: meta.description });
  if (route === 'article-formats' || route === 'article-browser-processing') {
    graph.push({
      '@type': 'Article',
      headline: meta.crumb,
      description: meta.description,
      mainEntityOfPage: url,
      publisher: { '@id': `${SITE_URL}/#organization` },
    });
  }

  if (faq.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    });
  }
  // Pages other than home reference the organization by id, so include it once here where it is first needed.
  if (route !== 'home') graph.push(ORGANIZATION);
  return graph;
}

/** Pure: everything a page needs in <head>. `faq` must be the FAQ actually visible on the page. */
export function buildSeo(route: Route, faq: FaqEntry[] = []): SeoData {
  if (route === 'not-found') {
    return { title: NOT_FOUND_TITLE, description: NOT_FOUND_DESCRIPTION, canonical: null, noindex: true, ogType: 'website', jsonld: null };
  }
  const meta = PAGE_META[route];
  return {
    title: meta.title,
    description: meta.description,
    canonical: canonicalFor(route),
    noindex: false,
    ogType: route.startsWith('article-') ? 'article' : 'website',
    jsonld: { '@context': 'https://schema.org', '@graph': buildGraph(route, faq) },
  };
}

/** Reads the visible FAQ accordion so FAQPage markup can never drift from what users see. */
export function collectFaq(scope: ParentNode): FaqEntry[] {
  return Array.from(scope.querySelectorAll('.faq-item')).map((item) => ({
    question: item.querySelector('summary span')?.textContent?.trim() ?? '',
    answer: item.querySelector('p')?.textContent?.trim() ?? '',
  })).filter((entry) => entry.question && entry.answer);
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** Applies title, description, canonical, robots, Open Graph, Twitter and JSON-LD for the current route. */
export function applySeo(route: Route, viewRoot: ParentNode): void {
  const seo = buildSeo(route, collectFaq(viewRoot));
  document.title = seo.title;
  upsertMeta('name', 'description', seo.description);

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (seo.canonical) {
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = seo.canonical;
  } else {
    canonical?.remove();
  }

  const robots = document.head.querySelector('meta[name="robots"]');
  if (seo.noindex) upsertMeta('name', 'robots', 'noindex');
  else robots?.remove();

  upsertMeta('property', 'og:type', seo.ogType);
  upsertMeta('property', 'og:site_name', SITE_NAME);
  upsertMeta('property', 'og:title', seo.title);
  upsertMeta('property', 'og:description', seo.description);
  upsertMeta('property', 'og:image', OG_IMAGE);
  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', seo.title);
  upsertMeta('name', 'twitter:description', seo.description);
  upsertMeta('name', 'twitter:image', OG_IMAGE);
  if (seo.canonical) upsertMeta('property', 'og:url', seo.canonical);
  else document.head.querySelector('meta[property="og:url"]')?.remove();

  const existing = document.getElementById('page-jsonld');
  if (seo.jsonld) {
    const script = existing ?? document.createElement('script');
    script.id = 'page-jsonld';
    script.setAttribute('type', 'application/ld+json');
    script.textContent = JSON.stringify(seo.jsonld);
    if (!existing) document.head.appendChild(script);
  } else {
    existing?.remove();
  }
}
