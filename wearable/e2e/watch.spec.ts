import {expect,test} from '@playwright/test';
import events from '../../shared/testing/operational-events.json' with {type:'json'};
import { simulationFixture } from '../../shared/testing/simulationFixture';

test.beforeEach(async({page})=>{await page.route('**/api/v1/demo/simulation',route=>route.fulfill({json:simulationFixture()}));});

test('watch logo renders blue wings with a transparent background instead of a filled rectangle',async({page},info)=>{
  await page.goto('/');
  const logo=page.getByRole('img',{name:'Radiance',exact:true});
  await expect(logo).toBeVisible();
  const pixels=await logo.evaluate(async(element:HTMLImageElement)=>{
    await element.decode();
    const canvas=document.createElement('canvas');canvas.width=80;canvas.height=54;
    const ctx=canvas.getContext('2d')!;ctx.drawImage(element,0,0,80,54);
    const {data}=ctx.getImageData(0,0,80,54);
    let solid=0,yellow=0;
    for(let i=0;i<data.length;i+=4){
      if(data[i+3]===255)solid++;
      if(data[i+3]>0&&data[i]>200&&data[i+1]>150&&data[i+2]<150)yellow++;
    }
    return {background:ctx.getImageData(40,0,1,1).data[3],solid,yellow};
  });
  expect(pixels.background).toBe(0);
  expect(pixels.solid).toBeGreaterThan(20);
  expect(pixels.solid).toBeLessThan(80*54/2);
  expect(pixels.yellow).toBe(0);
  await expect(page.locator('.watch-wordmark')).toHaveText('');
  await page.locator('.watch-screen').screenshot({path:info.outputPath('fixed-logo.png'),animations:'disabled'});
});

test('wearable displays a passive notice inside the watch, with no external review or mutation controls',async({page})=>{
  const writes:string[]=[];
  page.on('request',request=>{if(request.url().includes('/demo/operational-event')&&request.method()==='POST')writes.push(request.url());});
  await page.route('**/api/v1/demo/operational-event',route=>route.fulfill({json:events.missing_personal_recorded}));
  await page.goto('/');
  const notice=page.locator('.watch-screen .watch-operational-notice');
  await expect(notice).toContainText('Pre-EVA review pending');
  await expect(notice).toContainText('Consult the board panel');
  await expect(notice).toHaveAttribute('data-event-id','DEMO-EVT-001');
  await expect(page.locator('.watch-verification')).toHaveCount(0);
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await expect(page.getByRole('button',{name:/Record consultation|Open team guide/})).toHaveCount(0);
  await page.getByRole('button',{name:'SOLAR ACTIVITY'}).click();
  await expect(notice).toBeVisible();
  expect(writes).toEqual([]);
  await page.getByRole('combobox',{name:'Data source'}).selectOption('none');
  await expect(page.locator('.watch-main-title')).toHaveCount(0);
  await expect(notice).toHaveCount(0);
});

test('watch follows server relevance after board changes without locally classifying the event',async({page})=>{
  let event=events.missing_personal;
  await page.route('**/api/v1/demo/operational-event',route=>route.fulfill({json:event}));
  await page.goto('/');
  await expect(page.locator('.watch-operational-notice')).toBeVisible();
  event=events.complete_recorded;
  await expect(page.locator('.watch-operational-notice')).toHaveCount(0,{timeout:7000});
  event=events.solar_review_recorded;
  await expect(page.locator('.watch-operational-notice')).toContainText('Pre-EVA review pending',{timeout:7000});
});

test('unknown review state produces an unavailable notice rather than silently clearing the occurrence',async({page})=>{
  await page.route('**/api/v1/demo/operational-event',route=>route.fulfill({status:503,json:{}}));
  await page.goto('/');
  await expect(page.locator('.watch-operational-notice')).toContainText('Pre-EVA review unavailable');
  await expect(page.locator('.watch-operational-notice')).toContainText('Consult the board panel');
});

test('independent English watch preview shows health and solar by buttons',async({page})=>{
  await page.goto('/');
  await expect(page).toHaveTitle('Radiance Wearable');
  await expect(page.getByRole('region',{name:'Screens: EXPOSURE MONITOR'})).toBeVisible();
  await expect(page.getByText('READING TIME')).toBeVisible();
  await page.getByRole('button',{name:'SOLAR ACTIVITY'}).click();
  await expect(page.getByRole('region',{name:'Screens: SOLAR ACTIVITY'})).toBeVisible();
  await expect(page.getByText('A / OCCURRENCE')).toBeVisible();
  await expect(page.getByText('B / INTENSITY')).toBeVisible();
  await expect(page.getByText('C / Estimated peak')).toBeVisible();
  await page.getByRole('button',{name:'EXPOSURE MONITOR'}).click();
  await expect(page.getByRole('region',{name:'Screens: EXPOSURE MONITOR'})).toBeVisible();
});

