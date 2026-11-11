import { AppError } from '../types';

/** libwebp (via @jsquash/webp, WASM). Lazy-loaded — only imported when WebP output is requested. */
export async function encodeWebp(imageData: ImageData, quality: number): Promise<ArrayBuffer> {
  try {
    const { encode } = await import('@jsquash/webp');
    return await encode(imageData, { quality });
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('conversion-failed', "Well, that didn't go to plan. Give it another go?");
  }
}
