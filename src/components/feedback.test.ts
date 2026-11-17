import { describe, expect, it } from 'vitest'
import { createGame } from '../engine'
import { indexFromRatio, newLogLines, positionAtStep, regionEntry } from './feedback'

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
})
