export const MAX_FILES = 5;

export interface UploadCardHandlers {
  /** Called with 1-5 files (already capped to MAX_FILES) from the picker, drag/drop, or clipboard paste. */
  onFiles: (files: File[]) => void;
}

/**
 * Renders the primary upload card: file picker, drag/drop, and clipboard
 * paste all funnel into the same `onFiles` callback. Drag/drop is never the
 * only way in — the "Choose images" button and file input always work via
 * keyboard/screen reader. Accepts up to MAX_FILES at once; anything past
 * that is dropped with a friendly notice rather than erroring.
 */
export function renderUploadCard(handlers: UploadCardHandlers): HTMLElement {
  const card = document.createElement('div');
  card.className = 'upload-card';

  card.innerHTML = `
    <svg class="upload-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
      <path d="M4 15.5V17a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 15V4m0 0-4 4m4-4 4 4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <p class="upload-card__title" id="upload-title">Drop up to ${MAX_FILES} images here</p>
    <p class="upload-card__or">or</p>
    <label class="btn btn-primary" for="file-input">
      Choose images
    </label>
    <input type="file" id="file-input" multiple accept="image/jpeg,image/png,image/webp,image/avif,image/tiff,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.avif,.tif,.tiff,.heic,.heif" aria-describedby="upload-formats upload-limit" />
    <p class="upload-card__paste-hint">You can also paste an image from your clipboard.</p>
    <p class="upload-card__limit" id="upload-limit">Up to ${MAX_FILES} images at once — each is converted and downloaded separately.</p>
    <p class="upload-card__formats" id="upload-formats">JPG · PNG · WebP · AVIF · TIFF · HEIC</p>
    <p class="upload-card__notice" role="status" aria-live="polite" hidden></p>
    <p class="privacy-note">
      <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10 1.5c-3.5 0-6 2-6 5.2 0 1.9.7 3.4 1.6 4.6C4.6 12.9 4 14.6 4 16c0 .6.4 1 1 1h10c.6 0 1-.4 1-1 0-1.4-.6-3.1-1.6-4.7.9-1.2 1.6-2.7 1.6-4.6 0-3.2-2.5-5.2-6-5.2ZM10 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" clip-rule="evenodd"/></svg>
      Your image is processed locally in your browser.
    </p>
  `;

  const fileInput = card.querySelector<HTMLInputElement>('#file-input')!;
  const notice = card.querySelector<HTMLParagraphElement>('.upload-card__notice')!;

  function acceptFiles(list: FileList | File[] | undefined): void {
    if (!list || list.length === 0) return;
    const all = Array.from(list);
    const files = all.slice(0, MAX_FILES);
    if (all.length > MAX_FILES) {
      notice.hidden = false;
      notice.textContent = `You selected ${all.length} images — only the first ${MAX_FILES} were added.`;
    } else {
      notice.hidden = true;
    }
    handlers.onFiles(files);
  }

  fileInput.addEventListener('change', () => {
    acceptFiles(fileInput.files ?? undefined);
    fileInput.value = '';
  });

  let dragDepth = 0;
  card.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragDepth++;
    card.classList.add('is-dragover');
  });
  card.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  });
  card.addEventListener('dragleave', () => {
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) card.classList.remove('is-dragover');
  });
  card.addEventListener('drop', (e) => {
    e.preventDefault();
    dragDepth = 0;
    card.classList.remove('is-dragover');
    acceptFiles(e.dataTransfer?.files);
  });

  return card;
}

/** Wires a document-level paste listener that treats a pasted image like an upload. Ignored gracefully if no image is present. */
export function listenForClipboardPaste(onFile: (file: File) => void): () => void {
  const handler = (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          event.preventDefault();
          onFile(file);
        }
        return;
      }
    }
    // No image on the clipboard — ignore silently, don't interrupt normal paste behavior elsewhere.
  };
  document.addEventListener('paste', handler);
  return () => document.removeEventListener('paste', handler);
}
