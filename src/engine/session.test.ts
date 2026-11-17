import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from './config'
import { goalIndex } from './board'
import { rankPlayers } from './scoring'
import { SessionError, autoAct, getAwaiting, runUntilHuman, submitAction } from './session'
import { createGame } from './setup'
import { simulateGames } from './simulate'
import type { GameState } from '../types/game'

const cfg = DEFAULT_CONFIG

function soloHuman(seed = 1, playerCount = 2): GameState {
  return runUntilHuman(createGame({ seed, playerCount }, cfg), cfg).state
}

function playOut(state: GameState): GameState {
  let s = state
  for (let i = 0; i < 5000 && s.phase === 'playing'; i++) s = runUntilHuman(autoAct(s, cfg).state, cfg).state
  return s
}

describe('セッション（手番の進行）', () => {
  it('最初は人間の「振る／働く」待ち', () => {
    const s = soloHuman()
    expect(getAwaiting(s)).toEqual({ kind: 'roll', playerId: 'p0' })
  })

  it('受け取った状態を変更しない', () => {
    const s = soloHuman()
    const before = structuredClone(s)
    submitAction(s, 'p0', { type: 'roll' }, cfg)
    runUntilHuman(s, cfg)
    expect(s).toEqual(before)
  })

  it('同じ状態と同じ行動なら、同じ結果（シード付き乱数）', () => {
    const s = soloHuman(7)
    const a = runUntilHuman(submitAction(s, 'p0', { type: 'roll' }, cfg).state, cfg).state
    const b = runUntilHuman(submitAction(s, 'p0', { type: 'roll' }, cfg).state, cfg).state
    expect(a).toEqual(b)
  })

  it('ほかの人の番には行動できない', () => {
    const s = soloHuman()
    expect(() => submitAction(s, 'p1', { type: 'roll' }, cfg)).toThrow(SessionError)
    expect(() => submitAction(s, 'p0', { type: 'fork', route: 'lane' }, cfg)).toThrow(SessionError)
  })

  it('働くと、進まずに路銀が増える', () => {
    const s = soloHuman()
    const out = submitAction(s, 'p0', { type: 'work' }, cfg).state
    expect(out.board.playerStates.p0.position).toBe(0)
    expect(out.players[0].stats.money).toBe(s.players[0].stats.money + cfg.balance.travel.workMoney)
  })

  it('路銀が尽きても脱落せず、働けば回復できる', () => {
    const s = soloHuman()
    s.players[0].stats.money = 0
    expect(getAwaiting(s)?.kind).toBe('roll')
    const out = submitAction(s, 'p0', { type: 'work' }, cfg).state
    expect(out.players[0].stats.money).toBeGreaterThan(0)
  })

  it('大井川（岐路）では必ず止まり、道を選ぶ', () => {
    const s = soloHuman()
    const fork = s.board.forks[0]
    s.board.playerStates.p0.position = fork.tileIndex - 1
    const out = submitAction(s, 'p0', { type: 'roll' }, cfg, undefined, 6).state
    expect(out.board.playerStates.p0.position).toBe(fork.tileIndex)
    expect(getAwaiting(out)).toMatchObject({ kind: 'fork', playerId: 'p0' })
    const after = submitAction(out, 'p0', { type: 'fork', route: 'lane' }, cfg).state
    expect(after.board.playerStates.p0.route).toBe('lane')
  })

  it('京都に着くと到着順が付き、全員が着くと終わる', () => {
    const s = soloHuman()
    s.board.playerStates.p0.position = goalIndex(s.board) - 1
    const out = submitAction(s, 'p0', { type: 'roll' }, cfg, undefined, 3).state
    expect(out.players[0].arrivalRank).toBe(1)
    const end = playOut(out)
    expect(end.phase).toBe('finished')
    expect(end.players.every((p) => p.arrivalRank !== null)).toBe(true)
  })

  it('日数の上限で終わる', () => {
    const s = soloHuman()
    s.day = cfg.balance.game.maxDays
    let cur = s
    for (let i = 0; i < 5 && cur.phase === 'playing'; i++) cur = runUntilHuman(submitAction(cur, 'p0', { type: 'work' }, cfg).state, cfg).state
    expect(cur.phase).toBe('finished')
  })

  it('最後まで遊ぶと、得点が出る', () => {
    const end = playOut(soloHuman(5, 4))
    const ranking = rankPlayers(end, cfg)
    expect(ranking).toHaveLength(4)
    expect(ranking[0].total).toBeGreaterThanOrEqual(ranking[3].total)
  })
})

describe('シミュレーション', () => {
  it('CPU だけで、すべての旅が終わる', () => {
    const r = simulateGames(100, 1, cfg, 4)
    expect(r.arrivedRate).toBeGreaterThan(0.9)
    expect(r.avgDays).toBeLessThanOrEqual(cfg.balance.game.maxDays + 1)
  })
})
