import { LOSSY_FORMATS, type OutputFormat } from '../../types';

export interface QualityControlHandlers {
  onQualityChange: (quality: number) => void;
}

/**
 * For lossy formats (JPEG/WebP/AVIF): a 1-100 quality slider, default 90.
 * For lossless formats (PNG/TIFF): a "Lossless" label, no slider.
 *
 * There is no background-color choice here — transparency is always kept
 * as-is for formats that can carry it, and JPEG (which structurally can't)
 * always flattens onto white. See `resolveBackgroundFill`.
 */
export function renderQualityControl(
  outputFormat: OutputFormat,
  quality: number,
  handlers: QualityControlHandlers,
): HTMLElement {
  const field = document.createElement('div');
  field.className = 'field';

  const label = document.createElement('label');
  label.textContent = 'Quality';
  field.appendChild(label);

  if (LOSSY_FORMATS.has(outputFormat)) {
    const row = document.createElement('div');
    row.className = 'quality-row';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '1';
    slider.max = '100';
    slider.value = String(quality);
    slider.id = 'quality-slider';
    slider.setAttribute('aria-label', 'Output quality, 1 to 100');

    const valueLabel = document.createElement('span');
    valueLabel.className = 'quality-value';
    valueLabel.textContent = String(quality);

    slider.addEventListener('input', () => {
      valueLabel.textContent = slider.value;
      handlers.onQualityChange(Number(slider.value));
    });

    row.append(slider, valueLabel);
    field.appendChild(row);
  } else {
    const note = document.createElement('p');
    note.className = 'lossless-note';
    note.textContent = 'Lossless';
    field.appendChild(note);
  }

  return field;
}
