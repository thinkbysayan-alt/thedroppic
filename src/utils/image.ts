import { AppError, type CropRegion, type OutputFormat } from '../types';

/** Conservative ceiling to avoid crashing the tab on huge images (~100 MP). */
const MAX_PIXELS = 100_000_000;

/**
 * Decides whether transparent pixels need flattening onto a solid color
 * before encoding — or `null` to leave the alpha channel untouched. Pure
 * decision logic, kept separate from the pixel loop (`flattenBackground`) so
 * it's unit-testable without a canvas/worker.
 *
 * There is no user-facing white/black choice — JPEG structurally can't
 * carry alpha at all, so it always flattens onto white (the conventional
 * default). Every other output format (PNG, TIFF, WebP, AVIF) keeps
 * whatever alpha the image has, including a fresh cutout from AI background
 * removal — "Remove background" always produces a transparent result.
 */
export function resolveBackgroundFill(outputFormat: OutputFormat): 'white' | null {
  return outputFormat === 'jpeg' ? 'white' : null;
}

/**
 * Decodes a Blob into an orientation-corrected ImageBitmap using the native
 * browser decoder. `imageOrientation: 'from-image'` applies EXIF rotation
 * automatically, so the bitmap (and everything derived from it: preview,
 * crop, re-encode) is already in the visually-correct orientation without
 * any hand-rolled EXIF matrix math. Works on the main thread and inside a
 * Web Worker (createImageBitmap is available in both contexts).
 *
 * Throws AppError('corrupt-file') on decode failure — callers needing to
 * distinguish "browser can't decode this format at all" (to fall back to a
 * WASM codec) should catch the underlying rejection themselves instead.
 */
export async function decodeToOrientedBitmap(blob: Blob): Promise<ImageBitmap> {
  return createImageBitmap(blob, { imageOrientation: 'from-image' });
}

export function assertSafePixelCount(width: number, height: number): void {
  if (width * height > MAX_PIXELS) {
    throw new AppError(
      'too-large',
      'This image is too large for your browser to process reliably.',
    );
  }
}

interface Canvas2D {
  canvas: { width: number; height: number };
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
}

/**
 * Creates a 2D drawing surface that works both on the main thread and
 * inside a Worker.
 *
 * Deliberately *not* passing `willReadFrequently: true` here: that hint
 * tells the browser to back the canvas with a software (CPU) renderer
 * because it expects many repeated `getImageData`/`putImageData` calls. We
 * only ever draw once and read once per canvas — with the hint on, we were
 * paying for CPU-only compositing on every single conversion for no
 * benefit, which is a large chunk of "why does this feel slow" on bigger
 * images. Leaving it unset lets the browser use GPU-accelerated 2D
 * rendering when available.
 */
function createCanvas(width: number, height: number): Canvas2D {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D | null;
    if (!ctx) throw new AppError('browser-unsupported', "Your browser doesn't support this conversion yet.");
    return { canvas, ctx };
  }
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new AppError('browser-unsupported', "Your browser doesn't support this conversion yet.");
    return { canvas, ctx };
  }
  throw new AppError('browser-unsupported', "Your browser doesn't support this conversion yet.");
}

/** Draws a full bitmap onto a fresh canvas and returns its raw ImageData. Cropping happens separately, see `cropImageData`. */
export function bitmapToImageData(bitmap: ImageBitmap): ImageData {
  const { width, height } = bitmap;
  assertSafePixelCount(width, height);
  const { ctx } = createCanvas(width, height);
  ctx.drawImage(bitmap, 0, 0);
  return ctx.getImageData(0, 0, width, height);
}

/** Re-encodes raw ImageData as a small preview Blob (used only for formats the browser can't render directly). */
export async function imageDataToBlob(imageData: ImageData, type = 'image/png'): Promise<Blob> {
  const { canvas, ctx } = createCanvas(imageData.width, imageData.height);
  ctx.putImageData(imageData, 0, 0);
  if ('convertToBlob' in canvas) {
    return (canvas as OffscreenCanvas).convertToBlob({ type });
  }
  return new Promise((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new AppError('conversion-failed', "We couldn't convert this image. Please try again."));
    }, type);
  });
}

/** Flattens an alpha channel onto a solid background (for formats like JPEG that can't carry alpha). Mutates in place. */
export function flattenBackground(imageData: ImageData, color: 'white' | 'black'): ImageData {
  const fill = color === 'white' ? 255 : 0;
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3]! / 255;
    if (alpha === 1) continue;
    data[i] = Math.round(data[i]! * alpha + fill * (1 - alpha));
    data[i + 1] = Math.round(data[i + 1]! * alpha + fill * (1 - alpha));
    data[i + 2] = Math.round(data[i + 2]! * alpha + fill * (1 - alpha));
    data[i + 3] = 255;
  }
  return imageData;
}

/**
 * Crops raw ImageData to a square region via direct pixel-row copying (no
 * canvas round-trip needed). The requested region is clamped to stay fully
 * inside the source bounds, guarding against any off-by-one float rounding
 * from the cropper's zoom/pan math.
 */
export function cropImageData(source: ImageData, region: CropRegion): ImageData {
  const size = Math.max(1, Math.round(region.size));
  const x = Math.min(Math.max(0, Math.round(region.x)), Math.max(0, source.width - size));
  const y = Math.min(Math.max(0, Math.round(region.y)), Math.max(0, source.height - size));
  assertSafePixelCount(size, size);

  const out = new Uint8ClampedArray(size * size * 4);
  const dstRowBytes = size * 4;
  for (let row = 0; row < size; row++) {
    const srcY = y + row;
    const srcStart = (srcY * source.width + x) * 4;
    out.set(source.data.subarray(srcStart, srcStart + dstRowBytes), row * dstRowBytes);
  }
  return new ImageData(out, size, size);
}

export function hasAlphaChannel(imageData: ImageData): boolean {
  const data = imageData.data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 255) return true;
  }
  return false;
}
