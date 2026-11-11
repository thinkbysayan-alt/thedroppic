import { pathForRoute, type PageRoute } from './router';
import { logoMarkup } from './logo';

/**
 * An arc of tool cards that slowly rotates by itself, like beads on a wheel: the card
 * at the top is upright and the others lean away along the curve. Each card uses the
 * blog-tile look (pixel art over a dark panel) and turns fully blue on hover. Rotation
 * pauses while the pointer is on a card or keyboard focus is on it, and stops for reduced motion.
 */
export interface ArcItem {
  route: PageRoute;
  name: string;
  hint: string;
}

const ART = ['/art/tile-formats.svg', '/art/tile-browser.svg'];
const DEGREES_PER_SECOND = 6;

export function renderArcCarousel(items: ArcItem[], label = 'Tools'): HTMLElement {
  const root = document.createElement('div');
  root.className = 'arc';
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', label);

  const stage = document.createElement('div');
  stage.className = 'arc__stage';
  const cards: HTMLElement[] = items.map((item, i) => {
    const card = document.createElement('div');
    card.className = 'arc__card';
    const a = document.createElement('a');
    a.className = 'arc-card';
    a.href = pathForRoute(item.route);
    a.innerHTML = `
      <span class="arc-card__art"><img src="${ART[i % ART.length]}" width="600" height="396" alt="" loading="lazy" decoding="async" class="${i % 4 >= 2 ? 'is-flipped' : ''}" /></span>
      <span class="arc-card__body">
        <span class="arc-card__name"></span>
        <span class="arc-card__hint"></span>
        <span class="arc-card__foot"><span class="arc-card__go" aria-hidden="true">Open &rarr;</span>${logoMarkup('arc-card__logo')}</span>
      </span>`;
    a.querySelector('.arc-card__name')!.textContent = item.name;
    a.querySelector('.arc-card__hint')!.textContent = item.hint;
    card.appendChild(a);
    stage.appendChild(card);
    return card;
  });
  root.appendChild(stage);

  start(root, stage, cards);
  return root;
}

function start(root: HTMLElement, stage: HTMLElement, cards: HTMLElement[]): void {
  const n = cards.length;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prerender = /HappyDOM/i.test(navigator.userAgent);

  let width = 1200;
  let radius = 900;
  let step = 17; // degrees between neighbouring cards
  let cardW = 220;
  let offset = 0; // current rotation in degrees
  let paused = false;
  let visible = true;
  let last = 0;

  const measure = (): void => {
    width = Math.min(root.clientWidth || 1200, window.innerWidth || 1200);
    const narrow = width < 700;
    step = narrow ? 28 : 14;
    radius = width * 0.9;
    cardW = Math.min(280, radius * Math.sin((step * Math.PI) / 180) * 0.8);
    const cardH = cardW * 1.5;
    // How far the curve has dropped at the screen's edge; the outer cards are allowed to run off the bottom.
    const edge = Math.asin(Math.min(1, width / 2 / radius));
    const drop = radius * (1 - Math.cos(edge));
    root.style.setProperty('--arc-card-w', `${cardW}px`);
    stage.style.height = `${Math.round(cardH + drop * 0.6 + cardW * 0.08)}px`;
  };

  const layout = (): void => {
    const span = n * step;
    cards.forEach((card, i) => {
      // Wrap each card's angle into [-span/2, span/2) so it re-enters from the far side.
      const angle = ((((i * step - offset) % span) + span * 1.5) % span) - span / 2;
      const rad = (angle * Math.PI) / 180;
      const x = radius * Math.sin(rad);
      const y = radius * (1 - Math.cos(rad));
      const fade = Math.max(0, Math.min(1, (span / 2 - Math.abs(angle)) / (step * 1.2)));
      card.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${angle.toFixed(2)}deg)`;
      card.style.opacity = String(fade);
      card.style.zIndex = String(100 - Math.round(Math.abs(angle)));
      card.style.pointerEvents = fade < 0.35 ? 'none' : '';
    });
  };

  measure();
  layout();
  root.classList.add('is-ready');
  if (reduced || prerender) return;

  let seen = false; // has the arc been attached to the page yet?
  const tick = (now: number): void => {
    if (root.isConnected) {
      if (!seen) {
        // First frame after it appears: start the clock here (a page change can attach it a moment late).
        seen = true;
        last = now;
      }
    } else if (seen) {
      return; // the page changed: stop for good
    } else {
      requestAnimationFrame(tick); // not attached yet: keep waiting
      return;
    }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!paused && visible) {
      offset += DEGREES_PER_SECOND * dt;
      layout();
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  // Only a card under the pointer stops it; the empty space around the arc does not.
  cards.forEach((card) => {
    card.addEventListener('pointerenter', () => (paused = true));
    card.addEventListener('pointerleave', () => (paused = false));
  });
  root.addEventListener('focusin', () => (paused = true));
  root.addEventListener('focusout', () => (paused = false));
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      measure();
      layout();
    }).observe(root);
  }
  if (typeof IntersectionObserver !== 'undefined') {
    new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
    }).observe(root);
  }
}
