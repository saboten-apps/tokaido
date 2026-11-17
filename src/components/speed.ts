// 演出の速さ（ゆっくり・ふつう・はやい）。端末ごとの好みは localStorage に覚える（使えない環境でも、そのまま動く）。

import { useState } from 'react'

export type Speed = 'slow' | 'normal' | 'fast'

const KEY = 'tokaido-sugoroku:speed'

export const SPEED_ORDER: Speed[] = ['slow', 'normal', 'fast']
export const SPEED_LABEL: Record<Speed, string> = { slow: 'ゆっくり', normal: 'ふつう', fast: 'はやい' }
/** 待ち時間にかける倍率（ふつう＝1） */
export const SPEED_FACTOR: Record<Speed, number> = { slow: 1.5, normal: 1, fast: 0.45 }

export function loadSpeed(): Speed {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'slow' || v === 'normal' || v === 'fast') return v
  } catch {
    /* 覚えがなければ、ふつう */
  }
  return 'normal'
}

export function saveSpeed(speed: Speed): void {
  try {
    localStorage.setItem(KEY, speed)
  } catch {
    /* 覚えられなくても、遊べる */
  }
}

/** 暗転の長さ（ミリ秒） */
export function fadeMs(): number {
  return Math.round(900 * SPEED_FACTOR[loadSpeed()])
}

export function nextSpeed(s: Speed): Speed {
  return SPEED_ORDER[(SPEED_ORDER.indexOf(s) + 1) % SPEED_ORDER.length]
}

export function useSpeed(): [Speed, () => void] {
  const [speed, setSpeed] = useState<Speed>(() => loadSpeed())
  return [
    speed,
    () => {
      const next = nextSpeed(speed)
      saveSpeed(next)
      setSpeed(next)
    },
  ]
}
