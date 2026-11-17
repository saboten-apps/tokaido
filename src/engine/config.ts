// 設定（数値・盤面・出来事）。数値はコードに直書きせず、src/data/*.json と src/events/*.json に置く。

import balanceJson from '../data/balance.json'
import boardJson from '../data/board.json'
import roadEvents from '../events/road.json'
import specialEvents from '../events/special.json'
import laneEvents from '../events/lane.json'
import type { CpuPersonality, CpuPersonalityId, ForkChoiceDef, GameEvent, Stats, TileDef } from '../types/game'

export interface Range {
  min: number
  max: number
}

export interface Balance {
  game: { playerCount: number; maxDays: number; diceFaces: number; eventChance: number }
  limits: Record<keyof Stats, Range>
  start: Stats
  travel: {
    staminaPerStep: number
    tiredStamina: number
    tiredMaxFace: number
    innCost: number
    innStamina: number
    campStamina: number
    campReputation: number
    teahouseCost: number
    teahouseStamina: number
    teahouseMemories: number
    scenicMemories: number
    workMoney: number
    workStamina: number
    workReputation: number
    cpuWorkBelowMoney: number
  }
  scoring: {
    moneyPerPoint: number
    memoriesWeight: number
    reputationWeight: number
    meibutsuPoints: number
    arrivedBonus: number
    arrivalRankBonus: number[]
  }
  cpuPersonalities: CpuPersonality[]
}

export interface ForkConfig {
  tileIndex: number
  mergeIndex: number
  laneTiles: TileDef[]
  main: ForkChoiceDef
  lane: ForkChoiceDef
}

export interface BoardConfig {
  main: TileDef[]
  forks: ForkConfig[]
}

export interface GameConfig {
  balance: Balance
  board: BoardConfig
  events: GameEvent[]
}

export const DEFAULT_CONFIG: GameConfig = {
  balance: balanceJson as Balance,
  board: boardJson as BoardConfig,
  events: [...roadEvents, ...specialEvents, ...laneEvents] as GameEvent[],
}

export function getEvent(config: GameConfig, id: string): GameEvent {
  const e = config.events.find((x) => x.id === id)
  if (!e) throw new Error(`Unknown event: ${id}`)
  return e
}

export function getPersonality(config: GameConfig, id: CpuPersonalityId): CpuPersonality {
  const p = config.balance.cpuPersonalities.find((x) => x.id === id)
  if (!p) throw new Error(`Unknown personality: ${id}`)
  return p
}
