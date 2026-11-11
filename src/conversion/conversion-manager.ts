import { AppError, type ConvertOptions, type ConvertResult, type OutputFormat, type SourceFormat } from '../types';
import type { WorkerRequest, WorkerResponse } from '../workers/protocol';
import { decodeSource } from './decode';
import { removeBackground } from './background-removal';
import { cropImageData } from '../utils/image';
import { encodeCutoutWithinLimit, enforceNoGrowth } from './size-guard';

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, { resolve: (v: WorkerResponse) => void; reject: (e: Error) => void }>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../workers/conversion.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const entry = pending.get(event.data.id);
      if (!entry) return;
      pending.delete(event.data.id);
      entry.resolve(event.data);
    };
    worker.onerror = () => {
      // Reject every in-flight request; a worker-level error means we can't
      // trust any pending response to still arrive.
      for (const [id, entry] of pending) {
        entry.reject(new AppError('conversion-failed', "Well, that didn't go to plan. Give it another go?"));
        pending.delete(id);
      }
    };
  }
  return worker;
}

function callWorker(request: WorkerRequest, transfer: Transferable[]): Promise<WorkerResponse> {
  return new Promise((resolve, reject) => {
    pending.set(request.id, { resolve, reject });
    getWorker().postMessage(request, transfer);
  });
}

/** Decodes a file the browser can't render natively (TIFF, HEIC, or unsupported AVIF) for preview purposes. */
export async function decodeForPreview(
  file: File,
  sourceFormat: SourceFormat,
): Promise<{ imageData: ImageData; width: number; height: number }> {
  const buffer = await file.arrayBuffer();
  const id = nextId++;
  const response = await callWorker({ id, kind: 'decode-preview', sourceFormat, buffer }, [buffer]);
  if (!response.ok) throw new AppError(response.errorCode, response.message);
  if (response.kind !== 'decode-preview') {
    throw new AppError('conversion-failed', "Well, that didn't go to plan. Give it another go?");
  }
  return response;
}

export async function convertImage(
  file: File,
  sourceFormat: SourceFormat,
  options: ConvertOptions,
): Promise<ConvertResult> {
  if (options.removeBackground) {
    return convertWithBackgroundRemoval(file, sourceFormat, options);
  }

  const first = await runConvert(file, sourceFormat, options);
  return enforceNoGrowth(file, sourceFormat, options, first, (o) => runConvert(file, sourceFormat, o));
}

async function runConvert(file: File, sourceFormat: SourceFormat, options: ConvertOptions): Promise<ConvertResult> {
  const buffer = await file.arrayBuffer();
  const id = nextId++;
  const response = await callWorker({ id, kind: 'convert', sourceFormat, buffer, options }, [buffer]);
  return unwrapConvertResponse(response);
}

/**
 * Background removal needs a real DOM canvas (see background-removal.ts),
 * so decode + crop + segmentation all run here on the main thread; only the
 * final (CPU-heavy) encode step is handed off to the Worker.
 */
async function convertWithBackgroundRemoval(
  file: File,
  sourceFormat: SourceFormat,
  options: ConvertOptions,
): Promise<ConvertResult> {
  const buffer = await file.arrayBuffer();
  const { imageData: decoded } = await decodeSource(sourceFormat, buffer);
  const cropped = options.crop ? cropImageData(decoded, options.crop) : decoded;
  const withAlpha = await removeBackground(cropped);

  // Each encode hands its pixels to the worker, so give every attempt its own copy.
  const encode = async (outputFormat: OutputFormat, quality: number): Promise<ConvertResult> => {
    const copy = new ImageData(new Uint8ClampedArray(withAlpha.data), withAlpha.width, withAlpha.height);
    const id = nextId++;
    const response = await callWorker({ id, kind: 'encode-processed', imageData: copy, options: { ...options, outputFormat, quality } }, [
      copy.data.buffer,
    ]);
    return unwrapConvertResponse(response);
  };
  const lossless = sourceFormat === 'png' || sourceFormat === 'tiff';
  return encodeCutoutWithinLimit(file.size, lossless, encode);
}

function unwrapConvertResponse(response: WorkerResponse): ConvertResult {
  if (!response.ok) throw new AppError(response.errorCode, response.message);
  if (response.kind !== 'convert') {
    throw new AppError('conversion-failed', "Well, that didn't go to plan. Give it another go?");
  }
  const blob = new Blob([response.buffer], { type: response.mime });
  return { blob, width: response.width, height: response.height, byteLength: response.buffer.byteLength };
}

/** Terminates the worker, e.g. when the app is torn down or after a long idle period. */
export function disposeWorker(): void {
  worker?.terminate();
  worker = null;
  pending.clear();
}
