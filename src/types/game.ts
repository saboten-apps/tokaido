// ゲーム全体の型定義。ゲームの状態はすべて GameState に集約する（保存・オンラインで、そのまま送れる形）。

/** セーブデータ・GameState の構造バージョン。構造を変えたら上げて、storage/saveGame.ts の MIGRATIONS に移行を書く */
export const SCHEMA_VERSION = 3

/** 旅人の能力値。money＝路銀（文）、stamina＝体力、memories＝思い出、reputation＝評判 */
export type StatKey = 'money' | 'stamina' | 'memories' | 'reputation'

export type Stats = Record<StatKey, number>

/** 能力値の変化量（未指定は変化なし） */
export type StatDelta = Partial<Stats>

/** 旅人の身分（旅のあいだ変わらない。持ち味は balance.json の roles） */
export type RoleId = 'ippan' | 'shonin' | 'ise' | 'hikyaku' | 'geinin' | 'bushi'

/** 県の ID */
export type RegionId = 'tokyo' | 'kanagawa' | 'shizuoka' | 'aichi' | 'mie' | 'shiga' | 'kyoto'

/** 泊まり方（木賃宿＝安い・回復小、旅籠＝ふつう。評判が高いと本陣に招かれる） */
export type LodgingId = 'kichin' | 'hatago'

/** CPU の旅の流儀 */
export type CpuPersonalityId = 'steady' | 'gourmet' | 'hasty' | 'social'

export interface CpuPersonality {
  id: CpuPersonalityId
  name: string
  /** 選択肢を評価するときの、能力値ごとの重み（路銀は100文＝1として見る） */
  weights: Stats
  /** 名物を買う気の強さ（1つあたりの評価に足す） */
  meibutsuLove: number
  /** 脇道（寄り道）を選ぶ気の強さ（0〜1） */
  detourLove: number
  /** 早足で進む気の強さ（0〜1。体力に余裕があるとき） */
  hurryLove: number
}

/**
 * マスの種類。
 * start：日本橋 / goal：京都 / shuku：宿場（宿代と名物） / event：出来事 / teahouse：茶屋 / scenic：名所 / fork：分かれ道（必ず止まる）
 */
export type TileType = 'start' | 'goal' | 'shuku' | 'event' | 'teahouse' | 'scenic' | 'fork'

export interface Meibutsu {
  id: string
  name: string
  price: number
  /** 買ったときに増える思い出 */
  memories: number
}

export interface TileDef {
  type: TileType
  /** 表示名（宿場名・名所の名前など） */
  name: string
  /** 通り過ぎずに、必ずここで止まる（関所・川） */
  mustStop?: boolean
  /** 止まったとき、一度だけ必ず起きる出来事（宿場・関所の専用イベント） */
  eventId?: string
  /** 宿場の名物 */
  meibutsu?: Meibutsu
  /** 県（regions.json のキー。東京・神奈川・静岡・愛知・三重・滋賀・京都） */
  region?: RegionId
  /** 絵の差し替え用のキー（なければ種類ごとの仮の絵） */
  art?: string
}

export interface ForkChoiceDef {
  label: string
  desc: string
  story: string
  effects: StatDelta
}

/** 分かれ道。岐路マスで本道か脇道を選び、脇道は合流マスで本道に戻る */
export interface ForkDef {
  /** 岐路マスの番号（本道上） */
  tileIndex: number
  /** 脇道の最初のマス番号（脇道のマスは tiles の末尾に並ぶ） */
  laneStart: number
  laneLength: number
  /** 脇道の最後のマスから進んで戻る、本道のマス番号 */
  mergeIndex: number
  main: ForkChoiceDef
  lane: ForkChoiceDef
}

export interface BoardState {
  /** 本道のマス数（これ以降は脇道） */
  mainLength: number
  tiles: TileDef[]
  forks: ForkDef[]
  playerStates: Record<string, PlayerBoardState>
}

