import { DEFAULT_CONFIG, rankPlayers } from '../engine'
import type { GameState } from '../types/game'

export function ResultScreen({ state, onRestart }: { state: GameState; onRestart: () => void }) {
  const ranking = rankPlayers(state, DEFAULT_CONFIG)
  return (
    <div className="result" data-testid="result">
      <h1>旅の終わり</h1>
      <p>{state.day}日目。道中の得点はこのとおり。</p>
      <table>
        <thead>
          <tr>
            <th>順位</th><th>旅人</th><th>路銀</th><th>思い出</th><th>評判</th><th>名物</th><th>到着</th><th>合計</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((r, i) => {
            const p = state.players.find((x) => x.id === r.playerId)!
            return (
              <tr key={r.playerId} className={p.isHuman ? 'me' : ''}>
                <td>{i + 1}</td><td>{p.name}</td><td>{r.money}</td><td>{r.memories}</td><td>{r.reputation}</td><td>{r.meibutsu}</td><td>{r.arrival}</td>
                <td className="total" data-testid={`total-${r.playerId}`}>{r.total}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <button className="primary" data-testid="restart" onClick={onRestart}>もう一度旅に出る</button>
    </div>
  )
}
