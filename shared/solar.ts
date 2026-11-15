import type { Language } from './i18n';
import { languageLocale } from './i18n';
/** Shared presentation contract for solar forecasts. Models and units are NEVER combined. */
export interface SolarForecastModel {
  id:string; source:string; provider:string; model:string; provenance:'FORECAST';issued_at:string;
  valid_from:string|null;valid_until:string|null;occurrence_probability_percent:number|null;
  peak_proton_flux:number|null;peak_proton_flux_unit:string|null;
  proton_energy_min_mev:number|null;proton_energy_max_mev:number|null;
  event_start_at:string|null;event_peak_at:string|null;event_end_at:string|null;
}
export interface SolarForecastResponse {status:'available'|'no_forecast';models:SolarForecastModel[];}
const num=(value:number,language:Language)=>new Intl.NumberFormat(languageLocale[language],{maximumFractionDigits:2}).format(value);
export function formatSolarTime(value:string|null|undefined,language:Language='en'):string {
  if(!value)return '—';const d=new Date(value);if(Number.isNaN(d.getTime()))return '—';
  return `${new Intl.DateTimeFormat(languageLocale[language],{dateStyle:'short',timeStyle:'short',timeZone:'UTC'}).format(d)} UTC`;
}
export function formatSolarProbability(value:number|null|undefined,language:Language='en'):string {return value==null?'—':`${num(value,language)}%`;}
export function formatSolarFlux(value:number|null|undefined,unit:string|null|undefined,language:Language='en'):string {return value==null||!unit?'—':`${num(value,language)} ${unit}`;}
export function formatSolarEnergy(min:number|null|undefined,max:number|null|undefined,language:Language='en'):string {return min==null||max==null?'—':`${num(min,language)}–${num(max,language)} MeV`;}
export function formatSolarWindow(start:string|null|undefined,end:string|null|undefined,language:Language='en'):string {return !start||!end?'—':`${formatSolarTime(start,language)} → ${formatSolarTime(end,language)}`;}
