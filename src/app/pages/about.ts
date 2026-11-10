import { TOOL_LINKS } from '../tools';
import { pathForRoute } from '../router';
import { renderArt, renderCrumbs, renderPageHead, renderPageSection, renderToolCarousel, renderToolFaq } from '../sections';

const ABOUT_FAQ = [
  {
    question: 'What is thedroppic?',
    answer: 'thedroppic is a free image converter that runs in your browser. It converts JPEG, PNG, WebP and HEIC images without uploading them.',
  },
  {
    question: 'Is it really free?',
    answer: 'Yes. There is no account, no paywall, no watermark and no limit on how often you use it.',
  },
  {
    question: 'Are my images uploaded to a server?',
    answer: 'No. Your browser converts the image on your device. The file never leaves it, so there is nothing for us to store or delete.',
  },
  {
    question: 'Which image formats can I convert?',
    answer: 'JPEG to PNG, PNG to JPEG, HEIC to JPEG, WebP to JPEG, WebP to PNG, JPEG to WebP and PNG to WebP.',
  },
  {
    question: 'Does it work on my phone?',
    answer: 'Yes. It runs in any modern browser on iPhone, Android, Windows, Mac and Linux. There is nothing to install.',
  },
  {
    question: 'Do I need to install anything or sign up?',
    answer: 'No. Open the page, drop your image, convert and download. There is no app, no account and no email to hand over.',
  },
];

/** The privacy statement the footer links to (#privacy) lives here. */
export function renderAboutPage(): HTMLElement {
  const wrap = document.createElement('div');

  wrap.appendChild(renderCrumbs('About', 'about'));
  wrap.appendChild(
    renderPageHead({
      title: 'About',
      pas: {
        problem: "Converting a photo shouldn't mean handing it over.",
        agitation: "Free converters upload your file to a server. You can't see where it goes or how long it stays.",
        solution: 'thedroppic runs in your browser. Your images stay on your device. No account, no upload, no tracking.',
      },
    }),
  );

  wrap.appendChild(
    renderPageSection(
      'What you can do',
      renderToolCarousel(TOOL_LINKS),
    ),
  );

  const how = document.createElement('div');
  how.className = 'prose';
  how.innerHTML = `<p>Drop an image, click Convert, download the result. <a href="${pathForRoute('how-it-works')}">See how it works</a></p>`;
  wrap.appendChild(renderPageSection('How it works', how));

  const privacy = document.createElement('div');
  privacy.className = 'about-privacy';
  const text = document.createElement('div');
  text.className = 'prose';
  text.innerHTML = `
    <p>Your images are processed on your device. They are not uploaded, stored or logged.</p>
    <p>There is no account, no analytics and no tracking cookies.</p>
    <p>Our host serves the site and may keep standard server logs, such as the page requested. Your images are never part of them.</p>
  `;
  privacy.appendChild(text);
  privacy.appendChild(renderArt({ src: '/art/lock.svg', alt: '', width: 800, height: 800, className: 'about-privacy__art' }));
  wrap.appendChild(renderPageSection('Privacy', privacy, 'privacy'));

  const faq = renderToolFaq(ABOUT_FAQ, 'About thedroppic: questions');
  faq.classList.add('page-section');
  wrap.appendChild(faq);

  return wrap;
}
