// 盤面：2D（SVG）か、3D（three.js。開いたときだけ読み込む）。切り替えボタンつき。

import { Suspense, lazy } from 'react'
import { BoardView } from './BoardView'
import type { ViewMode } from './viewMode'
import type { Weather } from '../engine'
import type { BoardState, Player } from '../types/game'

const SceneStage = lazy(() => import('./SceneStage'))

interface Props {
  board: BoardState
  players: Player[]
  activeId: string | null
  focusId: string | null
  positions: Record<string, number>
  jump: { index: number; n: number } | null
  /** 今日の天気（場面の空に出る。雨なら雨の景色） */
  weather?: Weather
  /** 場面（3D）で、旅人が道を歩いているあいだ。通る場所の名前と、かける時間 */
  travel?: { id: string; playerId: string; via: string[]; ms: number } | null
}

export function ViewToggle({ mode, onToggle }: { mode: ViewMode; onToggle: () => void }) {
  return (
    <button className="linkish" data-testid="view-toggle" aria-pressed={mode === '3d'} onClick={onToggle}>
      {mode === '2d' ? '場面で見る' : '地図で見る'}
    </button>
  )
}

export function BoardStage({ mode, ...props }: Props & { mode: ViewMode }) {
  if (mode === '2d') return <BoardView {...props} />
  return (
    <Suspense fallback={<div className="board3d" data-testid="board3d-loading">3Dを読み込んでいます…</div>}>
      <SceneStage {...props} />
    </Suspense>
  )
}
