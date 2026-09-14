import type { SourceFormat } from '../types';
import { decodeForPreview } from './conversion-manager';
import { closeBitmap } from '../utils/memory';
import { decodeToOrientedBitmap, imageDataToBlob } from '../utils/image';

export interface PreviewResult {
  url: string;
  width: number;
  height: number;
}

/**
 * Produces a displayable preview URL + dimensions for an uploaded file.
 *
 * Fast path: if the browser can decode the format itself (JPEG/PNG/WebP and,
 * in most modern browsers, AVIF), we just point an <img> at the original
 * file directly — cheapest possible preview, and the browser applies EXIF
 * orientation automatically.
 *
 * Fallback: TIFF, HEIC, and AVIF in browsers without native AVIF support
 * can't be rendered by <img> at all, so we decode once via the worker's WASM
 * codec and rasterize a PNG preview from the result.
 */
export async function generatePreview(file: File, sourceFormat: SourceFormat): Promise<PreviewResult> {
  if (sourceFormat !== 'tiff' && sourceFormat !== 'heic') {
    const nativelyRenderable = await canDecodeNatively(file);
    if (nativelyRenderable) {
      return {
        url: URL.createObjectURL(file),
        width: nativelyRenderable.width,
        height: nativelyRenderable.height,
      };
    }
  }

  const { imageData, width, height } = await decodeForPreview(file, sourceFormat);
  const blob = await imageDataToBlob(imageData);
  return { url: URL.createObjectURL(blob), width, height };
}

/**
 * Checks whether the browser can decode this file natively, and reports its
 * EXIF-orientation-corrected dimensions if so. Using `imageOrientation:
 * 'from-image'` here (via decodeToOrientedBitmap) is essential, not
 * cosmetic: the <img> we point at the raw file blob renders EXIF-rotated
 * (all browsers auto-rotate JPEGs in <img>), so the dimensions we report
 * must match that rotated orientation — otherwise the cropper (which sizes
 * itself off these dimensions) does its width/height math against the
 * un-rotated raw pixel grid while the image it's actually drawing is
 * rotated, and the crop stage ends up under-covered on one axis.
 */
async function canDecodeNatively(file: File): Promise<{ width: number; height: number } | null> {
  try {
    const bitmap = await decodeToOrientedBitmap(file);
    const dims = { width: bitmap.width, height: bitmap.height };
    closeBitmap(bitmap);
    return dims;
  } catch {
    return null;
  }
}
