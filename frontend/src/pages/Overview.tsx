import { useState } from 'react';
import { Activity, Info, Radio, Sun, Zap } from 'lucide-react';
import { demonstrationBand } from '@shared/demoBands';
import { formatSolarProbability } from '@shared/solar';
import { equivalentDoseCoverage } from '@shared/radiation';
import { languageLocale } from '@shared/i18n';
import { SolarActivityPanel } from '@/components/dashboard/SolarActivityPanel';
import { HeatmapBody, type BodyTarget } from '@/components/visualizations/HeatmapBody';
import { OrganDetails } from '@/components/visualizations/OrganDetails';
import { LiveRateChart } from '@/components/monitoring/LiveRateChart';
import { DoseHistory } from '@/components/monitoring/DoseHistory';
import { ScientificHistory } from '@/components/monitoring/ScientificHistory';
import { EVAClock } from '@/components/monitoring/EVAClock';
import { OperationalCheck } from '@/components/monitoring/OperationalCheck';
import { useApp } from '@/context/AppContext';

export function Overview(){
  const [selected,setSelected]=useState<BodyTarget|null>(null);
  const [bodyView,setBodyView]=useState<'corpo'|'orgaos'>('corpo');
  const {t,mode,simulated,absorbedRate,latestEquivalent,now,language,totalDoseMicroSv,equivalentPoints,simulation,simulationOffline}=useApp();
  const model=simulated&&!simulationOffline?simulation?.solar_model:null;
  // Fictional display bands only. Real measurements cannot be assessed against these values.
  const tier=simulated?demonstrationBand(latestEquivalent):'unknown';
  const tierLabel=tier==='baseline'?t('statusNominal'):tier==='attention'?t('statusAttention'):tier==='high'?t('statusHighExposure'):t('unavailable');
  const modeName=mode==='simulation'?t('simulation'):mode==='real'?t('real'):t('noData');
  const newestEquivalent=equivalentPoints[equivalentPoints.length-1];
  const sensorFresh=!!newestEquivalent&&now>=newestEquivalent.at&&now-newestEquivalent.at<10_000;
  const cumulative24hMicroSv=totalDoseMicroSv('daily');
  const maxGap=simulated?310_000:60_000;
  const covered=equivalentDoseCoverage(equivalentPoints,{start:now-86_400_000,end:now},maxGap);
  const coverageHours=new Intl.NumberFormat(languageLocale[language],{maximumFractionDigits:2}).format(covered/3_600_000);
  return <div className="dashboard-page">
    <div className="dashboard-toolbar">
      <span className="section-kicker">RADIANCE / {t('missionReadings')}</span>
      <div className="mode-chip" data-mode={mode}><span className="status-dot"/>{modeName}</div>
    </div>
    <section className="readout-strip readout-strip--priority" aria-label={t('missionReadings')}>
      <div className="readout-priority"><span><Sun size={15}/><b>01 / {t('solar')}</b></span><strong>{model?formatSolarProbability(model.occurrence_probability_percent,language):'—'}</strong><p>{t('occurrenceDesc')}{model?` · ${model.model}`:''}</p></div>
      <div className="readout-priority"><span><Activity size={15}/><b>02 / {t('accumulated')} · {t('last24h')}</b>{sensorFresh&&<i className="live-pulse" aria-label={simulated?t('simulationActive'):t('live')}/>}</span><strong>{cumulative24hMicroSv===null?'—':(cumulative24hMicroSv/1000).toFixed(4)} <small>mSv</small></strong><p>{t('doseAmbient')} · {cumulative24hMicroSv===null?t('noValidHistory'):`${t('coverage')}: ${coverageHours} / 24 h${86_400_000-covered>maxGap?` · ${t('partialCoverage')}`:''}`}</p></div>
      <div className="readout-priority"><span><Zap size={15}/><b>03 / {t('watchExposureState')}</b></span><strong className={`readout-tier readout-tier--${tier}`}>{tierLabel}</strong><p>{simulated?t('tierCaption'):t('noValidHistory')}</p></div>
    </section>

    <OperationalCheck/>
    <div className="overview-priority-grid">
      <SolarActivityPanel/>
      <div className="priority-sensors">
        <LiveRateChart compact/>
        <section className="quiet-panel radiation-section" aria-label={t('radiation')}>
          <div className="panel-heading"><Radio size={19}/><h2>{t('radiation')}</h2><span>{t('doseAmbient')}</span></div>
          <div className="reading-row"><div><strong>{t('absorbedRate')}</strong><span>{t('doseAmbient')}</span></div><b>{absorbedRate===null?'—':absorbedRate.toFixed(3)} <small>µGy/h</small></b></div>
          <div className="reading-row"><div><strong>{t('latestRate')}</strong><span>{t('doseAmbient')}</span></div><b>{latestEquivalent===null?'—':latestEquivalent.toFixed(3)} <small>µSv/h</small></b></div>
          <div className="panel-foot"><span>{t('readoutNotSame')}</span><Info size={14}/></div>
        </section>
      </div>
    </div>

    <div className="overview-support-grid">
      <section className="body-section" aria-labelledby="body-title">
        <div className="section-heading"><div><span className="section-kicker">2D / {t('body')}</span><h2 id="body-title">{t('heatmapTitle')}</h2></div><span className="section-aside">2D · INTERACTIVE</span></div>
        <div className="body-controls"><div className="body-view-tabs" role="group" aria-label={t('heatmapTitle')}><button type="button" className={bodyView==='corpo'?'active':''} aria-pressed={bodyView==='corpo'} onClick={()=>setBodyView('corpo')}>{t('body')}</button><button type="button" className={bodyView==='orgaos'?'active':''} aria-pressed={bodyView==='orgaos'} onClick={()=>setBodyView('orgaos')}>{t('organs')}</button></div></div>
        <p className="section-description">{bodyView==='orgaos'?t('selectOrgan'):t('bodyDescription')}</p>
        <HeatmapBody view={bodyView} demonstration={simulated} selected={selected} onSelect={setSelected}/>
        {simulated?<div className="body-legend body-legend--bands"><span className="band-mark band-mark--baseline"/>{t('statusNominal')}<span className="band-mark band-mark--attention"/>{t('statusAttention')}<span className="band-mark band-mark--high"/>{t('statusHighExposure')}</div>:<div className="body-legend"><span className="legend-swatch"/>{t('mapLegendEmpty')}</div>}
        <p className="heatmap-method-note">{simulated?t('demoBandsWarning'):t('heatmapEmpty')}</p>
      </section>
      <div className="overview-support-stack"><DoseHistory/>{mode==='real'&&<ScientificHistory/>}<EVAClock/></div>
    </div>
    <OrganDetails target={selected} onClose={()=>setSelected(null)}/>
  </div>;
}
