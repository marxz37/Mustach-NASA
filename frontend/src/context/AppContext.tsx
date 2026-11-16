import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Language, TranslationKey } from '@shared/i18n';
import { translate } from '@shared/i18n';
import { integrateEquivalentDose, toValidRate, type RatePoint, type TimeSpan } from '@shared/radiation';
import { getApiStatus, getMeasurements, getWearableConnection } from '@/services/api';
import { DEMO_CREW, demoPersonalSeries, type DemoCrewMember } from '@shared/demo';
import { getSimulation, type SimulationState } from '@shared/simulation';

type DataMode = 'real' | 'simulation' | 'none';
type EvaState = 'ready' | 'running' | 'paused' | 'finished';
interface EvaSpan { start: number; end: number | null; }
interface AppState {
  language: Language; setLanguage:(x:Language)=>void; t:(key:TranslationKey)=>string;
  mode:DataMode; setMode:(x:DataMode)=>void; now:number;
  apiOnline:boolean; lastApiCheck:number|null; lastMeasurement:number|null; wearableLastSeen:number|null; wearablePreviewActive:boolean;
  equivalentPoints:RatePoint[]; personalPoints:RatePoint[]; absorbedRate:number|null; latestEquivalent:number|null;
  selectedCrew:DemoCrewMember; setSelectedCrewId:(id:string)=>void; simulated:boolean; isObserved:boolean; evaState:EvaState; evaElapsedMs:number; evaDoseMicroSv:number|null;
  evaStart:()=>void; evaPause:()=>void; evaResume:()=>void; evaFinish:()=>void; evaReset:()=>void;
  totalDoseMicroSv:(period:'daily'|'weekly',personal?:boolean)=>number|null;
  simulation:SimulationState|undefined; simulationOffline:boolean;
}
const Context=createContext<AppState|null>(null);
const languageFromStorage=():Language=>{
  try {const saved=localStorage.getItem('mustach-language');return saved==='pt'||saved==='es'?saved:'en';}catch{return 'en';}
};
export function AppProvider({children}:{children:ReactNode}) {
  const [language,setLanguageState]=useState<Language>(languageFromStorage);
  const setLanguage=(next:Language)=>{setLanguageState(next);try{localStorage.setItem('mustach-language',next);}catch{/* storage optional */}};
  const t=(key:TranslationKey)=>translate(language,key);
  const [mode,setModeState]=useState<DataMode>('simulation');
  const [selectedCrewId,setSelectedCrewId]=useState(DEMO_CREW[0].id);
  const selectedCrew=DEMO_CREW.find(x=>x.id===selectedCrewId)??DEMO_CREW[0];
  const [wallNow,setNow]=useState(Date.now());
  const simulationQuery=useQuery({queryKey:['shared-simulation'],queryFn:()=>getSimulation(import.meta.env.VITE_API_BASE_URL??''),enabled:mode==='simulation',refetchInterval:1000,retry:1});
  const simulation=simulationQuery.data;
  const simulationOffline=simulationQuery.isError;
  const now=mode==='simulation'&&simulation?simulation.now:wallNow;
  const simulatedPoints=useMemo(()=>simulation&&!simulationOffline?simulation.points:[],[simulation,simulationOffline]);
  const [evaState,setEvaState]=useState<EvaState>('ready');
  const [evaSpans,setEvaSpans]=useState<EvaSpan[]>([]);
  const setMode=(next:DataMode)=>{
    // A session is reset when a user changes provenance. Never mix sources in a dose total.
    setModeState(next);setEvaState('ready');setEvaSpans([]);
  };
  useEffect(()=>{setEvaState('ready');setEvaSpans([]);},[simulation?.run_id]);
  useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),1000);return ()=>window.clearInterval(timer);},[]);
  const status=useQuery({queryKey:['api-status'],queryFn:getApiStatus,refetchInterval:15_000,retry:1});
  const samples=useQuery({queryKey:['measurements'],queryFn:getMeasurements,enabled:mode==='real',refetchInterval:10_000,retry:1});
  const wearable=useQuery({queryKey:['wearable-connection'],queryFn:getWearableConnection,refetchInterval:15_000,retry:1});
  const observed=useMemo(()=>samples.isError?[]:samples.data?.filter(x=>x.provenance==='OBSERVED'&&x.scope!=='PERSONAL')??[],[samples.data,samples.isError]);
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
  // DEMO data is assigned only to fictional profiles; real mode still requires a paired dosimeter.
  const personalPoints=useMemo(()=>mode==='simulation'?demoPersonalSeries(simulatedPoints,selectedCrew):[],[mode,simulatedPoints,selectedCrew]);
  const equivalentPoints=mode==='simulation'?simulatedPoints:mode==='real'?measuredPoints:[];
  const latestEquivalent=equivalentPoints.length&&now-equivalentPoints[equivalentPoints.length-1].at>=0&&now-equivalentPoints[equivalentPoints.length-1].at<120_000?equivalentPoints[equivalentPoints.length-1].value:null;
  const latestAbsorbed=mode==='real'?observed.find(x=>x.quantity==='absorbed_dose_rate'&&['µGy/h','uGy/h','μGy/h'].includes(x.unit)):undefined;
  const absorbedRate=mode==='simulation'?null:latestAbsorbed&&now>=Date.parse(latestAbsorbed.measured_at)&&now-Date.parse(latestAbsorbed.measured_at)<120_000?latestAbsorbed.value:null;
  const lastMeasurement=mode==='real'&&observed.length?Math.max(...observed.map(x=>Date.parse(x.measured_at)).filter(Number.isFinite)):mode==='simulation'&&simulatedPoints.length?simulatedPoints[simulatedPoints.length-1].at:null;
  const openSpans:TimeSpan[]=evaSpans.map(s=>({start:s.start,end:s.end??now}));
  const evaElapsedMs=openSpans.reduce((sum,s)=>sum+Math.max(0,s.end-s.start),0);
  // Only demonstrative source can estimate an unassigned EVA. For real data, an authenticated
  // personal device/crew association will be required in a later version.
  const evaDoseMicroSv=mode==='simulation'?integrateEquivalentDose(simulatedPoints,openSpans,310_000):null;
  const evaStart=()=>{if(evaState!=='ready'||(mode==='simulation'&&(!simulation||simulationOffline)))return;setEvaSpans([{start:now,end:null}]);setEvaState('running');};
  const evaPause=()=>{if(evaState!=='running')return;const end=now;setEvaSpans(v=>v.map((s,i)=>i===v.length-1?{...s,end}:s));setEvaState('paused');};
  const evaResume=()=>{if(evaState!=='paused')return;setEvaSpans(v=>[...v,{start:now,end:null}]);setEvaState('running');};
  const evaFinish=()=>{if(evaState!=='running'&&evaState!=='paused')return;const end=now;setEvaSpans(v=>v.map(s=>s.end===null?{...s,end}:s));setEvaState('finished');};
  const evaReset=()=>{setEvaSpans([]);setEvaState('ready');};
  const totalDoseMicroSv=(period:'daily'|'weekly',personal=false)=>{
    const cutoff=now-(period==='daily'?86_400_000:7*86_400_000);
    const data=personal?personalPoints:equivalentPoints;
    const maxGap=mode==='simulation'?310_000:60_000;
    // Personal demo values belong to fictional profiles only; real personal measurements remain unavailable.
    if(personal&&mode!=='simulation')return null;
    return integrateEquivalentDose(data,[{start:cutoff,end:now}],maxGap);
  };
  const lastApiCheck=status.isSuccess?status.dataUpdatedAt:null;
  const wearableLastSeen=wearable.data?.last_seen_at?Date.parse(wearable.data.last_seen_at):null;
  const wearablePreviewActive=Boolean(wearableLastSeen&&wallNow-wearableLastSeen<90_000);
  const state:AppState={simulation,simulationOffline,language,setLanguage,t,mode,setMode,selectedCrew,setSelectedCrewId,now,apiOnline:status.isSuccess&&!status.isError,lastApiCheck,lastMeasurement,wearableLastSeen,wearablePreviewActive,equivalentPoints,personalPoints,absorbedRate,latestEquivalent,simulated:mode==='simulation',isObserved:mode==='real',evaState,evaElapsedMs,evaDoseMicroSv,evaStart,evaPause,evaResume,evaFinish,evaReset,totalDoseMicroSv};
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
export function useApp(){const c=useContext(Context);if(!c)throw Error('AppProvider missing');return c;}
