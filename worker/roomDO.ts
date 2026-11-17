// 1部屋＝1つの Durable Object。WebSocket は Hibernation API で受ける（待っている間は、課金される実行時間を使わない）。
// 状態の計算は src/online/roomServer.ts（純粋な関数）。ここは、受信・保存・配信・アラームをつなぐだけ。

import { DurableObject } from 'cloudflare:workers'
import { roomView } from '../src/engine/room'
import { parseClientMessage, type ServerMessage } from '../src/online/protocol'
import { handleAlarm, handleDisconnect, handleHello, handleMessage, type Result, type Stored } from '../src/online/roomServer'

interface Attachment {
  code: string
  userId: string | null
}

/** 1つの接続あたり、10秒に40通まで */
const RATE_WINDOW_MS = 10_000
const RATE_MAX = 40

export class RoomDO extends DurableObject {
  private rate = new WeakMap<WebSocket, number[]>()

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('expected websocket', { status: 426 })
    const pair = new WebSocketPair()
    const [client, server] = [pair[0], pair[1]]
    this.ctx.acceptWebSocket(server)
    const att: Attachment = { code: request.headers.get('x-room-code') ?? '', userId: null }
    server.serializeAttachment(att)
    return new Response(null, { status: 101, webSocket: client })
  }

  private send(ws: WebSocket, msg: ServerMessage): void {
    try {
      ws.send(JSON.stringify(msg))
    } catch {
      /* 閉じかけの接続は、閉じるときの処理に任せる */
    }
  }

  private socketsOf(userId: string | 'all'): Array<{ ws: WebSocket; userId: string }> {
    const list: Array<{ ws: WebSocket; userId: string }> = []
    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment() as Attachment | null
      if (a?.userId && (userId === 'all' || a.userId === userId)) list.push({ ws, userId: a.userId })
    }
    return list
  }

  private async apply(r: Result): Promise<void> {
    if (r.destroy) {
      await this.ctx.storage.deleteAlarm()
      await this.ctx.storage.deleteAll()
    } else if (r.stored) {
      await this.ctx.storage.put('s', r.stored)
      if (r.alarmAt !== null) await this.ctx.storage.setAlarm(r.alarmAt)
    }
    for (const o of r.out) {
      const targets = o.to === 'all' ? this.socketsOf('all') : this.socketsOf(o.to.userId)
      for (const t of targets) {
        if ('state' in o) {
          if (r.stored) this.send(t.ws, { t: 'state', view: roomView(r.stored.room, t.userId) })
        } else {
          this.send(t.ws, o.msg)
        }
      }
    }
    if (r.destroy) for (const ws of this.ctx.getWebSockets()) ws.close(1000, '部屋が閉じました')
  }

  async webSocketMessage(ws: WebSocket, data: string | ArrayBuffer): Promise<void> {
    if (typeof data !== 'string') return
    const now = Date.now()
    const hits = (this.rate.get(ws) ?? []).filter((t) => now - t < RATE_WINDOW_MS)
    hits.push(now)
    this.rate.set(ws, hits)
    if (hits.length > RATE_MAX) {
      this.send(ws, { t: 'error', code: 'rate_limited', message: '送りすぎです。少し待ってください' })
      if (hits.length > RATE_MAX * 2) ws.close(1008, 'rate limited')
      return
    }
    const msg = parseClientMessage(data)
    if (!msg) {
      this.send(ws, { t: 'error', code: 'bad_message', message: 'メッセージが正しくありません' })
      return
    }
    const att = ws.deserializeAttachment() as Attachment
    try {
      if (msg.t === 'hello') {
        if (att.userId) return
        const bytes = new TextEncoder().encode(`${msg.userId}:${msg.secret}`)
        const secretHash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((b) => b.toString(16).padStart(2, '0')).join('')
        const stored = (await this.ctx.storage.get<Stored>('s')) ?? null
        const seed = crypto.getRandomValues(new Uint32Array(1))[0]
        const r = handleHello(stored, { code: att.code, userId: msg.userId, secretHash, name: msg.name, create: msg.create, seed }, now)
        if (r.error) {
          this.send(ws, { t: 'error', code: r.error.code, message: r.error.message })
          ws.close(1008, r.error.code)
          return
        }
        ws.serializeAttachment({ code: att.code, userId: msg.userId } satisfies Attachment)
        // 同じ人の古い接続は閉じる（別の端末・タブへ引っ越し）
        for (const other of this.socketsOf(msg.userId)) if (other.ws !== ws) other.ws.close(4000, '別の接続に切り替わりました')
        await this.apply(r)
        return
      }
      if (!att.userId) {
        this.send(ws, { t: 'error', code: 'not_hello', message: '先に参加の手続きが必要です' })
        return
      }
      const stored = (await this.ctx.storage.get<Stored>('s')) ?? null
      if (!stored) {
        this.send(ws, { t: 'error', code: 'no_room', message: '部屋が見つかりません' })
        ws.close(1008, 'no_room')
        return
      }
      const r = handleMessage(stored, att.userId, msg, now)
      if (r.error) {
        this.send(ws, { t: 'error', code: r.error.code, message: r.error.message, reqId: r.error.reqId })
        return
      }
      await this.apply(r)
    } catch (e) {
      console.error('roomDO message error', e)
      this.send(ws, { t: 'error', code: 'internal', message: 'サーバーでエラーが起きました' })
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const att = ws.deserializeAttachment() as Attachment | null
    if (!att?.userId) return
    // 同じ人の別の接続が生きていれば、切断扱いにしない
    if (this.socketsOf(att.userId).some((o) => o.ws !== ws && o.ws.readyState === WebSocket.OPEN)) return
    const stored = await this.ctx.storage.get<Stored>('s')
    if (!stored) return
    await this.apply(handleDisconnect(stored, att.userId, Date.now()))
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    await this.webSocketClose(ws)
  }

  async alarm(): Promise<void> {
    const stored = await this.ctx.storage.get<Stored>('s')
    if (!stored) return
    await this.apply(handleAlarm(stored, Date.now()))
  }
}
