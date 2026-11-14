/**
 * The home page's scroll opening. The page itself never scrolls: five wheel notches (or a swipe, or the arrow /
 * page keys) play the whole story, and scrolling back plays it in reverse.
 *
 *   1. "Wrong format?" is all there is at first. A long shot of him standing there, head to feet, with a swarm of
 *      small flies near his face. One notch: "Not for long." comes in.
 *   2. The flies keep coming back at his face and he flinches away from them. The first paragraph comes in.
 *   3. The second paragraph comes in; the camera starts to push in to his face (the very same face, no swap).
 *   4. The buttons come in. Every fly leaves but one, which lands on his nose; his eyes settle on it.
 *   5. He screws his eyes shut, purses his lips and blows it off like hot soup (a second picture of the same face
 *      fades in for that moment). It goes, he relaxes, and what is left is the hero: a close-up whose eyes follow
 *      the cursor again.
 *
 * The words start centred in the left half ("Wrong format?" alone) and glide into their usual left-aligned place as
 * the other lines arrive.
 *
 * The long shot is its own picture (intro-body.webp); the close-up is cut from the very same picture
 * (character-front.webp, see character.ts / hair.ts), so the zoom hands over from one to the other with nothing
 * visibly changing. Without motion (reduced motion, no GSAP, very short windows) none of this is built and the
 * hero simply shows its final picture and all its text, exactly as before.
 */
import { loadGsap } from '../utils/motion';
import { EYES, SIZE, setClench } from './character';

/** The full-body picture: middle of the eyes (fractions of its width/height), eye gap and head height (of its height). */
const BODY = { eyeX: 0.5168, eyeY: 0.1891, gap: 0.0729, head: 0.27 };
/** The same points on the close-up picture, as fractions of its side. */
const HERO = { eyeX: 0.5075, eyeY: 0.546, gap: 0.211 };
/** The tip of his nose on the close-up picture, as fractions of its side (where a fly lands). */
const NOSE = { x: 0.5, y: 0.615 };

/** How many wheel notches play the whole opening. */
const NOTCHES = 5;

/**
 * The swarm. Each fly loops round its own spot (ox/oy, in head-heights from the middle of his eyes) with its own
 * loop size (k), speed (sp), starting phase (ph) and size (sz). Eight in all; the first is the one that lands.
 */
const FLIES = [
  { ox: 0, oy: -0.1, k: 1.0, sp: 1.0, ph: 0.0, sz: 1.0 },
  { ox: -0.75, oy: 0.15, k: 0.55, sp: 1.15, ph: 1.7, sz: 0.9 },
  { ox: 0.8, oy: 0.0, k: 0.6, sp: 0.9, ph: 3.1, sz: 1.0 },
  { ox: -0.5, oy: -0.7, k: 0.5, sp: 1.3, ph: 4.4, sz: 0.85 },
  { ox: 0.55, oy: -0.75, k: 0.5, sp: 1.1, ph: 2.2, sz: 0.95 },
  { ox: -0.9, oy: 0.7, k: 0.45, sp: 0.85, ph: 5.0, sz: 0.9 },
  { ox: 0.85, oy: 0.65, k: 0.5, sp: 1.0, ph: 0.6, sz: 1.0 },
  { ox: 0.0, oy: -1.0, k: 0.45, sp: 1.2, ph: 3.8, sz: 0.85 },
];

/** What the speech bubble says as the story goes on (the last line is the hero's own). */
const LINES = [
  'Another "unsupported file type"? Really?',
  "Not now! I'm trying to convert a HEIC here!",
  'Oh, come ON. On my nose?',
  "Go on, drop it. I don't bite.",
];

export function introWanted(): boolean {
  if (typeof window === 'undefined') return false;
  if (/HappyDOM/i.test(navigator.userAgent)) return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (window.innerHeight < 520) return false;
  if (window.innerHeight <= 620 && window.innerWidth <= 420) return false; // the picture is hidden there
  return true;
}

const FLY_SVG = `
<svg class="intro__fly" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
  <g class="intro__fly-wing intro__fly-wing--a"><ellipse cx="14" cy="14" rx="11" ry="5" transform="rotate(-35 14 14)"/></g>
  <g class="intro__fly-wing intro__fly-wing--b"><ellipse cx="26" cy="14" rx="11" ry="5" transform="rotate(35 26 14)"/></g>
  <ellipse cx="20" cy="24" rx="5.2" ry="8.5" fill="#15151a"/>
  <circle cx="20" cy="14.5" r="4.4" fill="#15151a"/>
  <circle cx="18.2" cy="13.6" r="1.4" fill="#d8352a"/><circle cx="21.8" cy="13.6" r="1.4" fill="#d8352a"/>
</svg>`;

