import type {SimulationState} from '@shared/simulation';
import type {Language} from '@shared/i18n';
import {isForecastCurrent,formatSolarProbability,formatSolarFlux} from '@shared/solar';

export interface SolarNoticeRecord {id:string;kind:'OFFICIAL'|'FORECAST'|'SIMULATED';source:string;issued_at:string;valid_until:string;code:'proton_observed'|'proton_warning'|'forecast_attention';detail:string;provenance:'OBSERVED'|'FORECAST'|'SIMULATED';}

/** Uses the shared demo clock, not wall-clock time. No personal or clinical classification. */
export function simulatedSolarNotices(simulation:SimulationState|undefined,language:Language):SolarNoticeRecord[]{
  if(!simulation||!['predicted','ongoing'].includes(simulation.scenario)||!isForecastCurrent(simulation.solar_model,simulation.now))return [];
  const model=simulation.solar_model;
  return [{id:model.id,kind:'SIMULATED',source:model.provider,issued_at:model.issued_at,valid_until:model.valid_until!,
    code:simulation.scenario==='ongoing'?'proton_observed':'forecast_attention',provenance:'SIMULATED',
    detail:`${model.model} · ${formatSolarProbability(model.occurrence_probability_percent,language)} · ${formatSolarFlux(model.peak_proton_flux,model.peak_proton_flux_unit,language)}`}];
}
/** Mark every arrival, even with haptics off, before attempting the optional hardware API. */
export function consumeArrival(id:string,seen:Set<string>,acknowledged:Set<string>):boolean {
  if(seen.has(id)||acknowledged.has(id))return false;
  seen.add(id);return true;
}
export const noticeCopy={
  en:{title:'SEP notice',OFFICIAL:'Official notice',FORECAST:'Forecast · demo criterion',SIMULATED:'SIMULATED',proton_observed:'Proton event reported',proton_warning:'Proton warning',forecast_attention:'SEP forecast for review',acknowledge:'Acknowledge / silence',vibration:'Experimental vibration',on:'On',off:'Off',unsupported:'Visual notice only · vibration unsupported',denied:'Vibration not accepted · visual notice remains',experimental:'Web experiment · no physical watch compatibility claimed',offline:'Solar notices unavailable · local API offline'},
  pt:{title:'Aviso SEP',OFFICIAL:'Aviso oficial',FORECAST:'Previsão · critério demonstrativo',SIMULATED:'SIMULADO',proton_observed:'Evento de prótons registrado',proton_warning:'Aviso de prótons',forecast_attention:'Previsão SEP para revisão',acknowledge:'Reconhecer / silenciar',vibration:'Vibração experimental',on:'Ativada',off:'Desativada',unsupported:'Aviso visual · vibração não suportada',denied:'Vibração não aceita · aviso visual mantido',experimental:'Experimento web · sem alegar compatibilidade com relógio físico',offline:'Avisos solares indisponíveis · API local offline'},
  es:{title:'Aviso SEP',OFFICIAL:'Aviso oficial',FORECAST:'Previsión · criterio demostrativo',SIMULATED:'SIMULADO',proton_observed:'Evento de protones registrado',proton_warning:'Aviso de protones',forecast_attention:'Previsión SEP para revisión',acknowledge:'Reconocer / silenciar',vibration:'Vibración experimental',on:'Activada',off:'Desactivada',unsupported:'Aviso visual · vibración no compatible',denied:'Vibración no aceptada · aviso visual conservado',experimental:'Experimento web · sin afirmar compatibilidad con reloj físico',offline:'Avisos solares no disponibles · API local offline'},
};
