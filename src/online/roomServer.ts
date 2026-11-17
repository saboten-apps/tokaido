// オンラインの部屋の「サーバー側の処理」（umaregacya の roomServer.ts を、旅向けに作り替えた）。通信・保存・時計から切り離した、状態を受けて状態を返す関数だけ。
// Cloudflare の Durable Object（worker/roomDO.ts）は、これを呼んで、結果を保存・配信・アラームへ反映する。
// 認証：初回の hello で、userId に合言葉（のハッシュ）を結びつける。以後、同じ合言葉でないと、その席には入れない。

import { createRoom, joinRoom, leaveRoom, returnToPlay, roomAction, roomView, setCapacity, setConnected, setReady, setRole, startRoom, tickRoom, ROOM_MAX_PLAYERS, ROOM_MIN_PLAYERS, RoomError, type RoomState, type RoomStep } from '../engine/room'
import { SessionError } from '../engine/session'
import type { ClientMessage, ServerMessage, StepView } from './protocol'

/** DO が保存するもの */
export interface Stored {
  room: RoomState
  /** userId → 合言葉のハッシュ */
  secrets: Record<string, string>
  /** userId → 直近に処理した reqId（重複送信の防止） */
  seen: Record<string, string[]>
  /** 切断した人が、自動プレイの対象になる時刻（つなぎ直しの猶予） */
  graceUntil: Record<string, number>
  /** この時刻を過ぎて何もなければ、部屋を閉じる */
  expireAt: number
}

export type Target = { userId: string } | 'all'
export interface Out {
  to: Target
  msg: ServerMessage
}
export interface Result {
  stored: Stored | null
  /** 送るもの。state は、宛先ごとの見え方に直してから送る（roomView） */
  out: Array<Out | { to: Target; state: true }>
  alarmAt: number | null
  /** 部屋を閉じる（保存を消す） */
  destroy?: boolean
  /** 呼んだ接続への、エラー */
  error?: { code: 'bad_secret' | 'no_room' | 'room_error' | 'session_error'; message: string; reqId?: string }
}

export const GRACE_MS = 8_000
export const LOBBY_IDLE_MS = 30 * 60_000
export const PLAYING_IDLE_MS = 6 * 60 * 60_000
export const FINISHED_KEEP_MS = 30 * 60_000
export const ABANDON_MS = 30 * 60_000
const SEEN_KEEP = 24

function alarmFor(s: Stored, now: number): number {
  const times = [s.expireAt]
  if (s.room.deadline !== null) times.push(s.room.deadline)
  for (const seat of s.room.seats) {
    const g = s.graceUntil[seat.userId]
    if (!seat.connected && g !== undefined && g > now) times.push(g)
  }
  return Math.max(now + 50, Math.min(...times))
}

function finish(s: Stored | null, out: Result['out'], now: number, extra: Partial<Result> = {}): Result {
  if (!s) return { stored: null, out, alarmAt: null, destroy: true, ...extra }
  return { stored: s, out, alarmAt: alarmFor(s, now), ...extra }
}

function idleExpire(room: RoomState, now: number): number {
  return now + (room.status === 'finished' ? FINISHED_KEEP_MS : room.status === 'lobby' ? LOBBY_IDLE_MS : PLAYING_IDLE_MS)
}

/** コマごとの記録を、配る形にする（乱数・シードは隠す。年表・ログは外す。最後のコマの状態は、最終の state と同じなので省く） */
export function stepViews(steps: RoomStep[]): StepView[] {
  return steps.map((st, i) => {
    const last = i === steps.length - 1
    const { log, diary: _diary, ...rest } = st.state
    void _diary
    return { events: st.events, logLen: log.length, game: last ? null : { ...rest, rngState: 0, seed: 0 } }
  })
}

function stateAll(): { to: Target; state: true } {
  return { to: 'all', state: true }
}

