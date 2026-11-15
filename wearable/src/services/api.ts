import type { SolarForecastResponse } from '@shared/solar';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as T;
}

export interface WearableStatus {
  paired: boolean;
  health_status: 'not_evaluated';
  heart_rate_bpm: number | null;
  accumulated_dose_msv: number | null;
  last_health_measurement: string | null;
  solar_status: 'no_forecast';
  last_solar_update: string | null;
}

export const getWearableStatus = () => request<WearableStatus>('/api/v1/wearable/status');
export const getSolarForecast = () => request<SolarForecastResponse>('/api/v1/solar/forecast');

export async function sendWearableHeartbeat():Promise<void> {
  const response=await fetch(`${API_BASE}/api/v1/wearable/heartbeat`,{method:'POST',headers:{Accept:'application/json'}});
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}
