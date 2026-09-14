import { detectFormat } from '../conversion/format-detector';
import { getDefaultOutputFormat } from '../conversion/capability-matrix';
import { generatePreview } from '../conversion/preview';
import { convertImage, decodeForPreview } from '../conversion/conversion-manager';
import { renderUploadCard, listenForClipboardPaste } from '../components/upload/upload';
import { renderPreview } from '../components/preview/image-preview';
import { renderFormatSelector } from '../components/format-selector/format-selector';
import { renderQualityControl } from '../components/quality-control/quality-slider';
import { renderBackgroundRemovalToggle } from '../components/quality-control/background-removal-toggle';
import { renderCropper } from '../components/cropper/cropper';
import { renderResultPanel } from '../components/result/result-panel';
import { renderErrorBanner } from '../components/errors/error-banner';
import { decodeToOrientedBitmap, bitmapToImageData, cropImageData, imageDataToBlob } from '../utils/image';
import { closeBitmap, revokeObjectUrl, trackObjectUrl } from '../utils/memory';
import { downloadBlob } from '../utils/download';
import { buildOutputFilename, formatFileSize } from '../utils/file';
import { AppError, type CropRegion } from '../types';
import { store, type BatchItem, type UploadedImage, type View } from './state';
import { initScrollReveal, setRevealDelay } from '../utils/reveal';

export function mountApp(root: HTMLElement): void {
  root.innerHTML = `
    <a class="skip-link" href="#main">Skip to content</a>
    <div class="app-shell">
      <header class="site-header">
        <div class="container site-header__bar">
          <span class="site-header__start">
            <span class="brand">
              <span class="brand__mark" aria-hidden="true">
                <svg width="30" height="30" viewBox="0 0 32 32">
                  <rect x="3" y="11" width="17" height="17" rx="5.5" fill="#2563ff" />
                  <rect x="12" y="4" width="17" height="17" rx="5.5" fill="#3bb2f6" fill-opacity="0.92" />
                </svg>
              </span>
              <span>the<span class="brand__word-accent">droppic</span></span>
            </span>
            <button type="button" class="back-home-btn" id="back-home-btn" aria-label="Back to home" hidden>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                <path d="M12.5 4.5 7 10l5.5 5.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="back-home-btn__label">Back to home</span>
            </button>
          </span>
          <nav class="site-header__nav" id="site-header-nav" aria-label="Primary">
            <a href="#how-it-works">How it works</a>
            <a href="#privacy">Privacy</a>
          </nav>
        </div>
      </header>
      <main id="main" class="app-main">
        <div class="container" id="view-root"></div>
      </main>
      <footer class="site-footer">
        <div class="container">
          <p class="site-footer__brand">the<span class="brand__word-accent">droppic</span></p>
          <p class="site-footer__tagline">Private image conversion in your browser.</p>
          <ul class="site-footer__links">
            <li><a href="#how-it-works">How it works</a></li>
            <li><a href="#privacy">Privacy</a></li>
            <li><a href="#supported-formats">Supported formats</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms</a></li>
          </ul>
          <p>&copy; ${new Date().getFullYear()} thedroppic</p>
        </div>
      </footer>
    </div>
  `;

  const viewRoot = root.querySelector<HTMLElement>('#view-root')!;
  const backHomeBtn = root.querySelector<HTMLButtonElement>('#back-home-btn')!;
  const headerNav = root.querySelector<HTMLElement>('#site-header-nav')!;
  backHomeBtn.addEventListener('click', resetToIdle);

  listenForClipboardPaste((file) => {
    void handleIncomingFiles([file]);
  });

  const syncHeaderChrome = (view: View) => {
    const isIdle = view.kind === 'idle';
    backHomeBtn.hidden = isIdle;
    // The nav's links anchor to homepage-only sections, so they'd be dead
    // links on a tool/result view anyway — hiding them there also avoids
    // crowding the back button into the logo on narrow screens.
    headerNav.hidden = !isIdle;
  };

  store.subscribe((view) => {
    syncHeaderChrome(view);
    render(view, viewRoot);
  });
  syncHeaderChrome(store.get());
  render(store.get(), viewRoot);
}

