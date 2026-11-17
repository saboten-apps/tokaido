// 称号：旅の終わりに、条件を満たしたものがすべて付く。条件は src/data/titles.json。

import type { GameConfig } from './config'
import type { Player, TitleCondition, TitleDef } from '../types/game'

function met(p: Player, c: TitleCondition): boolean {
  if (c.minMemories !== undefined && p.stats.memories < c.minMemories) return false
  if (c.minMeibutsu !== undefined && p.meibutsu.length < c.minMeibutsu) return false
  if (c.minStamps !== undefined && p.visited.length < c.minStamps) return false
  if (c.minReputation !== undefined && p.stats.reputation < c.minReputation) return false
  if (c.minMoney !== undefined && p.stats.money < c.minMoney) return false
  if (c.arrivalRank !== undefined && p.arrivalRank !== c.arrivalRank) return false
  if (c.hasEvents && !c.hasEvents.every((id) => p.usedOnceEvents.includes(id))) return false
  if (c.hasFlags && !c.hasFlags.every((f) => p.flags.includes(f))) return false
  return true
}

/** 京都に着いた人だけが、称号を得る */
export function earnedTitles(player: Player, config: GameConfig): TitleDef[] {
  if (player.arrivalRank === null) return []
  return config.titles.filter((t) => met(player, t.when))
}
