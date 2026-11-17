// 盤面の座標（右が江戸、左が京都。脇道は本道の下）
import type { BoardState } from '../types/game'

export const SPACING = 76
export const MARGIN = 50
export const MAIN_Y = 90
export const LANE_Y = 200

export interface Point {
  x: number
  y: number
}

export function layoutBoard(board: BoardState): Point[] {
  const n = board.mainLength
  const pts: Point[] = []
  for (let i = 0; i < n; i++) pts.push({ x: MARGIN + (n - 1 - i) * SPACING, y: MAIN_Y + Math.round(Math.sin(i * 0.9) * 22) })
  for (const f of board.forks) {
    const a = pts[f.tileIndex]
    const b = pts[f.mergeIndex]
    for (let k = 0; k < f.laneLength; k++) {
      const t = (k + 1) / (f.laneLength + 1)
      pts[f.laneStart + k] = { x: Math.round(a.x + (b.x - a.x) * t), y: LANE_Y + (k % 2) * 36 }
    }
  }
  return pts
}

