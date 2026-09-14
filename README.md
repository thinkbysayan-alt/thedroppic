# Image Converter

A focused, privacy-first, browser-only image converter.

**Upload → Convert → Download.** Optionally crop to a 1:1 square first.

No backend, no accounts, no uploads to a server — every decode/encode step
runs locally in the browser via WebAssembly.

## Product scope

This is **not** a general image editor and **not** a resizing tool. It does
exactly one job well:

- Upload an image (file picker, drag-and-drop, or clipboard paste)
- Preview it
- Pick an output format and (for lossy formats) a quality level
- Convert it locally
- Download the result directly — one file, no ZIP
- Optionally crop to a 1:1 square first (pan + zoom, mouse or touch)
- Optionally remove the background (AI subject cutout, opt-in) before converting

Image dimensions are always preserved during conversion. There is no
resize/scale/percentage/resolution control anywhere in the app — cropping to
a square is the *only* operation that changes output dimensions.

**Note on scope:** background removal was added after the initial MVP build,
at the user's explicit request, as a deliberate exception to the original
"no background removal" scope line — see [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md)
for the model/license research behind it.

## Supported formats

| | Input | Output |
|---|---|---|
| JPG / JPEG | ✅ | ✅ |
| PNG | ✅ | ✅ |
| WebP | ✅ | ✅ |
| AVIF | ✅ | ✅ |
| TIFF | ✅ | ✅ |
| HEIC / HEIF | ✅ | — (not required) |

### Conversion matrix

Every format converts to every other supported output format except itself.
HEIC/HEIF is decode-only and can convert to any of the five output formats.
The actual allowed pairs live in one place, [`src/conversion/capability-matrix.ts`](src/conversion/capability-matrix.ts) —
the UI always reads from it rather than hardcoding a format list.

## Architecture

```
src/
  app/            top-level state machine (idle → ready → cropping → converting → result/error) + tiny pub/sub store
  components/     upload, preview, format-selector, quality-control, cropper, result, errors — each a small DOM-building function
  conversion/     format detection (magic-number sniffing), capability matrix, conversion orchestration, preview generation
  codecs/         one thin lazy-loading wrapper per format (jpeg/png/webp/avif/tiff/heif) — see "Codec libraries" below
  workers/        conversion.worker.ts — decode/encode runs off the main thread
  utils/          file naming, image/canvas helpers, download, memory cleanup
  styles/         hand-written CSS (variables, global reset, components, responsive)
```

**No UI framework.** The app is vanilla TypeScript with direct DOM
manipulation — small enough that a framework would add bundle size and
indirection without a real benefit.

### How a conversion actually runs

1. Format is detected from the file's **binary signature** (magic numbers),
   never the filename extension — see [`format-detector.ts`](src/conversion/format-detector.ts).
2. The file's bytes are transferred (zero-copy) to a Web Worker.
3. The worker decodes the image:
   - JPEG/PNG/WebP/AVIF use the browser's native `createImageBitmap` first —
     fast, and no WASM download needed. AVIF falls back to the WASM decoder
     only if the browser can't decode it natively.
   - TIFF and HEIC always need their WASM codec (UTIF.js / libheif-js) — no
     browser can decode these natively.
   - `imageOrientation: 'from-image'` applies EXIF rotation automatically,
     so orientation is always correct without any hand-rolled matrix math.
