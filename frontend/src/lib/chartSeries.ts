import type { RatePoint } from '@shared/radiation';

/** Presentation only: never use chart decimation as input to dose integration. */
export function chronologicalRates(points:RatePoint[],from:number,to:number):RatePoint[]{
  const byTime=new Map<number,RatePoint>();
  for(const point of points)if(Number.isFinite(point.at)&&Number.isFinite(point.value)&&point.value>=0&&point.at>=from&&point.at<=to)byTime.set(point.at,point);
  return [...byTime.values()].sort((a,b)=>a.at-b.at);
}

export const chartCopy={
  en:{zoom:'Scroll or pinch to zoom · drag the lower bar to navigate',live:'Live view',demoScale:'Illustrative accumulated scale · not clinical',low:'Lower',attention:'Intermediate',high:'Higher'},
  pt:{zoom:'Role ou pince para aproximar · arraste a barra inferior para navegar',live:'Vista ao vivo',demoScale:'Escala acumulada ilustrativa · não clínica',low:'Baixa',attention:'Intermediária',high:'Elevada'},
  es:{zoom:'Desplace o pellizque para ampliar · arrastre la barra inferior para navegar',live:'Vista en vivo',demoScale:'Escala acumulada ilustrativa · no clínica',low:'Baja',attention:'Intermedia',high:'Elevada'},
};

/** Fictional accumulated-dose display bands, never applied to observed data. */
export function accumulatedDemoBand(doseMicroSv:number|null,period:'daily'|'weekly'){
  if(doseMicroSv===null||!Number.isFinite(doseMicroSv)||doseMicroSv<0)return 'unknown';
  // Display references only: 0.45 / 0.58 µSv/h × 24 or 168 h. No medical meaning.
  const hours=period==='daily'?24:168;
  return doseMicroSv<.45*hours?'low':doseMicroSv<.58*hours?'attention':'high';
}
