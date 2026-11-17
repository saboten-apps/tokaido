// オンライン対戦の「部屋」。サーバー（Durable Object など）が1部屋につき1つ持つ状態と、その更新の関数。
// ネットワーク・時計・保存には依存しない純粋な関数（時刻は引数で渡す）。サーバーは、
//   受信 → roomXxx(room, ...) → 新しい room を保存 → 全員へ roomView を配る
// の形で使う。ゲームの進行そのものは、session.ts（権威サーバーの計算）に任せる。
// umaregacya の room.ts を、旅向けに作り替えた（1ターンの年数・人生の目標を外し、身分の選択を足した）。

import { DEFAULT_CONFIG, ROLE_IDS, type GameConfig } from './config'
import { createGame } from './setup'
import { advanceOne, autoAct, getAwaiting, runUntilHuman, submitAction, type Awaiting, type SessionAction, type SessionEvent } from './session'
import type { GameState, RoleId } from '../types/game'

export const ROOM_MIN_PLAYERS = 2
export const ROOM_MAX_PLAYERS = 6

export type RoomStatus = 'lobby' | 'playing' | 'finished'

export interface RoomSeat {
  /** 人間の席に座った人（接続ごとではなく、再接続しても同じ人と分かる識別子） */
  userId: string
  name: string
  /** 旅人の身分（ロビーで選ぶ） */
  role: RoleId
  /** 準備完了 */
  ready: boolean
  /** いま接続しているか。切断中は、その人の番を、自動プレイで進める */
  connected: boolean
  /** 持ち時間を、続けて切らした回数（自分で操作すると 0 に戻る） */
  missed?: number
  /** CPU が代わりに進めている（持ち時間を続けて切らしたあと）。「戻る」で自分の番に戻れる */
  auto?: boolean
}

/** 持ち時間を続けてこの回数切らすと、CPU が代わりに進める */
export const AUTO_AFTER_MISSES = 2
/** CPU が代わりに進める席の番は、このミリ秒のあと（ほかの人が見える間をあけて）進める */
export const AUTO_SEAT_DELAY_MS = 1500

export interface RoomState {
  /** 部屋コード（招待用） */
  code: string
  hostId: string
  /** 参加人数（人間＋CPU）。2〜6 */
  capacity: number
  status: RoomStatus
  /** 人間の席（入った順。ゲームでは p0, p1, … になる） */
  seats: RoomSeat[]
  seed: number
  /** 1人の持ち時間（ミリ秒）。超えると、自動プレイで進める */
  turnTimeoutMs: number
  /** いまの待ちの期限（エポックミリ秒）。待ちがなければ null */
  deadline: number | null
  /** 更新のたびに増える番号（クライアントが古い配信を捨てるのに使う） */
  version: number
  game: GameState | null
}

export type RoomErrorCode =
  | 'room_full'
  | 'already_joined'
  | 'not_in_room'
  | 'not_host'
  | 'not_in_lobby'
  | 'not_enough_players'
  | 'not_started'
  | 'not_ready'
  | 'bad_capacity'
  | 'bad_role'

export class RoomError extends Error {
  code: RoomErrorCode
  constructor(code: RoomErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 紛らわしい文字（0/O・1/I）を除く

/** 部屋コードを作る（乱数は呼び出し側から。例：() => Math.random()） */
export function generateRoomCode(random: () => number, length = 5): string {
  let code = ''
  for (let i = 0; i < length; i++) code += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)]
  return code
}

export function createRoom(options: {
  code: string
  hostId: string
  hostName: string
  capacity?: number
  seed: number
  turnTimeoutMs?: number
}): RoomState {
  const capacity = options.capacity ?? 4
  if (!Number.isInteger(capacity) || capacity < ROOM_MIN_PLAYERS || capacity > ROOM_MAX_PLAYERS) {
    throw new RoomError('bad_capacity', `人数は${ROOM_MIN_PLAYERS}〜${ROOM_MAX_PLAYERS}人です`)
  }
  return {
    code: options.code,
    hostId: options.hostId,
    capacity,
    status: 'lobby',
    seats: [{ userId: options.hostId, name: options.hostName, role: 'ippan', ready: false, connected: true }],
    seed: options.seed >>> 0,
    turnTimeoutMs: options.turnTimeoutMs ?? 30_000,
    deadline: null,
    version: 1,
    game: null,
  }
}

function bump(room: RoomState, patch: Partial<RoomState>): RoomState {
  return { ...room, ...patch, version: room.version + 1 }
}

function seatOf(room: RoomState, userId: string): number {
  const i = room.seats.findIndex((s) => s.userId === userId)
  if (i < 0) throw new RoomError('not_in_room', '部屋にいません')
  return i
}