// --- state transitions -----------------------------------------------------

/** Every object URL still referenced by a given view — used to decide what's safe to revoke. */
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

/** Replaces the store's view, revoking any object URL the previous view held that the new one no longer needs. */
function setView(next: View): void {
  const prevUrls = collectUrls(store.get());
  const nextUrls = collectUrls(next);
  for (const url of prevUrls) {
    if (!nextUrls.has(url)) revokeObjectUrl(url);
  }
  store.set(next);
}

/** Single entry point for every upload source (file picker, drag/drop, clipboard paste) — routes to the single-image flow (unchanged) or the multi-image batch flow. */
async function handleIncomingFiles(files: File[]): Promise<void> {
  if (files.length === 0) return;
  if (files.length === 1) {
    await handleIncomingFile(files[0]!);
    return;
  }
  await startBatch(files);
}

/** Decodes a file and builds its preview — shared by the single-image and batch flows. Throws AppError on failure. */
async function buildUploadedImage(file: File): Promise<UploadedImage> {
  const sourceFormat = await detectFormat(file);
  if (!sourceFormat) {
    throw new AppError('unsupported-format', "This image format isn't supported.");
  }
  const preview = await generatePreview(file, sourceFormat);
  trackObjectUrl(preview.url);
  return { file, sourceFormat, previewUrl: preview.url, width: preview.width, height: preview.height };
}

async function handleIncomingFile(file: File): Promise<void> {
  try {
    const image = await buildUploadedImage(file);
    setView({
      kind: 'ready',
      image,
      outputFormat: getDefaultOutputFormat(image.sourceFormat),
      quality: 90,
      crop: null,
      removeBackground: false,
      croppedPreviewUrl: null,
    });
  } catch (err) {
    setError(err);
  }
}

let batchIdCounter = 0;

