// 2D の盤面（SVG）。地図どおり、右が江戸（日本橋）、左が京都。脇道は本道の下に描く。

import { useEffect, useMemo, useRef } from 'react'
import { artFor, pieceColors } from '../art/theme'
import type { BoardState, Player } from '../types/game'
import { LANE_Y, MARGIN, SPACING, layoutBoard, type Point } from './boardLayout'

interface Props {
  board: BoardState
  players: Player[]
  activeId: string | null
  focusId: string | null
}

export function BoardView({ board, players, activeId, focusId }: Props) {
  const pts = useMemo(() => layoutBoard(board), [board])
  const width = MARGIN * 2 + (board.mainLength - 1) * SPACING
  const height = LANE_Y + 100
  const focusRef = useRef<SVGGElement | null>(null)

  const focusPos = focusId ? board.playerStates[focusId]?.position : undefined
  useEffect(() => {
    focusRef.current?.scrollIntoView?.({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [focusPos])

  const roads: Array<[Point, Point]> = []
  for (let i = 0; i < board.mainLength - 1; i++) roads.push([pts[i], pts[i + 1]])
  for (const f of board.forks) {
    roads.push([pts[f.tileIndex], pts[f.laneStart]])
    for (let k = 0; k < f.laneLength - 1; k++) roads.push([pts[f.laneStart + k], pts[f.laneStart + k + 1]])
    roads.push([pts[f.laneStart + f.laneLength - 1], pts[f.mergeIndex]])
  }

  return (
    <div className="board-scroll" data-testid="board">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="東海道の盤面">
        {roads.map(([a, b], i) => (
          <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="road" />
        ))}
        {board.tiles.map((tile, i) => {
          const p = pts[i]
          const art = artFor(tile)
          const big = tile.type === 'shuku' || tile.type === 'start' || tile.type === 'goal' || tile.type === 'fork'
          const r = big ? 22 : 16
          return (
            <g key={i} transform={`translate(${p.x},${p.y})`} data-tile={i}>
              <circle r={r} fill={art.fill} stroke={tile.mustStop ? '#f5d76e' : '#fff'} strokeWidth={tile.mustStop ? 4 : 2} />
              {art.image ? (
                <image href={art.image} x={-r} y={-r} width={r * 2} height={r * 2} />
              ) : (
                <text className="tile-symbol" dy="0.35em" fontSize={big ? 18 : 14}>
                  {art.symbol}
                </text>
              )}
              <text className={big ? 'tile-name big' : 'tile-name'} y={r + 14}>
                {tile.name}
              </text>
            </g>
          )
        })}
        {players.map((pl, idx) => {
          const pos = board.playerStates[pl.id].position
          const here = players.filter((q) => board.playerStates[q.id].position === pos)
          const k = here.indexOf(pl)
          const p = pts[pos]
          const x = p.x + (k - (here.length - 1) / 2) * 13
          const y = p.y - 34
          return (
            <g key={pl.id} transform={`translate(${x},${y})`} ref={pl.id === focusId ? focusRef : undefined} className="piece-g" data-piece={pl.id}>
              <circle r={pl.id === activeId ? 9 : 7} fill={pieceColors[idx % pieceColors.length]} stroke="#222" strokeWidth={pl.id === activeId ? 3 : 1.5} />
              <text className="piece-label" dy="0.35em">{pl.name.slice(0, 1)}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
