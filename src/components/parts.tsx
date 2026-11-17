// 画面の部品。ひとり用の旅（GameScreen）と、オンラインの旅（OnlineScreen）で共有する。

import { DEFAULT_CONFIG, HIROSHIGE, PLACES, REGIONS, canHurry, getEvent, innCostFor, isChoiceAvailable, isTired, maxFaceFor, regionAt, shukuNumber, type Awaiting, type SessionAction } from '../engine'
import { pieceColors } from '../art/theme'
import { useEffect, useState } from 'react'
import { choiceChips, forkChips, type Chip } from './choiceText'
import { prefersReducedMotion, type CutItem } from './feedback'
import type { GameState, Player } from '../types/game'

const cfg = DEFAULT_CONFIG

/** 体力のゲージ。疲れる境目（tiredStamina）に印。色は、余裕・注意・疲れ */
export function StaminaGauge({ value, id, large }: { value: number; id: string; large?: boolean }) {
  const max = cfg.balance.limits.stamina.max
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const tired = cfg.balance.travel.tiredStamina
  const tone = value < tired ? 'low' : value < 50 ? 'mid' : 'high'
  return (
    <div className={`gauge ${large ? 'gauge-large' : ''}`} role="meter" aria-label="体力" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} data-testid={`stamina-gauge-${id}`} data-tone={tone}>
      <div className={`gauge-fill gauge-${tone}`} style={{ width: `${pct}%` }} />
      <div className="gauge-mark" style={{ left: `${(tired / max) * 100}%` }} title={`${tired}未満は疲れて、出目が${cfg.balance.travel.tiredMaxFace}まで`} />
      <span className="gauge-text">体力 {value}</span>
    </div>
  )
}

function Chips({ chips }: { chips: Chip[] }) {
  if (chips.length === 0) return <span className="chip chip-plain">変化なし</span>
  return (
    <>
      {chips.map((c) => (
        <span key={c.key} className={`chip chip-${c.tone}`} data-testid="chip">{c.text}</span>
      ))}
    </>
  )
}

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
            <StaminaGauge value={p.stats.stamina} id={p.id} />
            <div className="stats">
              <span>路銀 {p.stats.money}文</span>
              <span>思い出 {p.stats.memories}</span>
              <span>評判 {p.stats.reputation}</span>
              <span>宿代 -{innCostFor(p, cfg)}文</span>
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
        <StaminaGauge value={awPlayer.stats.stamina} id={`dock-${awPlayer.id}`} large />
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
              {cfg.balance.lodging[id].name}<small>-{innCostFor(awPlayer, cfg, id)}文・体力+{cfg.balance.lodging[id].stamina}</small>
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
        {ev.choices.map((c, i) => {
          const r = choiceChips(c)
          return (
            <button key={i} data-testid="choice" disabled={!isChoiceAvailable(awPlayer, c)} onClick={() => onAct({ type: 'event', choiceIndex: i })}>
              <span className="choice-label">{c.label}</span>
              <span className="choice-effects" data-testid="choice-effects">
                {r.chance !== null && <span className="chip chip-luck">運試し {r.chance}%</span>}
                <Chips chips={r.success} />
                {r.fail && (
                  <>
                    <span className="chip chip-sep">失敗なら</span>
                    <Chips chips={r.fail} />
                  </>
                )}
              </span>
            </button>
          )
        })}
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
        <button data-testid="route-main" onClick={() => onAct({ type: 'fork', route: 'main' })}><span className="choice-label">{f.main.label}</span><small>{f.main.desc}</small><span className="choice-effects"><Chips chips={forkChips(f.main)} /></span></button>
        <button data-testid="route-lane" onClick={() => onAct({ type: 'fork', route: 'lane' })}><span className="choice-label">{f.lane.label}</span><small>{f.lane.desc}</small><span className="choice-effects"><Chips chips={forkChips(f.lane)} /></span></button>
      </div>
    )
  }
  return null
}

