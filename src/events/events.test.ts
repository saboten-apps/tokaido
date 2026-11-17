import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../engine/config'

describe('出来事のデータ', () => {
  const events = DEFAULT_CONFIG.events
  it('ID とタイトルが一意', () => {
    expect(new Set(events.map((e) => e.id)).size).toBe(events.length)
    expect(new Set(events.map((e) => e.title)).size).toBe(events.length)
  })
  it('条件なしの選択肢を、1つ以上含む', () => {
    for (const e of events) expect(e.choices.some((c) => !c.requires), e.id).toBe(true)
  })
  it('マスの専用イベントは、すべて存在する', () => {
    for (const t of DEFAULT_CONFIG.board.main) if (t.eventId) expect(events.some((e) => e.id === t.eventId), t.eventId).toBe(true)
  })
})

describe('宿場の専用イベント', () => {
  const shukuWithEvent = DEFAULT_CONFIG.board.main.filter((t) => t.type === 'shuku' && t.eventId)
  it('53宿すべてに専用イベントがある', () => {
    expect(shukuWithEvent.length).toBe(53)
  })
  it('専用イベントは once かつ special（抽選に出ず、その宿でだけ起きる）', () => {
    for (const t of shukuWithEvent) {
      const e = DEFAULT_CONFIG.events.find((x) => x.id === t.eventId)!
      expect(e.once && e.special, t.eventId).toBe(true)
    }
  })
})
