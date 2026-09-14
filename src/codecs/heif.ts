import { AppError } from '../types';

/**
 * HEIC/HEIF decode via libheif-js (LGPL-3.0, catdad-experiments/libheif-js),
 * loaded lazily as a separate WASM module only when a HEIC/HEIF file is
 * uploaded — never statically linked into our bundle. Decode only; HEIC
 * output is not part of this MVP.
 */
export async function decodeHeif(buffer: ArrayBuffer): Promise<{ imageData: ImageData; width: number; height: number }> {
  try {
    const libheif = (await import('libheif-js/wasm-bundle')).default;
    const decoder = new libheif.HeifDecoder();
    const images = decoder.decode(buffer);
    const first = images[0];
    if (!first) throw new Error('no image in HEIF container');

    const width = first.get_width();
    const height = first.get_height();
    const data = new Uint8ClampedArray(width * height * 4);

    await new Promise<void>((resolve, reject) => {
      first.display({ data, width, height }, (result) => {
        if (!result) reject(new Error('HEIF display failed'));
        else resolve();
      });
    });

    return { imageData: new ImageData(data, width, height), width, height };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('corrupt-file', "We couldn't read this image. Try another file.");
  }
}
