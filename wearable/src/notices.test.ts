import {describe,it,expect} from 'vitest';
import {consumeArrival,noticeCopy} from './notices';
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