export interface PlayerBoardState {
  position: number
  /** 岐路で選んだ道。次に進み出すときに使い、使ったら消える */
  route?: 'main' | 'lane'
}

export interface Player {
  id: string
  name: string
  isHuman: boolean
  /** CPU のみ。人間は null */
  personality: CpuPersonalityId | null
  stats: Stats
  /** 買った名物の ID */
  meibutsu: string[]
  flags: string[]
  usedOnceEvents: string[]
  /** 身分 */
  role: RoleId
  /** 泊まり方の好み（宿場で日が終わるときに使う） */
  lodging: LodgingId
  /** 足止めの残り日数（川止め・寝込みなど。0 なら動ける） */
  restDays: number
  /** 京都に着いた日（着いていなければ null） */
  arrivedDay: number | null
  /** 着いた順（1始まり。着いていなければ null） */
  arrivalRank: number | null
}

// ---- 出来事 ----

export interface EventCondition {
  minMoney?: number
  minStamina?: number
  maxStamina?: number
  minReputation?: number
  hasFlags?: string[]
  notFlags?: string[]
}

export interface GambleSpec {
  /** 成功確率（0〜1） */
  chance: number
  failEffects: StatDelta
}

export interface EventChoice {
  label: string
  effects: StatDelta
  requires?: EventCondition
  /** 運試し。成功で effects、失敗で failEffects */
  gamble?: GambleSpec
  /** 足止めの日数 */
  restDays?: number
  addFlags?: string[]
  removeFlags?: string[]
}

export interface GameEvent {
  id: string
  title: string
  description: string
  /** 抽選の重み */
  weight: number
  /** true なら、同じ人には一度だけ */
  once?: boolean
  /** true なら、出来事マスの抽選には出ない（マス専用 eventId でだけ起きる） */
  special?: boolean
  conditions?: EventCondition
  choices: EventChoice[]
}

// ---- 進行 ----

export interface LogEntry {
  day: number
  playerId: string | null
  message: string
}

export interface PendingEvent {
  playerId: string
  eventId: string
}

/** 出来事以外の、人間の判断待ち */
export type AwaitedKind = 'meibutsu' | 'fork'

export interface AwaitedDecision {
  kind: AwaitedKind
  playerId: string
  tileIndex: number
}

export interface TurnControl {
  /** 手番のプレイヤー（players の添字） */
  activeIndex: number
  awaiting: AwaitedDecision | null
  /** 出来事のあとに、名物の判断が続くか（宿場の専用イベントのあと） */
  meibutsuAfterEvent: boolean
}

export type GamePhase = 'playing' | 'finished'

/** 旅日記の1行 */
export type DiaryKind = 'event' | 'sekisho' | 'meibutsu' | 'fork' | 'inn' | 'arrive'

export interface DiaryEntry {
  day: number
  playerId: string
  /** その場所（マスの名前） */
  place: string
  kind: DiaryKind
  text: string
}

export interface TitleCondition {
  minMemories?: number
  minMeibutsu?: number
  minReputation?: number
  minMoney?: number
  arrivalRank?: number
  /** 起きた専用イベント（すべて） */
  hasEvents?: string[]
  hasFlags?: string[]
}

export interface TitleDef {
  id: string
  name: string
  desc: string
  when: TitleCondition
}

export interface GameState {
  schemaVersion: number
  seed: number
  rngState: number
  phase: GamePhase
  /** 旅の日数（1日目から。全員が1回ずつ動くと1日進む） */
  day: number
  players: Player[]
  board: BoardState
  pendingEvent: PendingEvent | null
  turnCtl: TurnControl
  log: LogEntry[]
  /** 旅日記（出来事・名物・関所・分かれ道・到着。結果画面で読む） */
  diary: DiaryEntry[]
}

export interface ScoreBreakdown {
  playerId: string
  money: number
  memories: number
  reputation: number
  meibutsu: number
  arrival: number
  total: number
}
