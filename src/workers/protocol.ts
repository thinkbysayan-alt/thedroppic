import type { AppErrorCode, ConvertOptions, SourceFormat } from '../types';

export type WorkerRequest =
  | { id: number; kind: 'decode-preview'; sourceFormat: SourceFormat; buffer: ArrayBuffer }
  | { id: number; kind: 'convert'; sourceFormat: SourceFormat; buffer: ArrayBuffer; options: ConvertOptions }
  /**
   * Encode-only path: the main thread has already decoded, cropped, and
   * (for background removal) added an alpha channel — background removal
   * needs a real DOM canvas and can't run in this Worker, so that
   * preprocessing happens on the main thread and only the CPU-heavy encode
   * step is offloaded here. `options.crop` is ignored (already applied).
   */
  | { id: number; kind: 'encode-processed'; imageData: ImageData; options: ConvertOptions };

export type WorkerResponse =
  | { id: number; ok: true; kind: 'decode-preview'; imageData: ImageData; width: number; height: number }
  | { id: number; ok: true; kind: 'convert'; buffer: ArrayBuffer; mime: string; width: number; height: number }
  | { id: number; ok: false; errorCode: AppErrorCode; message: string };
