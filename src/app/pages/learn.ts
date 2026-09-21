import { pathForRoute } from '../router';
import { renderRelatedLinks } from '../sections';
import type { ArticleMeta } from '../article';
import { ARTICLE_FORMATS_META } from './article-formats';
import { ARTICLE_BROWSER_META } from './article-browser-processing';

const ARTICLES: ArticleMeta[] = [ARTICLE_FORMATS_META, ARTICLE_BROWSER_META];

export function renderLearnPage(): HTMLElement {

  const wrap = document.createElement('div');

  const hero = document.createElement('section');
  hero.className = 'tool-hero accent-blue';
  hero.innerHTML = `
    <h1>Guides on images <br /><span class="tool-hero__accent">and how thedroppic works.</span></h1>
    <p>Short guides on image formats and private, browser-based processing.</p>
  `;
  wrap.appendChild(hero);

  const grid = document.createElement('div');
  grid.className = 'learn-grid';
  ARTICLES.forEach((article, index) => {
    const card = document.createElement('a');
    card.href = pathForRoute(article.route);
    card.className = `learn-card ${article.accent}`;
    card.setAttribute('data-reveal', '');
    card.style.setProperty('--reveal-delay', `${index * 100}ms`);

    const body = document.createElement('div');
    body.className = 'learn-card__body';
    body.innerHTML = `
      <span class="learn-card__category"></span>
      <h2></h2>
      <p></p>
      <span class="learn-card__meta"></span>
    `;
    body.querySelector('.learn-card__category')!.textContent = article.category;
    body.querySelector('h2')!.textContent = article.title;
    body.querySelector('p')!.textContent = article.excerpt;
    body.querySelector('.learn-card__meta')!.textContent = `${article.readTime} read`;
    card.appendChild(body);

    grid.appendChild(card);
  });

  const section = document.createElement('section');
  section.className = 'section';
  section.appendChild(grid);
  wrap.appendChild(section);
  wrap.appendChild(
    renderRelatedLinks('Try the tools', [
      { route: 'convert', label: 'Convert images', description: 'Change the format of JPG, PNG, WebP, AVIF, TIFF and HEIC files.' },
      { route: 'remove-background', label: 'Remove image backgrounds', description: 'Get a transparent PNG cutout with AI.' },
      { route: 'optimize', label: 'Compress images', description: 'Reduce file size and see the exact savings.' },
    ]),
  );

  return wrap;
}

