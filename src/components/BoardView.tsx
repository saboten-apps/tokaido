// 2D の盤面（SVG）。地図どおり、右が江戸（日本橋）、左が京都。脇道は本道の下に描く。

import { useEffect, useMemo, useRef } from 'react'
import { artFor, pieceColors } from '../art/theme'
import { REGIONS, REGION_ORDER } from '../engine'
import type { BoardState, Player } from '../types/game'
import { LANE_Y, MARGIN, SPACING, layoutBoard, type Point } from './boardLayout'

interface Props {
  board: BoardState
  players: Player[]
  activeId: string | null
  focusId: string | null
  /** 動いている駒の、いまの見かけの位置（なければ、状態の位置） */
  positions: Record<string, number>
  /** 小地図で押された位置（n が変わるたびに、そこへ動く） */
  jump: { index: number; n: number } | null
}

export function BoardView({ board, players, activeId, focusId, positions, jump }: Props) {
  const pts = useMemo(() => layoutBoard(board), [board])
  const width = MARGIN * 2 + (board.mainLength - 1) * SPACING
  const height = LANE_Y + 100
  const focusRef = useRef<SVGGElement | null>(null)

  const focusPos = focusId ? positions[focusId] : undefined
  // 最初の1回は、その場に直接移る（日本橋の側から始まるので、京都の側からゆっくり動かさない）
  const firstFocus = useRef(true)
  useEffect(() => {
    focusRef.current?.scrollIntoView?.({ behavior: firstFocus.current ? 'instant' : 'smooth', inline: 'center', block: 'nearest' })
    firstFocus.current = false
  }, [focusPos])

  const scrollRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!jump) return
    const box = scrollRef.current
    if (!box) return
    const left = Math.max(0, pts[jump.index].x - box.clientWidth / 2)
    box.scrollTo?.({ left, behavior: 'smooth' })
  }, [jump, pts])

  // 県ごとの帯（本道のマスの位置から。右が江戸なので、番号が大きいほど左）
  const bands = REGION_ORDER.flatMap((id) => {
    const xs = pts.slice(0, board.mainLength).filter((_, i) => board.tiles[i].region === id).map((p) => p.x)
    if (xs.length === 0) return []
    return [{ id, x0: Math.min(...xs) - SPACING / 2, x1: Math.max(...xs) + SPACING / 2 }]
  })

  const roads: Array<[Point, Point]> = []
  for (let i = 0; i < board.mainLength - 1; i++) roads.push([pts[i], pts[i + 1]])
  for (const f of board.forks) {
    roads.push([pts[f.tileIndex], pts[f.laneStart]])
    for (let k = 0; k < f.laneLength - 1; k++) roads.push([pts[f.laneStart + k], pts[f.laneStart + k + 1]])
    roads.push([pts[f.laneStart + f.laneLength - 1], pts[f.mergeIndex]])
  }

  return (
    <div className="board-scroll" data-testid="board" ref={scrollRef}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="東海道の盤面">
        {bands.map((b) => (
          <g key={b.id} data-region={b.id}>
            <rect x={b.x0} y={0} width={b.x1 - b.x0} height={height} fill={REGIONS[b.id].band} opacity={0.7} />
            <text className="region-name" x={b.x1 - 8} y={18} textAnchor="end">{REGIONS[b.id].name}</text>
          </g>
        ))}
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
                <>
                  <clipPath id={`clip-${i}`}>
                    <circle r={r - 1} />
                  </clipPath>
                  <image href={art.image} x={-r} y={-r} width={r * 2} height={r * 2} clipPath={`url(#clip-${i})`} preserveAspectRatio="xMidYMid slice" />
                </>
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
          const pos = positions[pl.id]
          const here = players.filter((q) => positions[q.id] === pos)
          const k = here.indexOf(pl)
          const p = pts[pos]
          const x = p.x + (k - (here.length - 1) / 2) * 13
          const y = p.y - 34
          return (
            <g key={pl.id} style={{ transform: `translate(${x}px,${y}px)` }} ref={pl.id === focusId ? focusRef : undefined} className="piece-g" data-piece={pl.id}>
              <circle r={pl.id === activeId ? 9 : 7} fill={pieceColors[idx % pieceColors.length]} stroke="#222" strokeWidth={pl.id === activeId ? 3 : 1.5} />
              <text className="piece-label" dy="0.35em">{pl.name.slice(0, 1)}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
