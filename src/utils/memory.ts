/**
 * Central place for releasing large in-memory resources (ImageBitmaps,
 * object URLs) so we never hold more than one full-resolution copy of an
 * image at a time. Call these as soon as a resource is no longer needed.
 */

export function closeBitmap(bitmap: ImageBitmap | null | undefined): void {
  bitmap?.close();
}

const trackedUrls = new Set<string>();

export function trackObjectUrl(url: string): string {
  trackedUrls.add(url);
  return url;
}

export function revokeObjectUrl(url: string | null | undefined): void {
  if (!url) return;
  if (trackedUrls.has(url)) {
    URL.revokeObjectURL(url);
    trackedUrls.delete(url);
  }
}

export function revokeAllTrackedUrls(): void {
  for (const url of trackedUrls) URL.revokeObjectURL(url);
  trackedUrls.clear();
}
