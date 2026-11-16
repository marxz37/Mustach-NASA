import {describe,it,expect} from 'vitest';
import {accumulatedDemoBand,chronologicalRates} from './chartSeries';
describe('chart presentation without changing dose inputs',()=>{
  it('sorts, deduplicates and filters invalid points without mutating the source',()=>{
    const source=[{at:30,value:.5},{at:10,value:.3},{at:20,value:.4},{at:20,value:.45},{at:NaN,value:1},{at:15,value:-1}];
    const snapshot=source.map(p=>({...p}));
    expect(chronologicalRates(source,10,30)).toEqual([{at:10,value:.3},{at:20,value:.45},{at:30,value:.5}]);
    expect(source).toEqual(snapshot);
  });
  it('only shows accumulated illustrative bands for valid totals, with period-specific references',()=>{
    expect(accumulatedDemoBand(null,'daily')).toBe('unknown');
    expect(accumulatedDemoBand(8,'daily')).toBe('low');
    expect(accumulatedDemoBand(12,'daily')).toBe('attention');
    expect(accumulatedDemoBand(15,'daily')).toBe('high');
    expect(accumulatedDemoBand(15,'weekly')).toBe('low');
  });
});
