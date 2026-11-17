// ゲーム開始：旅人（人間＋CPU）を作り、日本橋に並べる。

import { createInitialBoardState } from './board'
import { DEFAULT_CONFIG, type GameConfig } from './config'
import { createRng, randomSeed, type Rng } from './rng'
import { clampStats } from './stats'
import { SCHEMA_VERSION, type CpuPersonalityId, type GameState, type Player } from '../types/game'

export const HUMAN_PLAYER_ID = 'p0'
export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 6
const CPU_NAMES = ['お梅', '与平', 'お松', '権八', '清吉', 'お鶴']

export interface NewGameOptions {
  playerName?: string
  seed?: number
  /** false にすると全員 CPU（シミュレーション用） */
  includeHuman?: boolean
  /** 参加人数（人間＋CPU。2〜6） */
  playerCount?: number
  /** 人間の名前（同じ端末で交代・オンライン用）。指定すると、先頭からその人数が人間になる */
  humanNames?: string[]
}

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function createPlayer(id: string, name: string, personality: CpuPersonalityId | null, config: GameConfig): Player {
  return {
    id,
    name,
    isHuman: personality === null,
    personality,
    stats: clampStats({ ...config.balance.start }, config.balance.limits),
    meibutsu: [],
    flags: [],
    usedOnceEvents: [],
    restDays: 0,
    arrivedDay: null,
    arrivalRank: null,
  }
}

export function createGame(options: NewGameOptions = {}, config: GameConfig = DEFAULT_CONFIG): GameState {
  const seed = (options.seed ?? randomSeed()) >>> 0
  const rng = createRng(seed)
  const humanNames = options.humanNames?.length ? options.humanNames.slice(0, MAX_PLAYERS) : null
  const humanCount = humanNames ? humanNames.length : (options.includeHuman ?? true) ? 1 : 0
  const wanted = Math.round(options.playerCount ?? config.balance.game.playerCount)
  const count = Math.max(MIN_PLAYERS, humanCount, Math.min(MAX_PLAYERS, wanted))
  const personalities = shuffle(config.balance.cpuPersonalities.map((p) => p.id), rng)
  const names = shuffle(CPU_NAMES, rng)

  const players: Player[] = []
  for (let i = 0; i < count; i++) {
    const id = `p${i}`
    if (i < humanCount) {
      const name = humanNames ? humanNames[i] : options.playerName || 'あなた'
      players.push(createPlayer(id, name, null, config))
    } else {
      players.push(createPlayer(id, names[i % names.length], personalities[i % personalities.length], config))
    }
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    seed,
    rngState: rng.getState(),
    phase: 'playing',
    day: 1,
    players,
    board: createInitialBoardState(players, config),
    pendingEvent: null,
    turnCtl: { activeIndex: 0, awaiting: null, meibutsuAfterEvent: false },
    log: [{ day: 1, playerId: null, message: '日本橋を発つ。目指すは京都・三条大橋。' }],
  }
}
