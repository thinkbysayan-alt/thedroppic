/**
 * Static SEO audit over the built site (dist/). Run after `npm run build`:
 *   node scripts/audit.mjs
 * Exits non-zero if any check fails, so it can also gate CI.
 */
import fs from 'node:fs';
import path from 'node:path';
import { Window } from 'happy-dom';

const DIST = path.resolve('dist');
const SITE = 'https://thedroppic.com';
const failures = [];
const notes = [];
const fail = (page, msg) => failures.push(`${page}: ${msg}`);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const htmlFiles = walk(DIST).filter((f) => f.endsWith('.html'));
const urlFor = (file) => {
  const rel = path.relative(DIST, file).split(path.sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel === '404.html') return '/404';
  return '/' + rel.replace(/\/index\.html$/, '');
};

const sitemap = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const pageUrls = new Set(htmlFiles.map(urlFor).filter((u) => u !== '/404'));

const titles = new Map();
const descriptions = new Map();
const rows = [];

for (const file of htmlFiles) {
  const url = urlFor(file);
  const isNotFound = url === '/404';
  const html = fs.readFileSync(file, 'utf8');
  const win = new Window({ url: SITE + url });
  win.document.documentElement.innerHTML = html.replace(/^<!doctype html>/i, '');
  const doc = win.document;
  const q = (s) => doc.querySelector(s);
  const qa = (s) => [...doc.querySelectorAll(s)];

  // title + description
  const title = doc.title.trim();
  const description = q('meta[name="description"]')?.getAttribute('content')?.trim() ?? '';
  if (!title) fail(url, 'missing <title>');
  if (title.length > 70) fail(url, `title too long (${title.length})`);
  if (!description) fail(url, 'missing meta description');
  if (description.length > 160) fail(url, `description too long (${description.length})`);
  if (titles.has(title)) fail(url, `duplicate title with ${titles.get(title)}`);
  if (descriptions.has(description)) fail(url, `duplicate description with ${descriptions.get(description)}`);
  titles.set(title, url);
  descriptions.set(description, url);

  // canonical + robots
  const canonicals = qa('link[rel="canonical"]');
  const robots = q('meta[name="robots"]')?.getAttribute('content') ?? '';
  if (isNotFound) {
    if (canonicals.length) fail(url, '404 page must not have a canonical');
    if (!/noindex/.test(robots)) fail(url, '404 page should be noindex');
  } else {
    const expected = url === '/' ? `${SITE}/` : `${SITE}${url}`;
    if (canonicals.length !== 1) fail(url, `expected 1 canonical, found ${canonicals.length}`);
    else if (canonicals[0].getAttribute('href') !== expected) fail(url, `canonical ${canonicals[0].getAttribute('href')} != ${expected}`);
    if (/noindex|nofollow/i.test(robots)) fail(url, `unexpected robots meta "${robots}"`);
    if (!sitemapUrls.includes(expected)) fail(url, 'not in sitemap.xml');
  }

  // headings
  const h1s = qa('h1');
  if (h1s.length !== 1) fail(url, `expected exactly 1 h1, found ${h1s.length}`);
  let last = 0;
  for (const h of qa('h1,h2,h3,h4')) {
    const level = Number(h.tagName[1]);
    if (last && level > last + 1) fail(url, `heading jumps from h${last} to h${level} ("${h.textContent.trim().slice(0, 40)}")`);
    last = level;
  }

  // images
  for (const img of qa('img')) {
    if (!img.hasAttribute('alt')) fail(url, `img without alt: ${img.getAttribute('src')}`);
    if (!img.getAttribute('width') || !img.getAttribute('height')) fail(url, `img without width/height: ${img.getAttribute('src')}`);
  }

  // links
  for (const a of qa('a[href]')) {
    const href = a.getAttribute('href');
    if (href === '#' || href === '') fail(url, 'placeholder link');
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const target = href.split('#')[0] || '/';
    const normalized = target.length > 1 ? target.replace(/\/$/, '') : target;
    if (!pageUrls.has(normalized) && !fs.existsSync(path.join(DIST, normalized))) fail(url, `broken internal link ${href}`);
    const text = a.textContent.trim().toLowerCase();
    if (['click here', 'here', 'read more', 'learn more'].includes(text)) fail(url, `generic anchor text "${text}"`);
    if (!text && !a.getAttribute('aria-label')) fail(url, `link with no accessible text: ${href}`);
  }

  // copy
  const visible = doc.body.cloneNode(true);
  visible.querySelectorAll('script,style').forEach((n) => n.remove());
  const dash = visible.textContent.match(/.{0,30}[—–].{0,30}/);
  if (dash) fail(url, `contains an em/en dash in visible text: "${dash[0]}"`);

  // structured data
  const scripts = qa('script[type="application/ld+json"]');
  const types = [];
  if (!isNotFound && scripts.length !== 1) fail(url, `expected 1 JSON-LD block, found ${scripts.length}`);
  for (const s of scripts) {
    try {
      const data = JSON.parse(s.textContent);
      if (data['@context'] !== 'https://schema.org') fail(url, 'JSON-LD missing schema.org context');
      const graph = data['@graph'] ?? [data];
      for (const node of graph) {
        types.push(node['@type']);
        if (node['@type'] === 'FAQPage') {
          const visible = qa('.faq-item').length;
          if (node.mainEntity.length !== visible) fail(url, `FAQPage has ${node.mainEntity.length} questions but ${visible} are visible`);
        }
      }
      const dupes = types.filter((t, i) => types.indexOf(t) !== i);
      if (dupes.length) fail(url, `duplicate schema types: ${dupes.join(', ')}`);
    } catch (e) {
      fail(url, `invalid JSON-LD: ${e.message}`);
    }
  }

  // social
  if (!isNotFound) {
    for (const key of ['og:title', 'og:description', 'og:url', 'og:image', 'og:type']) {
      if (!q(`meta[property="${key}"]`)?.getAttribute('content')) fail(url, `missing ${key}`);
    }
    for (const key of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
      if (!q(`meta[name="${key}"]`)?.getAttribute('content')) fail(url, `missing ${key}`);
    }
    if (q('meta[property="og:url"]')?.getAttribute('content') !== q('link[rel="canonical"]')?.getAttribute('href')) fail(url, 'og:url differs from canonical');
  }
  if (!q('meta[name="viewport"]')) fail(url, 'missing viewport meta');
  if (doc.documentElement.getAttribute('lang') !== 'en') fail(url, 'missing html lang');
  if (!q('#app')?.innerHTML.trim()) fail(url, 'prerendered #app is empty');

  rows.push({ url, title: title.length, desc: description.length, h1: h1s.length, jsonld: types.join('+') || '-' });
}

