/**
 * The home-page character: a still picture with live eyes. The picture's own
 * pupils are covered by a patch of eye-white, and a new iris, pupil and
 * highlight (clipped to the eye opening) follow the pointer. All coordinates
 * are in the picture's own 1254 x 1254 space, so the overlay scales with it.
 */
const SIZE = 1254;

interface EyeSpec {
  /** Centre and radii of the visible eye-white. */
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotate: number;
  /** Where the picture's own iris sits (the gaze when the pointer is away). */
  restX: number;
  restY: number;
  /** Iris radius and how far it may travel from the eye's centre. */
  iris: number;
  reachX: number;
  reachY: number;
}

const EYES: EyeSpec[] = [
  { cx: 579, cy: 534, rx: 76, ry: 62, rotate: 4, restX: 617, restY: 509, iris: 28, reachX: 42, reachY: 30 },
  { cx: 804, cy: 502, rx: 60, ry: 60, rotate: 8, restX: 826, restY: 477, iris: 27, reachX: 30, reachY: 30 },
];


function eyeMarkup(e: EyeSpec, i: number): string {
  const clip = `eye-clip-${i}`;
  const white = `eye-white-${i}`;
  const iris = `eye-iris-${i}`;
  const rest = `translate(${e.restX - e.cx} ${e.restY - e.cy})`;
  return `
    <clipPath id="${clip}"><ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" transform="rotate(${e.rotate} ${e.cx} ${e.cy})"/></clipPath>
    <radialGradient id="${white}" cx="50%" cy="55%" r="60%">
      <stop offset="0" stop-color="#ffffff"/><stop offset="0.75" stop-color="#fbf8f8"/><stop offset="1" stop-color="#e4dcdd"/>
    </radialGradient>
    <radialGradient id="${iris}" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#d4762a"/><stop offset="0.62" stop-color="#a9561a"/><stop offset="1" stop-color="#5b2a0e"/>
    </radialGradient>
    <g clip-path="url(#${clip})">
      <ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx + 6}" ry="${e.ry + 6}" fill="url(#${white})"/>
      <g class="character__iris" data-eye="${i}" transform="translate(${e.cx} ${e.cy}) ${rest}">
        <circle r="${e.iris}" fill="url(#${iris})"/>
        <circle r="${e.iris * 0.52}" fill="#0b0a0c"/>
        <ellipse cx="${e.iris * 0.22}" cy="${-e.iris * 0.24}" rx="${e.iris * 0.15}" ry="${e.iris * 0.14}" fill="#fff"/>
      </g>
      <ellipse cx="${e.cx}" cy="${e.cy - e.ry * 0.9}" rx="${e.rx * 1.05}" ry="${e.ry * 0.45}" fill="#6b4a4a" opacity="0.16"/>
    </g>`;
}

/** Builds the picture plus its eye overlay. */
export function renderCharacter(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'character';
  wrap.innerHTML = `
    <div class="character__stage">
      <img class="character__img" src="/art/character-cut.webp" width="1000" height="1000" alt="Illustrated character with round glasses, looking at your cursor" fetchpriority="high" decoding="async" />
      <svg class="character__eyes" viewBox="0 0 ${SIZE} ${SIZE}" aria-hidden="true" focusable="false">${EYES.map(eyeMarkup).join('')}</svg>
    </div>
  `;
  return wrap;
}

/** Makes the eyes follow the pointer. Stops by itself once the picture leaves the page. */
export function trackEyes(wrap: HTMLElement): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const svg = wrap.querySelector<SVGSVGElement>('.character__eyes');
  if (!svg) return;
  const irises = EYES.map((_, i) => svg.querySelector<SVGGElement>(`.character__iris[data-eye="${i}"]`)!);
  // Current and target offsets from each eye's centre, in picture units.
  const cur = EYES.map((e) => ({ x: e.restX - e.cx, y: e.restY - e.cy }));
  const target = cur.map((c) => ({ ...c }));
  let pointer: { x: number; y: number } | null = null;
  let raf = 0;

  const aim = (): void => {
    const rect = svg.getBoundingClientRect();
    const k = rect.width / SIZE;
    EYES.forEach((e, i) => {
      if (!pointer) {
        target[i] = { x: e.restX - e.cx, y: e.restY - e.cy };
        return;
      }
      const dx = pointer.x - (rect.left + e.cx * k);
      const dy = pointer.y - (rect.top + e.cy * k);
      const dist = Math.hypot(dx, dy) || 1;
      // Full travel once the pointer is about one picture-width away; gentle near the eye.
      const strength = Math.min(1, dist / (rect.width * 0.9));
      target[i] = { x: (dx / dist) * e.reachX * strength, y: (dy / dist) * e.reachY * strength };
    });
  };

  const frame = (): void => {
    if (!wrap.isConnected) {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      return;
    }
    let moving = false;
    EYES.forEach((e, i) => {
      const c = cur[i]!;
      const t = target[i]!;
      c.x += (t.x - c.x) * 0.18;
      c.y += (t.y - c.y) * 0.18;
      if (Math.abs(t.x - c.x) > 0.05 || Math.abs(t.y - c.y) > 0.05) moving = true;
      irises[i]!.setAttribute('transform', `translate(${e.cx + c.x} ${e.cy + c.y})`);
    });
    raf = moving ? requestAnimationFrame(frame) : 0;
  };
  const kick = (): void => {
    if (!raf) raf = requestAnimationFrame(frame);
  };
  const onMove = (ev: PointerEvent): void => {
    pointer = { x: ev.clientX, y: ev.clientY };
    aim();
    kick();
  };
  const onLeave = (): void => {
    pointer = null;
    aim();
    kick();
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave);
  window.addEventListener('blur', onLeave);
}
