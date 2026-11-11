import { createToolWorkspace } from '../tool-workspace';
import { renderConvCta, renderConvFaq, renderConvHead, renderConvSide, type FaqEntry } from './conv-parts';
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
  /** The page's own headline and the one-liner under it. */
  headline: string;
  oneLiner: string;
  /** How the format is named in "Drop up to 5 ___ here". */
  plural: string;
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
    headline: 'Give your JPEG a glow-up.',
    oneLiner: 'PNG keeps every pixel crisp, so edges stay sharp and screenshots stay readable.',
    plural: 'JPEGs',
    accept: 'image/jpeg,.jpg,.jpeg,.jfif',
    fact: { value: '100%', label: 'Every pixel', text: 'PNG keeps all of it, nothing smudged.' },
  },
  'png-to-jpeg': {
    from: 'png',
    to: 'jpeg',
    fromLabel: 'PNG',
    toLabel: 'JPEG',
    title: 'PNG to JPEG',
    headline: 'Same picture. Way lighter.',
    oneLiner: 'Shrink that chunky PNG into a JPEG that actually fits in an email.',
    plural: 'PNGs',
    accept: 'image/png,.png',
    fact: { value: '1-100', label: 'Way smaller', text: 'You pick the quality. Lower it and the file shrinks fast.' },
  },
  'heic-to-jpeg': {
    from: 'heic',
    to: 'jpeg',
    fromLabel: 'HEIC',
    toLabel: 'JPEG',
    title: 'HEIC to JPEG',
    headline: 'iPhone photo, meet the rest of the world.',
    oneLiner: 'Turn HEIC files into JPEGs that open on Windows, Android, and that one ancient office laptop.',
    plural: 'HEICs',
    accept: '.heic,.heif,image/heic,image/heif',
    fact: { value: 'JPEG', label: 'Opens anywhere', text: 'Windows, Android, that old office laptop. All fine.' },
  },
  'webp-to-jpeg': {
    from: 'webp',
    to: 'jpeg',
    fromLabel: 'WebP',
    toLabel: 'JPEG',
    title: 'WebP to JPEG',
    headline: "Saved an image and it won't open? Classic WebP.",
    oneLiner: 'Turn it into a good old JPEG that works everywhere.',
    plural: 'WebPs',
    accept: 'image/webp,.webp',
    fact: { value: 'JPEG', label: 'Opens anywhere', text: 'Works in every app, on every device.' },
  },
  'webp-to-png': {
    from: 'webp',
    to: 'png',
    fromLabel: 'WebP',
    toLabel: 'PNG',
    title: 'WebP to PNG',
    headline: 'WebP in, PNG out.',
    oneLiner: "Handy when you need transparency and an app that won't throw a tantrum.",
    plural: 'WebPs',
    accept: 'image/webp,.webp',
    fact: { value: 'Alpha', label: 'See-through stays', text: 'Transparent parts stay transparent.' },
  },
  'jpeg-to-webp': {
    from: 'jpeg',
    to: 'webp',
    fromLabel: 'JPEG',
    toLabel: 'WebP',
    title: 'JPEG to WebP',
    headline: 'Make your site a little faster.',
    oneLiner: 'WebP files are smaller than JPEGs at the same quality. Your page speed score will thank you.',
    plural: 'JPEGs',
    accept: 'image/jpeg,.jpg,.jpeg,.jfif',
    fact: { value: '1-100', label: 'Lighter files', text: 'You pick the quality. WebP keeps it small.' },
  },
  'png-to-webp': {
    from: 'png',
    to: 'webp',
    fromLabel: 'PNG',
    toLabel: 'WebP',
    title: 'PNG to WebP',
    headline: 'Keep the transparency, lose the weight.',
    oneLiner: 'Perfect for logos and graphics on the web.',
    plural: 'PNGs',
    accept: 'image/png,.png',
    fact: { value: 'Lighter', label: 'Same look, less weight', text: 'Your logo keeps its see-through edges.' },
  },
};

const FAQ: FaqEntry[] = [
  { question: 'Are my images uploaded?', answer: 'Nope. Your browser does the converting, so your photos never leave your device.' },
  { question: 'Do I need an account?', answer: 'Not even a little bit. Open the page and go.' },
  { question: 'How many images can I convert at once?', answer: 'Up to 5. Each one comes back as its own download.' },
  { question: 'Which formats are supported?', answer: 'JPEG, PNG, WebP and HEIC. Pick the tab that matches what you have and what you need.' },
  { question: 'Does it cost anything?', answer: "No, and there's no daily limit either. Convert to your heart's content." },
  {
    question: 'How do I turn an iPhone HEIC photo into a JPEG?',
    answer: 'Open the HEIC to JPEG tab, drop your photo in, hit Convert, and download. About ten seconds, start to finish.',
  },
  {
    question: 'JPEG, PNG or WebP: which should I use?',
    answer: "Quick cheat sheet: JPEG for photos, PNG for screenshots, logos and anything that needs a see-through background, WebP for images on a website. If a file won't open somewhere, JPEG is the safe bet.",
  },
];

export function renderConverterPage(route: ConverterRoute): HTMLElement {
  const def = CONVERTERS[route];
  const wrap = document.createElement('div');
  wrap.className = 'conv';

  // The page's own heading (the h1): plain format name as a label, then this tab's headline and one-liner.
  wrap.appendChild(renderConvHead(def.title, def.headline, def.oneLiner));

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
    convertLabel: 'Convert it',
    wrongFormatMessage: (detected) => {
      const that = `Hmm, that's not ${SOURCE_LABEL[def.from]}.`;
      const tabsForIt = TAB_ORDER.filter((r) => CONVERTERS[r].from === detected).map((r) => CONVERTERS[r].title);
      if (tabsForIt.length === 0) return `${that} Try a different file.`;
      return `${that} It looks like ${SOURCE_LABEL[detected]}, so try the ${tabsForIt.join(' or ')} tab instead.`;
    },
    upload: {
      title: `Drop up to 5 ${def.plural} here`,
      buttonLabel: 'Pick photos',
      accept: def.accept,
      formats: null,
      minimal: true,
    },
  });
  workspace.mount(host);

  // ---- Side column: lock, privacy note, three fact cards
  row.appendChild(
    renderConvSide(
      "Your photos stay on your device the whole time. Your browser does the heavy lifting, so there's nothing to upload and nothing left behind.",
      [
        { value: '0', label: 'sign-ups', text: "Just open the page and go. No watermark stamped on your stuff, either." },
        { value: '5', label: 'at a time', text: 'Got a batch? Drop them all in together.' },
        def.fact,
      ],
    ),
  );
  wrap.appendChild(row);
  wrap.appendChild(renderConvFaq(FAQ));
  wrap.appendChild(renderConvCta());

  return wrap;
}
