import { mountChrome, setActiveNavRoute } from './chrome';
import { getCurrentRoute, initRouter, installLinkInterceptor, onRouteChange, type Route } from './router';
import { renderHomePage } from './pages/home';
import { renderConvertPage } from './pages/convert';
import { renderRemoveBackgroundPage } from './pages/remove-background';
import { renderOptimizePage } from './pages/optimize';
import { renderAboutPage } from './pages/about';
import { renderLearnPage } from './pages/learn';
import { renderArticleFormatsPage } from './pages/article-formats';
import { renderArticleBrowserProcessingPage } from './pages/article-browser-processing';
import { renderNotFoundPage } from './pages/not-found';
import { applySeo } from './seo';
import { initScrollReveal } from '../utils/reveal';

/**
 * Top-level bootstrap: mounts the shared header/footer shell once, then
 * re-renders whichever page the router says is current into #view-root on
 * every navigation. Each page module owns its own upload → process →
 * download workflow (see tool-workspace.ts / optimize-workspace.ts) — this
 * file only wires routing, it holds no product logic itself.
 */
export function mountApp(root: HTMLElement): void {
  const { viewRoot } = mountChrome(root);

  function renderRoute(route: Route): void {
    viewRoot.replaceChildren();
    let page: HTMLElement;
    switch (route) {
      case 'convert':
        page = renderConvertPage();
        break;
      case 'remove-background':
        page = renderRemoveBackgroundPage();
        break;
      case 'optimize':
        page = renderOptimizePage();
        break;
      case 'about':
        page = renderAboutPage();
        break;
      case 'learn':
        page = renderLearnPage();
        break;
      case 'article-formats':
        page = renderArticleFormatsPage();
        break;
      case 'article-browser-processing':
        page = renderArticleBrowserProcessingPage();
        break;
      case 'not-found':
        page = renderNotFoundPage();
        break;
      case 'home':
      default:
        page = renderHomePage();
        break;
    }
    viewRoot.appendChild(page);
    setActiveNavRoute(root, route);
    applySeo(route, viewRoot);
    initScrollReveal(viewRoot);
  }

  initRouter();
  installLinkInterceptor();
  onRouteChange(renderRoute);
  renderRoute(getCurrentRoute());
}
