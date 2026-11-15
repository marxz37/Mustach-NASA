import { expect, test } from '@playwright/test';

test('nova navegação superior sem barra lateral', async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('navigation', {name:'Navegação principal'})).toBeVisible();
  await expect(page.getByRole('link', {name:'Visão geral'})).toBeVisible();
  await expect(page.getByRole('link', {name:'Tripulantes'})).toBeVisible();
  await expect(page.getByText('Sem telemetria conectada')).toBeVisible();
  await expect(page.getByText('Visão geral da missão')).toHaveCount(0);
  await expect(page.getByText('Fontes científicas')).toHaveCount(0);
  await expect(page.getByText('EXPOSIÇÃO POR ÓRGÃO')).toHaveCount(0);
  await expect(page.getByRole('heading', {name:'Atividade solar'})).toHaveCount(1);
  await expect(page.getByRole('heading', {name:'Saúde do indivíduo'})).toBeVisible();
  await expect(page.locator('.individual-health')).toContainText('Sem avaliação');
  await expect(page.locator('.individual-health')).toHaveClass(/health-unknown/);
  await expect(page.getByText('SEM DADOS · ESCALA DESATIVADA')).toBeVisible();
});

test('mapa separa corpo e órgãos e identifica cores simuladas', async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('button',{name:'Ampliar órgão: Cérebro'})).toHaveCount(0);
  await page.getByRole('checkbox',{name:'Prévia simulada'}).check();
  await expect(page.getByText('SIMULAÇÃO VISUAL · SEM DOSIMETRIA')).toBeVisible();
  await expect(page.getByRole('group',{name:'Mapa corporal com cores simuladas, sem dosimetria'})).toBeVisible();
  await page.getByRole('button',{name:'Órgãos', exact:true}).click();
  await expect(page.getByRole('button',{name:'Ampliar órgão: Cérebro'})).toBeVisible();
  await page.getByRole('checkbox',{name:'Prévia simulada'}).uncheck();
  await expect(page.getByText('SEM DADOS · ESCALA DESATIVADA')).toBeVisible();
});

test('clicar em órgão abre painel de detalhes sem valores inventados', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button',{name:'Órgãos', exact:true}).click();
  await page.getByRole('button',{name:'Ampliar órgão: Cérebro'}).click();
  const details = page.getByRole('dialog',{name:'Detalhes de Cérebro'});
  await expect(details).toBeVisible();
  await expect(details.getByRole('img',{name:'Ampliação 2D de Cérebro, sem dados de dose'})).toBeVisible();
  await expect(details.locator('.zoom-lens')).toBeVisible();
  await expect(page.locator('.organ-connector')).toBeVisible();
  await expect(details.getByText('Taxa de dose')).toBeVisible();
  await expect(details.getByText('Dose acumulada')).toBeVisible();
  await expect(details.getByText('Status', {exact:true})).toBeVisible();
  await expect(details.getByText('Fonte', {exact:true})).toBeVisible();
  await expect(details.getByText('Observações')).toBeVisible();
  await expect(details.getByText('Não conectada')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(details).not.toBeVisible();
});

test('tripulantes mostra ficha visual sem inventar astronautas', async ({page}) => {
  await page.goto('/tripulantes');
  await expect(page.getByRole('heading', {name:'Nenhum tripulante cadastrado'})).toBeVisible();
  await expect(page.getByText('Sem série dosimétrica')).toBeVisible();
  await expect(page.getByText('Nenhum astronauta ou valor de exposição fictício foi inserido.', {exact:false})).toBeVisible();
});

test('visão geral cabe na tela pequena', async ({page}) => {
  await page.setViewportSize({width: 320, height: 720});
  await page.goto('/');
  await expect(page.getByRole('heading', {name:'Mapa de exposição'})).toBeVisible();
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalOverflow).toBe(false);
  await page.getByRole('button',{name:'Órgãos', exact:true}).click();
  await page.getByRole('button',{name:'Ampliar órgão: Pulmões'}).click();
  await expect(page.getByRole('dialog',{name:'Detalhes de Pulmões'})).toBeVisible();
  const modalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(modalOverflow).toBe(false);
});
