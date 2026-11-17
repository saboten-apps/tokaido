// 選択肢の「結果の数値」を、ボタンに添える文字にする（体力+8・路銀-30文 など）。

import { STAT_KEYS, STAT_LABELS } from '../engine'
import type { EventChoice, ForkChoiceDef, StatDelta, StatKey } from '../types/game'

export interface Chip {
  key: StatKey | 'rest' | 'luck'
  text: string
  /** 良い（＋）・悪い（－）・中立 */
  tone: 'good' | 'bad' | 'plain'
}

export function deltaChips(delta: StatDelta): Chip[] {
  return STAT_KEYS.filter((k) => delta[k]).map((k) => {
    const v = delta[k]!
    return { key: k, text: `${STAT_LABELS[k]}${v > 0 ? '+' : ''}${v}${k === 'money' ? '文' : ''}`, tone: v > 0 ? 'good' : 'bad' }
  })
}

/** 選択肢の結果。運試しは、成功したときと、失敗したときを、分けて見せる */
export function choiceChips(choice: EventChoice): { success: Chip[]; fail: Chip[] | null; chance: number | null } {
  const success = deltaChips(choice.effects)
  const rest = choice.restDays ? [{ key: 'rest' as const, text: `足止め${choice.restDays}日`, tone: 'bad' as const }] : []
  if (choice.gamble) {
    return { success: [...success, ...rest], fail: deltaChips(choice.gamble.failEffects), chance: Math.round(choice.gamble.chance * 100) }
  }
  return { success: [...success, ...rest], fail: null, chance: null }
}

export function forkChips(choice: ForkChoiceDef): Chip[] {
  return deltaChips(choice.effects)
}
