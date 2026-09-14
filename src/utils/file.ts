import type { OutputFormat } from '../types';
import { OUTPUT_FORMAT_EXTENSION } from '../types';

// Filesystem-unsafe characters plus space and hyphen, replaced conservatively
// with an underscore. Hyphen is listed first in the class so it is always
// read as a literal character, never as a range operator.
const UNSAFE_FILENAME_CHARS = /[-\\/:*?"<>| ]/g;

/**
 * Strips unsafe characters from a filename before it ever touches the DOM
 * (used as text content / download attribute) — never trust an uploaded
 * file's name.
 */
export function sanitizeFilename(name: string): string {
  const withoutUnsafe = name.replace(UNSAFE_FILENAME_CHARS, '_');
  const cleaned = withoutUnsafe.replace(/_+/g, '_').replace(/^\.+/, '');
  return cleaned.length > 0 ? cleaned : 'image';
}

export function getBaseName(filename: string): string {
  const sanitized = sanitizeFilename(filename);
  const dotIndex = sanitized.lastIndexOf('.');
  if (dotIndex <= 0) return sanitized;
  return sanitized.slice(0, dotIndex);
}

/** Builds the download filename: original base name + new extension. No ZIP, single file. */
export function buildOutputFilename(originalName: string, outputFormat: OutputFormat): string {
  const base = getBaseName(originalName);
  return `${base}.${OUTPUT_FORMAT_EXTENSION[outputFormat]}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  const rounded = value < 10 ? value.toFixed(1).replace(/\.0$/, '') : value.toFixed(0);
  return `${rounded} ${units[unitIndex]}`;
}
