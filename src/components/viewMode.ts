// 盤面の見せ方（2D・3D）の記憶。端末ごとの好みなので、localStorage に覚える（使えない環境でも、そのまま動く）。

import { useState } from 'react'

export type ViewMode = '2d' | '3d'

const KEY = 'tokaido-sugoroku:view-mode'

export function loadViewMode(): ViewMode {
  try {
    return localStorage.getItem(KEY) === '3d' ? '3d' : '2d'
  } catch {
    return '2d'
  }
}

export function saveViewMode(mode: ViewMode): void {
  try {
    localStorage.setItem(KEY, mode)
  } catch {
    /* 覚えられなくても、遊べる */
  }
}

export function useViewMode(): [ViewMode, () => void] {
  const [mode, setMode] = useState<ViewMode>(() => loadViewMode())
  return [
    mode,
    () => {
      const next: ViewMode = mode === '2d' ? '3d' : '2d'
      saveViewMode(next)
      setMode(next)
    },
  ]
}
