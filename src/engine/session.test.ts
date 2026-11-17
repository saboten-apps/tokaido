import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from './config'
import { goalIndex, innCostFor, isTired, maxFaceFor, recordCamp } from './board'
import { isChoiceAvailable } from './events'
import { earnedTitles } from './titles'
import { rankPlayers } from './scoring'
import { SessionError, autoAct, getAwaiting, runUntilHuman, submitAction } from './session'
import { createGame } from './setup'
import { simulateGames } from './simulate'
import type { GameState, RoleId } from '../types/game'

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

describe('評判の効果', () => {
  it('宿代：評判が高いと割引、低いと割増', () => {
    const s = soloHuman()
    const p = s.players[0]
    const base = cfg.balance.travel.innCost
    p.stats.reputation = 30
    expect(innCostFor(p, cfg)).toBe(base)
    p.stats.reputation = cfg.balance.reputation.goodAt
    expect(innCostFor(p, cfg)).toBeLessThan(base)
    p.stats.reputation = cfg.balance.reputation.badBelow - 1
    expect(innCostFor(p, cfg)).toBeGreaterThan(base)
  })

  it('日の終わりに、評判の高い人は割引の宿代を払う', () => {
    const s = soloHuman()
    s.players[0].stats.reputation = 50
    s.players[0].stats.money = 1000
    const out = runUntilHuman(submitAction(s, 'p0', { type: 'work' }, cfg).state, cfg).state
    // 日本橋（出発地）で泊まる：働いた分を足して、割引の宿代を引く
    expect(out.players[0].stats.money).toBe(1000 + cfg.balance.travel.workMoney - innCostFor(out.players[0], cfg))
  })

  it('関所の特別な選択肢は、評判が高い人だけ選べる', () => {
    const e = cfg.events.find((x) => x.id === 'hakone_sekisho')!
    const special = e.choices.find((c) => c.requires?.minReputation)!
    const p = soloHuman().players[0]
    p.stats.reputation = 30
    expect(isChoiceAvailable(p, special)).toBe(false)
    p.stats.reputation = 70
    expect(isChoiceAvailable(p, special)).toBe(true)
  })
})

describe('早足と野宿', () => {
  it('早足は、出目に2を足して進み、体力を余分に使う', () => {
    const s = soloHuman()
    const normal = submitAction(s, 'p0', { type: 'roll' }, cfg, undefined, 3).state
    const fast = submitAction(s, 'p0', { type: 'hurry' }, cfg, undefined, 3).state
    const t = cfg.balance.travel
    expect(fast.board.playerStates.p0.position).toBe(normal.board.playerStates.p0.position + t.hurryBonus)
    const stNormal = normal.players[0].stats.stamina
    const stFast = fast.players[0].stats.stamina
    // 2マス余分に進んだぶんの体力＋早足の体力
    expect(stNormal - stFast).toBe(t.hurryBonus * t.staminaPerStep + t.hurryStamina)
  })

  it('体力が足りないと、早足にはできない', () => {
    const s = soloHuman()
    s.players[0].stats.stamina = cfg.balance.travel.hurryMinStamina - 1
    expect(() => submitAction(s, 'p0', { type: 'hurry' }, cfg)).toThrow(SessionError)
  })

  it('野宿が2日続くと疲れ（出目が小さくなる）、宿に泊まれば戻る', () => {
    const p = soloHuman().players[0]
    expect(isTired(p, cfg)).toBe(false)
    recordCamp(p, true)
    expect(isTired(p, cfg)).toBe(false)
    recordCamp(p, true)
    expect(p.flags).toContain('camped2')
    expect(isTired(p, cfg)).toBe(true)
    expect(maxFaceFor(p, cfg)).toBe(cfg.balance.travel.tiredMaxFace)
    recordCamp(p, false)
    expect(isTired(p, cfg)).toBe(false)
  })
})

describe('宿の格・本陣・旅日記・称号', () => {
  it('木賃宿は旅籠より安い', () => {
    const p = soloHuman().players[0]
    p.stats.reputation = 30
    expect(innCostFor(p, cfg, 'kichin')).toBeLessThan(innCostFor(p, cfg, 'hatago'))
  })

  it('泊まり方を決めても番は進まない', () => {
    const s = soloHuman()
    const out = submitAction(s, 'p0', { type: 'lodging', value: 'kichin' }, cfg).state
    expect(out.players[0].lodging).toBe('kichin')
    expect(getAwaiting(out)).toEqual({ kind: 'roll', playerId: 'p0' })
    expect(out.turnCtl.activeIndex).toBe(s.turnCtl.activeIndex)
    expect(() => submitAction(s, 'p0', { type: 'lodging', value: 'honjin' as never }, cfg)).toThrow(SessionError)
  })

  it('評判が高いと本陣に招かれ、宿代なしで体力と思い出が増える', () => {
    const s = soloHuman()
    const p = s.players[0]
    p.stats.reputation = cfg.balance.lodging.honjin.reputationAt
    p.stats.money = 500
    p.stats.stamina = 40
    const out = runUntilHuman(submitAction(s, 'p0', { type: 'work' }, cfg).state, cfg).state
    const me = out.players[0]
    expect(me.stats.money).toBe(500 + cfg.balance.travel.workMoney)
    expect(me.stats.memories).toBe(cfg.balance.lodging.honjin.memories)
    expect(out.diary.some((d) => d.kind === 'inn')).toBe(true)
  })

  it('旅日記に、名物・関所・到着が残る', () => {
    const end = playOut(soloHuman(9, 3))
    const kinds = new Set(end.diary.map((d) => d.kind))
    expect(kinds.has('arrive')).toBe(true)
    expect(kinds.has('meibutsu')).toBe(true)
    expect(end.diary.every((d) => d.place && d.text)).toBe(true)
  })

  it('称号は、京都に着いた人だけが、条件を満たすと得る', () => {
    const end = playOut(soloHuman(9, 3))
    const first = end.players.find((p) => p.arrivalRank === 1)!
    expect(earnedTitles(first, cfg).map((t) => t.id)).toContain('ichibannori')
    expect(earnedTitles({ ...first, arrivalRank: null }, cfg)).toEqual([])
    const noble = { ...first, stats: { ...first.stats, memories: 120 } }
    expect(earnedTitles(noble, cfg).map((t) => t.id)).toContain('omoide_bukuro')
  })
})

