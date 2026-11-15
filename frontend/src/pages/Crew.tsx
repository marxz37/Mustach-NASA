import { Activity, HeartPulse, Info, Radio, Timer, Users, Watch } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DoseHistory } from '@/components/monitoring/DoseHistory';
import { LiveRateChart } from '@/components/monitoring/LiveRateChart';
import { EVAClock } from '@/components/monitoring/EVAClock';
import { DEMO_CREW } from '@shared/demo';
import { demoCopy } from '@shared/demoCopy';
import { languageLocale } from '@shared/i18n';

export function CrewPage(){
 const {t,language,mode,selectedCrew,setSelectedCrewId,totalDoseMicroSv}=useApp();
 const demo=mode==='simulation';
 const d=(key:Parameters<typeof demoCopy>[1])=>demoCopy(language,key);
 const number=(v:number)=>new Intl.NumberFormat(languageLocale[language],{maximumFractionDigits:4}).format(v);
 const dose=totalDoseMicroSv('weekly',true);
 const role=(c:typeof selectedCrew)=>language==='pt'?c.rolePt:language==='es'?c.roleEs:c.role;
 return <div className="crew-page">
  <div className="crew-intro crew-intro--compact"><span className="section-kicker">MUSTACH / {t('crewList')}</span><h1>{t('crewTitle')}</h1><p>{demo?d('overviewNote'):t('crewDescription')}</p></div>
  <div className="crew-section-title"><span>{demo?d('crew'):t('crewList')}</span><span>{demo?d('crewCount'):t('crewCountZero')}</span></div>
  {demo?<>
   <div className="crew-gallery" aria-label={d('profiles')}>
    {DEMO_CREW.map(c=>{
     const active=c.id===selectedCrew.id;
     return <button type="button" key={c.id} aria-pressed={active} onClick={()=>setSelectedCrewId(c.id)} className={`crew-tile ${active?'selected':''}`}>
      <img src={`/crew/${c.portrait}`} alt={`${c.name} — fictional astronaut portrait`} loading="lazy"/>
      <span className="crew-tile-info"><strong>{c.name}</strong><small>{role(c)}</small><span className="crew-mini-bars" aria-hidden="true">{Array.from({length:11},(_,i)=><i key={i} style={{height:`${14+Math.abs(Math.sin(i*1.8+c.multiplier*3))*24}px`}}/>)}</span></span>
      <span className="crew-tile-index">0{DEMO_CREW.indexOf(c)+1}</span>
     </button>;
    })}
   </div>
   <div className="crew-active-header"><div><span className="section-kicker">{d('crewDetail')} / {d('demoShort')}</span><h2>{selectedCrew.name}</h2><p>{role(selectedCrew)} · {selectedCrew.mission}</p></div><span className="profile-mark"><Radio size={15}/>{d('demoShort')}</span></div>
   <div className="crew-vitals">
     <div><HeartPulse size={19}/><span>{d('heart')}</span><strong>{selectedCrew.heartRate} <small>bpm</small></strong></div>
     <div><Activity size={19}/><span>{d('oxygen')}</span><strong>{selectedCrew.spo2}<small>%</small></strong></div>
     <div><Timer size={19}/><span>{d('sleep')}</span><strong>{selectedCrew.sleepHours.toFixed(1)} <small>h</small></strong></div>
     <div><Watch size={19}/><span>{t('accumulated')} · {d('week')}</span><strong>{dose===null?'—':number(dose/1000)} <small>mSv</small></strong></div>
   </div>
   <p className="crew-caution"><Info size={16}/>{d('personalNote')}</p>
  </>:<section className="crew-no-profiles"><Users size={35}/><h2>{t('noCrew')}</h2><p>{t('crewFields')}</p></section>}
  <div className="monitoring-grid crew-monitoring"><LiveRateChart personal compact/><DoseHistory personal/></div>
  <div className="crew-eva"><EVAClock compact/><p className="crew-caution"><Info size={16}/>{demo?d('session'):t('evaNoCrew')}</p></div>
 </div>;
}
