import { describe, expect, it } from 'vitest';
import { integrateEquivalentDose } from './units';
describe('dose equivalente', () => {
  it('retorna zero para uma série vazia', () => expect(integrateEquivalentDose([])).toBe(0));
  it('integra apenas taxas e durações explicitadas', () => expect(integrateEquivalentDose([{ rateMicrosievertsPerHour: 2, durationHours: 1.5 }])).toBe(3));
  it('recusa valores negativos', () => expect(() => integrateEquivalentDose([{ rateMicrosievertsPerHour: -1, durationHours: 1 }])).toThrow());
});
