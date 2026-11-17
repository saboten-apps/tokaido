// 小地図：本道全体の細い帯（盤面と同じく、右が日本橋・左が京都）。全員の位置を点で見せ、押すとそこへ盤面をスクロールする。

import { tileArt, pieceColors } from '../art/theme'
import type { BoardState, Player } from '../types/game'
import { indexFromRatio } from './feedback'

const CELL = 8
const H = 34

interface Props {
  board: BoardState
  players: Player[]
  positions: Record<string, number>
  focusId: string | null
  onJump: (index: number) => void
}

export function MiniMap({ board, players, positions, focusId, onJump }: Props) {
  const n = board.mainLength
  const width = n * CELL
  return (
    <div className="minimap" data-testid="minimap" aria-label="小地図（押すと、そこへ移動）">
      <svg
        viewBox={`0 0 ${width} ${H}`}
        preserveAspectRatio="none"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          onJump(n - 1 - indexFromRatio((e.clientX - r.left) / r.width, n))
        }}
      >
        {board.tiles.slice(0, n).map((t, i) => (
          <rect key={i} x={(n - 1 - i) * CELL} y={18} width={CELL - 1} height={12} fill={tileArt[t.type].fill} opacity={t.type === 'shuku' ? 0.55 : 0.95} />
        ))}
        {players.map((p, i) => {
          const pos = Math.min(positions[p.id] ?? 0, n - 1)
          const lane = positions[p.id] >= n
          return (
            <circle key={p.id} cx={(n - 1 - pos) * CELL + CELL / 2} cy={lane ? 24 : 9} r={p.id === focusId ? 6 : 4.5} fill={pieceColors[i % pieceColors.length]} stroke="#222" strokeWidth={p.id === focusId ? 2 : 1} />
          )
        })}
      </svg>
      <div className="minimap-ends"><span>京都</span><span>日本橋</span></div>
    </div>
  )
}
