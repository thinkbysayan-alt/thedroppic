/// <reference lib="webworker" />
import { AppError, ERROR_MESSAGES } from '../types';
import { refineMatte } from '../conversion/background-removal-postprocess';
import type { BackgroundRemovalRequest, BackgroundRemovalResponse } from './background-removal-protocol';

/**
 * BiRefNet Lite background removal (ZhengPeng7/BiRefNet_lite, MIT — a
 * dichotomous-image-segmentation model, distilled/lite variant of BiRefNet),
 * exported for the web by `studioludens/birefnet-lite-512`. This export was
 * chosen specifically because the "official" onnx-community/BiRefNet_lite
 * export exceeds WebGPU's MaxStorageBuffersPerShaderStage (16) limit on
 * most devices; this one is pre-split/optimized for onnxruntime-web and
 * loads and runs correctly under both WebGPU and WASM (verified locally
 * before wiring in).
 *
 * Runs entirely inside its own dedicated Worker so the UI thread never
 * blocks during model load or inference. This is possible because
 * `RawImage` can be built from and read back to a plain `Uint8ClampedArray`
 * directly (no canvas needed at all — verified against transformers.js's
 * own source) — the main thread never sends this worker anything but raw
 * pixel bytes, and never needs a DOM canvas here to get them back out.
 *
 * WebGPU is tried first (device: 'webgpu', dtype: 'fp16'); if that fails for
 * any reason (no WebGPU support, an unsupported op, a driver limit) this
 * falls back to WASM using the *same* fp16 weights (this export ships no
 * int8-quantized build). WASM + fp16 is slower on CPU than a quantized
 * model would be, but it's correct and never crashes. The chosen path is
 * cached for the lifetime of this worker so a failed WebGPU attempt is
 * never retried on every image.
 *
 * Unlike MODNet before it, this model's weights are fetched from Hugging
 * Face's CDN at runtime (browser-cached after the first load) rather than
 * self-hosted — its fp16 build alone is 94MB and its fp32 build is 183MB,
 * over both GitHub's 100MB push limit and Vercel's deployment file-size
 * limit. This only affects where the *model* comes from; user images are
 * still never uploaded anywhere — inference still runs entirely on-device.
 */
const MODEL_ID = 'studioludens/birefnet-lite-512';
const SEGMENT_TIMEOUT_MS = 90_000; // Larger budget than MODNet's: this model is a much bigger download/graph.

const ctx = self as unknown as DedicatedWorkerGlobalScope;

type Segmenter = (images: unknown[]) => Promise<Array<{ data: Uint8ClampedArray; width: number; height: number; channels: number }>>;

let segmenterPromise: Promise<Segmenter> | null = null;

/**
 * Actually requests a WebGPU adapter rather than just checking for the
 * `navigator.gpu` property — some browsers expose the API but have no
 * usable adapter (disabled in settings, no compatible GPU, etc.), which
 * would otherwise only surface as a confusing failure deep inside model
 * loading.
 */
async function hasWorkingWebGpu(): Promise<boolean> {
  if (!('gpu' in ctx.navigator)) return false;
  try {
    const adapter = await (ctx.navigator as unknown as { gpu: { requestAdapter: () => Promise<unknown> } }).gpu.requestAdapter();
    return adapter != null;
  } catch {
    return false;
  }
}

async function loadSegmenter(): Promise<Segmenter> {
  const { pipeline, env } = await import('@huggingface/transformers');

  // The ONNX Runtime WASM binary is still self-hosted (small, and lets us
  // pin the WebGPU-capable build) — only the model weights themselves come
  // from Hugging Face's CDN, browser-cached after the first fetch.
  env.allowRemoteModels = true;
  env.allowLocalModels = false;
  env.backends.onnx.wasm!.wasmPaths = '/ort/';

  if (await hasWorkingWebGpu()) {
    try {
      const segmenter = await pipeline('background-removal', MODEL_ID, { device: 'webgpu', dtype: 'fp16' });
      return segmenter as unknown as Segmenter;
    } catch {
      // Fall through to the WASM path below — a WebGPU failure here can be
      // anything from an unsupported op to a driver-specific shader limit;
      // it isn't worth surfacing to the user when a working fallback exists.
    }
  }

  const segmenter = await pipeline('background-removal', MODEL_ID, { device: 'wasm', dtype: 'fp16' });
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
