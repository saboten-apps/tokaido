// オンライン対戦のクライアント（WebSocket）。つなぎ直し・古い配信の破棄・行動の確認（ack）・再送を受け持つ。
// umaregacya の client.ts を、旅向けに作り替えた。

import { generateRoomCode } from '../engine/room'
import type { SessionAction, SessionEvent } from '../engine/session'
import type { GameState } from '../types/game'
import type { ClientMessage, RoomView, ServerMessage, StepView } from './protocol'

/** 再生する1コマ：起きたことと、そのコマが終わった時点の状態 */
export interface ReplayStep {
  events: SessionEvent[]
  state: GameState
}
export interface ReplayBatch {
  version: number
  steps: ReplayStep[]
}

/** steps（旅日記・ログ抜き）と、同じ版の最終の状態から、再生するコマを組み立てる */
export function buildReplay(steps: StepView[], finalGame: GameState): ReplayStep[] {
  return steps.map((st) => ({
    events: st.events,
    state: st.game ? ({ ...st.game, log: finalGame.log.slice(0, st.logLen), diary: finalGame.diary } as GameState) : finalGame,
  }))
}

export type ConnStatus = 'connecting' | 'open' | 'reconnecting' | 'closed'

export interface Identity {
  userId: string
  secret: string
}

const ID_KEY = 'tokaido-sugoroku:online-id'
const NAME_KEY = 'tokaido-sugoroku:online-name'

function randomHex(bytes: number): string {
  const a = new Uint8Array(bytes)
  crypto.getRandomValues(a)
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** 端末ごとの識別子と合言葉。最初に作って、記憶する（消えると、元の席には戻れない） */
export function getIdentity(): Identity {
  try {
    const raw = localStorage.getItem(ID_KEY)
    if (raw) {
      const v = JSON.parse(raw) as Identity
      if (v.userId && v.secret) return v
    }
  } catch {
    /* 記憶できない環境でも、そのまま使える */
  }
  const id = { userId: `u-${randomHex(10)}`, secret: randomHex(24) }
  try {
    localStorage.setItem(ID_KEY, JSON.stringify(id))
  } catch {
    /* 同上 */
  }
  return id
}

export function getSavedName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? ''
  } catch {
    return ''
  }
}
export function saveName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name)
  } catch {
    /* 同上 */
  }
}

const LAST_ROOM_KEY = 'tokaido-sugoroku:online-room'
const LAST_ROOM_TTL_MS = 6 * 60 * 60_000

/** 前回の部屋（アプリを閉じても、戻れるように） */
export function loadLastRoom(now = Date.now()): { code: string; name: string } | null {
  try {
    const v = JSON.parse(localStorage.getItem(LAST_ROOM_KEY) ?? 'null') as { code?: string; name?: string; at?: number } | null
    if (v?.code && typeof v.at === 'number' && now - v.at < LAST_ROOM_TTL_MS) return { code: v.code, name: v.name ?? '' }
  } catch {
    /* 読めなければ、ないものとして扱う */
  }
  return null
}
export function saveLastRoom(code: string, name: string): void {
  try {
    localStorage.setItem(LAST_ROOM_KEY, JSON.stringify({ code, name, at: Date.now() }))
  } catch {
    /* 同上 */
  }
}
export function clearLastRoom(): void {
  try {
    localStorage.removeItem(LAST_ROOM_KEY)
  } catch {
    /* 同上 */
  }
}

export function newRoomCode(): string {
  return generateRoomCode(() => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32)
}

export function roomUrl(code: string, loc: Pick<Location, 'protocol' | 'host'> = window.location): string {
  return `${loc.protocol === 'https:' ? 'wss' : 'ws'}://${loc.host}/api/rooms/${code}/ws`
}

export interface ClientOptions {
  code: string
  name: string
  /** 部屋を作る（最初の接続だけ） */
  create?: { capacity: number }
  identity?: Identity
  url?: string
  /** テスト用 */
  WebSocketImpl?: typeof WebSocket
}

type Pending = { msg: ClientMessage; resolve: () => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }

/** 致命的で、つなぎ直しても直らないエラー */
const FATAL = new Set(['bad_secret', 'no_room', 'room_error'])

export class OnlineClient {
  status: ConnStatus = 'connecting'
  view: RoomView | null = null
  lastError: string | null = null
  fatal = false
  private ws: WebSocket | null = null
  private listeners = new Set<() => void>()
  private batchListeners = new Set<(batch: ReplayBatch) => void>()
  private pendingSteps: { version: number; steps: StepView[] } | null = null
  private pending = new Map<string, Pending>()
  private attempts = 0
  private closedByUs = false
  private created = false
  private pingTimer: ReturnType<typeof setInterval> | null = null
  private retryTimer: ReturnType<typeof setTimeout> | null = null
  private readonly identity: Identity

  private readonly opts: ClientOptions

  constructor(opts: ClientOptions) {
    this.opts = opts
    this.identity = opts.identity ?? getIdentity()
    this.connect()
  }

