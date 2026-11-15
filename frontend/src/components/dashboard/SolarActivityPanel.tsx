import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Clock3, Sun, Zap } from 'lucide-react';
import { getSolarForecast } from '@/services/api';
import { useApp } from '@/context/AppContext';
import { demoSolarModel } from '@shared/demo';
import { formatSolarEnergy, formatSolarFlux, formatSolarProbability, formatSolarTime, formatSolarWindow } from '@shared/solar';

export function SolarActivityPanel(){
  const [selectedModelId,setSelectedModelId]=useState<string|null>(null);
  const {t,language,mode,now}=useApp();
  const {data,isError}=useQuery({queryKey:['solar-forecast'],queryFn:getSolarForecast,refetchInterval:60_000,retry:1});
  const model=mode==='simulation'?demoSolarModel(now):(mode==='real'?(data?.models.find(item=>item.id===selectedModelId)??data?.models[0]):undefined);
  return <section className="quiet-panel solar-section" aria-labelledby="solar-title">
    <div className="panel-heading"><Sun size={19}/><h2 id="solar-title">{t('solar')}</h2><span>A / B / C</span></div>
    <div className="solar-lead"><div><span className="panel-kicker">{t('sepForecast')}</span><strong>{model?.model??t('noForecast')}</strong><p>{model?model.provider:isError?t('apiOffline'):t('solarModels')}</p></div>
      {mode==='real'&&data&&data.models.length>1&&<label className="solar-model-picker">{t('model')}<select value={model?.id??''} onChange={e=>setSelectedModelId(e.target.value)} aria-label={t('model')}>{data.models.map(item=><option key={item.id} value={item.id}>{item.provider} / {item.model}</option>)}</select></label>}
    </div>
    <div className="solar-categories solar-categories--concise">
      <div className="solar-category"><Activity size={18}/><div><h3>A / {t('occurrence')}</h3><strong>{formatSolarProbability(model?.occurrence_probability_percent,language)}</strong><p>{t('occurrenceDesc')}</p></div></div>
      <div className="solar-category"><Zap size={18}/><div><h3>B / {t('intensity')}</h3><strong>{formatSolarFlux(model?.peak_proton_flux,model?.peak_proton_flux_unit,language)}</strong><p>{t('energy')}: {formatSolarEnergy(model?.proton_energy_min_mev,model?.proton_energy_max_mev,language)}</p></div></div>
      <div className="solar-category"><Clock3 size={18}/><div><h3>C / {t('evolution')}</h3><strong>{t('peak')}: {formatSolarTime(model?.event_peak_at,language)}</strong><p>{t('onset')}: {formatSolarTime(model?.event_start_at,language)} · {t('end')}: {formatSolarTime(model?.event_end_at,language)}</p></div></div>
    </div>
    <div className="solar-technical"><span>{t('window')}: {formatSolarWindow(model?.valid_from,model?.valid_until,language)}</span><span>{t('issued')}: {formatSolarTime(model?.issued_at,language)}</span></div>
    <div className="panel-foot"><span>{t('fluxNotDose')}</span><span>{model?.source??t('noForecast')}</span></div>
  </section>;
}