/** Builds the 2-5 image batch view. Each file is decoded independently — one failing (unsupported/corrupt) never blocks the others. */
async function startBatch(files: File[]): Promise<void> {
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
            outputFormat: getDefaultOutputFormat(image.sourceFormat),
            quality: 90,
            removeBackground: false,
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

/** Replaces one item within the current batch view by id; a no-op if the view has since moved on. */
function updateBatchItem(id: string, next: BatchItem['state']): void {
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

    // TIFF output can't be shown in an <img> tag (no browser renders it), so
    // build a browser-displayable preview from the exact converted pixels.
    // Every other output format is natively renderable, so it can reuse resultUrl directly.
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

/** Renders a cropped thumbnail from the original preview, purely for display — the real crop is recomputed identically at convert time. */
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

function resetToIdle(): void {
  setView({ kind: 'idle' });
}

// --- rendering ---------------------------------------------------------------

function render(view: View, container: HTMLElement): void {
  container.replaceChildren();

  switch (view.kind) {
    case 'idle':
      container.appendChild(renderIdle());
      initScrollReveal(container);
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
      container.appendChild(renderError(view));
      break;
    case 'batch':
      container.appendChild(renderBatch(view));
      break;
  }
}

function renderIdle(): HTMLElement {
  const wrap = document.createElement('div');

  const hero = document.createElement('div');
  hero.className = 'hero';
  hero.innerHTML = `
    <span class="eyebrow">Runs 100% in your browser. Nothing is uploaded.</span>
    <h1>Convert your image in seconds</h1>
    <p>Change image formats directly in your browser. Your image stays on your device while you convert it.</p>
  `;
  wrap.appendChild(hero);

  wrap.appendChild(renderUploadCard({ onFiles: (files) => void handleIncomingFiles(files) }));
  wrap.appendChild(renderTrustStrip());
  wrap.appendChild(renderHowItWorks());
  wrap.appendChild(renderBenefits());
  wrap.appendChild(renderSupportedFormats());
  wrap.appendChild(renderFaq());
  wrap.appendChild(renderNewsletter());

  return wrap;
}

function renderTrustStrip(): HTMLElement {
  const section = document.createElement('section');
  section.id = 'privacy';
  section.setAttribute('aria-label', 'Privacy and trust');

  const strip = document.createElement('div');
  strip.className = 'trust-strip';

  const items = ['No account needed', 'No server upload for conversion', 'One image, one direct download'];
  const checkIcon = `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0Z" clip-rule="evenodd"/></svg>`;

  items.forEach((text, index) => {
    const item = document.createElement('span');
    item.className = 'trust-strip__item';
    item.setAttribute('data-reveal', '');
    setRevealDelay(item, index, 100);
    item.innerHTML = `<span class="trust-strip__icon">${checkIcon}</span>`;
    item.appendChild(document.createTextNode(text));
    strip.appendChild(item);
  });

  section.appendChild(strip);
  return section;
}

const ICON_UPLOAD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M4 15.5V17a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 15V4m0 0-4 4m4-4 4 4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_SLIDERS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M5 6h9M5 12h5M5 18h11" stroke-linecap="round"/><circle cx="17" cy="6" r="2"/><circle cx="13" cy="12" r="2"/><circle cx="19" cy="18" r="2"/></svg>`;
const ICON_DOWNLOAD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M4 15.5V17a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 4v11m0 0-4-4m4 4 4-4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const STEPS: Array<{ title: string; description: string; icon: string }> = [
  {
    title: 'Add your image',
    description: 'Drop a file, choose one from your device, or paste an image.',
    icon: ICON_UPLOAD,
  },
  {
    title: 'Choose the output',
    description: 'Pick JPG, PNG, WebP, AVIF, or TIFF and adjust quality if needed.',
    icon: ICON_SLIDERS,
  },
  {
    title: 'Download your result',
    description: 'Convert your image and save it directly to your device.',
    icon: ICON_DOWNLOAD,
  },
];

function renderHowItWorks(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'section';
  section.id = 'how-it-works';
  section.setAttribute('aria-labelledby', 'how-it-works-heading');

  const heading = document.createElement('h2');
  heading.id = 'how-it-works-heading';
  heading.textContent = 'Convert an image in three simple steps';
  section.appendChild(heading);

  const steps = document.createElement('div');
  steps.className = 'steps';
  STEPS.forEach((step, index) => {
    const card = document.createElement('div');
    card.className = 'step';
    card.setAttribute('data-reveal', '');
    setRevealDelay(card, index, 120);
    card.innerHTML = `
      <span class="step__number">${index + 1}</span>
      <span class="icon-badge step__icon">${step.icon}</span>
      <h3></h3>
      <p></p>
    `;
    card.querySelector('h3')!.textContent = step.title;
    card.querySelector('p')!.textContent = step.description;
    steps.appendChild(card);
  });
  section.appendChild(steps);

  return section;
}

const ICON_SHIELD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M12 3 4.5 6v6c0 4.5 3.2 7.7 7.5 9 4.3-1.3 7.5-4.5 7.5-9V6L12 3Z" stroke-linejoin="round"/><path d="m9 12 2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_CONTROLS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8 8h8M8 12h5M8 16h8" stroke-linecap="round"/></svg>`;
const ICON_CROP = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M6 3v13a2 2 0 0 0 2 2h13" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 21V8a2 2 0 0 0-2-2H3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const BENEFITS: Array<{ title: string; description: string; icon: string }> = [
  {
    title: 'Private by default',
    description: 'Your image is processed in your browser and does not need to be uploaded for conversion.',
    icon: ICON_SHIELD,
  },
  {
    title: 'Simple controls',
    description: 'Select a format, choose quality when relevant, and download the finished file.',
    icon: ICON_CONTROLS,
  },
  {
    title: 'Optional square crop',
    description: 'Create a square image for a profile picture, social profile, or ID upload.',
    icon: ICON_CROP,
  },
];

function renderBenefits(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'section';
  section.setAttribute('aria-labelledby', 'benefits-heading');

  const heading = document.createElement('h2');
  heading.id = 'benefits-heading';
  heading.textContent = 'Built for the quick job';
  section.appendChild(heading);

  const grid = document.createElement('div');
  grid.className = 'benefits-grid';
  BENEFITS.forEach((benefit, index) => {
    const card = document.createElement('div');
    card.className = index === 0 ? 'benefit-card benefit-card--featured' : 'benefit-card';
    card.setAttribute('data-reveal', '');
    setRevealDelay(card, index, 120);
    card.innerHTML = `<span class="icon-badge benefit-card__icon">${benefit.icon}</span><h3></h3><p></p>`;
    card.querySelector('h3')!.textContent = benefit.title;
    card.querySelector('p')!.textContent = benefit.description;
    grid.appendChild(card);
  });
  section.appendChild(grid);

  return section;
}

function renderSupportedFormats(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'section';
  section.id = 'supported-formats';
  section.setAttribute('aria-labelledby', 'formats-heading');

  const heading = document.createElement('h2');
  heading.id = 'formats-heading';
  heading.textContent = 'Formats you can convert';
  section.appendChild(heading);

  const grid = document.createElement('div');
  grid.className = 'formats-grid';
  const chipList = (formats: string[]) =>
    `<ul class="format-chips">${formats.map((f) => `<li class="format-chip">${f}</li>`).join('')}</ul>`;
  grid.innerHTML = `
    <div class="formats-card" data-reveal style="--reveal-delay: 0ms">
      <span class="icon-badge formats-card__icon">${ICON_UPLOAD}</span>
      <h3>Input formats</h3>
      ${chipList(['JPG', 'JPEG', 'PNG', 'WebP', 'AVIF', 'TIFF', 'HEIC', 'HEIF'])}
    </div>
    <div class="formats-card" data-reveal style="--reveal-delay: 120ms">
      <span class="icon-badge formats-card__icon">${ICON_DOWNLOAD}</span>
      <h3>Output formats</h3>
      ${chipList(['JPG', 'PNG', 'WebP', 'AVIF', 'TIFF'])}
    </div>
  `;
  section.appendChild(grid);

  const note = document.createElement('p');
  note.className = 'formats-note';
  note.textContent = "Available output formats can depend on your browser's supported image codecs.";
  section.appendChild(note);

  return section;
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
  controlsPanel.appendChild(
    renderBackgroundRemovalToggle(view.removeBackground, {
      // Output is always a transparent PNG when this is on — force the
      // format so the cutout can never be silently flattened onto a solid
      // background by an unrelated, previously-selected output format
      // (e.g. the JPEG default for most source formats). See format-selector.ts.
      onChange: (removeBackground) =>
        setView({ ...view, removeBackground, outputFormat: removeBackground ? 'png' : view.outputFormat }),
    }),
  );
  wrap.appendChild(controlsPanel);

  const actions = document.createElement('div');
  actions.className = 'actions';

  const convertBtn = document.createElement('button');
  convertBtn.type = 'button';
  convertBtn.className = 'btn btn-primary btn-block';
  convertBtn.textContent = 'Convert image';
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
  startOverBtn.addEventListener('click', resetToIdle);
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
  status.innerHTML = `<span class="spinner" aria-hidden="true"></span> Converting your image…`;
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
        onDownload: () => downloadResult(view),
        onCropToSquare: () =>
          setView({
            kind: 'cropping',
            image: view.image,
            initialCrop: view.crop,
            outputFormat: view.outputFormat,
            quality: view.quality,
            removeBackground: view.removeBackground,
          }),
        onConvertAnother: resetToIdle,
      },
    ),
  );

  return wrap;
}

