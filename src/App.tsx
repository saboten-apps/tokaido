import { useCallback, useState } from 'react'
import { DEFAULT_CONFIG, MAX_PLAYERS, MIN_PLAYERS, createGame, runUntilHuman } from './engine'
import { deleteSavedGame, loadGame, saveGame } from './storage/saveGame'
import { GameScreen } from './components/GameScreen'
import { ResultScreen } from './components/ResultScreen'
import type { GameState } from './types/game'

const params = new URLSearchParams(window.location.search)
const seedParam = params.get('seed')
/** ?fast=1 で CPU の番を待たずに進める（e2e 用） */
const CPU_DELAY_MS = params.get('fast') ? 0 : 450

export default function App() {
  const [state, setState] = useState<GameState | null>(null)
  const [saved, setSaved] = useState(() => loadGame())
  const [name, setName] = useState('あなた')
  const [count, setCount] = useState(DEFAULT_CONFIG.balance.game.playerCount)

  const update = useCallback((s: GameState) => {
    setState(s)
    if (s.phase === 'finished') deleteSavedGame()
    else saveGame(s)
  }, [])

  const start = () => {
    const g = createGame({ playerName: name.trim() || 'あなた', playerCount: count, seed: seedParam ? Number(seedParam) : undefined })
    update(runUntilHuman(g).state)
  }

  if (state?.phase === 'finished') {
    return <ResultScreen state={state} onRestart={() => { setState(null); setSaved(null) }} />
  }
  if (state) return <GameScreen state={state} onChange={update} cpuDelayMs={CPU_DELAY_MS} />

  return (
    <div className="title">
      <h1>東海道すごろく</h1>
      <p className="lead">江戸・日本橋から京都・三条大橋へ。路銀をやりくりし、名物を味わい、思い出を集める旅。</p>
      <label>
        名前
        <input data-testid="name" value={name} maxLength={8} onChange={(e) => setName(e.target.value)} />
      </label>
      <label>
        人数（あなた＋CPU）
        <select data-testid="count" value={count} onChange={(e) => setCount(Number(e.target.value))}>
          {Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => i + MIN_PLAYERS).map((n) => (
            <option key={n} value={n}>{n}人</option>
          ))}
        </select>
      </label>
      <button className="primary" data-testid="start" onClick={start}>旅に出る</button>
      {saved && (
        <button data-testid="continue" onClick={() => setState(saved)}>
          続きから（{saved.day}日目）
        </button>
      )}
    </div>
  )
}
