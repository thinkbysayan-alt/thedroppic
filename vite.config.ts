import { defineConfig } from 'vitest/config';

export default defineConfig({
  worker: {
    format: 'es',
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
