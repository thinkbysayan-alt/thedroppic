import { describe, expect, it } from 'vitest';
import { canConvert, getAllowedOutputFormats, getDefaultOutputFormat } from '../src/conversion/capability-matrix';
import type { OutputFormat, SourceFormat } from '../src/types';

const ALL_SOURCES: SourceFormat[] = ['jpeg', 'png', 'webp', 'avif', 'tiff', 'heic'];
const ALL_OUTPUTS: OutputFormat[] = ['jpeg', 'png', 'webp', 'avif', 'tiff'];

describe('capability matrix', () => {
  it('never offers converting a format to itself', () => {
    for (const source of ALL_SOURCES) {
      const outputs: string[] = getAllowedOutputFormats(source);
      expect(outputs).not.toContain(source);
    }
  });

  it('never offers HEIC as an output format for any source', () => {
    for (const source of ALL_SOURCES) {
      const outputs: string[] = getAllowedOutputFormats(source);
      expect(outputs).not.toContain('heic');
    }
  });

  it('offers all four other standard formats for jpeg/png/webp/avif/tiff', () => {
    const standard: SourceFormat[] = ['jpeg', 'png', 'webp', 'avif', 'tiff'];
    for (const source of standard) {
      const expected = ALL_OUTPUTS.filter((f) => f !== source);
      expect(getAllowedOutputFormats(source).sort()).toEqual(expected.sort());
    }
  });

  it('offers every output format for heic (decode-only source)', () => {
    expect(getAllowedOutputFormats('heic').sort()).toEqual([...ALL_OUTPUTS].sort());
  });

  it('canConvert agrees with getAllowedOutputFormats', () => {
    for (const source of ALL_SOURCES) {
      for (const target of ALL_OUTPUTS) {
        expect(canConvert(source, target)).toBe(getAllowedOutputFormats(source).includes(target));
      }
    }
  });

  it('getDefaultOutputFormat always returns an allowed output', () => {
    for (const source of ALL_SOURCES) {
      const def = getDefaultOutputFormat(source);
      expect(getAllowedOutputFormats(source)).toContain(def);
    }
  });
});
