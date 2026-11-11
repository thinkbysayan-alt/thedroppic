import type { ToolLink } from './sections';

/** Every converter, in tab order, with a plain-language hint for the person who needs it. */
export const TOOL_LINKS: ToolLink[] = [
  { route: 'jpeg-to-png', name: 'JPEG to PNG', hint: 'I need a PNG, like, now' },
  { route: 'png-to-jpeg', name: 'PNG to JPEG', hint: 'My PNG is way too chunky' },
  { route: 'heic-to-jpeg', name: 'HEIC to JPEG', hint: "My iPhone photo won't open anywhere" },
  { route: 'webp-to-jpeg', name: 'WebP to JPEG', hint: 'I saved an image and got a weird .webp' },
  { route: 'webp-to-png', name: 'WebP to PNG', hint: 'I need this WebP as a PNG' },
  { route: 'jpeg-to-webp', name: 'JPEG to WebP', hint: 'I want my website to load faster' },
  { route: 'png-to-webp', name: 'PNG to WebP', hint: "My logo's too heavy for the web" },
  { route: 'remove-background', name: 'Remove Background', hint: 'Just me, minus the background' },
];
