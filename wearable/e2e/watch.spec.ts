import {expect,test} from '@playwright/test';

test('independent English watch preview shows health and solar by buttons',async({page})=>{
  await page.goto('/');
  await expect(page).toHaveTitle('Mustach Wearable');
  await expect(page.getByRole('region',{name:'Screens: HEALTH'})).toBeVisible();
  await expect(page.getByText('Not evaluated')).toBeVisible();
  await page.getByRole('button',{name:'SOLAR ACTIVITY'}).click();
  await expect(page.getByRole('region',{name:'Screens: SOLAR ACTIVITY'})).toBeVisible();
  await expect(page.getByText('A / OCCURRENCE')).toBeVisible();
  await expect(page.getByText('B / INTENSITY')).toBeVisible();
  await expect(page.getByText('C / TIMELINE')).toBeVisible();
  await page.getByRole('button',{name:'HEALTH'}).click();
  await expect(page.getByRole('region',{name:'Screens: HEALTH'})).toBeVisible();
});

test('wearable language selector switches to Portuguese and Spanish',async({page})=>{
  await page.goto('/');
  await page.getByRole('combobox',{name:'Language'}).selectOption('pt');
  await expect(page.getByText('Sem avaliação')).toBeVisible();
  await page.getByRole('combobox',{name:'Idioma'}).selectOption('es');
  await expect(page.getByText('Sin evaluación')).toBeVisible();
});

test('watch swipe and keyboard navigate between pages',async({page})=>{
  await page.goto('/');
  const screen=page.getByRole('region',{name:'Screens: HEALTH'});
  const box=await screen.boundingBox();expect(box).not.toBeNull();if(!box)return;
  await page.mouse.move(box.x+box.width*.8,box.y+box.height*.5);
  await page.mouse.down();await page.mouse.move(box.x+box.width*.2,box.y+box.height*.5,{steps:5});await page.mouse.up();
  const solar=page.getByRole('region',{name:'Screens: SOLAR ACTIVITY'});
  await expect(solar).toBeVisible();await solar.focus();await page.keyboard.press('ArrowLeft');await expect(screen).toBeVisible();
});

test('watch never reports an actual physical watch pairing',async({page})=>{
  await page.goto('/');
  await expect(page.getByText('Not paired')).toBeVisible();
  await expect(page.getByText('No smartwatch or sensors paired.',{exact:false})).toBeVisible();
});
