import {expect,test} from '@playwright/test';
import events from '../../shared/testing/operational-events.json' with {type:'json'};

const demoEvent=events.missing_personal;

test('visual preparation separates availability from review and records one consultation without checkboxes',async({page})=>{
  let event={...demoEvent};
  await page.route('**/api/v1/demo/operational-event**',async route=>{
    if(route.request().method()==='POST'){
      expect(route.request().postDataJSON()).toEqual({expected_revision:1,context_reviewed:true,availability_checked:true});
      event={...events.missing_personal_recorded};
    }
    await route.fulfill({json:event});
  });
  await page.goto('/');
  const check=page.getByRole('region',{name:'Pre-EVA verification'});
  await expect(check.locator('.prep-count')).toContainText('2/3 information available');
  await expect(check.locator('.preparation-steps li').nth(0)).toHaveAttribute('data-state','AVAILABLE');
  await expect(check.locator('.preparation-steps li').nth(1)).toHaveAttribute('data-state','ATTENTION');
  await expect(check.locator('.preparation-steps li').nth(2)).toHaveAttribute('data-state','MISSING');
  await expect(check).toContainText('Check individual reading');
  const open=check.getByRole('button',{name:/Open team guide/});
  await open.click();
  const drawer=page.getByRole('dialog',{name:'Preparation guide'});
  await expect(drawer).toContainText('Individual reading unavailable for this activity');
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await drawer.getByRole('button',{name:'Record consultation',exact:true}).click();
  await expect(drawer.getByRole('status')).toContainText('Consultation recorded');
  await expect(drawer).toContainText('still requires follow-up');
  await expect(check).toContainText('Review pending');
  await expect(check.locator('.preparation-steps li').nth(2)).toHaveAttribute('data-state','MISSING');
  await page.keyboard.press('Escape');
  await expect(drawer).toHaveCount(0);
  await expect(open).toBeFocused();
  await page.getByRole('combobox',{name:'Data source'}).selectOption('real');
  await expect(check).toHaveCount(0);
});

