import { LOSSY_FORMATS, OUTPUT_FORMAT_MIME, type ConvertOptions, type ConvertResult, type SourceFormat } from '../types';

/** Quality never drops below this while chasing a smaller file, so the guard can't wreck an image. */
const MIN_QUALITY = 40;
const QUALITY_STEP = 15;

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
