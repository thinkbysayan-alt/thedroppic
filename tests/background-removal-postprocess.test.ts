import { describe, expect, it } from 'vitest';
import { cleanupMask, antiAliasEdges, reduceHalo, refineMatte, upsampleAlphaInto } from '../src/conversion/background-removal-postprocess';

/** Builds a flat W×H alpha buffer, all pixels set to `value`. */
function flatAlpha(width: number, height: number, value: number): Uint8ClampedArray {
  return new Uint8ClampedArray(width * height).fill(value);
}

describe('cleanupMask', () => {
  it('leaves large flat regions untouched even at a mid alpha value far from 0/255 (regression: large upsampled photos legitimately have huge flat non-extreme regions)', () => {
    // This is the exact bug this test guards against: an earlier version
    // gated purely on "alpha isn't exactly 0 or 255," which treated large,
    // perfectly flat interior regions (common once a small model mask is
    // upsampled onto a big photo) as "edge" and blurred them into a
    // visible haze. A flat region has zero local variance anywhere, so it
    // must be left completely alone regardless of its absolute value.
    const alpha = flatAlpha(9, 9, 200);
    const out = cleanupMask(alpha, 9, 9);
    expect(Array.from(out)).toEqual(Array.from(alpha));
  });

  it('removes a single confidently-transparent speckle inside an otherwise-opaque region (a real edge case)', () => {
    const alpha = flatAlpha(5, 5, 255);
    alpha[12] = 0; // one-pixel dropout in the middle of solid foreground — this genuinely is noise to clean up
    const out = cleanupMask(alpha, 5, 5);
    expect(out[12]).toBe(255);
  });

  it('removes a single-pixel speckle inside the edge band via the median of its neighborhood', () => {
    // A 3x3 block of alpha=128 (edge-band) with one noisy outlier pixel in the center.
    const width = 3;
    const height = 3;
    const alpha = flatAlpha(width, height, 128);
    alpha[4] = 10; // center pixel is a noisy outlier, still within the edge band (>4, <250)
    const out = cleanupMask(alpha, width, height);
    // The median of eight 128s and one 10 is 128 — the outlier should be replaced.
    expect(out[4]).toBe(128);
  });
});

describe('antiAliasEdges', () => {
  it('smooths a hard step inside the edge band toward its neighbors', () => {
    // A row of alpha values with a sharp jump in the middle, both sides within the edge band.
    const width = 5;
    const height = 1;
    const alpha = new Uint8ClampedArray([100, 100, 50, 200, 200]);
    const out = antiAliasEdges(alpha, width, height);
    // The stepped center pixel (index 2) should move toward the local average rather than staying a sharp 50.
    expect(out[2]).toBeGreaterThan(alpha[2]!);
  });

  it('smooths pixels right at a hard step but leaves pixels further from it untouched', () => {
    // A hard 0->255 step really is a boundary and should be smoothed right
    // at the transition — but pixels a couple of steps away from it, in
    // flat 0 or flat 255 regions, have zero local variance and must be
    // left completely alone.
    const alpha = new Uint8ClampedArray([0, 0, 0, 255, 255, 255]);
    const out = antiAliasEdges(alpha, 6, 1);
    expect(out[0]).toBe(0);
    expect(out[5]).toBe(255);
  });
});

describe('reduceHalo', () => {
  it('pulls a semi-transparent edge pixel’s color toward its confidently-foreground neighbor', () => {
    // 1x3 row: [background-tinted edge pixel, confident foreground, confident foreground]
    const width = 3;
    const height = 1;
    // Edge pixel starts as a reddish (background-contaminated) color; foreground neighbors are pure blue.
    const rgba = new Uint8ClampedArray([200, 0, 0, 128, 0, 0, 255, 255, 0, 0, 255, 255]);
    const alpha = new Uint8ClampedArray([128, 255, 255]);
    reduceHalo(rgba, alpha, width, height);
    // The edge pixel's blue channel should have increased (pulled toward the foreground's blue), red decreased.
    expect(rgba[2]).toBeGreaterThan(0);
    expect(rgba[0]).toBeLessThan(200);
  });

  it('leaves an isolated edge pixel with no confident-foreground neighbor unchanged', () => {
    const width = 3;
    const height = 1;
    const rgba = new Uint8ClampedArray([200, 0, 0, 128, 10, 10, 10, 128, 20, 20, 20, 128]);
    const before = Array.from(rgba);
    const alpha = new Uint8ClampedArray([128, 128, 128]); // no pixel reaches the confident-foreground threshold
    reduceHalo(rgba, alpha, width, height);
    expect(Array.from(rgba)).toEqual(before);
  });
});

describe('refineMatte', () => {
  it('preserves image dimensions and produces a fully opaque result for an all-white mask', () => {
    const width = 4;
    const height = 4;
    const rgba = new Uint8ClampedArray(width * height * 4).fill(255);
    refineMatte(rgba, width, height);
    expect(rgba.length).toBe(width * height * 4);
    for (let i = 3; i < rgba.length; i += 4) {
      expect(rgba[i]).toBe(255);
    }
  });
});

describe('upsampleAlphaInto', () => {
  it('writes only the alpha channel and keeps a flat matte flat at any target size', () => {
    const rgba = new Uint8ClampedArray(7 * 5 * 4).map((_, i) => (i % 4 === 3 ? 0 : 200));
    upsampleAlphaInto(rgba, 7, 5, new Uint8ClampedArray(4).fill(128), 2, 2);
    for (let i = 0; i < 35; i++) {
      expect(rgba[i * 4 + 3]).toBe(128);
      expect(rgba[i * 4]).toBe(200);
    }
  });

  it('interpolates smoothly between low-resolution samples and preserves ordering', () => {
    const rgba = new Uint8ClampedArray(8 * 1 * 4);
    upsampleAlphaInto(rgba, 8, 1, new Uint8ClampedArray([0, 255]), 2, 1);
    const alphas = Array.from({ length: 8 }, (_, x) => rgba[x * 4 + 3]!);
    expect(alphas[0]).toBe(0);
    expect(alphas[7]).toBe(255);
    for (let x = 1; x < 8; x++) expect(alphas[x]!).toBeGreaterThanOrEqual(alphas[x - 1]!);
  });
});
