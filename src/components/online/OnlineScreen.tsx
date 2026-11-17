// オンライン対戦の画面：入口（部屋をつくる／コードで入る）→ ロビー → 対戦 → 結果。
// 進行はすべてサーバーが決める。この画面は、自分の番の行動だけを送り、届いた状態を映す。

import { useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_CONFIG, REGIONS, ROLE_IDS, ROOM_MAX_PLAYERS, ROOM_MIN_PLAYERS, getAwaiting, regionAt } from '../../engine'
import { OnlineClient, clearLastRoom, getSavedName, loadLastRoom, newRoomCode, saveLastRoom, saveName, type ReplayBatch } from '../../online/client'
import { BoardStage, ViewToggle } from '../BoardStage'
import { useViewMode } from '../viewMode'
import { MiniMap } from '../MiniMap'
import { ResultScreen } from '../ResultScreen'
import { cutinsFromTransition, newLogLines, phaseDelay, positionAtStep, prefersReducedMotion, regionEntry, travelMs } from '../feedback'
import { ActionPanel, CutIn, DicePop, LogPanel, PlaceCard, PlayerCards } from '../parts'
import { useCutins } from '../useCutins'
import type { SessionAction } from '../../engine'
import type { RoomView } from '../../online/protocol'
import type { GameState } from '../../types/game'

const cfg = DEFAULT_CONFIG

function useClient(client: OnlineClient | null): { view: RoomView | null; status: string; error: string | null; fatal: boolean } {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!client) return
    return client.subscribe(() => setTick((n) => n + 1))
  }, [client])
  return { view: client?.view ?? null, status: client?.status ?? 'closed', error: client?.lastError ?? null, fatal: client?.fatal ?? false }
}

const STATUS_TEXT: Record<string, string> = { connecting: '接続中…', open: '接続中', reconnecting: 'つなぎ直しています…', closed: '切断されました' }