/** 最初の1通。部屋を作る・入る・つなぎ直す */
export function handleHello(
  stored: Stored | null,
  info: { code: string; userId: string; secretHash: string; name: string; create?: { capacity: number }; seed: number },
  now: number,
): Result {
  const { userId, secretHash } = info
  if (!stored) {
    if (!info.create) return { stored: null, out: [], alarmAt: null, error: { code: 'no_room', message: '部屋が見つかりません' } }
    const cap = Math.round(info.create.capacity)
    if (!(cap >= ROOM_MIN_PLAYERS && cap <= ROOM_MAX_PLAYERS)) {
      return { stored: null, out: [], alarmAt: null, error: { code: 'room_error', message: '人数が範囲外です' } }
    }
    const room = createRoom({ code: info.code, hostId: userId, hostName: info.name, capacity: cap, seed: info.seed, turnTimeoutMs: 45_000 })
    const s: Stored = { room, secrets: { [userId]: secretHash }, seen: {}, graceUntil: {}, expireAt: idleExpire(room, now) }
    return finish(s, [stateAll()], now)
  }
  if (info.create) {
    // 作る指定なのに、そのコードの部屋がすでにある（コードの重なり）。入らず、断る
    return { stored, out: [], alarmAt: alarmFor(stored, now), error: { code: 'room_error', message: 'そのコードは使われています。もう一度つくってください' } }
  }
  const known = stored.secrets[userId]
  if (known !== undefined && known !== secretHash) {
    return { stored, out: [], alarmAt: alarmFor(stored, now), error: { code: 'bad_secret', message: 'この席は、別の端末で使われています' } }
  }
  let room = stored.room
  const secrets = { ...stored.secrets }
  const graceUntil = { ...stored.graceUntil }
  try {
    if (room.seats.some((s) => s.userId === userId)) {
      room = setConnected(room, userId, true)
      delete graceUntil[userId]
    } else {
      room = joinRoom(room, userId, info.name)
      secrets[userId] = secretHash
    }
  } catch (e) {
    if (e instanceof RoomError) return { stored, out: [], alarmAt: alarmFor(stored, now), error: { code: 'room_error', message: e.message } }
    throw e
  }
  const s: Stored = { ...stored, room, secrets, graceUntil, expireAt: idleExpire(room, now) }
  return finish(s, [stateAll()], now)
}

/** ロビーの操作・ゲームの行動 */
export function handleMessage(stored: Stored, userId: string, msg: ClientMessage, now: number): Result {
  if (msg.t === 'ping') return { stored, out: [{ to: { userId }, msg: { t: 'pong' } }], alarmAt: alarmFor(stored, now) }
  if (msg.t === 'hello') return { stored, out: [], alarmAt: alarmFor(stored, now) }
  const reqId = msg.reqId
  // 重複送信（つなぎ直しの再送など）は、結果を変えず、受け付けた印だけ返す
  if (stored.seen[userId]?.includes(reqId)) {
    return { stored, out: [{ to: { userId }, msg: { t: 'ack', reqId, version: stored.room.version } }], alarmAt: alarmFor(stored, now) }
  }
  try {
    let room = stored.room
    let steps: RoomStep[] = []
    let gone = false
    switch (msg.t) {
      case 'ready':
        room = setReady(room, userId, msg.ready)
        break
      case 'capacity':
        room = setCapacity(room, userId, msg.capacity)
        break
      case 'role':
        room = setRole(room, userId, msg.role)
        break
      case 'start':
        room = startRoom(room, userId, now)
        break
      case 'leave': {
        if (room.status === 'lobby') {
          const next = leaveRoom(room, userId)
          if (next === null) gone = true
          else room = next
        } else {
          room = setConnected(room, userId, false)
        }
        break
      }
      case 'back':
        room = returnToPlay(room, userId)
        break
      case 'action': {
        const r = roomAction(room, userId, msg.action, now)
        room = r.room
        steps = r.steps
        break
      }
    }
    if (gone) return { stored: null, out: [], alarmAt: null, destroy: true }
    const seen = { ...stored.seen, [userId]: [...(stored.seen[userId] ?? []), reqId].slice(-SEEN_KEEP) }
    const graceUntil = { ...stored.graceUntil }
    if (msg.t === 'leave') {
      if (room.status === 'lobby') {
        delete graceUntil[userId]
        // 出た人の席は消えているので、秘密も消す
        const secrets = { ...stored.secrets }
        delete secrets[userId]
        const s: Stored = { ...stored, room, secrets, seen, graceUntil, expireAt: idleExpire(room, now) }
        return finish(s, [{ to: { userId }, msg: { t: 'ack', reqId, version: room.version } }, stateAll()], now)
      }
      graceUntil[userId] = now + GRACE_MS
    }
    const s: Stored = { ...stored, room, seen, graceUntil, expireAt: idleExpire(room, now) }
    const out: Result['out'] = []
    if (steps.length) out.push({ to: 'all', msg: { t: 'steps', steps: stepViews(steps), version: room.version } })
    out.push({ to: { userId }, msg: { t: 'ack', reqId, version: room.version } }, stateAll())
    return finish(s, out, now)
  } catch (e) {
    if (e instanceof RoomError) return { stored, out: [], alarmAt: alarmFor(stored, now), error: { code: 'room_error', message: e.message, reqId } }
    if (e instanceof SessionError) return { stored, out: [], alarmAt: alarmFor(stored, now), error: { code: 'session_error', message: e.message, reqId } }
    throw e
  }
}

