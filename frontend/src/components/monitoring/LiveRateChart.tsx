import { useMemo, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { Activity, Radio } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formattedClock, languageLocale } from '@shared/i18n';
import { simulationCopy } from '@shared/simulation';
import { chartCopy, chronologicalRates } from '@/lib/chartSeries';

interface Props { personal?: boolean; compact?: boolean; }
const DAY_MS=86_400_000;
export function LiveRateChart({personal=false,compact=false}:Props){
  const {now,mode,language,t,equivalentPoints,personalPoints,simulation,simulationOffline}=useApp();
  const source=personal?personalPoints:equivalentPoints;
  const chartRef=useRef<ReactECharts>(null);
  const scope=`${mode}/${personal}/${simulation?.run_id??''}`;
  const [zoom,setZoom]=useState<{scope:string;from:number;to:number}|null>(null);
  const userZoom=zoom?.scope===scope?zoom:null;
  const recent=useMemo(()=>chronologicalRates(source,now-DAY_MS,now),[source,now]);
  const lastSample=recent.length?recent[recent.length-1]:null;
  const latest=lastSample && now-lastSample.at>=0 && now-lastSample.at<=120_000?lastSample:null;
  const visibleFrom=recent.length?Math.max(now-DAY_MS,recent[0].at-20_000):now-DAY_MS;
  const from=userZoom?.from??(mode==='simulation'?now-900_000:visibleFrom);
  const to=userZoom?.to??now;
  const c=chartCopy[language];
  const rememberZoom=()=>{
    const option=chartRef.current?.getEchartsInstance().getOption();
    const selected=(option?.dataZoom as {startValue?:number;endValue?:number}[]|undefined)?.[0];
    if(typeof selected?.startValue==='number'&&typeof selected.endValue==='number')setZoom({scope,from:selected.startValue,to:selected.endValue});
  };
  const option:EChartsOption={
    animation:false,backgroundColor:'transparent',grid:{left:48,right:18,top:18,bottom:60},
    tooltip:{trigger:'axis',backgroundColor:'#091a2d',borderColor:'#2b709c',textStyle:{color:'#edfaff'},
      formatter:(params)=>{
        const entry=Array.isArray(params)?params[0]:params;
        if(!entry || !Array.isArray(entry.value))return '';
        return `${formattedClock(Number(entry.value[0]),language,true)}: ${Number(entry.value[1]).toFixed(3)} µSv/h`;
      },
    },
    xAxis:{type:'time',min:visibleFrom,max:now+2000,axisLabel:{color:'#80abc6',fontSize:10,formatter:(n:number)=>new Intl.DateTimeFormat(languageLocale[language],{hour:'2-digit',minute:'2-digit'}).format(new Date(n))},axisLine:{lineStyle:{color:'#294762'}},splitLine:{show:false}},
    yAxis:{type:'value',scale:true,name:'µSv/h',nameTextStyle:{color:'#7eacc4'},axisLabel:{color:'#80abc6',fontSize:10},splitLine:{lineStyle:{color:'#1c3b57',type:'dashed'}}},
    dataZoom:[{id:'rate-inside',type:'inside',filterMode:'none',startValue:from,endValue:to,rangeMode:['value','value'],throttle:50},
      {id:'rate-slider',type:'slider',filterMode:'none',startValue:from,endValue:to,rangeMode:['value','value'],bottom:5,height:16,showDetail:false,showDataShadow:false,borderColor:'#294762',fillerColor:'rgba(101,214,255,.13)',handleStyle:{color:'#65d6ff'},textStyle:{color:'#80abc6'}}],
    series:[{id:'dose-rate',name:t('measuredRate'),type:'line',sampling:'lttb',clip:true,showSymbol:recent.length<2,symbolSize:7,smooth:false,data:recent.map(p=>[p.at,p.value]),lineStyle:{width:2,color:'#65d6ff'},itemStyle:{color:'#8eeaff'},markPoint:latest&&latest.at>=from&&latest.at<=to?{data:[{name:'latest',coord:[latest.at,latest.value],symbolSize:9}],itemStyle:{color:'#9eecff'}}:{data:[]}}],
  };
  return <section className={`quiet-panel live-rate-section ${compact?'live-rate-compact':''}`} aria-label={t('rateHistory')}>
    <div className="panel-heading"><Activity size={19}/><h2>{t('latestRate')}</h2><span className="readout-live">{(mode==='simulation'?simulation?.running&&!simulationOffline:latest)&&<span className={`live-indicator ${mode==='simulation'?'is-simulated':''}`}/>}{mode==='simulation'?(simulationOffline?t('apiOffline'):!simulation?t('waitingData'):simulation.running?t('simulationActive'):simulationCopy[language].paused):mode==='real'?(latest?t('live'):lastSample?t('historicalReading'):t('waitingData')):t('noData')}</span></div>
    <div className="live-rate-summary"><div><strong>{latest?latest.value.toFixed(3):'—'} <small>µSv/h</small></strong><p>{personal?t('personalExposure'):t('rateHistory')}</p></div><span>{lastSample?`${latest?'':`${t('staleReading')} · `}${formattedClock(lastSample.at,language,true)}`:t('never')}</span></div>
    <div className="chart-wrap" data-view-from={from} data-view-to={to}>{recent.length? <ReactECharts key={scope} ref={chartRef} option={option} onEvents={{datazoom:rememberZoom}} replaceMerge={['series']} lazyUpdate style={{height:compact?210:260,width:'100%'}}/>:<div className="empty-rate-chart"><Radio size={22}/><span>{t('realtimeWaiting')}</span></div>}</div>
    {recent.length>0&&<div className="chart-interaction-note"><span>{c.zoom}</span><button type="button" onClick={()=>setZoom(null)}>{c.live}</button></div>}
    <p className="panel-explain">{mode==='simulation'?t('recording'):personal?t('crewHistoryNote'):mode==='real'?t('unsupportedSource'):t('noTelemetry')}</p>
  </section>;
}
