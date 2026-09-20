import { navigate, pathForRoute, type Route } from './router';

/**
 * A tiny content-block model shared by both Learn articles, so the actual
 * long-form copy (converted from the supplied PDFs) can live as plain data
 * next to each article's title, and this one renderer handles
 * turning it into consistent, on-brand markup — headings, paragraphs,
 * bullet lists, a comparison table, an arrow-connected flow diagram, a
 * highlighted callout line, and inline links to the actual tool routes.
 */
export type ArticleBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'callout'; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'flow'; steps: string[] }
  | { type: 'tool-links'; routes: Route[] };

export interface ArticleMeta {
  route: Route;
  category: string;
  title: string;
  excerpt: string;
  readTime: string;
  accent: string;
}

const TOOL_LABEL: Record<string, string> = {
  convert: 'Convert Images',
  'remove-background': 'Remove Backgrounds',
  optimize: 'Optimize Images',
};

export function renderArticlePage(meta: ArticleMeta, blocks: ArticleBlock[]): HTMLElement {
  document.title = `${meta.title} | thedroppic Learn`;
  setMetaDescription(meta.excerpt);

  const wrap = document.createElement('div');
  wrap.className = `article-page ${meta.accent}`;

  const breadcrumb = document.createElement('nav');
  breadcrumb.className = 'breadcrumb';
  breadcrumb.setAttribute('aria-label', 'Breadcrumb');
  breadcrumb.innerHTML = `
    <a href="/">Home</a>
    <span aria-hidden="true">›</span>
    <a href="${pathForRoute('learn')}">Learn</a>
    <span aria-hidden="true">›</span>
    <span aria-current="page"></span>
  `;
  breadcrumb.querySelector('[aria-current]')!.textContent = meta.title;
  wrap.appendChild(breadcrumb);

  const header = document.createElement('header');
  header.className = 'article-header';
  header.innerHTML = `
    <span class="eyebrow"></span>
    <h1></h1>
    <p class="article-header__meta"></p>
  `;
  header.querySelector('.eyebrow')!.textContent = meta.category.toUpperCase();
  header.querySelector('h1')!.textContent = meta.title;
  header.querySelector('.article-header__meta')!.textContent = `${meta.readTime} read`;
  wrap.appendChild(header);

  const body = document.createElement('div');
  body.className = 'article-body';
  for (const block of blocks) body.appendChild(renderBlock(block));
  wrap.appendChild(body);

  const backLink = document.createElement('a');
  backLink.href = pathForRoute('learn');
  backLink.className = 'btn btn-secondary';
  backLink.textContent = '← Back to Learn';
  backLink.style.marginTop = 'var(--space-6)';
  wrap.appendChild(backLink);

  return wrap;
}

function renderBlock(block: ArticleBlock): HTMLElement {
  switch (block.type) {
    case 'h2': {
      const el = document.createElement('h2');
      el.textContent = block.text;
      return el;
    }
    case 'h3': {
      const el = document.createElement('h3');
      el.textContent = block.text;
      return el;
    }
    case 'p': {
      const el = document.createElement('p');
      el.textContent = block.text;
      return el;
    }
    case 'ul': {
      const el = document.createElement('ul');
      el.className = 'article-list';
      for (const item of block.items) {
        const li = document.createElement('li');
        li.textContent = item;
        el.appendChild(li);
      }
      return el;
    }
    case 'callout': {
      const el = document.createElement('p');
      el.className = 'article-callout';
      el.textContent = block.text;
      return el;
    }
    case 'table': {
      const wrap = document.createElement('div');
      wrap.className = 'article-table-wrap';
      const table = document.createElement('table');
      table.className = 'article-table';
      const thead = document.createElement('thead');
      const headRow = document.createElement('tr');
      for (const h of block.headers) {
        const th = document.createElement('th');
        th.textContent = h;
        headRow.appendChild(th);
      }
      thead.appendChild(headRow);
      table.appendChild(thead);
      const tbody = document.createElement('tbody');
      for (const row of block.rows) {
        const tr = document.createElement('tr');
        for (const cell of row) {
          const td = document.createElement('td');
          td.textContent = cell;
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      wrap.appendChild(table);
      return wrap;
    }
    case 'flow': {
      const el = document.createElement('div');
      el.className = 'article-flow';
      block.steps.forEach((step, index) => {
        if (index > 0) {
          const arrow = document.createElement('span');
          arrow.className = 'article-flow__arrow';
          arrow.setAttribute('aria-hidden', 'true');
          arrow.textContent = '→';
          el.appendChild(arrow);
        }
        const chip = document.createElement('span');
        chip.className = 'article-flow__step';
        chip.textContent = step;
        el.appendChild(chip);
      });
      return el;
    }
    case 'tool-links': {
      const el = document.createElement('div');
      el.className = 'article-tool-links';
      for (const route of block.routes) {
        const link = document.createElement('a');
        link.href = pathForRoute(route);
        link.className = 'article-tool-links__link';
        link.textContent = `${TOOL_LABEL[route] ?? route} →`;
        el.appendChild(link);
      }
      return el;
    }
  }
}

/** Not currently used by the block renderer itself, but kept available for a page module that wants a "Try this tool" button with a click handler instead of a plain link. */
export function goToTool(route: Route): void {
  navigate(route);
}

function setMetaDescription(text: string): void {
  const el = document.querySelector('meta[name="description"]');
  if (el) el.setAttribute('content', text);
}
