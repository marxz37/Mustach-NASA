/** Contrato de apresentação compartilhado pelos dois front-ends. Cada item é um modelo independente. */
export interface SolarForecastModel {
  id: string;
  source: string;
  provider: string;
  model: string;
  provenance: 'FORECAST';
  issued_at: string;
  valid_from: string | null;
  valid_until: string | null;
  occurrence_probability_percent: number | null;
  peak_proton_flux: number | null;
  peak_proton_flux_unit: string | null;
  proton_energy_min_mev: number | null;
  proton_energy_max_mev: number | null;
  event_start_at: string | null;
  event_peak_at: string | null;
  event_end_at: string | null;
}

export interface SolarForecastResponse {
  status: 'available' | 'no_forecast';
  models: SolarForecastModel[];
}

const numberFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

export function formatSolarTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' }).format(date)} UTC`;
}

export function formatSolarProbability(value: number | null | undefined): string {
  return value == null ? '—' : `${numberFormat.format(value)}%`;
}

export function formatSolarFlux(value: number | null | undefined, unit: string | null | undefined): string {
  return value == null || !unit ? '—' : `${numberFormat.format(value)} ${unit}`;
}

export function formatSolarEnergy(min: number | null | undefined, max: number | null | undefined): string {
  if (min == null || max == null) return '—';
  return `${numberFormat.format(min)}–${numberFormat.format(max)} MeV`;
}

export function formatSolarWindow(start: string | null | undefined, end: string | null | undefined): string {
  if (!start || !end) return '—';
  return `${formatSolarTime(start)} → ${formatSolarTime(end)}`;
}
