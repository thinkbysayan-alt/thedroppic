import type { CropRegion } from '../../types';
import { CROP_PRESETS } from './crop-presets';

export interface CropperHandlers {
  onApply: (crop: CropRegion) => void;
  onCancel: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

/**
 * 1:1 square cropper. The square viewport itself *is* the crop frame — what's
 * visible in it is exactly what gets cropped, so there's no separate overlay
 * to keep in sync. Pan via pointer drag (mouse + touch unified through the
 * Pointer Events API), zoom via a slider. Only ever produces a square region;
 * there is no width/height/freeform/other-aspect-ratio path here.
 *
 * Deliberately does *not* take width/height parameters from the caller —
 * all sizing math below reads `img.naturalWidth`/`img.naturalHeight` off the
 * loaded <img> element itself once it's loaded. Those are the one value the
 * browser guarantees matches exactly what's actually being rendered; trusting
 * a width/height passed in from application state (which can drift out of
 * sync with the real decoded image — EXIF orientation, HEIC rotation, or any
 * future decode-path difference) is what previously caused the image to be
 * force-sized into the wrong box and rendered squeezed/stretched.
 */
export function renderCropper(previewUrl: string, handlers: CropperHandlers): HTMLElement {
  const root = document.createElement('div');
  root.className = 'cropper';

  const stage = document.createElement('div');
  stage.className = 'cropper__stage';
  stage.setAttribute('role', 'img');
  stage.setAttribute('aria-label', 'Drag to reposition, use the zoom slider to resize the crop area');

  const img = document.createElement('img');
  img.className = 'cropper__canvas';
  img.src = previewUrl;
  img.alt = '';
  img.draggable = false;
  img.style.transformOrigin = 'top left';
  img.style.position = 'relative';
  stage.appendChild(img);
  root.appendChild(stage);

  const zoomRow = document.createElement('div');
  zoomRow.className = 'cropper__zoom';
  const zoomLabel = document.createElement('label');
  zoomLabel.htmlFor = 'crop-zoom';
  zoomLabel.className = 'visually-hidden';
  zoomLabel.textContent = 'Zoom';
  const zoomInput = document.createElement('input');
  zoomInput.type = 'range';
  zoomInput.id = 'crop-zoom';
  zoomInput.min = String(MIN_ZOOM);
  zoomInput.max = String(MAX_ZOOM);
  zoomInput.step = '0.01';
  zoomInput.value = String(MIN_ZOOM);
  zoomInput.setAttribute('aria-label', 'Zoom');
  zoomRow.append(zoomLabel, zoomInput);
  root.appendChild(zoomRow);

  const presetsRow = document.createElement('div');
  presetsRow.className = 'crop-presets';
  presetsRow.setAttribute('role', 'group');
  presetsRow.setAttribute('aria-label', 'Crop presets (all square)');
  for (const preset of CROP_PRESETS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = preset;
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => {
      presetsRow.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      // All presets are the same 1:1 crop — selecting one just resets to a centered, fully-zoomed-out square.
      zoomInput.value = String(MIN_ZOOM);
      offsetX = 0;
      offsetY = 0;
      applyTransform();
    });
    presetsRow.appendChild(btn);
  }
  root.appendChild(presetsRow);

  const actions = document.createElement('div');
  actions.className = 'actions actions--row';
  const applyBtn = document.createElement('button');
  applyBtn.type = 'button';
  applyBtn.className = 'btn btn-primary btn-block';
  applyBtn.textContent = 'Apply crop';
  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn btn-secondary btn-block';
  cancelBtn.textContent = 'Cancel';
  actions.append(applyBtn, cancelBtn);
  root.appendChild(actions);

  // --- pan/zoom state, in *displayed* (CSS) pixels within the stage ---
  let offsetX = 0;
  let offsetY = 0;
  let baseScale = 1; // scale at which the image exactly covers the square stage
  // Populated from img.naturalWidth/naturalHeight once the image has loaded — see init().
  let imgW = 0;
  let imgH = 0;
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOffsetStartX = 0;
  let dragOffsetStartY = 0;

  function getZoom(): number {
    return Number(zoomInput.value);
  }

  function getScale(): number {
    return baseScale * getZoom();
  }

  function clampOffsets(): void {
    const stageSize = stage.clientWidth || 1;
    const scale = getScale();
    const displayedW = imgW * scale;
    const displayedH = imgH * scale;
    const minX = Math.min(0, stageSize - displayedW);
    const minY = Math.min(0, stageSize - displayedH);
    offsetX = Math.min(0, Math.max(minX, offsetX));
    offsetY = Math.min(0, Math.max(minY, offsetY));
  }

  function centerImage(): void {
    const stageSize = stage.clientWidth || 1;
    const scale = getScale();
    offsetX = (stageSize - imgW * scale) / 2;
    offsetY = (stageSize - imgH * scale) / 2;
  }

  function applyTransform(): void {
    if (imgW === 0 || imgH === 0) return; // not loaded yet
    clampOffsets();
    const scale = getScale();
    img.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    img.style.width = `${imgW}px`;
    img.style.height = `${imgH}px`;
  }

  function recomputeBaseScale(): void {
    if (imgW === 0 || imgH === 0) return;
    const stageSize = stage.clientWidth || 1;
    baseScale = stageSize / Math.min(imgW, imgH);
  }

  function init(): void {
    // img.naturalWidth/naturalHeight are the browser's own authoritative
    // dimensions for whatever this <img> actually rendered — guaranteed to
    // match, unlike any width/height we might have been told separately.
    imgW = img.naturalWidth;
    imgH = img.naturalHeight;
    recomputeBaseScale();
    centerImage();
    applyTransform();
  }

  // Image may already be cached (decoded) — but wait for layout either way.
  if (img.complete && img.naturalWidth > 0) {
    requestAnimationFrame(init);
  } else {
    img.addEventListener('load', init, { once: true });
  }

  const resizeObserver = new ResizeObserver(() => {
    recomputeBaseScale();
    applyTransform();
  });
  resizeObserver.observe(stage);

  zoomInput.addEventListener('input', () => applyTransform());

  stage.addEventListener('pointerdown', (e) => {
    dragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragOffsetStartX = offsetX;
    dragOffsetStartY = offsetY;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    offsetX = dragOffsetStartX + (e.clientX - dragStartX);
    offsetY = dragOffsetStartY + (e.clientY - dragStartY);
    applyTransform();
  });
  const endDrag = () => {
    dragging = false;
  };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  applyBtn.addEventListener('click', () => {
    const scale = getScale();
    const stageSize = stage.clientWidth || 1;
    const crop: CropRegion = {
      x: -offsetX / scale,
      y: -offsetY / scale,
      size: stageSize / scale,
    };
    resizeObserver.disconnect();
    handlers.onApply(crop);
  });

  cancelBtn.addEventListener('click', () => {
    resizeObserver.disconnect();
    handlers.onCancel();
  });

  return root;
}
