import type { SourceFormat } from '../types';

/**
 * Detects an image's real format from its binary signature ("magic numbers"),
 * never from the filename extension alone. Falls back to the browser-reported
 * MIME type, then the extension, only if the bytes are inconclusive.
 *
 * Returns null for anything we don't support so callers can show a friendly
 * "unsupported format" error instead of guessing.
 */
export async function detectFormat(file: File): Promise<SourceFormat | null> {
  const header = new Uint8Array(await file.slice(0, 32).arrayBuffer());

  const bySignature = detectBySignature(header);
  if (bySignature) return bySignature;

  const byMime = detectByMime(file.type);
  if (byMime) return byMime;

  return detectByExtension(file.name);
}

function detectBySignature(bytes: Uint8Array): SourceFormat | null {
  if (bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'png';
  }

  // WebP: "RIFF" .... "WEBP"
  if (isAscii(bytes, 0, 'RIFF') && isAscii(bytes, 8, 'WEBP')) {
    return 'webp';
  }

  // TIFF: little-endian "II*\0" or big-endian "MM\0*"
  if (
    (bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00) ||
    (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a)
  ) {
    return 'tiff';
  }

  // ISOBMFF-based containers (AVIF, HEIC/HEIF): box size (4) + "ftyp" + major brand (4)
  if (isAscii(bytes, 4, 'ftyp')) {
    const brand = asciiAt(bytes, 8, 4);
    const compatibleBrands = asciiAt(bytes, 16, bytes.length - 16);

    if (brand === 'avif' || brand === 'avis') return 'avif';
    if (
      brand === 'heic' ||
      brand === 'heix' ||
      brand === 'heim' ||
      brand === 'heis' ||
      brand === 'hevc' ||
      brand === 'hevx' ||
      brand === 'mif1' ||
      brand === 'msf1'
    ) {
      // 'mif1'/'msf1' are generic HEIF brands also used by some AVIF files;
      // disambiguate using the compatible-brands list when possible.
      if (compatibleBrands.includes('avif')) return 'avif';
      return 'heic';
    }
  }

  return null;
}

function detectByMime(mime: string): SourceFormat | null {
  switch (mime) {
    case 'image/jpeg':
      return 'jpeg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/avif':
      return 'avif';
    case 'image/tiff':
      return 'tiff';
    case 'image/heic':
    case 'image/heif':
    case 'image/heic-sequence':
    case 'image/heif-sequence':
      return 'heic';
    default:
      return null;
  }
}

function detectByExtension(filename: string): SourceFormat | null {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'jpeg';
    case 'png':
      return 'png';
    case 'webp':
      return 'webp';
    case 'avif':
      return 'avif';
    case 'tif':
    case 'tiff':
      return 'tiff';
    case 'heic':
    case 'heif':
      return 'heic';
    default:
      return null;
  }
}

function isAscii(bytes: Uint8Array, offset: number, text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    if (bytes[offset + i] !== text.charCodeAt(i)) return false;
  }
  return true;
}

function asciiAt(bytes: Uint8Array, offset: number, length: number): string {
  let out = '';
  for (let i = 0; i < length && offset + i < bytes.length; i++) {
    const code = bytes[offset + i]!;
    out += code >= 0x20 && code < 0x7f ? String.fromCharCode(code) : ' ';
  }
  return out;
}
