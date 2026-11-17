// 演出の補助（画面の外で、そのままテストできる関数）。

import { REGIONS, regionAt } from '../engine'
import type { BoardState, GameState } from '../types/game'

/** 前の状態から増えた道中記の行（新しい順に max 件まで、古い順で返す） */
export function newLogLines(prev: GameState, next: GameState, max = 3): string[] {
  return next.log.slice(prev.log.length).slice(-max).map((l) => l.message)
}

/** 駒の動き：出発のマスから、通ったマスを1つずつ。step=-1 のときは出発のマス */
export function positionAtStep(from: number, path: readonly number[], step: number): number {
  if (step < 0) return from
  return path[Math.min(step, path.length - 1)] ?? from
}

export function prefersReducedMotion(): boolean {
  try {
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  } catch {
    return false
  }
}

/** 位置 index（0〜count-1）を、小地図の押した位置（0〜1）から求める */
export function indexFromRatio(ratio: number, count: number): number {
  return Math.min(count - 1, Math.max(0, Math.floor(ratio * count)))
}

/** 県の境を越えたときの通知文（越えていなければ null） */
export function regionEntry(board: BoardState, who: string, from: number, to: number): string | null {
  const a = regionAt(board, from)
  const b = regionAt(board, to)
  if (a === b) return null
  const r = REGIONS[b]
  return `${who}は${r.name}（${r.province}）に入った。${r.tagline}`
}

/** 場面（3D）で、旅人が道を歩いて遠ざかる時間（ミリ秒）。通る宿場が多いほど、長い。 */
export function travelMs(viaCount: number): number {
  return Math.min(3600, Math.max(1400, 900 + viaCount * 380))
}

/**
 * 動きの各段階の長さ（ミリ秒）。
 * 地図（2D）：はじめ350 → 1マスごとに120。
 * 場面（3D）：サイコロ（step -1）1700 → 道を歩く（step 0）travelMs → 次の土地に着く（step 1）1900。
 */
export function phaseDelay(mode: '2d' | '3d', step: number, viaCount: number): number {
  if (mode === '2d') return step < 0 ? 350 : 120
  if (step < 0) return 1700
  if (step === 0) return travelMs(viaCount)
  return 1900
}
