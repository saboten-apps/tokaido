// 3D の盤面。旅人の後ろから、進む先を見る視点（追いかけカメラ）。街道に沿って、県ごとに違う景色を立てる。
//   東京：町家が並ぶ／神奈川：左に相模の海、箱根の山／静岡：右に富士、茶畑、浜名湖／愛知：岡崎城、広い田んぼ、伊勢湾
//   三重：鳥居、杉の森、鈴鹿の山／滋賀：琵琶湖、土山の雨／京都：五重塔、紅葉、東山
// 色・空・紹介は src/data/regions.json。2D と同じ座標（boardLayout）を、地面の上の街道にする。
// three.js は、この画面を開いたときだけ読み込む（遅延読み込み）。

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { pieceColors, tileArt } from '../art/theme'
import { REGIONS, REGION_ORDER, regionAt } from '../engine'
import { SPACING, layoutBoard } from './boardLayout'
import type { BoardState, Player, RegionId } from '../types/game'

const UNIT = 6 / SPACING // 2D の座標 → 世界の座標（マス間は 6。間の景色で、道のりを感じさせる）

interface Props {
  board: BoardState
  players: Player[]
  activeId: string | null
  focusId: string | null
  positions: Record<string, number>
  /** 小地図で押された位置（n が変わるたびに、そこをしばらく映す） */
  jump?: { index: number; n: number } | null
}

function label(text: string, bold: boolean): THREE.Sprite {
  const c = document.createElement('canvas')
  c.width = 320
  c.height = 80
  const g = c.getContext('2d')!
  g.font = `${bold ? 'bold ' : ''}42px "Hiragino Mincho ProN","Yu Mincho",serif`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.lineWidth = 10
  g.strokeStyle = 'rgba(246,239,224,0.96)'
  g.strokeText(text, 160, 42)
  g.fillStyle = '#2b2118'
  g.fillText(text, 160, 42)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }))
  s.scale.set(3.6, 0.9, 1)
  s.renderOrder = 10
  return s
}

/** 疑似乱数（毎回同じ景色にする） */
function rng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const QS = new URLSearchParams(window.location.search)
/** ?stats=1：描画の速さ（FPS）を出す。?lite=1：軽量（アンチエイリアスなし・解像度を落とす） */
const SHOW_STATS = QS.has('stats')
const LITE = QS.has('lite')

/** 海に面しているところ（江戸から京へ進んで、左手＝南）。[はじめのマス, おわりのマス, 種類] */
const COASTS: Array<[string, string, 'sea' | 'lake']> = [
  ['川崎', '小田原', 'sea'],
  ['沼津', '江尻', 'sea'],
  ['袋井', '白須賀', 'sea'],
  ['宮', '四日市', 'sea'],
  ['草津', '大津', 'lake'],
]

type TreeKind = 'pine' | 'sugi' | 'maple'

/** 県ごとの、道沿いの木の割合：[松, 杉, 紅葉] */
const TREE_MIX: Record<RegionId, [number, number, number]> = {
  tokyo: [1, 0, 0],
  kanagawa: [1, 0, 0],
  shizuoka: [0.85, 0.15, 0],
  aichi: [0.95, 0.05, 0],
  mie: [0.2, 0.8, 0],
  shiga: [0.55, 0.4, 0.05],
  kyoto: [0.1, 0.3, 0.6],
}

