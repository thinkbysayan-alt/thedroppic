import { createToolWorkspace } from '../tool-workspace';
import { renderConvCta, renderConvFaq, renderConvSide, type FaqEntry } from './conv-parts';
import { pathForRoute, type ConverterRoute } from '../router';
import type { OutputFormat, SourceFormat } from '../../types';

/**
 * The Convert page, from the Figma design: one bordered box with a tab per
 * converter (JPEG to PNG, PNG to JPEG, HEIC to JPEG) holding the upload tool,
 * a privacy note with three fact cards beside it, then an FAQ, a call-to-action
 * band and a "Learn more" list.
 *
 * Each tab is still its own URL (and its own page title), so every converter
 * stays directly linkable and indexable; the tab just swaps which one is open.
 */
interface ConverterDef {
  from: SourceFormat;
  to: OutputFormat;
  fromLabel: string;
  toLabel: string;
  title: string;
  accept: string;
  /** The third fact card (the other two are the same on every converter). */
  fact: { value: string; label: string; text: string };
}

const TAB_ORDER: ConverterRoute[] = ['jpeg-to-png', 'png-to-jpeg', 'heic-to-jpeg', 'webp-to-jpeg', 'webp-to-png', 'jpeg-to-webp', 'png-to-webp'];

const SOURCE_LABEL: Record<SourceFormat, string> = {
  jpeg: 'a JPEG',
  png: 'a PNG',
  webp: 'a WebP',
  avif: 'an AVIF',
  tiff: 'a TIFF',
  heic: 'a HEIC',
};

const CONVERTERS: Record<ConverterRoute, ConverterDef> = {
  'jpeg-to-png': {
    from: 'jpeg',
    to: 'png',
    fromLabel: 'JPEG',
    toLabel: 'PNG',
    title: 'JPEG to PNG',
    accept: 'image/jpeg,.jpg,.jpeg,.jfif',
    fact: { value: '100%', label: 'Lossless', text: 'PNG keeps every pixel of your JPEG.' },
  },
  'png-to-jpeg': {
    from: 'png',
    to: 'jpeg',
    fromLabel: 'PNG',
    toLabel: 'JPEG',
    title: 'PNG to JPEG',
    accept: 'image/png,.png',
    fact: { value: '1-100', label: 'Quality you choose', text: 'Balance file size against detail.' },
  },
  'heic-to-jpeg': {
    from: 'heic',
    to: 'jpeg',
    fromLabel: 'HEIC',
    toLabel: 'JPEG',
    title: 'HEIC to JPEG',
    accept: '.heic,.heif,image/heic,image/heif',
    fact: { value: 'JPEG', label: 'Opens anywhere', text: 'Works on any PC, phone, app or website.' },
  },
  'webp-to-jpeg': {
    from: 'webp',
    to: 'jpeg',
    fromLabel: 'WebP',
    toLabel: 'JPEG',
    title: 'WebP to JPEG',
    accept: 'image/webp,.webp',
    fact: { value: 'JPEG', label: 'Opens anywhere', text: 'Works on any PC, phone, app or website.' },
  },
  'webp-to-png': {
    from: 'webp',
    to: 'png',
    fromLabel: 'WebP',
    toLabel: 'PNG',
    title: 'WebP to PNG',
    accept: 'image/webp,.webp',
    fact: { value: 'Alpha', label: 'Keeps transparency', text: 'Transparent areas stay transparent.' },
  },
  'jpeg-to-webp': {
    from: 'jpeg',
    to: 'webp',
    fromLabel: 'JPEG',
    toLabel: 'WebP',
    title: 'JPEG to WebP',
    accept: 'image/jpeg,.jpg,.jpeg,.jfif',
    fact: { value: '1-100', label: 'Quality you choose', text: 'WebP files are usually lighter than JPEG.' },
  },
  'png-to-webp': {
    from: 'png',
    to: 'webp',
    fromLabel: 'PNG',
    toLabel: 'WebP',
    title: 'PNG to WebP',
    accept: 'image/png,.png',
    fact: { value: 'Lighter', label: 'Smaller files', text: 'WebP files are usually much smaller than PNG.' },
  },
};

