/**
 * The home-page character: a still picture with live eyes. The picture's own
 * pupils are covered by a patch of eye-white, and a new iris, pupil and
 * highlight (clipped to the eye opening) follow the pointer. All coordinates
 * are in the picture's own 1000 x 1000 space, so the overlay scales with it.
 */
export const SIZE = 1000;

export interface EyeSpec {
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

export const EYES: EyeSpec[] = [
  { cx: 402, cy: 553, rx: 68, ry: 58, rotate: 0, restX: 414, restY: 556, iris: 38, reachX: 28, reachY: 20 },
  { cx: 613, cy: 539, rx: 68, ry: 58, rotate: 0, restX: 575, restY: 547, iris: 38, reachX: 28, reachY: 20 },
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
      <ellipse class="character__lid" data-lid="top" data-eye="${i}" cx="${e.cx}" cy="${e.cy - e.ry - 14}" rx="${e.rx + 16}" ry="0" fill="#eda47e" stroke="#c07a58" stroke-width="3.5"/>
      <ellipse class="character__lid" data-lid="bottom" data-eye="${i}" cx="${e.cx}" cy="${e.cy + e.ry + 14}" rx="${e.rx + 16}" ry="0" fill="#f1ab86" stroke="#cf8a66" stroke-width="2.5"/>
      <ellipse cx="${e.cx}" cy="${e.cy - e.ry * 0.9}" rx="${e.rx * 1.05}" ry="${e.ry * 0.45}" fill="#6b4a4a" opacity="0.16"/>
    </g>`;
}


/** Builds the picture plus its eye overlay. */
export function renderCharacter(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'character';
  wrap.innerHTML = `
    <div class="character__cam">
      <div class="character__stage">
        <img class="character__img" src="/art/character-front.webp" width="1064" height="1064" alt="Illustrated character with round glasses and a small smile, looking at you" fetchpriority="high" decoding="async" />
        <svg class="character__eyes" viewBox="0 0 ${SIZE} ${SIZE}" aria-hidden="true" focusable="false">${EYES.map(eyeMarkup).join('')}</svg>
      </div>
    </div>
  `;
  return wrap;
}

/**
 * Screws the face up in annoyance, 0 (calm) to 1 (fully irritated): the lids close in on the eyes here, and the hair
 * canvas (hair.ts) reads the same number to pull the brows down and the corners of the mouth down.
 */
export function setClench(wrap: HTMLElement, k: number): void {
  wrap.dataset.clench = k.toFixed(3);
  wrap.querySelectorAll<SVGEllipseElement>('.character__lid').forEach((lid) => {
    const e = EYES[Number(lid.dataset.eye)]!;
    // Each lid is a big ellipse parked outside the eye whose reach into it grows with k, so its edge is curved.
    lid.setAttribute('ry', String(k * (lid.dataset.lid === 'top' ? e.ry * 0.62 + 14 : e.ry * 0.3 + 14)));
  });
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

  // The picture is built a moment before a page change puts it on screen. Until it has been attached once, a pointer
  // move must not count as "the page is gone"; only stop listening after it has been shown and then removed.
  let seen = false;
  const frame = (): void => {
    if (wrap.dataset.gaze) {
      raf = 0; // the opening's fly is steering the eyes (home-intro.ts)
      return;
    }
    if (!wrap.isConnected) {
      raf = 0;
      if (seen) {
        window.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerleave', onLeave);
        window.removeEventListener('blur', onLeave);
      }
      return;
    }
    seen = true;
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
