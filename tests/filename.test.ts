import { describe, expect, it } from 'vitest';
import { buildOutputFilename, formatFileSize, getBaseName, sanitizeFilename } from '../src/utils/file';

describe('sanitizeFilename', () => {
  it('conservatively replaces hyphens and spaces with underscores alongside unsafe characters', () => {
    expect(sanitizeFilename('holiday-photo.heic')).toBe('holiday_photo.heic');
    expect(sanitizeFilename('my vacation photo.jpg')).toBe('my_vacation_photo.jpg');
  });

  it('strips path separators so a malicious name cannot escape its context', () => {
    expect(sanitizeFilename('../../etc/passwd.jpg')).not.toContain('/');
    expect(sanitizeFilename('..\\..\\windows\\system32.jpg')).not.toContain('\\');
  });

  it('never returns an empty string', () => {
    expect(sanitizeFilename('')).toBe('image');
    expect(sanitizeFilename('....')).toBe('image');
  });
});

describe('getBaseName / buildOutputFilename', () => {
  it('replaces the extension, preserving the base name (no ZIP, single file)', () => {
    expect(buildOutputFilename('holiday-photo.heic', 'jpeg')).toBe('holiday_photo.jpg');
    // '-' and '.' before the extension are conservative substitutions, not an extension bug
    expect(buildOutputFilename('scan.tiff', 'webp')).toBe('scan.webp');
  });

  it('handles a filename with no extension', () => {
    expect(getBaseName('IMG_1234')).toBe('IMG_1234');
    expect(buildOutputFilename('IMG_1234', 'png')).toBe('IMG_1234.png');
  });

  it('handles filenames with multiple dots by only stripping the last extension', () => {
    expect(getBaseName('my.vacation.photo.jpg')).toBe('my.vacation.photo');
  });
});

describe('formatFileSize', () => {
  it('formats bytes, KB, MB appropriately', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(2048)).toBe('2 KB');
    expect(formatFileSize(1_572_864)).toBe('1.5 MB');
  });
});
