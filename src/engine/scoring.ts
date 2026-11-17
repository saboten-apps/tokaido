// 得点：路銀・思い出・評判・名物の数・到着（着いたか・何番目か）。係数は balance.json の scoring。

import type { GameConfig } from './config'
import type { GameState, Player, ScoreBreakdown } from '../types/game'

export function scorePlayer(player: Player, config: GameConfig): ScoreBreakdown {
  const s = config.balance.scoring
  const money = Math.floor(player.stats.money / s.moneyPerPoint)
  const memories = Math.round(player.stats.memories * s.memoriesWeight)
  const reputation = Math.round(player.stats.reputation * s.reputationWeight)
  const meibutsu = player.meibutsu.length * s.meibutsuPoints
  const arrival = player.arrivalRank === null ? 0 : s.arrivedBonus + (s.arrivalRankBonus[player.arrivalRank - 1] ?? 0)
  return { playerId: player.id, money, memories, reputation, meibutsu, arrival, total: money + memories + reputation + meibutsu + arrival }
}

/** 得点の高い順。同点なら先に着いた順 */
export function rankPlayers(state: GameState, config: GameConfig): ScoreBreakdown[] {
  const byId = new Map(state.players.map((p) => [p.id, p]))
  return state.players
    .map((p) => scorePlayer(p, config))
    .sort((a, b) => b.total - a.total || (byId.get(a.playerId)!.arrivalRank ?? 99) - (byId.get(b.playerId)!.arrivalRank ?? 99))
}
