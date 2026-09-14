import type { OutputFormat, SourceFormat } from '../types';

/**
 * Central source of truth for which output formats we expose for a given
 * input format. UI code must read this instead of hardcoding format lists,
 * so we only ever offer a conversion path that is actually implemented.
 *
 * HEIC/HEIF output is intentionally never offered (not required by spec).
 */
const MATRIX: Record<SourceFormat, OutputFormat[]> = {
  jpeg: ['png', 'webp', 'avif', 'tiff'],
  png: ['jpeg', 'webp', 'avif', 'tiff'],
  webp: ['jpeg', 'png', 'avif', 'tiff'],
  avif: ['jpeg', 'png', 'webp', 'tiff'],
  tiff: ['jpeg', 'png', 'webp', 'avif'],
  heic: ['jpeg', 'png', 'webp', 'avif', 'tiff'],
};

export function getAllowedOutputFormats(source: SourceFormat): OutputFormat[] {
  return MATRIX[source];
}

export function canConvert(source: SourceFormat, target: OutputFormat): boolean {
  return MATRIX[source].includes(target);
}

/** A sensible default output pick for a given source (first non-self option). */
export function getDefaultOutputFormat(source: SourceFormat): OutputFormat {
  const options = getAllowedOutputFormats(source);
  const jpeg = options.find((f) => f === 'jpeg');
  return jpeg ?? options[0]!;
}
