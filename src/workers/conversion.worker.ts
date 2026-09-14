/// <reference lib="webworker" />
import { AppError, ERROR_MESSAGES, OUTPUT_FORMAT_MIME } from '../types';
import { cropImageData, flattenBackground, hasAlphaChannel, resolveBackgroundFill } from '../utils/image';
import { decodeSource, encodeOutput } from '../conversion/decode';
import type { WorkerRequest, WorkerResponse } from './protocol';

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;

  try {
    if (req.kind === 'decode-preview') {
      const { imageData, width, height } = await decodeSource(req.sourceFormat, req.buffer);
      const response: WorkerResponse = { id: req.id, ok: true, kind: 'decode-preview', imageData, width, height };
      ctx.postMessage(response, [imageData.data.buffer]);
      return;
    }

    // req.kind === 'convert' | 'encode-processed'
    let working: ImageData;
    if (req.kind === 'convert') {
      const { imageData: sourceData } = await decodeSource(req.sourceFormat, req.buffer);
      working = req.options.crop ? cropImageData(sourceData, req.options.crop) : sourceData;
    } else {
      // Already decoded, cropped, and (for background removal) given an
      // alpha channel by the main thread — see workers/protocol.ts.
      working = req.imageData;
    }

    if (hasAlphaChannel(working)) {
      const fill = resolveBackgroundFill(req.options.outputFormat);
      if (fill) working = flattenBackground(working, fill);
    }

    const encoded = await encodeOutput(req.options.outputFormat, working, req.options.quality);
    const response: WorkerResponse = {
      id: req.id,
      ok: true,
      kind: 'convert',
      buffer: encoded,
      mime: OUTPUT_FORMAT_MIME[req.options.outputFormat],
      width: working.width,
      height: working.height,
    };
    ctx.postMessage(response, [encoded]);
  } catch (err) {
    const appErr =
      err instanceof AppError ? err : new AppError('conversion-failed', ERROR_MESSAGES['conversion-failed']);
    const response: WorkerResponse = { id: req.id, ok: false, errorCode: appErr.code, message: appErr.message };
    ctx.postMessage(response);
  }
};
