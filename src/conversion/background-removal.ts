import { AppError } from '../types';

/**
 * AI background removal — MODNet (ZHKKKe/MODNet, Apache-2.0), a trimap-free
 * portrait-matting model, run via Transformers.js (huggingface/transformers.js,
 * Apache-2.0) on top of ONNX Runtime Web. Replaces an earlier MediaPipe
 * Selfie Segmentation implementation, whose coarse binary-ish mask produced
 * hard "sticker" edges; MODNet instead outputs a continuous soft alpha
 * matte, which is what actually fixes hard edges, hair fringing, and halos.
 *
 * Model + WASM runtime are self-hosted (public/models/, public/ort/) — no
 * calls to Hugging Face's or anyone else's CDN at runtime, matching the
 * app's privacy stance. Lazy-loaded (dynamic `import()`), only downloaded
 * the first time the user enables "Remove background": ~6.3MB int8-quantized
 * model + ~12.9MB ONNX Runtime Web WASM binary.
 *
 * Runs on the **main thread**. Transformers.js/onnxruntime-web can run in a
 * Worker in principle, but that path needs a second self-hosted WASM/model
 * fetch setup and its own testing surface; given the size of this change
 * already (swapping the entire segmentation model), keeping this on the
 * main thread — same as the implementation it replaces — was the safer
 * scope call. The heavy step is a single bounded inference call (not a
 * render loop), so a brief main-thread pause here is consistent with how
 * e.g. the cropper's preview generation already works.
 */
type PipelineTask = 'background-removal';

interface RawImageLike {
  toCanvas(): OffscreenCanvas | HTMLCanvasElement;
}

interface BackgroundRemovalPipeline {
  (images: unknown[]): Promise<RawImageLike[]>;
}

const MODEL_ID = 'onnx-community/modnet-webnn';
/** Generous but bounded — a hung/stuck inference should fail loudly, not freeze the UI forever. */
const SEGMENT_TIMEOUT_MS = 60_000;

let pipelinePromise: Promise<BackgroundRemovalPipeline> | null = null;

async function getPipeline(): Promise<BackgroundRemovalPipeline> {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const { pipeline, env } = await import('@huggingface/transformers');

      // Self-hosted only — never fetch the model or the ONNX Runtime WASM
      // binary from Hugging Face's CDN or anywhere else at runtime.
      env.allowRemoteModels = false;
      env.allowLocalModels = true;
      env.localModelPath = '/models/';
      env.backends.onnx.wasm!.wasmPaths = '/ort/';

      const segmenter = await pipeline('background-removal' as PipelineTask, MODEL_ID, {
        device: 'wasm',
        dtype: 'q8', // resolves to the self-hosted onnx/model_quantized.onnx
      });
      return segmenter as unknown as BackgroundRemovalPipeline;
    })().catch((err) => {
      pipelinePromise = null; // allow retrying with a fresh load on the next call instead of caching a failure forever
      throw err;
    });
  }
  return pipelinePromise;
}

/**
 * The underlying pipeline holds one model session; running two inferences
 * concurrently against it is both wasteful and (depending on the execution
 * provider) not guaranteed safe. This serializes every `removeBackground`
 * call onto one at a time — the same protection the previous implementation
 * had for the same reason.
 */
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = queue.then(task, task);
  queue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

/**
 * Runs AI subject/background segmentation on `imageData` and returns a new
 * ImageData with a proper soft alpha channel — background pixels transparent,
 * foreground edges (including fine hair detail) smoothly feathered rather
 * than a hard binary cutout. The original resolution and proportions are
 * preserved throughout; only the alpha channel changes.
 */
export function removeBackground(imageData: ImageData): Promise<ImageData> {
  return enqueue(() => runSegmentation(imageData));
}

async function runSegmentation(imageData: ImageData): Promise<ImageData> {
  try {
    const segmenter = await withTimeout(getPipeline(), SEGMENT_TIMEOUT_MS, 'Loading the background removal model timed out');

    const { RawImage } = await import('@huggingface/transformers');
    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = imageData.width;
    sourceCanvas.height = imageData.height;
    const sourceCtx = sourceCanvas.getContext('2d');
    if (!sourceCtx) throw new AppError('browser-unsupported', "Your browser doesn't support this conversion yet.");
    sourceCtx.putImageData(imageData, 0, 0);

    const input = await RawImage.fromCanvas(sourceCanvas);
    const [output] = await withTimeout(segmenter([input]), SEGMENT_TIMEOUT_MS, 'Background removal timed out');
    if (!output) throw new Error('Background removal produced no output');

    const resultCanvas = output.toCanvas();
    const resultCtx = resultCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;
    if (!resultCtx) throw new AppError('browser-unsupported', "Your browser doesn't support this conversion yet.");

    // The model's fixed 256x256 input means its output can come back at a
    // different resolution — resample back onto a canvas sized to the
    // original image so the app's "dimensions are always preserved" rule
    // holds for the cutout's alpha too.
    if (resultCanvas.width !== imageData.width || resultCanvas.height !== imageData.height) {
      const resized = document.createElement('canvas');
      resized.width = imageData.width;
      resized.height = imageData.height;
      const resizedCtx = resized.getContext('2d');
      if (!resizedCtx) throw new AppError('browser-unsupported', "Your browser doesn't support this conversion yet.");
      resizedCtx.drawImage(resultCanvas, 0, 0, imageData.width, imageData.height);
      return resizedCtx.getImageData(0, 0, imageData.width, imageData.height);
    }

    return resultCtx.getImageData(0, 0, imageData.width, imageData.height);
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('conversion-failed', "We couldn't remove the background from this image. Please try again.");
  }
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
