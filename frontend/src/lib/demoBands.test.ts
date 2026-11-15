import { describe, expect, it } from 'vitest';
import { demoRegionScales, demonstrationBand } from '@shared/demoBands';

describe('demonstration-only map bands', () => {
  it('handles missing and invalid readings without treating them as safe', () => {
    expect(demonstrationBand(null)).toBe('unknown');
    expect(demonstrationBand(Number.NaN)).toBe('unknown');
    expect(demonstrationBand(-1)).toBe('unknown');
  });
  it('reacts to a sequence of synthetic rates', () => {
    expect(demonstrationBand(.3)).toBe('baseline');
    expect(demonstrationBand(.5)).toBe('attention');
    expect(demonstrationBand(.65)).toBe('high');
  });
  it('can visualize different fictional regions without claiming organ dose', () => {
    expect(demonstrationBand(.49, demoRegionScales.head)).toBe('attention');
    expect(demonstrationBand(.49, demoRegionScales.legs)).toBe('baseline');
  });
});
