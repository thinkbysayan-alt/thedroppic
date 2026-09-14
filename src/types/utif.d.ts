/**
 * Minimal ambient typings for the `utif` package (photopea/UTIF.js, MIT),
 * which ships no bundled TypeScript types. Only the members we actually use
 * are declared.
 */
declare module 'utif' {
  export interface IFD {
    width: number;
    height: number;
    [key: string]: unknown;
  }

  export function decode(buffer: ArrayBuffer): IFD[];
  export function decodeImage(buffer: ArrayBuffer, ifd: IFD, ifds?: IFD[]): void;
  export function toRGBA8(ifd: IFD): Uint8Array;
  export function encodeImage(
    rgba: Uint8Array | Uint8ClampedArray,
    width: number,
    height: number,
    metadata?: Record<string, unknown>,
  ): ArrayBuffer;

  const UTIF: {
    decode: typeof decode;
    decodeImage: typeof decodeImage;
    toRGBA8: typeof toRGBA8;
    encodeImage: typeof encodeImage;
  };
  export default UTIF;
}
