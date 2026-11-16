import {test,expect} from '@playwright/test';
import {simulationFixture} from '../../shared/testing/simulationFixture';

test('AI assistance is disclosed, portraits are watermarked, removed legend stays absent and Radiance branding remains',async({page})=>{
  await page.route('**/api/v1/demo/simulation',r=>r.fulfill({json:simulationFixture()}));
  await page.goto('/');
  await expect(page.locator('.brand strong')).toHaveText('RADIANCE');
  await expect(page.locator('.dose-demo-legend')).toHaveCount(0);
  const disclosure=page.locator('.mustach-footer .ai-disclosure');
  await expect(disclosure).toContainText('OpenAI Codex');
  await page.getByRole('combobox',{name:'Language'}).selectOption('pt');
  await expect(disclosure).toContainText('código, testes e documentação');
  await page.getByRole('link',{name:'Tripulantes'}).click();
  await expect(page.locator('.ai-image-watermark')).toHaveCount(4);
  await expect(page.locator('.ai-image-watermark').first()).toHaveText('Imagem gerada por IA · perfil fictício');
  await page.locator('.crew-gallery').screenshot({path:'test-results/crew-ai-watermarks.png'});
  await page.setViewportSize({width:320,height:720});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  await disclosure.scrollIntoViewIfNeeded();
  await page.locator('.mustach-footer').screenshot({path:'test-results/web-ai-footer.png'});
});
