import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Heart, Info, Languages, Sun, Wifi, WifiOff } from 'lucide-react';
import { demonstrationBand } from '@shared/demoBands';
import { demoEquivalentRate, demoSolarModel } from '@shared/demo';
import { formatSolarFlux, formatSolarProbability } from '@shared/solar';
import { translate, formattedClock, languageNames, languageLocale, type Language, type TranslationKey } from '@shared/i18n';
import { getSolarForecast, getWearableStatus, sendWearableHeartbeat } from './services/api';
import { OperationalNotice } from './OperationalCheck';
import { getOperationalEvent } from '@shared/operational';

type Screen = 'health' | 'solar';
function defaultLanguage():Language{
  try{const value=localStorage.getItem('mustach-language');return value==='pt'||value==='es'?value:'en';}catch{return 'en';}
}
function shortTime(value:string|null|undefined,language:Language){
  if(!value)return '—';
  const d=new Date(value);
  return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat(languageLocale[language],{hour:'2-digit',minute:'2-digit',timeZone:'UTC',hour12:false}).format(d)+' UTC';
}
/** Independent watch UX. Data are synthetic in demo mode; no physical device paired. */
export default function App(){
  const [screen,setScreen]=useState<Screen>('health');
  const [language,setLanguage]=useState<Language>(defaultLanguage);
  const [demo,setDemo]=useState(true);
  const [now,setNow]=useState(Date.now());
  const dragStart=useRef<number|null>(null);
  const t=(key:TranslationKey)=>translate(language,key);
  const {isError:wearableError,isSuccess:wearableConnected}=useQuery({queryKey:['wearable-status'],queryFn:getWearableStatus,refetchInterval:30_000,retry:1});
  const {data:forecast,isError:forecastError}=useQuery({queryKey:['solar-forecast'],queryFn:getSolarForecast,refetchInterval:60_000,retry:1});
  const [lastHeartbeat,setLastHeartbeat]=useState<number|null>(null);
  const verification=useQuery({queryKey:['operational-event'],queryFn:()=>getOperationalEvent(import.meta.env.VITE_API_BASE_URL??''),enabled:demo,refetchInterval:3000,retry:1});
  const hasNotice=demo&&(verification.isError||!!verification.data?.assessment.requires_attention);
  useEffect(()=>{const interval=window.setInterval(()=>setNow(Date.now()),2000);return()=>window.clearInterval(interval);},[]);
  useEffect(()=>{
    let active=true;
    const ping=()=>{void sendWearableHeartbeat().then(()=>{if(active)setLastHeartbeat(Date.now());}).catch(()=>{/* offline remains visible */});};
    ping();const timer=window.setInterval(ping,30_000);
    return()=>{active=false;window.clearInterval(timer);};
  },[]);
  const rate=demo?demoEquivalentRate(now):null;
  const band=demo?demonstrationBand(rate):'unknown';
  const tone=band==='baseline'?'normal':band==='high'?'danger':band;
  const label=band==='baseline'?t('statusNominal'):band==='attention'?t('statusAttention'):band==='high'?t('statusHighExposure'):t('watchNoAssessment');
  const description=band==='baseline'?t('watchStatusNormalDesc'):band==='attention'?t('watchStatusAttentionDesc'):band==='high'?t('watchStatusDangerDesc'):t('watchWaiting');
  const model=demo?demoSolarModel(now):forecast?.models[0];
  const goto=(next:Screen)=>setScreen(next);
  const handlePointerEnd=(x:number)=>{if(dragStart.current===null)return;const dx=x-dragStart.current;dragStart.current=null;if(Math.abs(dx)>=50)goto(dx<0?'solar':'health');};
  const changeLanguage=(next:Language)=>{setLanguage(next);try{localStorage.setItem('mustach-language',next);}catch{/* local storage optional */}};
  return <div className="wearable-shell">
    <header className="wearable-header">
      <div className="watch-header-row"><span className="section-kicker"><span className="pulse-dot"/> MUSTACH WEARABLE / {t('wearableLabel')}</span>
        <label className="watch-language"><Languages size={15}/><span className="sr-only">{t('language')}</span><select aria-label={t('language')} value={language} onChange={e=>changeLanguage(e.target.value as Language)}>{(Object.keys(languageNames) as Language[]).map(key=><option key={key} value={key}>{languageNames[key]}</option>)}</select></label></div>
      <div className="wearable-demo-toolbar"><label className="watch-choice">{t('dataMode')}<select value={demo?'simulation':'none'} onChange={e=>setDemo(e.target.value==='simulation')}><option value="simulation">{t('simulation')}</option><option value="none">{t('noData')}</option></select></label></div>
      <h1>{t('watchTitle')}</h1><p>{demo?t('simulationNotice'):t('watchCaption')}</p>
      <p className="watch-sync"><span>{wearableConnected&&!wearableError?<Wifi size={13}/>:<WifiOff size={13}/>} {wearableConnected&&!wearableError?t('apiOnline'):t('apiOffline')}</span><span>{t('lastSync')}: {formattedClock(lastHeartbeat,language,true)}</span><span>{t('deviceNote')}</span></p>
    </header>
    <main className="watch-exhibit">
      <div className="watch-decoration watch-decoration--one" aria-hidden="true"/><div className="watch-decoration watch-decoration--two" aria-hidden="true"/>
      <div className="watch-device" aria-label={t('watchTitle')}><div className="watch-strap watch-strap--top" aria-hidden="true"/><div className="watch-case">
        <div className={`watch-screen ${hasNotice?'watch-screen--notice':''}`} role="region" aria-roledescription="carousel" aria-label={`${t('screens')}: ${screen==='health'?t('watchPageHealth'):t('watchPageSolar')}`} tabIndex={0}
          onPointerDown={event=>{dragStart.current=event.clientX;if(event.pointerType!=='mouse')event.currentTarget.setPointerCapture(event.pointerId);}}
          onPointerUp={event=>handlePointerEnd(event.clientX)} onPointerCancel={()=>{dragStart.current=null;}}
          onKeyDown={event=>{if(event.key==='ArrowRight'){event.preventDefault();goto('solar');}if(event.key==='ArrowLeft'){event.preventDefault();goto('health');}}}>
          <div className="watch-screen-top"><span className="watch-wordmark">M<span>✳</span></span><span className="watch-signal"><span className={`watch-signal-dot watch-signal-dot--${tone}`}/> {demo?t('demoWatchLabel'):t('notPaired')}</span></div>
          {screen==='health'?
            <div className="watch-center" key="health">
              <div className={`watch-main-icon watch-main-icon--${tone}`}><Heart size={54} strokeWidth={1.25}/></div>
              <div className="watch-eyebrow">{t('watchExposureMonitor')}</div>
              <strong className="watch-main-title">{label}</strong>
              <p className="watch-main-desc">{description}</p>
              <div className="watch-health-stats">
                <div><span>{t('latestRate')} · {t('ambientShort')}</span><strong>{rate===null?'—':rate.toFixed(3)}<small> µSv/h</small></strong></div>
                <div><span>{demo?t('lastSample'):t('watchLastReading')}</span><strong className="watch-time-value">{demo?formattedClock(now,language):'—'}</strong></div>
              </div>
            </div>:
            <div className="watch-center watch-center--solar" key="solar">
              <div className="watch-eyebrow watch-solar-kicker"><Sun size={12}/>{t('solar')}</div>
              <strong className="watch-solar-title">{model?t('watchForecastTitle'):t('noForecast')}</strong>
              <p className="watch-solar-source">{model?model.model:forecastError?t('apiOffline'):t('solarModels')}</p>
              <div className="watch-solar-summary">
                <div><span>A / {t('occurrence')}</span><strong>{formatSolarProbability(model?.occurrence_probability_percent,language)}</strong></div>
                <div><span>B / {t('intensity')}</span><strong>{formatSolarFlux(model?.peak_proton_flux,model?.peak_proton_flux_unit,language)}</strong></div>
                <div><span>C / {t('estimatedPeak')}</span><strong>{shortTime(model?.event_peak_at,language)}</strong><small>{t('onset')}: {shortTime(model?.event_start_at,language)}</small></div>
              </div>
              <p className="watch-solar-disclaimer">{t('fluxNotDose')}</p>
            </div>}
          {demo&&<OperationalNotice language={language} event={verification.data} stale={verification.isError}/>}
          <div className="watch-screen-footer"><div className="watch-dots" aria-label={t('screens')}><span className={screen==='health'?'active':''}/><span className={screen==='solar'?'active':''}/></div><small>{screen==='health'?t('swipeSolar'):t('swipeHealth')}</small></div>
        </div><div className="watch-crown" aria-hidden="true"/></div><div className="watch-strap watch-strap--bottom" aria-hidden="true"/></div>
      <div className="watch-controls" role="group" aria-label={t('screens')}><button className="watch-nav-button" type="button" onClick={()=>goto('health')} disabled={screen==='health'} aria-label={t('watchPageHealth')}><ArrowLeft size={18}/></button><span>{screen==='health'?'01 / 02':'02 / 02'} — {screen==='health'?t('watchPageHealth'):t('watchPageSolar')}</span><button className="watch-nav-button" type="button" onClick={()=>goto('solar')} disabled={screen==='solar'} aria-label={t('watchPageSolar')}><ArrowRight size={18}/></button></div>
    </main>
    <footer className="wearable-footer"><p><Info size={15}/>{t('protoDisclaimer')}</p></footer>
  </div>;
}
