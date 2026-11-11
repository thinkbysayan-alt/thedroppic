import { TOOL_LINKS } from '../tools';
import { pathForRoute } from '../router';
import { renderArt, renderCrumbs, renderPageSection, renderToolCarousel, renderToolFaq } from '../sections';

const ABOUT_FAQ = [
  {
    question: 'What is thedroppic?',
    answer: 'thedroppic is a free image toolkit that runs in your browser. It converts JPEG, PNG, WebP and HEIC images and removes backgrounds without uploading anything.',
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
    answer: 'JPEG to PNG, PNG to JPEG, HEIC to JPEG, WebP to JPEG, WebP to PNG, JPEG to WebP and PNG to WebP. You can also remove the background from a photo.',
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

/**
 * Left: the problem and the agitation, then (on scroll) the solution. Right: the
 * character, calm at first and shouting once you scroll. The screen is pinned while
 * that happens (see initAboutHero in utils/motion.ts); without motion the solution
 * line is simply visible and the calm picture stays.
 */
function renderAboutHero(): HTMLElement {
  const hero = document.createElement('section');
  hero.className = 'about-hero';
  hero.innerHTML = `
    <div class="about-hero__copy">
      <h1 class="about-hero__eyebrow">About</h1>
      <p class="about-hero__problem">Converting a photo shouldn't mean handing it over.</p>
      <p class="about-hero__agitation">Free converters upload your file to a server. You can't see where it goes or how long it stays.</p>
      <p class="about-hero__solution">thedroppic runs in your browser. Your images stay on your device. No account, no upload, no tracking.</p>
    </div>
    <div class="about-hero__art">
      <img class="about-hero__img about-hero__img--calm" src="/art/about-calm.webp" width="1200" height="800" alt="Illustrated character in profile, calm" fetchpriority="high" decoding="async" />
      <img class="about-hero__img about-hero__img--shout" src="/art/about-shout.webp" width="1200" height="800" alt="" aria-hidden="true" decoding="async" />
    </div>
  `;
  return hero;
}

/** The privacy statement the footer links to (#privacy) lives here. */
export function renderAboutPage(): HTMLElement {
  const wrap = document.createElement('div');

  const hero = renderAboutHero();
  hero.querySelector('.about-hero__copy')!.prepend(renderCrumbs('About', 'about'));
  wrap.appendChild(hero);

  wrap.appendChild(
    renderPageSection(
      'What you can do',
      renderToolCarousel(TOOL_LINKS),
    ),
  );

  const how = document.createElement('div');
  how.className = 'prose';
  how.innerHTML = `<p>Drop an image, click Convert, download the result. <a href="${pathForRoute('jpeg-to-png')}">See how it works</a></p>`;
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
  privacy.appendChild(renderArt({ src: '/art/privacy-character.webp', alt: 'Illustrated character leaning on a large padlock, showing your images stay private', width: 1200, height: 800, className: 'about-privacy__art' }));
  wrap.appendChild(renderPageSection('Privacy', privacy, 'privacy'));

  const faq = renderToolFaq(ABOUT_FAQ, 'About thedroppic: questions');
  faq.classList.add('page-section');
  wrap.appendChild(faq);

  return wrap;
}
