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
  await expect(page.getByTestId('view-toggle')).toHaveText('地図で見る')
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

test('いまいる場所の、時代背景と、今では（現代の豆知識）が出る', async ({ page }) => {
  await page.goto('/?seed=4&fast=1')
  await page.getByTestId('start').click()
  await expect(page.getByTestId('place-name')).toHaveText('日本橋')
  await expect(page.getByTestId('place-era')).toContainText('慶長8年')
  await expect(page.getByTestId('place-now')).toContainText('首都高')
  // 進めると、止まった場所の解説に変わる
  for (let i = 0; i < 100 && (await page.getByTestId('place-name').innerText()) === '日本橋'; i++) {
    await page.evaluate(() => {
      for (const id of ['roll', 'choice', 'buy', 'route-lane']) {
        const el = Array.from(document.querySelectorAll<HTMLButtonElement>(`[data-testid="${id}"]`)).find((e) => !e.disabled && e.offsetParent !== null)
        if (el) {
          el.click()
          return
        }
      }
    })
    await page.waitForTimeout(40)
  }
  await expect(page.getByTestId('place-name')).not.toHaveText('日本橋')
  await expect(page.getByTestId('place-card')).toBeVisible()
})

test('3D は場面：止まった土地の場面に切り替わる（ワープ）', async ({ page }) => {
  test.setTimeout(180_000)
  await page.goto('/?seed=4&fast=1')
  await page.getByTestId('start').click()
  await page.getByTestId('view-toggle').click() // 好みの初期値が2Dなので、場面に切り替える
  await expect(page.getByTestId('scene-caption')).toContainText('日本橋', { timeout: 60_000 })
  await expect(page.getByTestId('scene-caption')).toContainText('東京都')
  // 進める：止まった土地の名前に変わる（日本橋ではなくなる）
  for (let i = 0; i < 60; i++) {
    await page.evaluate(() => {
      for (const id of ['roll', 'choice', 'buy', 'route-lane']) {
        const el = Array.from(document.querySelectorAll<HTMLButtonElement>(`[data-testid="${id}"]`)).find((e) => !e.disabled && e.offsetParent !== null)
        if (el) {
          el.click()
          return
        }
      }
    })
    await page.waitForTimeout(60)
    if (!(await page.getByTestId('scene-caption').innerText()).includes('日本橋')) break
  }
  await expect(page.getByTestId('scene-caption')).not.toContainText('日本橋', { timeout: 60_000 })
  // 場面の下に、その土地の解説（時代背景）が出ている
  await expect(page.getByTestId('place-era')).toBeVisible()
  // 小地図を押すと、その場所を見学できる
  const box = (await page.locator('[data-testid=minimap] svg').boundingBox())!
  await page.mouse.click(box.x + 4, box.y + box.height / 2)
  await expect(page.getByTestId('scene-caption')).toContainText('京都 三条大橋', { timeout: 60_000 })
  await expect(page.getByTestId('scene-caption')).toContainText('見学中')
})

test('場面：サイコロがころがって出目と進むマス数が出る → 道を歩いて通る宿場が点く → 次の土地に着く', async ({ browser }) => {
  test.setTimeout(120_000)
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto('/?seed=4')
  await page.getByTestId('start').click()
  await expect(page.getByTestId('scene-caption')).toContainText('日本橋', { timeout: 45_000 })
  // 出ている時間の短い表示（出目・道中の帯）は、画面の変化を監視して、見逃さずに記録する
  await page.evaluate(() => {
    const seen = { dice: '', steps: '', strip: '' }
    ;(window as unknown as { __seen: typeof seen }).__seen = seen
    const scan = () => {
      const f = document.querySelector('[data-testid=dice-face]')
      const st = document.querySelector('[data-testid=dice-steps]')
      const tr = document.querySelector('[data-testid=travel-strip]')
      if (f) seen.dice = f.textContent ?? ''
      if (st) seen.steps = st.textContent ?? ''
      if (tr) seen.strip = tr.textContent ?? ''
    }
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true, characterData: true })
  })
  await page.getByTestId('roll').click()
  // 着いた土地の場面に変わる（日本橋ではなくなる）
  await expect(page.getByTestId('scene-caption')).not.toContainText('日本橋', { timeout: 60_000 })
  const seen = await page.evaluate(() => (window as unknown as { __seen: { dice: string; steps: string; strip: string } }).__seen)
  expect(seen.dice).toMatch(/^[1-6]$/)
  expect(seen.steps).toContain('マス進む')
  // 旅人が道を歩く：通る場所の名前が並ぶ（出発地は日本橋）
  expect(seen.strip).toContain('日本橋')
  await ctx.close()
})

