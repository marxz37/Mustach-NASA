import type { RatePoint } from '@shared/radiation';

/** Presentation only: never use chart decimation as input to dose integration. */
export function chronologicalRates(points:RatePoint[],from:number,to:number):RatePoint[]{
  const byTime=new Map<number,RatePoint>();
  for(const point of points)if(Number.isFinite(point.at)&&Number.isFinite(point.value)&&point.value>=0&&point.at>=from&&point.at<=to)byTime.set(point.at,point);
  return [...byTime.values()].sort((a,b)=>a.at-b.at);
}

export const chartCopy={
  en:{zoom:'Scroll or pinch to zoom · drag the lower bar to navigate',live:'Live view'},
  pt:{zoom:'Role ou pince para aproximar · arraste a barra inferior para navegar',live:'Vista ao vivo'},
  es:{zoom:'Desplace o pellizque para ampliar · arrastre la barra inferior para navegar',live:'Vista en vivo'},
};
