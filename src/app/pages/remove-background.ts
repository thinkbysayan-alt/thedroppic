import { createToolWorkspace } from '../tool-workspace';
import { pathForRoute } from '../router';
import { preloadBackgroundRemoval } from '../../conversion/background-removal';
import { renderConvCta, renderConvFaq, renderConvHead, renderConvSide, type FaqEntry } from './conv-parts';

/**
 * Remove Background: the same layout as the Convert page (one bordered box
 * holding the tool, a privacy note and three fact cards beside it, FAQ,
 * call-to-action band). The AI model runs in the browser, so nothing is uploaded.
 */
/**
 * Starts getting the AI model ready while the person is still choosing a photo, so the cut-out itself is quick
 * (otherwise the model's first-time load and warm-up, about half a minute, happens after they click). Skipped on
 * data-saver and slow connections, where the download should wait until a photo is actually chosen.
 */
function prepareCutoutModel(): void {
  if (/HappyDOM/i.test(navigator.userAgent) || typeof Worker === 'undefined') return;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (connection?.saveData || /^(slow-2g|2g|3g)$/.test(connection?.effectiveType ?? '')) return;
  const start = (): void => preloadBackgroundRemoval();
  const idle: ((cb: () => void, opts?: { timeout: number }) => number) | undefined = window.requestIdleCallback?.bind(window);
  if (idle) idle(start, { timeout: 3000 });
  else setTimeout(start, 1500);
}

export function renderRemoveBackgroundPage(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'conv';

  wrap.appendChild(
    renderConvHead(
      'Remove Background',
      "Now you see it. Now you don't.",
      'Drop a photo and get back just the subject, on a see-through background, ready for slides, stickers or that LinkedIn photo.',
    ),
  );

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
      title: 'Drop up to 5 photos here',
      buttonLabel: 'Pick photos',
      formats: null,
      minimal: true,
    },
  });
  workspace.mount(host);
  prepareCutoutModel();

  row.appendChild(
    renderConvSide(
      "The cut-out happens right on your device. Nothing gets sent anywhere.",
      [
        { value: 'Zero', label: 'sign-ups', text: 'Open, drop, done.' },
        { value: 'Same size', label: 'or smaller', text: 'See-through. Plop it onto anything.' },
        { value: 'AI', label: 'Loves a portrait', text: 'People come out cleanest. Cats, cars and coffee cups are a bit more hit and miss.' },
      ],
    ),
  );
  wrap.appendChild(row);
  wrap.appendChild(renderConvFaq(BG_FAQ));
  wrap.appendChild(renderConvCta());

  return wrap;
}

const BG_FAQ: FaqEntry[] = [
  { question: 'Is my photo uploaded?', answer: 'No. The cut-out happens on your device.' },
  {
    question: 'Why is the first one slower?',
    answer: 'The first time, your browser downloads the little AI that does the cutting. It keeps it, so every cut-out after that is quicker.',
  },
  {
    question: 'How good are the results?',
    answer: 'Really good on people and portraits. Hair and soft edges blend in nicely. Other things (pets, products, plants) can be a bit hit and miss.',
  },
  {
    question: 'Can I touch up the edges?',
    answer: 'Not yet. You can crop to a square for now, and a touch-up brush is on the wish list.',
  },
  { question: 'What can I upload?', answer: "JPG, PNG, WebP, AVIF, TIFF or HEIC. You get back a see-through image that's never bigger than the file you put in: a WebP for photos, or a PNG when that fits." },
];
