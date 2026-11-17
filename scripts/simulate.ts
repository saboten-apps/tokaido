// npm run simulate [対戦数] — CPU 同士の旅を回して、バランスを表示する
import { simulateGames } from '../src/engine'

const games = Number(process.argv[2] ?? 2000)
for (const n of [2, 4, 6]) {
  const r = simulateGames(games, 1, undefined, n)
  console.log(`--- ${n}人 × ${games}回 ---`)
  console.log(`終了日数 ${r.avgDays.toFixed(1)} / 到着率 ${(r.arrivedRate * 100).toFixed(1)}% / 到着日 ${r.avgArrivalDay.toFixed(1)}日目`)
  console.log(`平均得点 ${r.avgScore.toFixed(1)} / 名物 ${r.avgMeibutsu.toFixed(2)}個 / 働く割合 ${(r.workRate * 100).toFixed(1)}% / 野宿 ${r.campsPerPlayer.toFixed(2)}回 / 脇道 ${(r.laneRate * 100).toFixed(0)}%`)
  console.log(`身分ごとの勝率（全員が同じ強さなら ${(100 / n).toFixed(1)}%）`, Object.fromEntries(Object.entries(r.winRateByRole).map(([k, v]) => [k, `${(v * 100).toFixed(1)}%`])))
}
