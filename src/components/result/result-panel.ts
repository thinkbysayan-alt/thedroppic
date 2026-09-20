import { OUTPUT_FORMAT_LABEL, type OutputFormat } from '../../types';
import { formatFileSize, sanitizeFilename } from '../../utils/file';
import { renderPreview } from '../preview/image-preview';

export interface ResultPanelHandlers {
  onDownload: () => void;
  onCropToSquare: () => void;
  onConvertAnother: () => void;
}

export interface ResultInfo {
  url: string;
  filename: string;
  byteLength: number;
  width: number;
  height: number;
  outputFormat: OutputFormat;
}

/** Post-conversion panel: preview, download, and next-step actions. */
export function renderResultPanel(info: ResultInfo, handlers: ResultPanelHandlers): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.setAttribute('role', 'status');

  const badge = document.createElement('div');
  badge.className = 'result-badge';
  badge.innerHTML = `
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fill-rule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0Z" clip-rule="evenodd"/>
    </svg>
    <span></span>
  `;
  badge.querySelector('span')!.textContent =
    `Your image is ready: ${OUTPUT_FORMAT_LABEL[info.outputFormat]}, ${formatFileSize(info.byteLength)}`;
  panel.appendChild(badge);

  panel.appendChild(
    renderPreview({
      url: info.url,
      filename: sanitizeFilename(info.filename),
      fileSize: info.byteLength,
      width: info.width,
      height: info.height,
    }),
  );

  const actions = document.createElement('div');
  actions.className = 'actions';
  actions.style.marginTop = 'var(--space-5)';

  const downloadBtn = document.createElement('button');
  downloadBtn.type = 'button';
  downloadBtn.className = 'btn btn-primary btn-block';
  downloadBtn.textContent = 'Download image';
  downloadBtn.addEventListener('click', handlers.onDownload);
  actions.appendChild(downloadBtn);

  const secondaryRow = document.createElement('div');
  secondaryRow.className = 'actions actions--row';

  const cropBtn = document.createElement('button');
  cropBtn.type = 'button';
  cropBtn.className = 'btn btn-secondary btn-block';
  cropBtn.textContent = 'Crop to square';
  cropBtn.addEventListener('click', handlers.onCropToSquare);
  secondaryRow.appendChild(cropBtn);

  const anotherBtn = document.createElement('button');
  anotherBtn.type = 'button';
  anotherBtn.className = 'btn btn-secondary btn-block';
  anotherBtn.textContent = 'Convert another image';
  anotherBtn.addEventListener('click', handlers.onConvertAnother);
  secondaryRow.appendChild(anotherBtn);

  actions.appendChild(secondaryRow);
  panel.appendChild(actions);

  return panel;
}
