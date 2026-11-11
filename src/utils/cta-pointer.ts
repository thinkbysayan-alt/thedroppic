/**
 * The character on the "Drop an image to get started" strip: he stands on the lower black line beside the
 * "Choose images" button, pointing at it, and gives a small repeated nudge toward it while the strip is on
 * screen. He is placed from the strip's measured line and button, so it works at any width. Desktop only; with
 * reduced motion he simply stands there without the nudge.
 */
import { loadGsap } from './motion';

// Natural size of the pointing picture.
const POINT = { w: 358, h: 496 };

let cleanup: (() => void) | null = null;

export async function initCtaPointer(root: HTMLElement): Promise<void> {
  cleanup?.();
  cleanup = null;
  const band = root.querySelector<HTMLElement>('.conv-cta');
  if (!band || /HappyDOM/i.test(navigator.userAgent)) return;
  if (!window.matchMedia('(min-width: 1000px)').matches) return;
  const conv = band.parentElement;
  const inner = band.querySelector<HTMLElement>('.conv-cta__inner');
  const button = band.querySelector<HTMLElement>('.conv-cta__btn');
  if (!conv || !inner || !button) return;

  const holder = document.createElement('div');
  holder.className = 'cta-pointer';
  holder.setAttribute('aria-hidden', 'true');
  const body = document.createElement('div');
  body.className = 'cta-pointer__body';
  const img = new Image();
  img.className = 'cta-pointer__img';
  img.src = '/art/pointer.webp';
  img.width = POINT.w;
  img.height = POINT.h;
  img.alt = '';
  img.decoding = 'async';
  body.appendChild(img);
  holder.appendChild(body);
  conv.appendChild(holder);

  // Stand on the lower line, with the fingertip a little way from the button.
  let height = 120;
  // Layout position of an element inside the page column, ignoring any transform on it or its parents (the strip
  // slides up 14px while it fades in, and measuring it mid-slide put the character too low).
  const within = (el: HTMLElement): { left: number; top: number; width: number; height: number } => {
    let left = 0;
    let top = 0;
    let node: HTMLElement | null = el;
    while (node && node !== conv) {
      left += node.offsetLeft;
      top += node.offsetTop;
      node = node.offsetParent as HTMLElement | null;
    }
    return { left, top, width: el.offsetWidth, height: el.offsetHeight };
  };

  const place = (): void => {
    const i = within(inner);
    const b = within(button);
    height = Math.round(Math.min(150, Math.max(96, i.height * 0.74)));
    const width = (height * POINT.w) / POINT.h;
    holder.style.width = `${width}px`;
    holder.style.height = `${height}px`;
    img.style.height = `${height}px`;
    // Stand left of the button and of the line of text under it, whichever reaches further left.
    const noteEl = band.querySelector<HTMLElement>('.conv-cta__action p');
    const edge = Math.min(b.left, noteEl ? within(noteEl).left : b.left);
    // The whole picture (motion lines included) stays left of the text, not just the fingertip.
    const x = edge - 16 - width;
    // Feet rest on top of the lower black line (the 1px border at the bottom of the strip).
    const y = i.top + i.height - 1 - height;
    holder.style.transform = `translate(${x}px, ${y}px)`;
  };
  place();

  // Measure again whenever anything that decides the spot changes size: the window, the strip, the button, the
  // line under it, and the page font arriving (which makes that line wider than it first measured).
  let ro: ResizeObserver | null = null;
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(place);
    for (const el of [conv, inner, button, band.querySelector<HTMLElement>('.conv-cta__action p')]) if (el) ro.observe(el);
  }
  void document.fonts?.ready.then(place);
  window.addEventListener('resize', place);
  cleanup = () => {
    window.removeEventListener('resize', place);
    ro?.disconnect();
    holder.remove();
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // The nudge: a few quick pushes toward the button, a pause, and again, only while the strip is on screen.
  const [gsap, st] = await Promise.all([loadGsap(), import('gsap/ScrollTrigger')]);
  if (!gsap || !holder.isConnected) return;
  gsap.registerPlugin(st.ScrollTrigger);
  const nudge = gsap
    .timeline({ repeat: -1, repeatDelay: 2.4, paused: true })
    .to(body, { x: () => Math.round(height * 0.05), duration: 0.13, ease: 'power2.out', yoyo: true, repeat: 3 });
  const trigger = st.ScrollTrigger.create({
    trigger: band,
    start: 'top 92%',
    end: 'bottom top',
    onToggle: (self) => (self.isActive ? nudge.play() : nudge.pause()),
  });
  const baseCleanup = cleanup;
  cleanup = () => {
    trigger.kill();
    nudge.kill();
    baseCleanup?.();
  };
}
