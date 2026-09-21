import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';

/**
 * @jsquash/avif switches to its multi-threaded encoder whenever the page is
 * cross-origin isolated (which this site always is). In the production build
 * that encoder starts its pthread workers from a bare `avif_enc_mt.worker.mjs`
 * URL that isn't emitted, so the request 404s and the encode never finishes.
 * Use the single-threaded encoder instead: slower on huge images, but it works.
 */
const singleThreadAvif = (): Plugin => ({
  name: 'single-thread-avif',
  enforce: 'pre',
  resolveId(source, importer) {
    if (importer?.includes('@jsquash/avif') && source.endsWith('codec/enc/avif_enc_mt.js')) {
      return this.resolve(source.replace('avif_enc_mt.js', 'avif_enc.js'), importer, { skipSelf: true });
    }
    return null;
  },
});


export default defineConfig({
  plugins: [singleThreadAvif()],
  worker: {
    format: 'es',
    plugins: () => [singleThreadAvif()],
  },
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  server: {
    headers: {
      // Enables multi-threaded WASM codecs (SharedArrayBuffer) where supported.
      // Codecs still work single-threaded without these; see codecs/*.
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});
