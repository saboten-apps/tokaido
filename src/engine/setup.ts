// ゲーム開始：旅人（人間＋CPU）を作り、日本橋に並べる。

import { createInitialBoardState } from './board'
import { DEFAULT_CONFIG, ROLE_IDS, getRole, type GameConfig } from './config'
import { createRng, randomSeed, type Rng } from './rng'
import { applyDelta, clampStats } from './stats'
import { SCHEMA_VERSION, type CpuPersonalityId, type GameState, type Player, type RoleId } from '../types/game'

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
  /** 人間の身分（humanNames の順。未指定は、ふつうの旅人）。CPU の身分は、ランダム */
  humanRoles?: RoleId[]
}

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function createPlayer(id: string, name: string, personality: CpuPersonalityId | null, role: RoleId, config: GameConfig): Player {
  const def = getRole(config, role)
  return {
    id,
    name,
    isHuman: personality === null,
    personality,
    role,
    stats: applyDelta(clampStats({ ...config.balance.start }, config.balance.limits), def.start, config.balance.limits),
    meibutsu: [],
    flags: [`role:${role}`],
    usedOnceEvents: [],
    lodging: 'hatago',
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
  const names = shuffle(CPU_NAMES, rng)
  // CPU の身分は、重ならないように配る（6人までなら、全員が違う身分）
  const cpuRoles = shuffle(ROLE_IDS, rng)

  const players: Player[] = []
  for (let i = 0; i < count; i++) {
    const id = `p${i}`
    if (i < humanCount) {
      const name = humanNames ? humanNames[i] : options.playerName || 'あなた'
      players.push(createPlayer(id, name, null, options.humanRoles?.[i] ?? 'ippan', config))
    } else {
      const role = cpuRoles[(i - humanCount) % cpuRoles.length]
      players.push(createPlayer(id, names[i % names.length], getRole(config, role).personality, role, config))
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
    diary: [],
  }
}
