// 盤面：東海道の一本道（周回しない）と分かれ道。umaregacya の board.ts から、分かれ道・脇道・合流の進み方だけを写し、
// 終点（京都）で止まるようにした。関所・川など mustStop のマスは、通り過ぎずに必ず止まる。

import type { GameConfig } from './config'
import { randomInt, type Rng } from './rng'
import type { BoardState, ForkDef, LodgingId, Player, PlayerBoardState, RegionId, TileDef } from '../types/game'

export function createInitialBoardState(players: readonly Player[], config: GameConfig): BoardState {
  const tiles: TileDef[] = config.board.main.map((t) => ({ ...t }))
  const mainLength = tiles.length
  const forks: ForkDef[] = config.board.forks.map((f) => {
    const laneStart = tiles.length
    tiles.push(...f.laneTiles.map((t) => ({ ...t })))
    return { tileIndex: f.tileIndex, laneStart, laneLength: f.laneTiles.length, mergeIndex: f.mergeIndex, main: f.main, lane: f.lane }
  })
  const playerStates: Record<string, PlayerBoardState> = {}
  for (const p of players) playerStates[p.id] = { position: 0 }
  return { mainLength, tiles, forks, playerStates }
}

export function goalIndex(board: BoardState): number {
  return board.mainLength - 1
}

export function isLaneIndex(board: BoardState, index: number): boolean {
  return index >= board.mainLength
}

export function forkAt(board: BoardState, index: number): ForkDef | undefined {
  return board.forks.find((f) => f.tileIndex === index)
}

/** いる脇道（いなければ undefined） */
export function laneOf(board: BoardState, pos: number): ForkDef | undefined {
  return board.forks.find((f) => pos >= f.laneStart && pos < f.laneStart + f.laneLength)
}

/** 1マス先。終点（京都）なら null */
export function nextTileIndex(board: BoardState, pos: number, route: 'main' | 'lane' | undefined): number | null {
  if (pos < board.mainLength) {
    if (pos >= goalIndex(board)) return null
    const fork = forkAt(board, pos)
    if (fork && route === 'lane') return fork.laneStart
    return pos + 1
  }
  const fork = laneOf(board, pos)
  if (!fork) return null
  return pos === fork.laneStart + fork.laneLength - 1 ? fork.mergeIndex : pos + 1
}

/**
 * pos から最大 steps マス進んだ各マス。京都・必ず止まるマス（関所・川）に入ったら、そこで止まる。
 * route は、出発するマスが岐路のときに使う道。
 */
export function pathFrom(board: BoardState, pos: number, steps: number, route: 'main' | 'lane' | undefined): number[] {
  const path: number[] = []
  let cur = pos
  for (let i = 0; i < steps; i++) {
    const nx = nextTileIndex(board, cur, i === 0 ? route : undefined)
    if (nx === null) break
    cur = nx
    path.push(cur)
    if (board.tiles[cur].mustStop || cur === goalIndex(board)) break
  }
  return path
}

/**
 * 「宿場をめざす」の道のり：pathFrom と同じだが、宿場（または京都）に着いたら、そこで止まる。
 * 通り過ぎずに宿場で止まれば、スタンプ・名物・宿が手に入る（そのかわり、出目の残りは使わない）。
 */
export function strollPath(board: BoardState, pos: number, steps: number, route: 'main' | 'lane' | undefined): number[] {
  const path = pathFrom(board, pos, steps, route)
  const k = path.findIndex((i) => board.tiles[i].type === 'shuku')
  return k >= 0 ? path.slice(0, k + 1) : path
}

/** いまの位置から、いちばん近い先の宿場までのマス数と名前（本道のうえ。なければ null） */
export function nextShukuAhead(board: BoardState, pos: number, route?: 'main' | 'lane'): { name: string; distance: number; index: number } | null {
  let cur = pos
  for (let d = 1; d <= board.mainLength; d++) {
    const nx = nextTileIndex(board, cur, d === 1 ? route : undefined)
    if (nx === null) return null
    cur = nx
    if (board.tiles[cur].type === 'shuku') return { name: board.tiles[cur].name, distance: d, index: cur }
  }
  return null
}

/** 疲れているか：体力が少ない、または野宿が続いている */
export function isTired(player: Player, config: GameConfig): boolean {
  return player.stats.stamina < config.balance.travel.tiredStamina || player.flags.includes('camped2')
}

/** 疲れていると、大きな目が出ない（歩みが鈍る） */
export function maxFaceFor(player: Player, config: GameConfig): number {
  return isTired(player, config) ? config.balance.travel.tiredMaxFace : config.balance.game.diceFaces
}

/** 早足にできるか（体力に余裕があるとき） */
export function canHurry(player: Player, config: GameConfig): boolean {
  return player.stats.stamina >= config.balance.travel.hurryMinStamina
}

/** 野宿の連続を数える（旗 camped → 2日続くと camped2＝疲れ）。宿に泊まれば消える */
export function recordCamp(player: Player, camped: boolean): void {
  const before = player.flags.includes('camped') || player.flags.includes('camped2')
  player.flags = player.flags.filter((f) => f !== 'camped' && f !== 'camped2')
  if (camped) player.flags.push(before ? 'camped2' : 'camped')
}

export function rollFace(player: Player, config: GameConfig, rng: Rng): number {
  return randomInt(rng, 1, maxFaceFor(player, config))
}

/** 脇道にいる間だけ、旗 `lane:<岐路のマス>` を持つ（脇道専用の出来事の条件に使う） */
export function syncLaneFlag(board: BoardState, player: Player, pos: number): void {
  const lane = laneOf(board, pos)
  const want = lane ? `lane:${lane.tileIndex}` : null
  player.flags = player.flags.filter((f) => !f.startsWith('lane:'))
  if (want) player.flags.push(want)
}

/** 宿代。泊まり方の割合と、評判の割引・割増（balance.json の lodging・reputation）をかけたもの */
export function innCostFor(player: Player, config: GameConfig, lodging: LodgingId = player.lodging): number {
  const base = config.balance.travel.innCost * config.balance.lodging[lodging].costRate * config.balance.roles[player.role].innRate
  const r = config.balance.reputation
  if (player.stats.reputation >= r.goodAt) return Math.round(base * r.goodInnRate)
  if (player.stats.reputation < r.badBelow) return Math.round(base * r.badInnRate)
  return Math.round(base)
}

/** 本陣に招かれるか（評判が高い人が、宿場で日が終わるとき） */
export function invitedToHonjin(player: Player, config: GameConfig): boolean {
  return player.stats.reputation >= config.balance.lodging.honjin.reputationAt
}

/** そのマスの県（脇道は、岐路の県。決まっていなければ東京） */
export function regionAt(board: BoardState, index: number): RegionId {
  return board.tiles[Math.min(Math.max(index, 0), board.tiles.length - 1)]?.region ?? 'tokyo'
}

/** 宿場の番号（江戸から数えて何番目の宿場か。宿場でなければ null） */
export function shukuNumber(board: BoardState, index: number): number | null {
  if (board.tiles[index]?.type !== 'shuku') return null
  return board.tiles.slice(0, index + 1).filter((t, i) => i < board.mainLength && t.type === 'shuku').length
}