test('API failure does not fabricate a preparation assessment or offer an offline record',async({page})=>{
  await page.route('**/api/v1/demo/operational-event',route=>route.fulfill({status:503,json:{}}));
  await page.goto('/');
  const check=page.getByRole('region',{name:'Pre-EVA verification'});
  await expect(check).toContainText('Local API unavailable');
  await expect(check.locator('.preparation-steps')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Record consultation'})).toHaveCount(0);
});

test('a concurrent scenario change refreshes the assessment and preserves the conflict in the drawer',async({page})=>{
  let event={...demoEvent};
  await page.route('**/api/v1/demo/operational-event**',async route=>{
    if(route.request().method()==='POST'){
      event={...events.solar_review,revision:2};
      await route.fulfill({status:409,json:{detail:'Scenario changed'}});
    }else await route.fulfill({json:event});
  });
  await page.goto('/');
  await page.getByRole('button',{name:/Open team guide/}).click();
  const drawer=page.getByRole('dialog',{name:'Preparation guide'});
  await drawer.getByRole('button',{name:'Record consultation',exact:true}).click();
  await expect(drawer.getByRole('alert')).toContainText('The scenario changed');
  await expect(drawer).toContainText('Individual reading available in the scenario');
  await expect(page.locator('.prep-count')).toContainText('3/3');
  await expect(page.locator('.prep-review-tag')).toContainText('Consultation not recorded');
});

test('an API outage keeps the last assessment visible and blocks recording in the drawer',async({page})=>{
  let online=true;
  await page.route('**/api/v1/demo/operational-event',route=>route.fulfill(online?{json:demoEvent}:{status:503,json:{}}));
  await page.goto('/');
  await page.getByRole('button',{name:/Open team guide/}).click();
  const drawer=page.getByRole('dialog',{name:'Preparation guide'});
  online=false;
  await expect(drawer.getByRole('status')).toContainText('Last known state',{timeout:12_000});
  await expect(drawer.getByRole('button',{name:'Record consultation',exact:true})).toBeDisabled();
});

test('scenario selection changes the shared assessment automatically and resets a previous consultation',async({page})=>{
  let event={...events.missing_personal_recorded};
  await page.route('**/api/v1/demo/operational-event**',async route=>{
    if(route.request().method()==='POST'){
      expect(route.request().postDataJSON()).toEqual({expected_revision:2,scenario_id:'complete'});
      event={...events.complete,revision:3};
    }
    await route.fulfill({json:event});
  });
  await page.goto('/');
  await page.getByRole('button',{name:/Open team guide/}).click();
  const drawer=page.getByRole('dialog',{name:'Preparation guide'});
  await drawer.locator('summary').click();
  await drawer.getByRole('combobox',{name:'Demonstration scenario'}).selectOption('complete');
  await expect(page.locator('.prep-count')).toContainText('3/3');
  await expect(page.locator('.prep-review-tag')).toContainText('Consultation not recorded');
  await expect(page.locator('.prep-assessment')).toHaveAttribute('data-state','AVAILABLE');
  await expect(drawer.getByRole('button',{name:'Record consultation',exact:true})).toBeEnabled();
  await expect(page.getByRole('checkbox')).toHaveCount(0);
});

test('all available information with a recorded consultation never states EVA clearance',async({page})=>{
  await page.route('**/api/v1/demo/operational-event',route=>route.fulfill({json:events.complete_recorded}));
  await page.goto('/');
  const check=page.getByRole('region',{name:'Pre-EVA verification'});
  await expect(check.locator('.prep-assessment')).toHaveAttribute('data-state','AVAILABLE');
  await expect(check).toContainText('Consultation recorded');
  await expect(check).not.toContainText('Review pending');
  await page.getByRole('button',{name:/Open team guide/}).click();
  await expect(page.getByRole('dialog')).toContainText('not EVA clearance');
  await expect(page.getByRole('dialog').getByRole('button',{name:'Record consultation',exact:true})).toBeDisabled();
});

test('historical environmental readings show partial coverage without a recent-sensor status',async({page})=>{
  const at=Date.now()-30*60_000;
  await page.route('**/api/v1/measurements',route=>route.fulfill({json:[at,at+60_000].map((time,i)=>({
    id:String(i),source:'test-instrument',instrument:'ENV-01',mission:'test',provenance:'OBSERVED',
    measured_at:new Date(time).toISOString(),quantity:'dose_equivalent_rate',value:1,unit:'µSv/h',
  }))}));
  await page.goto('/');
  await page.getByRole('combobox',{name:'Data source'}).selectOption('real');
  await expect(page.locator('.live-rate-section')).toContainText('Historical record');
  await expect(page.locator('.live-rate-section')).toContainText('Outdated reading');
  await expect(page.locator('.live-rate-section .live-indicator')).toHaveCount(0);
  await expect(page.locator('.readout-priority').nth(1)).toContainText('Mission environment');
  await expect(page.locator('.readout-priority').nth(1)).toContainText('Partial window');
  await expect(page.locator('.dose-coverage')).toContainText('Partial window');
  await expect(page.locator('.source-note')).toHaveCount(0);
});

test('English is default, no side menu and no decorative hero',async({page})=>{
  await page.goto('/');
  await expect(page.getByRole('link',{name:'Overview'})).toBeVisible();
  await expect(page.getByRole('link',{name:'Crew'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Illustrative body map'})).toBeVisible();
  await expect(page.getByText('O espaço deixa marcas.')).toHaveCount(0);
  await expect(page.getByText('Fontes científicas')).toHaveCount(0);
  await expect(page.getByText('Mission Operations')).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'Solar activity'})).toHaveCount(1);
  await expect(page.locator('.solar-category')).toHaveCount(3);
});

test('switch EN/PT/ES for navigation and solar',async({page})=>{
  await page.goto('/');
  await page.getByRole('combobox',{name:'Language'}).selectOption('pt');
  await expect(page.getByRole('link',{name:'Visão geral'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Atividade solar'})).toBeVisible();
  await page.getByRole('combobox',{name:'Idioma'}).selectOption('es');
  await expect(page.getByRole('link',{name:'Resumen'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Actividad solar'})).toBeVisible();
});

test('source selection keeps real and no-data honest, simulation is visibly synthetic',async({page})=>{
  await page.goto('/');
  const source=page.getByRole('combobox',{name:'Data source'});
  await expect(source).toHaveValue('simulation');
  await expect(page.locator('.demo-banner')).toHaveCount(0);
  await expect(page.locator('.live-rate-section')).toContainText('Simulation active');
  await expect(page.locator('.body-percent-label')).toHaveCount(0);
  await source.selectOption('real');
  await expect(page.locator('.readout-strip')).toContainText('—');
  await source.selectOption('simulation');
  await expect(page.locator('.mode-chip')).toContainText('Simulation');
  await expect(page.getByText('Color bands reflect fictional',{exact:false}).first()).toBeVisible();
  await expect(page.locator('.body-percent-label')).toHaveCount(0);
  await expect(page.locator('.live-rate-section')).toContainText('Simulation active');
});

test('EVA timer starts, pauses, finishes and resets without assuming radiation dose',async({page})=>{
  await page.goto('/');
  const eva=page.getByRole('region',{name:'EVA session'});
  await expect(eva).toContainText('00:00:00');
  await eva.getByRole('button',{name:'Start EVA'}).click();
  await expect(eva).toContainText('In progress');
  await expect(eva).toContainText('Estimate from simulated equivalent-dose rate');
  await eva.getByRole('button',{name:'Pause'}).click();
  await expect(eva).toContainText('Paused');
  await eva.getByRole('button',{name:'Resume'}).click();
  await eva.getByRole('button',{name:'Finish EVA'}).click();
  await expect(eva).toContainText('Finished');
  await expect(eva).toContainText('Estimate from simulated equivalent-dose rate');
  await eva.getByRole('button',{name:'Reset'}).click();
  await expect(eva).toContainText('Timer ready');
});

test('EVA data-source switch clears session and does not combine readings',async({page})=>{
  await page.goto('/');
  await page.getByRole('combobox',{name:'Data source'}).selectOption('simulation');
  const eva=page.getByRole('region',{name:'EVA session'});
  await eva.getByRole('button',{name:'Start EVA'}).click();
  await page.getByRole('combobox',{name:'Data source'}).selectOption('none');
  await expect(eva).toContainText('Timer ready');
  await expect(eva).toContainText('Dose unavailable');
});

test('body organ zoom still works with neutral heatmap',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Organs',exact:true}).click();
  await page.getByRole('button',{name:'Details of Brain'}).click();
  const modal=page.getByRole('dialog',{name:'Details of Brain'});
  await expect(modal).toBeVisible();
  await expect(modal).toContainText('No data');
  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible();
});

test('Crew provides selectable fictional profiles and daily/weekly simulated histories',async({page})=>{
  await page.goto('/tripulantes');
  await expect(page.locator('.crew-tile')).toHaveCount(4);
  await page.getByRole('button',{name:/Alex Kim/i}).click();
  await expect(page.locator('.crew-active-header')).toContainText('Alex Kim');
  const history=page.getByRole('region',{name:'Accumulated equivalent dose • available readings'});
  await expect(history.getByRole('button',{name:'Last 24 hours'})).toBeVisible();
  await history.getByRole('button',{name:'Last 7 days'}).click();
  await expect(history.getByRole('button',{name:'Last 7 days'})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('region',{name:'EVA session'})).toBeVisible();
});

test('mobile 320px viewport avoids horizontal page overflow',async({page})=>{
  await page.setViewportSize({width:320,height:720});
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Illustrative body map'})).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
  expect(overflow).toBe(false);
});


test('synthetic 2D heatmap reacts to incoming UI readings, real mode remains neutral',async({page})=>{
  await page.goto('/');
  const band=page.locator('.human-heatmap path[data-band]').first();
  await expect(band).toHaveAttribute('data-band',/baseline|attention|high/);
  await page.getByRole('combobox',{name:'Data source'}).selectOption('real');
  await expect(band).toHaveAttribute('data-band','unknown');
  await page.getByRole('combobox',{name:'Data source'}).selectOption('simulation');
  await expect(band).toHaveAttribute('data-band',/baseline|attention|high/);
});


test('overview prioritizes solar event, 24h accumulated dose, and exposure state without duplicating live dose-rate headline',async({page})=>{
  await page.goto('/');
  const cards=page.locator('.readout-strip .readout-priority');
  await expect(cards).toHaveCount(3);
  await expect(cards.nth(1)).toContainText('ACCUMULATED DOSE');
  await expect(cards.nth(1)).toContainText('mSv');
  await expect(cards.nth(1)).not.toContainText('Current dose rate');
  await expect(page.getByRole('heading',{name:'Current dose rate'})).toBeVisible();
  await page.getByRole('combobox',{name:'Data source'}).selectOption('none');
  await expect(cards.nth(1)).toContainText('—');
});
