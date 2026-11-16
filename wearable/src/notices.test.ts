import {describe,it,expect} from 'vitest';
import {consumeArrival,noticeCopy,simulatedSolarNotices} from './notices';
import {simulationFixture} from '../../shared/testing/simulationFixture';
describe('SEP arrival ledger',()=>{
  it('consumes each arrival only once across polling and language changes',()=>{
    const seen=new Set<string>();const ack=new Set<string>();
    expect(consumeArrival('event-a',seen,ack)).toBe(true);
    expect(consumeArrival('event-a',seen,ack)).toBe(false);
    expect(consumeArrival('event-b',seen,ack)).toBe(true);
    const restored=new Set([...seen]);
    expect(consumeArrival('event-a',restored,ack)).toBe(false);
  });
  it('never consumes an already acknowledged event',()=>{
    expect(consumeArrival('ack',new Set(),new Set(['ack']))).toBe(false);
  });
  it('provides the same fields for all three languages',()=>{
    expect(Object.keys(noticeCopy.pt)).toEqual(Object.keys(noticeCopy.en));
    expect(Object.keys(noticeCopy.es)).toEqual(Object.keys(noticeCopy.en));
  });
});

describe('solar notice eligibility in the shared simulation',()=>{
  const base=simulationFixture(Date.UTC(2026,10,15,12));
  it('only notifies predicted and ongoing events, not normal/recovery or a high ambient rate alone',()=>{
    expect(simulatedSolarNotices(base,'en')).toEqual([]);
    expect(simulatedSolarNotices({...base,scenario:'recovery',rate:100},'en')).toEqual([]);
    const predicted=simulatedSolarNotices({...base,scenario:'predicted',solar_model:{...base.solar_model,occurrence_probability_percent:65}},'pt');
    expect(predicted[0].code).toBe('forecast_attention');
    expect(predicted[0].detail).toContain('65%');
    expect(predicted[0].provenance).toBe('SIMULATED');
    expect(simulatedSolarNotices({...base,scenario:'ongoing'},'en')[0].code).toBe('proton_observed');
  });
  it('rejects missing, expired, future-issued and unbounded forecasts using demo time',()=>{
    expect(simulatedSolarNotices(undefined,'en')).toEqual([]);
    for(const solar_model of [
      {...base.solar_model,valid_until:new Date(base.now-1).toISOString()},
      {...base.solar_model,issued_at:new Date(base.now+1).toISOString()},
      {...base.solar_model,valid_until:null},
    ])expect(simulatedSolarNotices({...base,scenario:'predicted',solar_model},'en')).toEqual([]);
  });
});
