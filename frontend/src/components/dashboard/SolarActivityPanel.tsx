import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { Activity, Clock3, Sun, Zap } from 'lucide-react';
import { getScientificMeasurements, getSolarForecast, getSolarForecastHistory } from '@/services/api';
import { useApp } from '@/context/AppContext';
import { formatSolarEnergy, formatSolarFlux, formatSolarProbability, formatSolarTime, formatSolarWindow, isForecastCurrent } from '@shared/solar';

export function SolarActivityPanel(){
  const [selectedModelId,setSelectedModelId]=useState<string|null>(null);
  const [showArchive,setShowArchive]=useState(false);
  const [channel,setChannel]=useState('>=10 MeV');
  const {t,language,mode,now,simulation,simulationOffline}=useApp();
  const {data,isError}=useQuery({queryKey:['solar-forecast'],queryFn:getSolarForecast,refetchInterval:60_000,retry:1});
  const history=useQuery({queryKey:['solar-forecast-history'],queryFn:getSolarForecastHistory,enabled:mode==='real',refetchInterval:60_000,retry:1});
  const goes=useQuery({queryKey:['goes-observed',Math.floor(now/300_000)],
    queryFn:()=>getScientificMeasurements({source:'NOAA GOES/SWPC',quantity:'integral_proton_flux',start:new Date(now-21_600_000).toISOString(),limit:2000}),
    enabled:mode==='real',retry:1});
  const currentModels=data?.models.filter(model=>isForecastCurrent(model,now));
  const current=mode==='real'&&!isError?(currentModels?.find(item=>item.id===selectedModelId)??currentModels?.[0]):undefined;
  const archived=!history.isError?history.data?.find(item=>item.valid_until&&Date.parse(item.valid_until)<now):undefined;
  const model=mode==='simulation'?(simulationOffline?undefined:simulation?.solar_model):mode==='real'&&!isError?(showArchive?archived:current):undefined;
  const channelPoints=(goes.data??[]).filter(item=>item.details?.energy_channel===channel).sort((a,b)=>Date.parse(a.measured_at)-Date.parse(b.measured_at));
  const goesPoints=channelPoints.filter(item=>item.instrument===channelPoints.at(-1)?.instrument);
  const goesOption:EChartsOption={animation:false,grid:{left:52,right:15,top:15,bottom:32},
    tooltip:{trigger:'axis'},xAxis:{type:'time',axisLabel:{color:'#89abc4'},axisLine:{lineStyle:{color:'#2c5775'}}},
    yAxis:{type:'value',name:'pfu',nameTextStyle:{color:'#89abc4'},axisLabel:{color:'#89abc4'},splitLine:{lineStyle:{color:'#17364c',type:'dashed'}}},
    series:[{type:'line',data:goesPoints.map(item=>[Date.parse(item.measured_at),item.value]),showSymbol:false,lineStyle:{color:'#70e0fa',width:2}}]};
  return <section className="quiet-panel solar-section" aria-labelledby="solar-title">
    <div className="panel-heading"><Sun size={19}/><h2 id="solar-title">{t('solar')}</h2><span>A / B / C</span></div>
    <div className="solar-lead"><div><span className="panel-kicker">{showArchive?'ARQUIVO EXPIRADO':t('sepForecast')}</span><strong>{model?.model??t('noForecast')}</strong><p>{model?model.provider:isError?t('apiOffline'):t('solarModels')}</p></div>
      {mode==='real'&&!showArchive&&data&&data.models.length>1&&<label className="solar-model-picker">{t('model')}<select value={model?.id??''} onChange={e=>setSelectedModelId(e.target.value)} aria-label={t('model')}>{data.models.map(item=><option key={item.id} value={item.id}>{item.provider} / {item.model}{item.forecast_horizon_day?` · ${item.forecast_horizon_day}/3`:''}{item.proton_energy_min_mev?` · ${item.proton_energy_min_mev} MeV`:''}</option>)}</select></label>}
    </div>
    {mode==='real'&&archived&&<button type="button" className="solar-archive-toggle" onClick={()=>setShowArchive(value=>!value)}>{showArchive?'Voltar à previsão vigente':'Ver última previsão arquivada'}</button>}
    {showArchive&&<p className="panel-explain">Previsão expirada: consulta histórica, não representa as condições atuais.</p>}
    <div className="solar-categories solar-categories--concise">
      <div className="solar-category"><Activity size={18}/><div><h3>A / {t('occurrence')}</h3><strong>{formatSolarProbability(model?.occurrence_probability_percent,language)}</strong><p>{t('occurrenceDesc')}</p></div></div>
      <div className="solar-category"><Zap size={18}/><div><h3>B / {t('intensity')}</h3><strong>{formatSolarFlux(model?.peak_proton_flux,model?.peak_proton_flux_unit,language)}</strong><p>{t('energy')}: {formatSolarEnergy(model?.proton_energy_min_mev,model?.proton_energy_max_mev,language)}</p></div></div>
      <div className="solar-category"><Clock3 size={18}/><div><h3>C / {t('evolution')}</h3><strong>{t('estimatedPeak')}: {formatSolarTime(model?.event_peak_at,language)}</strong><p>{t('onset')}: {formatSolarTime(model?.event_start_at,language)} · {t('end')}: {formatSolarTime(model?.event_end_at,language)}</p></div></div>
    </div>
    <div className="solar-technical"><span>{t('window')}: {formatSolarWindow(model?.valid_from,model?.valid_until,language)}</span><span>{t('issued')}: {formatSolarTime(model?.issued_at,language)}</span></div>
    {model?.threshold&&<p className="panel-explain">{model.threshold} · {model.forecast_horizon_day ? `dia ${model.forecast_horizon_day}/3` : ''}</p>}
    {model?.location&&<p className="panel-explain">Local da previsão: {model.location}. As grandezas de modelos diferentes não são combinadas.</p>}
    {mode==='real'&&<div className="solar-observations"><div className="solar-observations-heading"><strong>NOAA GOES · prótons observados</strong><label>Canal <select value={channel} onChange={event=>setChannel(event.target.value)}><option value=">=10 MeV">≥10 MeV</option><option value=">=50 MeV">≥50 MeV</option><option value=">=100 MeV">≥100 MeV</option></select></label></div>
      {goes.isError?<p className="panel-explain">API local indisponível; não há leitura atual confirmada.</p>:goesPoints.length?<><ReactECharts option={goesOption} style={{height:170,width:'100%'}} notMerge lazyUpdate/><p className="panel-explain">{goesPoints.length} pontos · fluxo integral em pfu · GOES-{goesPoints.at(-1)?.mission.replace('GOES-','')} · última observação {goesPoints.at(-1)?.measured_at}. Fluxo não é dose pessoal.</p></>:<p className="panel-explain">Aguardando observações GOES armazenadas na API local.</p>}</div>}
    <div className="panel-foot"><span>{t('fluxNotDose')}</span><span>{model?.source??t('noForecast')}</span></div>
  </section>;
}
