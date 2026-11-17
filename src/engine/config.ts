// 設定（数値・盤面・出来事）。数値はコードに直書きせず、src/data/*.json と src/events/*.json に置く。

import balanceJson from '../data/balance.json'
import boardJson from '../data/board.json'
import titlesJson from '../data/titles.json'
import regionsJson from '../data/regions.json'
import placesJson from '../data/places.json'
import hiroshigeJson from '../data/hiroshige.json'
import roadEvents from '../events/road.json'
import specialEvents from '../events/special.json'
import shukuEvents from '../events/shuku.json'
import laneEvents from '../events/lane.json'
import type { CpuPersonality, CpuPersonalityId, ForkChoiceDef, GameEvent, RegionId, RoleId, StatDelta, Stats, TileDef, TitleDef } from '../types/game'

export interface Range {
  min: number
  max: number
}

/** 身分の持ち味 */
export interface RoleDef {
  name: string
  desc: string
  /** CPU がこの身分のとき、判断に使う流儀 */
  personality: CpuPersonalityId
  /** 開始時の能力値への加減 */
  start: StatDelta
  /** 「働く」で、路銀に足す額・思い出に足す量 */
  workMoneyBonus: number
  workMemories: number
  /** 名所・茶屋で、思い出に足す量 */
  scenicBonus: number
  /** 早足の体力の消費（null なら、travel.hurryStamina） */
  hurryStamina: number | null
  /** 宿代にかける倍率 */
  innRate: number
}

export interface Balance {
  game: { playerCount: number; maxDays: number; diceFaces: number; eventChance: number; shukuEventChance: number }
  limits: Record<keyof Stats, Range>
  start: Stats
  travel: {
    staminaPerStep: number
    tiredStamina: number
    tiredMaxFace: number
    innCost: number
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
    hurryBonus: number
    hurryStamina: number
    hurryMinStamina: number
  }
  scoring: {
    moneyPerPoint: number
    memoriesWeight: number
    reputationWeight: number
    meibutsuPoints: number
    arrivedBonus: number
    arrivalRankBonus: number[]
  }
  /** 泊まり方。本陣は、評判が reputationAt 以上のとき、宿場で日が終わると招かれる（無料） */
  lodging: {
    kichin: { name: string; costRate: number; stamina: number }
    hatago: { name: string; costRate: number; stamina: number }
    honjin: { name: string; reputationAt: number; stamina: number; memories: number }
  }
  /** 評判の効果：goodAt 以上で宿代が goodInnRate 倍、badBelow 未満で badInnRate 倍 */
  reputation: { goodAt: number; goodInnRate: number; badBelow: number; badInnRate: number }
  roles: Record<RoleId, RoleDef>
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
  titles: TitleDef[]
}

export const DEFAULT_CONFIG: GameConfig = {
  balance: balanceJson as Balance,
  board: boardJson as BoardConfig,
  events: [...roadEvents, ...specialEvents, ...shukuEvents, ...laneEvents] as GameEvent[],
  titles: titlesJson as TitleDef[],
}

/** 県の見た目・紹介（regions.json） */
export interface RegionDef {
  name: string
  /** 旧国名 */
  province: string
  tagline: string
  sky: string
  fog: string
  ground: string
  grass: string
  road: string
  /** 2D の帯の色 */
  band: string
}

/** その場所の、時代背景と、現代の豆知識（places.json。キーはマスの名前） */
export interface PlaceInfo {
  /** 時代背景（江戸時代のこと） */
  era?: string
  /** 今では（現代の豆知識） */
  now?: string
}
export const PLACES = placesJson as Record<string, PlaceInfo>

/**
 * 歌川広重『東海道五拾三次』（保永堂版）の、その場所の図（hiroshige.json。キーはマスの名前）。
 * image・credit・source は、絵を取り込んだとき（scripts/importHiroshige.ts）に入る。まだなければ、題名だけを見せる。
 */
export interface HiroshigePrint {
  /** 図の番号（1 日本橋 〜 55 京師） */
  plate: number
  /** 板に彫られた宿名（例：由井・荒井・赤阪・坂之下・京師） */
  station: string
  /** 副題（例：湖水図） */
  subtitle: string
  /** 画像（public/hiroshige/ 以下の URL） */
  image?: string
  /** 出どころ・権利の表示 */
  credit?: string
  /** 所蔵館の資料のページ */
  source?: string
}
export const HIROSHIGE = hiroshigeJson as Record<string, HiroshigePrint>

export const REGION_ORDER = regionsJson.order as RegionId[]
export const REGIONS = regionsJson.regions as Record<RegionId, RegionDef>

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

export const ROLE_IDS = Object.keys(DEFAULT_CONFIG.balance.roles) as RoleId[]

export function getRole(config: GameConfig, id: RoleId): RoleDef {
  const r = config.balance.roles[id]
  if (!r) throw new Error(`Unknown role: ${id}`)
  return r
}
