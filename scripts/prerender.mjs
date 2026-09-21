/**
 * Build-time prerender. Runs after `vite build`.
 *
 * The app is a client-rendered SPA. For search engines (and anyone without
 * JavaScript) each real route also needs its own static HTML file with the
 * right <title>, description, canonical, Open Graph tags, JSON-LD and the
 * page content itself. This script renders every route with the app's own
 * code inside a DOM shim (happy-dom), then writes:
 *
 *   dist/index.html                      (home)
 *   dist/<route>/index.html              (every other page)
 *   dist/404.html                        (not-found shell, marked noindex)
 *   dist/sitemap.xml                     (generated from the same route table)
 *
 * The browser bundle then takes over exactly as before: it re-renders the
 * same page into #app on load. Metadata comes from src/app/seo.ts, the same
 * module the client uses on navigation, so the two can never drift.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

const DIST = path.resolve('dist');
const SITE_URL = 'https://thedroppic.com';

const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

const escapeAttr = (value) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function setMeta(html, attr, key, content) {
  const re = new RegExp(`<meta\\s+[^>]*?${attr}="${key}"[^>]*>`, 's');
  const tag = content === null ? '' : `<meta ${attr}="${key}" content="${escapeAttr(content)}" />`;
  if (re.test(html)) return html.replace(re, tag);
  return content === null ? html : html.replace('</head>', `    ${tag}\n  </head>`);
}

function buildHead(html, seo, fontPreload) {
  html = html.replace(/<title>.*?<\/title>/s, `<title>${escapeAttr(seo.title).replace(/&quot;/g, '"')}</title>`);
  html = setMeta(html, 'name', 'description', seo.description);
  html = setMeta(html, 'property', 'og:title', seo.title);
  html = setMeta(html, 'property', 'og:description', seo.description);
  html = setMeta(html, 'property', 'og:type', seo.ogType);
  html = setMeta(html, 'name', 'twitter:title', seo.title);
  html = setMeta(html, 'name', 'twitter:description', seo.description);
  html = setMeta(html, 'property', 'og:url', seo.canonical);
  html = html.replace(/<link\s+rel="canonical"[^>]*>\s*/s, seo.canonical ? `<link rel="canonical" href="${seo.canonical}" />\n    ` : '');
  if (seo.noindex) html = html.replace('</head>', '    <meta name="robots" content="noindex" />\n  </head>');
  const extra = [];
  if (fontPreload) extra.push(`<link rel="preload" href="${fontPreload}" as="font" type="font/woff2" crossorigin />`);
  if (seo.jsonld) {
    const json = JSON.stringify(seo.jsonld).replace(/</g, '\\u003c');
    extra.push(`<script type="application/ld+json" id="page-jsonld">${json}</script>`);
  }
  return html.replace('</head>', `    ${extra.join('\n    ')}\n  </head>`);
}

const assets = fs.readdirSync(path.join(DIST, 'assets'));
const latinFont = assets.find((f) => /^geist-latin-wght-normal-.*\.woff2$/.test(f));
const fontPreload = latinFont ? `/assets/${latinFont}` : null;

const { ROUTE_PATHS } = await server.ssrLoadModule('/src/app/router.ts');
const pages = Object.entries(ROUTE_PATHS).map(([route, urlPath]) => ({ route, urlPath }));
pages.push({ route: 'not-found', urlPath: '/404' });

const canonicalUrls = [];

for (const { route, urlPath } of pages) {
  server.moduleGraph.invalidateAll();
  GlobalRegistrator.register({ url: `${SITE_URL}${urlPath}`, width: 1280, height: 800 });
  try {
    document.body.innerHTML = '<div id="app"></div>';
    const { mountApp } = await server.ssrLoadModule('/src/app/app.ts');
    const { buildSeo, collectFaq } = await server.ssrLoadModule('/src/app/seo.ts');
    const root = document.getElementById('app');
    mountApp(root);

    const seo = buildSeo(route, collectFaq(document.getElementById('view-root')));
    let html = template.replace('<div id="app"></div>', `<div id="app">${root.innerHTML}</div>`);
    html = buildHead(html, seo, fontPreload);

    const outFile =
      route === 'home' ? path.join(DIST, 'index.html')
      : route === 'not-found' ? path.join(DIST, '404.html')
      : path.join(DIST, urlPath.slice(1), 'index.html');
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, html);
    if (seo.canonical) canonicalUrls.push(seo.canonical);
    console.log(`prerendered ${route.padEnd(28)} -> ${path.relative(DIST, outFile)}`);
  } finally {
    await GlobalRegistrator.unregister();
  }
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${canonicalUrls.map((loc) => `  <url>\n    <loc>${loc}</loc>\n  </url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap);
console.log(`sitemap.xml with ${canonicalUrls.length} URLs`);

await server.close();
process.exit(0);