test('カットイン：イベントの題名が帯で出てから、選択肢が出る', async ({ page }) => {
  test.setTimeout(180_000)
  await page.goto('/?seed=4')
  await page.getByTestId('count').selectOption('2')
  await page.getByTestId('start').click()
  let sawCut = false
  let cutBeforeModal = false
  for (let i = 0; i < 400; i++) {
    const modal = await page.getByTestId('event-modal').isVisible()
    const cut = await page.getByTestId('cutin').isVisible()
    if (cut) {
      sawCut = true
      // 帯が出ているあいだは、選択肢は出ていない
      expect(modal).toBe(false)
    }
    if (modal) {
      cutBeforeModal = sawCut
      break
    }
    await page.evaluate(() => {
      for (const id of ['roll', 'buy', 'route-lane']) {
        const el = Array.from(document.querySelectorAll<HTMLButtonElement>(`[data-testid="${id}"]`)).find((e) => !e.disabled && e.offsetParent !== null)
        if (el) {
          el.click()
          return
        }
      }
    })
    await page.waitForTimeout(120)
  }
  expect(cutBeforeModal).toBe(true)
  await expect(page.getByTestId('choice').first()).toBeVisible()
})

test('広重の図：その場所の題名が出る（絵がなければ「準備中」）', async ({ page }) => {
  await page.goto('/?seed=4&fast=1')
  await page.getByTestId('start').click()
  await expect(page.getByTestId('print-title')).toHaveText('『東海道五拾三次之内 日本橋 朝之景』')
  await expect(page.getByTestId('print-card')).toContainText('保永堂版・第1図')
  await expect(page.getByTestId('print-missing')).toBeVisible()
})

test('宿場をめざす：近い宿場までの案内が出て、押すと宿場で止まり、スタンプが付く', async ({ page }) => {
  await page.goto('/?seed=4&fast=1')
  await page.getByTestId('start').click()
  // 日本橋の次の宿場は品川（2マス先）
  await expect(page.getByTestId('stroll')).toContainText('品川')
  await expect(page.getByTestId('stamp-count')).toHaveText('0')
  await page.getByTestId('stroll').click()
  await expect(page.getByTestId('log')).toContainText('宿場をめざして')
  await expect(page.getByTestId('log')).toContainText('品川のスタンプを押した')
  await expect(page.getByTestId('stamp-count')).toHaveText('1')
})

test('宿場スタンプ帳：開くと、押した宿場の名前と、まだの宿場が見える', async ({ page }) => {
  await page.goto('/?seed=4&fast=1')
  await page.getByTestId('start').click()
  await page.getByTestId('stroll').click()
  await page.getByTestId('stampbook').locator('summary').click()
  await expect(page.getByTestId('stamp-got')).toHaveCount(1)
  await expect(page.getByTestId('stampbook')).toContainText('品川')
  await expect(page.getByTestId('stampbook').locator('li')).toHaveCount(53)
})

test('演出の速さを切り替えられ、次回も覚えている', async ({ page }) => {
  await page.goto('/?seed=4')
  await page.getByTestId('start').click()
  await page.getByTestId('view-toggle').click() // 速さの切り替えは、場面（3D）のときに出る
  const t = page.getByTestId('speed-toggle')
  await expect(t).toContainText('ふつう')
  await t.click()
  await expect(t).toContainText('はやい')
  await page.reload()
  await page.getByTestId('continue').click()
  await expect(page.getByTestId('speed-toggle')).toContainText('はやい')
})

test('天気：画面の上に、今日の天気が出る', async ({ page }) => {
  await page.goto('/?seed=4&fast=1')
  await page.getByTestId('start').click()
  await expect(page.getByTestId('weather')).toHaveText(/晴れ|くもり|雨/)
})

test('スタンプを押すと、印の演出が出る', async ({ page }) => {
  await page.goto('/?seed=4&fast=1')
  await page.getByTestId('start').click()
  await page.getByTestId('stroll').click()
  await expect(page.getByTestId('stamp-pop')).toContainText('品川')
  await expect(page.getByTestId('stamp-pop')).toContainText('1/53')
})
