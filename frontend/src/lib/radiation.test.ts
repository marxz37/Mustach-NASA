import {describe,it,expect} from 'vitest';
import {cumulativeEquivalentDose,equivalentDoseCoverage,integrateEquivalentDose,readableDuration,toValidRate} from '@shared/radiation';
describe('integration of equivalent-dose rates',()=>{
  it('returns null without at least two valid readings',()=>expect(integrateEquivalentDose([], [{start:0,end:4000}],10000)).toBeNull());
  it('integrates 2 µSv/h during exactly one hour as 2 µSv',()=>{
    const result=integrateEquivalentDose([{at:0,value:2},{at:3600000,value:2}],[{start:0,end:3600000}],3600001);
    expect(result).toBeCloseTo(2);
  });
  it('does not invent dose across gaps',()=>{
    const value=integrateEquivalentDose([{at:0,value:3},{at:60000,value:3}],[{start:0,end:60000}],5000);
    expect(value).toBeNull();
  });
  it('integrates only active EVA segments, without paused time',()=>{
    const points=[0,1000,2000,3000,4000].map(at=>({at,value:3600}));
    const dose=integrateEquivalentDose(points,[{start:0,end:1000},{start:3000,end:4000}],1500);
    expect(dose).toBeCloseTo(2);
  });
  it('refuses to convert absorbed µGy/h into equivalent µSv/h',()=>{
    expect(toValidRate(10,'µGy/h','absorbed_dose_rate')).toBeNull();
    expect(toValidRate(10,'µGy/h','dose_equivalent_rate')).toBeNull();
    expect(toValidRate(2,'mSv/h','dose_equivalent_rate')).toBe(2000);
  });
  it('formats timer from zero',()=>expect(readableDuration(0)).toBe('00:00:00'));
  it('reports partial coverage, clipping the window and excluding gaps and invalid values',()=>{
    const points=[{at:0,value:1},{at:1000,value:1},{at:5000,value:1},{at:6000,value:1},{at:6500,value:NaN}];
    expect(equivalentDoseCoverage(points,{start:500,end:7000},1500)).toBe(1500);
    expect(equivalentDoseCoverage([],{start:0,end:1000},1500)).toBe(0);
  });
  it('clips the cumulative chart at both window boundaries, matching the total',()=>{
    const points=[{at:0,value:1},{at:3_600_000,value:3}];
    const span={start:900_000,end:2_700_000};
    const chart=cumulativeEquivalentDose(points,span,3_600_000);
    expect(chart[0]).toEqual([span.start,0]);
    expect(chart.at(-1)).toEqual([span.end,integrateEquivalentDose(points,[span],3_600_000)]);
    expect(chart.at(-1)?.[1]).toBeCloseTo(1);
  });
  it('breaks the cumulative line at gaps without adding dose across missing intervals',()=>{
    const points=[0,1000,5000,6000].map(at=>({at,value:3600}));
    const chart=cumulativeEquivalentDose(points,{start:0,end:6000},1500);
    expect(chart).toContainEqual([5000,null]);
    expect(chart.at(-1)).toEqual([6000,2]);
    expect(cumulativeEquivalentDose(points,{start:0,end:6000},500)).toEqual([]);
  });
});
