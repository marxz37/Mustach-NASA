import {describe,it,expect} from 'vitest';
import {integrateEquivalentDose,readableDuration,toValidRate} from '@shared/radiation';
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
});
