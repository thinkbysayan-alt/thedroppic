export type CompressionLevel = 'small' | 'medium' | 'original';

/** Real quality values sent to the encoder for lossy formats (JPEG/WebP/AVIF/HEIC→JPEG). Not shown to the user as numbers — see spec: no confusing 73%/82%/91% readouts. */
export const COMPRESSION_QUALITY: Record<CompressionLevel, number> = {
  small: 40,
  medium: 75,
  original: 95,
};

const LEVELS: CompressionLevel[] = ['small', 'medium', 'original'];
const LEVEL_LABEL: Record<CompressionLevel, string> = {
  small: 'Small',
  medium: 'Medium',
  original: 'Original',
};

export interface CompressionSliderHandlers {
  onChange: (level: CompressionLevel) => void;
}

/** A 3-position snapping slider (Small / Medium / Original) — the only compression control the user sees, per spec: no raw quality percentages. */
export function renderCompressionSlider(
  level: CompressionLevel,
  losslessFormat: boolean,
  handlers: CompressionSliderHandlers,
): HTMLElement {
  const field = document.createElement('div');
  field.className = 'field compression-slider';

  const label = document.createElement('label');
  label.htmlFor = 'compression-level';
  label.textContent = 'Compression level';
  field.appendChild(label);

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.id = 'compression-level';
  slider.min = '0';
  slider.max = '2';
  slider.step = '1';
  slider.value = String(LEVELS.indexOf(level));
  slider.setAttribute('aria-label', 'Compression level: Small, Medium, or Original');
  slider.addEventListener('input', () => {
    handlers.onChange(LEVELS[Number(slider.value)]!);
  });
  field.appendChild(slider);

  const ticks = document.createElement('div');
  ticks.className = 'compression-slider__ticks';
  ticks.innerHTML = LEVELS.map((l) => `<span class="${l === level ? 'is-active' : ''}">${LEVEL_LABEL[l]}</span>`).join('');
  field.appendChild(ticks);

  if (losslessFormat) {
    const note = document.createElement('p');
    note.className = 'lossless-note';
    note.textContent = "This format is lossless, so file size depends on the image itself. The slider won't shrink it further.";
    field.appendChild(note);
  }

  return field;
}
