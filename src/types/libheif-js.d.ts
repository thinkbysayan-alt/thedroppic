/**
 * Minimal ambient typings for `libheif-js/wasm-bundle` (catdad-experiments/libheif-js,
 * LGPL-3.0), which ships no bundled TypeScript types. Only the members we use
 * are declared. This module is loaded lazily and only for HEIC/HEIF input.
 */
declare module 'libheif-js/wasm-bundle' {
  interface HeifImage {
    get_width(): number;
    get_height(): number;
    display(
      target: { data: Uint8ClampedArray; width: number; height: number },
      callback: (result: { data: Uint8ClampedArray; width: number; height: number } | null) => void,
    ): void;
  }

  interface HeifDecoderInstance {
    decode(buffer: ArrayBuffer | Uint8Array): HeifImage[];
  }

  interface LibHeif {
    HeifDecoder: new () => HeifDecoderInstance;
  }

  const libheif: LibHeif;
  export default libheif;
}
