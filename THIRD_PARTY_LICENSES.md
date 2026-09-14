# Third-Party Licenses

Image Converter's conversion engine is a thin application layer over mature,
existing open-source image codec libraries. We do not implement any codec
(JPEG, PNG, WebP, AVIF, TIFF, HEIC) algorithm ourselves — see [README.md](README.md)
for the rationale and research behind each choice.

This file documents every third-party library that ships in the production
bundle, per the project's open-source-first requirement.

---

## @jsquash/jpeg

- **Repository:** https://github.com/jamsinclair/jSquash (packages/jpeg)
- **Version used:** 1.6.0
- **License:** Apache-2.0 (jSquash wrapper). Wraps **MozJPEG**, licensed
  under a BSD-style license (see MozJPEG's own `LICENSE.md` / `README-mozilla.txt`).
- **Purpose:** JPEG decode (native-path fallback) and encode, compiled to WebAssembly.
- **Attribution:** Apache-2.0 requires preserving copyright/license notices
  in redistributed source; satisfied by this file plus the unmodified
  `node_modules` package metadata retained in our dependency tree.

## @jsquash/png

- **Repository:** https://github.com/jamsinclair/jSquash (packages/png)
- **Version used:** 3.1.1
- **License:** Apache-2.0 (jSquash wrapper) wrapping the Rust `png` crate (MIT/Apache-2.0 dual-licensed).
- **Purpose:** Lossless PNG decode/encode, compiled to WebAssembly.

## @jsquash/webp

- **Repository:** https://github.com/jamsinclair/jSquash (packages/webp)
- **Version used:** 1.5.0
- **License:** Apache-2.0 (jSquash wrapper) wrapping **libwebp** (Google), BSD-3-Clause.
- **Purpose:** WebP encode, compiled to WebAssembly.

## @jsquash/avif

- **Repository:** https://github.com/jamsinclair/jSquash (packages/avif)
- **Version used:** 2.1.1
- **License:** Apache-2.0 (jSquash wrapper) wrapping **libavif** (AOMedia), BSD-2-Clause.
- **Purpose:** AVIF decode (fallback for browsers without native AVIF support) and encode, compiled to WebAssembly.

## utif

- **Repository:** https://github.com/photopea/UTIF.js
- **Version used:** 3.1.0
- **License:** MIT
- **Purpose:** TIFF decode and encode. No browser has native TIFF support, so
  this is the only codec used for both reading and writing TIFF files.

## libheif-js

- **Repository:** https://github.com/catdad-experiments/libheif-js
- **Version used:** 1.23.2
- **License:** **LGPL-3.0** (wraps libheif, libde265 and related HEIF/HEVC libraries)
- **Purpose:** HEIC/HEIF **decode only** — there is no HEIC encode anywhere
  in this app, by design (not required by the product spec).
- **Why an LGPL dependency was accepted:** it is the only mature,
  browser-ready WASM HEIC/HEIF decoder available (the same approach used by
  Squoosh and other browser image tools). It is loaded lazily as its own
  WebAssembly module, dynamically imported only when a HEIC/HEIF file is
  uploaded — it is never statically linked into the rest of the application
  bundle. LGPL-3.0 permits this kind of dynamic-linking use without placing
  additional license obligations on the surrounding application code. This
  was an explicit, informed decision (not an oversight of the project's
  general permissive-license preference).

## @huggingface/transformers

- **Repository:** https://github.com/huggingface/transformers.js
- **Version used:** ^4.2.0
- **License:** Apache-2.0
- **Purpose:** Runs the MODNet portrait-matting model (see below) entirely
  client-side on top of ONNX Runtime Web, for the AI "Remove background"
  feature. Lazy-loaded only when the user enables the "Remove background"
  toggle. Self-hosted (`public/models/`, `public/ort/`) — no calls to Hugging
  Face's or any other CDN at runtime, matching the app's no-external-calls
  privacy stance.
- **Note:** must run on the main thread in this app (see
  `src/conversion/background-removal.ts` for the reasoning).

## onnx-community/modnet-webnn (MODNet)

- **Repository:** https://github.com/ZHKKKe/MODNet (model weights re-published,
  ONNX-converted, at https://huggingface.co/onnx-community/modnet-webnn)
- **License:** Apache-2.0
- **Purpose:** Trimap-free portrait-matting model producing a continuous soft
  alpha matte (not a hard binary mask), used for the "Remove background"
  cutout. Chosen specifically to fix hard "sticker" edges, hair fringing, and
  halos that a coarse segmentation mask produces — the soft matte blends
  semi-transparent pixels at hair/edge boundaries.
- **Why this over alternatives:** `@imgly/background-removal` was rejected
  (AGPL-3.0, a strong copyleft license the project avoids without a
  deliberate, explicit exception). BRIA RMBG-1.4/2.0 was rejected
  (non-commercial-only license). `@mediapipe/tasks-vision` was rejected as
  too bloated (12-35MB for a general-purpose vision-task WASM runtime). The
  legacy `@mediapipe/selfie_segmentation` package (previously used here) was
  replaced outright — its coarse, near-binary segmentation mask was the root
  cause of the hard "sticker" edges this model exists to fix.
- **Note:** this is a person/portrait matting model — it works best on
  people and portraits, not arbitrary objects; see the in-app hint text next
  to the toggle.

---

## Build tooling (dev dependencies, not shipped in the production bundle)

| Package | License | Purpose |
|---|---|---|
| Vite | MIT | Build tool / dev server |
| Vitest | MIT | Test runner |
| TypeScript | Apache-2.0 | Type checking / compilation |

---

## Summary

| Library | License | Copyleft? |
|---|---|---|
| @jsquash/jpeg (+ MozJPEG) | Apache-2.0 / BSD-style | No |
| @jsquash/png (+ Rust `png`) | Apache-2.0 / MIT+Apache-2.0 | No |
| @jsquash/webp (+ libwebp) | Apache-2.0 / BSD-3-Clause | No |
| @jsquash/avif (+ libavif) | Apache-2.0 / BSD-2-Clause | No |
| utif | MIT | No |
| libheif-js (+ libheif, libde265) | LGPL-3.0 | Weak copyleft — used only via lazy dynamic WASM import, decode-only |
| @huggingface/transformers | Apache-2.0 | No |
| onnx-community/modnet-webnn (MODNet) | Apache-2.0 | No |

No GPL or AGPL dependency is used anywhere in this project.