/** 広重『東海道五拾三次』のその場所の図。絵があれば、サムネイル → 押すと大きく（出どころつき）。なければ、題名だけ */
export function PrintCard({ name, compact }: { name: string; compact?: boolean }) {
  const h = HIROSHIGE[name]
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])
  if (!h) return null
  const title = `東海道五拾三次之内 ${h.station} ${h.subtitle}`
  if (compact && !h.image) return null
  return (
    <div className={compact ? 'print print-compact' : 'print'} data-testid={compact ? 'print-compact' : 'print-card'}>
      {!compact && (
        <>
          <span className="place-h place-h-art">広重</span>
          <span className="print-title" data-testid="print-title">『{title}』</span>
          <span className="print-sub">保永堂版・第{h.plate}図</span>
        </>
      )}
      {h.image ? (
        <button className="print-thumb" data-testid="print-thumb" onClick={() => setOpen(true)} aria-label={`${title}を大きく見る`}>
          <img src={h.image} alt={title} loading="lazy" />
        </button>
      ) : (
        !compact && <span className="print-missing" data-testid="print-missing">（絵は準備中）</span>
      )}
      {open && h.image && (
        <div className="lightbox" role="dialog" aria-label={title} data-testid="print-lightbox" onClick={() => setOpen(false)}>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={h.image} alt={title} />
            <figcaption>
              『{title}』　歌川広重・保永堂版・第{h.plate}図
              <br />
              <span className="lightbox-credit">{h.credit}</span>
              {h.source && (
                <>
                  {' ／ '}
                  <a href={h.source} target="_blank" rel="noreferrer">所蔵館のページ</a>
                </>
              )}
            </figcaption>
          </figure>
          <button className="primary" onClick={() => setOpen(false)}>閉じる</button>
        </div>
      )}
    </div>
  )
}

/** いまいる場所の、時代背景と、今では（現代の豆知識） */
export function PlaceCard({ board, index }: { board: GameState['board']; index: number }) {
  const tile = board.tiles[index]
  if (!tile) return null
  const info = PLACES[tile.name]
  const region = REGIONS[regionAt(board, index)]
  const no = shukuNumber(board, index)
  return (
    <details className="place" key={tile.name} open data-testid="place-card">
      <summary>
        <strong data-testid="place-name">{tile.name}</strong>
        <span className="place-sub">
          {no !== null ? `江戸から${no}番目の宿場・` : ''}
          {region.name}（{region.province}）
        </span>
      </summary>
      {info?.era && (
        <p data-testid="place-era">
          <span className="place-h">時代背景</span>
          {info.era}
        </p>
      )}
      {info?.now && (
        <p data-testid="place-now">
          <span className="place-h place-h-now">今では</span>
          {info.now}
        </p>
      )}
      {!info && <p className="place-tagline">{region.tagline}</p>}
      <PrintCard name={tile.name} />
    </details>
  )
}

/** カットイン：帯が画面を横切り、イベントの名前が大きく出る */
export function CutIn({ item }: { item: CutItem }) {
  return (
    <div className={`cutin cutin-${item.tone}`} key={item.key} data-testid="cutin" role="status" aria-live="assertive">
      <div className="cutin-flash" aria-hidden />
      <div className="cutin-band">
        <div className="cutin-inner">
          <span className="cutin-tag" data-testid="cutin-tag">{item.tag}</span>
          <span className="cutin-title" data-testid="cutin-title">{item.title}</span>
          <span className="cutin-sub">{item.sub}</span>
        </div>
      </div>
    </div>
  )
}

/** サイコロがころがる時間と、出目が決まってから見せる時間（ミリ秒）。遅い端末でも、出目は必ず見せる */
export const DICE_ROLL_MS = 700
export const DICE_HOLD_MS = 1000

/** サイコロ：大きく、ころがってから、出目を見せる。何マス進むかも出す。毎回、作り直す（key を変える）こと */
export function DicePop({ face, hurry, name, steps, onDone }: { face: number; hurry: boolean; name: string; steps: number; onDone?: () => void }) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? face : 1 + Math.floor(Math.random() * 6)))
  const [rolling, setRolling] = useState(() => !prefersReducedMotion())
  useEffect(() => {
    if (!rolling) return
    // 目の入れ替わり（見た目）と、決まる時刻（実時間）は、別々に動かす
    const tick = setInterval(() => setShown(1 + Math.floor(Math.random() * cfg.balance.game.diceFaces)), 70)
    const settle = setTimeout(() => {
      clearInterval(tick)
      setShown(face)
      setRolling(false)
    }, DICE_ROLL_MS)
    return () => {
      clearInterval(tick)
      clearTimeout(settle)
    }
  }, [face, rolling])
  // 決まってから、しばらく見せて、おしまい
  useEffect(() => {
    if (rolling || !onDone) return
    const t = setTimeout(onDone, DICE_HOLD_MS)
    return () => clearTimeout(t)
  }, [rolling, onDone])
  return (
    <div className="dice-pop" data-testid="dice-pop" role="status" aria-live="polite">
      <div className={`dice-face ${rolling ? 'rolling' : 'settled'}`} data-testid="dice-face">{rolling ? shown : face}</div>
      <div className="dice-note">
        {name}
        {rolling ? '　……' : hurry ? `　早足 ${face}＋${cfg.balance.travel.hurryBonus}` : ''}
      </div>
      {!rolling && (
        <div className="dice-steps" data-testid="dice-steps">
          {steps > 0 ? `${steps}マス進む` : 'その場にとどまる'}
        </div>
      )}
    </div>
  )
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