test('wearable language selector switches to Portuguese and Spanish',async({page})=>{
  await page.goto('/');
  await page.getByRole('combobox',{name:'Language'}).selectOption('pt');
  await expect(page.getByText('HORÁRIO DA LEITURA')).toBeVisible();
  await page.getByRole('combobox',{name:'Idioma'}).selectOption('es');
  await expect(page.getByText('HORA DE LECTURA')).toBeVisible();
});

test('watch swipe and keyboard navigate between pages',async({page})=>{
  await page.goto('/');
  const screen=page.getByRole('region',{name:'Screens: EXPOSURE MONITOR'});
  const box=await screen.boundingBox();expect(box).not.toBeNull();if(!box)return;
  await page.mouse.move(box.x+box.width*.8,box.y+box.height*.5);
  await page.mouse.down();await page.mouse.move(box.x+box.width*.2,box.y+box.height*.5,{steps:5});await page.mouse.up();
  const solar=page.getByRole('region',{name:'Screens: SOLAR ACTIVITY'});
  await expect(solar).toBeVisible();await solar.focus();await page.keyboard.press('ArrowLeft');await expect(screen).toBeVisible();
});

test('watch never reports an actual physical watch pairing',async({page})=>{
  await page.goto('/');
  await expect(page.getByText('DEMO', {exact:true})).toBeVisible();
  await expect(page.getByText('Simulated data ·', {exact:false})).toBeVisible();
});

test('watch solar page stays inside its screen at standard size',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'SOLAR ACTIVITY'}).click();
  const bounds=await page.evaluate(()=>{
    const screen=document.querySelector('.watch-screen');
    const center=document.querySelector('.watch-center--solar');
    if(!screen||!center)return null;
    const s=screen.getBoundingClientRect(),c=center.getBoundingClientRect();
    return {top:c.top,bottom:c.bottom,screenBottom:s.bottom};
  });
  expect(bounds).not.toBeNull();
  if(bounds)expect(bounds.bottom).toBeLessThanOrEqual(bounds.screenBottom-18);
});

for(const language of ['en','pt','es']){
  test(`passive notice fits both watch pages at 320px in ${language}`,async({page})=>{
    await page.setViewportSize({width:320,height:720});
    await page.addInitScript(lang=>localStorage.setItem('mustach-language',lang),language);
    await page.goto('/');
    await expect(page.locator('.watch-operational-notice')).toBeVisible();
    for(const content of ['.watch-health-stats','.watch-solar-disclaimer']){
      if(content.includes('solar'))await page.locator('.watch-nav-button').last().click();
      const geometry=await page.locator(content).evaluate(element=>{
        const notice=document.querySelector('.watch-operational-notice')!.getBoundingClientRect();
        const footer=document.querySelector('.watch-screen-footer')!.getBoundingClientRect();
        return {contentBottom:element.getBoundingClientRect().bottom,noticeTop:notice.top,noticeBottom:notice.bottom,footerTop:footer.top,overflow:document.documentElement.scrollWidth>innerWidth};
      });
      expect(geometry.contentBottom).toBeLessThanOrEqual(geometry.noticeTop);
      expect(geometry.noticeBottom).toBeLessThanOrEqual(geometry.footerTop);
      expect(geometry.overflow).toBe(false);
    }
  });
}


test('individual summary uses the same received measurement, timestamp and revision as the board assessment',async({page})=>{
  let event={...events.missing_personal};
  await page.route('**/api/v1/demo/operational-event',route=>route.fulfill({json:event}));
  await page.goto('/');
  await expect(page.locator('.watch-personal-status')).toHaveText('Missing');
  await expect(page.locator('.watch-personal-reading')).not.toContainText('0.47');
  await expect(page.getByTestId('watch-simulation-rate')).toContainText('0.380');
  event={...events.personal_received};
  await expect(page.locator('.watch-personal-status')).toHaveText('Usable',{timeout:7000});
  await expect(page.locator('.watch-personal-reading')).toContainText('0.470');
  await expect(page.locator('.watch-operational-notice')).toContainText('Review remote event');
  await expect(page.locator('.watch-operational-notice')).toContainText('Pre-EVA review pending');
});

test('outdated reading stays unavailable even when a local environmental sample could be normal',async({page})=>{
  await page.route('**/api/v1/demo/operational-event',route=>route.fulfill({json:events.stale_personal}));
  await page.goto('/');
  await expect(page.locator('.watch-personal-status')).toHaveText('Outdated');
  await expect(page.locator('.watch-operational-notice')).toContainText('Check a recent individual reading');
  await expect(page.locator('.watch-personal-reading')).toContainText('—');
});
