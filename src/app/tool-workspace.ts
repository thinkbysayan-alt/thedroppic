import { detectFormat } from '../conversion/format-detector';
import { getDefaultOutputFormat } from '../conversion/capability-matrix';
import { generatePreview } from '../conversion/preview';
import { convertImage, decodeForPreview } from '../conversion/conversion-manager';
import { renderUploadCard, listenForClipboardPaste } from '../components/upload/upload';
import { renderPreview } from '../components/preview/image-preview';
import { renderFormatSelector } from '../components/format-selector/format-selector';
import { renderQualityControl } from '../components/quality-control/quality-slider';
import { preloadBackgroundRemoval } from '../conversion/background-removal';
import { renderBackgroundRemovalToggle } from '../components/quality-control/background-removal-toggle';
import { renderCropper } from '../components/cropper/cropper';
import { renderResultPanel } from '../components/result/result-panel';
import { renderErrorBanner } from '../components/errors/error-banner';
import { decodeToOrientedBitmap, bitmapToImageData, cropImageData, imageDataToBlob } from '../utils/image';
import { closeBitmap, revokeObjectUrl, trackObjectUrl } from '../utils/memory';
import { downloadBlob } from '../utils/download';
import { buildOutputFilename, formatFileSize } from '../utils/file';
import { AppError, type CropRegion, type OutputFormat } from '../types';
import type { BatchItem, BatchItemState, UploadedImage, View } from './state';

/**
 * The shared upload → (crop) → convert → result engine behind both the
 * Convert and Remove Background tool pages — they're ~95% the same
 * workflow, differing only in which controls are shown and what the
 * defaults/locks are. (Optimize is different enough — same-format output,
 * a 3-position preset instead of format+quality — that it has its own
 * module, see optimize-workspace.ts, rather than being bolted onto this
 * one with more branching.)
 *
 * Each tool page creates its own instance via `createToolWorkspace` (its
 * own local store), so switching tools via the router never leaks state
 * between them the way one shared global store would.
 */
export interface ToolWorkspaceConfig {
  /** Remove Background always turns this on and never lets the user turn it off. */
  forceRemoveBackground: boolean;
  /** Remove Background shows no format dropdown — output is always PNG, so there's nothing to choose. */
  showFormatSelector: boolean;
  /** Convert shows the "Remove background" checkbox as an optional extra; Remove Background's own page doesn't need to repeat that toggle. */
  showBackgroundToggle: boolean;
}

