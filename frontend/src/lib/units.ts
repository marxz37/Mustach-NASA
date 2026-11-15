/** Integra uma série de taxas de dose equivalente (µSv/h).
 * Valores precisam vir da mesma grandeza dosimétrica e de uma série compatível.
 * Os intervalos devem ter duração positiva e amostragem válida.
 */
export function integrateEquivalentDose(samples: ReadonlyArray<{ rateMicrosievertsPerHour: number; durationHours: number }>): number {
  return samples.reduce((sum, sample) => {
    if (!Number.isFinite(sample.rateMicrosievertsPerHour) || sample.rateMicrosievertsPerHour < 0 || !Number.isFinite(sample.durationHours) || sample.durationHours < 0) {
      throw new RangeError('Dose e duração devem ser finitas e não negativas.');
    }
    return sum + sample.rateMicrosievertsPerHour * sample.durationHours;
  }, 0);
}
