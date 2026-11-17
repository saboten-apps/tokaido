import { describe, expect, it } from 'vitest'
import { createGame } from '../engine/setup'
import { SCHEMA_VERSION } from '../types/game'
import { MIGRATIONS, SAVE_KEY, createMemoryStorage, deleteSavedGame, loadGame, migrate, saveGame } from './saveGame'

describe('セーブと読み込み', () => {
  it('保存した状態を、そのまま読み込める', () => {
    const storage = createMemoryStorage()
    const state = createGame({ seed: 3 })
    expect(saveGame(state, storage)).toBe(true)
    expect(loadGame(storage)).toEqual(state)
  })

  it('壊れたデータ・新しすぎるバージョンは読まない', () => {
    const storage = createMemoryStorage()
    storage.setItem(SAVE_KEY, '{oops')
    expect(loadGame(storage)).toBeNull()
    storage.setItem(SAVE_KEY, JSON.stringify({ schemaVersion: SCHEMA_VERSION + 1, state: createGame({ seed: 1 }) }))
    expect(loadGame(storage)).toBeNull()
  })

  it('消すと、読み込めない', () => {
    const storage = createMemoryStorage()
    saveGame(createGame({ seed: 1 }), storage)
    deleteSavedGame(storage)
    expect(loadGame(storage)).toBeNull()
  })

  it('移行は1段階ずつ進み、途中が欠けていれば null', () => {
    const steps = { 1: (s: Record<string, unknown>) => ({ ...s, a: 1 }), 2: (s: Record<string, unknown>) => ({ ...s, b: 2 }) }
    expect(migrate({ x: 0 }, 1, steps, 3)).toEqual({ x: 0, a: 1, b: 2, schemaVersion: 3 })
    expect(migrate({ x: 0 }, 1, { 1: steps[1] }, 3)).toBeNull()
  })

  it('v1 のセーブを読むと、泊まり方と旅日記が補われる', () => {
    const v1 = structuredClone(createGame({ seed: 5 })) as unknown as Record<string, unknown>
    delete v1.diary
    for (const p of v1.players as Array<Record<string, unknown>>) delete p.lodging
    expect(Object.keys(MIGRATIONS)).toContain('1')
    const storage = createMemoryStorage()
    storage.setItem(SAVE_KEY, JSON.stringify({ schemaVersion: 1, savedAt: '2026-11-17', state: v1 }))
    const loaded = loadGame(storage)!
    expect(loaded.schemaVersion).toBe(SCHEMA_VERSION)
    expect(loaded.diary).toEqual([])
    expect(loaded.players.every((p) => p.lodging === 'hatago')).toBe(true)
    expect(loaded.players).toHaveLength(v1.players instanceof Array ? v1.players.length : 0)
  })

  it('v2 のセーブを読むと、身分が「ふつうの旅人」に補われる', () => {
    const v2 = structuredClone(createGame({ seed: 6 })) as unknown as Record<string, unknown>
    for (const p of v2.players as Array<Record<string, unknown>>) {
      delete p.role
      p.flags = []
    }
    const storage = createMemoryStorage()
    storage.setItem(SAVE_KEY, JSON.stringify({ schemaVersion: 2, savedAt: '2026-11-17', state: v2 }))
    const loaded = loadGame(storage)!
    expect(loaded.schemaVersion).toBe(SCHEMA_VERSION)
    expect(loaded.players.every((p) => p.role === 'ippan' && p.flags.includes('role:ippan'))).toBe(true)
  })

  it('v1 から v3 まで、続けて移行できる', () => {
    const v1 = structuredClone(createGame({ seed: 7 })) as unknown as Record<string, unknown>
    delete v1.diary
    for (const p of v1.players as Array<Record<string, unknown>>) {
      delete p.lodging
      delete p.role
    }
    const storage = createMemoryStorage()
    storage.setItem(SAVE_KEY, JSON.stringify({ schemaVersion: 1, savedAt: '2026-11-17', state: v1 }))
    const loaded = loadGame(storage)!
    expect(loaded.players.every((p) => p.role === 'ippan' && p.lodging === 'hatago')).toBe(true)
    expect(loaded.diary).toEqual([])
  })

  it('v3 のセーブ（県のない古い盤面）を読むと、盤面が最新に作り直され、旅人の位置は、マスの名前で保たれる', () => {
    const g = createGame({ seed: 8, playerCount: 3 })
    const kusatsuOld = g.board.tiles.findIndex((t) => t.name === '草津')
    g.board.playerStates.p0.position = kusatsuOld
    const v3 = structuredClone(g) as unknown as Record<string, unknown>
    // 古い盤面：県がなく、マスの並びも違う（先頭に、いまはないマスを1つ足した）
    const tiles = (v3.board as { tiles: Array<Record<string, unknown>> }).tiles
    for (const t of tiles) delete t.region
    tiles.unshift({ type: 'event', name: '昔だけのマス' })
    ;(v3.board as { playerStates: Record<string, { position: number }> }).playerStates.p0.position = kusatsuOld + 1
    const storage = createMemoryStorage()
    storage.setItem(SAVE_KEY, JSON.stringify({ schemaVersion: 3, savedAt: '2026-11-17', state: v3 }))
    const loaded = loadGame(storage)!
    expect(loaded.schemaVersion).toBe(SCHEMA_VERSION)
    expect(loaded.board.tiles.every((t) => t.region)).toBe(true)
    const here = loaded.board.tiles[loaded.board.playerStates.p0.position]
    expect(here.name).toBe('草津')
    expect(here.region).toBe('shiga')
    // 位置を持たない旅人（ありえないが）は、日本橋に
    expect(loaded.board.playerStates.p1.position).toBe(0)
  })
})
