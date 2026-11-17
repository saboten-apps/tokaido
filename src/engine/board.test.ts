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
