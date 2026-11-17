import { useCallback, useState } from 'react'
import { DEFAULT_CONFIG, createGame, runUntilHuman } from './engine'
import { deleteSavedGame, loadGame, saveGame } from './storage/saveGame'
import { GameScreen } from './components/GameScreen'
import { HowToPlay } from './components/HowToPlay'
import { OnlineScreen } from './components/online/OnlineScreen'
import { ResultScreen } from './components/ResultScreen'
import { TitleScreen } from './components/TitleScreen'
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
    window.scrollTo(0, 0)
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
    <TitleScreen
      humans={humans}
      setHumans={setHumans}
      names={names}
      setNames={setNames}
      roles={roles}
      setRoles={setRoles}
      count={count}
      setCount={setCount}
      saved={saved}
      onStart={start}
      onContinue={() => setState(saved)}
      onOnline={() => setOnline(true)}
      onHowTo={() => setHowto(true)}
      howtoDialog={howtoDialog}
    />
  )
}
