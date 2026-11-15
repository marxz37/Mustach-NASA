import type { ApiStatus, Measurement, SourceInfo } from '@/types/domain';
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as T;
}
export const getApiStatus = () => request<ApiStatus>('/api/v1/status');
export const getMeasurements = () => request<Measurement[]>('/api/v1/measurements');
export const getSources = () => request<SourceInfo[]>('/api/v1/sources');
