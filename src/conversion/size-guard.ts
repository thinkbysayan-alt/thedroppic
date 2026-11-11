import {
  LOSSY_FORMATS,
  OUTPUT_FORMAT_LABEL,
  OUTPUT_FORMAT_MIME,
  type ConvertOptions,
  type ConvertResult,
  type OutputFormat,
  type SourceFormat,
} from '../types';

/** Quality never drops below this while chasing a smaller file, so the guard can't wreck an image. */
const MIN_QUALITY = 40;
const QUALITY_STEP = 15;
/** A cut-out may go lower than that: a tiny, heavily compressed photo needs it to come back no bigger. */
const CUTOUT_MIN_QUALITY = 15;

/** Lower qualities to try, highest first: 15 points down at a time (few steps: AVIF encodes are slow) from `quality`, floored at MIN_QUALITY. */
export function qualityLadder(quality: number): number[] {
  const steps: number[] = [];
  for (let q = quality - QUALITY_STEP; q >= MIN_QUALITY; q -= QUALITY_STEP) steps.push(q);
  if (steps.length === 0 && quality > MIN_QUALITY) steps.push(MIN_QUALITY);
  return steps;
}

/**
 * A conversion should never hand back a bigger file than the user put in
 * when that can be avoided. If the first result is larger than the original:
 *   1. lossy output: re-encode at progressively lower quality until it fits;
 *   2. same format in and out (a re-save, not a real conversion): return the
 *      original bytes untouched;
 *   3. otherwise (e.g. JPG to PNG, where lossless is inherently bigger) keep
 *      the smallest result we produced.
 */
export async function enforceNoGrowth(
  file: File,
  sourceFormat: SourceFormat,
  options: ConvertOptions,
  first: ConvertResult,
  run: (options: ConvertOptions) => Promise<ConvertResult>,
): Promise<ConvertResult> {
  const limit = file.size;
  if (first.byteLength <= limit) return first;

  let best = first;
  if (LOSSY_FORMATS.has(options.outputFormat)) {
    for (const quality of qualityLadder(options.quality)) {
      const attempt = await run({ ...options, quality });
      if (attempt.byteLength < best.byteLength) best = attempt;
      if (best.byteLength <= limit) return best;
    }
  }

  if (!options.crop && sourceFormat === options.outputFormat) {
    const type = file.type || OUTPUT_FORMAT_MIME[options.outputFormat];
    return { blob: new Blob([file], { type }), width: best.width, height: best.height, byteLength: limit };
  }
  return best;
}

const LOSSY_SOURCES: ReadonlySet<SourceFormat> = new Set(['jpeg', 'webp', 'avif', 'heic']);

/** Shown before converting: a compressed photo saved as PNG or TIFF stores every pixel and gets much bigger. */
export function losslessGrowthWarning(source: SourceFormat, output: OutputFormat): string | null {
  if (!LOSSY_SOURCES.has(source) || LOSSY_FORMATS.has(output)) return null;
  const label = OUTPUT_FORMAT_LABEL[output];
  return `${label} keeps every pixel, so a photo can end up many times larger than the original. Choose JPG, WebP or AVIF to keep it small.`;
}

/**
 * A cut-out has to be see-through, which rules out JPEG, and a lossless PNG of a photo is many times bigger than
 * the compressed original it came from. So the cut-out is saved so that it never comes back bigger than the file
 * the person put in:
 *   1. a lossless source (PNG, TIFF) is tried as PNG first, and kept if it fits;
 *   2. otherwise a transparent WebP is encoded at the highest quality that still fits (usually the very first
 *      attempt), never dropping below CUTOUT_MIN_QUALITY;
 *   3. if WebP can't be produced (for example an image wider than WebP allows), the PNG is used.
 */
export async function encodeCutoutWithinLimit(
  limit: number,
  tryPngFirst: boolean,
  encode: (format: OutputFormat, quality: number) => Promise<ConvertResult>,
): Promise<ConvertResult> {
  let png: ConvertResult | null = null;
  if (tryPngFirst) {
    png = await encode('png', 100);
    if (png.byteLength <= limit) return { ...png, outputFormat: 'png' };
  }

  // Quality steps from high to low. A typical photo already fits at the first one, so that is tried alone first
  // (one encode); only if it does not fit is the best quality that does found by a short binary search below it.
  const ladder = [90, 80, 68, 55, 42, 30, 20, CUTOUT_MIN_QUALITY];

  try {
    const first = await encode('webp', ladder[0]!);
    let chosen = first;
    if (first.byteLength > limit) {
      let lo = 1;
      let hi = ladder.length - 1;
      let fits: ConvertResult | null = null;
      let smallest = first;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const attempt = await encode('webp', ladder[mid]!);
        if (attempt.byteLength < smallest.byteLength) smallest = attempt;
        if (attempt.byteLength <= limit) {
          fits = attempt;
          hi = mid - 1; // fits: see whether a higher quality fits too
        } else {
          lo = mid + 1;
        }
      }
      chosen = fits ?? smallest;
    }
    if (png && png.byteLength < chosen.byteLength) return { ...png, outputFormat: 'png' };
    return { ...chosen, outputFormat: 'webp' };
  } catch {
    const fallback = png ?? (await encode('png', 100));
    return { ...fallback, outputFormat: 'png' };
  }
}
