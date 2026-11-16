import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { SimulationState } from '@shared/simulation';
import type { Language } from '@shared/i18n';
import { formatSolarTime } from '@shared/solar';
import { noticeCopy, type SolarNoticeRecord, consumeArrival } from './notices';

function load(key:string):string[]{try{const v:unknown=JSON.parse(localStorage.getItem(key)??'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string'):[];}catch{return [];}}
function save(key:string,ids:string[]){try{localStorage.setItem(key,JSON.stringify(ids.slice(-500)));}catch{/* optional storage */}}
export function useSolarNotice({mode,simulation,language}:{mode:'simulation'|'real'|'none';simulation?:SimulationState;language:Language}){
  const [acknowledged,setAcknowledged]=useState(()=>load('mustach-sep-ack'));
  const [vibration,setVibration]=useState(()=>{try{return localStorage.getItem('mustach-haptics')==='on';}catch{return false;}});
  const [hapticFailed,setHapticFailed]=useState(false);
  const seen=useRef(new Set(load('mustach-sep-seen')));
  const supported=typeof navigator.vibrate==='function';
  const c=noticeCopy[language];
  const query=useQuery({queryKey:['wearable-solar-notices'],queryFn:async()=>{
    const response=await fetch(`${import.meta.env.VITE_API_BASE_URL??''}/api/v1/wearable/solar-notices`);
    if(!response.ok)throw Error(`Solar notices HTTP ${response.status}`);
    return response.json() as Promise<SolarNoticeRecord[]>;
  },enabled:mode==='real',refetchInterval:5000,retry:1});
  const fictional:SolarNoticeRecord[]=simulation&&['predicted','ongoing'].includes(simulation.scenario)?[{
    id:simulation.solar_model.id,kind:'SIMULATED',source:'RADIANCE LAB',issued_at:simulation.solar_model.issued_at,
    valid_until:simulation.solar_model.valid_until!,code:simulation.scenario==='ongoing'?'proton_observed':'forecast_attention',
    detail:simulation.solar_model.model,provenance:'SIMULATED',
  }]:[];
  const notices=mode==='simulation'?fictional:mode==='real'&&!query.isError?(query.data??[]).filter(n=>Date.parse(n.issued_at)<=Date.now()&&Date.now()<Date.parse(n.valid_until)):[];
  const signature=notices.map(n=>n.id).join('|');
  useEffect(()=>{
    const ids=signature?signature.split('|'):[];
    const arrivals=ids.filter(id=>consumeArrival(id,seen.current,new Set(acknowledged)));
    save('mustach-sep-seen',[...seen.current]);
    if(arrivals.length&&vibration&&supported){try{if(!navigator.vibrate([80,40,80]))setHapticFailed(true);}catch{setHapticFailed(true);}}
  },[signature,acknowledged,vibration,supported]);
  const active=notices.find(n=>!acknowledged.includes(n.id));
  const acknowledge=()=>{if(active){const next=[...acknowledged,active.id];setAcknowledged(next);save('mustach-sep-ack',next);}};
  return {active:!!active,notice:active?<aside className="watch-sep-notice" aria-label={c.title} role="status" data-notice-id={active.id}>
      <strong>{c[active.kind]} · {c[active.code]}</strong><span>{active.source} · {formatSolarTime(active.issued_at,language)}</span>
      <small>{active.detail}</small><button type="button" onClick={acknowledge}>{c.acknowledge}</button>
    </aside>:null,
    settings:<div className="watch-haptic-settings"><button type="button" aria-pressed={vibration} onClick={()=>{const next=!vibration;setVibration(next);setHapticFailed(false);try{localStorage.setItem('mustach-haptics',next?'on':'off');}catch{/* optional */}}}>{c.vibration}: {vibration?c.on:c.off}</button><small>{!supported?c.unsupported:hapticFailed?c.denied:c.experimental}</small>{mode==='real'&&query.isError&&<small role="status">{c.offline}</small>}</div>};
}
