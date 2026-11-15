import { useState } from 'react';
import { HeartPulse, Info, Radio, Activity } from 'lucide-react';
import { demoCopy } from '@shared/demoCopy';
import { SolarActivityPanel } from '@/components/dashboard/SolarActivityPanel';
import { HeatmapBody, type BodyTarget } from '@/components/visualizations/HeatmapBody';
import { OrganDetails } from '@/components/visualizations/OrganDetails';
import { LiveRateChart } from '@/components/monitoring/LiveRateChart';
import { DoseHistory } from '@/components/monitoring/DoseHistory';
import { EVAClock } from '@/components/monitoring/EVAClock';
import { useApp } from '@/context/AppContext';

function MissionStatus(){
  const {t,simulated,latestEquivalent,totalDoseMicroSv,mode}=useApp();
  const daily=totalDoseMicroSv('daily');
  const weekly=totalDoseMicroSv('weekly');
  const tone = !simulated || latestEquivalent===null ? 'unknown' : latestEquivalent < .5 ? 'normal' : latestEquivalent < .62 ? 'alerta' : 'perigo';
  const label = tone==='normal' ? t('statusNominal') : tone==='alerta' ? t('statusAttention') : tone==='perigo' ? t('statusHighExposure') : t('notEvaluated');
  const panelClass = tone==='normal' ? 'health-normal' : tone==='alerta' ? 'health-alerta' : tone==='perigo' ? 'health-perigo' : 'health-unknown';
  const sourceLabel = mode==='simulation' ? t('simulation') : mode==='real' ? t('real') : t('noData');
  return <section className="quiet-panel health-section" aria-label={t('overviewStatus')}>
    <div className="panel-heading"><HeartPulse size={19}/><h2>{t('overviewStatus')}</h2><span>{sourceLabel}</span></div>
    <div className={`individual-health ${panelClass}`}><HeartPulse size={48} strokeWidth={1.35}/><strong>{label}</strong><p>{simulated?t('overviewCrewTabNote'):t('healthWaiting')}</p></div>
    <div className="health-metrics">
      <div><Radio size={18}/><span>{t('latestRate')}</span><strong>{latestEquivalent===null?'—':latestEquivalent.toFixed(3)} <small>µSv/h</small></strong></div>
      <div><Activity size={18}/><span>{t('accumulated')} · {t('daily')}</span><strong>{daily===null?'—':(daily/1000).toFixed(4)} <small>mSv</small></strong></div>
      <div><Activity size={18}/><span>{t('accumulated')} · {t('weekly')}</span><strong>{weekly===null?'—':(weekly/1000).toFixed(4)} <small>mSv</small></strong></div>
      <div><Info size={18}/><span>{t('dataMode')}</span><strong>{sourceLabel}</strong></div>
    </div>
    <p className="panel-explain">{t('overviewCrewTabNote')}</p>
  </section>;
}

