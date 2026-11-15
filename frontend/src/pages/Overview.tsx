import { useState } from 'react';
import { ArrowUpRight, Heart, Info, Radio } from 'lucide-react';
import { SolarActivityPanel } from '@/components/dashboard/SolarActivityPanel';
import { HeatmapBody, type BodyTarget } from '@/components/visualizations/HeatmapBody';
import { OrganDetails } from '@/components/visualizations/OrganDetails';
import { LiveRateChart } from '@/components/monitoring/LiveRateChart';
import { DoseHistory } from '@/components/monitoring/DoseHistory';
import { EVAClock } from '@/components/monitoring/EVAClock';
import { useApp } from '@/context/AppContext';

function IndividualHealth(){const {t}=useApp();return <section className="quiet-panel health-section" aria-label={t('individualState')}>
  <div className="panel-heading"><Heart size={19}/><h2>{t('individualState')}</h2><span>{t('notEvaluated')}</span></div>
  <div className="individual-health health-unknown"><Heart size={56} strokeWidth={1.35} aria-hidden="true"/><strong>{t('notEvaluated')}</strong><p>{t('healthWaiting')}</p></div>
  <div className="panel-foot"><span>{t('noDiagnosis')}</span><ArrowUpRight size={14}/></div>
</section>}
export function Overview(){
  const [selected,setSelected]=useState<BodyTarget|null>(null);
  const [bodyView,setBodyView]=useState<'corpo'|'orgaos'>('corpo');
  const {t,mode,simulated,absorbedRate,totalDoseMicroSv}=useApp();
  const accumulated=totalDoseMicroSv('daily');
  return <div className="dashboard-page">
    <div className="dashboard-toolbar"><div><span className="section-kicker">MUSTACH / {t('missionReadings')}</span></div><div className="mode-chip" data-mode={mode}><span className="status-dot"/>{mode==='simulation'?t('simulation'):mode==='real'?t('real'):t('noData')}</div></div>
    <section className="readout-strip" aria-label={t('missionReadings')}>
      <div><span>01 / {t('absorbedRate')}</span><strong>{absorbedRate===null?'—':absorbedRate.toFixed(3)} <small>µGy/h</small></strong><p>{simulated?t('onlySimulation'):t('awaitingDosimeter')}</p></div>
      <div><span>02 / {t('accumulated')} · {t('daily')}</span><strong>{accumulated===null?'—':(accumulated/1000).toFixed(7)} <small>mSv</small></strong><p>{simulated?t('sessionPartial'):t('noValidHistory')}</p></div>
      <div><span>03 / {t('individualHealth')}</span><strong>{t('notEvaluated')}</strong><p>{t('noIndividual')}</p></div>
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
          <div className="reading-row"><div><strong>NASA RadLab</strong><span>{t('absorbedRate')}</span></div><b>— <small>µGy/h</small></b></div>
          <div className="reading-row"><div><strong>ISS-RAD / REM</strong><span>{t('doseAmbient')}</span></div><b>— <small>µSv/h</small></b></div>
          <div className="reading-row"><div><strong>{t('personalDose')}</strong><span>{t('personalExposure')}</span></div><b>— <small>mSv</small></b></div>
          <div className="panel-foot"><span>{t('readoutNotSame')}</span><Info size={14}/></div>
        </section>
      </div>
    </div>
    <div className="monitoring-grid"><LiveRateChart/><DoseHistory/></div>
    <div className="monitoring-grid monitoring-grid--bottom"><EVAClock/><IndividualHealth/></div>
    <OrganDetails target={selected} onClose={()=>setSelected(null)}/>
  </div>;
}
