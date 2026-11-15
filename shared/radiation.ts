/** Dosimetry helper. Rates must already be compatible equivalent-dose rates in µSv/h.
 * Returns null when no valid consecutive interval is available; never fills missing data.
 */
export interface RatePoint { at: number; value: number; }
export interface TimeSpan { start: number; end: number; }
export function integrateEquivalentDose(points: RatePoint[], spans: TimeSpan[], maxGapMs: number): number | null {
  if (maxGapMs <= 0 || !spans.length || points.length < 2) return null;
  const data = points.filter(p => Number.isFinite(p.at) && Number.isFinite(p.value) && p.value >= 0).sort((a,b)=>a.at-b.at);
  let totalMicroSv = 0;
  let hasCoverage = false;
  for (const span of spans) {
    if (span.end <= span.start) continue;
    for (let i=1;i<data.length;i++) {
      const a=data[i-1], b=data[i], gap=b.at-a.at;
      if (gap<=0 || gap>maxGapMs) continue;
      const from=Math.max(a.at,span.start), to=Math.min(b.at,span.end);
      if (to<=from) continue;
      const fromRate=a.value+(b.value-a.value)*((from-a.at)/gap);
      const toRate=a.value+(b.value-a.value)*((to-a.at)/gap);
      totalMicroSv += ((fromRate+toRate)/2)*((to-from)/3_600_000);
      hasCoverage=true;
    }
  }
  return hasCoverage ? totalMicroSv : null;
}
export function readableDuration(ms:number):string {
  const sec=Math.max(0,Math.floor(ms/1000));
  return [Math.floor(sec/3600),Math.floor((sec%3600)/60),sec%60].map(x=>String(x).padStart(2,'0')).join(':');
}
/** Coverage of the same consecutive intervals accepted by integrateEquivalentDose. */
export function equivalentDoseCoverage(points: RatePoint[], span: TimeSpan, maxGapMs: number): number {
  if (maxGapMs <= 0 || span.end <= span.start) return 0;
  const data = points.filter(p => Number.isFinite(p.at) && Number.isFinite(p.value) && p.value >= 0).sort((a,b)=>a.at-b.at);
  let coveredMs = 0;
  for (let i = 1; i < data.length; i++) {
    const a = data[i - 1], b = data[i], gap = b.at - a.at;
    if (gap > 0 && gap <= maxGapMs) coveredMs += Math.max(0, Math.min(b.at, span.end) - Math.max(a.at, span.start));
  }
  return coveredMs;
}
/** Cumulative µSv for a chart, using the same clipped intervals as the total.
 * Nulls break the line at missing intervals; no dose is added over a gap.
 */
export function cumulativeEquivalentDose(points: RatePoint[], span: TimeSpan, maxGapMs: number): [number, number | null][] {
  const data = points.filter(p => Number.isFinite(p.at) && Number.isFinite(p.value) && p.value >= 0).sort((a,b)=>a.at-b.at);
  const out: [number, number | null][] = [];
  let total = 0;
  let continuous = false;
  for (let i = 1; i < data.length; i++) {
    const a = data[i - 1], b = data[i];
    const from = Math.max(a.at, span.start), to = Math.min(b.at, span.end);
    if (to <= from) continue;
    const dose = integrateEquivalentDose([a, b], [{ start: from, end: to }], maxGapMs);
    if (dose === null) { continuous = false; continue; }
    if (!continuous) {
      if (out.length) out.push([from, null]);
      out.push([from, total]);
    }
    total += dose;
    out.push([to, total]);
    continuous = true;
  }
  return out;
}
export function toValidRate(value:number,unit:string,kind:string): number | null {
  if (kind!=='dose_equivalent_rate' || !Number.isFinite(value) || value<0) return null;
  if (unit==='µSv/h' || unit==='uSv/h' || unit==='μSv/h') return value;
  if (unit==='mSv/h') return value*1000;
  return null;
}
