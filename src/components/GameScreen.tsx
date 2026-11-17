// 旅の画面：盤面・旅人の札・行動・判断（出来事／名物／分かれ道）・道中記。CPU の番は、少しずつ進めて見せる。

import { useEffect, useState } from 'react'
import { DEFAULT_CONFIG, advanceOne, getAwaiting, getEvent, innCostFor, isChoiceAvailable, maxFaceFor, submitAction, type SessionAction } from '../engine'
import { pieceColors } from '../art/theme'
import { BoardView } from './BoardView'
import type { GameState } from '../types/game'

const cfg = DEFAULT_CONFIG

interface Props {
  state: GameState
  onChange: (s: GameState) => void
  cpuDelayMs: number
}

export function GameScreen({ state, onChange, cpuDelayMs }: Props) {
  const [lastRoll, setLastRoll] = useState<{ name: string; face: number } | null>(null)
  const aw = getAwaiting(state)
  const active = state.players[state.turnCtl.activeIndex]
  const human = state.players.find((p) => p.isHuman)

  // 自動で進める場面（CPU の番・足止め）は、間をあけて1つずつ進める
  useEffect(() => {
    if (state.phase !== 'playing' || aw) return
    const timer = setTimeout(() => {
      const out = advanceOne(state, cfg)
      const rolled = out.events.find((e) => e.type === 'rolled')
      if (rolled && rolled.type === 'rolled') setLastRoll({ name: state.players.find((p) => p.id === rolled.playerId)!.name, face: rolled.face })
      onChange(out.state)
    }, cpuDelayMs)
    return () => clearTimeout(timer)
  }, [state, aw, cpuDelayMs, onChange])

  const act = (action: SessionAction) => {
    if (!aw) return
    const out = submitAction(state, aw.playerId, action, cfg)
    const rolled = out.events.find((e) => e.type === 'rolled')
    if (rolled && rolled.type === 'rolled') setLastRoll({ name: state.players.find((p) => p.id === rolled.playerId)!.name, face: rolled.face })
    onChange(out.state)
  }

  const awPlayer = aw ? state.players.find((p) => p.id === aw.playerId)! : null
  const tired = awPlayer && maxFaceFor(awPlayer, cfg) < cfg.balance.game.diceFaces

  return (
    <div className="game">
      <header className="topbar">
        <span className="day" data-testid="day">{state.day}日目</span>
        <span className="sub">／ {cfg.balance.game.maxDays}日まで</span>
        <span className="turn">{active.name}の番</span>
        {lastRoll && <span className="roll" data-testid="last-roll">🎲 {lastRoll.name}：{lastRoll.face}</span>}
      </header>

      <BoardView board={state.board} players={state.players} activeId={active.id} focusId={(awPlayer ?? human ?? active).id} />

      <section className="players">
        {state.players.map((p, i) => {
          const pos = state.board.tiles[state.board.playerStates[p.id].position]
          return (
            <div key={p.id} className={`pcard ${p.id === active.id ? 'active' : ''}`} data-testid={`player-${p.id}`}>
              <div className="pname">
                <span className="dot" style={{ background: pieceColors[i % pieceColors.length] }} />
                {p.name}
                {!p.isHuman && <span className="cpu">CPU</span>}
              </div>
              <div className="where">
                {p.arrivalRank ? `京都に到着（${p.arrivalRank}番目・${p.arrivedDay}日目）` : pos.name}
                {p.restDays > 0 && `（足止め${p.restDays}日）`}
              </div>
              <div className="stats">
                <span>路銀 {p.stats.money}文</span>
                <span>体力 {p.stats.stamina}</span>
                <span>思い出 {p.stats.memories}</span>
                <span>評判 {p.stats.reputation}</span>
                <span>宿代 {innCostFor(p, cfg)}文</span>
                <span>名物 {p.meibutsu.length}</span>
              </div>
            </div>
          )
        })}
      </section>

      {aw?.kind === 'roll' && awPlayer && (
        <section className="dock">
          <div className="dock-who">{awPlayer.name}の番{tired ? '（疲れていて、出目は3まで）' : ''}</div>
          <button className="primary" data-testid="roll" onClick={() => act({ type: 'roll' })}>
            サイコロを振る
          </button>
          <button data-testid="work" onClick={() => act({ type: 'work' })}>
            働いて稼ぐ（+{cfg.balance.travel.workMoney}文・進まない）
          </button>
        </section>
      )}

      {aw?.kind === 'event' && awPlayer && (() => {
        const ev = getEvent(cfg, aw.eventId!)
        return (
          <div className="modal" role="dialog" aria-label={ev.title} data-testid="event-modal">
            <h2>{ev.title}</h2>
            <p>{ev.description}</p>
            {ev.choices.map((c, i) => (
              <button key={i} data-testid="choice" disabled={!isChoiceAvailable(awPlayer, c)} onClick={() => act({ type: 'event', choiceIndex: i })}>
                {c.label}
              </button>
            ))}
          </div>
        )
      })()}

      {aw?.kind === 'meibutsu' && (() => {
        const m = state.board.tiles[aw.tileIndex!].meibutsu!
        return (
          <div className="modal" role="dialog" aria-label="名物" data-testid="meibutsu-modal">
            <h2>{state.board.tiles[aw.tileIndex!].name}の名物</h2>
            <p>「{m.name}」— {m.price}文（思い出+{m.memories}・得点+{cfg.balance.scoring.meibutsuPoints}）</p>
            <button className="primary" data-testid="buy" onClick={() => act({ type: 'meibutsu', buy: true })}>買う</button>
            <button data-testid="pass" onClick={() => act({ type: 'meibutsu', buy: false })}>見送る</button>
          </div>
        )
      })()}

      {aw?.kind === 'fork' && (() => {
        const f = state.board.forks.find((x) => x.tileIndex === aw.tileIndex)!
        return (
          <div className="modal" role="dialog" aria-label="分かれ道" data-testid="fork-modal">
            <h2>{state.board.tiles[f.tileIndex].name}</h2>
            <p>どうやって渡る？</p>
            <button data-testid="route-main" onClick={() => act({ type: 'fork', route: 'main' })}>{f.main.label}<small>{f.main.desc}</small></button>
            <button data-testid="route-lane" onClick={() => act({ type: 'fork', route: 'lane' })}>{f.lane.label}<small>{f.lane.desc}</small></button>
          </div>
        )
      })()}

      <section className="log" data-testid="log">
        {state.log.slice(-8).reverse().map((l, i) => (
          <div key={state.log.length - i}>
            <span className="lday">{l.day}日目</span> {l.message}
          </div>
        ))}
      </section>
    </div>
  )
}
