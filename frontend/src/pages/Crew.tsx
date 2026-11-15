import { Info, UserRound } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DoseHistory } from '@/components/monitoring/DoseHistory';
import { LiveRateChart } from '@/components/monitoring/LiveRateChart';
import { EVAClock } from '@/components/monitoring/EVAClock';

export function CrewPage(){const {t}=useApp();return <div className="crew-page">
  <div className="crew-intro crew-intro--compact"><span className="section-kicker">MUSTACH / {t('crewList')}</span><h1>{t('crewTitle')}</h1><p>{t('crewDescription')}</p></div>
  <div className="crew-section-title"><span>{t('crewList')}</span><span>{t('crewCountZero')}</span></div>
  <section className="crew-profile" aria-label={t('crewList')}>
    <div className="crew-portrait"><UserRound size={58} strokeWidth={1}/><span>{t('noPhoto')}</span></div>
    <div className="crew-identity"><span className="section-kicker">{t('crewPending')}</span><h2>{t('noCrew')}</h2><p>{t('crewFields')}</p><div className="crew-fields"><span>{t('mission')} <strong>—</strong></span><span>{t('status')} <strong>{t('noData')}</strong></span></div></div>
    <div className="crew-exposure"><span>{t('personalExposure')}</span><div className="crew-bars" aria-label={t('noPersonalSeries')}>{Array.from({length:9},(_,index)=><i key={index}/>)}</div><strong>— <small>mSv</small></strong><p>{t('noPersonalSeries')}</p></div>
  </section>
  <p className="crew-caution"><Info size={16}/>{t('noCrewNote')}</p>
  <div className="monitoring-grid crew-monitoring"><LiveRateChart personal compact/><DoseHistory personal/></div>
  <div className="crew-eva"><EVAClock compact/><p className="crew-caution"><Info size={16}/>{t('evaNoCrew')}</p></div>
</div>}