const FAQ: FaqEntry[] = [
  { question: 'Are my images uploaded?', answer: 'No. The conversion runs in your browser. Your image never leaves your device.' },
  { question: 'Do I need an account?', answer: 'No. There is no sign-up or login.' },
  { question: 'What can thedroppic do?', answer: 'It converts images between JPEG, PNG, WebP and HEIC, and removes image backgrounds, right in your browser.' },
  { question: 'How many images can I process at once?', answer: 'Up to 5. Each one is converted and downloaded separately.' },
  { question: 'Which image formats are supported?', answer: 'JPEG, PNG, WebP and HEIC. Pick the tab for the conversion you need.' },
  { question: 'Is it free?', answer: 'Yes. There is no limit on how often you use it.' },
  {
    question: 'How do I convert a HEIC photo to JPEG for free?',
    answer: 'Open the HEIC to JPEG tab, drop your iPhone photo, click Convert and download the JPEG. It is free, needs no account and runs in your browser.',
  },
  {
    question: 'Which image format should I use: JPEG, PNG or WebP?',
    answer: 'Use JPEG for photos, PNG for graphics, screenshots and transparency, and WebP for smaller files on a website. If a file will not open, convert it to JPEG.',
  },
  {
    question: 'Is there a free image converter that does not upload my files?',
    answer: 'Yes. thedroppic converts JPEG, PNG, WebP and HEIC images in your browser, so your files stay on your device and are never sent to a server.',
  },
];

export function renderConverterPage(route: ConverterRoute): HTMLElement {
  const def = CONVERTERS[route];
  const wrap = document.createElement('div');
  wrap.className = 'conv';

  // The page's h1: the design has no visible heading, only the tabs.
  const h1 = document.createElement('h1');
  h1.className = 'visually-hidden';
  h1.textContent = def.title;
  wrap.appendChild(h1);

  // ---- Tool box with tabs
  const row = document.createElement('section');
  row.className = 'conv-row';

  const box = document.createElement('div');
  box.className = 'conv-box';

  const tabs = document.createElement('nav');
  tabs.className = 'conv-tabs';
  tabs.setAttribute('aria-label', 'Converters');
  for (const tabRoute of TAB_ORDER) {
    const a = document.createElement('a');
    a.href = pathForRoute(tabRoute);
    a.textContent = CONVERTERS[tabRoute].title;
    if (tabRoute === route) a.setAttribute('aria-current', 'page');
    tabs.appendChild(a);
  }
  box.appendChild(tabs);

  const body = document.createElement('div');
  body.className = 'conv-box__body';
  const host = document.createElement('div');
  host.id = 'upload';
  body.appendChild(host);
  box.appendChild(body);
  row.appendChild(box);

  const workspace = createToolWorkspace({
    forceRemoveBackground: false,
    showFormatSelector: false,
    showBackgroundToggle: false,
    fixedOutputFormat: def.to,
    allowedSources: [def.from],
    convertLabel: `Convert to ${def.toLabel}`,
    wrongFormatMessage: (detected) => {
      const that = `That file is ${SOURCE_LABEL[detected]}.`;
      const tabsForIt = TAB_ORDER.filter((r) => CONVERTERS[r].from === detected).map((r) => CONVERTERS[r].title);
      if (tabsForIt.length === 0) return `${that} This tab converts ${def.fromLabel} to ${def.toLabel}.`;
      return `${that} Use the ${tabsForIt.join(' or ')} tab instead.`;
    },
    upload: {
      title: `Drop up to 5 ${def.fromLabel} images here`,
      buttonLabel: 'Choose images',
      accept: def.accept,
      formats: null,
      minimal: true,
    },
  });
  workspace.mount(host);

  // ---- Side column: lock, privacy note, three fact cards
  row.appendChild(
    renderConvSide(
      'Your photo never leaves your device. Your browser does the work, so there is no upload, no queue and nothing to delete afterwards.',
      [
        { value: 'Free', label: 'Always', text: 'No account, no limits, no watermark.' },
        { value: '5', label: 'Files at once', text: 'Drop up to 5 images and convert them together.' },
        def.fact,
      ],
    ),
  );
  wrap.appendChild(row);
  wrap.appendChild(renderConvFaq(FAQ));
  wrap.appendChild(renderConvCta());

  return wrap;
}
