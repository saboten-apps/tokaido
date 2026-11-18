import { useState } from 'react'
import { DEFAULT_CONFIG, PLACES, earnedTitles, rankPlayers } from '../engine'
import { PrintCard, StampBook } from './parts'
import type { GameState } from '../types/game'

export function ResultScreen({ state, onRestart }: { state: GameState; onRestart: () => void }) {
  const ranking = rankPlayers(state, DEFAULT_CONFIG)
  const humans = state.players.filter((p) => p.isHuman)
  const [pick, setPick] = useState(humans[0]?.id ?? null)
  const me = humans.find((p) => p.id === pick) ?? humans[0]

  return (
    <div className="result" data-testid="result">
      <header className="result-header">
        <h1>旅の終わり</h1>
        <p className="winner" data-testid="winner">
          優勝は <strong>{state.players.find((p) => p.id === ranking[0].playerId)?.name}</strong>（{ranking[0].total}点）。
          {humans.length === 1 && ` あなたは${ranking.findIndex((r) => r.playerId === humans[0].id) + 1}位。`}
        </p>
        <p className="sub">{state.day}日目に旅が終わりました。</p>
      </header>

      <div className="result-columns">
        {/* 左カラム：勘定帳・順位表・称号・スタンプ */}
        <div className="result-col-left">
          <table>
            <thead>
              <tr>
                <th className="col-rank">順位</th>
                <th className="col-traveler">旅人</th>
                <th className="col-num">路銀</th>
                <th className="col-num">思い出</th>
                <th className="col-num">評判</th>
                <th className="col-num">名物</th>
                <th className="col-num">スタンプ</th>
                <th className="col-num">到着</th>
                <th className="col-total">合計</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r, i) => {
                const p = state.players.find((x) => x.id === r.playerId)!
                return (
                  <tr key={r.playerId} className={p.isHuman ? 'me' : ''}>
                    <td className="col-rank">{i + 1}</td>
                    <td className="col-traveler">
                      <span className="traveler-name">{p.name}</span>
                      <small className="role-sub">{DEFAULT_CONFIG.balance.roles[p.role].name}</small>
                    </td>
                    <td className="col-num">{r.money}</td>
                    <td className="col-num">{r.memories}</td>
                    <td className="col-num">{r.reputation}</td>
                    <td className="col-num">{r.meibutsu}</td>
                    <td className="col-num">{r.stamps}</td>
                    <td className="col-num">{r.arrival}</td>
                    <td className="col-total total" data-testid={`total-${r.playerId}`}>{r.total}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <section className="titles" data-testid="titles">
            <h2>称号</h2>
            {state.players.map((p) => {
              const ts = earnedTitles(p, DEFAULT_CONFIG)
              return (
                <div key={p.id}>
                  {p.name}：
                  {ts.length ? ts.map((t) => <span key={t.id} className="title-chip" title={t.desc}>{t.name}</span>) : '（なし）'}
                </div>
              )
            })}
          </section>

          {me && <StampBook player={me} open />}
        </div>

        {/* 右カラム：旅日記・旅の手帖（訪ねた場所） */}
        <div className="result-col-right">
          {me && (
            <section className="diary" data-testid="diary">
              <h2>{me.name}の東海道</h2>
              {humans.length > 1 && (
                <div className="diary-tabs">
                  {humans.map((h) => (
                    <button key={h.id} data-testid={`diary-tab-${h.id}`} className={h.id === me.id ? 'on' : ''} onClick={() => setPick(h.id)}>{h.name}</button>
                  ))}
                </div>
              )}
              <ol>
                {state.diary.filter((d) => d.playerId === me.id).map((d, i) => (
                  <li key={i}><span className="lday">{d.day}日目</span> <span className="dplace">{d.place}</span>{d.text}</li>
                ))}
              </ol>
            </section>
          )}

          {me && (
            <section className="diary notebook" data-testid="notebook">
              <h2>旅の手帖（訪ねた場所）</h2>
              {[...new Set(state.diary.filter((d) => d.playerId === me.id).map((d) => d.place))]
                .filter((name) => PLACES[name])
                .map((name) => (
                  <details key={name}>
                    <summary>{name}</summary>
                    {PLACES[name].era && <p><span className="place-h">時代背景</span>{PLACES[name].era}</p>}
                    {PLACES[name].now && <p><span className="place-h place-h-now">今では</span>{PLACES[name].now}</p>}
                    <PrintCard name={name} />
                  </details>
                ))}
            </section>
          )}
        </div>
      </div>

      <button className="primary" data-testid="restart" onClick={onRestart}>もう一度旅に出る</button>
    </div>
  )
}