  get you(): { userId: string; playerId: string | null } {
    return this.view?.you ?? { userId: this.identity.userId, playerId: null }
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  /** 相手（や自分）の行動で進んだぶんの、コマごとの記録。同じ版の状態が届いたところで、先に知らせる */
  onBatch(fn: (batch: ReplayBatch) => void): () => void {
    this.batchListeners.add(fn)
    return () => this.batchListeners.delete(fn)
  }

  private emit(): void {
    for (const l of this.listeners) l()
  }

  private connect(): void {
    if (this.closedByUs) return
    const Impl = this.opts.WebSocketImpl ?? WebSocket
    this.status = this.attempts === 0 ? 'connecting' : 'reconnecting'
    this.emit()
    const ws = new Impl(this.opts.url ?? roomUrl(this.opts.code))
    this.ws = ws
    ws.onopen = () => {
      this.attempts = 0
      const create = this.opts.create && !this.created ? this.opts.create : undefined
      this.rawSend({ t: 'hello', userId: this.identity.userId, secret: this.identity.secret, name: this.opts.name, create })
      this.created = true
      this.status = 'open'
      this.lastError = null
      // 送ったのに確認が届いていない行動は、もう一度送る（サーバーが reqId で重複を防ぐ）
      for (const p of this.pending.values()) this.rawSend(p.msg)
      if (this.pingTimer) clearInterval(this.pingTimer)
      this.pingTimer = setInterval(() => this.rawSend({ t: 'ping' }), 40_000)
      this.emit()
    }
    ws.onmessage = (e) => {
      let m: ServerMessage
      try {
        m = JSON.parse(String(e.data)) as ServerMessage
      } catch {
        return
      }
      this.onServer(m)
    }
    ws.onclose = () => {
      if (this.ws !== ws) return
      if (this.pingTimer) clearInterval(this.pingTimer)
      if (this.closedByUs || this.fatal) {
        this.status = 'closed'
        this.failPending(new Error(this.lastError ?? '切断されました'))
        this.emit()
        return
      }
      this.attempts += 1
      this.status = 'reconnecting'
      this.emit()
      const wait = Math.min(10_000, 800 * 2 ** Math.min(this.attempts, 4))
      this.retryTimer = setTimeout(() => this.connect(), wait)
    }
    ws.onerror = () => {
      /* onclose で処理する */
    }
  }

  private onServer(m: ServerMessage): void {
    switch (m.t) {
      case 'state':
        // 古い配信は捨てる
        if (this.view && m.view.version < this.view.version) return
        this.view = m.view
        // 同じ版の steps が先に届いていれば、再生するコマを組み立てて、状態の知らせより先に渡す
        if (this.pendingSteps && this.pendingSteps.version === m.view.version && m.view.game) {
          const batch: ReplayBatch = { version: m.view.version, steps: buildReplay(this.pendingSteps.steps, m.view.game) }
          this.pendingSteps = null
          for (const l of this.batchListeners) l(batch)
        }
        this.emit()
        break
      case 'steps':
        this.pendingSteps = { version: m.version, steps: m.steps }
        break
      case 'ack': {
        const p = this.pending.get(m.reqId)
        if (p) {
          clearTimeout(p.timer)
          this.pending.delete(m.reqId)
          p.resolve()
        }
        break
      }
      case 'error': {
        this.lastError = m.message
        if (m.reqId) {
          const p = this.pending.get(m.reqId)
          if (p) {
            clearTimeout(p.timer)
            this.pending.delete(m.reqId)
            p.reject(new Error(m.message))
          }
        } else if (FATAL.has(m.code)) {
          this.fatal = true
        }
        this.emit()
        break
      }
      case 'pong':
        break
    }
  }

  private rawSend(msg: ClientMessage): void {
    if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(msg))
  }

  private failPending(e: Error): void {
    for (const p of this.pending.values()) {
      clearTimeout(p.timer)
      p.reject(e)
    }
    this.pending.clear()
  }

  /** 行動・ロビーの操作を送り、サーバーの確認（ack）を待つ。断られたらエラー */
  private request(build: (reqId: string) => ClientMessage): Promise<void> {
    const reqId = randomHex(8)
    const msg = build(reqId)
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(reqId)
        reject(new Error('サーバーから返事がありません'))
      }, 15_000)
      this.pending.set(reqId, { msg, resolve, reject, timer })
      this.rawSend(msg)
    })
  }

  sendAction(action: SessionAction): Promise<void> {
    return this.request((reqId) => ({ t: 'action', action, reqId }))
  }
  setReady(ready: boolean): Promise<void> {
    return this.request((reqId) => ({ t: 'ready', ready, reqId }))
  }
  setCapacity(capacity: number): Promise<void> {
    return this.request((reqId) => ({ t: 'capacity', capacity, reqId }))
  }
  /** 身分を選ぶ（ロビーで） */
  setRole(role: string): Promise<void> {
    return this.request((reqId) => ({ t: 'role', role, reqId }))
  }
  start(): Promise<void> {
    return this.request((reqId) => ({ t: 'start', reqId }))
  }
  /** CPU が代わりに進めていたのを、やめて、自分の番に戻る */
  back(): Promise<void> {
    return this.request((reqId) => ({ t: 'back', reqId }))
  }
  leave(): Promise<void> {
    return this.request((reqId) => ({ t: 'leave', reqId }))
  }

  close(): void {
    this.closedByUs = true
    if (this.pingTimer) clearInterval(this.pingTimer)
    if (this.retryTimer) clearTimeout(this.retryTimer)
    this.failPending(new Error('切断しました'))
    this.ws?.close()
    this.status = 'closed'
    this.emit()
  }
}
