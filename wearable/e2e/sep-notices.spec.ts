import {test,expect} from '@playwright/test';
import {simulationFixture} from '../../shared/testing/simulationFixture';

test('new SEP notice vibrates once, survives reload silently, can be acknowledged and never leaks into no-data mode',async({page})=>{
  await page.addInitScript(()=>{Object.defineProperty(navigator,'vibrate',{value:()=>{(window as unknown as {buzz:number}).buzz=((window as unknown as {buzz:number}).buzz??0)+1;return true;},configurable:true});});
  let eligible=false;
  const at=new Date().toISOString();
  const notice={id:'official-test-proton',source:'NOAA SWPC',issued_at:at,valid_until:new Date(Date.now()+3600000).toISOString(),kind:'OFFICIAL',provenance:'OBSERVED',code:'proton_observed',detail:'ALERT: Proton event threshold reached'};
  await page.route('**/api/v1/demo/simulation',route=>route.fulfill({json:simulationFixture()}));
  await page.route('**/api/v1/wearable/solar-notices',route=>route.fulfill({json:eligible?[notice]:[]}));
  await page.goto('/');
  await page.getByRole('combobox',{name:'Data source'}).selectOption('real');
  await page.getByRole('button',{name:'Experimental vibration: Off'}).click();
  eligible=true;
  await expect(page.getByLabel('SEP notice')).toContainText('Official notice',{timeout:9000});
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {buzz:number}).buzz)).toBe(1);
  await page.waitForTimeout(5500);
  expect(await page.evaluate(()=>(window as unknown as {buzz:number}).buzz)).toBe(1);
  await page.reload();
  await page.getByRole('combobox',{name:'Data source'}).selectOption('real');
  await expect(page.getByLabel('SEP notice')).toBeVisible();
  expect(await page.evaluate(()=>(window as unknown as {buzz?:number}).buzz??0)).toBe(0);
  await page.getByRole('button',{name:'Acknowledge / silence'}).click();
  await expect(page.getByLabel('SEP notice')).toHaveCount(0);
  await page.reload();
  await page.getByRole('combobox',{name:'Data source'}).selectOption('real');
  await expect(page.getByLabel('SEP notice')).toHaveCount(0);
  await page.getByRole('combobox',{name:'Data source'}).selectOption('none');
  await expect(page.getByLabel('SEP notice')).toHaveCount(0);
});

for(const lang of ['en','pt','es'] as const){
  test(`SEP visual fallback fits at 320px with operational notice in ${lang}`,async({page})=>{
    await page.addInitScript(language=>{localStorage.setItem('mustach-language',language);Object.defineProperty(navigator,'vibrate',{value:undefined,configurable:true});},lang);
    const snapshot=simulationFixture();snapshot.scenario='predicted';
    await page.route('**/api/v1/demo/simulation',route=>route.fulfill({json:snapshot}));
    await page.setViewportSize({width:320,height:740});
    await page.goto('/');
    await expect(page.locator('.watch-sep-notice')).toBeVisible();
    for(let screen=0;screen<2;screen++){
      if(screen)await page.locator('.watch-nav-button').last().click();
      const geometry=await page.locator('.watch-screen').evaluate(el=>{
        const content=el.querySelector('.watch-center')!.getBoundingClientRect();
        const notice=el.querySelector('.watch-sep-notice')!.getBoundingClientRect();
        const footer=el.querySelector('.watch-screen-footer')!.getBoundingClientRect();
        const lastContent=el.querySelector('.watch-solar-disclaimer')??el.querySelector('.watch-personal-reading')??el.querySelector('.watch-health-stats');
        const operational=el.querySelector('.watch-operational-notice');
        return {contentBottom:content.bottom,lastContentBottom:lastContent!.getBoundingClientRect().bottom,nextTop:operational?.getBoundingClientRect().top??notice.top,noticeTop:notice.top,noticeBottom:notice.bottom,footerTop:footer.top,footerBottom:footer.bottom,screenBottom:el.getBoundingClientRect().bottom,overflow:document.documentElement.scrollWidth>innerWidth};
      });
      expect(geometry.contentBottom).toBeLessThanOrEqual(geometry.noticeTop);
      expect(geometry.lastContentBottom).toBeLessThanOrEqual(geometry.nextTop);
      expect(geometry.noticeBottom).toBeLessThanOrEqual(geometry.footerTop);
      expect(geometry.footerBottom).toBeLessThanOrEqual(geometry.screenBottom);
      expect(geometry.overflow).toBe(false);
    }
    await page.screenshot({path:`test-results/sep-${lang}.png`,fullPage:true});
  });
}
