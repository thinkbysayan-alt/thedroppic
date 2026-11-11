import { AppError } from '../types';
import type {
  BackgroundRemovalMessage,
  BackgroundRemovalReady,
  BackgroundRemovalRequest,
  BackgroundRemovalResponse,
} from '../workers/background-removal-protocol';

/**
 * AI background removal: BiRefNet Lite (ZhengPeng7/BiRefNet_lite, MIT), a general subject-segmentation model, in
 * the web export studioludens/birefnet-lite-512, run through Transformers.js and ONNX Runtime Web, on the visitor's
 * graphics chip (WebGPU) or, failing that, their processor (WASM).
 *
 * This is a thin main-thread facade: model load, inference and matte refinement all happen in a dedicated Worker
 * (see workers/background-removal.worker.ts), so the page never freezes. Only raw pixel bytes cross to the worker
 * (transferred, not copied), and the photo is never sent over the network.
 *
 * The model file itself (about 94 MB) is a plain public file download from huggingface.co on first use, then kept
 * in the browser's cache. There is no API key, no account, no per-image request and no billing involved; the ONNX
 * runtime files are served from this site (public/ort). Lazy-loaded: nothing here runs until the Remove Background
 * page starts preparing it.
 */
let worker: Worker | null = null;
let nextId = 1;
let ready = false;

/** True once the model has loaded and warmed up (or a cut-out has finished), so the next one starts quickly. */
export function isBackgroundRemovalReady(): boolean {
  return ready;
}
const pending = new Map<number, { resolve: (v: BackgroundRemovalResponse) => void; reject: (e: Error) => void }>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../workers/background-removal.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<BackgroundRemovalResponse | BackgroundRemovalReady>) => {
      if ('kind' in event.data) {
        ready = true;
        return;
      }
      const entry = pending.get(event.data.id);
      if (!entry) return;
      pending.delete(event.data.id);
      entry.resolve(event.data);
    };
    worker.onerror = () => {
      // A worker-level error means we can't trust any pending response to still arrive — reject everything in flight.
      for (const [id, entry] of pending) {
        entry.reject(new AppError('conversion-failed', "We couldn't remove the background from this image. Please try again."));
        pending.delete(id);
      }
    };
  }
  return worker;
}

/**
 * Starts downloading and initialising the model in the background so the
 * first cutout doesn't pay for it. Safe to call repeatedly: the worker only
 * loads once.
 */
export function preloadBackgroundRemoval(): void {
  getWorker().postMessage({ kind: 'warmup' } satisfies BackgroundRemovalMessage);
}

function callWorker(request: BackgroundRemovalRequest): Promise<BackgroundRemovalResponse> {
  return new Promise((resolve, reject) => {
    pending.set(request.id, { resolve, reject });
    getWorker().postMessage(request, [request.data]);
  });
}

/**
 * Runs AI subject/background segmentation on `imageData` and returns a new
 * ImageData with a proper soft alpha channel — background pixels transparent,
 * foreground edges (including fine hair detail) smoothly feathered rather
 * than a hard binary cutout, with edge cleanup, anti-aliasing, and halo
 * (color decontamination) correction applied — see
 * conversion/background-removal-postprocess.ts. The original resolution
 * and proportions are preserved throughout; only the alpha channel and, at
 * the edges only, RGB (for halo correction) change.
 */
export async function removeBackground(imageData: ImageData): Promise<ImageData> {
  const id = nextId++;
  // .slice() copies the buffer so the caller's own ImageData is left intact and transferable — the worker takes ownership of the copy.
  const buffer = imageData.data.buffer.slice(0);
  const response = await callWorker({ kind: 'segment', id, data: buffer, width: imageData.width, height: imageData.height });
  if (!response.ok) throw new AppError(response.errorCode, response.message);
  ready = true;
  console.info('[background-removal]', `${imageData.width}x${imageData.height}`, response.timings);
  return new ImageData(new Uint8ClampedArray(response.data), response.width, response.height);
}

/** Terminates the worker — e.g. when the app is torn down or after a long idle period. */
export function disposeBackgroundRemovalWorker(): void {
  worker?.terminate();
  worker = null;
  pending.clear();
}
