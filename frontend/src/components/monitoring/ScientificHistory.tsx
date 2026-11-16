import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { Database } from 'lucide-react';
import { getScientificMeasurements } from '@/services/api';
import { useApp } from '@/context/AppContext';

const HISTORICAL_START='2022-04-01T23:00';
const HISTORICAL_END='2022-04-01T23:20';
const asUtc=(value:string)=>`${value}:00Z`;

/** Instrumental history, deliberately separate from the µSv/h dose-equivalent chart. */
export function ScientificHistory(){
  const {mode}=useApp();
  const [start,setStart]=useState(HISTORICAL_START);
  const [end,setEnd]=useState(HISTORICAL_END);
  const [quantity,setQuantity]=useState<'absorbed_dose_rate'|'flux'>('absorbed_dose_rate');
  const valid=Number.isFinite(Date.parse(asUtc(start)))&&Number.isFinite(Date.parse(asUtc(end)))&&end>start;
  const {data,isError}=useQuery({queryKey:['radlab-history',start,end,quantity],
    queryFn:()=>getScientificMeasurements({source:'NASA OSDR RadLab',quantity,start:asUtc(start),end:asUtc(end),limit:2000}),
    enabled:mode==='real'&&valid,retry:1});
  const unit=quantity==='absorbed_dose_rate'?'µGy/h':'cm⁻² sr⁻¹ s⁻¹';
  const points=useMemo(()=>[...(data??[])].filter(row=>row.instrument==='DosTel1').sort((a,b)=>Date.parse(a.measured_at)-Date.parse(b.measured_at)),[data]);
  const chartData:(number|null)[][]=[];
  let covered=0, gaps=0;
  points.forEach((row,index)=>{
    const at=Date.parse(row.measured_at);
    if(index>0){
      const previous=Date.parse(points[index-1].measured_at);
      const gap=at-previous;
      if(gap>600_000){chartData.push([previous+1,null]);gaps++;}
      else if(gap>0)covered+=gap;
    }
    chartData.push([at,row.value]);
  });
  const latest=points.at(-1);
  const option:EChartsOption={animation:false,grid:{top:20,bottom:35,left:65,right:20},tooltip:{trigger:'axis'},
    xAxis:{type:'time',axisLabel:{color:'#88abc1'},axisLine:{lineStyle:{color:'#2c5775'}}},
    yAxis:{type:'value',name:unit,nameTextStyle:{color:'#88abc1'},axisLabel:{color:'#88abc1'},splitLine:{lineStyle:{color:'#17364c',type:'dashed'}}},
    series:[{type:'line',data:chartData,connectNulls:false,symbol:'circle',symbolSize:5,lineStyle:{color:'#70e0fa',width:2},itemStyle:{color:'#70e0fa'}}]};
  return <section className="quiet-panel scientific-history" aria-label="Histórico instrumental RadLab">
    <div className="panel-heading"><Database size={19}/><h2>Histórico instrumental</h2><span>NASA RadLab · DosTel1</span></div>
    <p className="panel-explain">Medição ambiental histórica na ISS. Não é telemetria atual nem dose individual.</p>
    <div className="scientific-filters">
      <label>Início (UTC)<input type="datetime-local" value={start} onChange={event=>setStart(event.target.value)}/></label>
      <label>Fim (UTC)<input type="datetime-local" value={end} onChange={event=>setEnd(event.target.value)}/></label>
      <label>Grandeza<select value={quantity} onChange={event=>setQuantity(event.target.value as typeof quantity)}><option value="absorbed_dose_rate">Taxa de dose absorvida</option><option value="flux">Fluxo de partículas</option></select></label>
    </div>
    {!valid?<p className="panel-explain">Informe um intervalo válido.</p>:mode!=='real'?<p className="panel-explain">Selecione Dados reais para consultar o histórico local.</p>:isError?<p className="panel-explain">API local indisponível. O histórico não pode ser atualizado.</p>:points.length?<>
      <ReactECharts option={option} style={{height:200,width:'100%'}} notMerge lazyUpdate/>
      <p className="panel-explain">{points.length} pontos · {unit} · cobertura entre pontos: {(covered/60_000).toFixed(1)} min · lacunas &gt; 10 min: {gaps}</p>
      <p className="panel-explain">Última medição: {latest?.measured_at} · idade: {Math.floor((Date.now()-Date.parse(latest!.measured_at))/86_400_000)} dias · coleta local: {latest?.collected_at??'não informada'}</p>
    </>:<p className="panel-explain">Sem medições locais nesse intervalo. A coleta não preenche lacunas.</p>}
  </section>;
}
