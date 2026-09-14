/**
 * All crop presets are 1:1 — they're just labeled entry points into the same
 * square-crop flow, not separate algorithms or aspect ratios.
 */
export const CROP_PRESETS = ['Profile Picture', 'Social Profile', 'ID Photo'] as const;

export type CropPreset = (typeof CROP_PRESETS)[number];
