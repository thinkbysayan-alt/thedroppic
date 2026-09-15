import { AppError } from '../types';
import type { BackgroundRemovalRequest, BackgroundRemovalResponse } from '../workers/background-removal-protocol';

/**
 * AI background removal — MODNet (ZHKKKe/MODNet, Apache-2.0), a trimap-free
 * portrait-matting model, run via Transformers.js (huggingface/transformers.js,
 * Apache-2.0) on top of ONNX Runtime Web.
 *
 * This is a thin main-thread facade: the actual model load + inference +
 * matte refinement all happen in a dedicated Worker (see
 * workers/background-removal.worker.ts) so the UI thread is never blocked,
 * not even briefly — model loading, WebGPU/WASM setup, and the inference
 * itself all run off-thread. Communication is raw pixel bytes only
 * (transferred, not copied), matching the pattern the codec worker already
 * uses for format conversion.
 *
 * Model + WASM runtime are self-hosted (public/models/, public/ort/) — no
 * calls to Hugging Face's or anyone else's CDN at runtime, matching the
 * app's privacy stance. Lazy-loaded: the worker (and everything it needs)
 * is only created the first time the user enables "Remove background".
 */
let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, { resolve: (v: BackgroundRemovalResponse) => void; reject: (e: Error) => void }>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../workers/background-removal.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<BackgroundRemovalResponse>) => {
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
  const response = await callWorker({ id, data: buffer, width: imageData.width, height: imageData.height });
  if (!response.ok) throw new AppError(response.errorCode, response.message);
  return new ImageData(new Uint8ClampedArray(response.data), response.width, response.height);
}

/** Terminates the worker — e.g. when the app is torn down or after a long idle period. */
export function disposeBackgroundRemovalWorker(): void {
  worker?.terminate();
  worker = null;
  pending.clear();
}
