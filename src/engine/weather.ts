// 天気。旅の日ごとに、種（seed）と日にちから決まる（保存しなくても、同じ日は同じ天気）。
// 雨の日は歩くのが大変（1歩ごとの体力が増える）。働けば、雨の影響を受けない。乱数の状態は動かさない。

import type { GameConfig } from './config'

export type Weather = 'sunny' | 'cloudy' | 'rain'

/** 整数の種から 0〜1 の値を作る（mulberry32 の1回ぶん。rng の状態には触れない） */
function unit(n: number): number {
  let t = (n + 0x6d2b79f5) >>> 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export function weatherOn(seed: number, day: number, config: GameConfig): Weather {
  const w = config.balance.weather
  const u = unit((seed ^ Math.imul(day, 0x9e3779b1)) >>> 0)
  if (u < w.rainChance) return 'rain'
  if (u < w.rainChance + w.cloudyChance) return 'cloudy'
  return 'sunny'
}

export const WEATHER_LABEL: Record<Weather, string> = { sunny: '晴れ', cloudy: 'くもり', rain: '雨' }
export const WEATHER_ICON: Record<Weather, string> = { sunny: '☀', cloudy: '☁', rain: '☔' }
