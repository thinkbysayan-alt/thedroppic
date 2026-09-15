/**
 * Post-processing applied to MODNet's raw alpha matte before it becomes the
 * final transparent PNG. MODNet itself is untouched — this operates purely
 * on the RGBA pixel buffer the model produced (RGB = original photo,
 * alpha = the model's soft matte), in three explicit stages:
 *
 *   1. cleanupMask    — despeckles the alpha channel (removes small
 *                        salt-and-pepper noise from the low-resolution
 *                        model output) via a 3x3 median filter.
 *   2. antiAliasEdges — smooths jagged/staircase edges left over from
 *                        upsampling the model's small internal resolution
 *                        back to the photo's real size, via a small
 *                        weighted blur.
 *   3. reduceHalo     — "color decontamination": semi-transparent edge
 *                        pixels keep the *original* photo's RGB, which is
 *                        itself a blend of subject + background color (a
 *                        real photo edge is never a clean cut) — that
 *                        leftover background color is what shows up as a
 *                        halo/fringe once composited elsewhere. This pulls
 *                        each semi-transparent pixel's color toward its
 *                        confidently-foreground neighbors, proportional to
 *                        how transparent (how background-contaminated) it
 *                        still is.
 *
 * All three run on plain Uint8ClampedArrays — no canvas, no DOM — so this
 * module works identically on the main thread or inside a Worker.
 */

/** Pixels at or above this alpha are used as the trusted color source for halo reduction. */
const CONFIDENT_FG = 250;
/**
 * How much an alpha value has to vary within a pixel's immediate
 * neighborhood before that pixel counts as "near a real edge."
 *
 * A pixel's *absolute* alpha value is not a reliable signal for this on
 * its own: a low-resolution model's mask, upsampled onto a large photo,
 * legitimately produces huge, smoothly-varying interior regions sitting
 * at alpha values like 180-249 that are nowhere near an actual boundary
 * — a much larger fraction of the image the bigger the photo is relative
 * to the model's small native resolution. Gating purely on "is alpha not
 * exactly 0 or 255" (an earlier version of this file did) treated most of
 * a large photo's confident foreground as "edge," and repeatedly
 * median-filtering/blurring it produced a visible ghosting/haze over
 * large flat areas instead of the intended edge-only cleanup — this
 * local-variance check instead asks "does alpha actually change nearby,"
 * which is true only near a genuine boundary regardless of image size.
 */
const EDGE_VARIANCE_THRESHOLD = 10;

/** True if `alpha`'s value varies meaningfully within its 3x3 neighborhood — i.e. this pixel sits near a real matte boundary, not just anywhere with a non-extreme value. */
function isNearEdge(alpha: Uint8ClampedArray, x: number, y: number, width: number, height: number): boolean {
  let min = 255;
  let max = 0;
  for (let dy = -1; dy <= 1; dy++) {
    const ny = y + dy;
    if (ny < 0 || ny >= height) continue;
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      if (nx < 0 || nx >= width) continue;
      const v = alpha[ny * width + nx]!;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  return max - min > EDGE_VARIANCE_THRESHOLD;
}

/** Extracts just the alpha channel (index 3 of every RGBA pixel) into its own array. */
function extractAlpha(rgba: Uint8ClampedArray, pixelCount: number): Uint8ClampedArray {
  const alpha = new Uint8ClampedArray(pixelCount);
  for (let i = 0; i < pixelCount; i++) alpha[i] = rgba[i * 4 + 3]!;
  return alpha;
}

/**
 * 3x3 median filter on the alpha channel, restricted to pixels near a real
 * boundary (see `isNearEdge`) — that's where a low-resolution model's
 * upsampled mask actually shows noise, so skipping flat/confident regions
 * keeps this fast on large photos without touching them at all.
 */
export function cleanupMask(alpha: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(alpha);
  const window = new Uint8ClampedArray(9);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (!isNearEdge(alpha, x, y, width, height)) continue;

      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          window[n++] = alpha[ny * width + nx]!;
        }
      }
      out[i] = median(window, n);
    }
  }
  return out;
}

