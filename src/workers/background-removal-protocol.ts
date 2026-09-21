import type { AppErrorCode } from '../types';

export interface BackgroundRemovalRequest {
  kind: 'segment';
  id: number;
  /** Raw RGBA pixel bytes — transferred, not copied. */
  data: ArrayBuffer;
  width: number;
  height: number;
}

/** Starts loading the model ahead of the first real image. Fire-and-forget: no response. */
export interface BackgroundRemovalWarmup {
  kind: 'warmup';
}

export type BackgroundRemovalMessage = BackgroundRemovalRequest | BackgroundRemovalWarmup;

export interface BackgroundRemovalTimings {
  device: 'webgpu' | 'wasm';
  modelReadyMs: number;
  downscaleMs: number;
  inferenceMs: number;
  postprocessMs: number;
}

export type BackgroundRemovalResponse =
  | { id: number; ok: true; data: ArrayBuffer; width: number; height: number; timings: BackgroundRemovalTimings }
  | { id: number; ok: false; errorCode: AppErrorCode; message: string };
