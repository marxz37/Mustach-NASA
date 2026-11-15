import { expect, test } from '@playwright/test';
test('dashboard inicia sem medições fictícias', async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Visão geral da missão'})).toBeVisible();
  await expect(page.getByText('Modo de prototipação:',{exact:false})).toBeVisible();
  await expect(page.getByText('Não avaliado')).toBeVisible();
});
test('a navegação abre a tela de fontes', async ({page}) => {
  await page.goto('/');
  await page.getByRole('link',{name:'Fontes científicas'}).click();
  await expect(page.getByRole('heading',{name:'Fontes científicas'})).toBeVisible();
});
