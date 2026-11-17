import { useCallback, useState } from 'react'
import { DEFAULT_CONFIG, MAX_PLAYERS, MIN_PLAYERS, ROLE_IDS, createGame, runUntilHuman } from './engine'
import { deleteSavedGame, loadGame, saveGame } from './storage/saveGame'
import { GameScreen } from './components/GameScreen'
import { HowToPlay } from './components/HowToPlay'
import { OnlineScreen } from './components/online/OnlineScreen'
import { ResultScreen } from './components/ResultScreen'
import type { GameState, RoleId } from './types/game'

const params = new URLSearchParams(window.location.search)
const seedParam = params.get('seed')
/** ?fast=1 で CPU の番を待たずに進める（e2e 用） */
const CPU_DELAY_MS = params.get('fast') ? 0 : 450

export default function App() {
  const [state, setState] = useState<GameState | null>(null)
  const [howto, setHowto] = useState(false)
  const [online, setOnline] = useState(() => new URLSearchParams(window.location.search).has('room'))
  const [saved, setSaved] = useState(() => loadGame())
  const [names, setNames] = useState<string[]>(['あなた', '旅人2', '旅人3', '旅人4'])
  const [humans, setHumans] = useState(1)
  const [roles, setRoles] = useState<RoleId[]>(['ippan', 'ippan', 'ippan', 'ippan'])
  const [count, setCount] = useState(DEFAULT_CONFIG.balance.game.playerCount)

  const update = useCallback((s: GameState) => {
    setState(s)
    if (s.phase === 'finished') deleteSavedGame()
    else saveGame(s)
  }, [])

  const start = () => {
    const humanNames = names.slice(0, humans).map((n, i) => n.trim() || (i === 0 ? 'あなた' : `旅人${i + 1}`))
    const g = createGame({ humanNames, humanRoles: roles.slice(0, humans), playerCount: Math.max(count, humans), seed: seedParam ? Number(seedParam) : undefined })
    update(runUntilHuman(g).state)
  }

  const howtoDialog = howto ? <HowToPlay onClose={() => setHowto(false)} /> : null
  if (online) return <OnlineScreen onExit={() => setOnline(false)} />
  if (state?.phase === 'finished') {
    return <ResultScreen state={state} onRestart={() => { setState(null); setSaved(null) }} />
  }
  if (state) {
    return (
      <>
        <GameScreen state={state} onChange={update} cpuDelayMs={CPU_DELAY_MS} onHowTo={() => setHowto(true)} />
        {howtoDialog}
      </>
    )
  }

  return (
    <div className="title">
      {howtoDialog}
      <h1>東海道すごろく</h1>
      <p className="lead">江戸・日本橋から京都・三条大橋へ。路銀をやりくりし、名物を味わい、思い出を集める旅。</p>
      <label>
        遊ぶ人の数（同じ端末で、順番に遊ぶ）
        <select
          data-testid="humans"
          value={humans}
          onChange={(e) => {
            const h = Number(e.target.value)
            setHumans(h)
            if (count < h) setCount(h)
          }}
        >
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>{n}人</option>
          ))}
        </select>
      </label>
      {names.slice(0, humans).map((n, i) => (
        <label key={i}>
          {humans > 1 ? `${i + 1}人目の名前` : '名前'}
          <input data-testid={`name-${i}`} value={n} maxLength={8} onChange={(e) => setNames((cur) => cur.map((x, j) => (j === i ? e.target.value : x)))} />
          <select data-testid={`role-${i}`} aria-label={`${n}の身分`} value={roles[i]} onChange={(e) => setRoles((cur) => cur.map((x, j) => (j === i ? (e.target.value as RoleId) : x)))}>
            {ROLE_IDS.map((id) => (
              <option key={id} value={id}>{DEFAULT_CONFIG.balance.roles[id].name}</option>
            ))}
          </select>
          <small className="role-desc" data-testid={`role-desc-${i}`}>{DEFAULT_CONFIG.balance.roles[roles[i]].desc}</small>
        </label>
      ))}
      <label>
        人数（遊ぶ人＋CPU）
        <select data-testid="count" value={Math.max(count, humans)} onChange={(e) => setCount(Number(e.target.value))}>
          {Array.from({ length: MAX_PLAYERS - Math.max(MIN_PLAYERS, humans) + 1 }, (_, i) => i + Math.max(MIN_PLAYERS, humans)).map((n) => (
            <option key={n} value={n}>{n}人</option>
          ))}
        </select>
      </label>
      <button className="primary" data-testid="start" onClick={start}>旅に出る</button>
      <button data-testid="go-online" onClick={() => setOnline(true)}>オンラインで遊ぶ</button>
      <button data-testid="open-howto" className="linkish" onClick={() => setHowto(true)}>遊び方</button>
      {saved && (
        <button data-testid="continue" onClick={() => setState(saved)}>
          続きから（{saved.day}日目）
        </button>
      )}
    </div>
  )
}
