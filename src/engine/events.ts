// 出来事の抽選と、選択肢の効果の適用（umaregacya の events.ts を旅向けに作り替え）。

import type { GameConfig } from './config'
import { applyDelta, formatDelta } from './stats'
import { chance, weightedPick, type Rng } from './rng'
import type { EventChoice, EventCondition, GameEvent, Player } from '../types/game'

export function isConditionMet(player: Player, cond: EventCondition | undefined): boolean {
  if (!cond) return true
  const s = player.stats
  if (cond.minMoney !== undefined && s.money < cond.minMoney) return false
  if (cond.minStamina !== undefined && s.stamina < cond.minStamina) return false
  if (cond.maxStamina !== undefined && s.stamina > cond.maxStamina) return false
  if (cond.minReputation !== undefined && s.reputation < cond.minReputation) return false
  if (cond.hasFlags && !cond.hasFlags.every((f) => player.flags.includes(f))) return false
  if (cond.notFlags && cond.notFlags.some((f) => player.flags.includes(f))) return false
  return true
}

export function isChoiceAvailable(player: Player, choice: EventChoice): boolean {
  return isConditionMet(player, choice.requires)
}

export function isEventEligible(player: Player, event: GameEvent): boolean {
  if (event.once && player.usedOnceEvents.includes(event.id)) return false
  if (!isConditionMet(player, event.conditions)) return false
  return event.choices.some((c) => isChoiceAvailable(player, c))
}

/** 出来事マスで起きる出来事を選ぶ（起きなければ null） */
export function drawEvent(player: Player, config: GameConfig, rng: Rng): GameEvent | null {
  if (!chance(rng, config.balance.game.eventChance)) return null
  const eligible = config.events.filter((e) => !e.special && isEventEligible(player, e))
  return weightedPick(rng, eligible, (e) => e.weight)
}

export function markEventUsed(player: Player, event: GameEvent): void {
  if (event.once && !player.usedOnceEvents.includes(event.id)) player.usedOnceEvents.push(event.id)
}

/** 選択肢の効果を player に適用し（player を直接更新する）、結果の説明文を返す */
export function applyChoice(player: Player, choice: EventChoice, config: GameConfig, rng: Rng): string {
  const limits = config.balance.limits
  const parts: string[] = []
  let delta = choice.effects
  if (choice.gamble) {
    const won = chance(rng, choice.gamble.chance)
    delta = won ? choice.effects : choice.gamble.failEffects
    parts.push(won ? 'うまくいった！' : 'うまくいかなかった……')
  }
  player.stats = applyDelta(player.stats, delta, limits)
  const d = formatDelta(delta)
  if (d) parts.push(d)
  if (choice.restDays && choice.restDays > 0) {
    player.restDays += choice.restDays
    parts.push(`${choice.restDays}日足止め`)
  }
  for (const f of choice.addFlags ?? []) if (!player.flags.includes(f)) player.flags.push(f)
  if (choice.removeFlags) player.flags = player.flags.filter((f) => !choice.removeFlags!.includes(f))
  return parts.length ? `「${choice.label}」→ ${parts.join(' / ')}` : `「${choice.label}」`
}
