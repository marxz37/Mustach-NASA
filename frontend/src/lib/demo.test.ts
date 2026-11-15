import { describe,it,expect } from 'vitest';
import { DEMO_CREW, demoSeries, demoPersonalSeries, demoSolarModel, demoWeeklyDoseMs } from '@shared/demo';
import { integrateEquivalentDose } from '@shared/radiation';
describe('purely synthetic UI fixtures',()=>{
 const now=Date.UTC(2026,10,15,12,0,0);
 it('provides a continuous week of illustrative readings',()=>{
   const points=demoSeries(now);
   expect(points.length).toBe(2017);
   expect(points[0].at).toBe(now-7*86_400_000);
   expect(points.every(p=>p.value>=0&&Number.isFinite(p.value))).toBe(true);
   expect(integrateEquivalentDose(points,[{start:points[0].at,end:now}],310_000)).toBeGreaterThan(0);
 });
 it('keeps fictional crew personal streams differentiated',()=>{
   const a=demoPersonalSeries(demoSeries(now),DEMO_CREW[0]);
   const b=demoPersonalSeries(demoSeries(now),DEMO_CREW[1]);
   expect(a[100].value).not.toBe(b[100].value);
   expect(demoWeeklyDoseMs(DEMO_CREW[0],now)).toBeGreaterThan(0);
 });
 it('clearly identifies its solar forecast as a fixture',()=>{
   const m=demoSolarModel(now);expect(m.source).toContain('SYNTHETIC');expect(m.occurrence_probability_percent).toBe(18);
 });
});
