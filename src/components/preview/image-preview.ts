import { formatFileSize, sanitizeFilename } from '../../utils/file';

export interface PreviewInfo {
  url: string;
  filename: string;
  fileSize: number;
  width: number;
  height: number;
}

/** Shows the uploaded (or converted) image with its filename, size and dimensions. Preserves aspect ratio, never overflows. */
export function renderPreview(info: PreviewInfo): HTMLElement {
  const wrap = document.createElement('div');

  const thumbWrap = document.createElement('div');
  thumbWrap.className = 'file-meta__thumb-wrap';
  const img = document.createElement('img');
  img.src = info.url;
  img.alt = '';
  thumbWrap.appendChild(img);
  wrap.appendChild(thumbWrap);

  const meta = document.createElement('div');
  meta.className = 'file-meta__info';
  meta.innerHTML = `
    <p class="file-meta__name"></p>
    <p class="file-meta__details"></p>
  `;
  meta.querySelector('.file-meta__name')!.textContent = sanitizeFilename(info.filename);
  meta.querySelector('.file-meta__details')!.textContent =
    `${formatFileSize(info.fileSize)} · ${info.width} × ${info.height}px`;
  wrap.appendChild(meta);

  return wrap;
}
