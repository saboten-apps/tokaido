import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, PLACES } from '../engine'

const names = new Set([...DEFAULT_CONFIG.board.main, ...DEFAULT_CONFIG.board.forks.flatMap((f) => f.laneTiles)].map((t) => t.name))

describe('場所の解説（時代背景・今では）', () => {
  it('キーは、すべて盤面にあるマスの名前', () => {
    for (const k of Object.keys(PLACES)) expect(names.has(k), k).toBe(true)
  })

  it('53宿すべてと、日本橋・京都・大井川に、解説がある', () => {
    for (const t of DEFAULT_CONFIG.board.main) if (t.type === 'shuku') expect(PLACES[t.name], t.name).toBeDefined()
    for (const n of ['日本橋', '京都 三条大橋', '大井川']) expect(PLACES[n], n).toBeDefined()
  })

  it('宿場の解説には、時代背景（era）がある。短すぎず、長すぎない', () => {
    for (const t of DEFAULT_CONFIG.board.main) {
      if (t.type !== 'shuku') continue
      const e = PLACES[t.name].era
      expect(e, t.name).toBeTruthy()
      expect(e!.length, t.name).toBeGreaterThan(10)
    }
    for (const [k, v] of Object.entries(PLACES)) {
      expect((v.era ?? '').length, k).toBeLessThanOrEqual(220)
      expect((v.now ?? '').length, k).toBeLessThanOrEqual(220)
    }
  })

  it('現代の豆知識（now）は、半分以上の場所にある', () => {
    const n = Object.values(PLACES).filter((v) => v.now).length
    expect(n).toBeGreaterThan(Object.keys(PLACES).length / 2)
  })
})