export function Overview(){
  const [selected,setSelected]=useState<BodyTarget|null>(null);
  const [bodyView,setBodyView]=useState<'corpo'|'orgaos'>('corpo');
  const {t,mode,simulated,absorbedRate,totalDoseMicroSv,language,latestEquivalent}=useApp();
  const d=(key:Parameters<typeof demoCopy>[1])=>demoCopy(language,key);
  const accumulated=totalDoseMicroSv('daily');
  const missionStatus = !simulated || latestEquivalent===null ? t('notEvaluated') : latestEquivalent < .5 ? t('statusNominal') : latestEquivalent < .62 ? t('statusAttention') : t('statusHighExposure');
  return <div className="dashboard-page">
    <div className="dashboard-toolbar"><div><span className="section-kicker">MUSTACH / {t('missionReadings')}</span>{simulated&&<p className="overview-demo-line">{d('overviewNote')}</p>}</div><div className="mode-chip" data-mode={mode}><span className="status-dot"/>{mode==='simulation'?t('simulation'):mode==='real'?t('real'):t('noData')}</div></div>
    <section className="readout-strip" aria-label={t('missionReadings')}>
      <div><span>01 / {t('absorbedRate')}</span><strong>{absorbedRate===null?'—':absorbedRate.toFixed(3)} <small>µGy/h</small></strong><p>{simulated?d('demo'):t('awaitingDosimeter')}</p></div>
      <div><span>02 / {t('accumulated')} · {t('daily')}</span><strong>{accumulated===null?'—':(accumulated/1000).toFixed(7)} <small>mSv</small></strong><p>{simulated?d('coverage'):t('noValidHistory')}</p></div>
      <div><span>03 / {t('overviewStatus')}</span><strong>{missionStatus}</strong><p>{t('overviewCrewTabNote')}</p></div>
    </section>
    <div className="overview-grid">
      <section className="body-section" aria-labelledby="body-title">
        <div className="section-heading"><div><span className="section-kicker">01 / 2D</span><h2 id="body-title">{t('heatmapTitle')}</h2></div><span className="section-aside">2D · INTERACTIVE</span></div>
        <div className="body-controls"><div className="body-view-tabs" role="group" aria-label={t('heatmapTitle')}><button type="button" className={bodyView==='corpo'?'active':''} aria-pressed={bodyView==='corpo'} onClick={()=>setBodyView('corpo')}>{t('body')}</button><button type="button" className={bodyView==='orgaos'?'active':''} aria-pressed={bodyView==='orgaos'} onClick={()=>setBodyView('orgaos')}>{t('organs')}</button></div><span className="mode-note">{simulated?t('demoPreview'):t('noData')}</span></div>
        <p className="section-description">{bodyView==='orgaos'?t('selectOrgan'):t('bodyDescription')} {simulated?t('heatmapSimulation'):t('heatmapEmpty')}</p>
        <HeatmapBody view={bodyView} demonstration={simulated} selected={selected} onSelect={setSelected}/>
        <div className="body-legend">{simulated?<><span className="heat-scale" aria-hidden="true"/><span>{t('mapLegendLow')}</span><span>{t('mapLegendHigh')}</span></>:<><span className="legend-swatch"/><span>{t('mapLegendEmpty')}</span></>}</div>
      </section>
      <div className="overview-aside">
        <SolarActivityPanel/>
        <section className="quiet-panel radiation-section" aria-label={t('radiation')}>
          <div className="panel-heading"><Radio size={19}/><h2>{t('radiation')}</h2><span>{simulated?t('simulated'):t('noSignal')}</span></div>
          <div className="reading-row"><div><strong>{simulated?'CABIN SENSOR / DEMO':'NASA RadLab'}</strong><span>{t('absorbedRate')}</span></div><b>{simulated&&absorbedRate!==null?absorbedRate.toFixed(3):'—'} <small>µGy/h</small></b></div>
          <div className="reading-row"><div><strong>{simulated?'RADIATION MODEL / DEMO':'ISS-RAD / REM'}</strong><span>{t('doseAmbient')}</span></div><b>{simulated?(absorbedRate===null?'—':(absorbedRate*.81).toFixed(3)):'—'} <small>µSv/h</small></b></div>
          <div className="reading-row"><div><strong>{simulated?'PERSONAL / DEMO':t('personalDose')}</strong><span>{t('personalExposure')}</span></div><b>{simulated&&totalDoseMicroSv('daily',true)!==null?(totalDoseMicroSv('daily',true)!/1000).toFixed(4):'—'} <small>mSv</small></b></div>
          <div className="panel-foot"><span>{simulated?d('demoNote'):t('readoutNotSame')}</span><Info size={14}/></div>
        </section>
      </div>
    </div>
    <div className="monitoring-grid"><LiveRateChart/><DoseHistory/></div>
    <div className="monitoring-grid monitoring-grid--bottom"><EVAClock/><MissionStatus/></div>
    <OrganDetails target={selected} onClose={()=>setSelected(null)}/>
  </div>;
}
