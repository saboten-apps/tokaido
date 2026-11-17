// 画面の部品。ひとり用の旅（GameScreen）と、オンラインの旅（OnlineScreen）で共有する。

import { DEFAULT_CONFIG, canHurry, getEvent, innCostFor, isChoiceAvailable, isTired, maxFaceFor, type Awaiting, type SessionAction } from '../engine'
import { pieceColors } from '../art/theme'
import type { GameState, Player } from '../types/game'

const cfg = DEFAULT_CONFIG

export function PlayerCards({ state, activeId, selfId }: { state: GameState; activeId: string; selfId?: string | null }) {
  return (
    <section className="players">
      {state.players.map((p, i) => {
        const pos = state.board.tiles[state.board.playerStates[p.id].position]
        return (
          <div key={p.id} className={`pcard ${p.id === activeId ? 'active' : ''}`} data-testid={`player-${p.id}`}>
            <div className="pname">
              <span className="dot" style={{ background: pieceColors[i % pieceColors.length] }} />
              {p.name}
              {p.id === selfId && <span className="cpu">あなた</span>}
              <span className="role-chip" data-testid={`role-${p.id}`}>{cfg.balance.roles[p.role].name}</span>
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
  )
}

interface ActionProps {
  state: GameState
  aw: Awaiting | null
  onAct: (action: SessionAction) => void
}

/** 行動の欄（振る・早足・泊まり方・働く）と、判断の画面（出来事・名物・分かれ道）。aw の人の分だけ出す */
export function ActionPanel({ state, aw, onAct }: ActionProps) {
  const awPlayer: Player | null = aw ? (state.players.find((p) => p.id === aw.playerId) ?? null) : null
  if (!aw || !awPlayer) return null
  const tired = isTired(awPlayer, cfg)

  if (aw.kind === 'roll') {
    return (
      <section className="dock">
        <div className="dock-who">{awPlayer.name}の番{tired ? `（疲れていて、出目は${maxFaceFor(awPlayer, cfg)}まで）` : ''}</div>
        <button className="primary" data-testid="roll" onClick={() => onAct({ type: 'roll' })}>
          サイコロを振る
        </button>
        <button data-testid="hurry" disabled={!canHurry(awPlayer, cfg)} onClick={() => onAct({ type: 'hurry' })}>
          早足で振る（+{cfg.balance.travel.hurryBonus}マス・体力-{cfg.balance.roles[awPlayer.role].hurryStamina ?? cfg.balance.travel.hurryStamina}）
        </button>
        <span className="lodging" role="group" aria-label="泊まり方">
          泊まり方：
          {(['kichin', 'hatago'] as const).map((id) => (
            <button
              key={id}
              data-testid={`lodging-${id}`}
              aria-pressed={awPlayer.lodging === id}
              className={awPlayer.lodging === id ? 'on' : ''}
              onClick={() => onAct({ type: 'lodging', value: id })}
            >
              {cfg.balance.lodging[id].name}<small>{innCostFor(awPlayer, cfg, id)}文・体力+{cfg.balance.lodging[id].stamina}</small>
            </button>
          ))}
        </span>
        <button data-testid="work" onClick={() => onAct({ type: 'work' })}>
          働いて稼ぐ（+{cfg.balance.travel.workMoney + cfg.balance.roles[awPlayer.role].workMoneyBonus}文・進まない）
        </button>
      </section>
    )
  }

  if (aw.kind === 'event') {
    const ev = getEvent(cfg, aw.eventId!)
    return (
      <div className="modal" role="dialog" aria-label={ev.title} data-testid="event-modal">
        <small className="modal-who">{awPlayer.name}</small>
        <h2>{ev.title}</h2>
        <p>{ev.description}</p>
        {ev.choices.map((c, i) => (
          <button key={i} data-testid="choice" disabled={!isChoiceAvailable(awPlayer, c)} onClick={() => onAct({ type: 'event', choiceIndex: i })}>
            {c.label}
          </button>
        ))}
      </div>
    )
  }

  if (aw.kind === 'meibutsu') {
    const tile = state.board.tiles[aw.tileIndex!]
    const m = tile.meibutsu!
    return (
      <div className="modal" role="dialog" aria-label="名物" data-testid="meibutsu-modal">
        <small className="modal-who">{awPlayer.name}</small>
        <h2>{tile.name}の名物</h2>
        <p>「{m.name}」— {m.price}文（思い出+{m.memories}・得点+{cfg.balance.scoring.meibutsuPoints}）</p>
        <button className="primary" data-testid="buy" onClick={() => onAct({ type: 'meibutsu', buy: true })}>買う</button>
        <button data-testid="pass" onClick={() => onAct({ type: 'meibutsu', buy: false })}>見送る</button>
      </div>
    )
  }

  const f = state.board.forks.find((x) => x.tileIndex === aw.tileIndex)
  if (aw.kind === 'fork' && f) {
    return (
      <div className="modal" role="dialog" aria-label="分かれ道" data-testid="fork-modal">
        <small className="modal-who">{awPlayer.name}</small>
        <h2>{state.board.tiles[f.tileIndex].name}</h2>
        <p>どうやって渡る？</p>
        <button data-testid="route-main" onClick={() => onAct({ type: 'fork', route: 'main' })}>{f.main.label}<small>{f.main.desc}</small></button>
        <button data-testid="route-lane" onClick={() => onAct({ type: 'fork', route: 'lane' })}>{f.lane.label}<small>{f.lane.desc}</small></button>
      </div>
    )
  }
  return null
}

export function LogPanel({ state }: { state: GameState }) {
  return (
    <section className="log" data-testid="log">
      {state.log.slice(-8).reverse().map((l, i) => (
        <div key={state.log.length - i}>
          <span className="lday">{l.day}日目</span> {l.message}
        </div>
      ))}
    </section>
  )
}
