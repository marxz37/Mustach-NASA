import type { ApiStatus, Measurement, SourceInfo } from '@/types/domain';
import type { SolarForecastResponse } from '@shared/solar';
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as T;
}
export const getApiStatus = () => request<ApiStatus>('/api/v1/status');
export const getMeasurements = () => request<Measurement[]>('/api/v1/measurements');
export function getScientificMeasurements(filters: {source:string;quantity?:string;start?:string;end?:string;limit?:number}) {
  const params = new URLSearchParams();
  for (const [key,value] of Object.entries(filters)) if(value!==undefined)params.set(key,String(value));
  return request<Measurement[]>(`/api/v1/measurements?${params}`);
}
export const getSources = () => request<SourceInfo[]>('/api/v1/sources');
export const getSolarForecast = () => request<SolarForecastResponse>('/api/v1/solar/forecast');
export const getSolarForecastHistory = () => request<SolarForecastResponse['models']>('/api/v1/solar/forecast/history');
export interface IngestionRun {id:number;source:string;attempted_at:string;status:'OK'|'ERROR';records_added:number;error:string|null;}
export const getIngestionRuns = () => request<IngestionRun[]>('/api/v1/science/ingestion-runs');
export interface SolarAlert {id:string;source:string;issued_at:string;kind:string;message:string;}
export const getSolarAlerts = () => request<SolarAlert[]>('/api/v1/solar/alerts');

export interface WearableConnection { paired: false; preview_active: boolean; last_seen_at: string | null; }
export const getWearableConnection = () => request<WearableConnection>('/api/v1/wearable/connection');
