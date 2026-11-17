import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from '../engine'
import { artFor, artOverrides, tileArt } from './theme'

describe('マスの絵', () => {
  it('絵の登録がなければ、種類ごとの仮の絵（色と記号）', () => {
    const hakone = DEFAULT_CONFIG.board.main.find((t) => t.name === '箱根')!
    const saved = { ...artOverrides }
    for (const k of Object.keys(artOverrides)) delete artOverrides[k]
    expect(artFor(hakone)).toEqual(tileArt.shuku)
    Object.assign(artOverrides, saved)
  })

  it('マスの名前、または art のキーで、画像を差し替えられる', () => {
    const hakone = DEFAULT_CONFIG.board.main.find((t) => t.name === '箱根')!
    artOverrides['箱根'] = '/art/箱根.webp'
    expect(artFor(hakone).image).toBe('/art/箱根.webp')
    expect(artFor(hakone).symbol).toBe(tileArt.shuku.symbol)
    delete artOverrides['箱根']
    artOverrides['vista'] = '/art/vista.webp'
    expect(artFor({ ...hakone, art: 'vista' }).image).toBe('/art/vista.webp')
    delete artOverrides['vista']
  })

  it('登録されている絵は、すべて、盤面にあるマスの名前', () => {
    const names = new Set([...DEFAULT_CONFIG.board.main, ...DEFAULT_CONFIG.board.forks.flatMap((f) => f.laneTiles)].map((t) => t.name))
    for (const k of Object.keys(artOverrides)) expect(names.has(k), k).toBe(true)
  })
})
