// スタンプが増えたとき、動きが終わってから、印の演出を出す（自分の分だけ）。

import { useEffect, useRef, useState } from 'react'
import type { GameState } from '../types/game'

export interface StampEvent {
  key: number
  name: string
  count: number
}

/** playerIds の旅人のスタンプが増えたら、動き（busy）が終わったあとに1つ返す。close で消す */
export function useStampPop(state: GameState, playerIds: string[], busy: boolean): [StampEvent | null, () => void] {
  const seen = useRef<Record<string, number>>({})
  const seq = useRef(0)
  const [pop, setPop] = useState<StampEvent | null>(null)
  const idsKey = playerIds.join(',')
  useEffect(() => {
    if (busy) return
    for (const id of idsKey ? idsKey.split(',') : []) {
      const p = state.players.find((x) => x.id === id)
      if (!p) continue
      const before = seen.current[id]
      seen.current[id] = p.visited.length
      if (before !== undefined && p.visited.length > before) {
        // 状態の読み込み直し（続きから）では出さない：増えたときだけ
        setPop({ key: ++seq.current, name: p.visited[p.visited.length - 1], count: p.visited.length })
      }
    }
  }, [state, idsKey, busy])
  return [pop, () => setPop(null)]
}
