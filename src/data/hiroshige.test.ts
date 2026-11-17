import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, HIROSHIGE } from '../engine'

describe('広重『東海道五拾三次』の図（hiroshige.json）', () => {
  it('55図：番号は 1〜55 で重ならず、キーは盤面のマスの名前', () => {
    const names = new Set(DEFAULT_CONFIG.board.main.map((t) => t.name))
    const plates = Object.values(HIROSHIGE).map((h) => h.plate).sort((a, b) => a - b)
    expect(plates).toEqual(Array.from({ length: 55 }, (_, i) => i + 1))
    for (const k of Object.keys(HIROSHIGE)) expect(names.has(k), k).toBe(true)
  })

  it('日本橋が1番、京師（三条大橋）が55番。53宿すべてに、図がある', () => {
    expect(HIROSHIGE['日本橋'].plate).toBe(1)
    expect(HIROSHIGE['京都 三条大橋']).toMatchObject({ plate: 55, station: '京師' })
    for (const t of DEFAULT_CONFIG.board.main) if (t.type === 'shuku') expect(HIROSHIGE[t.name], t.name).toBeDefined()
  })

  it('板の宿名は、地名の表記と違うものがある（由井・荒井・赤阪・坂之下）', () => {
    expect(HIROSHIGE['由比'].station).toBe('由井')
    expect(HIROSHIGE['新居'].station).toBe('荒井')
    expect(HIROSHIGE['赤坂'].station).toBe('赤阪')
    expect(HIROSHIGE['坂下'].station).toBe('坂之下')
  })

  it('絵（image）がある図には、出どころ（credit）がある。権利の表示のない絵は、入れない', () => {
    for (const [k, h] of Object.entries(HIROSHIGE)) if (h.image) expect(h.credit, k).toBeTruthy()
  })
})
