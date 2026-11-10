import { TOOL_LINKS } from '../tools';
import { renderCrumbs, renderPageHead, renderPageSection, renderStepList, renderToolLinks } from '../sections';

/** Problem, agitation, solution, then three steps and a way into each converter. */
export function renderHowItWorksPage(): HTMLElement {
  const wrap = document.createElement('div');

  wrap.appendChild(renderCrumbs('How it works', 'how-it-works'));
  wrap.appendChild(
    renderPageHead({
      title: 'How it works',
      pas: {
        problem: 'Most online converters want your photo uploaded first.',
        agitation: "Your file sits on a server you can't see. You wait for it to go up and come back. And you have to trust a stranger with it.",
        solution: 'thedroppic does the work inside your browser instead. Nothing is uploaded, ever.',
      },
    }),
  );

  wrap.appendChild(
    renderPageSection(
      'Three steps',
      renderStepList([
        {
          title: 'Drop your image',
          description: 'Drag it in, paste it, or click Choose. Up to 5 at once.',
          art: { src: '/art/step-drop.svg', alt: '', width: 600, height: 600, priority: true },
        },
        {
          title: 'Click Convert',
          description: 'Your browser converts it on your device. No upload, no queue.',
          art: { src: '/art/step-convert.svg', alt: '', width: 600, height: 600 },
        },
        {
          title: 'Download',
          description: 'Save the new file. Nothing is stored anywhere else.',
          art: { src: '/art/step-download.svg', alt: '', width: 600, height: 600 },
        },
      ]),
    ),
  );

  const proof = document.createElement('div');
  proof.className = 'prose';
  proof.innerHTML = `<p>Open your browser's network tab while you convert. You will see no image upload.</p>`;
  wrap.appendChild(renderPageSection("Don't take our word for it", proof));

  wrap.appendChild(
    renderPageSection(
      'Pick your converter',
      renderToolLinks(TOOL_LINKS),
    ),
  );

  return wrap;
}
