import { Flag, Play, Pause, RotateCcw, Timer, Info } from 'lucide-react';
import { readableDuration } from '@shared/radiation';
import { demoCopy } from '@shared/demoCopy';
import { useApp } from '@/context/AppContext';
export function EVAClock({compact=false}:{compact?:boolean}){
  const {t,mode,language,evaState,evaStart,evaPause,evaResume,evaFinish,evaReset,evaElapsedMs,evaDoseMicroSv,simulation,simulationOffline}=useApp();
  const phase={ready:'evaReady',running:'evaRunning',paused:'evaPaused',finished:'evaFinished'} as const;
  return <section className={`quiet-panel eva-section ${compact?'eva-compact':''}`} aria-label={t('evaTitle')}>
    <div className="panel-heading"><Timer size={19}/><h2>{t('evaTitle')}</h2><span className="eva-state" data-state={evaState}>{t(phase[evaState])}</span></div>
    <p className="section-description">{t('evaSubtitle')}</p>
    <div className="eva-values"><div><span>{t('elapsed')}</span><strong className="eva-clock" aria-live="off">{readableDuration(evaElapsedMs)}</strong></div><div><span>{t('evaDose')}</span><strong>{evaDoseMicroSv===null?'—':evaDoseMicroSv.toFixed(6)} <small>µSv</small></strong></div></div>
    <div className="eva-controls" role="group" aria-label={t('evaTitle')}>
      {evaState==='ready'&&<button type="button" className="eva-primary" disabled={mode==='simulation'&&(!simulation||simulationOffline)} onClick={evaStart}><Play size={15}/>{t('evaStart')}</button>}
      {evaState==='running'&&<button type="button" onClick={evaPause}><Pause size={15}/>{t('evaPause')}</button>}
      {evaState==='paused'&&<button type="button" className="eva-primary" onClick={evaResume}><Play size={15}/>{t('evaResume')}</button>}
      {(evaState==='running'||evaState==='paused')&&<button type="button" onClick={evaFinish}><Flag size={15}/>{t('evaFinish')}</button>}
      {evaState!=='ready'&&<button type="button" onClick={evaReset}><RotateCcw size={15}/>{t('evaReset')}</button>}
    </div>
    {mode==='simulation'&&evaState==='ready'&&<div className="eva-sample-history"><span>{demoCopy(language,'sampleEVA')} · {demoCopy(language,'session')}</span><strong>01:28:36 <small> / 0.00081 mSv</small></strong><em>{demoCopy(language,'demoShort')}</em></div>}
    <div className="eva-disclaimer"><Info size={16}/><div><p>{mode==='simulation'?t(evaDoseMicroSv===null?'evaAwaitingSamples':'evaSimulated'):t('evaWaiting')}</p><p>{t('evaSampleGap')} {t('evaClockNotDose')}</p></div></div>
  </section>;
}
