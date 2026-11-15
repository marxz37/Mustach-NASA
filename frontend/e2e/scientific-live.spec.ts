import { expect, test } from '@playwright/test';

test('scientific history and solar data pass through the actual local API', async ({page,request}) => {
  test.skip(process.env.MUSTACH_LIVE_API !== '1', 'Requires a running FastAPI and collected official data');
  const radlab = await request.get('/api/v1/measurements?source=NASA%20OSDR%20RadLab&quantity=absorbed_dose_rate');
  expect(radlab.ok()).toBeTruthy();
  expect((await radlab.json()).length).toBeGreaterThan(0);
  await page.goto('/');
  await page.getByRole('combobox',{name:'Data source'}).selectOption('real');
  await expect(page.getByRole('region',{name:'Histórico instrumental RadLab'})).toContainText('NASA RadLab · DosTel1');
  await expect(page.getByRole('region',{name:'Histórico instrumental RadLab'})).toContainText('pontos');
  await expect(page.getByText('NOAA GOES · prótons observados')).toBeVisible();
});