/** 接続が切れた。ゲーム中は、猶予のあと、その人の番を自動プレイで進める */
export function handleDisconnect(stored: Stored, userId: string, now: number): Result {
  if (!stored.room.seats.some((s) => s.userId === userId) || !stored.room.seats.find((s) => s.userId === userId)?.connected) {
    return { stored, out: [], alarmAt: alarmFor(stored, now) }
  }
  const room = setConnected(stored.room, userId, false)
  const s: Stored = { ...stored, room, graceUntil: { ...stored.graceUntil, [userId]: now + GRACE_MS } }
  return finish(s, [stateAll()], now)
}

/** アラーム：持ち時間切れ・切断の猶予切れを、自動プレイで進める。ロビーの切断者は席を外す。期限を過ぎた部屋は閉じる */
export function handleAlarm(stored: Stored, now: number): Result {
  let room = stored.room
  const out: Result['out'] = []
  let graceUntil = { ...stored.graceUntil }
  let secrets = stored.secrets
  let expireAt = stored.expireAt

  if (room.status === 'lobby') {
    for (const seat of room.seats) {
      const g = graceUntil[seat.userId]
      if (!seat.connected && (g === undefined || now >= g)) {
        const next = leaveRoom(room, seat.userId)
        delete graceUntil[seat.userId]
        secrets = { ...secrets }
        delete secrets[seat.userId]
        if (next === null) return { stored: null, out: [], alarmAt: null, destroy: true }
        room = next
        out.push(stateAll())
      }
    }
  } else if (room.status === 'playing') {
    if (!room.seats.some((s) => s.connected) && room.seats.every((s) => (graceUntil[s.userId] ?? 0) <= now)) {
      // 全員いない：進めずに、取っておく（戻ってこられる）。一定時間で閉じる
      expireAt = Math.min(expireAt, now + ABANDON_MS)
    } else {
      // 猶予の間は、つながっているものとして扱って進める。猶予が切れた人は、すぐ自動プレイ
      const view: RoomState = { ...room, seats: room.seats.map((s) => ({ ...s, connected: s.connected || (graceUntil[s.userId] ?? 0) > now })) }
      const t = tickRoom(view, now)
      if (t.room !== view) {
        // 接続の状態は実際のまま。持ち時間を切らした回数・CPU任せの印は、進めた結果を反映する
        room = { ...t.room, seats: t.room.seats.map((s, i) => ({ ...s, connected: room.seats[i].connected })) }
        if (t.steps.length) out.push({ to: 'all', msg: { t: 'steps', steps: stepViews(t.steps), version: room.version } })
        out.push(stateAll())
        expireAt = idleExpire(room, now)
      }
    }
  }
  if (now >= expireAt) return { stored: null, out: [], alarmAt: null, destroy: true }
  graceUntil = Object.fromEntries(Object.entries(graceUntil).filter(([, g]) => g > now || !room.seats.find((s) => s.connected)))
  return finish({ ...stored, room, secrets, graceUntil, expireAt }, out, now)
}

export function viewFor(stored: Stored, userId: string): ServerMessage {
  return { t: 'state', view: roomView(stored.room, userId) }
}