export default function Board3D({ board, players, activeId, focusId, positions, jump }: Props) {
  const box = useRef<HTMLDivElement | null>(null)
  const live = useRef({ players, activeId, focusId, positions, jump })
  useEffect(() => {
    live.current = { players, activeId, focusId, positions, jump }
  })
  const manual = useRef<{ n: number; until: number } | null>(null)
  const statsEl = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = box.current
    if (!el) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !LITE })
    } catch {
      el.textContent = '3D 表示にはWebGLが必要です。2D表示に切り替えてください。'
      return
    }
    renderer.setPixelRatio(LITE ? 1 : Math.min(window.devicePixelRatio, 2))
    el.appendChild(renderer.domElement)
    renderer.domElement.setAttribute('data-testid', 'board3d-canvas')

    const skyCur = new THREE.Color(REGIONS.tokyo.sky)
    const fogCur = new THREE.Color(REGIONS.tokyo.fog)
    renderer.setClearColor(skyCur)
    const scene = new THREE.Scene()
    scene.background = skyCur.clone()
    scene.fog = new THREE.Fog(fogCur.clone(), 30, 115)
    scene.add(new THREE.HemisphereLight(0xfff6e0, 0x8a7a55, 1.8))
    const sun = new THREE.DirectionalLight(0xfff0d0, 1.7)
    sun.position.set(-10, 18, 8)
    scene.add(sun)

    const camera = new THREE.PerspectiveCamera(56, 1, 0.1, 240)
    const pts = layoutBoard(board).map((p) => new THREE.Vector3(p.x * UNIT, 0, p.y * UNIT * 1.4))
    const rand = rng(7)
    const idxOf = (name: string) => board.tiles.findIndex((t) => t.name === name)
    const regionOfTile = (i: number): RegionId => regionAt(board, i)

    /** 次のマス（脇道・合流・ゴールを含む。進む先の向きを決めるのに使う） */
    const nextOf = (i: number): number => {
      if (i < board.mainLength) return Math.min(i + 1, board.mainLength - 1)
      const f = board.forks.find((x) => i >= x.laneStart && i < x.laneStart + x.laneLength)
      if (!f) return i
      return i === f.laneStart + f.laneLength - 1 ? f.mergeIndex : i + 1
    }

    // ---- 地面：県ごとの色 ----
    for (const id of REGION_ORDER) {
      const xs = pts.slice(0, board.mainLength).filter((_, i) => board.tiles[i].region === id).map((p) => p.x)
      if (xs.length === 0) continue
      const x0 = id === 'kyoto' ? Math.min(...xs) - 60 : Math.min(...xs) - 3
      const x1 = id === 'tokyo' ? Math.max(...xs) + 60 : Math.max(...xs) + 3
      const def = REGIONS[id]
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, 110), new THREE.MeshStandardMaterial({ color: def.ground, roughness: 1 }))
      ground.rotation.x = -Math.PI / 2
      ground.position.set((x0 + x1) / 2, -0.16, 16)
      scene.add(ground)
      const grass = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, 80), new THREE.MeshStandardMaterial({ color: def.grass, roughness: 1 }))
      grass.rotation.x = -Math.PI / 2
      grass.position.set((x0 + x1) / 2, -0.15, -38)
      scene.add(grass)
    }

    // ---- 海・湖（左手＝南） ----
    for (const [a, b, kind] of COASTS) {
      const ia = idxOf(a)
      const ib = idxOf(b)
      if (ia < 0 || ib < 0) continue
      const x1 = pts[ia].x + 6
      const x0 = pts[ib].x - 6
      const sea = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, kind === 'lake' ? 70 : 60), new THREE.MeshStandardMaterial({ color: kind === 'lake' ? 0x86b4cf : 0x5b93b8, roughness: 0.25 }))
      sea.rotation.x = -Math.PI / 2
      sea.position.set((x0 + x1) / 2, -0.1, 14 + (kind === 'lake' ? 35 : 30))
      scene.add(sea)
      const sand = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, 2.2), new THREE.MeshStandardMaterial({ color: 0xe3d8ad, roughness: 1 }))
      sand.rotation.x = -Math.PI / 2
      sand.position.set((x0 + x1) / 2, -0.09, 13.4)
      scene.add(sand)
    }

    // ---- 街道・松並木・町家 ----
    const roadMats = new Map<RegionId, THREE.MeshStandardMaterial>()
    const roadMat = (id: RegionId) => {
      let m = roadMats.get(id)
      if (!m) {
        m = new THREE.MeshStandardMaterial({ color: REGIONS[id].road, roughness: 1 })
        roadMats.set(id, m)
      }
      return m
    }
    // 木：数が多いので、まとめて描く（インスタンス描画）。ここでは位置だけ集める
    const trees: Array<{ x: number; z: number; h: number; tone: number; kind: TreeKind }> = []
    const pickKind = (id: RegionId): TreeKind => {
      const [p, s] = TREE_MIX[id]
      const r = rand()
      return r < p ? 'pine' : r < p + s ? 'sugi' : 'maple'
    }
    const tree = (x: number, z: number, h: number, id: RegionId) => {
      trees.push({ x, z, h, tone: rand(), kind: pickKind(id) })
    }
    const wall = new THREE.MeshStandardMaterial({ color: 0xe7dbbd, roughness: 0.9 })
    const wall2 = new THREE.MeshStandardMaterial({ color: 0xd9c9a4, roughness: 0.9 })
    const roof = new THREE.MeshStandardMaterial({ color: 0x4b3d36, roughness: 0.8, flatShading: true })
    const lacquer = new THREE.MeshStandardMaterial({ color: 0xb03a2e, roughness: 0.6 })
    const house = (x: number, z: number, side: number, w: number, off = 2.3) => {
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, 1.0, 1.3), rand() < 0.5 ? wall : wall2)
      body.position.set(x, 0.4, z + side * off)
      const top = new THREE.Mesh(new THREE.ConeGeometry(w * 0.82, 0.8, 4), roof)
      top.rotation.y = Math.PI / 4
      top.scale.z = 0.8
      top.position.set(x, 1.28, z + side * off)
      scene.add(body, top)
    }
    const link = (a: THREE.Vector3, b: THREE.Vector3, lined: boolean, id: RegionId) => {
      const len = a.distanceTo(b)
      const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.12, 1.5), roadMat(id))
      m.position.copy(a).lerp(b, 0.5)
      m.position.y = -0.06
      m.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x)
      scene.add(m)
      if (!lined) return
      const dir = new THREE.Vector3().subVectors(b, a).normalize()
      const nrm = new THREE.Vector3(-dir.z, 0, dir.x)
      if (id === 'tokyo' || id === 'kyoto') {
        // 町並み：道の両側に、町家が続く
        for (let d = 0.8; d < len; d += 2.6) {
          for (const side of [-1, 1]) {
            if (rand() < 0.15) continue
            const p = new THREE.Vector3().copy(a).addScaledVector(dir, d)
            house(p.x, p.z, side, 1.5 + rand() * 0.6, 2.4 + rand() * 0.4)
          }
        }
        return
      }
      for (let d = 0.4; d < len; d += 1.15) {
        for (const side of [-1, 1]) {
          if (rand() < 0.28) continue
          const p = new THREE.Vector3().copy(a).addScaledVector(dir, d).addScaledVector(nrm, side * (1.7 + rand() * 0.5))
          tree(p.x, p.z, 1.5 + rand() * 1.1, id)
        }
      }
    }
    for (let i = 0; i < board.mainLength - 1; i++) link(pts[i], pts[i + 1], true, regionOfTile(i))
    for (const f of board.forks) {
      const rid = regionOfTile(f.tileIndex)
      link(pts[f.tileIndex], pts[f.laneStart], false, rid)
      for (let k = 0; k < f.laneLength - 1; k++) link(pts[f.laneStart + k], pts[f.laneStart + k + 1], false, rid)
      link(pts[f.laneStart + f.laneLength - 1], pts[f.mergeIndex], false, rid)
    }

    // ---- マスと、宿場の家・一里塚・橋・川 ----
    const labels: THREE.Sprite[] = []
    board.tiles.forEach((t, i) => {
      const big = t.type === 'shuku' || t.type === 'start' || t.type === 'goal' || t.type === 'fork'
      const r = big ? 0.85 : 0.6
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, big ? 0.34 : 0.22, 28), new THREE.MeshStandardMaterial({ color: tileArt[t.type].fill, roughness: 0.7 }))
      m.position.copy(pts[i])
      m.position.y = 0.06
      scene.add(m)
      if (t.mustStop) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r + 0.08, 0.07, 8, 32), new THREE.MeshStandardMaterial({ color: 0xf5d76e }))
        ring.rotation.x = Math.PI / 2
        ring.position.copy(pts[i])
        ring.position.y = 0.26
        scene.add(ring)
      }
      const rid = regionOfTile(i)
      if (t.type === 'shuku') {
        const side = i % 2 === 0 ? 1 : -1
        house(pts[i].x - 1.2, pts[i].z, side, 1.7)
        house(pts[i].x + 1.1, pts[i].z, side, 1.4)
        if (rand() < 0.5) house(pts[i].x - 3.2, pts[i].z, -side, 1.5)
      }
      if ((t.type === 'event' || t.type === 'scenic') && rid !== 'tokyo' && rid !== 'kyoto') {
        // 一里塚（盛り土と、一本の木）
        const mound = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.5, 10), new THREE.MeshStandardMaterial({ color: 0x9a8a5e, flatShading: true }))
        mound.position.set(pts[i].x, 0.1, pts[i].z + 1.9)
        scene.add(mound)
        tree(pts[i].x, pts[i].z + 1.9, 2.1, rid)
      }
      if (t.type === 'start' || t.type === 'goal') {
        // 橋（日本橋・三条大橋）：床と、欄干、擬宝珠
        const deck = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.22, 2.0), new THREE.MeshStandardMaterial({ color: 0x8a6a45 }))
        deck.position.set(pts[i].x, 0.12, pts[i].z)
        scene.add(deck)
        for (const side of [-1, 1]) {
          const rail = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.3, 0.12), lacquer)
          rail.position.set(pts[i].x, 0.5, pts[i].z + side * 1)
          scene.add(rail)
          for (const end of [-1, 1]) {
            const post = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), lacquer)
            post.position.set(pts[i].x + end * 2.7, 0.65, pts[i].z + side * 1)
            scene.add(post)
          }
        }
        const water = new THREE.Mesh(new THREE.PlaneGeometry(6, 14), new THREE.MeshStandardMaterial({ color: 0x5f8fb0, roughness: 0.3 }))
        water.rotation.x = -Math.PI / 2
        water.position.set(pts[i].x, -0.12, pts[i].z)
        scene.add(water)
      }
      if (t.type === 'fork') {
        // 大井川：広い河原と、川の流れ
        const bed = new THREE.Mesh(new THREE.PlaneGeometry(14, 40), new THREE.MeshStandardMaterial({ color: 0xcdc3a2, roughness: 1 }))
        bed.rotation.x = -Math.PI / 2
        bed.position.set(pts[i].x - 3, -0.11, pts[i].z + 4)
        scene.add(bed)
        for (const [dx, w] of [[-1, 4], [-4.5, 3.4], [-7.5, 2.6]] as const) {
          const water = new THREE.Mesh(new THREE.PlaneGeometry(w, 40), new THREE.MeshStandardMaterial({ color: 0x6f9bb8, roughness: 0.3 }))
          water.rotation.x = -Math.PI / 2
          water.position.set(pts[i].x + dx - 2, -0.1, pts[i].z + 4)
          scene.add(water)
        }
      }
      if (t.type === 'shuku' || t.mustStop || t.type === 'start' || t.type === 'goal') {
        const s = label(t.name, big)
        s.position.copy(pts[i])
        s.position.y = 2.7
        scene.add(s)
        labels.push(s)
      }
    })

    // ---- 県ごとの、見どころ ----
    const at = (name: string): THREE.Vector3 | null => {
      const i = idxOf(name)
      return i >= 0 ? pts[i] : null
    }
    const hill = (x: number, z: number, r: number, h: number, color: number, segs = 6) => {
      const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, segs), new THREE.MeshStandardMaterial({ color, flatShading: true }))
      m.position.set(x, h / 2 - 0.2, z)
      scene.add(m)
    }
    // 箱根・芦ノ湖：道の両側に、山が迫る
    for (const name of ['箱根の山道', '箱根', '芦ノ湖と富士']) {
      const p = at(name)
      if (!p) continue
      for (let k = 0; k < 7; k++) {
        const side = k % 2 === 0 ? -1 : 1
        hill(p.x + (rand() - 0.5) * 9, p.z + side * (7 + rand() * 6), 3 + rand() * 3, 9 + rand() * 9, 0x6f8a62)
      }
    }
    const lake = at('芦ノ湖と富士')
    if (lake) {
      const w = new THREE.Mesh(new THREE.CircleGeometry(9, 28), new THREE.MeshStandardMaterial({ color: 0x78a8c8, roughness: 0.2 }))
      w.rotation.x = -Math.PI / 2
      w.position.set(lake.x, -0.08, lake.z + 14)
      scene.add(w)
    }
    // 鈴鹿：杉の森と、高い山
    for (const name of ['坂下', '鈴鹿峠']) {
      const p = at(name)
      if (!p) continue
      for (let k = 0; k < 8; k++) {
        const side = k % 2 === 0 ? -1 : 1
        hill(p.x + (rand() - 0.5) * 10, p.z + side * (6 + rand() * 7), 3 + rand() * 3, 11 + rand() * 9, 0x5d7a5a)
      }
    }
    // 静岡の茶畑（牧之原のあたり）と、滋賀・土山の茶畑
    const tea = (cx: number, cz: number) => {
      const base = new THREE.Mesh(new THREE.BoxGeometry(7, 0.05, 5), new THREE.MeshStandardMaterial({ color: 0x6e9d4a, roughness: 1 }))
      base.position.set(cx, -0.12, cz)
      scene.add(base)
      for (let r = 0; r < 5; r++) {
        const row = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.38, 0.55), new THREE.MeshStandardMaterial({ color: 0x2f6b34, roughness: 1 }))
        row.position.set(cx, 0.06, cz - 2 + r * 1)
        scene.add(row)
      }
    }
    for (const [a, b] of [['丸子の茶屋', '掛川'], ['土山', '土山']] as const) {
      const ia = idxOf(a)
      const ib = idxOf(b)
      if (ia < 0 || ib < 0) continue
      for (let i = ia; i <= ib; i++) {
        for (const side of [-1, 1]) {
          if (rand() < 0.35) continue
          tea(pts[i].x + (rand() - 0.5) * 7, pts[i].z + side * (6 + rand() * 6))
        }
      }
    }
    // 岡崎城
    const oka = at('岡崎の城下')
    if (oka) {
      const gx = oka.x
      const gz = oka.z - 9
      const stone = new THREE.Mesh(new THREE.BoxGeometry(6, 1.6, 6), new THREE.MeshStandardMaterial({ color: 0x8c8a82, roughness: 1 }))
      stone.position.set(gx, 0.6, gz)
      scene.add(stone)
      let y = 1.4
      for (let k = 0; k < 3; k++) {
        const w = 3.6 - k * 0.9
        const wallM = new THREE.Mesh(new THREE.BoxGeometry(w, 1.2, w), new THREE.MeshStandardMaterial({ color: 0xf2efe6 }))
        wallM.position.set(gx, y + 0.6, gz)
        const roofM = new THREE.Mesh(new THREE.ConeGeometry(w * 0.95, 0.9, 4), roof)
        roofM.rotation.y = Math.PI / 4
        roofM.position.set(gx, y + 1.5, gz)
        scene.add(wallM, roofM)
        y += 1.5
      }
    }
    // 鳥居：桑名（伊勢国一の鳥居）・関（東の追分）
    const torii = (p: THREE.Vector3) => {
      for (const side of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 3.4, 12), lacquer)
        post.position.set(p.x - 1.6, 1.6, p.z + side * 1.7)
        scene.add(post)
      }
      const kasagi = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 4.6), new THREE.MeshStandardMaterial({ color: 0x2a2220 }))
      kasagi.position.set(p.x - 1.6, 3.5, p.z)
      const nuki = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.26, 3.9), lacquer)
      nuki.position.set(p.x - 1.6, 2.8, p.z)
      scene.add(kasagi, nuki)
    }
    for (const name of ['桑名', '関']) {
      const p = at(name)
      if (p) torii(p)
    }
    // 京都：五重塔と東山
    const goal = at('京都 三条大橋')
    if (goal) {
      let y = 0
      for (let k = 0; k < 5; k++) {
        const w = 2.4 - k * 0.36
        const bodyM = new THREE.Mesh(new THREE.BoxGeometry(w, 0.9, w), lacquer)
        bodyM.position.set(goal.x - 4, y + 0.45, goal.z - 8)
        const roofM = new THREE.Mesh(new THREE.ConeGeometry(w * 1.05, 0.5, 4), roof)
        roofM.rotation.y = Math.PI / 4
        roofM.position.set(goal.x - 4, y + 1.1, goal.z - 8)
        scene.add(bodyM, roofM)
        y += 1.05
      }
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), new THREE.MeshStandardMaterial({ color: 0xc9a43a }))
      spire.position.set(goal.x - 4, y + 0.8, goal.z - 8)
      scene.add(spire)
      for (let k = 0; k < 9; k++) {
        const h = new THREE.Mesh(new THREE.SphereGeometry(7 + rand() * 4, 14, 8), new THREE.MeshStandardMaterial({ color: 0x6d9166, flatShading: true }))
        h.scale.set(1.6, 0.7, 1)
        h.position.set(goal.x - 38 + k * 9 + rand() * 4, -1, goal.z - 26 - rand() * 8)
        scene.add(h)
      }
    }
    // 雨（土山：あいの土山、雨が降る）
    const rainN = 320
    const rainGeo = new THREE.BufferGeometry()
    const rainPos = new Float32Array(rainN * 6)
    for (let k = 0; k < rainN; k++) {
      const x = (rand() - 0.5) * 50
      const z = (rand() - 0.5) * 40
      const y = rand() * 18
      rainPos.set([x, y, z, x - 0.05, y - 0.9, z], k * 6)
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3))
    const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xd2e2ee, transparent: true, opacity: 0.55 }))
    rain.visible = false
    rain.frustumCulled = false
    scene.add(rain)
    const rainAt = at('土山')

    // ---- 遠景：山・富士・雲（カメラの動きにゆっくりついてくる。遠近感が出る） ----
    const far = new THREE.Group()
    scene.add(far)
    const mountain = new THREE.MeshStandardMaterial({ color: 0x8397a0, flatShading: true })
    for (let i = 0; i < 18; i++) {
      const m = new THREE.Mesh(new THREE.ConeGeometry(7 + rand() * 6, 9 + rand() * 9, 6), mountain)
      m.position.set(-90 + i * 11 + rand() * 6, 3, -62 - rand() * 14)
      far.add(m)
    }
    const fujiGroup = new THREE.Group()
    const fuji = new THREE.Mesh(new THREE.ConeGeometry(20, 28, 28), new THREE.MeshStandardMaterial({ color: 0x5b6f9a, flatShading: true }))
    fuji.position.set(26, 13, -78)
    const cap = new THREE.Mesh(new THREE.ConeGeometry(7.5, 10, 28), new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true }))
    cap.position.set(26, 24, -78)
    fujiGroup.add(fuji, cap)
    far.add(fujiGroup)
    const fujiFrom = idxOf('芦ノ湖と富士')
    const fujiTo = idxOf('府中')
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, roughness: 1 })
    const clouds: THREE.Mesh[] = []
    for (let i = 0; i < 9; i++) {
      const c = new THREE.Mesh(new THREE.SphereGeometry(3 + rand() * 3, 12, 8), cloudMat)
      c.scale.set(2.2, 0.55, 1)
      c.position.set(-80 + rand() * 160, 24 + rand() * 12, -50 - rand() * 20)
      far.add(c)
      clouds.push(c)
    }
    // 道から離れた木（まばらに）
    for (let i = 0; i < board.mainLength * 3; i++) {
      const bi = Math.floor(rand() * board.mainLength)
      const base = pts[bi]
      const side = rand() < 0.5 ? -1 : 1
      tree(base.x + (rand() - 0.5) * 6, base.z + side * (4 + rand() * 12), 1.6 + rand() * 1.8, regionOfTile(bi))
    }
    // 田んぼと畑（道から離れたところに、平たい緑。愛知は広く）
    const paddy = new THREE.MeshStandardMaterial({ color: 0xa9c06a, roughness: 1 })
    const field = new THREE.MeshStandardMaterial({ color: 0xc9b86a, roughness: 1 })
    for (let i = 0; i < board.mainLength * 2; i++) {
      const bi = Math.floor(rand() * board.mainLength)
      const base = pts[bi]
      const rid = regionOfTile(bi)
      if (rid === 'tokyo' || rid === 'kyoto') continue
      const side = rand() < 0.5 ? -1 : 1
      const scale = rid === 'aichi' ? 1.7 : 1
      const f = new THREE.Mesh(new THREE.BoxGeometry((4 + rand() * 6) * scale, 0.05, (3 + rand() * 4) * scale), rand() < 0.7 ? paddy : field)
      f.position.set(base.x + (rand() - 0.5) * 8, -0.12, base.z + side * (7 + rand() * 12))
      scene.add(f)
    }

    // ---- 木をまとめて描く ----
    {
      const conifers = trees.filter((t) => t.kind !== 'maple')
      const maples = trees.filter((t) => t.kind === 'maple')
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5e4328 })
      const dummy = new THREE.Object3D()
      const c = new THREE.Color()
      const trunkMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.16, 1, 6), trunkMat, Math.max(1, trees.length))
      trees.forEach((p, i) => {
        dummy.rotation.set(0, 0, 0)
        dummy.position.set(p.x, p.h * 0.27 - 0.1, p.z)
        dummy.scale.set(1, p.h * 0.55, 1)
        dummy.updateMatrix()
        trunkMesh.setMatrixAt(i, dummy.matrix)
      })
      trunkMesh.count = trees.length
      trunkMesh.instanceMatrix.needsUpdate = true
      scene.add(trunkMesh)
      // 松・杉（円錐）
      const coneMesh = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 7), new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true }), Math.max(1, conifers.length))
      const pineA = new THREE.Color(0x3b6a3a)
      const pineB = new THREE.Color(0x58854a)
      const sugiA = new THREE.Color(0x24462f)
      const sugiB = new THREE.Color(0x35603f)
      conifers.forEach((p, i) => {
        const sugi = p.kind === 'sugi'
        const rr = sugi ? 0.3 + p.h * 0.06 : 0.5 + p.h * 0.12
        const hh = sugi ? p.h * 1.6 : p.h * 0.9
        dummy.position.set(p.x, sugi ? hh * 0.5 + 0.3 : p.h * 0.62, p.z)
        dummy.scale.set(rr, hh, rr)
        dummy.updateMatrix()
        coneMesh.setMatrixAt(i, dummy.matrix)
        coneMesh.setColorAt(i, sugi ? c.copy(sugiA).lerp(sugiB, p.tone) : c.copy(pineA).lerp(pineB, p.tone))
      })
      coneMesh.count = conifers.length
      coneMesh.instanceMatrix.needsUpdate = true
      if (coneMesh.instanceColor) coneMesh.instanceColor.needsUpdate = true
      scene.add(coneMesh)
      // 紅葉（丸い木）
      const ballMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true }), Math.max(1, maples.length))
      const redA = new THREE.Color(0xc0392b)
      const redB = new THREE.Color(0xe08a2e)
      maples.forEach((p, i) => {
        const rr = 0.9 + p.h * 0.28
        dummy.position.set(p.x, p.h * 0.8 + 0.4, p.z)
        dummy.scale.set(rr, rr * 0.85, rr)
        dummy.updateMatrix()
        ballMesh.setMatrixAt(i, dummy.matrix)
        ballMesh.setColorAt(i, c.copy(redA).lerp(redB, p.tone))
      })
      ballMesh.count = maples.length
      ballMesh.instanceMatrix.needsUpdate = true
      if (ballMesh.instanceColor) ballMesh.instanceColor.needsUpdate = true
      scene.add(ballMesh)
    }

    // ---- 駒（笠をかぶった旅人） ----
    const pieces = new Map<string, THREE.Group>()
    players.forEach((p, idx) => {
      const g = new THREE.Group()
      const color = new THREE.Color(pieceColors[idx % pieceColors.length])
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.44, 0.95, 16), new THREE.MeshStandardMaterial({ color }))
      body.position.y = 0.55
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), new THREE.MeshStandardMaterial({ color: 0xf1d3b0 }))
      head.position.y = 1.32
      const hat = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.34, 16), new THREE.MeshStandardMaterial({ color: 0xc9b27a }))
      hat.position.y = 1.66
      const pack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.3), new THREE.MeshStandardMaterial({ color: 0x6e5636 }))
      pack.position.set(0, 0.7, -0.38)
      g.add(body, head, hat, pack)
      g.userData.id = p.id
      scene.add(g)
      pieces.set(p.id, g)
    })

    // ---- 描画：旅人の後ろから、進む先を見る ----
    const target = new THREE.Vector3()
    const heading = new THREE.Vector3(-1, 0, 0)
    const camPos = new THREE.Vector3()
    const lookAt = new THREE.Vector3()
    const lookWant = new THREE.Vector3()
    const skyWant = new THREE.Color()
    const fogWant = new THREE.Color()
    let ready = false
    let fov = 56
    let fujiScale = 0
    const resize = () => {
      const w = el.clientWidth || 600
      const h = el.clientHeight || 320
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)

    let raf = 0
    const t0 = performance.now()
    let frames = 0
    let lastStat = t0
    let lastFrame = t0
    const tick = () => {
      const cur = live.current
      const slot = new Map<number, number>()
      let moving = false
      cur.players.forEach((p) => {
        const idx = cur.positions[p.id] ?? 0
        const n = slot.get(idx) ?? 0
        slot.set(idx, n + 1)
        const g = pieces.get(p.id)
        const base = pts[Math.min(idx, pts.length - 1)]
        if (!g || !base) return
        const ahead = pts[nextOf(Math.min(idx, pts.length - 1))]
        const dir = new THREE.Vector3().subVectors(ahead, base).setY(0)
        if (dir.lengthSq() > 1e-6) dir.normalize()
        else dir.copy(heading)
        // 同じマスの旅人は、道の横に並べる
        const side = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar((n - 0.5) * 0.6)
        const want = new THREE.Vector3(base.x + side.x, 0.2 + (p.id === cur.activeId ? Math.abs(Math.sin((performance.now() - t0) / 260)) * 0.22 : 0), base.z + side.z)
        if (g.position.distanceTo(want) > 0.2) moving = true
        g.position.lerp(want, ready ? 0.12 : 1)
        g.rotation.y = -Math.atan2(dir.z, dir.x) - Math.PI / 2
      })
      if (cur.jump && cur.jump.n !== (manual.current?.n ?? -1)) manual.current = { n: cur.jump.n, until: performance.now() + 4000 }
      const f = pieces.get(cur.focusId ?? '') ?? [...pieces.values()][0]
      const jumping = Boolean(manual.current && performance.now() < manual.current.until && cur.jump)
      const focusIdx = jumping ? Math.min(cur.jump!.index, pts.length - 1) : Math.min(cur.positions[cur.focusId ?? ''] ?? 0, pts.length - 1)
      if (jumping) target.lerp(pts[focusIdx], 0.1)
      else if (f) target.lerp(f.position, ready ? 0.07 : 1)
      // 進む先の向き：2つ先のマスまで見て、ジグザグでカメラが振られないようにする
      const nx = nextOf(nextOf(focusIdx))
      const want = new THREE.Vector3().subVectors(pts[nx], pts[focusIdx]).setY(0)
      if (want.lengthSq() > 1e-6) heading.lerp(want.normalize(), ready ? 0.05 : 1).normalize()
      camPos.set(target.x - heading.x * 10.5, 5.6, target.z - heading.z * 10.5)
      camera.position.lerp(camPos, ready ? 0.08 : 1)
      lookWant.set(target.x + heading.x * 11, 1.2, target.z + heading.z * 11)
      lookAt.lerp(lookWant, ready ? 0.12 : 1)
      camera.lookAt(lookAt)
      // 動いているあいだは、視野を少し広げて、速さを出す
      const wantFov = moving ? 62 : 56
      if (Math.abs(fov - wantFov) > 0.05) {
        fov += (wantFov - fov) * 0.08
        camera.fov = fov
        camera.updateProjectionMatrix()
      }
      // 県が変わると、空と霧の色が、ゆっくり変わる
      const def = REGIONS[regionOfTile(focusIdx)]
      skyWant.set(def.sky)
      fogWant.set(def.fog)
      const k = ready ? 0.025 : 1
      skyCur.lerp(skyWant, k)
      fogCur.lerp(fogWant, k)
      ;(scene.background as THREE.Color).copy(skyCur)
      ;(scene.fog as THREE.Fog).color.copy(fogCur)
      // 富士は、箱根から府中のあたりだけ見える
      const showFuji = fujiFrom >= 0 && focusIdx >= fujiFrom && focusIdx <= fujiTo
      fujiScale += ((showFuji ? 1 : 0) - fujiScale) * 0.04
      fujiGroup.scale.y = Math.max(0.001, fujiScale)
      fujiGroup.visible = fujiScale > 0.01
      // 遠景はゆっくりついてくる。雲は流れる
      far.position.x = camera.position.x * 0.9
      const nowMs = performance.now()
      const dt = Math.min(40, nowMs - lastFrame)
      lastFrame = nowMs
      clouds.forEach((c, i) => {
        c.position.x += (0.004 + i * 0.0008) * dt * 0.06
        if (c.position.x > 90) c.position.x = -90
      })
      // 土山の雨：近づくと降る
      if (rainAt) {
        const near = Math.abs(camera.position.x - rainAt.x) < 22
        rain.visible = near
        if (near) {
          rain.position.set(camera.position.x + heading.x * 12, 0, camera.position.z + heading.z * 12)
          const arr = rainGeo.attributes.position as THREE.BufferAttribute
          for (let q = 0; q < rainN; q++) {
            let y = arr.getY(q * 2) - 0.7
            if (y < 0) y += 18
            arr.setY(q * 2, y)
            arr.setY(q * 2 + 1, y - 0.9)
          }
          arr.needsUpdate = true
        }
      }
      // 名前の札は、進む先（と、すぐ後ろ）のものだけ。遠いほど薄く
      for (const s of labels) {
        const dx = s.position.x - camera.position.x
        const dz = s.position.z - camera.position.z
        const d = Math.hypot(dx, dz)
        const ahead = (dx * heading.x + dz * heading.z) / (d || 1)
        const fade = Math.max(0, Math.min(1, 1.3 - (d - 18) / 26))
        s.material.opacity = ahead > 0.15 ? fade : 0
        s.visible = s.material.opacity > 0.03
      }
      ready = true
      renderer.render(scene, camera)
      frames += 1
      if (SHOW_STATS && statsEl.current && nowMs - lastStat >= 500) {
        statsEl.current.textContent = `${Math.round((frames * 1000) / (nowMs - lastStat))} FPS ／ 描画 ${renderer.info.render.calls} 回 ／ 三角形 ${renderer.info.render.triangles}${LITE ? ' ／ 軽量' : ''}`
        frames = 0
        lastStat = nowMs
      }
      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose?.()
        const mat = m.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
        else mat?.dispose?.()
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
    // 盤面とプレイヤーの顔ぶれが変わらない間は、作り直さない（位置・手番は live から読む）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.tiles.length, board.mainLength, players.length])

  return (
    <div className="board3d-wrap">
      <div className="board3d" ref={box} data-testid="board3d" />
      {SHOW_STATS && <div className="stats3d" ref={statsEl} data-testid="stats3d" />}
    </div>
  )
}
