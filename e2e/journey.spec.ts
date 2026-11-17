import { expect, test } from '@playwright/test'

// 基本の表示は3Dだが、テストの多くは2Dの盤面を前提にする。好みが覚えられていなければ、2Dにしておく（3Dのテストは、自分で切り替える）
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('tokaido-sugoroku:view-mode')) localStorage.setItem('tokaido-sugoroku:view-mode', '2d')
  })
})

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

test('同じ端末で2人が順番に遊べて、結果に2人の旅日記が出る', async ({ page }) => {
  await page.goto('/?seed=8&fast=1')
  await page.getByTestId('humans').selectOption('2')
  await page.getByTestId('name-0').fill('花子')
  await page.getByTestId('name-1').fill('太郎')
  await page.getByTestId('count').selectOption('3')
  await page.getByTestId('start').click()
  // 花子の番から始まる
  await expect(page.locator('.dock-who')).toContainText('花子')
  // 花子が進めると、いつか太郎の番になる
  let sawTaro = false
  const result = page.getByTestId('result')
  for (let i = 0; i < 3000 && !(await result.isVisible()); i++) {
    if (await page.locator('.dock-who').filter({ hasText: '太郎' }).isVisible().catch(() => false)) sawTaro = true
    for (const id of ['roll', 'choice', 'buy', 'route-lane']) {
      const btn = page.getByTestId(id).locator('visible=true').and(page.locator(':not([disabled])')).first()
      if (await btn.isVisible().catch(() => false)) {
        await btn.click()
        break
      }
    }
    await page.waitForTimeout(20)
  }
  expect(sawTaro).toBe(true)
  await expect(result).toBeVisible()
  await expect(page.getByTestId('diary-tab-p0')).toBeVisible()
  await page.getByTestId('diary-tab-p1').click()
  await expect(page.getByTestId('diary')).toContainText('太郎の東海道')
})

test('身分を選べて、説明が出て、札に身分が出る', async ({ page }) => {
  await page.goto('/?seed=3&fast=1')
  await expect(page.getByTestId('role-desc-0')).toContainText('ごくふつう')
  await page.getByTestId('role-0').selectOption('hikyaku')
  await expect(page.getByTestId('role-desc-0')).toContainText('足が自慢')
  await page.getByTestId('start').click()
  await expect(page.getByTestId('role-p0')).toHaveText('飛脚')
  // CPU の身分も、札に出る
  await expect(page.getByTestId('role-p1')).not.toHaveText('飛脚')
})

test('遊び方が、タイトルでも、遊んでいる途中でも開ける', async ({ page }) => {
  await page.goto('/?seed=2&fast=1')
  await page.getByTestId('open-howto').click()
  await expect(page.getByTestId('howto')).toContainText('めざすところ')
  await expect(page.getByTestId('howto')).toContainText('飛脚')
  await page.getByTestId('howto-close').click()
  await expect(page.getByTestId('howto')).toHaveCount(0)
  await page.getByTestId('start').click()
  await page.getByTestId('open-howto').click()
  await expect(page.getByTestId('howto')).toContainText('得点')
  await page.getByTestId('howto-close').click()
})

test('3D表示に切り替えられて、2Dに戻せる（記憶もされる）', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/?seed=4&fast=1')
  await page.getByTestId('start').click()
  await expect(page.getByTestId('board')).toBeVisible()
  await page.getByTestId('view-toggle').click()
  await expect(page.getByTestId('board3d-canvas')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByTestId('board')).toHaveCount(0)
  // 遊びを進めても、3D のまま動く
  await page.getByTestId('roll').click()
  await expect(page.getByTestId('board3d-canvas')).toBeVisible()
  // 次に開いたときも、3D
  await page.reload()
  await page.getByTestId('continue').click()
  await expect(page.getByTestId('board3d-canvas')).toBeVisible({ timeout: 15_000 })
  await page.getByTestId('view-toggle').click()
  await expect(page.getByTestId('board')).toBeVisible()
  expect(errors).toEqual([])
})

test('3D の描画の速さ（?stats=1）と軽量モード（?lite=1）', async ({ page }) => {
  await page.goto('/?seed=4&fast=1&stats=1&lite=1')
  await page.getByTestId('start').click()
  await page.getByTestId('view-toggle').click()
  await expect(page.getByTestId('board3d-canvas')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByTestId('stats3d')).toContainText('FPS', { timeout: 10_000 })
  await expect(page.getByTestId('stats3d')).toContainText('軽量')
  // 次のテストに、3D の記憶が残らないように、2D に戻す
  await page.getByTestId('view-toggle').click()
})

test('基本は3Dで始まる（好みが覚えられていなければ）。2Dに切り替えると、次も2D', async ({ browser }) => {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto('/?seed=4&fast=1')
  await page.getByTestId('start').click()
  await expect(page.getByTestId('board3d-canvas')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByTestId('view-toggle')).toHaveText('2D表示')
  await page.getByTestId('view-toggle').click()
  await expect(page.getByTestId('board')).toBeVisible()
  await page.reload()
  await page.getByTestId('continue').click()
  await expect(page.getByTestId('board')).toBeVisible()
  await ctx.close()
})

test('体力のゲージと、選択肢の結果の数値が出る', async ({ page }) => {
  await page.goto('/?seed=4&fast=1')
  await page.getByTestId('start').click()
  const gauge = page.getByTestId('stamina-gauge-p0')
  await expect(gauge).toHaveAttribute('role', 'meter')
  const before = Number(await gauge.getAttribute('aria-valuenow'))
  expect(before).toBeGreaterThan(0)
  // 出来事の選択肢が出るまで進める
  for (let i = 0; i < 300 && !(await page.getByTestId('event-modal').isVisible()); i++) {
    await page.evaluate(() => {
      for (const id of ['roll', 'buy', 'route-lane']) {
        const el = Array.from(document.querySelectorAll<HTMLButtonElement>(`[data-testid="${id}"]`)).find((e) => !e.disabled && e.offsetParent !== null)
        if (el) {
          el.click()
          return
        }
      }
    })
    await page.waitForTimeout(30)
  }
  await expect(page.getByTestId('event-modal')).toBeVisible()
  // どの選択肢にも、結果の数値（または「変化なし」）が添えてある
  const effects = page.getByTestId('choice-effects')
  expect(await effects.count()).toBeGreaterThan(1)
  for (const t of await effects.allInnerTexts()) expect(t.trim().length).toBeGreaterThan(0)
})

test('いまいる県が表示される（最初は東京都）', async ({ page }) => {
  await page.goto('/?seed=4&fast=1')
  await page.getByTestId('start').click()
  await expect(page.getByTestId('region-badge')).toHaveText('東京都')
})
