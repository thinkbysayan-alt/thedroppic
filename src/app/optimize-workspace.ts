import { detectFormat } from '../conversion/format-detector';
import { generatePreview } from '../conversion/preview';
import { convertImage, decodeForPreview } from '../conversion/conversion-manager';
import { renderUploadCard, listenForClipboardPaste } from '../components/upload/upload';
import { renderPreview } from '../components/preview/image-preview';
import { renderCompressionSlider, COMPRESSION_QUALITY, type CompressionLevel } from '../components/quality-control/compression-slider';
import { downloadBlob } from '../utils/download';
import { revokeObjectUrl, trackObjectUrl } from '../utils/memory';
import { buildOutputFilename, formatFileSize } from '../utils/file';
import { imageDataToBlob } from '../utils/image';
import { AppError, LOSSY_FORMATS, type OutputFormat, type SourceFormat } from '../types';
import type { UploadedImage } from './state';

/**
 * The Optimize / Compress tool. Deliberately its own small engine rather
 * than a mode bolted onto tool-workspace.ts: it has no format choice (output
 * always matches the source format — HEIC is the one exception, since there
 * is no HEIC encoder, so it falls back to JPEG) and no crop; its one real
 * control is the Small/Medium/Original preset. Every result is a genuine
 * re-encode at that preset's quality — no renamed files, no hardcoded
 * savings numbers (see compression-slider.ts for the quality mapping).
 */
interface OptimizeItemBase {
  id: string;
  image: UploadedImage;
  level: CompressionLevel;
}

type OptimizeItemState =
  | (OptimizeItemBase & { status: 'ready' })
  | (OptimizeItemBase & { status: 'compressing' })
  | (OptimizeItemBase & {
      status: 'result';
      outputFormat: OutputFormat;
      displayUrl: string;
      resultBlob: Blob;
      resultFilename: string;
      resultByteLength: number;
      resultWidth: number;
      resultHeight: number;
    })
  | { id: string; status: 'error'; fileName: string; error: AppError };

type OptimizeView = { kind: 'idle' } | { kind: 'items'; items: OptimizeItemState[] };

/** HEIC has no encoder in this app — optimize falls back to a high-quality JPEG re-encode, same as every other tool would have to. */
function outputFormatFor(source: SourceFormat): OutputFormat {
  return source === 'heic' ? 'jpeg' : source;
}