export function joinRoom(room: RoomState, userId: string, name: string): RoomState {
  if (room.status !== 'lobby') throw new RoomError('not_in_lobby', 'ゲームはすでに始まっています')
  if (room.seats.some((s) => s.userId === userId)) throw new RoomError('already_joined', 'すでに参加しています')
  if (room.seats.length >= room.capacity) throw new RoomError('room_full', '部屋が満員です')
  return bump(room, { seats: [...room.seats, { userId, name, role: 'ippan', ready: false, connected: true }] })
}

/** 部屋を出る（ゲーム前）。ホストが出たら、次の人がホスト。誰もいなくなったら null（部屋を閉じる） */
export function leaveRoom(room: RoomState, userId: string): RoomState | null {
  if (room.status !== 'lobby') throw new RoomError('not_in_lobby', 'ゲーム中は出られません（切断として扱います）')
  const i = seatOf(room, userId)
  const seats = room.seats.filter((_, k) => k !== i)
  if (seats.length === 0) return null
  return bump(room, { seats, hostId: room.hostId === userId ? seats[0].userId : room.hostId })
}

export function setReady(room: RoomState, userId: string, ready: boolean): RoomState {
  if (room.status !== 'lobby') throw new RoomError('not_in_lobby', 'ゲームはすでに始まっています')
  const i = seatOf(room, userId)
  return bump(room, { seats: room.seats.map((s, k) => (k === i ? { ...s, ready } : s)) })
}

/** 人数（人間＋CPU）を変える。人間の数より少なくはできない */
export function setCapacity(room: RoomState, userId: string, capacity: number): RoomState {
  if (room.status !== 'lobby') throw new RoomError('not_in_lobby', 'ゲームはすでに始まっています')
  if (userId !== room.hostId) throw new RoomError('not_host', 'ホストだけが変えられます')
  if (!Number.isInteger(capacity) || capacity < Math.max(ROOM_MIN_PLAYERS, room.seats.length) || capacity > ROOM_MAX_PLAYERS) {
    throw new RoomError('bad_capacity', '人数が範囲外です')
  }
  return bump(room, { capacity })
}

/** 身分を選ぶ（ロビーで、自分の席だけ。準備完了を取り消す） */
export function setRole(room: RoomState, userId: string, role: string): RoomState {
  if (room.status !== 'lobby') throw new RoomError('not_in_lobby', 'ゲームはすでに始まっています')
  if (!(ROLE_IDS as string[]).includes(role)) throw new RoomError('bad_role', 'その身分はありません')
  const i = seatOf(room, userId)
  return bump(room, { seats: room.seats.map((s, k) => (k === i ? { ...s, role: role as RoleId, ready: false } : s)) })
}

function setDeadline(room: RoomState, now: number): number | null {
  if (!room.game || room.game.phase !== 'playing') return null
  const aw = getAwaiting(room.game)
  if (aw && room.seats[Number(aw.playerId.slice(1))]?.auto) return now + AUTO_SEAT_DELAY_MS
  return getAwaiting(room.game) ? now + room.turnTimeoutMs : null
}

/**
 * ゲームを始める（ホストだけ）。参加している人全員が準備完了であること。席が余れば CPU が埋める。
 */
export function startRoom(room: RoomState, userId: string, now: number, config: GameConfig = DEFAULT_CONFIG): RoomState {
  if (room.status !== 'lobby') throw new RoomError('not_in_lobby', 'ゲームはすでに始まっています')
  if (userId !== room.hostId) throw new RoomError('not_host', 'ホストだけが始められます')
  if (room.seats.length < 1) throw new RoomError('not_enough_players', '人が足りません')
  if (!room.seats.every((s) => s.ready)) throw new RoomError('not_ready', '全員の準備ができていません')
  const created = createGame(
    { humanNames: room.seats.map((s) => s.name), humanRoles: room.seats.map((s) => s.role), playerCount: room.capacity, seed: room.seed },
    config,
  )
  const game = runUntilHuman(created, config).state
  const next: RoomState = { ...room, status: 'playing', game }
  return bump(next, { status: 'playing', game, deadline: setDeadline(next, now) })
}

/** 席の人（userId）が、ゲームの中の、どのプレイヤーか */
export function playerIdOf(room: RoomState, userId: string): string {
  return `p${seatOf(room, userId)}`
}

/** 進行の1コマ（人間の1行動、CPUの1手番など）。画面が、1コマずつ演出するために使う */
export interface RoomStep {
  events: SessionEvent[]
  /** そのコマが終わった時点の状態 */
  state: GameState
}

export interface RoomUpdate {
  room: RoomState
  events: SessionEvent[]
  /** コマごとの記録（最後のコマの状態が、room.game と同じ） */
  steps: RoomStep[]
}

function applyResult(room: RoomState, game: GameState, events: SessionEvent[], steps: RoomStep[], now: number): RoomUpdate {
  const status: RoomStatus = game.phase === 'finished' ? 'finished' : 'playing'
  const next: RoomState = { ...room, game, status }
  return { room: bump(next, { game, status, deadline: setDeadline(next, now) }), events, steps }
}

