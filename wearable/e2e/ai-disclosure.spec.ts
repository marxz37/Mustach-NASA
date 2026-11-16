import {test,expect} from '@playwright/test';

test('Wearable AI disclosure is visible in all languages without changing the Radiance logo',async({page})=>{
  await page.goto('/');
  const disclosure=page.locator('.wearable-footer .ai-disclosure');
  await expect(disclosure).toHaveText('AI assistance (OpenAI Codex) · code, tests and documentation');
  await expect(page.locator('.watch-brand-mark')).toHaveAttribute('alt','Radiance');
  await page.getByRole('combobox',{name:'Language'}).selectOption('pt');
  await expect(disclosure).toContainText('Apoio de IA');
  await page.getByRole('combobox',{name:'Idioma'}).selectOption('es');
  await expect(disclosure).toContainText('Apoyo de IA');
  await page.setViewportSize({width:320,height:720});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  await disclosure.scrollIntoViewIfNeeded();
  await page.locator('.wearable-footer').screenshot({path:'test-results/wearable-ai-footer.png'});
});
