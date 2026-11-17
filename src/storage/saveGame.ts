// セーブデータの保存・読み込み。ゲームの状態を保存するのは、このモジュールだけ（エンジンは localStorage を触らない）。
// umaregacya の saveGame.ts の仕組み（封筒・段階的な移行）を写した。

import { SCHEMA_VERSION, type GameState } from '../types/game'

export const SAVE_KEY = 'tokaido-sugoroku:save'

export interface SaveStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

interface SaveEnvelope {
  schemaVersion: number
  savedAt: string
  state: unknown
}

/**
 * 旧バージョンのセーブデータを 1 段階ずつ新しい形式に変換する。
 * キーは変換「元」のバージョン。SCHEMA_VERSION を上げたら、ここに追加してテストを書く。
 */
export const MIGRATIONS: Record<number, (state: Record<string, unknown>) => Record<string, unknown>> = {
  // v1 → v2：泊まり方（lodging）と旅日記（diary）が加わった
  1: (state) => ({
    ...state,
    players: ((state.players as Array<Record<string, unknown>>) || []).map((p) => ({ ...p, lodging: p.lodging ?? 'hatago' })),
    diary: Array.isArray(state.diary) ? state.diary : [],
  }),
}

function defaultStorage(): SaveStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function migrate(
  state: Record<string, unknown>,
  fromVersion: number,
  migrations: Record<number, (s: Record<string, unknown>) => Record<string, unknown>> = MIGRATIONS,
  toVersion: number = SCHEMA_VERSION,
): GameState | null {
  let current = state
  for (let v = fromVersion; v < toVersion; v++) {
    const step = migrations[v]
    if (!step) return null
    current = step(current)
  }
  return { ...current, schemaVersion: toVersion } as unknown as GameState
}

function looksLikeGameState(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  if (!Array.isArray(v.players) || v.players.length === 0 || typeof v.day !== 'number') return false
  const b = v.board as Record<string, unknown> | undefined
  if (!b || !Array.isArray(b.tiles) || typeof b.playerStates !== 'object' || b.playerStates === null) return false
  return v.players.every((p) => typeof p === 'object' && p !== null && (b.playerStates as Record<string, unknown>)[(p as { id: string }).id] !== undefined)
}

export function saveGame(state: GameState, storage: SaveStorage | null = defaultStorage()): boolean {
  if (!storage) return false
  const envelope: SaveEnvelope = { schemaVersion: SCHEMA_VERSION, savedAt: new Date().toISOString(), state }
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(envelope))
    return true
  } catch {
    return false
  }
}

/** セーブデータを読み込む。存在しない・壊れている・移行できない場合は null */
export function loadGame(storage: SaveStorage | null = defaultStorage()): GameState | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(SAVE_KEY)
    if (!raw) return null
    const envelope = JSON.parse(raw) as Partial<SaveEnvelope>
    const version = envelope.schemaVersion
    if (typeof version !== 'number' || version < 1 || version > SCHEMA_VERSION) return null
    if (!looksLikeGameState(envelope.state)) return null
    return migrate(envelope.state, version)
  } catch {
    return null
  }
}

export function deleteSavedGame(storage: SaveStorage | null = defaultStorage()): void {
  try {
    storage?.removeItem(SAVE_KEY)
  } catch {
    // 保存先が使えない場合は何もしない
  }
}

/** テストや localStorage が使えない環境向けの、メモリ上の保存先 */
export function createMemoryStorage(): SaveStorage {
  const data = new Map<string, string>()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  }
}
