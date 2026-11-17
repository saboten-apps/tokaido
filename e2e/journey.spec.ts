import { expect, test } from '@playwright/test'

test('日本橋から京都まで遊び、得点が出る', async ({ page }) => {
  await page.goto('/?seed=11&fast=1')
  await expect(page.getByRole('heading', { name: '東海道すごろく' })).toBeVisible()
  await page.getByTestId('count').selectOption('3')
  await page.getByTestId('start').click()
  await expect(page.getByTestId('board')).toBeVisible()

  const result = page.getByTestId('result')
  for (let i = 0; i < 3000; i++) {
    if (await result.isVisible()) break
    for (const id of ['roll', 'choice', 'buy', 'route-lane']) {
      const btn = page.getByTestId(id).locator('visible=true').and(page.locator(':not([disabled])')).first()
      if (await btn.isVisible().catch(() => false)) {
        await btn.click()
        break
      }
    }
    await page.waitForTimeout(30)
  }
  await expect(result).toBeVisible()
  await expect(result.locator('tbody tr')).toHaveCount(3)
  await expect(page.getByTestId('total-p0')).toHaveText(/\d+/)
  await expect(page.getByTestId('titles')).toBeVisible()
  await expect(page.getByTestId('diary')).toContainText('京都・三条大橋に着いた')
})

test('路銀がなくても、働いて稼げる', async ({ page }) => {
  await page.goto('/?seed=2&fast=1')
  await page.getByTestId('start').click()
  const money = page.getByTestId('player-p0')
  const before = await money.innerText()
  await page.getByTestId('work').click()
  await expect(money).not.toHaveText(before)
  await expect(page.getByTestId('log')).toContainText('働いて')
})

test('続きから再開できる', async ({ page }) => {
  await page.goto('/?seed=4&fast=1')
  await page.getByTestId('start').click()
  await page.getByTestId('roll').click()
  await expect(page.getByTestId('roll').or(page.getByTestId('choice').first()).or(page.getByTestId('buy'))).toBeVisible()
  await page.reload()
  await expect(page.getByTestId('continue')).toBeVisible()
  await page.getByTestId('continue').click()
  await expect(page.getByTestId('board')).toBeVisible()
})

test('泊まり方を切り替えても、番は進まない', async ({ page }) => {
  await page.goto('/?seed=6&fast=1')
  await page.getByTestId('start').click()
  await page.getByTestId('lodging-kichin').click()
  await expect(page.getByTestId('lodging-kichin')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('roll')).toBeVisible()
  await page.getByTestId('hurry').click()
  await expect(page.getByTestId('log')).toContainText('早足で')
})
