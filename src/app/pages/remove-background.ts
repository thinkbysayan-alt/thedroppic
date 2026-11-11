import { createToolWorkspace } from '../tool-workspace';
import { pathForRoute } from '../router';
import { renderConvCta, renderConvFaq, renderConvSide, type FaqEntry } from './conv-parts';

/**
 * Remove Background: the same layout as the Convert page (one bordered box
 * holding the tool, a privacy note and three fact cards beside it, FAQ,
 * call-to-action band, "Learn more"). The AI model runs in the browser, so
 * nothing is uploaded.
 */
export function renderRemoveBackgroundPage(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'conv';

  const h1 = document.createElement('h1');
  h1.className = 'visually-hidden';
  h1.textContent = 'Remove Background';
  wrap.appendChild(h1);

  const row = document.createElement('section');
  row.className = 'conv-row';

  const box = document.createElement('div');
  box.className = 'conv-box';

  const tabs = document.createElement('nav');
  tabs.className = 'conv-tabs';
  tabs.setAttribute('aria-label', 'Tool');
  const tab = document.createElement('a');
  tab.href = pathForRoute('remove-background');
  tab.textContent = 'Remove Background';
  tab.setAttribute('aria-current', 'page');
  tabs.appendChild(tab);
  box.appendChild(tabs);

  const body = document.createElement('div');
  body.className = 'conv-box__body';
  const host = document.createElement('div');
  host.id = 'upload';
  body.appendChild(host);
  box.appendChild(body);
  row.appendChild(box);

  const workspace = createToolWorkspace({
    forceRemoveBackground: true,
    showFormatSelector: false,
    showBackgroundToggle: false,
    convertLabel: 'Remove background',
    upload: {
      title: 'Drop up to 5 images here',
      buttonLabel: 'Choose images',
      formats: null,
      minimal: true,
    },
  });
  workspace.mount(host);

  row.appendChild(
    renderConvSide(
      'Your photo never leaves your device. The AI model runs in your browser, so there is no upload, no queue and nothing to delete afterwards.',
      [
        { value: 'Free', label: 'Always', text: 'No account, no limits, no watermark.' },
        { value: 'PNG', label: 'Transparent result', text: 'A cutout with no background.' },
        { value: 'AI', label: 'Works best on people', text: 'Portraits cut out cleanest. Other subjects vary.' },
      ],
    ),
  );
  wrap.appendChild(row);
  wrap.appendChild(renderConvFaq(BG_FAQ));
  wrap.appendChild(renderConvCta());

  return wrap;
}

const BG_FAQ: FaqEntry[] = [
  { question: 'Is my image uploaded?', answer: 'No. The AI model runs in your browser. Your image never leaves your device.' },
  { question: 'Why is the first cutout slower?', answer: 'The AI model is a one-time download that your browser keeps. After that, cutouts start faster.' },
  { question: 'How good are the results?', answer: 'Edges are soft, so hair and fine detail blend in. Results are best on people and portraits and vary on other subjects.' },
  { question: 'How many images can I process at once?', answer: 'Up to 5. Each one is processed separately.' },
  { question: 'Can I edit the cutout?', answer: 'You can crop it to a square. There is no brush for touching up edges yet.' },
  { question: 'Which formats can I use?', answer: 'Upload JPG, PNG, WebP, AVIF, TIFF or HEIC. The result downloads as a transparent PNG.' },
  { question: 'Is it free?', answer: 'Yes. There is no limit on how often you use it.' },
];
