// CPU 同士の旅を大量に回して、バランス（得点・到着日数・路銀切れ）を確かめる。

import { DEFAULT_CONFIG, type GameConfig } from './config'
import { rankPlayers } from './scoring'
import { runUntilHuman } from './session'
import { createGame } from './setup'
import type { CpuPersonalityId, GameState } from '../types/game'

export interface SimulationStats {
  games: number
  avgDays: number
  arrivedRate: number
  avgArrivalDay: number
  avgScore: number
  avgMeibutsu: number
  /** 「働いて稼ぐ」を選んだ手番の割合 */
  workRate: number
  /** 野宿した回数（1人1旅あたり） */
  campsPerPlayer: number
  /** 流儀ごとの勝率 */
  winRateByPersonality: Record<string, number>
  laneRate: number
}

export function playToEnd(state: GameState, config: GameConfig = DEFAULT_CONFIG): GameState {
  return runUntilHuman(state, config).state
}

export function simulateGames(games: number, startSeed = 1, config: GameConfig = DEFAULT_CONFIG, playerCount = 4): SimulationStats {
  let days = 0, arrived = 0, players = 0, arrivalDays = 0, score = 0, meibutsu = 0, works = 0, rolls = 0, camps = 0, lanes = 0
  const wins: Record<string, number> = {}
  const seats: Record<string, number> = {}
  for (let g = 0; g < games; g++) {
    const end = playToEnd(createGame({ seed: startSeed + g, includeHuman: false, playerCount }, config), config)
    days += end.day
    const ranking = rankPlayers(end, config)
    const winner = end.players.find((p) => p.id === ranking[0].playerId)!
    wins[winner.personality!] = (wins[winner.personality!] ?? 0) + 1
    for (const p of end.players) {
      players += 1
      seats[p.personality as CpuPersonalityId] = (seats[p.personality as CpuPersonalityId] ?? 0) + 1
      if (p.arrivedDay !== null) {
        arrived += 1
        arrivalDays += p.arrivedDay
      }
      meibutsu += p.meibutsu.length
      score += ranking.find((r) => r.playerId === p.id)!.total
    }
    for (const l of end.log) {
      if (l.message.includes('働いて')) works += 1
      else if (l.message.includes('を出して')) rolls += 1
      if (l.message.includes('野宿')) camps += 1
      if (l.message.includes('川明けを待つ')) lanes += 1
    }
  }
  const winRateByPersonality: Record<string, number> = {}
  for (const k of Object.keys(seats)) winRateByPersonality[k] = (wins[k] ?? 0) / games
  return {
    games,
    avgDays: days / games,
    arrivedRate: arrived / players,
    avgArrivalDay: arrived ? arrivalDays / arrived : 0,
    avgScore: score / players,
    avgMeibutsu: meibutsu / players,
    workRate: works / Math.max(1, works + rolls),
    campsPerPlayer: camps / players,
    winRateByPersonality,
    laneRate: lanes / players,
  }
}
