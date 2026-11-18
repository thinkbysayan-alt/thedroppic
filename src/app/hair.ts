/**
 * A faint, natural breeze through the home-page character's hair. The picture is drawn on a small
 * WebGL canvas and only the hair (top and sides of the head, fading out above the eyebrows and
 * glasses) is bent by a hair-width, by slow overlapping gusts. It does not react to the cursor. The face,
 * glasses and eyes never move. If WebGL is missing, or motion is reduced, the plain picture stays.
 */
const VERT = `
attribute vec2 a;
varying vec2 uv;
void main() {
  uv = vec2(a.x * 0.5 + 0.5, 0.5 - a.y * 0.5);
  gl_Position = vec4(a, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
varying vec2 uv;
uniform sampler2D tex;
uniform vec2 sway;
uniform float time;

float hairMask(vec2 p) {
  float top = 1.0 - smoothstep(0.20, 0.27, p.y);
  float left = (1.0 - smoothstep(0.28, 0.34, p.x)) * (1.0 - smoothstep(0.35, 0.41, p.y));
  float right = smoothstep(0.76, 0.80, p.x) * (1.0 - smoothstep(0.24, 0.30, p.y));
  return max(top, max(left, right));
}

void main() {
  float m = hairMask(uv);
  // Hair further from the scalp moves more than the roots.
  float lever = pow(clamp(length(uv - vec2(0.52, 0.28)) / 0.5, 0.0, 1.0), 1.4);
  float w = m * lever;
  vec2 d = sway * w;
  // Soft travelling ripple so strands bend smoothly rather than wobble.
  d.x += 0.002 * w * sin(time * 1.3 + uv.y * 6.0 + uv.x * 3.5) * (0.65 + 0.35 * sin(time * 0.5));
  d.y += 0.001 * w * sin(time * 1.0 + uv.x * 5.0 + 1.7);
  gl_FragColor = texture2D(tex, uv - d);
}`;

/** Slow, overlapping gusts, in picture widths (about 4 px at the hair tips on a typical screen). */
function gust(t: number): { x: number; y: number } {
  const g = Math.sin(t * 0.9) * 0.5 + Math.sin(t * 0.53 + 1.3) * 0.35 + Math.sin(t * 1.7 + 0.4) * 0.15;
  return { x: g * 0.005, y: Math.sin(t * 0.7 + 2.0) * 0.0016 };
}

export function trackHair(wrap: HTMLElement): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (/HappyDOM/i.test(navigator.userAgent)) return;
  const stage = wrap.querySelector<HTMLElement>('.character__stage');
  const img = wrap.querySelector<HTMLImageElement>('.character__img');
  if (!stage || !img) return;

  const start = (): void => {
    const canvas = document.createElement('canvas');
    canvas.className = 'character__hair';
    canvas.setAttribute('aria-hidden', 'true');
    const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as WebGLRenderingContext | WebGL2RenderingContext | null;
    if (!gl) return;
    const isGl2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;

    const compile = (type: number, src: string): WebGLShader => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
      return s;
    };
    let program: WebGLProgram;
    try {
      program = gl.createProgram()!;
      gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    } catch {
      return;
    }
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (isGl2) {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }

    const uSway = gl.getUniformLocation(program, 'sway');
    const uTime = gl.getUniformLocation(program, 'time');

    let visible = true;
    let lastDraw = 0;

    const size = (): void => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const px = Math.max(2, Math.round(stage.clientWidth * dpr));
      if (canvas.width !== px) {
        canvas.width = px;
        canvas.height = px;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const draw = (now: number): void => {
      const t = now / 1000;
      const g = gust(t);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uSway, g.x, g.y);
      gl.uniform1f(uTime, t);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    let seen = false; // has the picture been attached to the page yet?
    const frame = (now: number): void => {
      if (!wrap.isConnected) {
        // Not attached yet (a page change attaches it a moment late): keep waiting. Once it has gone, stop for good.
        if (seen) return;
        requestAnimationFrame(frame);
        return;
      }
      seen = true;
      if (visible && !document.hidden && now - lastDraw >= 30) {
        lastDraw = now; // about 30 frames a second is plenty for a slow breeze
        draw(now);
      }
      requestAnimationFrame(frame);
    };

    size();
    draw(performance.now());
    // Show the canvas in place of the plain picture (the picture stays in the page for search and no-WebGL).
    img.insertAdjacentElement('afterend', canvas);
    img.style.opacity = '0';
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(() => {
        size();
        draw(performance.now());
      }).observe(stage);
    }
    if (typeof IntersectionObserver !== 'undefined') {
      new IntersectionObserver((entries) => {
        visible = entries.some((e) => e.isIntersecting);
      }).observe(wrap);
    }
    requestAnimationFrame(frame);
  };

  if (img.complete && img.naturalWidth > 0) start();
  else img.addEventListener('load', start, { once: true });
}
