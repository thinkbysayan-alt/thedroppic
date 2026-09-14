import { AppError, ERROR_MESSAGES, type OutputFormat, type SourceFormat } from '../types';
import { assertSafePixelCount, bitmapToImageData, decodeToOrientedBitmap } from '../utils/image';
import { closeBitmap } from '../utils/memory';
import { decodeAvif, encodeAvif } from '../codecs/avif';
import { encodeJpeg } from '../codecs/jpeg';
import { encodePng } from '../codecs/png';
import { decodeTiff, encodeTiff } from '../codecs/tiff';
import { decodeHeif } from '../codecs/heif';
import { encodeWebp } from '../codecs/webp';

/**
 * Decodes the given source format to raw ImageData. JPEG/PNG/WebP/AVIF use
 * the browser's native decoder first (fast, no WASM download); AVIF falls
 * back to the WASM decoder only if native decode fails (older browsers).
 * TIFF and HEIC always need their WASM codec — no native browser support.
 * Every codec import below is a dynamic import, so only the module actually
 * needed for this file's format is ever downloaded.
 *
 * Environment-agnostic — works on the main thread and inside a Web Worker,
 * so it's shared by the normal (in-worker) conversion path and the
 * background-removal path (which needs to decode on the main thread, since
 * the segmentation model requires real DOM canvas elements).
 */
export async function decodeSource(
  format: SourceFormat,
  buffer: ArrayBuffer,
): Promise<{ imageData: ImageData; width: number; height: number }> {
  if (format === 'tiff') return decodeTiff(buffer);
  if (format === 'heic') return decodeHeif(buffer);

  try {
    const bitmap = await decodeToOrientedBitmap(new Blob([buffer]));
    assertSafePixelCount(bitmap.width, bitmap.height);
    const imageData = bitmapToImageData(bitmap);
    closeBitmap(bitmap);
    return { imageData, width: imageData.width, height: imageData.height };
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (format === 'avif') {
      const imageData = await decodeAvif(buffer);
      return { imageData, width: imageData.width, height: imageData.height };
    }
    throw new AppError('corrupt-file', ERROR_MESSAGES['corrupt-file']);
  }
}

export async function encodeOutput(format: OutputFormat, imageData: ImageData, quality: number): Promise<ArrayBuffer> {
  switch (format) {
    case 'jpeg':
      return encodeJpeg(imageData, quality);
    case 'png':
      return encodePng(imageData);
    case 'webp':
      return encodeWebp(imageData, quality);
    case 'avif':
      return encodeAvif(imageData, quality);
    case 'tiff':
      return encodeTiff(imageData);
  }
}
