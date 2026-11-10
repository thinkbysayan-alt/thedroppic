import { renderArticlePage, type ArticleBlock, type ArticleMeta } from '../article';

export const ARTICLE_BROWSER_META: ArticleMeta = {
  route: 'article-browser-processing',
  category: 'Behind the Tool',
  title: 'How Browser-Based Image Processing Works',
  excerpt: 'What happens to your photo when you convert it in your browser instead of on a server? A plain-language look.',
  readTime: '3 min',
  accent: 'accent-mint',
};

const BLOCKS: ArticleBlock[] = [
  { type: 'p', text: 'Most free image converters ask you to upload your photo.' },
  {
    type: 'p',
    text: 'Your file travels to a server you can\'t see. You wait for it to go up and come back. And you have to trust that it gets deleted.',
  },
  { type: 'p', text: 'Browser-based tools skip the trip. Your browser converts the image on your own device.' },
  { type: 'h2', text: 'What happens when you convert' },
  { type: 'flow', steps: ['Pick a file', 'Browser reads it', 'Browser converts it', 'You download it'] },
  {
    type: 'p',
    text: 'Modern browsers can read, change and save images themselves. The conversion code downloads once with the page. After that, your image only ever exists on your device.',
  },
  { type: 'h2', text: 'Upload tools vs browser tools' },
  {
    type: 'table',
    headers: ['', 'Browser-based', 'Upload-based'],
    rows: [
      ['Where it runs', 'Your device', 'A remote server'],
      ['Is your image sent?', 'No', 'Yes'],
      ['Waiting for the upload', 'None', 'Depends on your connection'],
      ['Big files', 'Depends on your device', 'Depends on the server'],
    ],
  },
  { type: 'h2', text: 'Is it secure?' },
  {
    type: 'p',
    text: 'It removes one risk: your image is never sent to someone else\'s server. It does not make a site perfect, so check how any tool treats your files before using it for sensitive photos.',
  },
  { type: 'h2', text: 'How to check for yourself' },
  { type: 'p', text: 'Open your browser\'s network tab, convert a photo, and look for an upload. With thedroppic you will not see one.' },
  { type: 'h2', text: 'Ready to convert?' },
  { type: 'tool-links', routes: ['jpeg-to-png', 'png-to-jpeg', 'heic-to-jpeg'] },
  { type: 'callout', text: 'Your images. Your device.' },
];

export function renderArticleBrowserProcessingPage(): HTMLElement {
  return renderArticlePage(ARTICLE_BROWSER_META, BLOCKS);
}
