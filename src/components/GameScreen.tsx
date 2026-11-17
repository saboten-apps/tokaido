// 旅の画面：盤面・旅人の札・行動・判断（出来事／名物／分かれ道）・道中記。CPU の番は、少しずつ進めて見せる。

import { useEffect, useState } from 'react'
import { DEFAULT_CONFIG, REGIONS, advanceOne, getAwaiting, regionAt, submitAction, type SessionAction, type SessionResult } from '../engine'
import { BoardStage, ViewToggle } from './BoardStage'
import { useViewMode } from './viewMode'
import { MiniMap } from './MiniMap'
import { ActionPanel, CutIn, DicePop, LogPanel, PlaceCard, PlayerCards } from './parts'
import { useCutins } from './useCutins'
import { cutinsFromTransition, newLogLines, phaseDelay, positionAtStep, prefersReducedMotion, regionEntry, travelMs } from './feedback'
import type { GameState } from '../types/game'

const cfg = DEFAULT_CONFIG

interface Props {
  state: GameState
  onChange: (s: GameState) => void
  cpuDelayMs: number
  onHowTo?: () => void
}

interface Anim {
  playerId: string
  from: number
  path: number[]
  step: number
  /** 通った場所の名前（出発の場所から、着いた場所まで）。場面の道中の表示に使う */
  via: string[]
  id: number
}

interface Toast {
  id: number
  text: string
}

let animSeq = 0
let toastSeq = 0

