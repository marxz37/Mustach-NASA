import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowUpRight, Clock3, Sun, Zap } from 'lucide-react';
import { getSolarForecast } from '@/services/api';
import { useApp } from '@/context/AppContext';
import { formatSolarEnergy, formatSolarFlux, formatSolarProbability, formatSolarTime, formatSolarWindow } from '@shared/solar';

export function SolarActivityPanel(){
  const [selectedModelId,setSelectedModelId]=useState<string|null>(null);
  const {t,language}=useApp();
  const {data,isError}=useQuery({queryKey:['solar-forecast'],queryFn:getSolarForecast,refetchInterval:60_000,retry:1});
  const model=data?.models.find(item=>item.id===selectedModelId)??data?.models[0];
  const unavailable=t('waitingData');
  return <section className="quiet-panel solar-section" aria-labelledby="solar-title">
    <div className="panel-heading"><Sun size={19}/><h2 id="solar-title">{t('solar')}</h2><span>{t('sepForecast')}</span></div>
    <div className="solar-lead"><div><span className="panel-kicker">SEP / CCMC</span><strong>{model?model.model:t('noForecast')}</strong><p>{model?`${model.provider} · ${model.source}`:t('solarModels')}</p></div>
      {data&&data.models.length>1&&<label className="solar-model-picker">{t('model')}<select value={model?.id??''} onChange={e=>setSelectedModelId(e.target.value)} aria-label={t('model')}>{data.models.map(item=><option key={item.id} value={item.id}>{item.provider} / {item.model}</option>)}</select></label>}
    </div>
    <div className="solar-categories">
      <div className="solar-category" aria-label={`A — ${t('occurrence')}`}><Activity size={18} strokeWidth={1.5}/><div><h3>A <span>—</span> {t('occurrence')}</h3><p>{t('occurrenceDesc')}</p><strong>{formatSolarProbability(model?.occurrence_probability_percent,language)}</strong><dl><div><dt>{t('window')}</dt><dd>{formatSolarWindow(model?.valid_from,model?.valid_until,language)}</dd></div><div><dt>{t('model')}</dt><dd>{model?.model??unavailable}</dd></div><div><dt>{t('updated')}</dt><dd>{formatSolarTime(model?.issued_at,language)}</dd></div></dl></div></div>
      <div className="solar-category" aria-label={`B — ${t('intensity')}`}><Zap size={18} strokeWidth={1.5}/><div><h3>B <span>—</span> {t('intensity')}</h3><p>{t('intensityDesc')}</p><strong>{formatSolarFlux(model?.peak_proton_flux,model?.peak_proton_flux_unit,language)}</strong><dl><div><dt>{t('energy')}</dt><dd>{formatSolarEnergy(model?.proton_energy_min_mev,model?.proton_energy_max_mev,language)}</dd></div><div><dt>{t('unit')}</dt><dd>{model?.peak_proton_flux_unit??unavailable}</dd></div><div><dt>{t('model')}</dt><dd>{model?.model??unavailable}</dd></div></dl></div></div>
      <div className="solar-category" aria-label={`C — ${t('evolution')}`}><Clock3 size={18} strokeWidth={1.5}/><div><h3>C <span>—</span> {t('evolution')}</h3><p>{t('evolutionDesc')}</p><dl><div><dt>{t('onset')}</dt><dd>{formatSolarTime(model?.event_start_at,language)}</dd></div><div><dt>{t('peak')}</dt><dd>{formatSolarTime(model?.event_peak_at,language)}</dd></div><div><dt>{t('end')}</dt><dd>{formatSolarTime(model?.event_end_at,language)}</dd></div><div><dt>{t('window')}</dt><dd>{formatSolarWindow(model?.valid_from,model?.valid_until,language)}</dd></div><div><dt>{t('issued')}</dt><dd>{formatSolarTime(model?.issued_at,language)}</dd></div></dl></div></div>
    </div>
    <div className="panel-foot"><span>{isError?t('apiOffline'):model?`${t('source')}: ${model.source} · ${model.provenance}`:t('readoutNotSame')}</span><span>{t('fluxNotDose')} <ArrowUpRight size={13}/></span></div>
  </section>;
}
