import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, X } from 'lucide-react';
import { getIngestionRuns, getMeasurements, getSolarAlerts, getSolarForecast, type IngestionRun } from '@/services/api';

interface Notice {id:string;type:string;message:string;source:string;at:string;}
function savedReads():string[]{try{return JSON.parse(localStorage.getItem('mustach-read-notices')??'[]') as string[];}catch{return [];}}

export function NotificationCenter(){
  const [open,setOpen]=useState(false);
  const [read,setRead]=useState<string[]>(savedReads);
  const runs=useQuery({queryKey:['science-runs'],queryFn:getIngestionRuns,refetchInterval:60_000,retry:1});
  const alerts=useQuery({queryKey:['solar-alerts'],queryFn:getSolarAlerts,refetchInterval:60_000,retry:1});
  const forecast=useQuery({queryKey:['solar-forecast'],queryFn:getSolarForecast,refetchInterval:60_000,retry:1});
  const measurements=useQuery({queryKey:['all-measurements-notices'],queryFn:getMeasurements,refetchInterval:60_000,retry:1});
  const notices:Notice[]=[];
  const latestRuns=new Map<string,IngestionRun>();
  for(const run of runs.data??[])if(!latestRuns.has(run.source))latestRuns.set(run.source,run);
  for(const run of latestRuns.values())if(run.status==='ERROR')notices.push({id:`run-${run.id}`,type:run.source==='local-measurement'?'Leitura incompatível':'Fonte indisponível',message:run.error??'Falha na consulta externa',source:run.source,at:run.attempted_at});
  const latestForecast=!forecast.isError?forecast.data?.models[0]:undefined;
  if(latestForecast)notices.push({id:`forecast-${latestForecast.id}`,type:'Nova previsão disponível',message:`${latestForecast.model} · previsão emitida em ${latestForecast.issued_at}`,source:latestForecast.source,at:latestForecast.issued_at});
  for(const alert of (alerts.isError?[]:alerts.data??[]).filter(item=>Date.now()-Date.parse(item.issued_at)<86_400_000).slice(0,4))
    notices.push({id:`alert-${alert.id}`,type:`Aviso oficial · ${alert.kind}`,message:alert.message,source:alert.source,at:alert.issued_at});
  const review=(measurements.isError?[]:measurements.data??[]).find(item=>item.quality==='REVIEW_REQUIRED');
  if(review)notices.push({id:`quality-${review.id}`,type:'Revisão de qualidade',message:'Uma medição requer revisão antes de uso.',source:review.source,at:review.measured_at});
  const sensor=(measurements.isError?[]:measurements.data??[]).find(item=>item.source==='LOCAL_SENSOR');
  if(sensor&&Date.now()-Date.parse(sensor.measured_at)>300_000)notices.push({id:`stale-${sensor.id}`,type:'Medição desatualizada',message:'Última leitura de sensor local tem mais de 5 minutos.',source:sensor.source,at:sensor.measured_at});
  if(runs.isError)notices.unshift({id:'local-api-offline',type:'API local indisponível',message:'Não é possível confirmar dados atualizados.',source:'Mustach',at:new Date().toISOString()});
  const unread=notices.filter(item=>!read.includes(item.id)).length;
  const markRead=(id:string)=>{const next=[...new Set([...read,id])].slice(-200);setRead(next);try{localStorage.setItem('mustach-read-notices',JSON.stringify(next));}catch{/* optional */}};
  return <div className="notification-center"><button type="button" className="notification-trigger" onClick={()=>setOpen(value=>!value)} aria-label={`Notificações, ${unread} não lidas`} aria-expanded={open}><Bell size={17}/>{unread>0&&<span className="notification-count">{unread}</span>}</button>
    {open&&<div className="notification-popover" role="region" aria-label="Notificações científicas"><div className="notification-head"><strong>Notificações</strong><button type="button" onClick={()=>setOpen(false)} aria-label="Fechar notificações"><X size={15}/></button></div>
      {notices.length===0?<p>Sem avisos no momento.</p>:notices.map(item=><article key={item.id} className={read.includes(item.id)?'is-read':''}><div><strong>{item.type}</strong><span>{item.source}</span></div><p>{item.message}</p><small>{item.at}</small>{!read.includes(item.id)&&<button type="button" onClick={()=>markRead(item.id)}>Marcar como lida</button>}</article>)}
      <p className="notification-disclaimer">Avisos informativos; não são alertas clínicos.</p></div>}
  </div>;
}
