import type { SolarForecastModel } from './solar';
import type { RatePoint } from './radiation';

/** Fictional crew for interface demonstrations. No names, photos or metrics refer to NASA personnel. */
export interface DemoCrewMember {
  id: string; name: string; role: string; rolePt: string; roleEs: string;
  mission: string; portrait: string; multiplier: number; heartRate: number; spo2: number;
  sleepHours: number; activity: number;
}
export const DEMO_CREW: DemoCrewMember[] = [
  { id:'maya', name:'Maya Bennett',role:'Flight Commander',rolePt:'Comandante de voo',roleEs:'Comandante de vuelo',mission:'HORIZON-01',portrait:'maya-chen.webp',multiplier:1.05,heartRate:68,spo2:98,sleepHours:7.4,activity:79 },
  { id:'alex', name:'Alex Kim',role:'Science Specialist',rolePt:'Especialista científico',roleEs:'Especialista científico',mission:'HORIZON-01',portrait:'alex-kim.webp',multiplier:.93,heartRate:72,spo2:97,sleepHours:7.1,activity:84 },
  { id:'elena', name:'Elena Reyes',role:'Medical Officer',rolePt:'Oficial médica',roleEs:'Oficial médico',mission:'HORIZON-01',portrait:'elena-reyes.webp',multiplier:.98,heartRate:65,spo2:99,sleepHours:8.0,activity:86 },
  { id:'amir', name:'Amir Haddad',role:'EVA Engineer',rolePt:'Engenheiro EVA',roleEs:'Ingeniero EVA',mission:'HORIZON-01',portrait:'amir-haddad.webp',multiplier:1.11,heartRate:74,spo2:98,sleepHours:6.8,activity:75 },
];

/** Fixed 7-day fixture, 5 min cadence, plus live synthetic updates. Values are illustrative only. */
export function demoEquivalentRate(timestamp:number):number {
  const phase=timestamp / 7_200_000;
  const surge = Math.max(0, Math.sin(timestamp / 11_000_000 + 1.7)) ** 8 * 0.21;
  return Math.max(.09,.43 + .085 * Math.sin(phase) + .065 * Math.sin(phase*.31) + surge);
}
export function demoSeries(now:number):RatePoint[] {
  const slot=300_000;
  const t=Math.floor(now/slot)*slot;
  const out:RatePoint[]=[];
  for (let i=7*24*12;i>=0;i--) {const at=t-i*slot;out.push({at,value:demoEquivalentRate(at)});}
  return out;
}
export function demoPersonalSeries(points:RatePoint[],crew:DemoCrewMember):RatePoint[] {
  return points.map(p=>({at:p.at,value:Math.max(.015,p.value*crew.multiplier+0.012*Math.sin(p.at/1_700_000+crew.multiplier))}));
}
/** Scenario data, NOT a real NOAA/CCMC/NASA prediction. */
export function demoSolarModel(now:number):SolarForecastModel {
  const hour=3_600_000;
  const iso=(offset:number)=>new Date(now+offset*hour).toISOString();
  return {id:'demo-sep-01',source:'MUSTACH SYNTHETIC FIXTURE',provider:'MUSTACH LAB',model:'SYN-SEP / 01',provenance:'FORECAST',issued_at:iso(-.5),valid_from:iso(0),valid_until:iso(12),occurrence_probability_percent:18,peak_proton_flux:2.4,peak_proton_flux_unit:'pfu (>10 MeV)',proton_energy_min_mev:10,proton_energy_max_mev:100,event_start_at:iso(4),event_peak_at:iso(7),event_end_at:iso(10)};
}

/** Illustrative accumulated 7-day total for independent web-watch previews. */
export function demoWeeklyDoseMs(crew:DemoCrewMember, now:number):number {
  const points=demoPersonalSeries(demoSeries(now),crew);
  let total=0;
  for(let i=1;i<points.length;i++){
    total+=(points[i-1].value+points[i].value)/2*(points[i].at-points[i-1].at)/3_600_000;
  }
  return total/1000;
}
