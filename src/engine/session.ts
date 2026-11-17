// 手番の進行（振る／働く → 進む → 止まる → 選ぶ → 次の人）を、画面なしで進める「セッション」。
// umaregacya の session.ts の形（TurnControl・判断待ち・submitAction・runUntilHuman・advanceOne）を写し、旅向けに作り替えた。
// 状態はすべて GameState に入っているので、保存・復元・サーバーでの再開ができる。
// 乱数は state.rngState から決まるので、同じ状態と同じ行動なら、同じ結果になる。

import { canHurry, forkAt, innCostFor, pathFrom, recordCamp, rollFace, syncLaneFlag } from './board'
import { DEFAULT_CONFIG, getEvent, type GameConfig } from './config'
import { chooseCpuBuyMeibutsu, chooseCpuChoice, chooseCpuMove, chooseCpuRoute, shouldCpuWork } from './cpu'
import { applyChoice, drawEvent, isChoiceAvailable, markEventUsed } from './events'
import { createRng, type Rng } from './rng'
import { applyDelta, formatDelta } from './stats'
import type { ForkDef, GameEvent, GameState, Player, TileType } from '../types/game'

/** 人間の行動 */
export type SessionAction =
  | { type: 'roll' }
  /** 早足：出目に hurryBonus を足して進むかわりに、体力を余分に使う */
  | { type: 'hurry' }
  | { type: 'work' }
  | { type: 'event'; choiceIndex: number }
  | { type: 'meibutsu'; buy: boolean }
  | { type: 'fork'; route: 'main' | 'lane' }

/** いま、だれの、何を待っているか。'roll' は「振る」か「働く」を待つ */
export interface Awaiting {
  kind: 'roll' | 'event' | 'meibutsu' | 'fork'
  playerId: string
  tileIndex?: number
  eventId?: string
}

/** 画面・クライアントへ知らせる、進行の記録（演出や通知に使う） */
export type SessionEvent =
  | { type: 'rolled'; playerId: string; face: number; from: number; to: number; path: number[]; hurry: boolean }
  | { type: 'worked'; playerId: string; money: number }
  | { type: 'landed'; playerId: string; tileIndex: number; tileType: TileType }
  | { type: 'rested'; playerId: string; daysLeft: number }
  | { type: 'arrived'; playerId: string; rank: number; day: number }
  | { type: 'awaiting'; awaiting: Awaiting }
  | { type: 'turn_end'; playerId: string }
  | { type: 'day_end'; day: number }
  | { type: 'finished' }

export interface SessionResult {
  state: GameState
  events: SessionEvent[]
}

export type SessionErrorCode = 'finished' | 'not_your_turn' | 'wrong_action' | 'invalid_choice'

