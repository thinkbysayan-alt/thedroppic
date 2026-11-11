/**
 * The character on the "Drop an image to get started" strip: he stands on the lower black line beside the
 * "Choose images" button, pointing at it, and gives a small repeated nudge toward it while the strip is on
 * screen. He is placed from the strip's measured line and button, so it works at any width. Desktop only; with
 * reduced motion he simply stands there without the nudge.
 */
import { loadGsap } from './motion';

// Natural size of the pointing picture, and how far along it the fingertip is.
const POINT = { w: 358, h: 496 };
const FINGERTIP = 0.915;

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
  const place = (): void => {
    const c = conv.getBoundingClientRect();
    const i = inner.getBoundingClientRect();
    const b = button.getBoundingClientRect();
    height = Math.round(Math.min(150, Math.max(96, i.height * 0.74)));
    const width = (height * POINT.w) / POINT.h;
    holder.style.width = `${width}px`;
    holder.style.height = `${height}px`;
    img.style.height = `${height}px`;
    const x = b.left - c.left - 14 - FINGERTIP * width;
    const y = i.bottom - c.top - 1 - height;
    holder.style.transform = `translate(${x}px, ${y}px)`;
  };
  place();

  let ro: ResizeObserver | null = null;
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(place);
    ro.observe(conv);
  }
  cleanup = () => {
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
