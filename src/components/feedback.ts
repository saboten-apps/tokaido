// 演出の補助（画面の外で、そのままテストできる関数）。

import { DEFAULT_CONFIG, REGIONS, regionAt } from '../engine'
import type { BoardState, GameState } from '../types/game'

/** 前の状態から増えた道中記の行（新しい順に max 件まで、古い順で返す） */
export function newLogLines(prev: GameState, next: GameState, max = 3): string[] {
  return next.log.slice(prev.log.length).slice(-max).map((l) => l.message)
}

/** 駒の動き：出発のマスから、通ったマスを1つずつ。step=-1 のときは出発のマス */
export function positionAtStep(from: number, path: readonly number[], step: number): number {
  if (step < 0) return from
  return path[Math.min(step, path.length - 1)] ?? from
}

export function prefersReducedMotion(): boolean {
  try {
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  } catch {
    return false
  }
}

/** 位置 index（0〜count-1）を、小地図の押した位置（0〜1）から求める */
export function indexFromRatio(ratio: number, count: number): number {
  return Math.min(count - 1, Math.max(0, Math.floor(ratio * count)))
}

/** 県の境を越えたときの通知文（越えていなければ null） */
export function regionEntry(board: BoardState, who: string, from: number, to: number): string | null {
  const a = regionAt(board, from)
  const b = regionAt(board, to)
  if (a === b) return null
  const r = REGIONS[b]
  return `${who}は${r.name}（${r.province}）に入った。${r.tagline}`
}

/** 場面（3D）で、旅人が道を歩いて遠ざかる時間（ミリ秒）。通る宿場が多いほど、長い。 */
export function travelMs(viaCount: number, factor = 1): number {
  return Math.round(Math.min(5600, Math.max(2600, 1800 + viaCount * 600)) * factor)
}

/**
 * 動きの各段階の長さ（ミリ秒）。
 * 地図（2D）：はじめ350 → 1マスごとに120。
 * 場面（3D）：サイコロ（step -1）1900 → 道を歩く（step 0）travelMs → 次の土地に着く（step 1）3200。
 */
export function phaseDelay(mode: '2d' | '3d', step: number, viaCount: number, factor = 1): number {
  if (mode === '2d') return step < 0 ? 350 : 120
  if (step < 0) return Math.round(1900 * factor)
  if (step === 0) return travelMs(viaCount, factor)
  return Math.round(3200 * factor)
}

/** カットイン（イベントの場面に入るときの、画面を横切る帯） */
export interface CutItem {
  key: string
  /** 帯の上の小さな札：「宿場の話」「関所」「道中の出来事」「名物」「分かれ道」 */
  tag: string
  /** 大きな字：イベントの名前 */
  title: string
  /** 小さな字：場所と、だれが */
  sub: string
  tone: 'event' | 'shuku' | 'sekisho' | 'meibutsu' | 'fork'
}

/** 起きたイベントの、札と色（宿場の専用か、関所か、道中の出来事か） */
function eventTone(eventId: string): { tag: string; tone: CutItem['tone'] } {
  const ev = DEFAULT_CONFIG.events.find((e) => e.id === eventId)
  if (eventId.endsWith('sekisho')) return { tag: '関所', tone: 'sekisho' }
  if (ev?.special) return { tag: '宿場の話', tone: 'shuku' }
  return { tag: '道中の出来事', tone: 'event' }
}

/**
 * 状態が変わったとき、どんなカットインを出すか。
 * ・人間のイベントが始まった（選択を待つ）
 * ・CPU のイベントが、自動で済んだ（道中記の「【題名】名前：…」から）
 * ・人間が、名物を買うか、分かれ道を選ぶ場面になった
 */
export function cutinsFromTransition(prev: GameState, next: GameState): CutItem[] {
  const items: CutItem[] = []
  const placeOf = (pid: string) => next.board.tiles[next.board.playerStates[pid]?.position ?? 0]?.name ?? ''
  const nameOf = (pid: string) => next.players.find((p) => p.id === pid)?.name ?? ''
  const pe = next.pendingEvent
  if (pe && !(prev.pendingEvent && prev.pendingEvent.eventId === pe.eventId && prev.pendingEvent.playerId === pe.playerId && prev.log.length === next.log.length)) {
    const ev = DEFAULT_CONFIG.events.find((e) => e.id === pe.eventId)
    if (ev) {
      const { tag, tone } = eventTone(ev.id)
      items.push({ key: `pe:${pe.playerId}:${ev.id}:${next.log.length}`, tag, title: ev.title, sub: `${placeOf(pe.playerId)}　${nameOf(pe.playerId)}`, tone })
    }
  }
  for (const l of next.log.slice(prev.log.length)) {
    const m = /^【(.+?)】(.+?)：/.exec(l.message)
    if (!m) continue
    const who = next.players.find((p) => p.name === m[2] && !p.isHuman)
    const ev = DEFAULT_CONFIG.events.find((e) => e.title === m[1])
    if (!who || !ev) continue
    const { tag, tone } = eventTone(ev.id)
    items.push({ key: `log:${who.id}:${ev.id}:${next.log.indexOf(l)}`, tag, title: ev.title, sub: `${placeOf(who.id)}　${who.name}`, tone })
  }
  const a = next.turnCtl.awaiting
  const pa = prev.turnCtl.awaiting
  if (a && (a.kind === 'meibutsu' || a.kind === 'fork') && !(pa && pa.kind === a.kind && pa.tileIndex === a.tileIndex && pa.playerId === a.playerId)) {
    const tile = next.board.tiles[a.tileIndex]
    if (a.kind === 'meibutsu' && tile?.meibutsu) {
      items.push({ key: `m:${a.playerId}:${a.tileIndex}:${next.log.length}`, tag: '名物', title: tile.meibutsu.name, sub: `${tile.name}　${nameOf(a.playerId)}`, tone: 'meibutsu' })
    } else if (a.kind === 'fork' && tile) {
      items.push({ key: `f:${a.playerId}:${a.tileIndex}:${next.log.length}`, tag: '分かれ道', title: tile.name, sub: `どう渡る？　${nameOf(a.playerId)}`, tone: 'fork' })
    }
  }
  return items
}
