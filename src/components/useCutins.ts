// カットインの順番待ち。ほかの動き（サイコロ・道を歩く）が終わってから、1つずつ出す。出ているあいだは、操作の欄を出さない。

import { useCallback, useEffect, useState } from 'react'
import type { CutItem } from './feedback'

/** 1つのカットインを見せる時間（ミリ秒） */
export const CUT_MS = 1700

export function useCutins(blocked: boolean, enabled: boolean): { cut: CutItem | null; busy: boolean; push: (items: CutItem[]) => void } {
  const [state, setState] = useState<{ cur: CutItem | null; q: CutItem[] }>({ cur: null, q: [] })
  const push = useCallback(
    (items: CutItem[]) => {
      if (enabled && items.length > 0) setState((s) => ({ ...s, q: [...s.q, ...items] }))
    },
    [enabled],
  )
  useEffect(() => {
    if (state.cur) {
      const t = setTimeout(() => setState((s) => ({ ...s, cur: null })), CUT_MS)
      return () => clearTimeout(t)
    }
    if (!blocked && state.q.length > 0) {
      const t = setTimeout(() => setState((s) => (s.cur ? s : { cur: s.q[0] ?? null, q: s.q.slice(1) })), 0)
      return () => clearTimeout(t)
    }
  }, [state, blocked])
  return { cut: state.cur, busy: state.cur !== null || state.q.length > 0, push }
}
