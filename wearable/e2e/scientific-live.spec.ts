import { expect, test } from '@playwright/test';

test('real solar summary uses the shared FastAPI without a mocked forecast', async ({page,request}) => {
  test.skip(process.env.MUSTACH_LIVE_API !== '1', 'Requires a running FastAPI and collected official data');
  const response = await request.get('/api/v1/solar/forecast');
  expect(response.ok()).toBeTruthy();
  expect((await response.json()).models.length).toBeGreaterThan(0);
  await page.goto('/');
  await page.getByRole('combobox',{name:'Data source'}).selectOption('real');
  await page.getByRole('button',{name:'SOLAR ACTIVITY'}).click();
  await expect(page.locator('.watch-solar-source')).toContainText('NOAA SWPC');
  await expect(page.locator('.watch-solar-summary')).toContainText('A / Occurrence');
});
