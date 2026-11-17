// 仮の絵（色と記号）。浮世絵風の素材に差し替えるときは、ここだけを変える。
// tileArt：マスの種類ごとの既定の絵。TileDef.art（board.json）に名前を付ければ、マスごとに上書きできる（artOverrides）。

import overridesJson from './overrides.json'
import type { TileDef, TileType } from '../types/game'

export interface TileArt {
  /** マスの地の色 */
  fill: string
  /** 記号（画像がないときに描く） */
  symbol: string
  /** 画像の URL（あれば記号の代わりに描く。public/ 以下に置く） */
  image?: string
  label: string
}

export const tileArt: Record<TileType, TileArt> = {
  start: { fill: '#c0392b', symbol: '橋', label: '出発' },
  goal: { fill: '#8e44ad', symbol: '京', label: 'ゴール' },
  shuku: { fill: '#d35400', symbol: '宿', label: '宿場' },
  event: { fill: '#2c3e50', symbol: '？', label: '出来事' },
  teahouse: { fill: '#27ae60', symbol: '茶', label: '茶屋' },
  scenic: { fill: '#2980b9', symbol: '景', label: '名所' },
  fork: { fill: '#16a085', symbol: '川', label: '分かれ道' },
}

/**
 * マスごとの絵（マスの名前 → 画像の URL）。src/art/overrides.json に、scripts/importArt.mjs が書く。
 * TileDef.art（board.json）に別の名前を付ければ、そのキーでも探す。
 */
export const artOverrides: Record<string, string> = overridesJson as Record<string, string>

export function artFor(tile: TileDef): TileArt {
  const base = tileArt[tile.type]
  const image = (tile.art ? artOverrides[tile.art] : undefined) ?? artOverrides[tile.name]
  return image ? { ...base, image } : base
}

/** 駒の色（プレイヤーの順） */
export const pieceColors = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6', '#e67e22']
