import { describe, expect, it } from 'vitest'
import { createGame, getAwaiting, runUntilHuman, submitAction } from '../engine'
import { cutinsFromTransition, indexFromRatio, newLogLines, phaseDelay, positionAtStep, regionEntry, travelMs } from './feedback'

describe('演出の補助', () => {
  it('駒は出発のマスから、通ったマスを1つずつ進む', () => {
    expect(positionAtStep(5, [6, 7, 8], -1)).toBe(5)
    expect(positionAtStep(5, [6, 7, 8], 0)).toBe(6)
    expect(positionAtStep(5, [6, 7, 8], 2)).toBe(8)
    expect(positionAtStep(5, [6, 7, 8], 9)).toBe(8)
    expect(positionAtStep(5, [], 0)).toBe(5)
  })

  it('増えた道中記の行だけを、最大 max 件返す', () => {
    const a = createGame({ seed: 1 })
    const b = structuredClone(a)
    for (const m of ['一', '二', '三', '四']) b.log.push({ day: 1, playerId: null, message: m })
    expect(newLogLines(a, b, 3)).toEqual(['二', '三', '四'])
    expect(newLogLines(a, a)).toEqual([])
  })

  it('小地図の押した位置から、マス番号を求める', () => {
    expect(indexFromRatio(0, 70)).toBe(0)
    expect(indexFromRatio(0.5, 70)).toBe(35)
    expect(indexFromRatio(1, 70)).toBe(69)
    expect(indexFromRatio(-1, 70)).toBe(0)
  })

  it('県の境を越えたときだけ、通知の文が出る', () => {
    const g = createGame({ seed: 1 })
    const hakone = g.board.tiles.findIndex((t) => t.name === '箱根')
    const mishima = g.board.tiles.findIndex((t) => t.name === '三島')
    expect(regionEntry(g.board, '花子', hakone - 1, hakone)).toBeNull()
    expect(regionEntry(g.board, '花子', hakone, mishima)).toContain('静岡県')
    expect(regionEntry(g.board, '花子', hakone, mishima)).toContain('伊豆・駿河・遠江')
  })

  it('道を歩く時間は、通る宿場が多いほど長く、短すぎず、長すぎない', () => {
    expect(travelMs(1)).toBe(2600)
    expect(travelMs(3)).toBeGreaterThan(travelMs(1))
    expect(travelMs(30)).toBe(5600)
  })

  it('場面では、サイコロ → 道を歩く → 着く、の3段階。地図では、これまでの短い間', () => {
    expect(phaseDelay('3d', -1, 4)).toBe(1900)
    expect(phaseDelay('3d', 0, 4)).toBe(travelMs(4))
    expect(phaseDelay('3d', 1, 4)).toBe(3200)
    expect(phaseDelay('2d', -1, 4)).toBe(350)
    expect(phaseDelay('2d', 2, 4)).toBe(120)
  })

  it('カットイン：人間のイベントが始まると、題名・札・場所つきで出る。同じ状態では、二度出ない', () => {
    const g = runUntilHuman(createGame({ seed: 3, playerCount: 2 })).state
    // 箱根（関所のイベント）の手前に置いて、振る
    const hakone = g.board.tiles.findIndex((t) => t.name === '箱根')
    g.board.playerStates.p0.position = hakone - 1
    const out = submitAction(g, 'p0', { type: 'roll' }, undefined, undefined, 6).state
    expect(out.pendingEvent?.eventId).toBe('hakone_sekisho')
    const items = cutinsFromTransition(g, out)
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ tag: '関所', title: '箱根の関所', tone: 'sekisho' })
    expect(items[0].sub).toContain('箱根')
    expect(cutinsFromTransition(out, out)).toEqual([])
  })

  it('カットイン：CPU のイベントは、道中記から。人間の選択の結果の行は、出さない', () => {
    const g = createGame({ seed: 5, playerCount: 3 })
    const cpu = g.players.find((p) => !p.isHuman)!
    const next = structuredClone(g)
    next.log.push({ day: 1, playerId: cpu.id, message: `【にわか雨】${cpu.name}：「笠をかぶって、先を急ぐ」→ 体力-8` })
    const items = cutinsFromTransition(g, next)
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ title: 'にわか雨', tag: '道中の出来事' })
    const me = g.players.find((p) => p.isHuman)!
    const mine = structuredClone(g)
    mine.log.push({ day: 1, playerId: me.id, message: `【にわか雨】${me.name}：「笠をかぶって、先を急ぐ」→ 体力-8` })
    expect(cutinsFromTransition(g, mine)).toEqual([])
  })

  it('カットイン：名物を買う場面と、分かれ道の場面でも出る', () => {
    const g = runUntilHuman(createGame({ seed: 9, playerCount: 2 })).state
    const fork = g.board.forks[0].tileIndex
    g.board.playerStates.p0.position = fork - 1
    const out = submitAction(g, 'p0', { type: 'roll' }, undefined, undefined, 1).state
    expect(getAwaiting(out)?.kind).toBe('fork')
    const items = cutinsFromTransition(g, out)
    expect(items.map((i) => i.tag)).toContain('分かれ道')
    expect(items.find((i) => i.tag === '分かれ道')!.title).toBe('大井川')
    const shina = g.board.tiles.findIndex((t) => t.name === '品川')
    const g2 = runUntilHuman(createGame({ seed: 9, playerCount: 2 })).state
    g2.board.playerStates.p0.position = shina - 1
    const out2 = submitAction(g2, 'p0', { type: 'roll' }, undefined, undefined, 1).state
    // 品川の専用イベントのあとに、名物
    const ev = out2.pendingEvent
    if (ev) {
      const after = submitAction(out2, 'p0', { type: 'event', choiceIndex: 1 }).state
      const m = cutinsFromTransition(out2, after)
      expect(m.map((i) => i.tag)).toContain('名物')
    }
  })
})