/** Adds the long shot, the swarm, the ground shadow and the scroll hint to the character; returns a function that starts the opening. */
export function buildHomeIntro(character: HTMLElement, bubble: HTMLElement): () => void {
  const layer = document.createElement('div');
  layer.className = 'intro';
  layer.setAttribute('aria-hidden', 'true');
  character.classList.add('character--intro');
  character.closest('.home')?.classList.add('home--intro');
  layer.innerHTML = `
    <div class="intro__floor"></div>
    <div class="intro__shadow"></div>
    <div class="intro__bodybox"><img class="intro__body" src="/art/intro-body.webp" alt="" decoding="async" /></div>
    ${FLIES.map(() => FLY_SVG).join('')}
    <span class="intro__hint">Scroll<i></i></span>`;
  character.appendChild(layer);
  const blowFace = document.createElement('img');
  blowFace.className = 'character__blowimg';
  blowFace.src = '/art/character-blow.webp';
  blowFace.alt = '';
  blowFace.decoding = 'async';
  character.querySelector('.character__stage')?.appendChild(blowFace);
  bubble.textContent = LINES[0]!;
  bubble.style.animation = 'none'; // the opening fades and scales it itself, no pop-in
  bubble.style.opacity = '0';
  return () => {
    void run(character, layer, bubble);
  };
}

let cleanup: (() => void) | null = null;

/** Stops the opening of a previous visit (a new home page replaces it). */
export function stopHomeIntro(): void {
  cleanup?.();
  cleanup = null;
}

