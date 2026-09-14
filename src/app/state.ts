import type { AppError, CropRegion, OutputFormat, SourceFormat } from '../types';

export interface UploadedImage {
  file: File;
  sourceFormat: SourceFormat;
  previewUrl: string;
  width: number;
  height: number;
}

/**
 * One image's progress within a multi-image (2-5 files) batch. Each item is
 * converted, previewed, and downloaded fully independently of the others —
 * one item failing or still converting never blocks or affects any other.
 * No crop step here (single-image-only, to keep the batch view focused) and
 * no ZIP/bulk download — every item downloads on its own.
 */
export type BatchItemState =
  | { status: 'ready'; image: UploadedImage; outputFormat: OutputFormat; quality: number; removeBackground: boolean }
  | { status: 'converting'; image: UploadedImage; outputFormat: OutputFormat; quality: number; removeBackground: boolean }
  | {
      status: 'result';
      image: UploadedImage;
      outputFormat: OutputFormat;
      quality: number;
      removeBackground: boolean;
      /** A browser-renderable preview of the converted pixels — same content as resultBlob, but always displayable even for formats (TIFF) an <img> tag can't show. */
      displayUrl: string;
      resultBlob: Blob;
      resultUrl: string;
      resultFilename: string;
      resultByteLength: number;
      resultWidth: number;
      resultHeight: number;
    }
  | { status: 'error'; fileName: string; error: AppError };

export interface BatchItem {
  id: string;
  state: BatchItemState;
}

export type View =
  | { kind: 'idle' }
  | {
      kind: 'ready';
      image: UploadedImage;
      outputFormat: OutputFormat;
      quality: number;
      crop: CropRegion | null;
      removeBackground: boolean;
      /** Preview URL reflecting the applied crop, if any (distinct from image.previewUrl, the original). */
      croppedPreviewUrl: string | null;
    }
  | {
      kind: 'cropping';
      image: UploadedImage;
      initialCrop: CropRegion | null;
      outputFormat: OutputFormat;
      quality: number;
      removeBackground: boolean;
    }
  | {
      kind: 'converting';
      image: UploadedImage;
      outputFormat: OutputFormat;
      quality: number;
      crop: CropRegion | null;
      removeBackground: boolean;
    }
  | {
      kind: 'result';
      image: UploadedImage;
      outputFormat: OutputFormat;
      quality: number;
      crop: CropRegion | null;
      removeBackground: boolean;
      /** A browser-renderable preview of the converted pixels — same content as resultBlob, but always displayable even for formats (TIFF) an <img> tag can't show. */
      displayUrl: string;
      resultBlob: Blob;
      resultUrl: string;
      resultFilename: string;
      resultByteLength: number;
      resultWidth: number;
      resultHeight: number;
    }
  | { kind: 'error'; error: AppError; recoverable: boolean }
  | { kind: 'batch'; items: BatchItem[] };

type Listener = (view: View) => void;

class Store {
  private view: View = { kind: 'idle' };
  private listeners = new Set<Listener>();

  get(): View {
    return this.view;
  }

  set(next: View): void {
    this.view = next;
    for (const listener of this.listeners) listener(this.view);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const store = new Store();
