import { describe, expect, it } from 'vitest';
import { detectFormat } from '../src/conversion/format-detector';

function makeFile(bytes: number[], name: string, type = ''): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

const PAD = new Array(24).fill(0);

describe('detectFormat', () => {
  it('detects JPEG by magic number, ignoring a wrong extension', async () => {
    const file = makeFile([0xff, 0xd8, 0xff, 0xe0, ...PAD], 'photo.png');
    await expect(detectFormat(file)).resolves.toBe('jpeg');
  });

  it('detects PNG by magic number', async () => {
    const file = makeFile([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...PAD], 'image.dat');
    await expect(detectFormat(file)).resolves.toBe('png');
  });

  it('detects WebP via RIFF/WEBP markers', async () => {
    const bytes = [
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00, // size (irrelevant for detection)
      0x57, 0x45, 0x42, 0x50, // WEBP
      ...PAD,
    ];
    await expect(detectFormat(makeFile(bytes, 'image.webp'))).resolves.toBe('webp');
  });

  it('detects little-endian TIFF', async () => {
    const file = makeFile([0x49, 0x49, 0x2a, 0x00, ...PAD], 'scan.tif');
    await expect(detectFormat(file)).resolves.toBe('tiff');
  });

  it('detects big-endian TIFF', async () => {
    const file = makeFile([0x4d, 0x4d, 0x00, 0x2a, ...PAD], 'scan.tif');
    await expect(detectFormat(file)).resolves.toBe('tiff');
  });

  it('detects AVIF via ISOBMFF ftyp brand', async () => {
    const bytes = [
      0x00, 0x00, 0x00, 0x1c, // box size
      0x66, 0x74, 0x79, 0x70, // "ftyp"
      0x61, 0x76, 0x69, 0x66, // "avif" major brand
      0x00, 0x00, 0x00, 0x00, // minor version
      0x61, 0x76, 0x69, 0x66, // compatible brand
      0x6d, 0x69, 0x66, 0x31, // "mif1"
    ];
    await expect(detectFormat(makeFile(bytes, 'image.avif'))).resolves.toBe('avif');
  });

  it('detects HEIC via ISOBMFF ftyp brand', async () => {
    const bytes = [
      0x00, 0x00, 0x00, 0x1c,
      0x66, 0x74, 0x79, 0x70, // "ftyp"
      0x68, 0x65, 0x69, 0x63, // "heic" major brand
      0x00, 0x00, 0x00, 0x00,
      0x6d, 0x69, 0x66, 0x31, // "mif1"
      0x68, 0x65, 0x69, 0x63,
    ];
    await expect(detectFormat(makeFile(bytes, 'photo.heic'))).resolves.toBe('heic');
  });

  it('falls back to MIME type when signature is inconclusive', async () => {
    const file = makeFile([0, 0, 0, 0, ...PAD], 'unknown', 'image/png');
    await expect(detectFormat(file)).resolves.toBe('png');
  });

  it('falls back to extension when both signature and MIME are inconclusive', async () => {
    const file = makeFile([0, 0, 0, 0, ...PAD], 'photo.jpeg');
    await expect(detectFormat(file)).resolves.toBe('jpeg');
  });

  it('returns null for a genuinely unsupported file', async () => {
    const file = makeFile([0, 1, 2, 3, ...PAD], 'document.pdf', 'application/pdf');
    await expect(detectFormat(file)).resolves.toBeNull();
  });
});
