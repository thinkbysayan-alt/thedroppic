/// <reference lib="webworker" />
import { AppError, ERROR_MESSAGES } from '../types';
import { refineMatte, upsampleAlphaInto } from '../conversion/background-removal-postprocess';
import type { BackgroundRemovalMessage, BackgroundRemovalRequest, BackgroundRemovalResponse } from './background-removal-protocol';

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
let activeDevice: 'webgpu' | 'wasm' = 'wasm';
/** The model's native input size (512 for this export); confirmed against the processor config at load. */
let modelSize = 512;

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
  // Use the cores we actually have on the WASM path (needs cross-origin isolation, which vercel.json sets).
  if (ctx.crossOriginIsolated) env.backends.onnx.wasm!.numThreads = Math.min(8, Math.max(1, ctx.navigator.hardwareConcurrency || 4));

  if (await hasWorkingWebGpu()) {
    try {
      const segmenter = await pipeline('background-removal', MODEL_ID, { device: 'webgpu', dtype: 'fp16' });
      activeDevice = 'webgpu';
      return finishLoad(segmenter);
    } catch {
      // Fall through to the WASM path below — a WebGPU failure here can be
      // anything from an unsupported op to a driver-specific shader limit;
      // it isn't worth surfacing to the user when a working fallback exists.
    }
  }

  const segmenter = await pipeline('background-removal', MODEL_ID, { device: 'wasm', dtype: 'fp16' });
  activeDevice = 'wasm';
  return finishLoad(segmenter);
}

function finishLoad(segmenter: unknown): Segmenter {
  const size = (segmenter as { processor?: { image_processor?: { size?: { width?: number; height?: number } } } }).processor?.image_processor?.size;
  if (size?.width && size.width === size.height) modelSize = size.width;
  return segmenter as Segmenter;
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

/**
 * Squashes the photo to the model's input size using the same canvas scaling
 * Transformers.js applies internally. Handing the pipeline an image that is
 * already the right size lets it skip its own full-resolution canvas round
 * trips, and the full-resolution mask resize and image clone afterwards.
 */
async function downscaleForModel(rgba: Uint8ClampedArray, width: number, height: number, size: number) {
  const { RawImage } = await import('@huggingface/transformers');
  if (width === size && height === size) return new RawImage(new Uint8ClampedArray(rgba), size, size, 4);
  const bitmap = await createImageBitmap(new ImageData(rgba as Uint8ClampedArray<ArrayBuffer>, width, height));
  const canvas = new OffscreenCanvas(size, size);
  const c2d = canvas.getContext('2d')!;
  c2d.drawImage(bitmap, 0, 0, size, size);
  bitmap.close();
  return new RawImage(c2d.getImageData(0, 0, size, size).data, size, size, 4);
}

async function runSegmentation(req: BackgroundRemovalRequest): Promise<BackgroundRemovalResponse> {
  try {
    const t0 = performance.now();
    const segmenter = await withTimeout(getSegmenter(), SEGMENT_TIMEOUT_MS, 'Loading the background removal model timed out');
    const t1 = performance.now();

    // The photo's own RGB stays untouched; only its alpha channel is replaced by the model's matte.
    const rgba = new Uint8ClampedArray(req.data);
    const input = await downscaleForModel(rgba, req.width, req.height, modelSize);
    const t2 = performance.now();

    const [output] = await withTimeout(segmenter([input]), SEGMENT_TIMEOUT_MS, 'Background removal timed out');
    if (!output) throw new Error('Background removal produced no output');
    const t3 = performance.now();

    // The model's matte is small: scale just that up to the photo's size, then clean the edges
    // (see background-removal-postprocess.ts).
    const matte = new Uint8ClampedArray(output.width * output.height);
    for (let i = 0; i < matte.length; i++) matte[i] = output.data[i * 4 + 3]!;
    upsampleAlphaInto(rgba, req.width, req.height, matte, output.width, output.height);
    refineMatte(rgba, req.width, req.height);
    const t4 = performance.now();

    const timings = {
      device: activeDevice,
      modelReadyMs: Math.round(t1 - t0),
      downscaleMs: Math.round(t2 - t1),
      inferenceMs: Math.round(t3 - t2),
      postprocessMs: Math.round(t4 - t3),
    };
    return { id: req.id, ok: true, data: rgba.buffer, width: req.width, height: req.height, timings };
  } catch (err) {
    const appErr = err instanceof AppError ? err : new AppError('conversion-failed', ERROR_MESSAGES['conversion-failed']);
    return { id: req.id, ok: false, errorCode: appErr.code, message: appErr.message };
  }
}

/**
 * Starts loading the model and, once it is ready, runs one throwaway
 * inference so the one-time work (weight download, session creation, WebGPU
 * shader compilation) is done before the user's first real image.
 *
 * Deliberately NOT queued while loading: a real request must be able to time
 * out on a stalled load by itself (see runSegmentation), so nothing here may
 * sit ahead of it in the queue until the model actually exists. Failures are
 * ignored: a real request retries the load and reports its own error.
 */
function warmUp(): void {
  getSegmenter()
    .then((segmenter) =>
      enqueue(async () => {
        const { RawImage } = await import('@huggingface/transformers');
        const blank = new RawImage(new Uint8ClampedArray(modelSize * modelSize * 4), modelSize, modelSize, 4);
        await withTimeout(segmenter([blank]), SEGMENT_TIMEOUT_MS, 'Warm-up timed out');
      }),
    )
    .catch(() => {
      // Ignored on purpose, see above.
    });
}

ctx.onmessage = async (event: MessageEvent<BackgroundRemovalMessage>) => {
  const msg = event.data;
  if (msg.kind === 'warmup') {
    warmUp();
    return;
  }
  const response = await enqueue(() => runSegmentation(msg));
  const transfer = response.ok ? [response.data] : [];
  ctx.postMessage(response, transfer);
};