export class SessionError extends Error {
  code: SessionErrorCode
  constructor(code: SessionErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

const MAX_AUTO_STEPS = 5000

interface Ctx {
  s: GameState
  rng: Rng
  config: GameConfig
  events: SessionEvent[]
}

function log(s: GameState, player: Player | null, message: string): void {
  s.log.push({ day: s.day, playerId: player?.id ?? null, message })
}

export function activePlayer(state: GameState): Player {
  return state.players[state.turnCtl.activeIndex]
}

export function hasArrived(player: Player): boolean {
  return player.arrivedDay !== null
}

/** いまの待ち（ゲーム終了、または自動で進める場面なら null） */
export function getAwaiting(state: GameState): Awaiting | null {
  if (state.phase !== 'playing') return null
  if (state.pendingEvent) return { kind: 'event', playerId: state.pendingEvent.playerId, eventId: state.pendingEvent.eventId }
  const a = state.turnCtl.awaiting
  if (a) return { kind: a.kind, playerId: a.playerId, tileIndex: a.tileIndex }
  const p = activePlayer(state)
  if (p.isHuman && !hasArrived(p) && p.restDays === 0) return { kind: 'roll', playerId: p.id }
  return null
}

// ---- 1日の終わり ----

/** 全員が1回ずつ動いたあと：宿場にいれば宿に泊まり（宿代・体力回復）、それ以外は野宿。日が進む */
function endOfDay(c: Ctx): void {
  const { s, config } = c
  const t = config.balance.travel
  for (const p of s.players) {
    if (hasArrived(p)) continue
    const tile = s.board.tiles[s.board.playerStates[p.id].position]
    const cost = innCostFor(p, config)
    const canInn = (tile.type === 'shuku' || tile.type === 'start') && p.stats.money >= cost
    if (canInn) {
      p.stats = applyDelta(p.stats, { money: -cost, stamina: t.innStamina }, config.balance.limits)
      recordCamp(p, false)
    } else {
      p.stats = applyDelta(p.stats, { stamina: t.campStamina, reputation: t.campReputation }, config.balance.limits)
      recordCamp(p, true)
      log(s, p, `${p.name}は${tile.type === 'shuku' ? '宿代が足りず、' : ''}野宿した。${p.flags.includes('camped2') ? '（野宿が続いて、足が重い）' : ''}`)
    }
  }
  c.events.push({ type: 'day_end', day: s.day })
  s.day += 1
  if (s.day > config.balance.game.maxDays) finishGame(c, `${config.balance.game.maxDays}日が過ぎ、旅はここまで。`)
}

function finishGame(c: Ctx, message: string): void {
  const { s } = c
  if (s.phase === 'finished') return
  s.phase = 'finished'
  s.pendingEvent = null
  s.turnCtl.awaiting = null
  log(s, null, message)
  c.events.push({ type: 'finished' })
}

/** この人の番を終えて、まだ着いていない次の人へ（一巡したら1日が終わる） */
function endTurn(c: Ctx): void {
  const { s } = c
  const t = s.turnCtl
  const from = t.activeIndex
  c.events.push({ type: 'turn_end', playerId: s.players[from].id })
  t.awaiting = null
  t.meibutsuAfterEvent = false
  const n = s.players.length
  let next = -1
  let wrapped = false
  for (let i = 1; i <= n; i++) {
    const idx = (from + i) % n
    if (idx <= from) wrapped = true
    if (!hasArrived(s.players[idx])) {
      next = idx
      break
    }
  }
  if (next < 0) {
    finishGame(c, '全員が京都・三条大橋に着いた。')
    return
  }
  if (wrapped) endOfDay(c)
  t.activeIndex = next
}

// ---- 止まったマス ----

function buyMeibutsu(c: Ctx, p: Player, tileIndex: number): void {
  const m = c.s.board.tiles[tileIndex].meibutsu!
  p.stats = applyDelta(p.stats, { money: -m.price, memories: m.memories }, c.config.balance.limits)
  p.meibutsu.push(m.id)
  log(c.s, p, `${p.name}は名物「${m.name}」を買った。（路銀-${m.price}文 / 思い出+${m.memories}）`)
}

/** 名物を買えるか（まだ持っていなくて、路銀が足りる） */
export function canBuyMeibutsu(state: GameState, player: Player, tileIndex: number): boolean {
  const m = state.board.tiles[tileIndex]?.meibutsu
  return Boolean(m && !player.meibutsu.includes(m.id) && player.stats.money >= m.price)
}

function offerMeibutsu(c: Ctx, p: Player, tileIndex: number): void {
  if (!canBuyMeibutsu(c.s, p, tileIndex)) return endTurn(c)
  if (p.isHuman) {
    c.s.turnCtl.awaiting = { kind: 'meibutsu', playerId: p.id, tileIndex }
    c.events.push({ type: 'awaiting', awaiting: getAwaiting(c.s)! })
    return
  }
  if (chooseCpuBuyMeibutsu(p, c.s.board.tiles[tileIndex].meibutsu!, c.config)) buyMeibutsu(c, p, tileIndex)
  endTurn(c)
}

function applyFork(c: Ctx, p: Player, fork: ForkDef, route: 'main' | 'lane'): void {
  const choice = fork[route]
  p.stats = applyDelta(p.stats, choice.effects, c.config.balance.limits)
  c.s.board.playerStates[p.id].route = route
  const d = formatDelta(choice.effects)
  log(c.s, p, `${p.name}は「${choice.label}」を選んだ。${choice.story}${d ? `（${d}）` : ''}`)
}

/** 出来事を始める。人間なら選択待ち、CPU ならその場で選ぶ */
function startEvent(c: Ctx, p: Player, ev: GameEvent, meibutsuAfter: boolean, tileIndex: number): void {
  markEventUsed(p, ev)
  if (p.isHuman) {
    c.s.pendingEvent = { playerId: p.id, eventId: ev.id }
    c.s.turnCtl.meibutsuAfterEvent = meibutsuAfter
    c.events.push({ type: 'awaiting', awaiting: getAwaiting(c.s)! })
    return
  }
  const idx = chooseCpuChoice(p, ev, c.config, c.rng)
  log(c.s, p, `【${ev.title}】${p.name}：${applyChoice(p, ev.choices[idx], c.config, c.rng)}`)
  if (meibutsuAfter) offerMeibutsu(c, p, tileIndex)
  else endTurn(c)
}

function land(c: Ctx, p: Player, idx: number): void {
  const { s, config } = c
  const t = config.balance.travel
  const tile = s.board.tiles[idx]
  c.events.push({ type: 'landed', playerId: p.id, tileIndex: idx, tileType: tile.type })
  switch (tile.type) {
    case 'goal': {
      const rank = s.players.filter(hasArrived).length + 1
      p.arrivedDay = s.day
      p.arrivalRank = rank
      log(s, p, `${p.name}は${s.day}日目に京都・三条大橋に着いた！（${rank}番目）`)
      c.events.push({ type: 'arrived', playerId: p.id, rank, day: s.day })
      return endTurn(c)
    }
    case 'fork': {
      const fork = forkAt(s.board, idx)!
      if (p.isHuman) {
        s.turnCtl.awaiting = { kind: 'fork', playerId: p.id, tileIndex: idx }
        c.events.push({ type: 'awaiting', awaiting: getAwaiting(s)! })
        return
      }
      applyFork(c, p, fork, chooseCpuRoute(p, fork, config, c.rng))
      return endTurn(c)
    }
    case 'shuku': {
      if (tile.eventId && !p.usedOnceEvents.includes(tile.eventId)) return startEvent(c, p, getEvent(config, tile.eventId), true, idx)
      return offerMeibutsu(c, p, idx)
    }
    case 'event': {
      const ev = drawEvent(p, config, c.rng)
      if (ev) return startEvent(c, p, ev, false, idx)
      return endTurn(c)
    }
    case 'teahouse': {
      if (p.stats.money >= t.teahouseCost) {
        p.stats = applyDelta(p.stats, { money: -t.teahouseCost, stamina: t.teahouseStamina, memories: t.teahouseMemories }, config.balance.limits)
        log(s, p, `${p.name}は${tile.name}でひと休み。（路銀-${t.teahouseCost}文 / 体力+${t.teahouseStamina}）`)
      }
      return endTurn(c)
    }
    case 'scenic': {
      p.stats = applyDelta(p.stats, { memories: t.scenicMemories }, config.balance.limits)
      log(s, p, `${p.name}は${tile.name}を眺めた。（思い出+${t.scenicMemories}）`)
      return endTurn(c)
    }
    default:
      return endTurn(c)
  }
}

// ---- 手番の行動 ----

function doRoll(c: Ctx, forcedFace?: number, hurry = false): void {
  const { s, config } = c
  const p = activePlayer(s)
  const pb = s.board.playerStates[p.id]
  const face = forcedFace ?? rollFace(p, config, c.rng)
  const from = pb.position
  const path = pathFrom(s.board, from, face + (hurry ? config.balance.travel.hurryBonus : 0), pb.route)
  delete pb.route
  const to = path.at(-1) ?? from
  pb.position = to
  syncLaneFlag(s.board, p, to)
  const extra = hurry ? config.balance.travel.hurryStamina : 0
  p.stats = applyDelta(p.stats, { stamina: -path.length * config.balance.travel.staminaPerStep - extra }, config.balance.limits)
  log(s, p, `${p.name}は${hurry ? '早足で' : ''}「${face}」を出して、${s.board.tiles[to].name}へ。`)
  c.events.push({ type: 'rolled', playerId: p.id, face, from, to, path, hurry })
  land(c, p, to)
}

function doWork(c: Ctx): void {
  const { s, config } = c
  const t = config.balance.travel
  const p = activePlayer(s)
  p.stats = applyDelta(p.stats, { money: t.workMoney, stamina: t.workStamina, reputation: t.workReputation }, config.balance.limits)
  log(s, p, `${p.name}は一日働いて、路銀を${t.workMoney}文稼いだ。`)
  c.events.push({ type: 'worked', playerId: p.id, money: t.workMoney })
  endTurn(c)
}

/** 自動で進められる1つぶん（CPU の手番・足止め）。人間の判断待ち・終了なら false */
function stepOne(c: Ctx): boolean {
  const { s } = c
  if (s.phase !== 'playing' || s.pendingEvent || s.turnCtl.awaiting) return false
  const p = activePlayer(s)
  if (hasArrived(p)) {
    endTurn(c)
    return true
  }
  if (p.restDays > 0) {
    p.restDays -= 1
    log(s, p, `${p.name}は足止め中。（あと${p.restDays}日）`)
    c.events.push({ type: 'rested', playerId: p.id, daysLeft: p.restDays })
    endTurn(c)
    return true
  }
  if (p.isHuman) return false
  const move = chooseCpuMove(p, c.config, c.rng)
  if (move === 'work') doWork(c)
  else doRoll(c, undefined, move === 'hurry')
  return true
}

function settle(c: Ctx): void {
  for (let guard = 0; guard < MAX_AUTO_STEPS; guard++) if (!stepOne(c)) return
  throw new Error('セッションが進み続けています（無限ループの疑い）')
}

function start(state: GameState, config: GameConfig, rng?: Rng): Ctx {
  return { s: structuredClone(state), rng: rng ?? createRng(state.rngState), config, events: [] }
}

function finish(c: Ctx, hadRng: boolean): SessionResult {
  if (!hadRng) c.s.rngState = c.rng.getState()
  return { state: c.s, events: c.events }
}

/** CPU の番・足止めを、人間の判断が必要になる（またはゲームが終わる）まで進める */
export function runUntilHuman(state: GameState, config: GameConfig = DEFAULT_CONFIG, rng?: Rng): SessionResult {
  const c = start(state, config, rng)
  settle(c)
  return finish(c, Boolean(rng))
}

/** 自動で進められる1つぶん（CPU の1手番など）だけ進める。画面が1手番ずつ演出するのに使う */
export function advanceOne(state: GameState, config: GameConfig = DEFAULT_CONFIG, rng?: Rng): SessionResult {
  const c = start(state, config, rng)
  stepOne(c)
  return finish(c, Boolean(rng))
}

/**
 * 人間の行動を受け取って、状態を進める（CPU の番は進めない。続けて runUntilHuman / advanceOne を呼ぶ）。
 * playerId は、その行動をした人。手番・待ちの内容と合わないと SessionError。
 */
export function submitAction(
  state: GameState,
  playerId: string,
  action: SessionAction,
  config: GameConfig = DEFAULT_CONFIG,
  rng?: Rng,
  forcedFace?: number,
): SessionResult {
  if (state.phase !== 'playing') throw new SessionError('finished', '旅は終わっています')
  const aw = getAwaiting(state)
  if (!aw || aw.playerId !== playerId) throw new SessionError('not_your_turn', 'あなたの番ではありません')
  const c = start(state, config, rng)
  const s = c.s
  const p = s.players.find((x) => x.id === playerId)!
  switch (action.type) {
    case 'roll':
    case 'hurry':
    case 'work':
      if (aw.kind !== 'roll') throw new SessionError('wrong_action', 'いまはその行動はできません')
      if (action.type === 'hurry' && !canHurry(p, config)) throw new SessionError('invalid_choice', '体力が足りず、早足にはできません')
      if (action.type === 'work') doWork(c)
      else doRoll(c, forcedFace, action.type === 'hurry')
      break
    case 'event': {
      if (aw.kind !== 'event') throw new SessionError('wrong_action', 'いまはその行動はできません')
      const ev = getEvent(config, aw.eventId!)
      const choice = ev.choices[action.choiceIndex]
      if (!choice || !isChoiceAvailable(p, choice)) throw new SessionError('invalid_choice', 'その選択肢は選べません')
      log(s, p, `【${ev.title}】${p.name}：${applyChoice(p, choice, config, c.rng)}`)
      s.pendingEvent = null
      if (s.turnCtl.meibutsuAfterEvent) {
        s.turnCtl.meibutsuAfterEvent = false
        offerMeibutsu(c, p, s.board.playerStates[p.id].position)
      } else endTurn(c)
      break
    }
    case 'meibutsu':
      if (aw.kind !== 'meibutsu') throw new SessionError('wrong_action', 'いまはその行動はできません')
      if (action.buy) buyMeibutsu(c, p, aw.tileIndex!)
      endTurn(c)
      break
    case 'fork':
      if (aw.kind !== 'fork') throw new SessionError('wrong_action', 'いまはその行動はできません')
      if (action.route !== 'main' && action.route !== 'lane') throw new SessionError('invalid_choice', 'その道はありません')
      applyFork(c, p, forkAt(s.board, aw.tileIndex!)!, action.route)
      endTurn(c)
      break
    default:
      throw new SessionError('wrong_action', '知らない行動です')
  }
  return finish(c, Boolean(rng))
}

/** 人間の待ちを、CPU と同じ考え方で自動で片づける（時間切れ・シミュレーション用） */
export function autoAct(state: GameState, config: GameConfig = DEFAULT_CONFIG): SessionResult {
  const aw = getAwaiting(state)
  if (!aw) return runUntilHuman(state, config)
  const p = state.players.find((x) => x.id === aw.playerId)!
  const rng = createRng(state.rngState)
  let action: SessionAction
  switch (aw.kind) {
    case 'roll':
      action = shouldCpuWork(p, config) ? { type: 'work' } : { type: 'roll' }
      break
    case 'event':
      action = { type: 'event', choiceIndex: chooseCpuChoice({ ...p, personality: 'steady' }, getEvent(config, aw.eventId!), config, rng) }
      break
    case 'meibutsu':
      action = { type: 'meibutsu', buy: chooseCpuBuyMeibutsu({ ...p, personality: 'steady' }, state.board.tiles[aw.tileIndex!].meibutsu!, config) }
      break
    case 'fork':
      action = { type: 'fork', route: chooseCpuRoute({ ...p, personality: 'steady' }, forkAt(state.board, aw.tileIndex!)!, config, rng) }
      break
  }
  return submitAction({ ...state, rngState: rng.getState() }, p.id, action, config)
}