4. If a crop was applied, it's cut directly out of the decoded pixel buffer.
5. If the target is JPEG and the source has transparency, the alpha channel
   is flattened onto a white or black background (JPEG can't carry alpha).
6. The worker encodes the result with the chosen codec and quality, and
   transfers the encoded bytes back.
7. The main thread wraps the result in a `Blob`, builds the download
   filename (original base name + new extension — never a ZIP), and offers
   a direct download.

Every codec module is **dynamically imported** — a JPEG→PNG conversion never
downloads the AVIF or HEIC WASM, and a HEIC upload doesn't pull in every
encoder up front. Only the codec actually needed for the operation at hand
is fetched.

### Codec libraries

We do not implement any image codec ourselves. Research and selection
criteria (license, maintenance, WASM/browser support, bundle size) are
recorded in [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).

| Format | Library | Underlying codec |
|---|---|---|
| JPEG | [@jsquash/jpeg](https://github.com/jamsinclair/jSquash) | MozJPEG |
| PNG | [@jsquash/png](https://github.com/jamsinclair/jSquash) | Rust `png` crate |
| WebP | [@jsquash/webp](https://github.com/jamsinclair/jSquash) | libwebp |
| AVIF | [@jsquash/avif](https://github.com/jamsinclair/jSquash) | libavif |
| TIFF | [utif](https://github.com/photopea/UTIF.js) | UTIF.js (pure JS) |
| HEIC/HEIF (decode only) | [libheif-js](https://github.com/catdad-experiments/libheif-js) | libheif |
| Background removal | [@huggingface/transformers](https://github.com/huggingface/transformers.js) | MODNet portrait matting (self-hosted, no CDN) |

## Local development

```bash
npm install
npm run dev
```

Opens a dev server (default `http://localhost:5173`). The dev server sends
`Cross-Origin-Opener-Policy`/`Cross-Origin-Embedder-Policy` headers to enable
multi-threaded WASM where the browser supports it — codecs still work
single-threaded without them.

### Tests

```bash
npm run test
```

Vitest covers the pure-logic layer: format detection (magic-number
sniffing across all supported formats plus an unsupported one), the
capability matrix, filename/extension handling, and pixel-level crop/
transparency-flatten math. WASM codec behavior (actual JPEG/PNG/WebP/AVIF/
TIFF encode+decode round trips, the cropper's pointer/touch interaction, and
HEIC decode) needs a real browser and WebAssembly — those are covered by
manual QA in an actual browser rather than a Node test runner; see "Manual
QA performed" below for what's been verified.

### Production build

```bash
npm run build   # type-checks, then builds to dist/
npm run preview # serve the production build locally
```

`dist/` is fully static — deployable to any static host (Netlify, Cloudflare
Pages, GitHub Pages, S3, etc.) with no server-side image processing required.
A `public/_headers` file is included for hosts that honor it (Netlify,
Cloudflare Pages) to enable the same optional multi-threading headers in
production; it's harmless to delete if your host doesn't support it.

## Browser support

Requires: Web Workers, WebAssembly, `createImageBitmap`, Canvas/OffscreenCanvas,
and (for HEIC/large TIFF) enough memory to hold a decoded image. Works in
current Chrome, Edge, Firefox and Safari. AVIF *decode* support varies by
browser version — where the browser can't decode AVIF natively, the app
transparently falls back to the WASM AVIF decoder.

## Known limitations

- **TIFF orientation tags** are not re-applied (unlike JPEG's EXIF
  orientation, which the browser corrects automatically). This only affects
  the rare TIFF file that both carries an orientation tag and needs
  rotating — most TIFFs (scans, exports) don't.
- **TIFF preview/output has no compression** — UTIF.js writes uncompressed
  TIFF, so TIFF output files are larger than a compressed original. This is
  a property of the codec, not a bug; TIFF is offered as "Lossless" with no
  quality slider for the same reason PNG is.
- **HEIC output** is intentionally not implemented — see product spec.
- **"Remove background"** uses MODNet, a portrait-matting model that
  produces a soft alpha matte (not a hard mask) for smooth, natural edges
  and hair detail — it works well on people and portraits, but wasn't
  trained for general objects/products/animals and won't cleanly cut those
  out. Always produces a transparent PNG (no white/black background choice).
  It also runs on the main thread (briefly blocking the UI during inference)
  — see `src/conversion/background-removal.ts` for the reasoning.
- Extremely large images (roughly >100 megapixels) are rejected up front
  with a friendly "too large for your browser" message rather than
  attempting to decode and risking a crash.

## Manual QA performed

Automated tests cover the pure-logic layer (see "Tests" above). The
following was additionally verified live in a real browser during
development:

- Upload via drag-and-drop, clipboard paste, and format detection by binary
  signature (including on real downloaded JPEG/AVIF/WebP files, not just
  synthetic ones)
- JPG→PNG, PNG→WebP, PNG→AVIF, TIFF→JPG, JPEG(native decode)→PNG, WebP→PNG,
  AVIF→PNG conversions, each producing a valid, correctly-sized,
  correctly-named download
- TIFF encode → decode round trip (byte-for-byte pixel match)
- Transparency flattening to White/Black, and preserving Transparent, across
  PNG/TIFF output — including a real half-transparent test image
- **AI background removal**, verified on a real downloaded portrait photo:
  clean subject cutout to a transparent background, and correctly composited
  with the White/Black/Transparent choice afterward
- 1:1 crop with zoom, apply, and cancel, producing correctly-cropped output
  on portrait, landscape, and EXIF-rotated source images (a real bug — a
  global CSS rule silently squeezing the crop image — was caught and fixed
  this way, not by code review alone)
- Unsupported-file error path (friendly message, no raw error leaked)
- Responsive layout at 375px (mobile) and desktop widths, no horizontal
  scroll, touch-sized controls, including the background-removal toggle

**Not yet verified against a real device/file:** HEIC/HEIF input decode
(libheif-js) — synthesizing a valid HEIC test file requires real HEVC image
data that can't be reasonably hand-built for this pass. Before shipping,
test with an actual iPhone photo.

## Privacy & security

- No image content, buffer, thumbnail, or preview is ever sent to a server.
- No analytics, tracking cookies, or third-party scripts.
- Uploaded filenames are sanitized before being rendered or used in the
  download name (see [`utils/file.ts`](src/utils/file.ts)) — untrusted input
  is never trusted as a path or injected as raw HTML.
- No accounts, no login, no payment flow, no ads.

## Deployment

Build with `npm run build`, then upload the contents of `dist/` to any
static host. No server, database, or backend process is needed.
