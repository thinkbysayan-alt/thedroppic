/// <reference lib="webworker" />
import { AppError, ERROR_MESSAGES } from '../types';
import { refineMatte } from '../conversion/background-removal-postprocess';
import type { BackgroundRemovalRequest, BackgroundRemovalResponse } from './background-removal-protocol';

/**
 * MODNet background removal, running entirely inside its own dedicated
 * Worker so the UI thread never blocks during model load or inference.
 * This is possible because `RawImage` can be built from and read back to
 * a plain `Uint8ClampedArray` directly (no canvas needed at all — verified
 * against transformers.js's own source) — the main thread never sends
 * this worker anything but raw pixel bytes, and never needs a DOM canvas
 * here to get them back out.
 *
 * WebGPU is tried first (device: 'webgpu', dtype: 'fp16' — a small,
 * GPU-friendly build); if that fails for any reason (no WebGPU support,
 * an unsupported op, a driver limit) this falls back to the
 * proven-working WASM + int8-quantized build. The chosen path is cached
 * for the lifetime of this worker so a failed WebGPU attempt is never
 * retried on every image.
 */
const MODEL_ID = 'onnx-community/modnet-webnn';
const SEGMENT_TIMEOUT_MS = 60_000;

const ctx = self as unknown as DedicatedWorkerGlobalScope;

type Segmenter = (images: unknown[]) => Promise<Array<{ data: Uint8ClampedArray; width: number; height: number; channels: number }>>;

let segmenterPromise: Promise<Segmenter> | null = null;

async function loadSegmenter(): Promise<Segmenter> {
  const { pipeline, env } = await import('@huggingface/transformers');

  // Self-hosted only — never fetch the model or the ONNX Runtime WASM
  // binary from Hugging Face's CDN or anywhere else at runtime.
  env.allowRemoteModels = false;
  env.allowLocalModels = true;
  env.localModelPath = '/models/';
  env.backends.onnx.wasm!.wasmPaths = '/ort/';

  const hasWebGpu = 'gpu' in ctx.navigator;
  if (hasWebGpu) {
    try {
      const segmenter = await pipeline('background-removal', MODEL_ID, { device: 'webgpu', dtype: 'fp16' });
      return segmenter as unknown as Segmenter;
    } catch {
      // Fall through to the WASM path below — a WebGPU failure here can be
      // anything from "no adapter" to a driver-specific shader limit (as
      // seen with other models); it isn't worth surfacing to the user when
      // a proven-working fallback exists.
    }
  }

  const segmenter = await pipeline('background-removal', MODEL_ID, { device: 'wasm', dtype: 'q8' });
  return segmenter as unknown as Segmenter;
}

function getSegmenter(): Promise<Segmenter> {
  if (!segmenterPromise) {
    segmenterPromise = loadSegmenter().catch((err) => {
      segmenterPromise = null; // allow retrying with a fresh load on the next call instead of caching a failure forever
      throw err;
    });
  }
  return segmenterPromise;
}

/** Only one inference in flight against the shared session at a time. */
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = queue.then(task, task);
  queue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

async function runSegmentation(req: BackgroundRemovalRequest): Promise<BackgroundRemovalResponse> {
  try {
    const segmenter = await withTimeout(getSegmenter(), SEGMENT_TIMEOUT_MS, 'Loading the background removal model timed out');

    const { RawImage } = await import('@huggingface/transformers');
    const input = new RawImage(new Uint8ClampedArray(req.data), req.width, req.height, 4);

    const [output] = await withTimeout(segmenter([input]), SEGMENT_TIMEOUT_MS, 'Background removal timed out');
    if (!output) throw new Error('Background removal produced no output');

    // RGB = the original photo, alpha = MODNet's raw soft matte — see
    // background-removal-postprocess.ts for what happens to it next.
    const rgba = new Uint8ClampedArray(output.data);
    refineMatte(rgba, output.width, output.height);

    return { id: req.id, ok: true, data: rgba.buffer, width: output.width, height: output.height };
  } catch (err) {
    const appErr = err instanceof AppError ? err : new AppError('conversion-failed', ERROR_MESSAGES['conversion-failed']);
    return { id: req.id, ok: false, errorCode: appErr.code, message: appErr.message };
  }
}

ctx.onmessage = async (event: MessageEvent<BackgroundRemovalRequest>) => {
  const response = await enqueue(() => runSegmentation(event.data));
  const transfer = response.ok ? [response.data] : [];
  ctx.postMessage(response, transfer);
};
