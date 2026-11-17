import { describe, expect, it } from 'vitest'
import { SPEED_FACTOR, SPEED_ORDER, loadSpeed, nextSpeed } from './speed'

describe('演出の速さの設定', () => {
  it('ゆっくり → ふつう → はやい → ゆっくり、と順に切り替わる', () => {
    expect(nextSpeed('slow')).toBe('normal')
    expect(nextSpeed('normal')).toBe('fast')
    expect(nextSpeed('fast')).toBe('slow')
  })
  it('倍率は、はやい < ふつう(1) < ゆっくり', () => {
    expect(SPEED_FACTOR.normal).toBe(1)
    expect(SPEED_FACTOR.fast).toBeLessThan(1)
    expect(SPEED_FACTOR.slow).toBeGreaterThan(1)
    expect(SPEED_ORDER).toHaveLength(3)
  })
  it('覚えがない（または使えない）ときは、ふつう', () => {
    expect(loadSpeed()).toBe('normal')
  })
})
