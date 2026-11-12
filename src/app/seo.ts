import { ROUTE_PATHS, type PageRoute, type Route } from './router';

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
    title: 'thedroppic: Fix Any Image Format in Your Browser',
    description:
      'Wrong format? Drop it in. Swap between JPEG, PNG, WebP and HEIC or cut out a background, right in your browser. No upload, no sign-up.',
    crumb: 'Home',
  },
  'jpeg-to-png': {
    title: 'JPEG to PNG Converter, No Upload | thedroppic',
    description:
      'Turn JPEGs into crisp PNGs in seconds, up to 5 at once. It all happens in your browser, so your photos stay put.',
    crumb: 'JPEG to PNG',
  },
  'png-to-jpeg': {
    title: 'PNG to JPEG: Shrink Big PNGs | thedroppic',
    description:
      'Make chunky PNGs light enough to email. Convert up to 5 at once, right in your browser. No upload, no account.',
    crumb: 'PNG to JPEG',
  },
  'heic-to-jpeg': {
    title: 'HEIC to JPEG: Open iPhone Photos Anywhere | thedroppic',
    description:
      "iPhone photo won't open? Turn HEIC into JPEG in seconds, in your browser. Nothing uploaded, nothing to install.",
    crumb: 'HEIC to JPEG',
  },
  'webp-to-jpeg': {
    title: 'WebP to JPEG Converter | thedroppic',
    description:
      "Saved an image as .webp and it won't open? Turn it into a JPEG that works everywhere, right in your browser.",
    crumb: 'WebP to JPEG',
  },
  'webp-to-png': {
    title: 'WebP to PNG Converter | thedroppic',
    description:
      'Convert WebP images to PNG and keep the transparency. Up to 5 at once, all in your browser.',
    crumb: 'WebP to PNG',
  },
  'jpeg-to-webp': {
    title: 'JPEG to WebP: Faster Web Images | thedroppic',
    description:
      'Make your site quicker. Turn JPEGs into lighter WebP files, up to 5 at once, without uploading a thing.',
    crumb: 'JPEG to WebP',
  },
  'png-to-webp': {
    title: 'PNG to WebP Converter | thedroppic',
    description:
      'Shrink PNG logos and graphics into WebP and keep the transparency. Runs right in your browser.',
    crumb: 'PNG to WebP',
  },
  about: {
    title: 'About thedroppic: Small Tools for Stubborn Pictures',
    description:
      'Why thedroppic exists, how it works, and where your photos go (spoiler: nowhere).',
    crumb: 'About',
  },
  'remove-background': {
    title: 'Remove Image Background, No Upload | thedroppic',
    description:
      'Cut the background out of any photo and get a see-through image, never bigger than the original. Works best on portraits. Happens on your device.',
    crumb: 'Remove Background',
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
  'jpeg-to-png': {
    name: 'thedroppic JPEG to PNG Converter',
    features: ['Convert JPEG to PNG', 'Up to 5 images at once', 'Runs in your browser, nothing is uploaded'],
  },
  'png-to-jpeg': {
    name: 'thedroppic PNG to JPEG Converter',
    features: ['Convert PNG to JPEG with adjustable quality', 'Up to 5 images at once', 'Runs in your browser, nothing is uploaded'],
  },
  'heic-to-jpeg': {
    name: 'thedroppic HEIC to JPEG Converter',
    features: ['Convert iPhone HEIC photos to JPEG', 'Up to 5 images at once', 'Runs in your browser, nothing is uploaded'],
  },
  'webp-to-jpeg': {
    name: 'thedroppic WebP to JPEG Converter',
    features: ['Convert WebP to JPEG', 'Up to 5 images at once', 'Runs in your browser, nothing is uploaded'],
  },
  'webp-to-png': {
    name: 'thedroppic WebP to PNG Converter',
    features: ['Convert WebP to PNG and keep transparency', 'Up to 5 images at once', 'Runs in your browser, nothing is uploaded'],
  },
  'jpeg-to-webp': {
    name: 'thedroppic JPEG to WebP Converter',
    features: ['Convert JPEG to WebP with adjustable quality', 'Up to 5 images at once', 'Runs in your browser, nothing is uploaded'],
  },
  'png-to-webp': {
    name: 'thedroppic PNG to WebP Converter',
    features: ['Convert PNG to WebP with adjustable quality', 'Up to 5 images at once', 'Runs in your browser, nothing is uploaded'],
  },
  'remove-background': {
    name: 'thedroppic Background Remover',
    features: [
      'AI background removal',
      'Transparent output, never larger than the original',
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
    ogType: 'website',
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