function downloadResult(view: Extract<View, { kind: 'result' }>): void {
  downloadBlob(view.resultBlob, view.resultFilename);
}

function renderError(view: Extract<View, { kind: 'error' }>): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'workspace';
  wrap.appendChild(renderErrorBanner(view.error, resetToIdle));
  return wrap;
}

/**
 * Multi-image (2-5 files) batch view. Every item is its own independent
 * mini-workflow — its own format/quality/background choices, its own
 * Convert button, its own result and download. No crop step here (crop
 * stays a single-image refinement) and no ZIP/bulk download — each result
 * downloads on its own, exactly like the single-image flow.
 */
function renderBatch(view: Extract<View, { kind: 'batch' }>): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'workspace workspace--batch';

  const heading = document.createElement('p');
  heading.className = 'batch-heading';
  const doneCount = view.items.filter((it) => it.state.status === 'result').length;
  heading.textContent = `${view.items.length} images — ${doneCount} of ${view.items.length} converted`;
  wrap.appendChild(heading);

  const grid = document.createElement('div');
  grid.className = 'batch-grid';

  for (const item of view.items) {
    grid.appendChild(renderBatchItem(item));
  }
  wrap.appendChild(grid);

  const startOverBtn = document.createElement('button');
  startOverBtn.type = 'button';
  startOverBtn.className = 'btn btn-secondary btn-block';
  startOverBtn.textContent = 'Choose different images';
  startOverBtn.addEventListener('click', resetToIdle);
  wrap.appendChild(startOverBtn);

  return wrap;
}

