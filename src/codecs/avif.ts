import { AppError } from '../types';

/**
 * libavif (via @jsquash/avif, WASM). Lazy-loaded — only imported when AVIF
 * is needed. AVIF encoding is by far the most CPU-intensive codec in this
 * app; `speed: 8` (libavif's default is 6, on a 0=slowest/smallest file to
 * 10=fastest scale) trades a modest amount of compression efficiency for a
 * meaningfully faster encode — worth it here since we're optimizing for a
 * quick single-image conversion, not batch archival compression.
 */
export async function encodeAvif(imageData: ImageData, quality: number): Promise<ArrayBuffer> {
  try {
    const { encode } = await import('@jsquash/avif');
    return await encode(imageData, { quality, speed: 8 });
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('conversion-failed', "We couldn't convert this image. Please try again.");
  }
}

/**
 * WASM AVIF decode — only used as a fallback when the browser can't decode
 * AVIF natively via createImageBitmap (older Safari/Firefox).
 */
export async function decodeAvif(buffer: ArrayBuffer): Promise<ImageData> {
  try {
    const { decode } = await import('@jsquash/avif');
    const result = await decode(buffer);
    return result as ImageData;
  } catch {
    throw new AppError('corrupt-file', "We couldn't read this image. Try another file.");
  }
}