describe('旅人の身分', () => {
  const make = (role: RoleId) => runUntilHuman(createGame({ seed: 3, humanNames: ['あなた'], humanRoles: [role], playerCount: 2 }, cfg), cfg).state

  it('開始時の能力値に、身分の持ち味が反映される', () => {
    const base = cfg.balance.start
    const ippan = make('ippan').players[0].stats
    expect(ippan.money).toBe(base.money + cfg.balance.roles.ippan.start.money!)
    const shonin = make('shonin').players[0].stats
    expect(shonin.money).toBe(base.money + cfg.balance.roles.shonin.start.money!)
    expect(shonin.stamina).toBe(base.stamina + cfg.balance.roles.shonin.start.stamina!)
    expect(make('hikyaku').players[0].stats.stamina).toBe(base.stamina + cfg.balance.roles.hikyaku.start.stamina!)
  })

  it('CPU の身分は、重ならずに配られ、流儀は身分から決まる', () => {
    const g = createGame({ seed: 5, includeHuman: false, playerCount: 6 }, cfg)
    expect(new Set(g.players.map((p) => p.role)).size).toBe(6)
    for (const p of g.players) expect(p.personality).toBe(cfg.balance.roles[p.role].personality)
  })

  it('商人は「働く」で多く稼ぎ、旅芸人は思い出も増える', () => {
    const t = cfg.balance.travel
    const shonin = submitAction(make('shonin'), 'p0', { type: 'work' }, cfg).state.players[0]
    expect(shonin.stats.money).toBe(make('shonin').players[0].stats.money + t.workMoney + cfg.balance.roles.shonin.workMoneyBonus)
    const geinin = submitAction(make('geinin'), 'p0', { type: 'work' }, cfg).state.players[0]
    expect(geinin.stats.memories).toBe(cfg.balance.roles.geinin.workMemories)
  })

  it('飛脚は、早足の体力の消費が小さい', () => {
    const fast = (role: RoleId) => {
      const s = make(role)
      const before = s.players[0].stats.stamina
      const out = submitAction(s, 'p0', { type: 'hurry' }, cfg, undefined, 3).state.players[0]
      return before - out.stats.stamina
    }
    expect(fast('hikyaku')).toBeLessThan(fast('ippan'))
  })

  it('武士は宿代が高く、関所で手形を示す選択肢がある', () => {
    const bushi = make('bushi').players[0]
    const ippan = make('ippan').players[0]
    ippan.stats.reputation = bushi.stats.reputation
    expect(innCostFor(bushi, cfg)).toBeGreaterThan(innCostFor(ippan, cfg))
    const e = cfg.events.find((x) => x.id === 'hakone_sekisho')!
    const choice = e.choices.find((c) => c.requires?.hasFlags?.includes('role:bushi'))!
    expect(isChoiceAvailable(bushi, choice)).toBe(true)
    expect(isChoiceAvailable(ippan, choice)).toBe(false)
  })
})

describe('宿場をめざす・スタンプ', () => {
  it('めざすと、通り過ぎずに宿場で止まり、スタンプが押される。宿場のスタンプは重ならない', () => {
    // 品川（日本橋から2マス先）の手前で、大きな目が出る種を探す
    for (let seed = 1; seed < 200; seed++) {
      const s0 = soloHuman(seed)
      const r = submitAction(s0, 'p0', { type: 'stroll' }, cfg)
      const ev = r.events.find((e) => e.type === 'rolled')
      if (!ev || ev.type !== 'rolled' || ev.face < 3) continue
      expect(ev.stroll).toBe(true)
      expect(ev.path.at(-1)).toBe(r.state.board.tiles.findIndex((t) => t.name === '品川'))
      expect(r.state.players[0].visited).toEqual(['品川'])
      expect(r.state.log.some((l) => l.message.includes('スタンプ'))).toBe(true)
      return
    }
    throw new Error('3以上が出る種が見つからない')
  })

  it('通常の「振る」でも、宿場に止まればスタンプが付く。宿場でないマスでは付かない', () => {
    const base = soloHuman(3)
    const r = submitAction(base, 'p0', { type: 'roll' }, cfg, undefined, 1)
    expect(r.state.players[0].visited).toEqual([])
    const r2 = submitAction(base, 'p0', { type: 'roll' }, cfg, undefined, 2)
    expect(r2.state.players[0].visited).toEqual(['品川'])
  })

  it('スタンプは得点になる', () => {
    const s = playOut(createGame({ seed: 5, playerCount: 2, includeHuman: false }, cfg))
    for (const p of s.players) {
      const sc = rankPlayers(s, cfg).find((r) => r.playerId === p.id)!
      expect(sc.stamps).toBe(p.visited.length * cfg.balance.scoring.stampPoints)
      expect(sc.total).toBe(sc.money + sc.memories + sc.reputation + sc.meibutsu + sc.stamps + sc.arrival)
    }
  })
})
