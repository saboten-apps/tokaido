import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG as cfg } from './config'
import {
  RoomError, createRoom, generateRoomCode, joinRoom, leaveRoom, roomAction, roomView, setCapacity, setConnected, setReady, setRole, startRoom, tickRoom, type RoomState,
} from './room'
import { SessionError, getAwaiting } from './session'

const T0 = 1_000_000

function lobby(capacity = 3): RoomState {
  let r = createRoom({ code: 'ABCDE', hostId: 'host', hostName: '花子', capacity, seed: 11 })
  r = joinRoom(r, 'guest', '太郎')
  return r
}

function started(capacity = 3): RoomState {
  let r = lobby(capacity)
  r = setReady(setReady(r, 'host', true), 'guest', true)
  return startRoom(r, 'host', T0)
}

describe('部屋（ロビー）', () => {
  it('部屋コードは、紛らわしい文字を使わない', () => {
    const code = generateRoomCode(() => 0.5, 40)
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]+$/)
  })

  it('入る・出る・人数・満員', () => {
    let r = lobby(2)
    expect(r.seats.map((s) => s.name)).toEqual(['花子', '太郎'])
    expect(() => joinRoom(r, 'third', '三郎')).toThrow(RoomError)
    expect(() => joinRoom(r, 'guest', '太郎')).toThrow(RoomError)
    expect(() => setCapacity(r, 'guest', 4)).toThrow(RoomError) // ホストだけ
    r = setCapacity(r, 'host', 4)
    expect(r.capacity).toBe(4)
    expect(() => setCapacity(r, 'host', 1)).toThrow(RoomError)
    const left = leaveRoom(r, 'host')!
    expect(left.hostId).toBe('guest')
  })

  it('身分を選ぶと、準備完了が取り消される。知らない身分は選べない', () => {
    let r = setReady(lobby(), 'guest', true)
    r = setRole(r, 'guest', 'hikyaku')
    expect(r.seats[1].role).toBe('hikyaku')
    expect(r.seats[1].ready).toBe(false)
    expect(() => setRole(r, 'guest', 'tennou')).toThrow(RoomError)
  })

  it('全員が準備完了でないと、始められない。始められるのはホストだけ', () => {
    const r = setReady(lobby(), 'host', true)
    expect(() => startRoom(r, 'host', T0)).toThrow(RoomError)
    const ready = setReady(r, 'guest', true)
    expect(() => startRoom(ready, 'guest', T0)).toThrow(RoomError)
    const s = startRoom(ready, 'host', T0)
    expect(s.status).toBe('playing')
  })
})

describe('部屋（ゲーム）', () => {
  it('始まると、選んだ身分で、席の人が p0・p1 になり、余った席は CPU', () => {
    let r = lobby(3)
    r = setRole(r, 'guest', 'bushi')
    r = setReady(setReady(r, 'host', true), 'guest', true)
    const s = startRoom(r, 'host', T0)
    const g = s.game!
    expect(g.players).toHaveLength(3)
    expect(g.players[0]).toMatchObject({ name: '花子', isHuman: true, role: 'ippan' })
    expect(g.players[1]).toMatchObject({ name: '太郎', isHuman: true, role: 'bushi' })
    expect(g.players[2].isHuman).toBe(false)
    expect(s.deadline).not.toBeNull()
  })

  it('自分の番でない人の行動は、受け付けない。自分の番なら、進む', () => {
    const r = started()
    const aw = getAwaiting(r.game!)!
    expect(aw.playerId).toBe('p0')
    expect(() => roomAction(r, 'guest', { type: 'roll' }, T0 + 1)).toThrow(SessionError)
    const up = roomAction(r, 'host', { type: 'roll' }, T0 + 1)
    expect(up.room.version).toBeGreaterThan(r.version)
    expect(up.steps.length).toBeGreaterThan(0)
    expect(up.steps.at(-1)!.state).toEqual(up.room.game)
  })

  it('配る形では、乱数とシードを隠す', () => {
    const v = roomView(started(), 'guest')
    expect(v.seed).toBe(0)
    expect(v.game!.rngState).toBe(0)
    expect(v.you).toEqual({ userId: 'guest', playerId: 'p1' })
  })

  it('持ち時間を切らすと自動プレイで進み、続けて切らすと CPU 任せになる', () => {
    let r = started()
    const first = getAwaiting(r.game!)!.playerId
    const idx = Number(first.slice(1))
    for (let i = 0; i < 2; i++) {
      const t = tickRoom(r, r.deadline! + 1)
      r = t.room
      // 同じ席の次の待ちまで、進む
      if (getAwaiting(r.game!)?.playerId !== first) break
    }
    expect(r.seats[idx].missed).toBeGreaterThan(0)
    expect(r.game!.log.length).toBeGreaterThan(1)
  })

  it('切断された人の番は、自動プレイで進む', () => {
    let r = started()
    const first = getAwaiting(r.game!)!.playerId
    r = setConnected(r, first === 'p0' ? 'host' : 'guest', false)
    const t = tickRoom(r, T0 + 5)
    expect(t.steps.length).toBeGreaterThan(0)
    expect(t.room.game).not.toEqual(r.game)
  })

  it('全員が自動プレイでも、最後まで進んで、終了する', () => {
    let r = started(2)
    for (let i = 0; i < 4000 && r.status === 'playing'; i++) {
      r = setConnected(setConnected(r, 'host', false), 'guest', false)
      r = tickRoom(r, T0 + i).room
    }
    expect(r.status).toBe('finished')
    expect(r.game!.players.every((p) => p.arrivalRank !== null || r.game!.day > cfg.balance.game.maxDays)).toBe(true)
  })
})
