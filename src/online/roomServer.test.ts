import { describe, expect, it } from 'vitest'
import { handleAlarm, handleDisconnect, handleHello, handleMessage, GRACE_MS, type Stored } from './roomServer'
import { getAwaiting } from '../engine/session'
import { cleanAction, parseClientMessage } from './protocol'

const T0 = 1_000_000
const A = { userId: 'user-aaaaaaaa', secretHash: 'ha' }
const B = { userId: 'user-bbbbbbbb', secretHash: 'hb' }

function lobby(): Stored {
  let r = handleHello(null, { code: 'ABCDE', ...A, name: 'あ', create: { capacity: 3 }, seed: 7 }, T0)
  r = handleHello(r.stored, { code: 'ABCDE', ...B, name: 'い', seed: 0 }, T0)
  return r.stored!
}
function started(): Stored {
  let s = lobby()
  s = handleMessage(s, A.userId, { t: 'ready', ready: true, reqId: 'r1' }, T0).stored!
  s = handleMessage(s, B.userId, { t: 'ready', ready: true, reqId: 'r2' }, T0).stored!
  return handleMessage(s, A.userId, { t: 'start', reqId: 'r3' }, T0).stored!
}

describe('オンラインの部屋（サーバー側の処理）', () => {
  it('部屋がなければ作れず、作る指定があれば作れる', () => {
    expect(handleHello(null, { code: 'X', ...A, name: 'あ', seed: 1 }, T0).error?.code).toBe('no_room')
    expect(handleHello(null, { code: 'X', ...A, name: 'あ', create: { capacity: 9 }, seed: 1 }, T0).error?.code).toBe('room_error')
    const r = handleHello(null, { code: 'X', ...A, name: 'あ', create: { capacity: 4 }, seed: 1 }, T0)
    expect(r.stored?.room.seats).toHaveLength(1)
    expect(r.alarmAt).toBeGreaterThan(T0)
  })

  it('合言葉が違う人は、その席に入れない。同じ合言葉ならつなぎ直せる', () => {
    const s = lobby()
    const bad = handleHello(s, { code: 'ABCDE', userId: B.userId, secretHash: 'zz', name: 'い', seed: 0 }, T0)
    expect(bad.error?.code).toBe('bad_secret')
    const d = handleDisconnect(s, B.userId, T0).stored!
    expect(d.room.seats[1].connected).toBe(false)
    const again = handleHello(d, { code: 'ABCDE', ...B, name: 'い', seed: 0 }, T0 + 1000).stored!
    expect(again.room.seats[1].connected).toBe(true)
  })

  it('ゲームを始めたあとは、新しい人は入れない', () => {
    const s = started()
    const r = handleHello(s, { code: 'ABCDE', userId: 'user-cccccccc', secretHash: 'hc', name: 'う', seed: 0 }, T0)
    expect(r.error?.code).toBe('room_error')
  })

  it('手番でない人の行動は、状態を変えずに断られる', () => {
    const s = started()
    const aw = getAwaiting(s.room.game!)
    const other = aw?.playerId === 'p0' ? B.userId : A.userId
    const mine = other === A.userId ? B.userId : A.userId
    const before = s.room.version
    const r = handleMessage(s, other, { t: 'action', action: { type: 'roll' }, reqId: 'x1' }, T0)
    expect(r.error?.code).toBe('session_error')
    expect(r.stored?.room.version).toBe(before)
    const ok = handleMessage(s, mine, { t: 'action', action: { type: 'roll' }, reqId: 'x2' }, T0)
    expect(ok.error).toBeUndefined()
    expect(ok.stored!.room.version).toBeGreaterThan(before)
    expect(ok.out.some((o) => 'msg' in o && o.msg.t === 'steps')).toBe(true)
  })

  it('同じ reqId を2回送っても、2回は進まない', () => {
    const s = started()
    const aw = getAwaiting(s.room.game!)!
    const uid = aw.playerId === 'p0' ? A.userId : B.userId
    const first = handleMessage(s, uid, { t: 'action', action: { type: 'roll' }, reqId: 'dup' }, T0)
    const second = handleMessage(first.stored!, uid, { t: 'action', action: { type: 'roll' }, reqId: 'dup' }, T0)
    expect(second.stored!.room.version).toBe(first.stored!.room.version)
    expect(second.out.some((o) => 'msg' in o && o.msg.t === 'ack')).toBe(true)
  })

  it('切断の猶予が切れると、その人の番は自動プレイで進む。つなぎ直せば進まない', () => {
    const s = started()
    const aw = getAwaiting(s.room.game!)!
    const uid = aw.playerId === 'p0' ? A.userId : B.userId
    const d = handleDisconnect(s, uid, T0)
    expect(d.alarmAt).toBe(T0 + GRACE_MS)
    // 猶予の途中のアラームでは、進まない
    const early = handleAlarm(d.stored!, T0 + 1000)
    expect(early.stored!.room.version).toBe(d.stored!.room.version)
    // つなぎ直す
    const back = handleHello(d.stored!, { code: 'ABCDE', userId: uid, secretHash: uid === A.userId ? A.secretHash : B.secretHash, name: 'x', seed: 0 }, T0 + 2000).stored!
    expect(handleAlarm(back, T0 + GRACE_MS + 10).stored!.room.version).toBe(back.room.version)
    // つなぎ直さない
    const late = handleAlarm(d.stored!, T0 + GRACE_MS + 10)
    expect(late.stored!.room.version).toBeGreaterThan(d.stored!.room.version)
    expect(late.stored!.room.seats.find((x) => x.userId === uid)?.connected).toBe(false)
  })

  it('持ち時間が切れると、自動プレイで進む', () => {
    const s = started()
    expect(s.room.deadline).not.toBeNull()
    const r = handleAlarm(s, s.room.deadline! + 1)
    expect(r.stored!.room.version).toBeGreaterThan(s.room.version)
  })

  it('ロビーで切断した人は、猶予のあとに席が外れる。全員いなくなれば部屋が閉じる', () => {
    const s = lobby()
    const d = handleDisconnect(s, B.userId, T0).stored!
    const r = handleAlarm(d, T0 + GRACE_MS + 1)
    expect(r.stored!.room.seats).toHaveLength(1)
    const d2 = handleDisconnect(r.stored!, A.userId, T0 + 9000).stored!
    expect(handleAlarm(d2, T0 + 9000 + GRACE_MS + 1).destroy).toBe(true)
  })

  it('だれも来ない部屋は、期限で閉じる', () => {
    const s = lobby()
    expect(handleAlarm(s, s.expireAt + 1).destroy).toBe(true)
  })

  it('ホストだけが開始できる。全員の準備が要る', () => {
    let s = lobby()
    expect(handleMessage(s, A.userId, { t: 'start', reqId: 's1' }, T0).error?.code).toBe('room_error')
    s = handleMessage(s, A.userId, { t: 'ready', ready: true, reqId: 's2' }, T0).stored!
    s = handleMessage(s, B.userId, { t: 'ready', ready: true, reqId: 's3' }, T0).stored!
    expect(handleMessage(s, B.userId, { t: 'start', reqId: 's4' }, T0).error?.code).toBe('room_error')
    expect(handleMessage(s, A.userId, { t: 'start', reqId: 's5' }, T0).stored!.room.status).toBe('playing')
  })
})