class Store {
  private view: View = { kind: 'idle' };
  private listeners = new Set<(view: View) => void>();
  get(): View {
    return this.view;
  }
  set(next: View): void {
    this.view = next;
    for (const listener of this.listeners) listener(this.view);
  }
  subscribe(listener: (view: View) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export function createToolWorkspace(config: ToolWorkspaceConfig) {
  const store = new Store();
  let unlistenPaste: (() => void) | null = null;
  let batchIdCounter = 0;

  function collectUrls(view: View): Set<string> {
    const urls = new Set<string>();
    if (view.kind === 'ready') {
      urls.add(view.image.previewUrl);
      if (view.croppedPreviewUrl) urls.add(view.croppedPreviewUrl);
    } else if (view.kind === 'cropping' || view.kind === 'converting') {
      urls.add(view.image.previewUrl);
    } else if (view.kind === 'result') {
      urls.add(view.image.previewUrl);
      urls.add(view.resultUrl);
      urls.add(view.displayUrl);
    } else if (view.kind === 'batch') {
      for (const item of view.items) {
        if (item.state.status === 'error') continue;
        urls.add(item.state.image.previewUrl);
        if (item.state.status === 'result') {
          urls.add(item.state.resultUrl);
          urls.add(item.state.displayUrl);
        }
      }
    }
    return urls;
  }

  function setView(next: View): void {
    const prevUrls = collectUrls(store.get());
    const nextUrls = collectUrls(next);
    for (const url of prevUrls) {
      if (!nextUrls.has(url)) revokeObjectUrl(url);
    }
    store.set(next);
  }

  async function handleIncomingFiles(files: File[]): Promise<void> {
    if (files.length === 0) return;
    if (files.length === 1) {
      await handleIncomingFile(files[0]!);
      return;
    }
    await startBatch(files);
  }

  async function buildUploadedImage(file: File): Promise<UploadedImage> {
    const sourceFormat = await detectFormat(file);
    if (!sourceFormat) {
      throw new AppError('unsupported-format', "This image format isn't supported.");
    }
    const preview = await generatePreview(file, sourceFormat);
    trackObjectUrl(preview.url);
    return { file, sourceFormat, previewUrl: preview.url, width: preview.width, height: preview.height };
  }

  function initialOutputFormat(source: UploadedImage['sourceFormat']): OutputFormat {
    return config.forceRemoveBackground ? 'png' : getDefaultOutputFormat(source);
  }

  async function handleIncomingFile(file: File): Promise<void> {
    // Start loading the AI model now, while the user reviews the image, so the cutout itself starts fast.
    if (config.forceRemoveBackground) preloadBackgroundRemoval();
    try {
      const image = await buildUploadedImage(file);
      setView({
        kind: 'ready',
        image,
        outputFormat: initialOutputFormat(image.sourceFormat),
        quality: 90,
        crop: null,
        removeBackground: config.forceRemoveBackground,
        croppedPreviewUrl: null,
      });
    } catch (err) {
      setError(err);
    }
  }

  async function startBatch(files: File[]): Promise<void> {
    if (config.forceRemoveBackground) preloadBackgroundRemoval();
    const items: BatchItem[] = await Promise.all(
      files.map(async (file): Promise<BatchItem> => {
        const id = `batch-${++batchIdCounter}`;
        try {
          const image = await buildUploadedImage(file);
          return {
            id,
            state: {
              status: 'ready',
              image,
              outputFormat: initialOutputFormat(image.sourceFormat),
              quality: 90,
              removeBackground: config.forceRemoveBackground,
            },
          };
        } catch (err) {
          const appError =
            err instanceof AppError
              ? err
              : new AppError('conversion-failed', "We couldn't convert this image. Please try again.");
          return { id, state: { status: 'error', fileName: file.name, error: appError } };
        }
      }),
    );
    setView({ kind: 'batch', items });
  }

  function updateBatchItem(id: string, next: BatchItemState): void {
    const view = store.get();
    if (view.kind !== 'batch') return;
    setView({ kind: 'batch', items: view.items.map((item) => (item.id === id ? { id, state: next } : item)) });
  }

  async function runBatchItemConversion(id: string): Promise<void> {
    const view = store.get();
    if (view.kind !== 'batch') return;
    const item = view.items.find((it) => it.id === id);
    if (!item || item.state.status !== 'ready') return;
    const { image, outputFormat, quality, removeBackground } = item.state;

    updateBatchItem(id, { status: 'converting', image, outputFormat, quality, removeBackground });

    try {
      const result = await convertImage(image.file, image.sourceFormat, {
        outputFormat,
        quality,
        crop: null,
        removeBackground,
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

      updateBatchItem(id, {
        status: 'result',
        image,
        outputFormat,
        quality,
        removeBackground,
        displayUrl,
        resultBlob: result.blob,
        resultUrl,
        resultFilename: buildOutputFilename(image.file.name, outputFormat),
        resultByteLength: result.byteLength,
        resultWidth: result.width,
        resultHeight: result.height,
      });
    } catch (err) {
      const appError =
        err instanceof AppError ? err : new AppError('conversion-failed', "We couldn't convert this image. Please try again.");
      updateBatchItem(id, { status: 'error', fileName: image.file.name, error: appError });
    }
  }

  function setError(err: unknown): void {
    const appError =
      err instanceof AppError ? err : new AppError('conversion-failed', "We couldn't convert this image. Please try again.");
    setView({ kind: 'error', error: appError, recoverable: true });
  }

  async function runConversion(view: Extract<View, { kind: 'ready' }>): Promise<void> {
    setView({
      kind: 'converting',
      image: view.image,
      outputFormat: view.outputFormat,
      quality: view.quality,
      crop: view.crop,
      removeBackground: view.removeBackground,
    });

    try {
      const result = await convertImage(view.image.file, view.image.sourceFormat, {
        outputFormat: view.outputFormat,
        quality: view.quality,
        crop: view.crop,
        removeBackground: view.removeBackground,
      });

      const resultUrl = URL.createObjectURL(result.blob);
      trackObjectUrl(resultUrl);

      let displayUrl = resultUrl;
      if (view.outputFormat === 'tiff') {
        const decoded = await decodeForPreview(new File([result.blob], 'preview.tiff'), 'tiff');
        const previewBlob = await imageDataToBlob(decoded.imageData);
        displayUrl = URL.createObjectURL(previewBlob);
        trackObjectUrl(displayUrl);
      }

      setView({
        kind: 'result',
        image: view.image,
        outputFormat: view.outputFormat,
        quality: view.quality,
        crop: view.crop,
        removeBackground: view.removeBackground,
        displayUrl,
        resultBlob: result.blob,
        resultUrl,
        resultFilename: buildOutputFilename(view.image.file.name, view.outputFormat),
        resultByteLength: result.byteLength,
        resultWidth: result.width,
        resultHeight: result.height,
      });
    } catch (err) {
      setError(err);
    }
  }

  async function buildCroppedPreviewUrl(previewUrl: string, crop: CropRegion): Promise<string> {
    const response = await fetch(previewUrl);
    const blob = await response.blob();
    const bitmap = await decodeToOrientedBitmap(blob);
    const full = bitmapToImageData(bitmap);
    closeBitmap(bitmap);
    const cropped = cropImageData(full, crop);
    const outBlob = await imageDataToBlob(cropped);
    return URL.createObjectURL(outBlob);
  }

  function resetToUpload(): void {
    setView({ kind: 'idle' });
  }

  function render(view: View, container: HTMLElement): void {
    container.replaceChildren();
    switch (view.kind) {
      case 'idle':
        container.appendChild(renderUploadStage());
        break;
      case 'ready':
        container.appendChild(renderReady(view));
        break;
      case 'cropping':
        container.appendChild(renderCropping(view));
        break;
      case 'converting':
        container.appendChild(renderConverting(view));
        break;
      case 'result':
        container.appendChild(renderResult(view));
        break;
      case 'error':
        container.appendChild(renderErrorBanner(view.error, resetToUpload));
        break;
      case 'batch':
        container.appendChild(renderBatch(view));
        break;
    }
  }

  function renderUploadStage(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.id = 'upload';
    wrap.appendChild(renderUploadCard({ onFiles: (files) => void handleIncomingFiles(files) }));
    return wrap;
  }

  function renderReady(view: Extract<View, { kind: 'ready' }>): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'workspace';

    const previewPanel = document.createElement('div');
    previewPanel.className = 'panel';
    previewPanel.appendChild(
      renderPreview({
        url: view.croppedPreviewUrl ?? view.image.previewUrl,
        filename: view.image.file.name,
        fileSize: view.image.file.size,
        width: view.crop ? Math.round(view.crop.size) : view.image.width,
        height: view.crop ? Math.round(view.crop.size) : view.image.height,
      }),
    );
    wrap.appendChild(previewPanel);

    const controlsPanel = document.createElement('div');
    controlsPanel.className = 'panel';

    if (config.showFormatSelector) {
      const controlsRow = document.createElement('div');
      controlsRow.className = 'controls-row';
      controlsRow.appendChild(
        renderFormatSelector(
          view.image.sourceFormat,
          view.outputFormat,
          { onChange: (outputFormat) => setView({ ...view, outputFormat }) },
          view.removeBackground,
        ),
      );
      controlsRow.appendChild(
        renderQualityControl(view.outputFormat, view.quality, {
          onQualityChange: (quality) => setView({ ...view, quality }),
        }),
      );
      controlsPanel.appendChild(controlsRow);
    }

    if (config.showBackgroundToggle) {
      controlsPanel.appendChild(
        renderBackgroundRemovalToggle(view.removeBackground, {
          onChange: (removeBackground) => {
            if (removeBackground) preloadBackgroundRemoval();
            setView({ ...view, removeBackground, outputFormat: removeBackground ? 'png' : view.outputFormat });
          },
        }),
      );
    }

    if (controlsPanel.children.length > 0) wrap.appendChild(controlsPanel);

    const actions = document.createElement('div');
    actions.className = 'actions';

    const convertBtn = document.createElement('button');
    convertBtn.type = 'button';
    convertBtn.className = 'btn btn-primary btn-block';
    convertBtn.textContent = config.forceRemoveBackground ? 'Remove background' : 'Convert image';
    convertBtn.addEventListener('click', () => void runConversion(view));
    actions.appendChild(convertBtn);

    const secondaryRow = document.createElement('div');
    secondaryRow.className = 'actions actions--row';

    const cropBtn = document.createElement('button');
    cropBtn.type = 'button';
    cropBtn.className = 'btn btn-secondary btn-block';
    cropBtn.textContent = view.crop ? 'Edit crop' : 'Crop to square';
    cropBtn.addEventListener('click', () =>
      setView({
        kind: 'cropping',
        image: view.image,
        initialCrop: view.crop,
        outputFormat: view.outputFormat,
        quality: view.quality,
        removeBackground: view.removeBackground,
      }),
    );
    secondaryRow.appendChild(cropBtn);

    const startOverBtn = document.createElement('button');
    startOverBtn.type = 'button';
    startOverBtn.className = 'btn btn-secondary btn-block';
    startOverBtn.textContent = 'Choose a different image';
    startOverBtn.addEventListener('click', resetToUpload);
    secondaryRow.appendChild(startOverBtn);

    actions.appendChild(secondaryRow);
    wrap.appendChild(actions);

    return wrap;
  }

  function renderCropping(view: Extract<View, { kind: 'cropping' }>): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'workspace';

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.appendChild(
      renderCropper(view.image.previewUrl, {
        onApply: (crop) => {
          void (async () => {
            try {
              const croppedPreviewUrl = await buildCroppedPreviewUrl(view.image.previewUrl, crop);
              trackObjectUrl(croppedPreviewUrl);
              setView({
                kind: 'ready',
                image: view.image,
                outputFormat: view.outputFormat,
                quality: view.quality,
                removeBackground: view.removeBackground,
                crop,
                croppedPreviewUrl,
              });
            } catch (err) {
              setError(err);
            }
          })();
        },
        onCancel: () => {
          void (async () => {
            try {
              const croppedPreviewUrl = view.initialCrop
                ? await buildCroppedPreviewUrl(view.image.previewUrl, view.initialCrop)
                : null;
              if (croppedPreviewUrl) trackObjectUrl(croppedPreviewUrl);
              setView({
                kind: 'ready',
                image: view.image,
                outputFormat: view.outputFormat,
                quality: view.quality,
                removeBackground: view.removeBackground,
                crop: view.initialCrop,
                croppedPreviewUrl,
              });
            } catch (err) {
              setError(err);
            }
          })();
        },
      }),
    );
    wrap.appendChild(panel);
    return wrap;
  }

  function renderConverting(view: Extract<View, { kind: 'converting' }>): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'workspace';

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.appendChild(
      renderPreview({
        url: view.image.previewUrl,
        filename: view.image.file.name,
        fileSize: view.image.file.size,
        width: view.image.width,
        height: view.image.height,
      }),
    );

    const status = document.createElement('p');
    status.className = 'status-line';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.innerHTML = `<span class="spinner" aria-hidden="true"></span> ${
      config.forceRemoveBackground ? 'Removing background…' : 'Converting your image…'
    }`;
    status.style.marginTop = 'var(--space-4)';
    panel.appendChild(status);

    wrap.appendChild(panel);
    return wrap;
  }

  function renderResult(view: Extract<View, { kind: 'result' }>): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'workspace';
    wrap.appendChild(
      renderResultPanel(
        {
          url: view.displayUrl,
          filename: view.resultFilename,
          byteLength: view.resultByteLength,
          width: view.resultWidth,
          height: view.resultHeight,
          outputFormat: view.outputFormat,
        },
        {
          onDownload: () => downloadBlob(view.resultBlob, view.resultFilename),
          onCropToSquare: () =>
            setView({
              kind: 'cropping',
              image: view.image,
              initialCrop: view.crop,
              outputFormat: view.outputFormat,
              quality: view.quality,
              removeBackground: view.removeBackground,
            }),
          onConvertAnother: resetToUpload,
        },
      ),
    );
    return wrap;
  }

