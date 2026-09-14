import { getAllowedOutputFormats } from '../../conversion/capability-matrix';
import { OUTPUT_FORMAT_LABEL, type OutputFormat, type SourceFormat } from '../../types';

export interface FormatSelectorHandlers {
  onChange: (format: OutputFormat) => void;
}

/**
 * Renders the "Convert to" dropdown, filtered through the capability matrix
 * — never a hardcoded format list.
 *
 * `disabled` locks it to the current `selected` value (used while "Remove
 * background" is on: output is always a transparent PNG then, so letting the
 * user pick e.g. JPEG would silently flatten the cutout onto white — see
 * background-removal-toggle.ts).
 */
export function renderFormatSelector(
  source: SourceFormat,
  selected: OutputFormat,
  handlers: FormatSelectorHandlers,
  disabled = false,
): HTMLElement {
  const field = document.createElement('div');
  field.className = 'field';

  const label = document.createElement('label');
  label.htmlFor = 'format-select';
  label.textContent = 'Convert to';
  field.appendChild(label);

  const select = document.createElement('select');
  select.id = 'format-select';
  select.className = 'select';
  select.disabled = disabled;
  if (disabled) select.title = 'Locked to PNG while "Remove background" is on';

  // While locked, show only the forced value — the capability matrix
  // normally excludes "same format in, same format out" as a pointless
  // no-op (e.g. png→png isn't offered), but that exclusion doesn't apply
  // here: background removal always changes the pixels (adds a cutout
  // alpha channel), so png→png is a real, meaningful conversion in this case.
  const formats = disabled ? [selected] : getAllowedOutputFormats(source);
  for (const format of formats) {
    const option = document.createElement('option');
    option.value = format;
    option.textContent = OUTPUT_FORMAT_LABEL[format];
    if (format === selected) option.selected = true;
    select.appendChild(option);
  }

  select.addEventListener('change', () => handlers.onChange(select.value as OutputFormat));
  field.appendChild(select);

  return field;
}
