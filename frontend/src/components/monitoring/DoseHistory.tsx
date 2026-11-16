import { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { Activity, CalendarDays } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cumulativeEquivalentDose, equivalentDoseCoverage } from '@shared/radiation';
import { languageLocale } from '@shared/i18n';
import { demoCopy } from '@shared/demoCopy';
import { accumulatedDemoBand, chartCopy } from '@/lib/chartSeries';
interface Props { personal?: boolean; }
const DAY=86_400_000;
export function DoseHistory({personal=false}:Props){
  const {mode,t,now,language,equivalentPoints,personalPoints,totalDoseMicroSv,simulation}=useApp();
  const [period,setPeriod]=useState<'daily'|'weekly'>('daily');
  const source=personal?personalPoints:equivalentPoints;
  const cutoff=now-(period==='daily'?DAY:7*DAY);
  const maxGap=mode==='simulation'?310_000:60_000;
  const chart=cumulativeEquivalentDose(source,{start:cutoff,end:now},maxGap).map(([at,dose])=>[at,dose===null?null:dose/1000]);
  const dose=totalDoseMicroSv(period,personal);
  const covered=equivalentDoseCoverage(source,{start:cutoff,end:now},maxGap);
  const coverageHours=new Intl.NumberFormat(languageLocale[language],{maximumFractionDigits:2}).format(covered/3_600_000);
  const totalHours=period==='daily'?24:168;
  const band=mode==='simulation'?accumulatedDemoBand(dose,period):'unknown';
  const c=chartCopy[language];
  const option:EChartsOption={animation:false,grid:{top:15,bottom:58,left:52,right:15},tooltip:{trigger:'axis'},
    xAxis:{type:'time',min:cutoff,max:now,axisLabel:{fontSize:10,color:'#89abc4',formatter:(v:number)=>new Intl.DateTimeFormat(languageLocale[language],period==='daily'?{hour:'2-digit',minute:'2-digit'}:{month:'short',day:'numeric'}).format(new Date(v))},axisLine:{lineStyle:{color:'#2c5775'}},splitLine:{show:false}},
    yAxis:{type:'value',name:'mSv',nameTextStyle:{color:'#84b2cc'},axisLabel:{color:'#83a4b9'},splitLine:{lineStyle:{type:'dashed',color:'#17364c'}}},
    dataZoom:[{id:'history-inside',type:'inside',filterMode:'none',throttle:50},
      {id:'history-slider',type:'slider',filterMode:'none',bottom:4,height:16,showDetail:false,showDataShadow:false,borderColor:'#2c5775',fillerColor:'rgba(112,224,250,.13)',handleStyle:{color:'#70e0fa'},textStyle:{color:'#89abc4'}}],
    series:[{id:'accumulated-dose',type:'line',data:chart,sampling:'lttb',connectNulls:false,smooth:false,symbol:'none',lineStyle:{color:'#70e0fa',width:2},areaStyle:{color:'rgba(68,165,222,.17)'}}]};
  return <section className="quiet-panel history-section" aria-label={t('accumHistory')}>
    <div className="panel-heading"><Activity size={19}/><h2>{t(personal?'personalHistory':'ambientHistory')}</h2><div className="period-tabs" role="group" aria-label={t('accumulated')}><button className={period==='daily'?'active':''} type="button" aria-pressed={period==='daily'} onClick={()=>setPeriod('daily')}>{demoCopy(language,'day')}</button><button className={period==='weekly'?'active':''} type="button" aria-pressed={period==='weekly'} onClick={()=>setPeriod('weekly')}>{demoCopy(language,'week')}</button></div></div>
    <div className="history-subtitle"><CalendarDays size={14}/>{t(personal?'personalExposure':'doseAmbient')}<span>mSv</span></div>
    <div className="dose-history-value"><strong>{dose==null?'—':(dose/1000).toFixed(7)}</strong><span>mSv · {t(period)}</span></div>
    {chart.length>0?<><ReactECharts key={`${mode}/${period}/${personal}/${simulation?.run_id??''}`} option={option} style={{height:215,width:'100%'}} replaceMerge={['series']} lazyUpdate/><p className="chart-interaction-note">{c.zoom}</p></>:<div className="empty-rate-chart"><Activity size={17}/><span>{personal?t('noPersonalSeries'):t('noValidHistory')}</span></div>}
    {mode==='simulation'&&dose!==null&&<div className="dose-demo-legend" aria-label={c.demoScale} data-band={band}><span>{c.demoScale}</span><div>{(['low','attention','high'] as const).map(level=><span key={level} className={band===level?'is-current':''} aria-current={band===level?'true':undefined}><i className={`dose-band-${level}`}/>{c[level]}{band===level?' ◂':''}</span>)}</div></div>}
    <p className="panel-explain dose-coverage">{dose===null?(personal?t('noPersonalSeries'):t('noValidHistory')):`${t('coverage')}: ${coverageHours} / ${totalHours} h · ${t('availableIntervals')}`}{dose!==null&&now-cutoff-covered>maxGap?` · ${t('partialCoverage')}`:''}</p>
  </section>;
}
