import { TOOL_LINKS } from '../tools';
import { pathForRoute } from '../router';
import { renderArt, renderCrumbs, renderPageHead, renderToolCarousel, renderToolFaq } from '../sections';
import { logoMarkup } from '../logo';
import type { ArticleMeta } from '../article';
import { ARTICLE_FORMATS_META } from './article-formats';
import { ARTICLE_BROWSER_META } from './article-browser-processing';

const ARTICLES: ArticleMeta[] = [ARTICLE_FORMATS_META, ARTICLE_BROWSER_META];

const BLOG_FAQ = [
  {
    question: 'Which image format should I use?',
    answer: 'Use JPEG for photos, PNG for graphics, screenshots and anything that needs transparency, and WebP for lighter images on a website.',
  },
  {
    question: 'What is the difference between JPEG and PNG?',
    answer: 'JPEG makes photos small by discarding some detail. PNG keeps every pixel and supports transparency, so its files are usually larger.',
  },
  {
    question: 'What is a HEIC file and why will it not open?',
    answer: 'HEIC is the format iPhones use for photos. Many Windows PCs, apps and websites cannot open it. Convert it to JPEG and it opens anywhere.',
  },
  {
    question: 'Is WebP better than JPEG?',
    answer: 'WebP files are usually smaller at similar quality, which helps websites load faster. JPEG is still the safer choice when you need it to open everywhere.',
  },
  {
    question: 'Does converting an image reduce its quality?',
    answer: 'Converting to PNG keeps every pixel of the source. Converting to JPEG or WebP is lossy, so you choose a quality setting that balances size and detail.',
  },
  {
    question: 'Is it safe to convert images in the browser?',
    answer: 'Yes. thedroppic converts images on your device, so the file is never uploaded to a server.',
  },
];

/** Each tile gets its own pixel-dither illustration. */
const TILE_ART: Record<string, string> = {
  'article-formats': '/art/tile-formats.svg',
  'article-browser-processing': '/art/tile-browser.svg',
};

/** The blog index: one tile per guide (pixel art on top, dark panel below), then the three converters. */
export function renderBlogPage(): HTMLElement {
  const wrap = document.createElement('div');

  wrap.appendChild(renderCrumbs('Blog', 'blog'));
  wrap.appendChild(
    renderPageHead({
      title: 'Blog',
      pas: {
        problem: 'Not sure which image format to pick?',
        agitation: 'Pick wrong and your image comes out blurry, huge, or rejected.',
        solution: 'Read a short guide. Then convert in seconds.',
      },
    }),
  );

  const list = document.createElement('ul');
  list.className = 'tiles';
  ARTICLES.forEach((article) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = pathForRoute(article.route);
    link.className = 'tile';
    link.innerHTML = `
      <span class="tile__art"></span>
      <span class="tile__body">
        <span class="tile__meta"></span>
        <h2 class="tile__title"></h2>
        <span class="tile__foot">
          <span class="tile__read"></span>
          ${logoMarkup('tile__logo')}
        </span>
      </span>
    `;
    link.querySelector('.tile__art')!.appendChild(
      renderArt({ src: TILE_ART[article.route] ?? '/art/tile-formats.svg', alt: '', width: 600, height: 396, priority: true }),
    );
    link.querySelector('.tile__meta')!.textContent = article.category;
    link.querySelector('.tile__title')!.textContent = article.title;
    link.querySelector('.tile__read')!.textContent = `${article.readTime} read`;
    li.appendChild(link);
    list.appendChild(li);
  });
  wrap.appendChild(list);

  const more = document.createElement('section');
  more.className = 'page-section';
  more.innerHTML = '<h2>Ready to convert?</h2>';
  more.appendChild(renderToolCarousel(TOOL_LINKS));
  wrap.appendChild(more);

  const faq = renderToolFaq(BLOG_FAQ, 'Image format questions');
  faq.classList.add('page-section');
  wrap.appendChild(faq);

  return wrap;
}
