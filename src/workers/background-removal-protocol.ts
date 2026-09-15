import type { AppErrorCode } from '../types';

export interface BackgroundRemovalRequest {
  id: number;
  /** Raw RGBA pixel bytes — transferred, not copied. */
  data: ArrayBuffer;
  width: number;
  height: number;
}

export type BackgroundRemovalResponse =
  | { id: number; ok: true; data: ArrayBuffer; width: number; height: number }
  | { id: number; ok: false; errorCode: AppErrorCode; message: string };