  function renderBatch(view: Extract<View, { kind: 'batch' }>): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'workspace workspace--batch';

    const heading = document.createElement('p');
    heading.className = 'batch-heading';
    const doneCount = view.items.filter((it) => it.state.status === 'result').length;
    heading.textContent = `${view.items.length} images: ${doneCount} of ${view.items.length} converted`;
    wrap.appendChild(heading);

    const grid = document.createElement('div');
    grid.className = 'batch-grid';
    for (const item of view.items) grid.appendChild(renderBatchItem(item));
    wrap.appendChild(grid);

    const startOverBtn = document.createElement('button');
    startOverBtn.type = 'button';
    startOverBtn.className = 'btn btn-secondary btn-block';
    startOverBtn.textContent = 'Choose different images';
    startOverBtn.addEventListener('click', resetToUpload);
    wrap.appendChild(startOverBtn);

    return wrap;
  }

  function renderBatchItem(item: BatchItem): HTMLElement {
    const card = document.createElement('div');
    card.className = 'panel batch-item';

    if (item.state.status === 'error') {
      card.innerHTML = `<p class="batch-item__filename"></p><p class="batch-item__error"></p>`;
      card.querySelector('.batch-item__filename')!.textContent = item.state.fileName;
      card.querySelector('.batch-item__error')!.textContent = item.state.error.message;
      return card;
    }

    const { image, outputFormat, quality, removeBackground } = item.state;

    card.appendChild(
      renderPreview({
        url: item.state.status === 'result' ? item.state.displayUrl : image.previewUrl,
        filename: item.state.status === 'result' ? item.state.resultFilename : image.file.name,
        fileSize: item.state.status === 'result' ? item.state.resultByteLength : image.file.size,
        width: item.state.status === 'result' ? item.state.resultWidth : image.width,
        height: item.state.status === 'result' ? item.state.resultHeight : image.height,
      }),
    );

    if (item.state.status === 'ready') {
      const readyState = item.state;

      if (config.showFormatSelector) {
        const controlsRow = document.createElement('div');
        controlsRow.className = 'controls-row';
        controlsRow.appendChild(
          renderFormatSelector(
            image.sourceFormat,
            outputFormat,
            { onChange: (nextFormat) => updateBatchItem(item.id, { ...readyState, outputFormat: nextFormat }) },
            removeBackground,
          ),
        );
        controlsRow.appendChild(
          renderQualityControl(outputFormat, quality, {
            onQualityChange: (nextQuality) => updateBatchItem(item.id, { ...readyState, quality: nextQuality }),
          }),
        );
        card.appendChild(controlsRow);
      }

      if (config.showBackgroundToggle) {
        card.appendChild(
          renderBackgroundRemovalToggle(removeBackground, {
            onChange: (next) =>
              updateBatchItem(item.id, { ...readyState, removeBackground: next, outputFormat: next ? 'png' : outputFormat }),
          }),
        );
      }

      const convertBtn = document.createElement('button');
      convertBtn.type = 'button';
      convertBtn.className = 'btn btn-primary btn-block batch-item__action';
      convertBtn.textContent = config.forceRemoveBackground ? 'Remove background' : 'Convert image';
      convertBtn.addEventListener('click', () => void runBatchItemConversion(item.id));
      card.appendChild(convertBtn);
    } else if (item.state.status === 'converting') {
      const status = document.createElement('p');
      status.className = 'status-line batch-item__action';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      status.innerHTML = `<span class="spinner" aria-hidden="true"></span> ${
        config.forceRemoveBackground ? 'Removing…' : 'Converting…'
      }`;
      card.appendChild(status);
    } else {
      const resultState = item.state;
      const badge = document.createElement('div');
      badge.className = 'result-badge batch-item__badge';
      badge.innerHTML = `
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0Z" clip-rule="evenodd"/>
        </svg>
        <span>${formatFileSize(resultState.resultByteLength)}, ready</span>
      `;
      card.appendChild(badge);

      const downloadBtn = document.createElement('button');
      downloadBtn.type = 'button';
      downloadBtn.className = 'btn btn-primary btn-block batch-item__action';
      downloadBtn.textContent = 'Download image';
      downloadBtn.addEventListener('click', () => downloadBlob(resultState.resultBlob, resultState.resultFilename));
      card.appendChild(downloadBtn);
    }

    return card;
  }

  return {
    /** Mounts the workspace into `container` and subscribes it to re-render on every state change. Call `unmount()` when navigating away. */
    mount(container: HTMLElement): void {
      unlistenPaste = listenForClipboardPaste((file) => {
        void handleIncomingFiles([file]);
      });
      const unsubscribe = store.subscribe((view) => render(view, container));
      render(store.get(), container);
      (container as HTMLElement & { __unsubscribe?: () => void }).__unsubscribe = unsubscribe;
    },
    unmount(): void {
      unlistenPaste?.();
      unlistenPaste = null;
      // Revoke every URL this instance ever tracked so switching tools never leaks memory.
      const urls = collectUrls(store.get());
      for (const url of urls) revokeObjectUrl(url);
    },
  };
}
