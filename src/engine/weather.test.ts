import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from './config'
import { weatherOn } from './weather'
import { runUntilHuman, submitAction } from './session'
import { createGame } from './setup'

const cfg = DEFAULT_CONFIG

describe('天気', () => {
  it('同じ種・同じ日なら、同じ天気（保存しなくてよい）', () => {
    for (let d = 1; d <= 40; d++) expect(weatherOn(123, d, cfg)).toBe(weatherOn(123, d, cfg))
  })

  it('雨・くもり・晴れが、設定の確率に近い割合で出る', () => {
    const n = { sunny: 0, cloudy: 0, rain: 0 }
    const days = 4000
    for (let seed = 1; seed <= days / 40; seed++) for (let d = 1; d <= 40; d++) n[weatherOn(seed * 7919, d, cfg)]++
    expect(n.rain / days).toBeGreaterThan(cfg.balance.weather.rainChance - 0.05)
    expect(n.rain / days).toBeLessThan(cfg.balance.weather.rainChance + 0.05)
    expect(n.cloudy / days).toBeGreaterThan(cfg.balance.weather.cloudyChance - 0.05)
    expect(n.sunny).toBeGreaterThan(0)
  })

  it('雨の日は歩くと体力が余分に減り、働いても雨の影響はない。道中記にも出る', () => {
    // 雨の日と、雨でない日の1日目になる種を探す
    let rainy: number | null = null
    let dry: number | null = null
    for (let seed = 1; seed < 200 && (rainy === null || dry === null); seed++) {
      if (weatherOn(seed, 1, cfg) === 'rain') rainy ??= seed
      else dry ??= seed
    }
    const walk = (seed: number) => {
      const s = runUntilHuman(createGame({ seed, playerCount: 2 }, cfg), cfg).state
      const before = s.players[0].stats.stamina
      const r = submitAction(s, 'p0', { type: 'roll' }, cfg, undefined, 3)
      return { used: before - r.state.players[0].stats.stamina, log: r.state.log.map((l) => l.message).join('\n') }
    }
    const a = walk(rainy!)
    const b = walk(dry!)
    expect(a.used - b.used).toBe(3 * cfg.balance.weather.rainStaminaPerStep)
    expect(a.log).toContain('雨の道')
    expect(b.log).not.toContain('雨の道')
  })
})
