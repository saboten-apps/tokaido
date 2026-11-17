// オンライン対戦の通信の約束事（クライアントとサーバーで共有する型）。WebSocket で JSON を送りあう。
// umaregacya の protocol.ts を、旅向けに作り替えた。

import type { RoomState } from '../engine/room'
import type { SessionAction, SessionEvent } from '../engine/session'
import type { GameState } from '../types/game'

/** クライアントが見る部屋（乱数・シードは隠してある） */
export type RoomView = ReturnType<typeof import('../engine/room').roomView>

/**
 * 進行の1コマ。状態は、重くならないよう、年表・ログを外してある（クライアントが、あとから届く最終の state から、
 * logLen 件ぶんを切り出して戻す）。最後のコマは、最終の state と同じなので、game は null。
 */
export interface StepView {
  events: SessionEvent[]
  logLen: number
  game: Omit<GameState, 'log' | 'diary'> | null
}

export type ClientMessage =
  /** 最初の1通。userId は端末ごとの識別子、secret は本人確認の合言葉（初回に席へ結びつく） */
  | { t: 'hello'; userId: string; secret: string; name: string; create?: { capacity: number } }
  | { t: 'ready'; ready: boolean; reqId: string }
  | { t: 'capacity'; capacity: number; reqId: string }
  /** 身分を選ぶ（ロビーで） */
  | { t: 'role'; role: string; reqId: string }
  | { t: 'start'; reqId: string }
  | { t: 'leave'; reqId: string }
  /** CPU が代わりに進めていたのを、やめて、自分の番に戻る */
  | { t: 'back'; reqId: string }
  | { t: 'action'; action: SessionAction; reqId: string }
  | { t: 'ping' }

export type ServerErrorCode =
  | 'bad_message'
  | 'not_hello'
  | 'bad_secret'
  | 'no_room'
  | 'room_error'
  | 'session_error'
  | 'rate_limited'
  | 'internal'

export type ServerMessage =
  | { t: 'state'; view: RoomView }
  /** 直前の行動で起きたこと（演出の再生用）を、コマごとに。version はそのあとの部屋の版（このあと、同じ版の state が届く） */
  | { t: 'steps'; steps: StepView[]; version: number }
  | { t: 'ack'; reqId: string; version: number }
  | { t: 'error'; code: ServerErrorCode; message: string; reqId?: string }
  | { t: 'pong' }

export const NAME_MAX = 12
export const REQ_ID_MAX = 64
export const MESSAGE_MAX_BYTES = 4096

export function cleanName(raw: unknown): string {
  // 制御文字（コード 0〜31）と < > を取り除く
  const stripped = typeof raw === 'string' ? [...raw].filter((c) => c.charCodeAt(0) > 31 && c !== '<' && c !== '>').join('') : ''
  const s = stripped.trim().slice(0, NAME_MAX)
  return s || '名無し'
}

/** 受信した文字列を、クライアントのメッセージとして確かめる（形が違えば null） */
export function parseClientMessage(raw: string): ClientMessage | null {
  if (raw.length > MESSAGE_MAX_BYTES) return null
  let m: unknown
  try {
    m = JSON.parse(raw)
  } catch {
    return null
  }
  if (!m || typeof m !== 'object') return null
  const o = m as Record<string, unknown>
  const reqId = typeof o.reqId === 'string' && o.reqId.length > 0 && o.reqId.length <= REQ_ID_MAX ? o.reqId : null
  switch (o.t) {
    case 'ping':
      return { t: 'ping' }
    case 'hello': {
      if (typeof o.userId !== 'string' || o.userId.length < 8 || o.userId.length > 64) return null
      if (typeof o.secret !== 'string' || o.secret.length < 16 || o.secret.length > 128) return null
      const create = o.create && typeof o.create === 'object' ? { capacity: Number((o.create as Record<string, unknown>).capacity) } : undefined
      return { t: 'hello', userId: o.userId, secret: o.secret, name: cleanName(o.name), create }
    }
    case 'ready':
      return reqId && typeof o.ready === 'boolean' ? { t: 'ready', ready: o.ready, reqId } : null
    case 'capacity':
      return reqId && typeof o.capacity === 'number' ? { t: 'capacity', capacity: o.capacity, reqId } : null
    case 'role':
      return reqId && typeof o.role === 'string' && ID_RE.test(o.role) ? { t: 'role', role: o.role, reqId } : null
    case 'start':
      return reqId ? { t: 'start', reqId } : null
    case 'leave':
      return reqId ? { t: 'leave', reqId } : null
    case 'back':
      return reqId ? { t: 'back', reqId } : null
    case 'action': {
      const action = cleanAction(o.action)
      return reqId && action ? { t: 'action', action, reqId } : null
    }
    default:
      return null
  }
}

export type { RoomState }

const ID_RE = /^[a-z0-9_]{1,40}$/
const oneOf = <T extends string>(v: unknown, list: readonly T[]): v is T => typeof v === 'string' && (list as readonly string[]).includes(v)
const smallInt = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max

/**
 * 行動の形を、種類ごとに厳しく確かめ、必要な項目だけを取り出す（余分な項目・おかしな値は捨てる）。
 * 悪意のある送信で、部屋の状態がこわれないように。形が違えば null。
 */
export function cleanAction(raw: unknown): SessionAction | null {
  if (!raw || typeof raw !== 'object') return null
  const a = raw as Record<string, unknown>
  switch (a.type) {
    case 'roll':
      return { type: 'roll' }
    case 'hurry':
      return { type: 'hurry' }
    case 'stroll':
      return { type: 'stroll' }
    case 'work':
      return { type: 'work' }
    case 'lodging':
      return oneOf(a.value, ['kichin', 'hatago'] as const) ? { type: 'lodging', value: a.value } : null
    case 'event':
      return smallInt(a.choiceIndex, 20) ? { type: 'event', choiceIndex: a.choiceIndex } : null
    case 'meibutsu':
      return typeof a.buy === 'boolean' ? { type: 'meibutsu', buy: a.buy } : null
    case 'fork':
      return oneOf(a.route, ['main', 'lane'] as const) ? { type: 'fork', route: a.route } : null
    default:
      return null
  }
}
