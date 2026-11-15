import { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { Activity, CalendarDays } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { integrateEquivalentDose, type RatePoint } from '@shared/radiation';
import { languageLocale } from '@shared/i18n';
interface Props { personal?: boolean; }
const DAY=86_400_000;
function pointsToCumulative(source:RatePoint[],start:number,end:number,maxGap:number):[number,number][]{
  const filtered=source.filter(x=>x.at>=start&&x.at<=end).sort((a,b)=>a.at-b.at);
  const out:[number,number][]=[];
  for(let i=1;i<filtered.length;i++){
    const data=integrateEquivalentDose(filtered.slice(i-1,i+1),[{start:filtered[i-1].at,end:filtered[i].at}],maxGap);
    if(data!==null){const last=out.length?out[out.length-1][1]:0;out.push([filtered[i].at,last+data/1000]);}
  }
  return out;
}
export function DoseHistory({personal=false}:Props){
  const {mode,t,now,language,equivalentPoints,personalPoints,totalDoseMicroSv}=useApp();
  const [period,setPeriod]=useState<'daily'|'weekly'>('daily');
  const source=personal?personalPoints:equivalentPoints;
  const cutoff=now-(period==='daily'?DAY:7*DAY);
  const chart=personal&&mode==='simulation'?[]:pointsToCumulative(source,cutoff,now,mode==='simulation'?5000:60_000);
  const dose=totalDoseMicroSv(period,personal);
  const option:EChartsOption={animation:false,grid:{top:15,bottom:32,left:52,right:15},tooltip:{trigger:'axis'},
    xAxis:{type:'time',axisLabel:{fontSize:10,color:'#89abc4',formatter:(v:number)=>new Intl.DateTimeFormat(languageLocale[language],period==='daily'?{hour:'2-digit',minute:'2-digit'}:{month:'short',day:'numeric'}).format(new Date(v))},axisLine:{lineStyle:{color:'#2c5775'}},splitLine:{show:false}},
    yAxis:{type:'value',name:'mSv',nameTextStyle:{color:'#84b2cc'},axisLabel:{color:'#83a4b9'},splitLine:{lineStyle:{type:'dashed',color:'#17364c'}}},
    series:[{type:'line',data:chart,smooth:false,symbol:'none',lineStyle:{color:'#70e0fa',width:2},areaStyle:{color:'rgba(68,165,222,.17)'}}]};
  return <section className="quiet-panel history-section" aria-label={t('accumHistory')}>
    <div className="panel-heading"><Activity size={19}/><h2>{t('history')}</h2><div className="period-tabs" role="group" aria-label={t('accumulated')}><button className={period==='daily'?'active':''} type="button" aria-pressed={period==='daily'} onClick={()=>setPeriod('daily')}>{t('daily')}</button><button className={period==='weekly'?'active':''} type="button" aria-pressed={period==='weekly'} onClick={()=>setPeriod('weekly')}>{t('weekly')}</button></div></div>
    <div className="history-subtitle"><CalendarDays size={14}/>{t('accumHistory')}<span>mSv</span></div>
    <div className="dose-history-value"><strong>{dose==null?'—':(dose/1000).toFixed(7)}</strong><span>mSv · {t(period)}</span></div>
    {chart.length>0?<ReactECharts option={option} style={{height:185,width:'100%'}} notMerge lazyUpdate/>:<div className="empty-rate-chart"><Activity size={17}/><span>{personal?t('noPersonalSeries'):t('noValidHistory')}</span></div>}
    <p className="panel-explain">{mode==='simulation'&&!personal?t('sessionPartial'):personal?t('crewHistoryNote'):t('unsupportedSource')}</p>
  </section>;
}
