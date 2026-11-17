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
  // CPU がすぐ動いて道中記の行が流れるので、旅人の札の路銀の変化で確かめる（働いたログは単体テストで確認）
  await expect(money).not.toHaveText(before)
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

test('演出：サイコロが出て、駒が動き終わってから、次の操作ができる', async ({ page }) => {
  await page.goto('/?seed=4')
  await page.getByTestId('start').click()
  await page.getByTestId('roll').click()
  await expect(page.getByTestId('dice-pop')).toBeVisible()
  // 動いているあいだは、操作の欄が隠れている
  await expect(page.getByTestId('roll')).toBeHidden()
  // 動き終われば、判断の画面か、次の自分の番になる
  await expect(page.getByTestId('choice').first().or(page.getByTestId('buy')).or(page.getByTestId('roll')).first()).toBeVisible({ timeout: 20_000 })
  await expect(page.getByTestId('dice-pop')).toBeHidden({ timeout: 5_000 })
})

test('動きを減らす設定では、演出を省く', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto('/?seed=4')
  await page.getByTestId('start').click()
  await page.getByTestId('roll').click()
  await expect(page.getByTestId('dice-pop')).toHaveCount(0)
  await ctx.close()
})

test('小地図を押すと、盤面がそこへ動く', async ({ page }) => {
  await page.goto('/?seed=4&fast=1')
  await page.getByTestId('start').click()
  const board = page.getByTestId('board')
  const before = await board.evaluate((el) => el.scrollLeft)
  // 左端（京都側）を押す
  const map = page.getByTestId('minimap').locator('svg')
  const box = (await map.boundingBox())!
  await page.mouse.click(box.x + 4, box.y + box.height / 2)
  await expect.poll(() => board.evaluate((el) => el.scrollLeft)).not.toBe(before)
})
