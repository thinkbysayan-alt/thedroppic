/** Formats we can read (decode). */
export type SourceFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'tiff' | 'heic';

/** Formats we can write (encode). HEIC is intentionally excluded — output not required. */
export type OutputFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'tiff';

export const OUTPUT_FORMAT_LABEL: Record<OutputFormat, string> = {
  jpeg: 'JPG',
  png: 'PNG',
  webp: 'WebP',
  avif: 'AVIF',
  tiff: 'TIFF',
};

export const OUTPUT_FORMAT_EXTENSION: Record<OutputFormat, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
  avif: 'avif',
  tiff: 'tiff',
};

export const OUTPUT_FORMAT_MIME: Record<OutputFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  tiff: 'image/tiff',
};

/** Formats that support a lossy quality slider. PNG/TIFF are always lossless. */
export const LOSSY_FORMATS: ReadonlySet<OutputFormat> = new Set(['jpeg', 'webp', 'avif']);

export type AppErrorCode =
  | 'unsupported-format'
  | 'corrupt-file'
  | 'conversion-failed'
  | 'too-large'
  | 'browser-unsupported'
  | 'clipboard-empty';

export class AppError extends Error {
  readonly code: AppErrorCode;
  constructor(code: AppErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'AppError';
  }
}

export const ERROR_MESSAGES: Record<AppErrorCode, string> = {
  'unsupported-format': "This image format isn't supported.",
  'corrupt-file': "We couldn't read this image. Try another file.",
  'conversion-failed': "We couldn't convert this image. Please try again.",
  'too-large': 'This image is too large for your browser to process reliably.',
  'browser-unsupported': "Your browser doesn't support this conversion yet.",
  'clipboard-empty': 'No image was found on your clipboard.',
};

export interface DecodedImage {
  imageData: ImageData;
  width: number;
  height: number;
}

export interface CropRegion {
  /** Top-left corner and side length, in source-image pixel coordinates. Always square. */
  x: number;
  y: number;
  size: number;
}

export interface ConvertOptions {
  outputFormat: OutputFormat;
  /** 1-100, ignored for lossless formats (png, tiff). */
  quality: number;
  crop: CropRegion | null;
  /** AI background removal (MODNet via Transformers.js) — adds an alpha channel by cutting the subject out. Always produces a transparent result; there's no white/black flatten choice, see resolveBackgroundFill. */
  removeBackground: boolean;
}

export interface ConvertResult {
  blob: Blob;
  width: number;
  height: number;
  byteLength: number;
}
