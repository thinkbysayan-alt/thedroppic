/**
 * The MVP is a single homepage — there is no client-side routing yet. This
 * file exists purely to document the SEO-friendly conversion routes planned
 * for a future iteration (see spec §43), so the conversion engine (which
 * already works for any source→target pair via the capability matrix) can
 * be reused unchanged when those routes are built: each would just pre-seed
 * the format selector from the URL rather than duplicating any logic here.
 */
export const FUTURE_CONVERSION_ROUTES = [
  '/jpg-to-png',
  '/png-to-jpg',
  '/jpg-to-webp',
  '/png-to-webp',
  '/heic-to-jpg',
  '/heic-to-png',
  '/avif-to-jpg',
  '/tiff-to-jpg',
] as const;
