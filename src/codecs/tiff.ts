import { AppError } from '../types';

/**
 * TIFF read/write via UTIF.js (MIT). No native browser TIFF support exists,
 * so this codec is always needed for TIFF input/output — it is still only
 * imported when a TIFF file is actually involved (lazy-loaded by the worker).
 *
 * Known limitation: TIFF orientation tags are not re-applied here (unlike
 * JPEG's EXIF orientation, which the browser handles natively) — see README.
 */
export async function decodeTiff(buffer: ArrayBuffer): Promise<{ imageData: ImageData; width: number; height: number }> {
  try {
    const UTIF = (await import('utif')).default;
    const ifds = UTIF.decode(buffer);
    const first = ifds[0];
    if (!first) throw new Error('empty TIFF');
    UTIF.decodeImage(buffer, first, ifds);
    const rgba = UTIF.toRGBA8(first);
    const { width, height } = first;
    const imageData = new ImageData(new Uint8ClampedArray(rgba), width, height);
    return { imageData, width, height };
  } catch {
    throw new AppError('corrupt-file', "We couldn't read this image. Try another file.");
  }
}

export async function encodeTiff(imageData: ImageData): Promise<ArrayBuffer> {
  try {
    const UTIF = (await import('utif')).default;
    return UTIF.encodeImage(imageData.data, imageData.width, imageData.height);
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('conversion-failed', "We couldn't convert this image. Please try again.");
  }
}
