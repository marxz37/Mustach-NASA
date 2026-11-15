import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Language, TranslationKey } from '@shared/i18n';
import { translate } from '@shared/i18n';
import { integrateEquivalentDose, toValidRate, type RatePoint, type TimeSpan } from '@shared/radiation';
import { getApiStatus, getMeasurements, getWearableConnection } from '@/services/api';

type DataMode = 'real' | 'simulation' | 'none';
type EvaState = 'ready' | 'running' | 'paused' | 'finished';
interface EvaSpan { start: number; end: number | null; }
interface AppState {
  language: Language; setLanguage:(x:Language)=>void; t:(key:TranslationKey)=>string;
  mode:DataMode; setMode:(x:DataMode)=>void; now:number;
  apiOnline:boolean; lastApiCheck:number|null; lastMeasurement:number|null; wearableLastSeen:number|null; wearablePreviewActive:boolean;
  equivalentPoints:RatePoint[]; personalPoints:RatePoint[]; absorbedRate:number|null; latestEquivalent:number|null;
  simulated:boolean; isObserved:boolean; evaState:EvaState; evaElapsedMs:number; evaDoseMicroSv:number|null;
  evaStart:()=>void; evaPause:()=>void; evaResume:()=>void; evaFinish:()=>void; evaReset:()=>void;
  totalDoseMicroSv:(period:'daily'|'weekly',personal?:boolean)=>number|null;
}
const Context=createContext<AppState|null>(null);
const languageFromStorage=():Language=>{
  try {const saved=localStorage.getItem('mustach-language');return saved==='pt'||saved==='es'?saved:'en';}catch{return 'en';}
};
function fakeRate(now:number):number {
  const phase=now/8000;
  // Deterministic SYNTHETIC signal; never attribute it to an astronaut or NASA sensor.
  return Math.max(0.05,0.55+Math.sin(phase)*0.17+Math.sin(phase*0.31)*0.06);
}
export function AppProvider({children}:{children:ReactNode}) {
  const [language,setLanguageState]=useState<Language>(languageFromStorage);
  const setLanguage=(next:Language)=>{setLanguageState(next);try{localStorage.setItem('mustach-language',next);}catch{/* storage optional */}};
  const t=(key:TranslationKey)=>translate(language,key);
  const [mode,setModeState]=useState<DataMode>('none');
  const [now,setNow]=useState(Date.now());
  const [simulatedPoints,setSimulatedPoints]=useState<RatePoint[]>([]);
  const [evaState,setEvaState]=useState<EvaState>('ready');
  const [evaSpans,setEvaSpans]=useState<EvaSpan[]>([]);
  const setMode=(next:DataMode)=>{
    // A session is reset when a user changes provenance. Never mix sources in a dose total.
    setModeState(next);setEvaState('ready');setEvaSpans([]);setSimulatedPoints([]);
  };
  useEffect(()=>{
    if(mode!=='simulation')return;
    const add=()=>{const at=Date.now();setNow(at);setSimulatedPoints(old=>[...old.filter(p=>p.at>=at-7*86_400_000),{at,value:fakeRate(at)}].slice(-4500));};
    add(); const timer=window.setInterval(add,2000);return ()=>window.clearInterval(timer);
  },[mode]);
  useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),1000);return ()=>window.clearInterval(timer);},[]);
  const status=useQuery({queryKey:['api-status'],queryFn:getApiStatus,refetchInterval:15_000,retry:1});
  const samples=useQuery({queryKey:['measurements'],queryFn:getMeasurements,enabled:mode==='real',refetchInterval:10_000,retry:1});
  const wearable=useQuery({queryKey:['wearable-connection'],queryFn:getWearableConnection,refetchInterval:15_000,retry:1});
  const observed=useMemo(()=>samples.data?.filter(x=>x.provenance==='OBSERVED')??[],[samples.data]);
  const measuredPoints=useMemo(()=>{
    const byInstrument=new Map<string,RatePoint[]>();
    for(const m of observed){
      const v=toValidRate(m.value,m.unit,m.quantity),at=Date.parse(m.measured_at);
      if(v===null||!Number.isFinite(at))continue;
      const key=`${m.source}/${m.instrument}/${m.mission}`;
      byInstrument.set(key,[...(byInstrument.get(key)??[]),{at,value:v}]);
    }
    // Never integrate an interleaved series from unrelated instruments.
    const groups=[...byInstrument.values()];
    return (groups.sort((a,b)=>Math.max(...b.map(p=>p.at))-Math.max(...a.map(p=>p.at)))[0]??[]).sort((a,b)=>a.at-b.at);
  },[observed]);
  // No registered crewmember or dosimeter pairing exists yet. Keep personal readings unavailable.
  const personalPoints:RatePoint[]=[];
  const equivalentPoints=mode==='simulation'?simulatedPoints:mode==='real'?measuredPoints:[];
  const latestEquivalent=equivalentPoints.length&&now-equivalentPoints[equivalentPoints.length-1].at<120_000?equivalentPoints[equivalentPoints.length-1].value:null;
  const latestAbsorbed=mode==='real'?[...observed].reverse().find(x=>x.quantity==='absorbed_dose_rate'&&['µGy/h','uGy/h','μGy/h'].includes(x.unit)):undefined;
  const absorbedRate=mode==='simulation'&&latestEquivalent!==null?0.7+0.2*Math.sin(now/25000):latestAbsorbed&&now-Date.parse(latestAbsorbed.measured_at)<120_000?latestAbsorbed.value:null;
  const lastMeasurement=mode==='real'&&observed.length?Math.max(...observed.map(x=>Date.parse(x.measured_at)).filter(Number.isFinite)):mode==='simulation'&&simulatedPoints.length?simulatedPoints[simulatedPoints.length-1].at:null;
  const openSpans:TimeSpan[]=evaSpans.map(s=>({start:s.start,end:s.end??now}));
  const evaElapsedMs=openSpans.reduce((sum,s)=>sum+Math.max(0,s.end-s.start),0);
  // Only demonstrative source can estimate an unassigned EVA. For real data, an authenticated
  // personal device/crew association will be required in a later version.
  const evaDoseMicroSv=mode==='simulation'?integrateEquivalentDose(simulatedPoints,openSpans,5000):null;
  const evaStart=()=>{if(evaState!=='ready')return;setEvaSpans([{start:Date.now(),end:null}]);setEvaState('running');};
  const evaPause=()=>{if(evaState!=='running')return;const end=Date.now();setEvaSpans(v=>v.map((s,i)=>i===v.length-1?{...s,end}:s));setEvaState('paused');};
  const evaResume=()=>{if(evaState!=='paused')return;setEvaSpans(v=>[...v,{start:Date.now(),end:null}]);setEvaState('running');};
  const evaFinish=()=>{if(evaState!=='running'&&evaState!=='paused')return;const end=Date.now();setEvaSpans(v=>v.map(s=>s.end===null?{...s,end}:s));setEvaState('finished');};
  const evaReset=()=>{setEvaSpans([]);setEvaState('ready');};
  const totalDoseMicroSv=(period:'daily'|'weekly',personal=false)=>{
    const cutoff=now-(period==='daily'?86_400_000:7*86_400_000);
    const data=personal?personalPoints:equivalentPoints;
    const maxGap=mode==='simulation'?5000:60_000;
    // For crew, simulated data is unassigned and must never be represented as personal dose.
    if(personal&&mode!=='real')return null;
    return integrateEquivalentDose(data,[{start:cutoff,end:now}],maxGap);
  };
  const lastApiCheck=status.isSuccess?status.dataUpdatedAt:null;
  const wearableLastSeen=wearable.data?.last_seen_at?Date.parse(wearable.data.last_seen_at):null;
  const wearablePreviewActive=Boolean(wearableLastSeen&&now-wearableLastSeen<90_000);
  const state:AppState={language,setLanguage,t,mode,setMode,now,apiOnline:status.isSuccess&&!status.isError,lastApiCheck,lastMeasurement,wearableLastSeen,wearablePreviewActive,equivalentPoints,personalPoints,absorbedRate,latestEquivalent,simulated:mode==='simulation',isObserved:mode==='real',evaState,evaElapsedMs,evaDoseMicroSv,evaStart,evaPause,evaResume,evaFinish,evaReset,totalDoseMicroSv};
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
export function useApp(){const c=useContext(Context);if(!c)throw Error('AppProvider missing');return c;}
