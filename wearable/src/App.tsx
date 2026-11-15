import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Heart, Info, Languages, Sun, Wifi, WifiOff } from 'lucide-react';
import { formatSolarEnergy, formatSolarFlux, formatSolarProbability, formatSolarTime } from '@shared/solar';
import { translate, formattedClock, languageNames, type Language, type TranslationKey } from '@shared/i18n';
import { demoEquivalentRate, demoSolarModel } from '@shared/demo';
import { demoCopy } from '@shared/demoCopy';
import { getSolarForecast, getWearableStatus, sendWearableHeartbeat } from './services/api';

type Screen='health'|'solar';
function defaultLanguage():Language{try{const x=localStorage.getItem('mustach-language');return x==='pt'||x==='es'?x:'en';}catch{return 'en';}}
function statusTone(rate:number|null){
  if(rate===null) return 'unknown' as const;
  if(rate < .5) return 'normal' as const;
  if(rate < .62) return 'attention' as const;
  return 'danger' as const;
}
/** Standalone WEB watch preview. Polling does not mean a physical device is paired. */
export default function App(){
  const [screen,setScreen]=useState<Screen>('health');
  const [language,setLanguage]=useState<Language>(defaultLanguage);
  const [demo,setDemo]=useState(true);
  const [now,setNow]=useState(Date.now());
  const dragStart=useRef<number|null>(null);
  const t=(key:TranslationKey)=>translate(language,key);
  const {data:wearable,isError:wearableError,dataUpdatedAt}=useQuery({queryKey:['wearable-status'],queryFn:getWearableStatus,refetchInterval:30_000,retry:1});
  const {data:forecast,isError:forecastError}=useQuery({queryKey:['solar-forecast'],queryFn:getSolarForecast,refetchInterval:60_000,retry:1});
  const [lastHeartbeat,setLastHeartbeat]=useState<number|null>(null);
  useEffect(()=>{ const timer=window.setInterval(()=>setNow(Date.now()),2000); return ()=>window.clearInterval(timer); },[]);
  useEffect(()=>{
    let alive=true;
    const ping=()=>{void sendWearableHeartbeat().then(()=>{if(alive)setLastHeartbeat(Date.now());}).catch(()=>{/* status remains offline */});};
    ping();const timer=window.setInterval(ping,30_000);
    return ()=>{alive=false;window.clearInterval(timer);};
  },[]);
  const model=demo?demoSolarModel(now):forecast?.models[0];
  const currentRate=demo?demoEquivalentRate(now):null;
  const accumulatedDose=demo&&currentRate!==null?(currentRate*24/1000):wearable?.accumulated_dose_msv??null;
  const tone=statusTone(currentRate);
  const statusLabel = tone==='normal'?t('statusNominal'):tone==='attention'?t('statusAttention'):tone==='danger'?t('statusHighExposure'):t('watchNoAssessment');
  const statusDesc = tone==='normal'?t('watchStatusNormalDesc'):tone==='attention'?t('watchStatusAttentionDesc'):tone==='danger'?t('watchStatusDangerDesc'):t('watchWaiting');
  const move=(direction:'prev'|'next')=>setScreen(direction==='next'?'solar':'health');
  const handlePointerEnd=(x:number)=>{if(dragStart.current===null)return;const dx=x-dragStart.current;dragStart.current=null;if(Math.abs(dx)>=50)move(dx<0?'next':'prev');};
  const changeLanguage=(value:Language)=>{setLanguage(value);try{localStorage.setItem('mustach-language',value);}catch{/* optional */}};
  return <div className="wearable-shell">
    <header className="wearable-header">
      <div className="watch-header-row"><span className="section-kicker"><span className="pulse-dot"/> MUSTACH WEARABLE / {t('wearableLabel')}</span>
        <label className="watch-language"><Languages size={15}/><span className="sr-only">{t('language')}</span><select aria-label={t('language')} value={language} onChange={event=>changeLanguage(event.target.value as Language)}>{(Object.keys(languageNames) as Language[]).map(key=><option key={key} value={key}>{languageNames[key]}</option>)}</select></label></div>
      <div className="wearable-demo-toolbar">
        <label className="watch-choice">{t('dataMode')}<select value={demo?'simulation':'none'} onChange={event=>setDemo(event.target.value==='simulation')}><option value="simulation">{t('simulation')}</option><option value="none">{t('noData')}</option></select></label>
        {demo&&<span className="watch-demo-chip">{demoCopy(language,'demo')}</span>}
      </div>
      <h1>{t('watchTitle')}</h1><p>{t('watchCaption')}</p>
      <p className="watch-sync"><span>{wearableError?<WifiOff size={13}/>:<Wifi size={13}/>} {wearableError?t('apiOffline'):t('apiOnline')}</span><span>{t('lastSync')}: {formattedClock(lastHeartbeat??dataUpdatedAt,language,true)}</span><span>{t('deviceNote')}</span></p>
    </header>
    <main className="watch-exhibit">
      <div className="watch-decoration watch-decoration--one" aria-hidden="true"/><div className="watch-decoration watch-decoration--two" aria-hidden="true"/>
      <div className="watch-device" aria-label={t('watchTitle')}><div className="watch-strap watch-strap--top" aria-hidden="true"/><div className="watch-case">
        <div className="watch-screen" role="region" aria-roledescription="carousel" aria-label={`${t('screens')}: ${screen==='health'?t('watchPageHealth'):t('watchPageSolar')}`} tabIndex={0}
          onPointerDown={event=>{dragStart.current=event.clientX;if(event.pointerType!=='mouse')event.currentTarget.setPointerCapture(event.pointerId);}}
          onPointerUp={event=>handlePointerEnd(event.clientX)} onPointerCancel={()=>{dragStart.current=null;}}
          onKeyDown={event=>{if(event.key==='ArrowRight'){event.preventDefault();move('next');}if(event.key==='ArrowLeft'){event.preventDefault();move('prev');}}}>
          <div className="watch-screen-top"><span className="watch-wordmark">M<span>✳</span></span><span className="watch-signal"><span className={`watch-signal-dot watch-signal-dot--${tone}`}/> {demo?demoCopy(language,'demoShort'):wearable?.paired?t('apiOnline'):t('notPaired')}</span></div>
          {screen==='health'?<div className="watch-center" key="health"><div className={`watch-main-icon watch-main-icon--${tone}`}><Heart size={54} strokeWidth={1.25}/></div><div className="watch-eyebrow">{t('watchHealth')}</div><strong className="watch-main-title">{statusLabel}</strong><p className="watch-main-desc">{demo?statusDesc:t('watchWaiting')}</p><div className="watch-health-stats"><div><span>{t('latestRate')}</span><strong>{currentRate===null?'—':currentRate.toFixed(3)}<small> µSv/h</small></strong></div><div><span>{t('watchExposureState')}</span><strong>{statusLabel}</strong></div></div></div>
          :<div className="watch-center watch-center--solar" key="solar"><div className="watch-eyebrow"><Sun size={12}/>{t('sepForecast')} · {demo?demoCopy(language,'demoShort'):model?.provenance??t('noData')}</div><strong className="watch-solar-title">{model?model.model:t('noForecast')}</strong><p className="watch-solar-source">{demo?demoCopy(language,'solarLast'):model?`${model.provider} · ${model.source}`:forecastError?t('apiOffline'):t('solarModels')}</p><div className="watch-solar-summary"><div><span>{t('latestRate')}</span><strong>{currentRate===null?'—':`${currentRate.toFixed(3)} µSv/h`}</strong><small>{t('watchSolarDetail')}</small></div><div><span>A / {t('occurrence').toUpperCase()}</span><strong>{formatSolarProbability(model?.occurrence_probability_percent,language)}</strong><small>{t('occurrenceDesc')}</small></div><div><span>B / {t('intensity').toUpperCase()}</span><strong>{formatSolarFlux(model?.peak_proton_flux,model?.peak_proton_flux_unit,language)}</strong><small>{t('energy')} {formatSolarEnergy(model?.proton_energy_min_mev,model?.proton_energy_max_mev,language)}</small></div><div><span>C / {t('evolution').toUpperCase()}</span><strong>{formatSolarTime(model?.event_peak_at,language)}</strong><small>{t('peak')} · {t('onset')} {formatSolarTime(model?.event_start_at,language)}</small></div><div><span>{t('accumulated')} · {t('daily')}</span><strong>{accumulatedDose===null?'—':`${accumulatedDose.toFixed(3)} mSv`}</strong><small>{t('fluxNotDose')}</small></div></div>{!demo&&forecast&&forecast.models.length>1&&<small className="watch-model-note">1 / {forecast.models.length} {t('model')}</small>}</div>}
          <div className="watch-screen-footer"><div className="watch-dots" aria-label={t('screens')}><span className={screen==='health'?'active':''}/><span className={screen==='solar'?'active':''}/></div><small>{screen==='health'?t('swipeSolar'):t('swipeHealth')}</small></div>
        </div><div className="watch-crown" aria-hidden="true"/></div><div className="watch-strap watch-strap--bottom" aria-hidden="true"/></div>
      <div className="watch-controls" role="group" aria-label={t('screens')}><button className="watch-nav-button" type="button" onClick={()=>move('prev')} disabled={screen==='health'} aria-label={t('watchPageHealth')}><ArrowLeft size={18}/></button><span>{screen==='health'?'01 / 02':'02 / 02'} — {screen==='health'?t('watchPageHealth'):t('watchPageSolar')}</span><button className="watch-nav-button" type="button" onClick={()=>move('next')} disabled={screen==='solar'} aria-label={t('watchPageSolar')}><ArrowRight size={18}/></button></div>
    </main>
    <footer className="wearable-footer"><p><Info size={15}/>{demo?demoCopy(language,'demoNote'):t('mockNoDevice')}</p><span>{t('fluxNotDose')}</span></footer>
  </div>;
}
