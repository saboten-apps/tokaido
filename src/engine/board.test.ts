import { describe, expect, it } from 'vitest'
import { createInitialBoardState, goalIndex, nextTileIndex, pathFrom } from './board'
import { DEFAULT_CONFIG } from './config'

const board = createInitialBoardState([], DEFAULT_CONFIG)
const fork = board.forks[0]

describe('東海道の一本道', () => {
  it('日本橋から始まり、京都で終わる', () => {
    expect(board.tiles[0].name).toBe('日本橋')
    expect(board.tiles[goalIndex(board)].type).toBe('goal')
    expect(nextTileIndex(board, goalIndex(board), undefined)).toBeNull()
  })

  it('京都を越えて進まない（周回しない）', () => {
    const g = goalIndex(board)
    const path = pathFrom(board, g - 2, 6, undefined)
    expect(path).toEqual([g - 1, g])
  })

  it('関所（mustStop）では、出目が余っても止まる', () => {
    const hakone = board.tiles.findIndex((t) => t.name === '箱根')
    const path = pathFrom(board, hakone - 2, 6, undefined)
    expect(path.at(-1)).toBe(hakone)
  })

  it('止まったマスからは、次の手番に先へ進める', () => {
    const hakone = board.tiles.findIndex((t) => t.name === '箱根')
    expect(pathFrom(board, hakone, 2, undefined)).toEqual([hakone + 1, hakone + 2])
  })

  it('岐路で脇道を選ぶと、脇道を通って合流マスに戻る', () => {
    const path = pathFrom(board, fork.tileIndex, 6, 'lane')
    expect(path.slice(0, fork.laneLength)).toEqual([fork.laneStart, fork.laneStart + 1, fork.laneStart + 2])
    expect(path[fork.laneLength]).toBe(fork.mergeIndex)
  })

  it('岐路で本道なら、脇道に入らない', () => {
    expect(pathFrom(board, fork.tileIndex, 1, 'main')).toEqual([fork.tileIndex + 1])
  })
})

describe('53次の盤面', () => {
  const shuku = board.tiles.filter((t) => t.type === 'shuku')
  it('宿場が53ある（日本橋・京都は数えない）', () => {
    expect(shuku).toHaveLength(53)
    expect(new Set(shuku.map((t) => t.name)).size).toBe(53)
    expect(shuku[0].name).toBe('品川')
    expect(shuku.at(-1)!.name).toBe('大津')
  })
  it('順番が正しい：箱根は10番目、宮は41番目、草津は52番目', () => {
    expect(shuku[9].name).toBe('箱根')
    expect(shuku[40].name).toBe('宮')
    expect(shuku[51].name).toBe('草津')
  })
  it('大井川は島田と金谷のあいだ、関所は箱根と新居', () => {
    const names = board.tiles.map((t) => t.name)
    expect(names[fork.tileIndex - 1]).toBe('島田')
    expect(names[fork.mergeIndex]).toBe('金谷')
    expect(board.tiles.filter((t) => t.mustStop).map((t) => t.name)).toEqual(['箱根', '大井川', '新居'])
  })
  it('名物の ID は一意', () => {
    const ids = board.tiles.flatMap((t) => (t.meibutsu ? [t.meibutsu.id] : []))
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('脇道の専用イベントの旗が、岐路の番号と合っている', () => {
    const flag = `lane:${fork.tileIndex}`
    const laneEvents = DEFAULT_CONFIG.events.filter((e) => e.conditions?.hasFlags?.some((f) => f.startsWith('lane:')))
    expect(laneEvents.length).toBeGreaterThan(0)
    for (const e of laneEvents) expect(e.conditions!.hasFlags).toContain(flag)
  })
})