function median(values: Uint8ClampedArray, n: number): number {
  // n is at most 9 (a 3x3 window) — a plain insertion sort of the used
  // slice is simpler and faster here than allocating for a general sort.
  for (let i = 1; i < n; i++) {
    const v = values[i]!;
    let j = i - 1;
    while (j >= 0 && values[j]! > v) {
      values[j + 1] = values[j]!;
      j--;
    }
    values[j + 1] = v;
  }
  return values[n >> 1]!;
}

/**
 * Small weighted blur (1-2-1 separable-equivalent 3x3 kernel) on the alpha
 * channel, again restricted to pixels near a real boundary, to turn
 * jagged upsampled edges into a properly anti-aliased soft transition.
 */
export function antiAliasEdges(alpha: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(alpha);
  // prettier-ignore
  const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const a = alpha[i]!;
      if (!isNearEdge(alpha, x, y, width, height)) continue;

      let sum = 0;
      let weight = 0;
      let k = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const kw = kernel[k++]!;
          if (ny < 0 || ny >= height || nx < 0 || nx >= width) continue;
          sum += alpha[ny * width + nx]! * kw;
          weight += kw;
        }
      }
      // Normalizing by the *actual* accumulated weight (not the kernel's
      // fixed total) correctly handles pixels near the image border, where
      // some neighbors fall outside the image and are simply excluded from
      // both sum and weight rather than treated as zero.
      out[i] = weight > 0 ? Math.round(sum / weight) : a;
    }
  }
  return out;
}

/**
 * Color decontamination: for every remaining semi-transparent edge pixel,
 * blends its RGB toward the average color of its confidently-foreground
 * neighbors (a 5x5 search window), weighted by how transparent the pixel
 * still is. A pixel with no confident-foreground neighbor within the
 * window (an isolated fragment) is left alone rather than guessing.
 * Mutates `rgba` in place; `alpha` is the already-refined mask to use
 * (read-only).
 */
export function reduceHalo(rgba: Uint8ClampedArray, alpha: Uint8ClampedArray, width: number, height: number): void {
  const original = new Uint8ClampedArray(rgba); // stable read source — we're about to overwrite rgba's RGB in place
  const RADIUS = 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const a = alpha[i]!;
      if (!isNearEdge(alpha, x, y, width, height)) continue;

      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let count = 0;
      for (let dy = -RADIUS; dy <= RADIUS; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -RADIUS; dx <= RADIUS; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          const ni = ny * width + nx;
          if (alpha[ni]! < CONFIDENT_FG) continue; // only trust confidently-foreground neighbors as the color source
          const p = ni * 4;
          sumR += original[p]!;
          sumG += original[p + 1]!;
          sumB += original[p + 2]!;
          count++;
        }
      }
      if (count === 0) continue; // no trusted neighbor nearby — leave this pixel's color as-is

      const fgR = sumR / count;
      const fgG = sumG / count;
      const fgB = sumB / count;
      // More correction the more transparent (more background-contaminated) the pixel still is.
      const strength = 1 - a / 255;

      const p = i * 4;
      rgba[p] = Math.round(original[p]! * (1 - strength) + fgR * strength);
      rgba[p + 1] = Math.round(original[p + 1]! * (1 - strength) + fgG * strength);
      rgba[p + 2] = Math.round(original[p + 2]! * (1 - strength) + fgB * strength);
    }
  }
}

/**
 * Runs the full refinement pipeline (cleanup → anti-alias → halo
 * reduction) on a raw MODNet output buffer, in place. `rgba` must be
 * RGBA (4 channels), `width * height * 4 === rgba.length`.
 */
export function refineMatte(rgba: Uint8ClampedArray, width: number, height: number): void {
  const pixelCount = width * height;
  const rawAlpha = extractAlpha(rgba, pixelCount);
  const cleaned = cleanupMask(rawAlpha, width, height);
  const antiAliased = antiAliasEdges(cleaned, width, height);
  reduceHalo(rgba, antiAliased, width, height);
  for (let i = 0; i < pixelCount; i++) rgba[i * 4 + 3] = antiAliased[i]!;
}
