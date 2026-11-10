import type { ToolLink } from './sections';

/** Every converter, in tab order, with a plain-language hint for the person who needs it. */
export const TOOL_LINKS: ToolLink[] = [
  { route: 'jpeg-to-png', name: 'JPEG to PNG', hint: 'I have a JPEG, I need a PNG' },
  { route: 'png-to-jpeg', name: 'PNG to JPEG', hint: 'My PNG is too big' },
  { route: 'heic-to-jpeg', name: 'HEIC to JPEG', hint: "My iPhone photo won't open" },
  { route: 'webp-to-jpeg', name: 'WebP to JPEG', hint: "My WebP image won't open" },
  { route: 'webp-to-png', name: 'WebP to PNG', hint: 'I need a PNG from a WebP' },
  { route: 'jpeg-to-webp', name: 'JPEG to WebP', hint: 'I want a lighter web image' },
  { route: 'png-to-webp', name: 'PNG to WebP', hint: 'Make my PNG smaller for the web' },
];
