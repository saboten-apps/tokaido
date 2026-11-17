import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, PLACES } from '../engine'
import scenesJson from '../data/scenes.json'
import { BUILDERS, MOODS } from './sceneKit'

const scenes = scenesJson as Record<string, { motifs: string[]; mood: string }>
const tileNames = [...DEFAULT_CONFIG.board.main, ...DEFAULT_CONFIG.board.forks.flatMap((f) => f.laneTiles)].map((t) => t.name)

describe('場面のデータ（scenes.json）', () => {
  it('すべてのマスに、場面がある。盤面にない名前はない', () => {
    for (const n of tileNames) expect(scenes[n], n).toBeDefined()
    for (const k of Object.keys(scenes)) expect(tileNames.includes(k), k).toBe(true)
  })

  it('部品の名前と、時間・天気の名前は、すべて、用意されている', () => {
    for (const [n, s] of Object.entries(scenes)) {
      expect(s.motifs.length, n).toBeGreaterThan(0)
      expect(Object.keys(MOODS), n).toContain(s.mood)
      for (const m of s.motifs) {
        const name = m.split('=')[0].split(':')[0]
        expect(Object.keys(BUILDERS), `${n}:${m}`).toContain(name)
      }
    }
  })

  it('橋には川、渡し舟には水辺、大井川の人足には川が、いっしょにある（宙に浮かない）', () => {
    for (const [n, s] of Object.entries(scenes)) {
      const names = s.motifs.map((m) => m.split('=')[0].split(':')[0])
      if (names.includes('bridge')) expect(names, n).toContain('river')
      if (names.includes('porters')) expect(names, n).toContain('river')
      const ferry = s.motifs.find((m) => m.startsWith('ferry='))
      if (ferry) expect(names, n).toContain(ferry.split('=')[1])
    }
  })

  it('立て札には、文字がある。城のある場所は、解説にも城が出てくる（浜松・小田原・岡崎）', () => {
    for (const [n, s] of Object.entries(scenes)) for (const m of s.motifs) if (m.startsWith('signpost')) expect(m.split('=')[1], n).toBeTruthy()
    for (const n of ['浜松', '小田原', '岡崎']) {
      expect(scenes[n].motifs.some((m) => m.startsWith('castle')), n).toBe(true)
    }
    expect(PLACES['浜松'].era).toContain('浜松城')
  })

  it('夜・雪・雨・朝・夕の場面がある（時間と天気が変わる）', () => {
    const moods = new Set(Object.values(scenes).map((s) => s.mood))
    for (const m of ['day', 'morning', 'dusk', 'night', 'rain', 'snow', 'mist']) expect(moods.has(m), m).toBe(true)
  })
})
