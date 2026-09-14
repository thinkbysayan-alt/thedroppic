export interface BackgroundRemovalHandlers {
  onChange: (enabled: boolean) => void;
}

/**
 * "Remove background" — AI subject cutout (MODNet). Always produces a
 * transparent result; there's no separate white/black background choice.
 */
export function renderBackgroundRemovalToggle(checked: boolean, handlers: BackgroundRemovalHandlers): HTMLElement {
  const field = document.createElement('div');
  field.className = 'field bg-removal';

  const row = document.createElement('label');
  row.className = 'bg-removal__row';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = checked;
  checkbox.className = 'bg-removal__checkbox';
  checkbox.addEventListener('change', () => handlers.onChange(checkbox.checked));

  const text = document.createElement('span');
  text.className = 'bg-removal__label';
  text.innerHTML = `
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10 1.5a1 1 0 0 1 .95.68l1.07 3.17 3.17 1.07a1 1 0 0 1 0 1.9l-3.17 1.06-1.07 3.17a1 1 0 0 1-1.9 0l-1.06-3.17-3.17-1.06a1 1 0 0 1 0-1.9l3.17-1.07 1.06-3.17A1 1 0 0 1 10 1.5Zm6.5 9a.75.75 0 0 1 .71.5l.4 1.15 1.15.4a.75.75 0 0 1 0 1.42l-1.15.38-.4 1.15a.75.75 0 0 1-1.42 0l-.38-1.15-1.15-.38a.75.75 0 0 1 0-1.42l1.15-.4.38-1.15a.75.75 0 0 1 .71-.5Z"/></svg>
    <span>Remove background</span>
  `;

  row.append(checkbox, text);
  field.appendChild(row);

  const hint = document.createElement('p');
  hint.className = 'bg-removal__hint';
  hint.textContent = 'AI-powered subject cutout with a transparent background — runs entirely in your browser. Works best on people/portraits.';
  field.appendChild(hint);

  return field;
}
