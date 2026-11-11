import { TOOL_LINKS } from '../tools';
import { pathForRoute } from '../router';
import { renderArt, renderCrumbs, renderPageSection, renderToolCarousel, renderToolFaq } from '../sections';

const ABOUT_FAQ = [
  {
    question: 'What is thedroppic?',
    answer: 'A small toolbox for fixing pictures: swap formats, cut out backgrounds, done. It all runs in your browser.',
  },
  {
    question: 'Which image formats can I convert?',
    answer: 'JPEG to PNG, PNG to JPEG, HEIC to JPEG, WebP to JPEG, WebP to PNG, JPEG to WebP and PNG to WebP. You can also remove the background from a photo.',
  },
  {
    question: 'Does it work on my phone?',
    answer: 'Yes. iPhone, Android, Windows, Mac, Linux. Any modern browser will do.',
  },
  {
    question: 'Do I need to install anything?',
    answer: 'Nothing to install, nothing to sign up for, no email to hand over.',
  },
];

/**
 * Left: the headline and the story, then (on scroll) the closing line. Right: the
 * character, calm at first and shouting once you scroll. The screen is pinned while
 * that happens (see initAboutHero in utils/motion.ts); without motion the solution
 * line is simply visible and the calm picture stays.
 */
function renderAboutHero(): HTMLElement {
  const hero = document.createElement('section');
  hero.className = 'about-hero';
  hero.innerHTML = `
    <div class="about-hero__copy">
      <p class="about-hero__eyebrow">About</p>
      <h1 class="about-hero__problem">Hi. We fix pictures.</h1>
      <p class="about-hero__agitation">thedroppic started with a very small, very annoying problem: a photo that wouldn't open. Every fix online wanted an upload, an email address, or a spin of the ad roulette wheel first.</p>
      <p class="about-hero__agitation about-hero__agitation--second">So we built the opposite. You drop a picture, your own browser does the work, and you walk away with the file you needed.</p>
      <p class="about-hero__solution">That's the whole thing.</p>
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
      'Pick your problem',
      renderToolCarousel(TOOL_LINKS),
    ),
  );

  const how = document.createElement('div');
  how.className = 'prose';
  how.innerHTML = `<p>Drop it. Click it. Grab it. Honestly, that's it. <a href="${pathForRoute('jpeg-to-png')}">See how it works</a></p>`;
  wrap.appendChild(renderPageSection('How it works', how));

  const privacy = document.createElement('div');
  privacy.className = 'about-privacy';
  const text = document.createElement('div');
  text.className = 'prose';
  text.innerHTML = `
    <p><strong>Where do your photos go? Nowhere.</strong></p>
    <p>Everything happens on your device. Your images aren't uploaded, stored or logged, because they never reach us in the first place.</p>
    <p>No account, no analytics, no tracking cookies. Our host keeps the usual server logs (like which page was loaded), but your pictures are never part of them.</p>
  `;
  privacy.appendChild(text);
  privacy.appendChild(renderArt({ src: '/art/privacy-character.webp', alt: 'Illustrated character leaning on a large padlock, showing your images stay private', width: 1200, height: 800, className: 'about-privacy__art' }));
  const caption = document.createElement('p');
  caption.className = 'about-privacy__caption';
  caption.textContent = "I'm on guard duty. It's a quiet job.";
  privacy.appendChild(caption);
  wrap.appendChild(renderPageSection('Privacy', privacy, 'privacy'));

  const faq = renderToolFaq(ABOUT_FAQ, 'Things people ask us');
  faq.classList.add('page-section');
  wrap.appendChild(faq);

  return wrap;
}
