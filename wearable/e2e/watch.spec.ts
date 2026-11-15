import { expect, test } from '@playwright/test';

test('relógio independente mostra saúde e resumo solar por botões', async ({page}) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Mustach Wearable');
  await expect(page.getByRole('region', {name:'Tela do relógio: Saúde do tripulante'})).toBeVisible();
  await expect(page.getByText('Sem avaliação')).toBeVisible();
  await page.getByRole('button', {name:'Ver atividade solar'}).click();
  await expect(page.getByRole('region', {name:'Tela do relógio: Atividade solar'})).toBeVisible();
  await expect(page.getByText('A / OCORRÊNCIA')).toBeVisible();
  await expect(page.getByText('B / INTENSIDADE')).toBeVisible();
  await expect(page.getByText('C / EVOLUÇÃO')).toBeVisible();
  await expect(page.getByText('Sem previsão disponível')).toBeVisible();
  await page.getByRole('button', {name:'Ver tela de saúde'}).click();
  await expect(page.getByRole('region', {name:'Tela do relógio: Saúde do tripulante'})).toBeVisible();
});

test('swipe horizontal e teclado alternam as duas telas', async ({page}) => {
  await page.goto('/');
  const screen = page.getByRole('region', {name:'Tela do relógio: Saúde do tripulante'});
  const bounds = await screen.boundingBox();
  expect(bounds).not.toBeNull();
  if (!bounds) return;
  await page.mouse.move(bounds.x + bounds.width * .78, bounds.y + bounds.height * .5);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * .19, bounds.y + bounds.height * .5, {steps: 5});
  await page.mouse.up();
  const solarScreen = page.getByRole('region', {name:'Tela do relógio: Atividade solar'});
  await expect(solarScreen).toBeVisible();
  await solarScreen.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(screen).toBeVisible();
});

test('tela pequena não apresenta rolagem horizontal', async ({page}) => {
  await page.setViewportSize({width: 320, height: 720});
  await page.goto('/');
  await page.getByRole('button', {name:'Ver atividade solar'}).click();
  await expect(page.getByRole('region', {name:'Tela do relógio: Atividade solar'})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test('resumo no relógio usa apenas um modelo identificado', async ({page}) => {
  const model = {
    id: 'modelo-a', source: 'fonte-de-teste', provider: 'provedor-de-teste', model: 'Modelo A', provenance: 'FORECAST',
    issued_at: '2026-11-15T12:00:00Z', valid_from: '2026-11-15T12:00:00Z', valid_until: '2026-11-16T12:00:00Z',
    occurrence_probability_percent: 12, peak_proton_flux: 40, peak_proton_flux_unit: 'pfu',
    proton_energy_min_mev: 10, proton_energy_max_mev: 100,
    event_start_at: '2026-11-15T16:00:00Z', event_peak_at: '2026-11-15T18:00:00Z', event_end_at: '2026-11-15T23:00:00Z',
  };
  await page.route('**/api/v1/solar/forecast', route => route.fulfill({json: {
    status: 'available', models: [model, {...model, id: 'modelo-b', model: 'Modelo B', peak_proton_flux: 5, peak_proton_flux_unit: 'unidade-B'}],
  }}));
  await page.goto('/');
  await page.getByRole('button', {name:'Ver atividade solar'}).click();
  const screen = page.getByRole('region', {name:'Tela do relógio: Atividade solar'});
  await expect(screen).toContainText('Modelo A');
  await expect(screen).toContainText('40 pfu');
  await expect(screen).toContainText('1 de 2 modelos');
  await expect(screen).not.toContainText('5 unidade-B');
});