class Store {
  private view: OptimizeView = { kind: 'idle' };
  private listeners = new Set<(view: OptimizeView) => void>();
  get(): OptimizeView {
    return this.view;
  }
  set(next: OptimizeView): void {
    this.view = next;
    for (const listener of this.listeners) listener(this.view);
  }
  subscribe(listener: (view: OptimizeView) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export function createOptimizeWorkspace() {
  const store = new Store();
  let unlistenPaste: (() => void) | null = null;
  let idCounter = 0;

  function collectUrls(view: OptimizeView): Set<string> {
    const urls = new Set<string>();
    if (view.kind === 'items') {
      for (const item of view.items) {
        if (item.status === 'error') continue;
        urls.add(item.image.previewUrl);
        if (item.status === 'result') urls.add(item.displayUrl);
      }
    }
    return urls;
  }

  function setView(next: OptimizeView): void {
    const prevUrls = collectUrls(store.get());
    const nextUrls = collectUrls(next);
    for (const url of prevUrls) {
      if (!nextUrls.has(url)) revokeObjectUrl(url);
    }
    store.set(next);
  }

  function updateItem(id: string, next: OptimizeItemState): void {
    const view = store.get();
    if (view.kind !== 'items') return;
    setView({ kind: 'items', items: view.items.map((it) => (it.id === id ? next : it)) });
  }

  async function handleFiles(files: File[]): Promise<void> {
    if (files.length === 0) return;
    const items: OptimizeItemState[] = await Promise.all(
      files.map(async (file): Promise<OptimizeItemState> => {
        const id = `opt-${++idCounter}`;
        try {
          const sourceFormat = await detectFormat(file);
          if (!sourceFormat) throw new AppError('unsupported-format', "This image format isn't supported.");
          const preview = await generatePreview(file, sourceFormat);
          trackObjectUrl(preview.url);
          const image: UploadedImage = {
            file,
            sourceFormat,
            previewUrl: preview.url,
            width: preview.width,
            height: preview.height,
          };
          return { id, status: 'ready', image, level: 'medium' };
        } catch (err) {
          const appError =
            err instanceof AppError ? err : new AppError('conversion-failed', "We couldn't read this image. Please try again.");
          return { id, status: 'error', fileName: file.name, error: appError };
        }
      }),
    );
    setView({ kind: 'items', items });
  }

  async function runOptimize(id: string): Promise<void> {
    const view = store.get();
    if (view.kind !== 'items') return;
    const item = view.items.find((it) => it.id === id);
    if (!item || item.status !== 'ready') return;

    updateItem(id, { id, status: 'compressing', image: item.image, level: item.level });

    try {
      const outputFormat = outputFormatFor(item.image.sourceFormat);
      const quality = COMPRESSION_QUALITY[item.level];
      const result = await convertImage(item.image.file, item.image.sourceFormat, {
        outputFormat,
        quality,
        crop: null,
        removeBackground: false,
      });

      const resultUrl = URL.createObjectURL(result.blob);
      trackObjectUrl(resultUrl);
      let displayUrl = resultUrl;
      if (outputFormat === 'tiff') {
        const decoded = await decodeForPreview(new File([result.blob], 'preview.tiff'), 'tiff');
        const previewBlob = await imageDataToBlob(decoded.imageData);
        displayUrl = URL.createObjectURL(previewBlob);
        trackObjectUrl(displayUrl);
      }

      updateItem(id, {
        id,
        status: 'result',
        image: item.image,
        level: item.level,
        outputFormat,
        displayUrl,
        resultBlob: result.blob,
        resultFilename: buildOutputFilename(item.image.file.name, outputFormat),
        resultByteLength: result.byteLength,
        resultWidth: result.width,
        resultHeight: result.height,
      });
    } catch (err) {
      const appError =
        err instanceof AppError ? err : new AppError('conversion-failed', "We couldn't optimize this image. Please try again.");
      updateItem(id, { id, status: 'error', fileName: item.image.file.name, error: appError });
    }
  }

  function resetToUpload(): void {
    setView({ kind: 'idle' });
  }

  function render(view: OptimizeView, container: HTMLElement): void {
    container.replaceChildren();
    if (view.kind === 'idle') {
      const wrap = document.createElement('div');
      wrap.id = 'upload';
      wrap.appendChild(renderUploadCard({ onFiles: (files) => void handleFiles(files) }));
      container.appendChild(wrap);
      return;
    }

    const wrap = document.createElement('div');
    wrap.className = 'workspace workspace--batch';

    const doneCount = view.items.filter((it) => it.status === 'result').length;
    const heading = document.createElement('p');
    heading.className = 'batch-heading';
    heading.textContent =
      view.items.length === 1
        ? doneCount === 1
          ? 'Optimized'
          : 'Ready to optimize'
        : `${view.items.length} images: ${doneCount} of ${view.items.length} optimized`;
    wrap.appendChild(heading);

    const grid = document.createElement('div');
    grid.className = 'batch-grid';
    for (const item of view.items) grid.appendChild(renderItem(item));
    wrap.appendChild(grid);

    const startOverBtn = document.createElement('button');
    startOverBtn.type = 'button';
    startOverBtn.className = 'btn btn-secondary btn-block';
    startOverBtn.textContent = view.items.length === 1 ? 'Choose a different image' : 'Choose different images';
    startOverBtn.addEventListener('click', resetToUpload);
    wrap.appendChild(startOverBtn);

    container.appendChild(wrap);
  }

  function renderItem(item: OptimizeItemState): HTMLElement {
    const card = document.createElement('div');
    card.className = 'panel batch-item';

    if (item.status === 'error') {
      card.innerHTML = `<p class="batch-item__filename"></p><p class="batch-item__error"></p>`;
      card.querySelector('.batch-item__filename')!.textContent = item.fileName;
      card.querySelector('.batch-item__error')!.textContent = item.error.message;
      return card;
    }

    card.appendChild(
      renderPreview({
        url: item.status === 'result' ? item.displayUrl : item.image.previewUrl,
        filename: item.status === 'result' ? item.resultFilename : item.image.file.name,
        fileSize: item.status === 'result' ? item.resultByteLength : item.image.file.size,
        width: item.status === 'result' ? item.resultWidth : item.image.width,
        height: item.status === 'result' ? item.resultHeight : item.image.height,
      }),
    );

    if (item.status === 'ready') {
      const losslessFormat = !LOSSY_FORMATS.has(outputFormatFor(item.image.sourceFormat));
      card.appendChild(
        renderCompressionSlider(item.level, losslessFormat, {
          onChange: (level) => updateItem(item.id, { ...item, level }),
        }),
      );

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-primary btn-block batch-item__action';
      btn.textContent = 'Optimize image';
      btn.addEventListener('click', () => void runOptimize(item.id));
      card.appendChild(btn);
    } else if (item.status === 'compressing') {
      const status = document.createElement('p');
      status.className = 'status-line batch-item__action';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      status.innerHTML = `<span class="spinner" aria-hidden="true"></span> Optimizing…`;
      card.appendChild(status);
    } else {
      const originalBytes = item.image.file.size;
      const savedPct = Math.max(0, Math.round((1 - item.resultByteLength / originalBytes) * 100));
      const summary = document.createElement('div');
      summary.className = 'result-badge batch-item__badge';
      summary.innerHTML = `
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0Z" clip-rule="evenodd"/>
        </svg>
        <span>${formatFileSize(originalBytes)} → ${formatFileSize(item.resultByteLength)}${
          savedPct > 0 ? ` (${savedPct}% smaller)` : ''
        }</span>
      `;
      card.appendChild(summary);

      const downloadBtn = document.createElement('button');
      downloadBtn.type = 'button';
      downloadBtn.className = 'btn btn-primary btn-block batch-item__action';
      downloadBtn.textContent = 'Download image';
      downloadBtn.addEventListener('click', () => downloadBlob(item.resultBlob, item.resultFilename));
      card.appendChild(downloadBtn);
    }

    return card;
  }

  return {
    mount(container: HTMLElement): void {
      unlistenPaste = listenForClipboardPaste((file) => void handleFiles([file]));
      store.subscribe((view) => render(view, container));
      render(store.get(), container);
    },
    unmount(): void {
      unlistenPaste?.();
      unlistenPaste = null;
      for (const url of collectUrls(store.get())) revokeObjectUrl(url);
    },
  };
}
