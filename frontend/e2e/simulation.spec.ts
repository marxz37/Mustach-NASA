import {test,expect} from '@playwright/test';
import {simulationFixture} from '../../shared/testing/simulationFixture';

test('no Web notification center; simulation fails honestly without local API and no-data never keeps colors',async({page})=>{
  await page.route('**/api/v1/demo/simulation',route=>route.abort());
  await page.goto('/');
  await expect(page.locator('.notification-center,.notification-trigger')).toHaveCount(0);
  await expect(page.getByRole('region',{name:'Shared simulation'})).toContainText('local API required');
  await expect(page.locator('.human-heatmap path[data-band]').first()).toHaveAttribute('data-band','unknown');
  await page.getByRole('combobox',{name:'Data source'}).selectOption('none');
  await expect(page.getByRole('region',{name:'Shared simulation'})).toHaveCount(0);
  await expect(page.locator('.human-heatmap path[data-band]').first()).toHaveAttribute('data-band','unknown');
});

test('simulation remains explicitly separated from real and no-data modes',async({page})=>{
  await page.route('**/api/v1/demo/simulation',route=>route.fulfill({json:simulationFixture()}));
  await page.goto('/');
  await expect(page.getByRole('region',{name:'Shared simulation'})).toContainText('Fictional scenario');
  await page.getByRole('combobox',{name:'Data source'}).selectOption('real');
  await expect(page.getByRole('region',{name:'Shared simulation'})).toHaveCount(0);
  await expect(page.locator('.human-heatmap path[data-band]').first()).toHaveAttribute('data-band','unknown');
});
