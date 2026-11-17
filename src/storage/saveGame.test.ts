import { describe, expect, it } from 'vitest'
import { createGame } from '../engine/setup'
import { SCHEMA_VERSION } from '../types/game'
import { SAVE_KEY, createMemoryStorage, deleteSavedGame, loadGame, migrate, saveGame } from './saveGame'

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
})
