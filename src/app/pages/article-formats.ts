import { renderArticlePage, type ArticleBlock, type ArticleMeta } from '../article';

export const ARTICLE_FORMATS_META: ArticleMeta = {
  route: 'article-formats',
  category: 'Image Basics',
  title: 'Which Image Format Should You Use?',
  excerpt: 'JPG, PNG, WebP, AVIF, TIFF or HEIC? The short answer for photos, logos, websites and print.',
  readTime: '3 min',
  accent: 'accent-blue',
};

const BLOCKS: ArticleBlock[] = [
  { type: 'p', text: 'A site says "file type not supported." Or your photo is 12 MB and won\'t send.' },
  {
    type: 'p',
    text: 'Pick the wrong format and logos turn blurry, files balloon, or the image won\'t open at all. You usually find out after the upload fails.',
  },
  { type: 'p', text: 'The fix is simple: pick the format by the job. Here is the short answer.' },
  { type: 'h2', text: 'Quick answer' },
  {
    type: 'table',
    headers: ['Format', 'Use it for'],
    rows: [
      ['JPG', 'Photos and everyday sharing'],
      ['PNG', 'Logos, screenshots and anything with a see-through background'],
      ['WebP', 'Websites'],
      ['AVIF', 'Websites where every kilobyte counts'],
      ['TIFF', 'Print and professional editing'],
      ['HEIC', 'iPhone photos. Convert to JPG to share them'],
    ],
  },
  { type: 'h2', text: 'Three rules that cover most cases' },
  {
    type: 'ul',
    items: [
      'Photo to share or upload? Use JPG.',
      'Logo, screenshot or see-through background? Use PNG.',
      'iPhone photo that won\'t open? Convert the HEIC to JPG.',
    ],
  },
  { type: 'h2', text: 'Mistakes to avoid' },
  {
    type: 'ul',
    items: [
      'Saving a photo as PNG. The file gets several times bigger for no visible gain.',
      'Saving a logo as JPG. Edges blur and transparency is lost.',
      'Converting a JPG again and again. Quality drops a little each time, so keep the original.',
    ],
  },
  { type: 'h2', text: 'Need to convert?' },
  { type: 'p', text: 'Drop your file, click Convert, download the result. It runs in your browser, so nothing is uploaded.' },
  { type: 'tool-links', routes: ['jpeg-to-png', 'png-to-jpeg', 'heic-to-jpeg'] },
  { type: 'callout', text: 'Decide the job first. Then pick the format.' },
];

export function renderArticleFormatsPage(): HTMLElement {
  return renderArticlePage(ARTICLE_FORMATS_META, BLOCKS);
}
