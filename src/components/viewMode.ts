// 盤面の見せ方（2D・3D）。基本は3D。端末ごとの好みは localStorage に覚える（使えない環境でも、そのまま動く）。

import { useState } from 'react'

export type ViewMode = '2d' | '3d'

const KEY = 'tokaido-sugoroku:view-mode'

/** WebGL が使えるか（使えない端末では、3D にしない） */
function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'))
  } catch {
    return false
  }
}

/** 基本は3D。端末に好みが覚えてあればそれに従い、なければ、WebGL が使えるときだけ3D */
export function loadViewMode(): ViewMode {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === '2d' || saved === '3d') return saved
  } catch {
    /* 覚えがなければ、下で決める */
  }
  return webglAvailable() ? '3d' : '2d'
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
