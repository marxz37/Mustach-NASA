import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { Activity, Radio } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formattedClock, languageLocale } from '@shared/i18n';

interface Props { personal?: boolean; compact?: boolean; }
const DAY_MS=86_400_000;
export function LiveRateChart({personal=false,compact=false}:Props){
  const {now,mode,language,t,equivalentPoints,personalPoints}=useApp();
  const source=personal?personalPoints:equivalentPoints;
  const recent=useMemo(()=>source.filter(x=>x.at>=now-DAY_MS&&x.at<=now),[source,now]);
  const lastSample=recent.length?recent[recent.length-1]:null;
  const latest=lastSample && now-lastSample.at<=120_000?lastSample:null;
  const visibleFrom=recent.length?Math.max(now-DAY_MS,recent[0].at-20_000):now-DAY_MS;
  const option:EChartsOption={
    animation:false,backgroundColor:'transparent',grid:{left:48,right:18,top:18,bottom:34},
    tooltip:{trigger:'axis',backgroundColor:'#091a2d',borderColor:'#2b709c',textStyle:{color:'#edfaff'},
      formatter:(params)=>{
        const entry=Array.isArray(params)?params[0]:params;
        if(!entry || !Array.isArray(entry.value))return '';
        return `${formattedClock(Number(entry.value[0]),language,true)}: ${Number(entry.value[1]).toFixed(3)} µSv/h`;
      },
    },
    xAxis:{type:'time',min:visibleFrom,max:now+2000,axisLabel:{color:'#80abc6',fontSize:10,formatter:(n:number)=>new Intl.DateTimeFormat(languageLocale[language],{hour:'2-digit',minute:'2-digit'}).format(new Date(n))},axisLine:{lineStyle:{color:'#294762'}},splitLine:{show:false}},
    yAxis:{type:'value',scale:true,name:'µSv/h',nameTextStyle:{color:'#7eacc4'},axisLabel:{color:'#80abc6',fontSize:10},splitLine:{lineStyle:{color:'#1c3b57',type:'dashed'}}},
    series:[{name:t('measuredRate'),type:'line',showSymbol:recent.length<2,symbolSize:7,smooth:false,data:recent.map(p=>[p.at,p.value]),lineStyle:{width:2,color:'#65d6ff'},itemStyle:{color:'#8eeaff'},areaStyle:{color:'rgba(33,153,211,.14)'},markPoint:latest?{data:[{name:'latest',coord:[latest.at,latest.value],symbolSize:11}],itemStyle:{color:'#9eecff'}}:undefined}],
  };
  return <section className={`quiet-panel live-rate-section ${compact?'live-rate-compact':''}`} aria-label={t('rateHistory')}>
    <div className="panel-heading"><Activity size={19}/><h2>{t('latestRate')}</h2><span className="readout-live"><span className={`live-indicator ${mode==='simulation'?'is-simulated':''}`}/>{mode==='simulation'?t('simulated'):mode==='real'?t('observed'):t('noData')}</span></div>
    <div className="live-rate-summary"><div><strong>{latest?latest.value.toFixed(3):'—'} <small>µSv/h</small></strong><p>{personal?t('personalExposure'):t('rateHistory')}</p></div><span>{latest?formattedClock(latest.at,language,true):t('never')}</span></div>
    <div className="chart-wrap">{recent.length? <ReactECharts option={option} notMerge lazyUpdate style={{height:compact?178:236,width:'100%'}}/>:<div className="empty-rate-chart"><Radio size={22}/><span>{t('realtimeWaiting')}</span></div>}</div>
    <p className="panel-explain">{mode==='simulation'?t('onlySimulation'):personal?t('crewHistoryNote'):mode==='real'?t('unsupportedSource'):t('noTelemetry')}</p>
  </section>;
}