export function OnlineScreen({ onExit }: { onExit: () => void }) {
  const [name, setName] = useState(() => getSavedName() || 'あなた')
  const [capacity, setCapacity] = useState(4)
  const [joinCode, setJoinCode] = useState(() => (new URLSearchParams(window.location.search).get('room') ?? '').toUpperCase())
  const [client, setClient] = useState<OnlineClient | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const last = useMemo(() => loadLastRoom(), [])
  const { view, status, error, fatal } = useClient(client)

  useEffect(() => () => client?.close(), [client])

  const enter = (code: string, create?: { capacity: number }) => {
    const n = name.trim() || 'あなた'
    saveName(n)
    saveLastRoom(code, n)
    setMessage(null)
    setClient(new OnlineClient({ code, name: n, create }))
  }

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label)
    setMessage(null)
    try {
      await fn()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  const leave = () => {
    void (client ? client.leave().catch(() => undefined) : Promise.resolve()).finally(() => {
      client?.close()
      clearLastRoom()
      setClient(null)
    })
  }

  if (!client) {
    return (
      <div className="title" data-testid="online-entry">
        <h1>オンラインで旅する</h1>
        <p className="lead">友だちと同じ部屋で、東海道を旅します。部屋をつくって、コードか招待リンクを伝えてください。</p>
        <label>
          名前
          <input data-testid="online-name" value={name} maxLength={8} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          人数（遊ぶ人＋CPU）
          <select data-testid="online-capacity" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))}>
            {Array.from({ length: ROOM_MAX_PLAYERS - ROOM_MIN_PLAYERS + 1 }, (_, i) => i + ROOM_MIN_PLAYERS).map((n) => (
              <option key={n} value={n}>{n}人</option>
            ))}
          </select>
        </label>
        <button className="primary" data-testid="online-create" onClick={() => enter(newRoomCode(), { capacity })}>部屋をつくる</button>
        <label>
          部屋のコード（5文字）
          <input data-testid="online-code" value={joinCode} maxLength={5} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} />
        </label>
        <button data-testid="online-join" disabled={joinCode.length !== 5} onClick={() => enter(joinCode)}>コードで入る</button>
        {last && (
          <button data-testid="online-resume" onClick={() => enter(last.code)}>
            前回の部屋に戻る（{last.code}）
          </button>
        )}
        <button onClick={onExit}>もどる</button>
      </div>
    )
  }

  const statusBar = (
    <div className={`conn conn-${status}`} data-testid="conn-status" role="status">
      {STATUS_TEXT[status] ?? status}
      {error && <span className="conn-error"> ／ {error}</span>}
    </div>
  )

  if (fatal || status === 'closed') {
    return (
      <div className="title">
        {statusBar}
        <p>{error ?? 'つながりませんでした。'}</p>
        <button
          onClick={() => {
            clearLastRoom()
            client.close()
            setClient(null)
          }}
        >
          入口にもどる
        </button>
      </div>
    )
  }

  if (!view) {
    return (
      <div className="title">
        {statusBar}
        <p>部屋に入っています…</p>
      </div>
    )
  }

  const you = view.you
  const me = view.seats.find((s) => s.userId === you.userId)

  if (view.status === 'lobby') {
    const isHost = view.hostId === you.userId
    const link = `${window.location.origin}/?room=${view.code}`
    return (
      <div className="title" data-testid="lobby">
        {statusBar}
        <h1>部屋 <span data-testid="room-code">{view.code}</span></h1>
        <p className="lead">コードか、招待リンクを、いっしょに遊ぶ人へ伝えてください。</p>
        <input readOnly aria-label="招待リンク" value={link} onFocus={(e) => e.currentTarget.select()} data-testid="invite-link" />
        <button onClick={() => void navigator.clipboard?.writeText(link).catch(() => undefined)}>リンクをコピー</button>
        <ul className="seats" data-testid="seats">
          {view.seats.map((s) => (
            <li key={s.userId} data-testid={`seat-${s.name}`}>
              <strong>{s.name}</strong>
              {s.userId === view.hostId && <span className="cpu">ホスト</span>}
              {!s.connected && <span className="cpu">切断中</span>}
              <span className="role-chip">{cfg.balance.roles[s.role].name}</span>
              <span>{s.ready ? '準備完了' : '準備中'}</span>
            </li>
          ))}
          {Array.from({ length: Math.max(0, view.capacity - view.seats.length) }, (_, i) => (
            <li key={`cpu${i}`} className="seat-cpu">CPU（空いた席）</li>
          ))}
        </ul>
        <label>
          あなたの身分
          <select data-testid="online-role" value={me?.role ?? 'ippan'} disabled={busy !== null} onChange={(e) => void run('role', () => client.setRole(e.target.value))}>
            {ROLE_IDS.map((id) => (
              <option key={id} value={id}>{cfg.balance.roles[id].name}</option>
            ))}
          </select>
          <small className="role-desc">{cfg.balance.roles[me?.role ?? 'ippan'].desc}</small>
        </label>
        {isHost && (
          <label>
            人数（遊ぶ人＋CPU）
            <select data-testid="lobby-capacity" value={view.capacity} onChange={(e) => void run('cap', () => client.setCapacity(Number(e.target.value)))}>
              {Array.from({ length: ROOM_MAX_PLAYERS - Math.max(ROOM_MIN_PLAYERS, view.seats.length) + 1 }, (_, i) => i + Math.max(ROOM_MIN_PLAYERS, view.seats.length)).map((n) => (
                <option key={n} value={n}>{n}人</option>
              ))}
            </select>
          </label>
        )}
        <button className={me?.ready ? '' : 'primary'} data-testid="ready" disabled={busy !== null} onClick={() => void run('ready', () => client.setReady(!me?.ready))}>
          {me?.ready ? '準備を取り消す' : '準備完了'}
        </button>
        {isHost && (
          <button className="primary" data-testid="online-start" disabled={busy !== null || !view.seats.every((s) => s.ready)} onClick={() => void run('start', () => client.start())}>
            旅を始める
          </button>
        )}
        {message && <p className="conn-error" role="alert">{message}</p>}
        <button onClick={leave}>部屋を出る</button>
      </div>
    )
  }

  if (!view.game) return null
  const game: GameState = view.game

  if (view.status === 'finished' || game.phase === 'finished') {
    return <ResultScreen state={game} onRestart={leave} />
  }

  return (
    <OnlineGame
      client={client}
      game={game}
      view={view}
      statusBar={statusBar}
      onLeave={leave}
      selfPlayerId={you.playerId}
      autoSeat={Boolean(me?.auto)}
    />
  )
}

