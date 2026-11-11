/**
 * Brand-blue cursor with a short sparkle trail. The pointer itself is a real CSS cursor (see
 * `html.has-custom-cursor` in site.css), so it never lags; the trail is a small canvas of fading
 * four-point stars drawn behind it. Only for mouse-like devices; the trail is skipped for reduced motion.
 */
const BLUE = ['#2563ff', '#2563ff', '#5b8cff', '#9db9ff'];

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  born: number;
  life: number;
  spin: number;
  color: string;
}

export function initCursor(): void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.documentElement.classList.add('has-custom-cursor');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'cursor-trail';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let dpr = 1;
  const resize = (): void => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
  };
  resize();
  window.addEventListener('resize', resize);

  const sparks: Spark[] = [];
  let raf = 0;
  let lastX = -1;
  let lastY = -1;

  const star = (s: Spark, t: number): void => {
    const k = 1 - t; // 1 -> 0 over its life
    const r = s.size * (0.35 + 0.65 * k);
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.spin * t);
    ctx.globalAlpha = Math.min(1, k * 1.4);
    ctx.fillStyle = s.color;
    ctx.beginPath();
    // Four-point star: long thin points, pinched waist.
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(r * 0.12, -r * 0.12, r, 0);
    ctx.quadraticCurveTo(r * 0.12, r * 0.12, 0, r);
    ctx.quadraticCurveTo(-r * 0.12, r * 0.12, -r, 0);
    ctx.quadraticCurveTo(-r * 0.12, -r * 0.12, 0, -r);
    ctx.fill();
    ctx.restore();
  };

  const frame = (now: number): void => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i]!;
      const t = (now - s.born) / s.life;
      if (t >= 1) {
        sparks.splice(i, 1);
        continue;
      }
      s.x += s.vx;
      s.y += s.vy;
      star(s, t);
    }
    raf = sparks.length ? requestAnimationFrame(frame) : 0;
  };

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (lastX >= 0 && dx * dx + dy * dy < 90) return; // one spark per ~10px of travel
      lastX = e.clientX;
      lastY = e.clientY;
      const now = performance.now();
      for (let n = 0; n < 2; n++) {
        if (sparks.length > 70) sparks.shift();
        sparks.push({
          x: e.clientX + 3 + (Math.random() - 0.5) * 8,
          y: e.clientY + 3 + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 0.7,
          vy: 0.15 + Math.random() * 0.5,
          size: 4 + Math.random() * 6,
          born: now,
          life: 450 + Math.random() * 400,
          spin: (Math.random() - 0.5) * 3,
          color: BLUE[Math.floor(Math.random() * BLUE.length)]!,
        });
      }
      if (!raf) raf = requestAnimationFrame(frame);
    },
    { passive: true },
  );
}