function renderBatchItem(item: BatchItem): HTMLElement {
  const card = document.createElement('div');
  card.className = 'panel batch-item';

  if (item.state.status === 'error') {
    card.innerHTML = `
      <p class="batch-item__filename"></p>
      <p class="batch-item__error"></p>
    `;
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
    const controlsRow = document.createElement('div');
    controlsRow.className = 'controls-row';
    const readyState = item.state;
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
    card.appendChild(
      renderBackgroundRemovalToggle(removeBackground, {
        // Same "always a transparent PNG" guarantee as the single-image flow — see renderReady.
        onChange: (next) =>
          updateBatchItem(item.id, { ...readyState, removeBackground: next, outputFormat: next ? 'png' : outputFormat }),
      }),
    );

    const convertBtn = document.createElement('button');
    convertBtn.type = 'button';
    convertBtn.className = 'btn btn-primary btn-block batch-item__action';
    convertBtn.textContent = 'Convert image';
    convertBtn.addEventListener('click', () => void runBatchItemConversion(item.id));
    card.appendChild(convertBtn);
  } else if (item.state.status === 'converting') {
    const status = document.createElement('p');
    status.className = 'status-line batch-item__action';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.innerHTML = `<span class="spinner" aria-hidden="true"></span> Converting…`;
    card.appendChild(status);
  } else {
    const resultState = item.state;
    const badge = document.createElement('div');
    badge.className = 'result-badge batch-item__badge';
    badge.innerHTML = `
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0Z" clip-rule="evenodd"/>
      </svg>
      <span>${formatFileSize(resultState.resultByteLength)} — ready</span>
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

const FAQ_ITEMS: Array<{ question: string; answer: string }> = [
  {
    question: 'Are my images uploaded?',
    answer: 'No. Your image is processed locally in your browser for conversion.',
  },
  {
    question: 'Will my image be resized?',
    answer: 'No. Original dimensions are preserved unless you choose the optional square crop.',
  },
  {
    question: 'Can I adjust quality?',
    answer: 'Yes. JPG, WebP, and AVIF include a quality setting.',
  },
  {
    question: 'Do I need an account?',
    answer: 'No. thedroppic does not require an account or sign-in.',
  },
  {
    question: "What's the difference between JPG and PNG?",
    answer:
      'JPG uses lossy compression and is best for photos — smaller files, no transparency. PNG is lossless and supports transparency, making it better for graphics, logos, and screenshots.',
  },
  {
    question: 'Is WebP better than JPG?',
    answer:
      'WebP usually produces smaller files than JPG at the same visual quality, and it supports transparency too. Most modern browsers support WebP, but check compatibility if you need very old browser support.',
  },
  {
    question: 'How do I convert HEIC photos from my iPhone?',
    answer:
      'Drop your HEIC or HEIF file into the uploader above and choose JPG, PNG, WebP, AVIF, or TIFF as the output — the conversion happens right in your browser, with no app or upload required.',
  },
  {
    question: 'Does converting an image reduce its quality?',
    answer:
      'Converting to a lossless format (PNG, TIFF) keeps every pixel intact. Converting to a lossy format (JPG, WebP, AVIF) can lose some detail depending on the quality setting — higher quality means larger files and less loss.',
  },
  {
    question: 'Can I remove the background from a photo?',
    answer:
      "Yes — enable \"Remove background\" before converting. It produces a transparent PNG cutout using an on-device AI model, works best on people and portraits, and runs entirely in your browser.",
  },
];

/** Accordion FAQ — native <details>/<summary> so it's keyboard- and screen-reader-accessible with no extra JS. */
function renderFaq(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'faq';
  section.id = 'faq';
  section.setAttribute('aria-labelledby', 'faq-heading');

  const heading = document.createElement('h2');
  heading.id = 'faq-heading';
  heading.textContent = 'Questions, answered';
  section.appendChild(heading);

  FAQ_ITEMS.forEach((item, index) => {
    const details = document.createElement('details');
    details.className = 'faq-item';
    details.setAttribute('data-reveal', '');
    setRevealDelay(details, index, 90);
    if (index === 0) details.open = true;

    const summary = document.createElement('summary');
    const questionSpan = document.createElement('span');
    questionSpan.textContent = item.question;
    summary.innerHTML = `<svg class="faq-item__icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 7.5 5 5 5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    summary.prepend(questionSpan);
    details.appendChild(summary);

    const answer = document.createElement('p');
    answer.textContent = item.answer;
    details.appendChild(answer);

    section.appendChild(details);
  });

  return section;
}