async function run(character: HTMLElement, layer: HTMLElement, bubble: HTMLElement): Promise<void> {
  stopHomeIntro();
  // The picture is built a moment before a page change attaches it; wait for that.
  for (let i = 0; i < 120 && !character.isConnected; i++) await new Promise((r) => requestAnimationFrame(r));
  const home = character.closest<HTMLElement>('.home');
  const cam = character.querySelector<HTMLElement>('.character__cam');
  const stage = character.querySelector<HTMLElement>('.character__stage');
  const svg = character.querySelector<SVGSVGElement>('.character__eyes');
  if (!home || !cam || !stage || !svg || !character.isConnected) return;

  const gsap = await loadGsap();
  if (!gsap || !character.isConnected) {
    character.classList.remove('character--intro');
    home.classList.remove('home--intro');
    bubble.textContent = LINES[LINES.length - 1]!;
    bubble.style.animation = '';
    bubble.style.opacity = '';
    layer.remove();
    return;
  }

  const flyEls = [...layer.querySelectorAll<SVGElement>('.intro__fly')];
  const hint = layer.querySelector<HTMLElement>('.intro__hint')!;
  const body = layer.querySelector<HTMLImageElement>('.intro__body')!;
  const bodyBox = layer.querySelector<HTMLElement>('.intro__bodybox')!;
  const shadow = layer.querySelector<HTMLElement>('.intro__shadow')!;
  const irises = EYES.map((_, i) => svg.querySelector<SVGGElement>(`.character__iris[data-eye="${i}"]`)!);
  const sub = home.querySelector<HTMLElement>('.home__sub');
  const lead = home.querySelector<HTMLElement>('.home__lead');
  const text = home.querySelector<HTMLElement>('.home__text');
  const actions = home.querySelector<HTMLElement>('.home__actions');
  const title = home.querySelector<HTMLElement>('.home__title');
  const strong = title?.querySelector<HTMLElement>('strong') ?? null;
  const blowFace = character.querySelector<HTMLElement>('.character__blowimg');
  const art = home.querySelector<HTMLElement>('.home__art');

  character.dataset.gaze = 'fly';
  setClench(character, 0);
  gsap.set(cam, { autoAlpha: 0 });
  document.documentElement.classList.add('home-intro-on');

  // The state the story drives: the camera (zoom 0 to 1, flinch), the swarm, the crossfade, the face and the bubble.
  const state = {
    zoom: 0,
    r: 0.9, speed: 2.2, op: 1, pull: 0, // the swarm
    rLead: 0.9, speedLead: 2.2, opLead: 1, land: 0, blown: 0, // the one fly that lands on his nose
    clench: 0, look: 0, blowMix: 0, gaze: 1, mix: 0, beat: 0,
    settle: 0, // the headline gliding from the centre to its left-aligned place
    lean: 0, // the close-up leaning back to breathe in, then forward to blow (a fraction of its size)
  };

  // Measured from the page: the area, the close-up picture, the standing figure and where its eyes are.
  let W = 0;
  let H = 0;
  let side = 0;
  let bodyH = 0;
  let eye0 = { x: 0, y: 0 }; // middle of the eyes in the long shot
  let eye1 = { x: 0, y: 0 }; // middle of the eyes in the close-up
  let zoomTo = 1; // how much the standing figure must grow for its eyes to match the close-up's
  let bubbleEnd = { x: 0, y: 0 }; // where the hero's speech bubble finally sits (from the stylesheet)
  let titleOff = { strongX: 0, subX: 0, y: 0 }; // how far the headline starts from its final place (to be centred)
  const textBox = (el: HTMLElement): DOMRect => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return range.getBoundingClientRect();
  };
  const measure = (): void => {
    // Where the words would sit with no offsets: the middle of the left half (the middle of the screen when stacked).
    if (title && strong) {
      gsap.set([title, strong, sub].filter(Boolean), { x: 0, y: 0 });
      const homeBox = home.getBoundingClientRect();
      const artBox = art?.getBoundingClientRect();
      const stacked = !art || getComputedStyle(art).position !== 'absolute';
      const centreX = stacked || !artBox ? homeBox.left + homeBox.width / 2 : (homeBox.left + artBox.left) / 2;
      const sBox = textBox(strong);
      titleOff = {
        strongX: centreX - (sBox.left + sBox.width / 2),
        subX: sub ? centreX - (sub.getBoundingClientRect().left + sub.getBoundingClientRect().width / 2) : 0,
        y: stacked ? 0 : homeBox.top + homeBox.height / 2 - (sBox.top + sBox.height / 2),
      };
    }
    W = character.clientWidth;
    H = character.clientHeight;
    side = stage.offsetWidth;
    bodyH = body.offsetHeight;
    const left = bodyBox.offsetLeft + body.offsetLeft;
    const top = bodyBox.offsetTop + body.offsetTop;
    eye0 = { x: left + BODY.eyeX * body.offsetWidth, y: top + BODY.eyeY * bodyH };
    eye1 = { x: (W - side) / 2 + HERO.eyeX * side, y: H - side + HERO.eyeY * side };
    zoomTo = (HERO.gap * side) / (BODY.gap * bodyH);
    body.style.transformOrigin = `${eye0.x - left}px ${eye0.y - top}px`;
    bubble.style.left = '';
    bubble.style.top = '';
    bubbleEnd = { x: bubble.offsetLeft, y: bubble.offsetTop };
  };
  measure();

  const angles = FLIES.map((f) => f.ph);
  const headings = FLIES.map(() => 0);
  const last: Array<{ x: number; y: number } | null> = FLIES.map(() => null);
  let lastBeat = 0;
  let lastBlowOn = false;
  let lastTime = performance.now();
  const tick = (): void => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    // The camera: the standing figure grows about his eyes while they slide to where the close-up's eyes are.
    const p = state.zoom;
    const scale = Math.pow(zoomTo, p);
    const ex = eye0.x + (eye1.x - eye0.x) * p;
    const ey = eye0.y + (eye1.y - eye0.y) * p;
    // The hand-over from the long shot to the close-up is a hard swap (never both on screen), so nothing ghosts.
    const heroOn = state.mix > 0.5;
    gsap.set(body, { scale, x: ex - eye0.x, y: ey - eye0.y, autoAlpha: heroOn ? 0 : 1 });
    gsap.set(cam, { autoAlpha: heroOn ? 1 : 0, scale: 1 + state.lean, transformOrigin: `${(W - side) / 2 + NOSE.x * side}px ${H - side + NOSE.y * side}px` });
    // The shadow stays on the ground: it fades as the camera leaves the floor.
    gsap.set(shadow, { autoAlpha: Math.max(0, 1 - p * 2.2) });

    // The words: "Wrong format?" starts centred in the left half and glides to its left-aligned place.
    if (title && strong) {
      const rest = 1 - state.settle;
      gsap.set(title, { y: titleOff.y * rest });
      gsap.set(strong, { x: titleOff.strongX * rest });
      if (sub) gsap.set(sub, { x: titleOff.subX * rest });
    }

    // The swarm: each fly loops smoothly round its own spot near his face (no jitter, steady speed), turning to
    // face the way it is flying. When he gets irritated they all close in on his face. The first fly later lands
    // on his nose, and is blown off it.
    const headH = BODY.head * bodyH * scale;
    const cy = ey - headH * 0.12;
    const reach = headH * 0.55;
    const size = Math.min(28, Math.max(9, headH * 0.05));
    const spread = 1 - 0.55 * state.pull;
    const noseX = (W - side) / 2 + NOSE.x * side;
    const noseY = H - side + NOSE.y * side;
    FLIES.forEach((f, i) => {
      const first = i === 0;
      angles[i] = angles[i]! + dt * (first ? state.speedLead : state.speed) * f.sp;
      const a = angles[i]!;
      const rr = first ? state.rLead : state.r;
      const x = Math.cos(a) * rr * f.k + 0.22 * Math.cos(a * 0.37 + f.ph);
      const y = Math.sin(a * 1.3) * rr * f.k * 0.55 + 0.16 * Math.sin(a * 0.53 + f.ph);
      let fx = ex + f.ox * headH * spread + x * reach;
      let fy = cy + f.oy * headH * spread + y * reach;
      if (first && state.land > 0) {
        // Settles on the tip of his nose, rubbing its legs a little.
        const wig = state.land > 0.95 ? Math.sin(now / 90) * 0.8 : 0;
        fx += (noseX + wig - fx) * state.land;
        fy += (noseY - size * 0.3 - fy) * state.land;
      }
      if (first && state.blown > 0) {
        // The puff of air sends it up and away.
        fx += state.blown * headH * 0.9;
        fy -= state.blown * headH * 0.8;
      }
      const prev = last[i];
      if (prev) {
        const landed = first && state.land > 0.6;
        const want = landed ? 0 : (Math.atan2(fy - prev.y, fx - prev.x) * 180) / Math.PI + 90;
        let diff = ((want - headings[i]! + 540) % 360) - 180;
        if (!Number.isFinite(diff)) diff = 0;
        headings[i] = headings[i]! + diff * 0.25;
      }
      last[i] = { x: fx, y: fy };
      const s2 = size * f.sz;
      gsap.set(flyEls[i]!, { x: fx - s2 / 2, y: fy - s2 / 2, width: s2, height: s2, rotation: headings[i]!, autoAlpha: first ? state.opLead : state.op });
    });

    // The face: it tightens, and the lips purse to blow. His eyes stay put until the fly lands on his nose; then
    // they settle on it (and nothing else) until it is blown off, after which they follow the cursor again.
    setClench(character, state.clench);
    if (blowFace) {
      // The blowing face replaces the close-up completely while he blows: the other picture, its moving hair and
      // its eyes are hidden, so no trace of the previous face shows through.
      const blowOn = state.blowMix > 0.5;
      if (blowOn !== lastBlowOn) {
        lastBlowOn = blowOn;
        blowFace.style.opacity = blowOn ? '1' : '0';
        stage.querySelectorAll<HTMLElement>('.character__img, .character__hair, .character__eyes').forEach((el) => {
          el.style.visibility = blowOn ? 'hidden' : '';
        });
      }
    }
    if (state.gaze > 0 && state.mix > 0.01) {
      EYES.forEach((e, i) => {
        const eyeX = (W - side) / 2 + (e.cx / SIZE) * side;
        const eyeY = H - side + (e.cy / SIZE) * side;
        const dx = noseX - eyeX;
        const dy = noseY - eyeY;
        const dist = Math.hypot(dx, dy) || 1;
        const restX = e.restX - e.cx;
        const restY = e.restY - e.cy;
        const focusX = (dx / dist) * e.reachX;
        const focusY = (dy / dist) * e.reachY;
        const k = state.look;
        irises[i]!.setAttribute('transform', `translate(${e.cx + restX + (focusX - restX) * k} ${e.cy + restY + (focusY - restY) * k})`);
      });
    }

    // The bubble hangs by his head in the long shot, small, and grows to its full size as the camera comes in.
    const ease = p * p * (3 - 2 * p);
    const bw = bubble.offsetWidth;
    const bh = bubble.offsetHeight;
    const headH0 = BODY.head * bodyH;
    const t0x = eye0.x - headH0 * 0.55 - 0.8 * bw;
    const t0y = eye0.y - headH0 * 0.62 - 1.1 * bh;
    bubble.style.left = `${t0x + (bubbleEnd.x - t0x) * ease}px`;
    bubble.style.top = `${t0y + (bubbleEnd.y - t0y) * ease}px`;
    bubble.style.scale = String(0.6 + 0.4 * ease);

    // The bubble's line follows the story, fading from one to the next.
    const beat = Math.round(state.beat);
    if (beat !== lastBeat) {
      lastBeat = beat;
      bubble.textContent = LINES[beat] ?? LINES[0]!;
      gsap.fromTo(bubble, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power1.out', overwrite: 'auto' });
    }
  };

  const release = (): void => {
    // Hand the eyes back to the cursor, starting from where the picture's own gaze rests.
    EYES.forEach((e, i) => irises[i]!.setAttribute('transform', `translate(${e.restX} ${e.restY})`));
    delete character.dataset.gaze;
  };
  let released = false;

  // The story, in 5 acts of 2.2 units (one per wheel notch).
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
  const rise = (el: HTMLElement | null, at: number): void => {
    if (el) tl.fromTo(el, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, at);
  };
  // Act 1: a long shot, flies drifting near his face. "Not for long." comes in under "Wrong format?", then the words
  // glide from the middle to the left.
  tl.to(hint, { autoAlpha: 0, duration: 0.5 }, 0);
  rise(sub, 0.5);
  tl.to(state, { settle: 1, duration: 1.8, ease: 'power2.inOut' }, 0.6);
  tl.to(state, { r: 0.95, rLead: 0.95, speed: 2.2, speedLead: 2.2, duration: 2.4 }, 0);
  // Act 2: the first paragraph comes in; the flies keep coming back at his face, closer and closer, and he gets
  // more and more irritated.
  rise(lead, 2.5);
  tl.set(state, { beat: 1 }, 2.6);
  tl.to(state, { r: 0.6, rLead: 0.6, speed: 2.8, speedLead: 2.8, pull: 1, duration: 3.4 }, 2.2);
  tl.to(state, { clench: 0.85, duration: 1.2, ease: 'power2.out' }, 2.4);
  // Act 3: the second paragraph comes in. (The camera has been easing in since the very first notch, so the picture
  // and the words always move together; it arrives at the close-up at 7.6.)
  rise(text, 4.7);
  tl.to(state, { zoom: 1, duration: 7.6, ease: 'power1.inOut' }, 0);
  // The long shot hands over to the close-up (the same pixels, lined up) in a single step, so nothing ghosts.
  tl.to(state, { mix: 1, duration: 0.05, ease: 'none' }, 7.58);
  // Act 4: all the flies but one leave; that one lands on his nose and his eyes settle on it.
  tl.to(state, { r: 2.6, speed: 4.5, op: 0, pull: 0, duration: 0.9, ease: 'power1.in' }, 7.0);
  tl.to(state, { rLead: 0.45, speedLead: 3, duration: 0.7 }, 7.1);
  tl.to(state, { land: 1, duration: 0.5, ease: 'power2.out' }, 7.7);
  tl.set(state, { beat: 2 }, 7.9);
  tl.to(state, { look: 1, duration: 0.4, ease: 'power2.inOut' }, 8.1);
  // Act 5: he screws his eyes shut and blows; the fly is blown away, he relaxes, and his eyes go back to the cursor.
  // He breathes in (leans back a touch), then leans into the blow as the picture changes to the blowing face.
  tl.to(state, { lean: -0.014, duration: 0.5, ease: 'sine.inOut' }, 8.4);
  tl.to(state, { lean: 0.03, duration: 0.45, ease: 'power2.out' }, 8.9);
  tl.to(state, { blowMix: 1, duration: 0.08, ease: 'none' }, 8.92);
  tl.to(state, { land: 0, rLead: 2.4, speedLead: 6, duration: 0.5, ease: 'power2.in' }, 9.5);
  tl.to(state, { blown: 1, duration: 0.8, ease: 'power2.in' }, 9.5);
  tl.to(state, { look: 0, duration: 0.4, ease: 'power2.inOut' }, 9.5);
  tl.to(state, { opLead: 0, duration: 0.5, ease: 'power1.in' }, 9.8);
  tl.to(state, { blowMix: 0, duration: 0.08, ease: 'none' }, 10.1);
  tl.to(state, { lean: 0, duration: 0.7, ease: 'sine.inOut' }, 10.1);
  tl.to(state, { clench: 0, duration: 0.8, ease: 'power1.inOut' }, 10.1);
  tl.set(state, { beat: 3 }, 10.3);
  // Only now, after the blow, do the buttons come in.
  rise(actions, 10.2);
  tl.to(state, { gaze: 0, duration: 0.01 }, 10.7);
  tl.to({}, { duration: 0.3 }, 10.7);
  const END = tl.duration();

  // Scroll: wheel notches, swipes and keys all move a target between 0 and 1; the story eases toward it.
  let target = 0;
  let current = 0;
  const move = (delta: number): void => {
    target = Math.min(1, Math.max(0, target + delta));
  };
  const onWheel = (e: WheelEvent): void => {
    if (e.ctrlKey) return; // pinch-zoom
    e.preventDefault();
    const px = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
    move(px / (100 * NOTCHES));
  };
  let touchY: number | null = null;
  const onTouchStart = (e: TouchEvent): void => {
    touchY = e.touches[0]?.clientY ?? null;
  };
  const onTouchMove = (e: TouchEvent): void => {
    const y = e.touches[0]?.clientY;
    if (y === undefined || touchY === null) return;
    move((touchY - y) / 600);
    touchY = y;
    e.preventDefault();
  };
  const onTouchEnd = (): void => {
    touchY = null;
  };
  const onKey = (e: KeyboardEvent): void => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const tag = (e.target as HTMLElement | null)?.tagName ?? '';
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
    const step = 1 / NOTCHES;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey && tag !== 'A' && tag !== 'BUTTON')) {
      move(step);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
      move(-step);
    } else if (e.key === 'End') {
      target = 1;
    } else if (e.key === 'Home') {
      target = 0;
    } else if (e.key === 'Tab') {
      target = 1; // so every button can be reached from the keyboard
    } else {
      return;
    }
    if (e.key !== 'Tab') e.preventDefault();
  };
  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('keydown', onKey);

  const loop = (_time: number, deltaMs: number): void => {
    // Ease toward the target (a little slower than the wheel, so a notch glides rather than snaps).
    const dt = Math.min(0.1, deltaMs / 1000);
    current += (target - current) * (1 - Math.exp(-dt * 5));
    if (Math.abs(target - current) < 0.0004) current = target;
    tl.time(current * END);
    // Once the opening is done the eyes belong to the cursor again; scrolling back takes them over once more.
    if (state.gaze <= 0 && !released) {
      released = true;
      release();
      return;
    }
    if (state.gaze > 0 && released) {
      released = false;
      character.dataset.gaze = 'fly';
    }
    tick();
  };
  gsap.ticker.add(loop);
  tl.time(0);
  tick();
  const onResize = (): void => {
    measure();
    tick();
  };
  window.addEventListener('resize', onResize);
  void document.fonts?.ready.then(onResize);

  // The area stays blank until the picture is ready, then everything fades in together (no flies flashing about
  // while the page loads).
  const ready = body.complete ? Promise.resolve() : body.decode().catch(() => undefined);
  void ready.then(() => {
    if (!character.isConnected) return;
    gsap.to(layer, { opacity: 1, duration: 0.5 });
    gsap.to(bubble, { opacity: 1, duration: 0.6, delay: 0.3 });
  });

  cleanup = () => {
    gsap.ticker.remove(loop);
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
    document.documentElement.classList.remove('home-intro-on');
    tl.kill();
    gsap.set([sub, lead, text, actions, title, strong].filter(Boolean), { clearProps: 'all' });
    stage.querySelectorAll<HTMLElement>('.character__img, .character__hair, .character__eyes').forEach((el) => (el.style.visibility = ''));
    blowFace?.remove();
    gsap.set(cam, { clearProps: 'all' });
    delete character.dataset.gaze;
    character.classList.remove('character--intro');
    home.classList.remove('home--intro');
    setClench(character, 0);
    layer.remove();
  };
}
