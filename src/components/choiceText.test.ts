import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../engine'
import { choiceChips, deltaChips, forkChips } from './choiceText'

describe('選択肢の結果の数値', () => {
  it('増減を、符号つきで、良い・悪いに分ける', () => {
    expect(deltaChips({ stamina: 8, money: -30, memories: 0 })).toEqual([
      { key: 'money', text: '路銀-30文', tone: 'bad' },
      { key: 'stamina', text: '体力+8', tone: 'good' },
    ])
    expect(deltaChips({})).toEqual([])
  })

  it('運試しは、成功率と、失敗のときの結果を分けて返す', () => {
    const tomikuji = DEFAULT_CONFIG.events.find((e) => e.id === 'tomikuji')!.choices[0]
    const r = choiceChips(tomikuji)
    expect(r.chance).toBe(20)
    expect(r.fail?.map((c) => c.text)).toContain('路銀-60文')
    expect(r.success.map((c) => c.text)).toContain('路銀-60文')
  })

  it('足止めの日数も、結果に出る', () => {
    const ame = DEFAULT_CONFIG.events.find((e) => e.id === 'ame')!.choices[1]
    expect(choiceChips(ame).success.map((c) => c.text)).toContain('足止め1日')
  })

  it('分かれ道の選択肢にも、数値が出る', () => {
    const f = DEFAULT_CONFIG.board.forks[0]
    expect(forkChips(f.main).map((c) => c.text)).toEqual(['路銀-300文'])
    expect(forkChips(f.lane).map((c) => c.text)).toEqual(['思い出+4'])
  })

  it('すべての出来事の、すべての選択肢が、何かの結果を持つ（数値のない選択肢は、「何も起きない」）', () => {
    for (const e of DEFAULT_CONFIG.events) for (const c of e.choices) expect(() => choiceChips(c), e.id).not.toThrow()
  })
})
