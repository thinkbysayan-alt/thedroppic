import { AppError } from '../types';

/** MozJPEG (via @jsquash/jpeg, WASM). Lazy-loaded — only imported when JPEG output is requested. */
export async function encodeJpeg(imageData: ImageData, quality: number): Promise<ArrayBuffer> {
  try {
    const { encode } = await import('@jsquash/jpeg');
    return await encode(imageData, { quality });
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('conversion-failed', "We couldn't convert this image. Please try again.");
  }
}
