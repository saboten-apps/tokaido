import type { Range } from './config'
import type { StatDelta, StatKey, Stats } from '../types/game'

export const STAT_KEYS: readonly StatKey[] = ['money', 'stamina', 'memories', 'reputation']

export const STAT_LABELS: Record<StatKey, string> = { money: '路銀', stamina: '体力', memories: '思い出', reputation: '評判' }

export function clampStats(stats: Stats, limits: Record<StatKey, Range>): Stats {
  const out = { ...stats }
  for (const k of STAT_KEYS) out[k] = Math.min(limits[k].max, Math.max(limits[k].min, Math.round(out[k])))
  return out
}

/** 変化量を足して、上下限に収めた新しい能力値を返す */
export function applyDelta(stats: Stats, delta: StatDelta, limits: Record<StatKey, Range>): Stats {
  const next = { ...stats }
  for (const k of STAT_KEYS) next[k] += delta[k] ?? 0
  return clampStats(next, limits)
}

/** 「路銀-200文 / 思い出+3」のような説明 */
export function formatDelta(delta: StatDelta): string {
  return STAT_KEYS.filter((k) => delta[k])
    .map((k) => `${STAT_LABELS[k]}${delta[k]! > 0 ? '+' : ''}${delta[k]}${k === 'money' ? '文' : ''}`)
    .join(' / ')
}
