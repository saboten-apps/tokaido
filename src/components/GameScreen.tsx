// 旅の画面：盤面・旅人の札・行動・判断（出来事／名物／分かれ道）・道中記。CPU の番は、少しずつ進めて見せる。

import { useEffect, useState } from 'react'
import { DEFAULT_CONFIG, advanceOne, getAwaiting, submitAction, type SessionAction, type SessionResult } from '../engine'
import { BoardView } from './BoardView'
import { MiniMap } from './MiniMap'
import { ActionPanel, LogPanel, PlayerCards } from './parts'
import { newLogLines, positionAtStep, prefersReducedMotion } from './feedback'
import type { GameState } from '../types/game'

const cfg = DEFAULT_CONFIG

interface Props {
  state: GameState
  onChange: (s: GameState) => void
  cpuDelayMs: number
}

interface Anim {
  playerId: string
  from: number
  path: number[]
  step: number
}

interface Toast {
  id: number
  text: string
}

const STEP_MS = 120
let toastSeq = 0

export function GameScreen({ state, onChange, cpuDelayMs }: Props) {
  const [lastRoll, setLastRoll] = useState<{ name: string; face: number } | null>(null)
  const [anim, setAnim] = useState<Anim | null>(null)
  const [dice, setDice] = useState<{ face: number; hurry: boolean; name: string } | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [arrival, setArrival] = useState<{ rank: number; day: number } | null>(null)
  const [jump, setJump] = useState<{ index: number; n: number } | null>(null)
  // 演出は、CPU の番を待たない（?fast=1）ときと、動きを減らす設定のときは省く
  const animate = cpuDelayMs > 0 && !prefersReducedMotion()
  const busy = anim !== null
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
        setAnim({ playerId: rolled.playerId, from: rolled.from, path: rolled.path, step: -1 })
        setDice({ face: rolled.face, hurry: rolled.hurry, name })
        setTimeout(() => setDice(null), 1000)
      }
    }
    const arrived = out.events.find((e) => e.type === 'arrived')
    if (arrived && arrived.type === 'arrived' && prev.players.find((p) => p.id === arrived.playerId)?.isHuman) {
      setArrival({ rank: arrived.rank, day: arrived.day })
      setTimeout(() => setArrival(null), 2600)
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
      anim.step < 0 ? 350 : STEP_MS,
    )
    return () => clearTimeout(timer)
  }, [anim])

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
        <span className="turn">{active.name}の番</span>
        {lastRoll && <span className="roll" data-testid="last-roll">🎲 {lastRoll.name}：{lastRoll.face}</span>}
      </header>

      <MiniMap
        board={state.board}
        players={state.players}
        positions={positions}
        focusId={anim?.playerId ?? awPlayer?.id ?? (active.isHuman ? active : human)?.id ?? active.id}
        onJump={(index) => setJump({ index, n: (jump?.n ?? 0) + 1 })}
      />
      <BoardView
        board={state.board}
        players={state.players}
        activeId={active.id}
        focusId={anim?.playerId ?? (awPlayer ?? (active.isHuman ? active : human) ?? active).id}
        positions={positions}
        jump={jump}
      />

      <PlayerCards state={state} activeId={active.id} />

      <ActionPanel state={state} aw={aw} onAct={act} />

      {dice && (
        <div className="dice-pop" data-testid="dice-pop" role="status" aria-live="polite">
          <div className="dice-face">{dice.face}</div>
          <div className="dice-note">{dice.name}{dice.hurry ? `　早足＋${cfg.balance.travel.hurryBonus}` : ''}</div>
        </div>
      )}
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
