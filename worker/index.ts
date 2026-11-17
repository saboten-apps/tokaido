// Cloudflare Worker の入口。/api/rooms/:code/ws は、その部屋の Durable Object へつなぐ。それ以外は、静的ファイル（dist）。
// umaregacya の worker/index.ts から、計測・結果つきリンク・旧URLの移転を外したもの。

import { RoomDO } from './roomDO'

export { RoomDO }

export interface Env {
  ROOMS: DurableObjectNamespace
  ASSETS: Fetcher
}

const CODE_RE = /^[A-HJ-NP-Z2-9]{5}$/

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const m = /^\/api\/rooms\/([^/]+)\/ws$/.exec(url.pathname)
    if (m) {
      const code = m[1].toUpperCase()
      if (!CODE_RE.test(code)) return new Response('bad room code', { status: 400 })
      if (request.headers.get('Upgrade') !== 'websocket') return new Response('expected websocket', { status: 426 })
      // 他のサイトからの接続は断る（ブラウザの Origin が、このサイトと同じときだけ）
      const origin = request.headers.get('Origin')
      if (origin && origin !== url.origin) return new Response('forbidden origin', { status: 403 })
      const stub = env.ROOMS.get(env.ROOMS.idFromName(code))
      const headers = new Headers(request.headers)
      headers.set('x-room-code', code)
      return stub.fetch(new Request(request, { headers }))
    }
    if (url.pathname.startsWith('/api/')) return new Response('not found', { status: 404 })
    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