/** 人間の行動を受け付ける。部屋の人であること、その人の番・待ちであることを確かめる（SessionError／RoomError） */
export function roomAction(room: RoomState, userId: string, action: SessionAction, now: number, config: GameConfig = DEFAULT_CONFIG): RoomUpdate {
  if (room.status !== 'playing' || !room.game) throw new RoomError('not_started', 'ゲームは進行中ではありません')
  const playerId = playerIdOf(room, userId)
  // 人間の行動を1コマ、続けて、CPUの手番を1コマずつ（settle して一度に進めた結果と、同じ状態になる）
  const first = submitAction(room.game, playerId, action, config)
  // 自分で操作した：持ち時間を切らした回数を戻す（CPU が進めていたなら、自分の番に戻る）
  room = markPlayed(room, userId)
  const steps: RoomStep[] = [{ events: first.events, state: first.state }]
  let cur = first.state
  for (let guard = 0; guard < 2000 && cur.phase === 'playing'; guard++) {
    const r = advanceOne(cur, config)
    if (r.events.length === 0) break
    steps.push({ events: r.events, state: r.state })
    cur = r.state
  }
  return applyResult(room, cur, steps.flatMap((x) => x.events), steps, now)
}

function markPlayed(room: RoomState, userId: string): RoomState {
  const i = seatOf(room, userId)
  const seat = room.seats[i]
  if (!seat.auto && !seat.missed) return room
  return { ...room, seats: room.seats.map((s, k) => (k === i ? { ...s, missed: 0, auto: false } : s)) }
}

/** CPU が代わりに進めていた人が、自分の番に戻る */
export function returnToPlay(room: RoomState, userId: string): RoomState {
  const i = seatOf(room, userId)
  if (!room.seats[i].auto && !room.seats[i].missed) return room
  return bump(room, { seats: room.seats.map((s, k) => (k === i ? { ...s, missed: 0, auto: false } : s)) })
}

/** 接続の状態を変える。切断された人の番は、tickRoom で自動プレイされる */
export function setConnected(room: RoomState, userId: string, connected: boolean): RoomState {
  const i = seatOf(room, userId)
  return bump(room, { seats: room.seats.map((s, k) => (k === i ? { ...s, connected } : s)) })
}

/** 待っている人が、持ち時間を超えた・切断中なら、自動プレイで1つ進める（サーバーが定期的に・期限の時刻に呼ぶ） */
export function tickRoom(room: RoomState, now: number, config: GameConfig = DEFAULT_CONFIG): RoomUpdate {
  if (room.status !== 'playing' || !room.game) return { room, events: [], steps: [] }
  let game = room.game
  const events: SessionEvent[] = []
  const steps: RoomStep[] = []
  let cur = room
  for (let guard = 0; guard < 500; guard++) {
    const aw: Awaiting | null = getAwaiting(game)
    if (!aw) break
    const idx = Number(aw.playerId.slice(1))
    const seat = cur.seats[idx]
    const overdue = cur.deadline !== null && now >= cur.deadline
    if (!(seat && (!seat.connected || seat.auto)) && !overdue) break
    // 持ち時間を切らした（つながっていて、まだ自分で進めている人）：回数を数え、続けたら CPU に任せる
    if (overdue && seat && seat.connected && !seat.auto) {
      const missed = (seat.missed ?? 0) + 1
      cur = { ...cur, seats: cur.seats.map((s, k) => (k === idx ? { ...s, missed, auto: missed >= AUTO_AFTER_MISSES } : s)) }
    }
    const res = autoAct(game, config)
    game = res.state
    events.push(...res.events)
    steps.push({ events: res.events, state: res.state })
    // 続けて、CPU の手番を、次の人間の待ちまで1コマずつ（roomAction と同じ）
    for (let g2 = 0; g2 < 2000 && game.phase === 'playing'; g2++) {
      const r = advanceOne(game, config)
      if (r.events.length === 0) break
      game = r.state
      events.push(...r.events)
      steps.push({ events: r.events, state: r.state })
    }
    // 期限切れで1つ進めたあとの待ちには、新しい持ち時間を与える
    cur = { ...cur, deadline: null }
    if (game.phase !== 'playing') break
  }
  if (game === room.game) return { room, events, steps }
  return applyResult(cur, game, events, steps, now)
}

/** クライアントへ配る形。乱数の内部状態とシードは隠す（次の目を予測されないように） */
export function roomView(room: RoomState, userId: string): Omit<RoomState, 'game'> & { game: GameState | null; you: { userId: string; playerId: string | null } } {
  const game = room.game ? { ...room.game, rngState: 0, seed: 0 } : null
  const idx = room.seats.findIndex((s) => s.userId === userId)
  return { ...room, seed: 0, game, you: { userId, playerId: idx >= 0 ? `p${idx}` : null } }
}

