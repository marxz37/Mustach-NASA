export type DataProvenance = 'OBSERVED' | 'FORECAST' | 'SIMULATED';
export type RadiationQuantity = 'absorbed_dose_rate' | 'dose_equivalent_rate' | 'particle_flux';
export type Region = 'cabeca' | 'torax' | 'abdomen' | 'bracos' | 'pernas';
export type { RadiologicalMeasurement as Measurement } from '@shared/radiation';
export interface ApiStatus { api: 'online'; mode: 'empty_prototype'|'scientific_data'; measurements: number; last_update: null | string; }
export interface SourceInfo { id: string; name: string; category: string; connected: boolean; description: string; last_attempt_at?:string|null; error?:string|null; }
