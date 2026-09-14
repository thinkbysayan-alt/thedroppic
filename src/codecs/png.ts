import { AppError } from '../types';

/** Rust `png` crate (via @jsquash/png, WASM). Always lossless — no quality option. */
export async function encodePng(imageData: ImageData): Promise<ArrayBuffer> {
  try {
    const { encode } = await import('@jsquash/png');
    return await encode(imageData);
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('conversion-failed', "We couldn't convert this image. Please try again.");
  }
}
