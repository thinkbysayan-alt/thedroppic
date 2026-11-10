/**
 * Generates the site's glitch-line illustrations (public/art/*.svg).
 *
 * Every image is a simple solid shape (an image icon, a chip, a padlock) drawn as horizontal scanlines: line thickness follows how
 * much of the band the shape covers, then a seeded "glitch" pass shifts some
 * bands sideways, slices blocks out of register and smears long streaks off
 * the right edge. Output is plain black strokes on a transparent background,
 * so the same file works on the light theme and (inverted with CSS) the dark one.
 *
 * Dependency-free and deterministic: `npm run art` always rewrites identical files.
 */
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('public/art');

// ---------- tiny seeded PRNG ----------
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- shapes: each is (x, y) => boolean ----------
const rect = (x, y, w, h) => (px, py) => px >= x && px < x + w && py >= y && py < y + h;
const rrect = (x, y, w, h, r) => (px, py) => {
  if (px < x || px >= x + w || py < y || py >= y + h) return false;
  const cx = Math.min(Math.max(px, x + r), x + w - r);
  const cy = Math.min(Math.max(py, y + r), y + h - r);
  return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
};
const circle = (cx, cy, r) => (px, py) => (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
const tri = (ax, ay, bx, by, cx, cy) => (px, py) => {
  const d = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
  const u = ((px - ax) * (cy - ay) - (cx - ax) * (py - ay)) / d;
  const v = ((bx - ax) * (py - ay) - (px - ax) * (by - ay)) / d;
  return u >= 0 && v >= 0 && u + v <= 1;
};
const shift = (fn, dx, dy = 0) => (x, y) => fn(x - dx, y - dy);
const union = (...fns) => (x, y) => fns.some((f) => f(x, y));
const minus = (a, b) => (x, y) => a(x, y) && !b(x, y);
const both = (a, b) => (x, y) => a(x, y) && b(x, y);
const outline = (x, y, w, h, r, t) => minus(rrect(x, y, w, h, r), rrect(x + t, y + t, w - 2 * t, h - 2 * t, Math.max(0, r - t)));

// ---------- scanline + glitch renderer ----------
function render({ W, H, S, shape, shade = () => 0.45, seed, glitch }) {
  const rnd = mulberry32(seed);
  const bands = Math.floor(H / S);
  const shift = new Float32Array(bands);
  const g = { jitterP: 0.1, jitterMax: 26, slices: 3, sliceMax: 55, streakP: 0.12, streakMax: 520, dropP: 0.1, ...glitch };

  for (let b = 0; b < bands; b++) if (rnd() < g.jitterP) shift[b] += (rnd() - 0.5) * 2 * g.jitterMax;
  for (let k = 0; k < g.slices; k++) {
    const start = Math.floor(rnd() * bands);
    const len = 3 + Math.floor(rnd() * 6);
    const dx = (rnd() - 0.5) * 2 * g.sliceMax;
    for (let b = start; b < Math.min(bands, start + len); b++) shift[b] += dx;
  }

  const lines = []; // { y, x1, x2, w }
  const sub = [-0.36, -0.12, 0.12, 0.36];

  for (let b = 0; b < bands; b++) {
    const yc = (b + 0.5) * S;
    const runs = [];
    let start = null;
    let covSum = 0;
    let covN = 0;
    for (let x = 0; x <= W; x += 2) {
      let c = 0;
      for (const f of sub) if (shape(x, yc + f * S)) c++;
      c /= sub.length;
      if (c >= 0.5) {
        if (start === null) {
          start = x;
          covSum = 0;
          covN = 0;
        }
        covSum += c;
        covN++;
      } else if (start !== null) {
        runs.push({ x1: start, x2: x, cov: covSum / covN });
        start = null;
      }
    }
    if (start !== null) runs.push({ x1: start, x2: W, cov: covSum / covN });

    runs.forEach((run, i) => {
      const mid = (run.x1 + run.x2) / 2;
      const w = S * Math.min(0.8, Math.max(0.12, 0.14 + 0.6 * shade(mid, yc) * (0.6 + 0.4 * run.cov)));
      const dx = shift[b];

      // occasional dropout: cut a gap out of a long run
      if (run.x2 - run.x1 > 140 && rnd() < g.dropP) {
        const gapAt = run.x1 + 30 + rnd() * (run.x2 - run.x1 - 90);
        const gapLen = 10 + rnd() * 38;
        lines.push({ y: yc, x1: run.x1 + dx, x2: gapAt + dx, w });
        lines.push({ y: yc, x1: gapAt + gapLen + dx, x2: run.x2 + dx, w });
      } else {
        lines.push({ y: yc, x1: run.x1 + dx, x2: run.x2 + dx, w });
      }

      // speed-line streak off the right-most run
      if (i === runs.length - 1 && rnd() < g.streakP) {
        const from = run.x2 + dx + rnd() * 20;
        lines.push({ y: yc, x1: from, x2: Math.min(W, from + 100 + rnd() * g.streakMax), w: S * (0.1 + rnd() * 0.08) });
      }
    });
  }

  // smeared block of streaks bleeding to the right edge
  for (const block of [].concat(g.smear ?? [])) {
    const { from, to, xMin, density } = block;
    for (let b = Math.floor(bands * from); b < Math.floor(bands * to); b++) {
      if (rnd() > density) continue;
      const x1 = W * xMin + rnd() * W * 0.22;
      const thick = rnd() < 0.18;
      lines.push({ y: (b + 0.5) * S, x1, x2: rnd() < 0.8 ? W : W - rnd() * W * 0.12, w: S * (thick ? 0.3 : 0.1 + rnd() * 0.1) });
    }
  }

  // mirror image of the smear: streaks bleeding off the left edge
  if (g.smearLeft) {
    const { from, to, xMax, density } = g.smearLeft;
    for (let b = Math.floor(bands * from); b < Math.floor(bands * to); b++) {
      if (rnd() > density) continue;
      const thick = rnd() < 0.18;
      lines.push({ y: (b + 0.5) * S, x1: rnd() < 0.8 ? 0 : rnd() * W * 0.1, x2: W * xMax - rnd() * W * 0.2, w: S * (thick ? 0.3 : 0.1 + rnd() * 0.1) });
    }
  }

  // ghost lines: a thin echo nudged off-axis
  for (const l of lines.slice()) {
    if (l.w > S * 0.3 && rnd() < 0.03) lines.push({ y: l.y + (rnd() < 0.5 ? -1 : 1) * S * 0.5, x1: l.x1 + 12, x2: l.x2 - 12, w: S * 0.1 });
  }

  // group by quantised stroke width so the SVG stays small
  const groups = new Map();
  for (const l of lines) {
    const x1 = Math.max(0, Math.min(W, l.x1));
    const x2 = Math.max(0, Math.min(W, l.x2));
    if (x2 - x1 < 2) continue;
    const key = (Math.round(l.w * 2) / 2).toFixed(1);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(`M${Math.round(x1)} ${l.y.toFixed(1)}H${Math.round(x2)}`);
  }

  const paths = [...groups.entries()]
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([w, d]) => `<path stroke-width="${w}" d="${d.join('')}"/>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" fill="none" stroke="#000">${paths}</svg>\n`;
}

// ---------- blue pixel-dither tiles (blog) ----------
/**
 * A field of square dots that thins out toward the top and rises toward one
 * side, ending in a solid band along the bottom edge so it meets the dark
 * panel of a blog tile. CTA blue on a transparent background.
 */
function renderDots({ W, H, cell, seed, flip = false }) {
  const rnd = mulberry32(seed);
  const cols = Math.floor(W / cell);
  const rows = Math.floor(H / cell);
  const d = [];
  const add = (x, y, w, h) => d.push(`M${x} ${y}h${w}v${h}h-${w}z`);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const nx = flip ? 1 - c / (cols - 1) : c / (cols - 1);
      const ny = r / (rows - 1);
      const boundary = 0.6 - 0.44 * nx + 0.05 * Math.sin(nx * 9 + seed);
      const t = (ny - boundary) / (1 - boundary);
      if (t <= 0) continue;
      const solid = r >= rows - 2;
      const p = solid ? 1 : Math.min(1, Math.pow(t, 1.05) * (0.55 + 0.65 * nx));
      if (!solid && rnd() > p) continue;
      const size = solid ? cell : Math.max(4, Math.round(cell * (0.4 + 0.6 * Math.min(1, t * 1.15))));
      const x = c * cell + Math.round((cell - size) / 2);
      const y = r * cell + Math.round((cell - size) / 2);
      add(x, y, size, size);
      if (!solid && rnd() < 0.1 * t) add(x, y + size, size, Math.min(H - y - size, cell * (1 + Math.floor(rnd() * 3))));
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" fill="#2563ff"><path d="${d.join('')}"/></svg>
`;
}

const TILES = [
  { name: 'tile-formats', W: 600, H: 396, cell: 12, seed: 3 },
  { name: 'tile-browser', W: 600, H: 396, cell: 12, seed: 9, flip: true },
];

// ---------- the illustrations ----------
const imageFrame = () => {
  const inner = rrect(180, 230, 540, 540, 100);
  const frame = outline(120, 170, 660, 660, 150, 60);
  const sun = circle(590, 350, 70);
  const hillLeft = both(tri(170, 770, 400, 490, 630, 770), inner);
  const hillRight = both(tri(440, 770, 600, 610, 760, 770), inner);
  return union(frame, sun, hillLeft, hillRight);
};

/** An image icon (frame, sun, hills) fitted to the box (x, y, w, h), so it can be wide as well as square. */
const imageIconBox = (x, y, w, h) => {
  const t = Math.min(w, h) * 0.1;
  const inner = rrect(x + t, y + t, w - 2 * t, h - 2 * t, Math.min(w, h) * 0.12);
  return union(
    outline(x, y, w, h, Math.min(w, h) * 0.22, t),
    circle(x + w * 0.72, y + h * 0.33, Math.min(w, h) * 0.1),
    both(tri(x + w * 0.06, y + h, x + w * 0.36, y + h * 0.5, x + w * 0.66, y + h), inner),
    both(tri(x + w * 0.5, y + h, x + w * 0.68, y + h * 0.7, x + w * 0.86, y + h), inner),
  );
};

const arrowRight = (x, y, len) => union(rect(x, y - 20, len - 70, 40), tri(x + len - 90, y - 70, x + len - 90, y + 70, x + len, y));

/** A small image icon (frame, sun, hills) at (x, y) with side `size`. */
const miniImage = (x, y, size) => {
  const t = size * 0.11;
  const inner = rrect(x + t, y + t, size - 2 * t, size - 2 * t, size * 0.1);
  return union(
    outline(x, y, size, size, size * 0.2, t),
    circle(x + size * 0.68, y + size * 0.34, size * 0.09),
    both(tri(x + size * 0.1, y + size, x + size * 0.38, y + size * 0.56, x + size * 0.66, y + size), inner),
    both(tri(x + size * 0.5, y + size, x + size * 0.7, y + size * 0.7, x + size * 0.9, y + size), inner),
  );
};

/** A frame filled with a checkerboard: the universal "this has transparency" picture. */
const checkerImage = (x, y, size) => {
  const t = size * 0.11;
  const cell = (size - 2 * t) / 4;
  const squares = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if ((r + c) % 2 === 0) squares.push(rect(x + t + c * cell, y + t + r * cell, cell, cell));
  return union(outline(x, y, size, size, size * 0.2, t), both(union(...squares), rrect(x + t, y + t, size - 2 * t, size - 2 * t, size * 0.1)));
};

/** A phone: tall rounded outline, speaker slot and a picture on its screen. */
const phone = (x, y, w, h) => {
  const t = 36;
  const screen = rrect(x + t, y + t + 20, w - 2 * t, h - 2 * t - 20, 14);
  return union(
    outline(x, y, w, h, 56, t),
    rect(x + w / 2 - 28, y + 16, 56, 14),
    circle(x + w * 0.66, y + h * 0.4, 26),
    both(tri(x + t, y + h - t, x + w * 0.4, y + h * 0.5, x + w - t, y + h - t), screen),
  );
};

/** Left picture, arrow, right picture. Each converter shows what goes in and what comes out. */
const pair = (left, right) => union(left, arrowRight(560, 240, 380), right);

const tray = () => union(rect(110, 470, 380, 50), rect(110, 400, 50, 120), rect(440, 400, 50, 120));
const downArrow = (cx, top, bottom) => union(rect(cx - 30, top, 60, bottom - top - 70), tri(cx - 110, bottom - 90, cx + 110, bottom - 90, cx, bottom));

const PAIR_GLITCH = { jitterP: 0.05, jitterMax: 10, slices: 1, sliceMax: 24, dropP: 0.04, streakP: 0.12, streakMax: 340 };

const ART = [
  {
    name: 'hero',
    W: 1250,
    H: 1000,
    S: 9,
    seed: 7,
    shape: imageIconBox(20, 127, 968, 863),
    shade: (x, y) => 0.3 + 0.7 * (y / 1000),
    glitch: {
      jitterP: 0.05,
      jitterMax: 12,
      slices: 2,
      sliceMax: 30,
      dropP: 0.05,
      streakP: 0.24,
      streakMax: 360,
      smear: [
        { from: 0.0, to: 0.13, xMin: 0.46, density: 0.9 },
        { from: 0.13, to: 0.42, xMin: 0.8, density: 0.7 },
      ],
    },
  },
  {
    name: 'lock-sm',
    W: 460,
    H: 600,
    S: 10,
    seed: 5,
    shape: union(
      minus(rrect(40, 300, 380, 290, 34), union(circle(230, 420, 36), rect(214, 430, 32, 100))),
      minus(both(circle(230, 230, 150), rect(0, 0, 460, 230)), circle(230, 230, 100)),
      rect(80, 230, 50, 100),
      rect(330, 230, 50, 100),
    ),
    shade: () => 0.95,
    glitch: { jitterP: 0.06, jitterMax: 8, slices: 1, sliceMax: 14, dropP: 0.05, streakP: 0.06, streakMax: 90 },
  },
  { name: 'jpeg-to-png', W: 1600, H: 480, S: 12, seed: 11, shape: pair(miniImage(120, 60, 360), checkerImage(1030, 60, 360)), shade: () => 0.5, glitch: PAIR_GLITCH },
  { name: 'png-to-jpeg', W: 1600, H: 480, S: 12, seed: 13, shape: pair(checkerImage(120, 60, 360), miniImage(1030, 60, 360)), shade: () => 0.5, glitch: PAIR_GLITCH },
  { name: 'heic-to-jpeg', W: 1600, H: 480, S: 12, seed: 17, shape: pair(phone(190, 40, 230, 400), miniImage(1030, 60, 360)), shade: () => 0.5, glitch: PAIR_GLITCH },
  { name: 'step-drop', W: 600, H: 600, S: 8, seed: 21, shape: union(tray(), downArrow(300, 70, 430)), shade: () => 0.55, glitch: { jitterP: 0.05, jitterMax: 10, slices: 1, sliceMax: 20, dropP: 0.05, streakP: 0.1, streakMax: 200 } },
  {
    name: 'step-convert',
    W: 600,
    H: 600,
    S: 8,
    seed: 23,
    shape: union(
      outline(150, 150, 300, 300, 36, 46),
      rrect(222, 222, 156, 156, 14),
      ...[0, 1, 2].flatMap((i) => [rect(190 + i * 90, 96, 32, 54), rect(190 + i * 90, 450, 32, 54), rect(96, 190 + i * 90, 54, 32), rect(450, 190 + i * 90, 54, 32)]),
    ),
    glitch: { jitterP: 0.05, jitterMax: 10, slices: 1, sliceMax: 20, dropP: 0.05, streakP: 0.1, streakMax: 200 },
  },
  {
    name: 'step-download',
    W: 600,
    H: 600,
    S: 8,
    seed: 27,
    shape: union(outline(150, 70, 300, 460, 30, 38), downArrow(300, 170, 440)),
    glitch: { jitterP: 0.05, jitterMax: 10, slices: 1, sliceMax: 20, dropP: 0.05, streakP: 0.1, streakMax: 200 },
  },
  {
    name: 'lock',
    W: 800,
    H: 800,
    S: 9,
    seed: 31,
    shape: union(
      minus(rrect(170, 340, 460, 360, 44), union(circle(400, 490, 48), rect(380, 500, 40, 110))),
      minus(both(circle(400, 250, 170), rect(0, 0, 800, 250)), circle(400, 250, 110)),
      rect(230, 250, 60, 100),
      rect(510, 250, 60, 100),
    ),
    shade: (x, y) => 0.55 + 0.4 * (y / 800),
    glitch: { jitterP: 0.05, jitterMax: 10, slices: 1, sliceMax: 24, streakP: 0.14, streakMax: 280, smear: { from: 0.1, to: 0.4, xMin: 0.74, density: 0.8 } },
  },
  {
    name: 'docs',
    W: 800,
    H: 800,
    S: 9,
    seed: 37,
    shape: union(
      minus(outline(290, 90, 380, 500, 30, 42), rrect(150, 230, 380, 500, 30)),
      outline(150, 230, 380, 500, 30, 42),
      ...[0, 1, 2].map((i) => rect(215, 330 + i * 90, 250, 30)),
      rect(215, 600, 150, 30),
    ),
    shade: () => 0.62,
    glitch: { jitterP: 0.06, jitterMax: 12, slices: 1, sliceMax: 24, streakP: 0.14, streakMax: 260, smear: { from: 0.04, to: 0.3, xMin: 0.8, density: 0.7 } },
  },
  {
    name: 'not-found',
    W: 800,
    H: 800,
    S: 9,
    seed: 41,
    shape: minus(miniImage(120, 150, 520), (x, y) => Math.abs(x - 380 - (y - 410) * 0.45) < 26),
    shade: () => 0.6,
    glitch: { jitterP: 0.08, jitterMax: 14, slices: 2, sliceMax: 34, streakP: 0.18, streakMax: 300, smear: { from: 0.12, to: 0.4, xMin: 0.78, density: 0.7 } },
  },
];

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const tile of TILES) {
  const svg = renderDots(tile);
  fs.writeFileSync(path.join(OUT_DIR, `${tile.name}.svg`), svg);
  console.log(`${tile.name.padEnd(14)} ${(svg.length / 1024).toFixed(1)} KB`);
}
for (const art of ART) {
  const svg = render(art);
  fs.writeFileSync(path.join(OUT_DIR, `${art.name}.svg`), svg);
  console.log(`${art.name.padEnd(14)} ${(svg.length / 1024).toFixed(1)} KB`);
}