// robots.txt / llms.txt / sitemap
const robots = fs.readFileSync(path.join(DIST, 'robots.txt'), 'utf8');
if (!/^User-agent:\s*\*/m.test(robots)) fail('robots.txt', 'missing User-agent: *');
if (/^Disallow:\s*\/?\s*$/m.test(robots) === false && /^Disallow:\s*\/\s*$/m.test(robots)) fail('robots.txt', 'blocks the whole site');
if (/^Disallow:\s*\/\s*$/m.test(robots)) fail('robots.txt', 'blocks the whole site');
if (!robots.includes(`Sitemap: ${SITE}/sitemap.xml`)) fail('robots.txt', 'missing sitemap line');
for (const u of sitemapUrls) if (!pageUrls.has(new URL(u).pathname)) fail('sitemap.xml', `lists ${u}, which has no page`);
if (new Set(sitemapUrls).size !== sitemapUrls.length) fail('sitemap.xml', 'duplicate URLs');
if (!/^<\?xml/.test(sitemap) || !sitemap.includes('</urlset>')) fail('sitemap.xml', 'not valid XML');
const llms = fs.readFileSync(path.join(DIST, 'llms.txt'), 'utf8');
for (const u of [...llms.matchAll(/\]\((https:\/\/thedroppic\.com[^)]*)\)/g)].map((m) => m[1])) {
  if (u.endsWith('sitemap.xml')) continue;
  if (!pageUrls.has(new URL(u).pathname)) fail('llms.txt', `links to missing page ${u}`);
}
for (const f of ['favicon.ico', 'favicon.svg', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'og-image.png', 'site.webmanifest']) {
  if (!fs.existsSync(path.join(DIST, f))) fail(f, 'missing from dist');
}

console.table(rows);
if (notes.length) console.log(notes.join('\n'));
if (failures.length) {
  console.error(`\n${failures.length} problem(s):\n- ` + failures.join('\n- '));
  process.exit(1);
}
console.log('\nAll SEO checks passed.');