export function GameScreen({ state, onChange, cpuDelayMs, onHowTo }: Props) {
  const [lastRoll, setLastRoll] = useState<{ name: string; face: number } | null>(null)
  const [anim, setAnim] = useState<Anim | null>(null)
  const [dice, setDice] = useState<{ face: number; hurry: boolean; name: string; steps: number; id: number } | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [arrival, setArrival] = useState<{ rank: number; day: number } | null>(null)
  const [jump, setJump] = useState<{ index: number; n: number } | null>(null)
  const [mode, toggleMode] = useViewMode()
  // 演出は、CPU の番を待たない（?fast=1）ときと、動きを減らす設定のときは省く
  const animate = cpuDelayMs > 0 && !prefersReducedMotion()
  // カットイン：動き（サイコロ・道を歩く）が終わってから、1つずつ。出ているあいだは、操作の欄を出さない
  const cuts = useCutins(anim !== null, animate)
  const busy = anim !== null || cuts.busy
  const awRaw = getAwaiting(state)
  const aw = busy ? null : awRaw
  const active = state.players[state.turnCtl.activeIndex]
  const human = state.players.find((p) => p.isHuman)

  // 駒の見かけの位置（動いている駒だけ、1マスずつ）
  const positions: Record<string, number> = {}
  for (const p of state.players) positions[p.id] = state.board.playerStates[p.id].position
  if (anim) positions[anim.playerId] = positionAtStep(anim.from, anim.path, anim.step)

  // 進行の結果を画面へ：状態・サイコロ・動き・通知・到着
  const apply = (prev: GameState, out: SessionResult) => {
    const rolled = out.events.find((e) => e.type === 'rolled')
    if (rolled && rolled.type === 'rolled') {
      const name = prev.players.find((p) => p.id === rolled.playerId)!.name
      setLastRoll({ name, face: rolled.face })
      if (animate && rolled.path.length > 0) {
        // 地図（2D）：通ったマスを1つずつ。場面（3D）：サイコロ → 道を歩いて遠ざかる（通る宿場の名前を順に出す）→ 次の土地へ着く
        const path = mode === '3d' ? [rolled.from, rolled.to] : rolled.path
        const via = [prev.board.tiles[rolled.from].name, ...rolled.path.map((i) => prev.board.tiles[i].name)]
        setAnim({ playerId: rolled.playerId, from: rolled.from, path, step: -1, via, id: ++animSeq })
        setDice({ face: rolled.face, hurry: rolled.hurry, name, steps: rolled.path.length, id: animSeq })
      }
    }
    cuts.push(cutinsFromTransition(prev, out.state))
    const arrived = out.events.find((e) => e.type === 'arrived')
    if (arrived && arrived.type === 'arrived' && prev.players.find((p) => p.id === arrived.playerId)?.isHuman) {
      setArrival({ rank: arrived.rank, day: arrived.day })
      setTimeout(() => setArrival(null), 2600)
    }
    const moved = out.events.find((e) => e.type === 'rolled')
    if (moved && moved.type === 'rolled') {
      const who = prev.players.find((p) => p.id === moved.playerId)!.name
      const entry = regionEntry(prev.board, who, moved.from, moved.to)
      if (entry) {
        const id = ++toastSeq
        setToasts((t) => [...t.slice(-2), { id, text: entry }])
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
      }
    }
    for (const text of newLogLines(prev, out.state)) {
      const id = ++toastSeq
      setToasts((t) => [...t.slice(-2), { id, text }])
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
    }
    onChange(out.state)
  }

  // 動きを1マスずつ進める
  useEffect(() => {
    if (!anim) return
    const timer = setTimeout(
      () => setAnim(anim.step >= anim.path.length - 1 ? null : { ...anim, step: anim.step + 1 }),
      phaseDelay(mode, anim.step, anim.via.length),
    )
    return () => clearTimeout(timer)
  }, [anim, mode])

  // 自動で進める場面（CPU の番・足止め）は、動きが終わってから、間をあけて1つずつ進める
  useEffect(() => {
    if (state.phase !== 'playing' || awRaw || busy) return
    const timer = setTimeout(() => apply(state, advanceOne(state, cfg)), cpuDelayMs)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, awRaw, busy, cpuDelayMs])

  const act = (action: SessionAction) => {
    if (!aw) return
    apply(state, submitAction(state, aw.playerId, action, cfg))
  }

  const awPlayer = aw ? state.players.find((p) => p.id === aw.playerId)! : null

  return (
    <div className="game">
      <header className="topbar">
        <span className="day" data-testid="day">{state.day}日目</span>
        <span className="sub">／ {cfg.balance.game.maxDays}日まで</span>
        <span className="region-badge" data-testid="region-badge">{REGIONS[regionAt(state.board, positions[(awPlayer ?? (active.isHuman ? active : human) ?? active).id])].name}</span>
        <span className="turn">{active.name}の番</span>
        <ViewToggle mode={mode} onToggle={toggleMode} />
        {onHowTo && <button className="linkish" data-testid="open-howto" onClick={onHowTo}>遊び方</button>}
        {lastRoll && <span className="roll" data-testid="last-roll">🎲 {lastRoll.name}：{lastRoll.face}</span>}
      </header>

      <MiniMap
        board={state.board}
        players={state.players}
        positions={positions}
        focusId={anim?.playerId ?? awPlayer?.id ?? (active.isHuman ? active : human)?.id ?? active.id}
        onJump={(index) => setJump({ index, n: (jump?.n ?? 0) + 1 })}
      />
      <BoardStage
        mode={mode}
        board={state.board}
        players={state.players}
        activeId={active.id}
        focusId={anim?.playerId ?? (awPlayer ?? (active.isHuman ? active : human) ?? active).id}
        positions={positions}
        jump={jump}
        travel={anim && mode === '3d' && anim.step === 0 ? { id: String(anim.id), playerId: anim.playerId, via: anim.via, ms: travelMs(anim.via.length) } : null}
      />

      {/* 解説は、いま画面に出ている場所（動いている途中は、まだ着いていない場所）に合わせる */}
      <PlaceCard board={state.board} index={positions[anim?.playerId ?? (awPlayer ?? (active.isHuman ? active : human) ?? active).id]} />

      <PlayerCards state={state} activeId={active.id} />

      <ActionPanel state={state} aw={aw} onAct={act} />

      {cuts.cut && <CutIn item={cuts.cut} />}
      {dice && <DicePop key={dice.id} face={dice.face} hurry={dice.hurry} name={dice.name} steps={dice.steps} onDone={() => setDice((d) => (d && d.id === dice.id ? null : d))} />}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">{t.text}</div>
        ))}
      </div>
      {arrival && (
        <div className="arrival" data-testid="arrival" role="status">
          <div>
            京都・三条大橋に着いた！
            <small>{arrival.day}日目・{arrival.rank}番目</small>
          </div>
        </div>
      )}

      <LogPanel state={state} />
    </div>
  )
}