/**
 * Newsletter signup — UI only. There is no backend anywhere in this app
 * (by design, see README), so this form doesn't actually send the address
 * anywhere yet; it validates the email client-side and shows a confirmation
 * state. Wire the `formEl` submit handler below to a real email provider
 * (Mailchimp/ConvertKit/Buttondown/etc.) before relying on it to collect
 * addresses.
 */
function renderNewsletter(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'newsletter';
  section.id = 'newsletter';
  section.setAttribute('aria-labelledby', 'newsletter-heading');

  section.innerHTML = `
    <h2 id="newsletter-heading">Get updates on new tools</h2>
    <p>Occasional emails about new image utilities we build. No spam, unsubscribe anytime.</p>
    <form class="newsletter__form" novalidate>
      <label class="visually-hidden" for="newsletter-email">Email address</label>
      <input type="email" id="newsletter-email" name="email" placeholder="you@example.com" autocomplete="email" required />
      <button type="submit" class="btn btn-primary">Subscribe</button>
    </form>
    <p class="newsletter__status" role="status" aria-live="polite" hidden></p>
  `;

  const form = section.querySelector<HTMLFormElement>('.newsletter__form')!;
  const emailInput = section.querySelector<HTMLInputElement>('#newsletter-email')!;
  const status = section.querySelector<HTMLParagraphElement>('.newsletter__status')!;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!emailInput.checkValidity()) {
      status.hidden = false;
      status.classList.add('newsletter__status--error');
      status.textContent = 'Please enter a valid email address.';
      return;
    }
    // No backend to send this to yet — see the function doc comment above.
    form.hidden = true;
    status.hidden = false;
    status.classList.remove('newsletter__status--error');
    status.textContent = "Thanks — you're on the list.";
  });

  return section;
}
