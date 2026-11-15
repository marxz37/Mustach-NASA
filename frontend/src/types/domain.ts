export type DataProvenance = 'OBSERVED' | 'FORECAST' | 'SIMULATED';
export type RadiationQuantity = 'absorbed_dose_rate' | 'dose_equivalent_rate' | 'particle_flux';
export type Region = 'cabeca' | 'torax' | 'abdomen' | 'bracos' | 'pernas';
export interface Measurement {
  id: string;
  source: string;
  provenance: DataProvenance;
  instrument: string;
  measured_at: string;
  quantity: RadiationQuantity;
  value: number;
  unit: string;
  mission: string;
  region?: Region | null;
}
export interface ApiStatus { api: 'online'; mode: 'empty_prototype'; measurements: number; last_update: null | string; }
export interface SourceInfo { id: string; name: string; category: string; connected: boolean; description: string; }
