/**
 * ONLY for fictional UI fixtures. These thresholds have NO radiological or
 * clinical meaning and must never classify NASA/NOAA or personal-dosimeter data.
 */
export type DemoBand = 'baseline' | 'attention' | 'high' | 'unknown';

export function demonstrationBand(rate: number | null, scale = 1): DemoBand {
  if (rate === null || !Number.isFinite(rate) || rate < 0) return 'unknown';
  const index = rate * scale;
  if (index < 0.45) return 'baseline';
  if (index < 0.58) return 'attention';
  return 'high';
}

export const demoRegionScales = {
  head: 1.14,
  torso: 1.19,
  abdomen: 1.03,
  arms: 0.91,
  legs: 0.86,
} as const;