interface Roll {
  id: number
  playerId: string
  from: number
  /** 地図（2D）：通ったマス。場面（3D）：[出発, 到着] */
  path: number[]
  /** 通った場所の名前（出発から到着まで） */
  via: string[]
  steps: number
  face: number
  hurry: boolean
}

interface GameProps {
  client: OnlineClient
  game: GameState
  view: RoomView
  statusBar: React.ReactNode
  onLeave: () => void
  selfPlayerId: string | null
  autoSeat: boolean
}

function OnlineGame({ client, game, view, statusBar, onLeave, selfPlayerId, autoSeat }: GameProps) {
  const aw = getAwaiting(game)
  const active = game.players[game.turnCtl.activeIndex]
  const mine = aw !== null && aw.playerId === selfPlayerId
  // 駒の動き：サーバーから届いた進行の記録（steps）の、サイコロの動きを、順番に1マスずつ再生する
  const [queue, setQueue] = useState<Roll[]>([])
  const [step, setStep] = useState(-1)
  // 演出は、?fast=1 か「動きを減らす」設定のときは省く
  const [animateOn] = useState(() => !prefersReducedMotion() && !new URLSearchParams(window.location.search).has('fast'))
  const cuts = useCutins(queue.length > 0, animateOn)
  const [toasts, setToasts] = useState<Array<{ id: number; text: string }>>([])
  const [jump, setJump] = useState<{ index: number; n: number } | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [mode, toggleMode] = useViewMode()
  const [now, setNow] = useState(() => Date.now())
  const prev = useRef<GameState>(game)
  const modeRef = useRef<'2d' | '3d'>('2d')
  const rollSeq = useRef(0)
  const gameRef = useRef(game)
  useEffect(() => {
    gameRef.current = game
    modeRef.current = mode
  })
  const seq = useRef(0)

  // 届いた状態の差から、通知を出す
  useEffect(() => {
    const before = prev.current
    const lines = newLogLines(before, game)
    prev.current = game
    cuts.push(cutinsFromTransition(before, game))
    for (const text of lines) {
      const id = ++seq.current
      setToasts((t) => [...t.slice(-2), { id, text }])
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game])

  const animate = useRef(!prefersReducedMotion() && !new URLSearchParams(window.location.search).has('fast'))
  useEffect(() => {
    return client.onBatch((batch: ReplayBatch) => {
      if (!animate.current) return
      const rolls: Roll[] = batch.steps
        .flatMap((st) => st.events)
        .flatMap((e): Roll[] => {
          if (e.type !== 'rolled' || e.path.length === 0) return []
          const tiles = gameRef.current.board.tiles
          const via = [tiles[e.from].name, ...e.path.map((i) => tiles[i].name)]
          return [{ id: ++rollSeq.current, playerId: e.playerId, from: e.from, path: modeRef.current === '3d' ? [e.from, e.to] : e.path, via, steps: e.path.length, face: e.face, hurry: e.hurry }]
        })
      if (rolls.length) setQueue((q) => [...q, ...rolls])
      // 県の境を越えたら、通知（マスの県は変わらないので、いまの盤面で調べられる）
      for (const r of rolls) {
        const g = gameRef.current
        const text = regionEntry(g.board, g.players.find((p) => p.id === r.playerId)?.name ?? '', r.from, r.path[r.path.length - 1])
        if (text) {
          const id = ++seq.current
          setToasts((t) => [...t.slice(-2), { id, text }])
          setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
        }
      }
    })
  }, [client])

  useEffect(() => {
    if (queue.length === 0) return
    const cur = queue[0]
    const timer = setTimeout(
      () => {
        if (step >= cur.path.length - 1) {
          setQueue((q) => q.slice(1))
          setStep(-1)
        } else setStep((n) => n + 1)
      },
      phaseDelay(mode, step, cur.via.length),
    )
    return () => clearTimeout(timer)
  }, [queue, step, mode])

  // 持ち時間の表示
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [])
  const left = view.deadline ? Math.max(0, Math.ceil((view.deadline - now) / 1000)) : null

  const act = (action: SessionAction) => {
    setMessage(null)
    client.sendAction(action).catch((e: Error) => setMessage(e.message))
  }

  const positions: Record<string, number> = {}
  for (const p of game.players) positions[p.id] = game.board.playerStates[p.id].position
  // 再生中の駒は、動きの途中の場所に。順番待ちの駒は、動き出す前の場所に
  const seen = new Set<string>()
  queue.forEach((r, i) => {
    if (seen.has(r.playerId)) return
    seen.add(r.playerId)
    positions[r.playerId] = i === 0 ? positionAtStep(r.from, r.path, step) : r.from
  })
  const busy = queue.length > 0 || cuts.busy
  const head = queue[0]
  // サイコロは、地図では動きの間ずっと、場面では「サイコロ」の段階だけ
  const dice = head && (mode === '2d' || step < 0) ? { id: head.id, face: head.face, hurry: head.hurry, steps: head.steps, name: game.players.find((p) => p.id === head.playerId)?.name ?? '' } : null
  const travel = head && mode === '3d' && step === 0 ? { id: String(head.id), playerId: head.playerId, via: head.via, ms: travelMs(head.via.length) } : null
  const focusId = (queue[0]?.playerId ?? (mine ? selfPlayerId : (aw?.playerId ?? active.id))) ?? active.id
  const waitingName = aw ? game.players.find((p) => p.id === aw.playerId)?.name : active.name

  return (
    <div className="game" data-testid="online-game">
      {statusBar}
      <header className="topbar">
        <span className="day" data-testid="day">{game.day}日目</span>
        <span className="sub">／ {cfg.balance.game.maxDays}日まで</span>
        <ViewToggle mode={mode} onToggle={toggleMode} />
        <span className="region-badge" data-testid="region-badge">{REGIONS[regionAt(game.board, positions[focusId])].name}</span>
        <span className="turn">{mine ? 'あなたの番' : `${waitingName}の番`}{left !== null && aw ? `（あと${left}秒）` : ''}</span>
      </header>
      {autoSeat && (
        <div className="auto-note" role="status" data-testid="auto-note">
          持ち時間を切らしたので、CPU が代わりに進めています。
          <button data-testid="back" onClick={() => void client.back().catch((e: Error) => setMessage(e.message))}>自分で続ける</button>
        </div>
      )}
      <MiniMap board={game.board} players={game.players} positions={positions} focusId={focusId} onJump={(index) => setJump({ index, n: (jump?.n ?? 0) + 1 })} />
      <BoardStage mode={mode} board={game.board} players={game.players} activeId={active.id} focusId={focusId} positions={positions} jump={jump} travel={travel} />
      <PlaceCard board={game.board} index={positions[focusId] ?? 0} />
      <PlayerCards state={game} activeId={active.id} selfId={selfPlayerId} />
      {mine && !busy ? <ActionPanel state={game} aw={aw} onAct={act} /> : mine ? null : <p className="waiting" data-testid="waiting">{waitingName}の行動を待っています…</p>}
      {message && <p className="conn-error" role="alert">{message}</p>}
      {cuts.cut && <CutIn item={cuts.cut} />}
      {dice && <DicePop key={dice.id} face={dice.face} hurry={dice.hurry} name={dice.name} steps={dice.steps} />}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">{t.text}</div>
        ))}
      </div>
      <LogPanel state={game} />
      <button onClick={onLeave}>部屋を出る（あとで戻れます）</button>
    </div>
  )
}
