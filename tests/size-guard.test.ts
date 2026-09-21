import { describe, expect, it } from 'vitest';
import { enforceNoGrowth, qualityLadder } from '../src/conversion/size-guard';
import type { ConvertOptions, ConvertResult } from '../src/types';

const result = (bytes: number): ConvertResult => ({ blob: new Blob([new Uint8Array(bytes)]), width: 10, height: 10, byteLength: bytes });
const file = (bytes: number, type = 'image/jpeg') => new File([new Uint8Array(bytes)], 'a.jpg', { type });
const opts = (o: Partial<ConvertOptions>): ConvertOptions => ({ outputFormat: 'jpeg', quality: 90, crop: null, removeBackground: false, ...o });

describe('qualityLadder', () => {
  it('steps down by 15 and stops at the floor', () => expect(qualityLadder(90)).toEqual([75, 60, 45]));
  it('is empty at the floor', () => expect(qualityLadder(40)).toEqual([]));
});

describe('enforceNoGrowth', () => {
  it('keeps a result that is already smaller', async () => {
    const r = await enforceNoGrowth(file(1000), 'jpeg', opts({}), result(900), async () => result(1));
    expect(r.byteLength).toBe(900);
  });

  it('lowers quality until a lossy result fits', async () => {
    const sizes: Record<number, number> = { 75: 1200, 60: 950 };
    const r = await enforceNoGrowth(file(1000), 'jpeg', opts({}), result(1500), async (o) => result(sizes[o.quality] ?? 5000));
    expect(r.byteLength).toBe(950);
  });

  it('returns the original bytes for a same-format re-save that cannot get smaller', async () => {
    const r = await enforceNoGrowth(file(1000), 'jpeg', opts({}), result(1500), async () => result(1400));
    expect(r.byteLength).toBe(1000);
  });

  it('does not return the original when cropping', async () => {
    const r = await enforceNoGrowth(file(1000), 'jpeg', opts({ crop: { x: 0, y: 0, size: 5 } }), result(1500), async () => result(1400));
    expect(r.byteLength).toBe(1400);
  });

  it('keeps the smallest result for an unavoidable cross-format growth (JPG to PNG)', async () => {
    let calls = 0;
    const r = await enforceNoGrowth(file(1000), 'jpeg', opts({ outputFormat: 'png' }), result(5000), async () => (calls++, result(1)));
    expect(r.byteLength).toBe(5000);
    expect(calls).toBe(0);
  });

  it('returns the original for PNG to PNG that got bigger', async () => {
    const r = await enforceNoGrowth(file(1000, 'image/png'), 'png', opts({ outputFormat: 'png' }), result(1300), async () => result(1300));
    expect(r.byteLength).toBe(1000);
  });
});
