import {test,expect} from '@playwright/test';
import type {SimulationCommand,SimulationState} from '../../shared/simulation';

test('actual shared stream stays chronological and legible at 1x/10x/60x; watch shows the same live scenario and time',async({page,context,request})=>{
  test.skip(process.env.MUSTACH_LIVE_API!=='1','Requires actual FastAPI and both front-ends');
  test.setTimeout(60000);
  let state:SimulationState=await request.get('/api/v1/demo/simulation').then(r=>r.json());
  const previous={speed:state.speed,running:state.running,scenario:state.scenario};
  const send=async(action:SimulationCommand['action'],extra:Partial<SimulationCommand>={})=>{
    state=await request.get('/api/v1/demo/simulation').then(r=>r.json());
    const response=await request.post('/api/v1/demo/simulation',{data:{action,expected_revision:state.revision,...extra}});
    expect(response.ok()).toBeTruthy();state=await response.json();
  };
  const watch=await context.newPage();
  try{
    await send('select',{scenario:'normal'});await send('speed',{speed:60});await send('resume');
    await page.goto('/');await watch.goto('http://127.0.0.1:5174/');
    await page.waitForTimeout(10500); // Ten simulated minutes, not ten minutes of wall-clock waiting.
    const rate=page.locator('.live-rate-section').first();
    let lastTime=0;
    for(const speed of [1,10,60] as const){
      await send('speed',{speed});await send('resume');await page.waitForTimeout(1300);await send('pause');
      const times=state.points.map(p=>p.at);
      expect(times).toEqual([...new Set(times)].sort((a,b)=>a-b));
      expect(times.at(-1)).toBe(state.now);expect(state.now).toBeGreaterThan(lastTime);lastTime=state.now;
      await expect(watch.getByTestId('watch-simulation-rate')).toContainText(state.rate.toFixed(3));
      await expect(watch.locator('.watch-main-desc')).toContainText(`${speed}×`);
      await rate.scrollIntoViewIfNeeded();await rate.screenshot({path:`test-results/live-rate-${speed}x.png`});
    }
    await send('select',{scenario:'ongoing'});
    await expect(watch.locator('.watch-main-title')).toHaveText('Event in progress');
    await expect(watch.getByTestId('watch-simulation-rate')).toContainText(state.rate.toFixed(3));
    await watch.setViewportSize({width:320,height:740});
    await watch.locator('.watch-screen').screenshot({path:'test-results/live-watch-scenario.png'});
    await page.locator('.history-section').first().getByRole('button',{name:'Last 7 days'}).click();
    await page.locator('.history-section').first().screenshot({path:'test-results/live-weekly-history.png'});
  }finally{
    await send('select',{scenario:previous.scenario});await send('speed',{speed:previous.speed});await send(previous.running?'resume':'pause');
    await watch.close();
  }
});
