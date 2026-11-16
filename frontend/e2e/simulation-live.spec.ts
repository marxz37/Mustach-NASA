import {test,expect} from '@playwright/test';

test('Web and Wearable share four scenarios, pause, speed, restart and honest API outage',async({page,request,context})=>{
  test.skip(process.env.MUSTACH_LIVE_API!=='1','Requires actual FastAPI and both dev servers on 5173/5174');
  let initial=await request.get('/api/v1/demo/simulation').then(r=>r.json());
  for(const command of [{action:'reset'},{action:'speed',speed:1},{action:'start'}]){
    const response=await request.post('/api/v1/demo/simulation',{data:{...command,expected_revision:initial.revision}});
    expect(response.ok()).toBeTruthy();initial=await response.json();
  }
  const watch=await context.newPage();
  await page.goto('/');await watch.goto('http://127.0.0.1:5174/');
  const controls=page.getByRole('region',{name:'Shared simulation'});
  await expect(controls.getByRole('combobox',{name:'Scenario'})).toBeVisible();
  await expect(page.getByRole('button',{name:/Notificações|Notifications/})).toHaveCount(0);
  for(const [scenario,label] of [['normal','Normal conditions'],['predicted','Solar event predicted'],['ongoing','Event in progress'],['recovery','Recovery after event']]){
    await controls.getByRole('combobox',{name:'Scenario',exact:true}).selectOption(scenario);
    await expect(watch.getByTestId('shared-scenario')).toContainText(label,{timeout:7000});
    if(scenario==='normal')await expect(page.locator('.human-heatmap path[data-band]').first()).toHaveAttribute('data-band','baseline');
    if(scenario==='ongoing'){
      await expect(page.locator('.human-heatmap path[data-band]').first()).toHaveAttribute('data-band','high');
      await expect.poll(async()=>Number((await page.locator('.live-rate-summary strong').first().innerText()).split(' ')[0])).toBeGreaterThan(1.5);
      await watch.setViewportSize({width:320,height:740});
      await watch.getByRole('button',{name:'SOLAR ACTIVITY'}).click();
      await watch.locator('.watch-screen').screenshot({path:'test-results/shared-watch-ongoing.png'});
    }
    if(scenario==='predicted'||scenario==='ongoing')await expect(watch.locator('.watch-sep-notice')).toContainText('SIMULATED');
  }
  await controls.getByRole('combobox',{name:'Demo speed'}).selectOption('60');
  await expect(watch.getByTestId('shared-scenario')).toContainText('60×');
  await controls.getByRole('button',{name:'Pause simulation'}).click();
  await expect(watch.getByTestId('shared-scenario')).toContainText('Paused');
  const a=await request.get('/api/v1/demo/simulation').then(r=>r.json());
  await page.waitForTimeout(1200);
  const b=await request.get('/api/v1/demo/simulation').then(r=>r.json());
  expect(a.now).toBe(b.now);expect(a.points).toEqual(b.points);
  await controls.getByRole('button',{name:'Resume simulation'}).click();
  await expect(watch.getByTestId('shared-scenario')).toContainText('Running');
  await controls.getByRole('button',{name:'Restart scenario'}).click();
  await expect(controls.getByTestId('simulation-clock')).toContainText('00:00:00');
  await page.route('**/api/v1/demo/simulation',route=>route.abort());
  await expect(controls).toContainText('Shared simulation unavailable',{timeout:7000});
  await expect(controls.getByRole('button')).toHaveCount(0);
  await page.getByRole('combobox',{name:'Data source'}).selectOption('real');
  await expect(page.locator('.human-heatmap path[data-band]').first()).toHaveAttribute('data-band','unknown');
  await page.getByRole('combobox',{name:'Data source'}).selectOption('none');
  await expect(controls).toHaveCount(0);
  const state=await request.get('/api/v1/demo/simulation').then(r=>r.json());
  await request.post('/api/v1/demo/simulation',{data:{action:'select',scenario:'normal',expected_revision:state.revision}});
  await watch.close();
});