describe('メッセージの検証', () => {
  it('壊れた・大きすぎる・形の違うメッセージは捨てる', () => {
    expect(parseClientMessage('{')).toBeNull()
    expect(parseClientMessage('"x"')).toBeNull()
    expect(parseClientMessage(JSON.stringify({ t: 'action', action: { type: 'roll' } }))).toBeNull()
    expect(parseClientMessage(JSON.stringify({ t: 'hello', userId: 'a', secret: 'b', name: 'x' }))).toBeNull()
    expect(parseClientMessage('x'.repeat(5000))).toBeNull()
    expect(parseClientMessage(JSON.stringify({ t: 'action', action: { type: 'roll' }, reqId: 'q' }))?.t).toBe('action')
  })
  it('名前は、長さと制御文字を整える', () => {
    const m = parseClientMessage(JSON.stringify({ t: 'hello', userId: 'abcdefgh', secret: 'x'.repeat(20), name: '<b>' + 'あ'.repeat(30) }))
    expect(m?.t === 'hello' && m.name.length <= 12 && !m.name.includes('<')).toBe(true)
  })

  it('持ち時間を続けて切らすと、その人はCPU任せになる（アラームで記録が残る）。「戻る」で自分の番に戻れる', () => {
    let s = started()
    let now = T0
    let guard = 0
    while (!s.room.seats.some((x) => x.auto) && guard++ < 12) {
      now = s.room.deadline ?? now + 1
      s = handleAlarm(s, now).stored!
    }
    const idx = s.room.seats.findIndex((x) => x.auto)
    expect(idx).toBeGreaterThanOrEqual(0)
    const me = idx === 0 ? A.userId : B.userId
    const back = handleMessage(s, me, { t: 'back', reqId: 'b1' }, now)
    expect(back.error).toBeUndefined()
    expect(back.stored!.room.seats[idx].auto).toBe(false)
    expect(parseClientMessage(JSON.stringify({ t: 'back', reqId: 'b2' }))).toEqual({ t: 'back', reqId: 'b2' })
  })

  it('行動の形は、種類ごとに厳しく確かめる（おかしな値・余分な項目は捨てる）', () => {
    expect(cleanAction({ type: 'roll', extra: 'x' })).toEqual({ type: 'roll' })
    expect(cleanAction({ type: 'hurry' })).toEqual({ type: 'hurry' })
    expect(cleanAction({ type: 'work' })).toEqual({ type: 'work' })
    expect(cleanAction({ type: 'lodging', value: 'kichin' })).toEqual({ type: 'lodging', value: 'kichin' })
    expect(cleanAction({ type: 'lodging', value: 'honjin' })).toBeNull()
    expect(cleanAction({ type: 'event', choiceIndex: 1 })).toEqual({ type: 'event', choiceIndex: 1 })
    expect(cleanAction({ type: 'event', choiceIndex: '1' })).toBeNull()
    expect(cleanAction({ type: 'event', choiceIndex: 1e9 })).toBeNull()
    expect(cleanAction({ type: 'meibutsu', buy: true })).toEqual({ type: 'meibutsu', buy: true })
    expect(cleanAction({ type: 'meibutsu', buy: 'yes' })).toBeNull()
    expect(cleanAction({ type: 'fork', route: 'lane' })).toEqual({ type: 'fork', route: 'lane' })
    expect(cleanAction({ type: 'fork', route: 'secret' })).toBeNull()
    expect(cleanAction({ type: 'gamble', choice: 'small' })).toBeNull() // 旅にはない行動
    expect(cleanAction({ type: 'unknown' })).toBeNull()
    expect(parseClientMessage(JSON.stringify({ t: 'action', reqId: 'r', action: { type: 'fork', route: 'secret' } }))).toBeNull()
  })
})

