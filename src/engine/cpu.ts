// CPU の判断。旅の流儀（性格）ごとの重みで選択肢を評価する（umaregacya の cpu.ts を旅向けに作り替え）。

import { getPersonality, type GameConfig } from './config'
import { canHurry, innCostFor } from './board'
import { isChoiceAvailable } from './events'
import { STAT_KEYS } from './stats'
import type { Rng } from './rng'
import type { CpuPersonality, EventChoice, ForkDef, GameEvent, Meibutsu, Player, StatDelta } from '../types/game'

/** 路銀は桁が大きいので、評価では 100文 = 1 として扱う */
const MONEY_SCALE = 100
const NOISE = 3
/** 足止め1日あたりの損（遅れると到着順の得点が下がる） */
const REST_DAY_COST = 6

function personalityOf(player: Player, config: GameConfig): CpuPersonality {
  return getPersonality(config, player.personality ?? 'steady')
}

function deltaValue(delta: StatDelta, p: CpuPersonality): number {
  let v = 0
  for (const k of STAT_KEYS) {
    const d = delta[k] ?? 0
    v += (k === 'money' ? d / MONEY_SCALE : d) * p.weights[k]
  }
  return v
}

export function evaluateChoice(player: Player, choice: EventChoice, p: CpuPersonality): number {
  let v = choice.gamble
    ? choice.gamble.chance * deltaValue(choice.effects, p) + (1 - choice.gamble.chance) * deltaValue(choice.gamble.failEffects, p)
    : deltaValue(choice.effects, p)
  v -= (choice.restDays ?? 0) * REST_DAY_COST
  if (player.stats.stamina + (choice.effects.stamina ?? 0) <= 10) v -= 10
  return v
}

/** CPU が選ぶ選択肢の番号 */
export function chooseCpuChoice(player: Player, event: GameEvent, config: GameConfig, rng: Rng): number {
  const p = personalityOf(player, config)
  let best = -1
  let bestValue = -Infinity
  event.choices.forEach((choice, i) => {
    if (!isChoiceAvailable(player, choice)) return
    const v = evaluateChoice(player, choice, p) + (rng.next() - 0.5) * NOISE
    if (v > bestValue) {
      bestValue = v
      best = i
    }
  })
  return Math.max(0, best)
}

/** サイコロの代わりに、働いて稼ぐか */
export function shouldCpuWork(player: Player, config: GameConfig): boolean {
  return player.stats.money < config.balance.travel.cpuWorkBelowMoney
}

export type CpuMove = 'work' | 'hurry' | 'roll'

/** 手番の動き：路銀が少なければ働く。体力に余裕があれば、流儀に応じて早足 */
export function chooseCpuMove(player: Player, config: GameConfig, rng: Rng): CpuMove {
  if (shouldCpuWork(player, config)) return 'work'
  if (canHurry(player, config) && player.stats.stamina >= config.balance.travel.hurryMinStamina + 15) {
    if (rng.next() < personalityOf(player, config).hurryLove) return 'hurry'
  }
  return 'roll'
}

/** 名物を買うか（宿代2日ぶんは残す） */
export function chooseCpuBuyMeibutsu(player: Player, m: Meibutsu, config: GameConfig): boolean {
  const reserve = innCostFor(player, config) * 2
  if (player.stats.money - m.price < reserve) return false
  const p = personalityOf(player, config)
  const value = p.meibutsuLove + m.memories * p.weights.memories - (m.price / MONEY_SCALE) * p.weights.money
  return value > 0
}

/** 分かれ道で選ぶ道 */
export function chooseCpuRoute(player: Player, fork: ForkDef, config: GameConfig, rng: Rng): 'main' | 'lane' {
  const mainCost = -(fork.main.effects.money ?? 0)
  if (player.stats.money - mainCost < innCostFor(player, config)) return 'lane'
  return rng.next() < personalityOf(player, config).detourLove ? 'lane' : 'main'
}
