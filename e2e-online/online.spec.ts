import { expect, test, type Page } from '@playwright/test'

/** 自分の番なら、見えているボタンを1つ押す（振る／選ぶ／買う／分かれ道）。1回の呼び出しで押す（再描画に負けない） */
async function step(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    for (const id of ['roll', 'choice', 'buy', 'route-lane']) {
      const el = [...document.querySelectorAll<HTMLButtonElement>(`[data-testid="${id}"]`)].find((e) => !e.disabled && e.offsetParent !== null)
      if (el) {
        el.click()
        return true
      }
    }
    return false
  })
}

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    if (!localStorage.getItem('tokaido-sugoroku:view-mode')) localStorage.setItem('tokaido-sugoroku:view-mode', '2d')
  })
})

test('2人がオンラインの部屋で、最後まで遊べる', async ({ browser }) => {
  const ctxA = await browser.newContext()
  const ctxB = await browser.newContext()
  const a = await ctxA.newPage()
  const b = await ctxB.newPage()

  // A が部屋をつくる（2人部屋）
  await a.goto('/?fast=1')
  await a.getByTestId('go-online').click()
  await a.getByTestId('online-name').fill('花子')
  await a.getByTestId('online-capacity').selectOption('2')
  await a.getByTestId('online-create').click()
  await expect(a.getByTestId('lobby')).toBeVisible()
  const code = (await a.getByTestId('room-code').innerText()).trim()
  expect(code).toMatch(/^[A-HJ-NP-Z2-9]{5}$/)

  // B が招待リンクで入る
  await b.goto(`/?room=${code}&fast=1`)
  await expect(b.getByTestId('online-code')).toHaveValue(code)
  await b.getByTestId('online-name').fill('太郎')
  await b.getByTestId('online-join').click()
  await expect(b.getByTestId('lobby')).toBeVisible()
  await expect(a.getByTestId('seat-太郎')).toBeVisible()

  // B は身分を選ぶ
  await b.getByTestId('online-role').selectOption('hikyaku')
  await expect(a.getByTestId('seat-太郎')).toContainText('飛脚')

  // 2人とも準備完了、A が始める
  await a.getByTestId('ready').click()
  await b.getByTestId('ready').click()
  await expect(a.getByTestId('online-start')).toBeEnabled()
  await a.getByTestId('online-start').click()
  await expect(a.getByTestId('online-game')).toBeVisible()
  await expect(b.getByTestId('online-game')).toBeVisible()

  // 手番の人だけが操作できる：最初は A（p0）の番で、B には待ちの表示
  await expect(a.getByTestId('roll')).toBeVisible()
  await expect(b.getByTestId('roll')).toHaveCount(0)
  await expect(b.getByTestId('waiting')).toContainText('花子')
  await expect(a.getByTestId('role-p1')).toHaveText('飛脚')

  // 最後まで、それぞれの番に進める
  const t0 = Date.now()
  while (Date.now() - t0 < 240_000) {
    if ((await a.getByTestId('result').isVisible()) && (await b.getByTestId('result').isVisible())) break
    await step(a)
    await step(b)
    // 押したあと、サーバーの返事（次の状態）を少し待つ
    await a.waitForTimeout(40)
  }
  await expect(a.getByTestId('result')).toBeVisible()
  await expect(b.getByTestId('result')).toBeVisible()
  const totalsA = await a.locator('[data-testid^="total-"]').allInnerTexts()
  const totalsB = await b.locator('[data-testid^="total-"]').allInnerTexts()
  expect(totalsA.sort()).toEqual(totalsB.sort())

  await ctxA.close()
  await ctxB.close()
})

test('存在しない部屋には入れない', async ({ browser }) => {
  const ctx = await browser.newContext()
  const p = await ctx.newPage()
  await p.goto('/?room=ZZZZZ')
  await p.getByTestId('online-join').click()
  await expect(p.getByTestId('conn-status')).toContainText('切断', { timeout: 15_000 })
  await ctx.close()
})

test('通常の速さでは、駒が動き終わってから、次の操作ができる', async ({ browser }) => {
  const ctxA = await browser.newContext()
  const ctxB = await browser.newContext()
  const a = await ctxA.newPage()
  const b = await ctxB.newPage()
  await a.goto('/')
  await a.getByTestId('go-online').click()
  await a.getByTestId('online-name').fill('花子')
  await a.getByTestId('online-capacity').selectOption('2')
  await a.getByTestId('online-create').click()
  const code = (await a.getByTestId('room-code').innerText()).trim()
  await b.goto(`/?room=${code}`)
  await b.getByTestId('online-name').fill('太郎')
  await b.getByTestId('online-join').click()
  await a.getByTestId('ready').click()
  await b.getByTestId('ready').click()
  await a.getByTestId('online-start').click()
  await a.getByTestId('roll').click()
  // 2人の画面に、サイコロの目が出る
  await expect(a.getByTestId('dice-pop')).toBeVisible()
  await expect(b.getByTestId('dice-pop')).toBeVisible()
  // 動いているあいだは、操作の欄が隠れている。終われば、次の判断（または B の番）になる
  await expect(a.getByTestId('dice-pop')).toBeHidden({ timeout: 10_000 })
  await ctxA.close()
  await ctxB.close()
})
