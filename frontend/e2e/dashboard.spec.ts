import {expect,test} from '@playwright/test';

test('English is default, no side menu and no decorative hero',async({page})=>{
  await page.goto('/');
  await expect(page.getByRole('link',{name:'Overview'})).toBeVisible();
  await expect(page.getByRole('link',{name:'Crew'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Exposure map'})).toBeVisible();
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
  await expect(page.locator('.live-rate-section')).toContainText('Simulated');
  await expect(page.locator('.body-percent-label')).toHaveCount(0);
  await source.selectOption('real');
  await expect(page.locator('.readout-strip')).toContainText('—');
  await source.selectOption('simulation');
  await expect(page.locator('.mode-chip')).toContainText('Simulation');
  await expect(page.getByText('Illustrative colors only',{exact:false}).first()).toBeVisible();
  await expect(page.locator('.body-percent-label')).toHaveCount(0);
  await expect(page.locator('.live-rate-section')).toContainText('Simulated');
});

test('EVA timer starts, pauses, finishes and resets without assuming radiation dose',async({page})=>{
  await page.goto('/');
  const eva=page.getByRole('region',{name:'EVA session'});
  await expect(eva).toContainText('00:00:00');
  await eva.getByRole('button',{name:'Start EVA'}).click();
  await expect(eva).toContainText('In progress');
  await eva.getByRole('button',{name:'Pause'}).click();
  await expect(eva).toContainText('Paused');
  await eva.getByRole('button',{name:'Resume'}).click();
  await eva.getByRole('button',{name:'Finish EVA'}).click();
  await expect(eva).toContainText('Finished');
  await expect(eva).toContainText('synthetic', {ignoreCase:true});
  await eva.getByRole('button',{name:'Reset'}).click();
  await expect(eva).toContainText('Ready');
});

test('EVA data-source switch clears session and does not combine readings',async({page})=>{
  await page.goto('/');
  await page.getByRole('combobox',{name:'Data source'}).selectOption('simulation');
  const eva=page.getByRole('region',{name:'EVA session'});
  await eva.getByRole('button',{name:'Start EVA'}).click();
  await page.getByRole('combobox',{name:'Data source'}).selectOption('none');
  await expect(eva).toContainText('Ready');
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
  await expect(page.getByRole('heading',{name:'Exposure map'})).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
  expect(overflow).toBe(false);
});
