import { describe, expect, it } from 'vitest';
import { formatSolarEnergy, formatSolarFlux, formatSolarProbability, formatSolarTime } from '@shared/solar';

describe('apresentação de previsão solar', () => {
  it('mantém campos vazios sem inventar previsões', () => {
    expect(formatSolarProbability(null)).toBe('—');
    expect(formatSolarFlux(null, null)).toBe('—');
    expect(formatSolarEnergy(null, null)).toBe('—');
    expect(formatSolarTime(null)).toBe('—');
  });

  it('não apresenta fluxo físico sem a unidade informada pelo modelo', () => {
    expect(formatSolarFlux(42, null)).toBe('—');
  });

  it('não arredonda fluxos diferenciais pequenos para zero', () => {
    expect(formatSolarFlux(0.000068176, 'MeV^-1*s^-1*cm^-2*sr^-1')).toContain('0.00006818');
  });
});
