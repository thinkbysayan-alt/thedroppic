import { describe, expect, it } from 'vitest';
import { cropImageData, flattenBackground, hasAlphaChannel, resolveBackgroundFill } from '../src/utils/image';
import { AppError } from '../src/types';

/** Builds a W×H ImageData where pixel (x, y) = [x, y, 0, 255] for easy verification. */
function makeGradient(width: number, height: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      data[i] = x;
      data[i + 1] = y;
      data[i + 2] = 0;
      data[i + 3] = 255;
    }
  }
  return new ImageData(data, width, height);
}

describe('cropImageData', () => {
  it('extracts exactly the requested square region', () => {
    const source = makeGradient(10, 6); // wide landscape source
    const crop = cropImageData(source, { x: 2, y: 1, size: 4 });
    expect(crop.width).toBe(4);
    expect(crop.height).toBe(4);
    // top-left pixel of the crop should be source pixel (2, 1)
    expect([crop.data[0], crop.data[1]]).toEqual([2, 1]);
    // bottom-right pixel of the crop should be source pixel (5, 4)
    const lastIdx = (3 * 4 + 3) * 4;
    expect([crop.data[lastIdx], crop.data[lastIdx + 1]]).toEqual([5, 4]);
  });

  it('always produces a square result (equal width and height)', () => {
    const source = makeGradient(20, 8); // landscape
    const crop = cropImageData(source, { x: 0, y: 0, size: 8 });
    expect(crop.width).toBe(crop.height);

    const portraitSource = makeGradient(8, 20);
    const portraitCrop = cropImageData(portraitSource, { x: 0, y: 0, size: 8 });
    expect(portraitCrop.width).toBe(portraitCrop.height);
  });

  it('clamps an out-of-bounds region to stay inside the source', () => {
    const source = makeGradient(10, 10);
    const crop = cropImageData(source, { x: 8, y: 8, size: 5 }); // would overflow to x/y=13
    expect(crop.width).toBe(5);
    // clamped x should be 10 - 5 = 5, not 8
    expect(crop.data[0]).toBe(5);
  });

  it('rejects a request that would exceed the safe pixel-count ceiling', () => {
    const source = makeGradient(4, 4);
    expect(() => cropImageData(source, { x: 0, y: 0, size: 20000 })).toThrow(AppError);
  });
});

describe('flattenBackground', () => {
  it('composites a fully transparent pixel onto the chosen background color', () => {
    const data = new Uint8ClampedArray([10, 20, 30, 0]); // fully transparent
    const img = new ImageData(data, 1, 1);
    flattenBackground(img, 'white');
    expect(Array.from(img.data)).toEqual([255, 255, 255, 255]);
  });

  it('leaves fully opaque pixels untouched', () => {
    const data = new Uint8ClampedArray([10, 20, 30, 255]);
    const img = new ImageData(data, 1, 1);
    flattenBackground(img, 'black');
    expect(Array.from(img.data)).toEqual([10, 20, 30, 255]);
  });
});

describe('hasAlphaChannel', () => {
  it('detects transparency', () => {
    const withAlpha = new ImageData(new Uint8ClampedArray([1, 2, 3, 200]), 1, 1);
    expect(hasAlphaChannel(withAlpha)).toBe(true);
  });

  it('reports no transparency for a fully opaque image', () => {
    const opaque = new ImageData(new Uint8ClampedArray([1, 2, 3, 255, 4, 5, 6, 255]), 2, 1);
    expect(hasAlphaChannel(opaque)).toBe(false);
  });
});

describe('resolveBackgroundFill', () => {
  it('JPEG always flattens onto white — it structurally cannot carry alpha', () => {
    expect(resolveBackgroundFill('jpeg')).toBe('white');
  });

  it('every alpha-capable format keeps transparency untouched — no white/black choice', () => {
    expect(resolveBackgroundFill('png')).toBeNull();
    expect(resolveBackgroundFill('tiff')).toBeNull();
    expect(resolveBackgroundFill('webp')).toBeNull();
    expect(resolveBackgroundFill('avif')).toBeNull();
  });
});