describe('オンラインの身分', () => {
  const mk = () => {
    let r = handleHello(null, { code: 'ROLES', ...A, name: 'あ', create: { capacity: 3 }, seed: 7 }, T0)
    r = handleHello(r.stored, { code: 'ROLES', ...B, name: 'い', seed: 0 }, T0)
    return r.stored!
  }

  it('ロビーで、自分の席の身分を選べる。選ぶと準備完了が取り消される。始まったあとは変えられない', () => {
    let s = mk()
    s = handleMessage(s, B.userId, { t: 'ready', ready: true, reqId: 'a1' }, T0).stored!
    s = handleMessage(s, B.userId, { t: 'role', role: 'hikyaku', reqId: 'a2' }, T0).stored!
    expect(s.room.seats[1]).toMatchObject({ role: 'hikyaku', ready: false })
    expect(s.room.seats[0].role).toBe('ippan')
    expect(handleMessage(s, B.userId, { t: 'role', role: 'tennou', reqId: 'a3' }, T0).error?.code).toBe('room_error')
    s = handleMessage(s, A.userId, { t: 'ready', ready: true, reqId: 'a4' }, T0).stored!
    s = handleMessage(s, B.userId, { t: 'ready', ready: true, reqId: 'a5' }, T0).stored!
    const playing = handleMessage(s, A.userId, { t: 'start', reqId: 'a6' }, T0).stored!
    expect(playing.room.game!.players[1].role).toBe('hikyaku')
    expect(handleMessage(playing, B.userId, { t: 'role', role: 'bushi', reqId: 'a7' }, T0).error?.code).toBe('room_error')
  })

  it('通信の形式：身分は英数字の ID だけ', () => {
    expect(parseClientMessage(JSON.stringify({ t: 'role', role: 'bushi', reqId: 'a' }))).toEqual({ t: 'role', role: 'bushi', reqId: 'a' })
    expect(parseClientMessage(JSON.stringify({ t: 'role', role: 'Bad Id!', reqId: 'a' }))).toBeNull()
    expect(parseClientMessage(JSON.stringify({ t: 'role', role: 7, reqId: 'a' }))).toBeNull()
    expect(parseClientMessage(JSON.stringify({ t: 'role', role: 'bushi' }))).toBeNull()
  })
})
