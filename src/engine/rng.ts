// 乱数生成器。テストで固定・差し替えできるよう、エンジンは必ずこの Rng 経由で乱数を使う。

export interface Rng {
  /** 0 以上 1 未満の乱数 */
  next(): number
  /** 現在の内部状態（セーブデータに保存し、ロード後に同じ展開を再現する） */
  getState(): number
}

/** mulberry32 による再現可能な疑似乱数 */
export function createRng(state: number): Rng {
  let s = state >>> 0
  return {
    next() {
      s = (s + 0x6d2b79f5) >>> 0
      let t = s
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    },
    getState() {
      return s
    },
  }
}

/** 決められた値を順番に返す Rng（テスト用）。値を使い切ったら先頭に戻る */
export function createSequenceRng(values: number[]): Rng {
  let i = 0
  return {
    next() {
      const v = values[i % values.length]
      i += 1
      return v
    },
    getState() {
      return i
    },
  }
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0
}

/** min 以上 max 以下の整数 */
export function randomInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng.next() * (max - min + 1))
}

export function chance(rng: Rng, probability: number): boolean {
  return rng.next() < probability
}

/** 重み付き抽選。候補が空なら null */
export function weightedPick<T>(rng: Rng, items: readonly T[], weightOf: (item: T) => number): T | null {
  const total = items.reduce((sum, item) => sum + Math.max(0, weightOf(item)), 0)
  if (items.length === 0 || total <= 0) return null
  let roll = rng.next() * total
  for (const item of items) {
    roll -= Math.max(0, weightOf(item))
    if (roll < 0) return item
  }
  return items[items.length - 1]
}
