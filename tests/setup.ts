// Minimal ImageData polyfill for the plain Node test environment — just
// enough shape (data/width/height) for our pure pixel-manipulation helpers.
// Real browser QA covers actual canvas-backed ImageData behavior.
if (typeof globalThis.ImageData === 'undefined') {
  class NodeImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;

    constructor(data: Uint8ClampedArray, width: number, height?: number) {
      this.data = data;
      this.width = width;
      this.height = height ?? data.length / 4 / width;
    }
  }
  // @ts-expect-error - test-only polyfill, not a full ImageData implementation
  globalThis.ImageData = NodeImageData;
}
