// 場面の部品。マスごとに、何を立てるか（motifs）と、時間・天気（mood）を、src/data/scenes.json で決め、ここの部品で組み立てる。
// 座標：道は z 軸に沿って奥へ（−z が進む向き）。左（−x）が南（海）、右（+x）が北（山・富士）。カメラは手前（+z）から奥を見る。

import * as THREE from 'three'
import type { RegionDef } from '../engine'

export type Mood = 'day' | 'morning' | 'dusk' | 'night' | 'rain' | 'snow' | 'mist'

export interface MoodDef {
  /** null なら、県の空の色 */
  sky: string | null
  fog: string | null
  near: number
  far: number
  hemi: number
  sun: number
  sunColor: number
  ground?: number
  particles?: 'rain' | 'snow'
}

export const MOODS: Record<Mood, MoodDef> = {
  day: { sky: null, fog: null, near: 40, far: 130, hemi: 1.8, sun: 1.7, sunColor: 0xfff0d0 },
  morning: { sky: '#f4dcc6', fog: '#f1dccb', near: 30, far: 110, hemi: 1.7, sun: 1.2, sunColor: 0xffd7a8 },
  dusk: { sky: '#eba978', fog: '#e9b68c', near: 30, far: 110, hemi: 1.3, sun: 1.5, sunColor: 0xff9f5a },
  night: { sky: '#141c36', fog: '#1b2442', near: 20, far: 90, hemi: 0.55, sun: 0.25, sunColor: 0x8fa6ff },
  rain: { sky: '#a9b6bf', fog: '#b0bcc4', near: 22, far: 85, hemi: 1.3, sun: 0.5, sunColor: 0xdfe8ee, particles: 'rain' },
  snow: { sky: '#2d3b57', fog: '#3a4a68', near: 20, far: 85, hemi: 1.0, sun: 0.4, sunColor: 0xbfd2ff, ground: 0xe8eef4, particles: 'snow' },
  mist: { sky: '#d0d9d6', fog: '#d4dcd9', near: 14, far: 70, hemi: 1.5, sun: 0.7, sunColor: 0xf0f4ee },
}

/** 浮世絵風：影を3段の平らな色にする（グラデーションのない、摺りもののような面） */
let gradient: THREE.DataTexture | null = null
function toonGradient(): THREE.DataTexture {
  if (!gradient) {
    gradient = new THREE.DataTexture(new Uint8Array([120, 120, 120, 255, 190, 190, 190, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat)
    gradient.minFilter = THREE.NearestFilter
    gradient.magFilter = THREE.NearestFilter
    gradient.needsUpdate = true
  }
  return gradient
}
export function toon(color: number | string | THREE.Color, side: THREE.Side = THREE.FrontSide): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({ color, gradientMap: toonGradient(), side })
}

export interface Ctx {
  g: THREE.Group
  rand: () => number
  region: RegionDef
  mood: Mood
  /** 毎フレーム呼ぶもの（t＝経過秒、dt＝前のフレームからの秒） */
  effects: Array<(t: number, dt: number) => void>
  /** 材質（同じ色は使い回す） */
  m: (color: number) => THREE.MeshToonMaterial
}

export function makeCtx(g: THREE.Group, rand: () => number, region: RegionDef, mood: Mood): Ctx {
  const cache = new Map<number, THREE.MeshToonMaterial>()
  return {
    g,
    rand,
    region,
    mood,
    effects: [],
    m: (color) => {
      let x = cache.get(color)
      if (!x) {
        x = toon(color)
        cache.set(color, x)
      }
      return x
    },
  }
}

const RIVER_Z = -13

function box(c: Ctx, w: number, h: number, d: number, color: number, x: number, y: number, z: number, ry = 0): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), c.m(color))
  m.position.set(x, y, z)
  m.rotation.y = ry
  c.g.add(m)
  return m
}
function cyl(c: Ctx, rt: number, rb: number, h: number, color: number, x: number, y: number, z: number, seg = 10): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), c.m(color))
  m.position.set(x, y, z)
  c.g.add(m)
  return m
}
function cone(c: Ctx, r: number, h: number, color: number, x: number, y: number, z: number, seg = 8, ry = 0): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), c.m(color))
  m.position.set(x, y, z)
  m.rotation.y = ry
  c.g.add(m)
  return m
}
function plane(c: Ctx, w: number, d: number, color: number, x: number, y: number, z: number, _rough = 0.5): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), toon(color))
  m.rotation.x = -Math.PI / 2
  m.position.set(x, y, z)
  c.g.add(m)
  return m
}
function sprite(text: string, w: number, h: number, size: number): THREE.Sprite {
  const cv = document.createElement('canvas')
  cv.width = 640
  cv.height = Math.round((640 * h) / w)
  const g = cv.getContext('2d')!
  g.font = `bold ${size}px "Hiragino Mincho ProN","Yu Mincho",serif`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.lineWidth = 14
  g.strokeStyle = 'rgba(246,239,224,0.97)'
  g.strokeText(text, cv.width / 2, cv.height / 2)
  g.fillStyle = '#2b2118'
  g.fillText(text, cv.width / 2, cv.height / 2)
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }))
  s.scale.set(w, h, 1)
  s.renderOrder = 10
  return s
}

function pine(c: Ctx, x: number, z: number, h: number): void {
  cyl(c, 0.12, 0.2, h * 0.55, 0x5e4328, x, h * 0.27, z, 6)
  cone(c, 0.9 + h * 0.1, h * 0.55, c.rand() < 0.5 ? 0x3b6a3a : 0x4f7d44, x, h * 0.62, z, 7)
  cone(c, 0.65 + h * 0.08, h * 0.45, 0x3f7040, x, h * 0.9, z, 7)
}

function house(c: Ctx, x: number, z: number, w: number, d: number, floors: number, side: number): void {
  const wall = c.rand() < 0.5 ? 0xe7dbbd : 0xd9c9a4
  box(c, w, 1.6 * floors, d, wall, x, 0.8 * floors, z)
  cone(c, Math.max(w, d) * 0.8, 1.2, 0x4b3d36, x, 1.6 * floors + 0.55, z, 4, Math.PI / 4)
  box(c, 0.12, 1.0, d * 0.7, 0x5a4636, x - side * (w / 2 + 0.03), 0.7, z)
  if (floors > 1) box(c, 0.2, 0.15, d * 0.9, 0x5a4636, x - side * (w / 2 + 0.2), 1.7, z)
}

function figure(c: Ctx, color: number, x: number, y: number, z: number, s = 1): void {
  cyl(c, 0.2 * s, 0.28 * s, 0.7 * s, color, x, y + 0.45 * s, z, 8)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22 * s, 10, 8), c.m(0xf1d3b0))
  head.position.set(x, y + 0.95 * s, z)
  c.g.add(head)
  cone(c, 0.38 * s, 0.2 * s, 0xc9b27a, x, y + 1.18 * s, z, 12)
}

function boat(c: Ctx, x: number, z: number, ry: number, s = 1, sail = true): void {
  const b = new THREE.Group()
  const hull = new THREE.Mesh(new THREE.BoxGeometry(4.4 * s, 0.7 * s, 1.5 * s), c.m(0x7a5a38))
  hull.position.y = 0.25
  const bow = new THREE.Mesh(new THREE.ConeGeometry(0.75 * s, 1.2 * s, 4), c.m(0x7a5a38))
  bow.rotation.z = -Math.PI / 2
  bow.rotation.x = Math.PI / 4
  bow.position.set(2.7 * s, 0.35, 0)
  b.add(hull, bow)
  if (sail) {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 4 * s, 6), c.m(0x5e4328))
    mast.position.set(0, 2.2 * s, 0)
    const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.05, 3 * s, 2.6 * s), c.m(0xf4efe2))
    cloth.position.set(0, 2.5 * s, 0)
    b.add(mast, cloth)
  }
  b.position.set(x, 0.05, z)
  b.rotation.y = ry
  c.g.add(b)
}

type Builder = (c: Ctx, variant?: string, arg?: string) => void

export const BUILDERS: Record<string, Builder> = {
  street(c, v) {
    const len = v === 'long' ? 46 : 28
    for (let z = 6; z > 6 - len; z -= 3.6) {
      for (const side of [-1, 1]) {
        if (c.rand() < 0.1) continue
        house(c, side * (5 + c.rand() * 0.7), z, 3 + c.rand() * 0.9, 3, c.rand() < 0.4 ? 2 : 1, side)
      }
    }
  },
  pinelane(c) {
    for (let z = 10; z > -46; z -= 2.6) for (const side of [-1, 1]) pine(c, side * (3.3 + c.rand() * 0.4), z, 3.2 + c.rand() * 1.6)
  },
  cedar(c) {
    for (let i = 0; i < 80; i++) {
      const side = c.rand() < 0.5 ? -1 : 1
      const x = side * (4.2 + c.rand() * 12)
      const z = 8 - c.rand() * 48
      const h = 6 + c.rand() * 5
      cyl(c, 0.12, 0.2, h * 0.3, 0x5e4328, x, h * 0.15, z, 6)
      cone(c, 0.9 + c.rand() * 0.4, h, c.rand() < 0.5 ? 0x24462f : 0x35603f, x, h * 0.5 + 0.8, z, 7)
    }
  },
  sea(c) {
    plane(c, 90, 140, 0x5b93b8, -56, 0.0, -30, 0.25)
    plane(c, 2.4, 140, 0xe3d8ad, -10.8, 0.01, -30, 1)
    // 白波
    const waves: THREE.Mesh[] = []
    for (let i = 0; i < 18; i++) {
      const w = box(c, 3 + c.rand() * 4, 0.04, 0.25, 0xf4f8fa, -14 - c.rand() * 40, 0.05, 10 - c.rand() * 60)
      waves.push(w)
    }
    c.effects.push((t) => waves.forEach((w, i) => (w.position.x += Math.sin(t * 0.9 + i) * 0.004)))
  },
  lake(c) {
    plane(c, 100, 150, 0x86b4cf, -60, 0.0, -30, 0.2)
    plane(c, 2.4, 150, 0xe3d8ad, -10.8, 0.01, -30, 1)
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(8 + c.rand() * 6, 12, 8), c.m(0x7f9a86))
      m.scale.set(1.8, 0.5, 1)
      m.position.set(-90 - c.rand() * 30, -1, 20 - c.rand() * 90)
      c.g.add(m)
    }
  },
  river(c) {
    plane(c, 160, 12, 0x6f9bb8, 0, 0.0, RIVER_Z, 0.25)
    plane(c, 160, 3.5, 0xcdc3a2, 0, -0.01, RIVER_Z + 7, 1)
    plane(c, 160, 3.5, 0xcdc3a2, 0, -0.01, RIVER_Z - 7, 1)
    const flow: THREE.Mesh[] = []
    for (let i = 0; i < 16; i++) flow.push(box(c, 2 + c.rand() * 3, 0.03, 0.12, 0xe8f2f8, -40 + c.rand() * 80, 0.03, RIVER_Z - 4 + c.rand() * 8))
    c.effects.push((_, dt) =>
      flow.forEach((w) => {
        w.position.x += dt * 1.2
        if (w.position.x > 40) w.position.x = -40
      }),
    )
  },
  fuji(c, v) {
    const s = v === 'big' ? 1.45 : 1
    const x = v === 'left' ? -26 : 24
    const body = new THREE.Mesh(new THREE.ConeGeometry(20 * s, 28 * s, 30), c.m(0x5b6f9a))
    body.position.set(x, 13 * s, -80)
    const cap = new THREE.Mesh(new THREE.ConeGeometry(7.6 * s, 10 * s, 30), c.m(0xffffff))
    cap.position.set(x, 24 * s, -80)
    c.g.add(body, cap)
  },
  mountains(c, v) {
    if (v === 'low') {
      for (let k = 0; k < 9; k++) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(8 + c.rand() * 5, 14, 8), c.m(0x6d9166))
        m.scale.set(1.7, 0.7, 1)
        m.position.set(-40 + k * 10 + c.rand() * 4, -1, -34 - c.rand() * 12)
        c.g.add(m)
      }
      return
    }
    const near = v === 'near'
    for (let k = 0; k < (near ? 14 : 14); k++) {
      const side = k % 2 === 0 ? -1 : 1
      const x = near ? side * (11 + c.rand() * 12) : -70 + k * 10 + c.rand() * 6
      const z = near ? -8 - c.rand() * 34 : -58 - c.rand() * 18
      const h = near ? 12 + c.rand() * 12 : 14 + c.rand() * 14
      cone(c, near ? 5 + c.rand() * 4 : 9 + c.rand() * 6, h, near ? 0x5f7d58 : 0x8397a0, x, h / 2 - 0.3, z, 6)
    }
  },
  castle(c, v) {
    const s = v === 'big' ? 1.15 : v === 'small' ? 0.7 : 0.9
    const tiers = v === 'big' ? 4 : v === 'small' ? 2 : 3
    const z = -19
    // 石垣：下ほど広い段々（野面積みの、ゆるいのり）
    box(c, 15 * s, 1.4 * s, 15 * s, 0x8f8c82, 0, 0.7 * s, z)
    box(c, 13.2 * s, 1.3 * s, 13.2 * s, 0x9a978c, 0, 2.0 * s, z)
    box(c, 11.4 * s, 1.2 * s, 11.4 * s, 0xa5a297, 0, 3.25 * s, z)
    box(c, 12 * s, 0.25 * s, 12 * s, 0x6f6c63, 0, 3.95 * s, z)
    // 天守：下の見張り（なまこ壁の下見板）と、白壁、反りのある屋根
    let y = 4.05 * s
    for (let k = 0; k < tiers; k++) {
      const w = (6.2 - k * 1.15) * s
      box(c, w, 0.7 * s, w + 0.1, 0x2e2622, 0, y + 0.35 * s, z)
      box(c, w - 0.1, 1.5 * s, w - 0.1, 0xf6f2e8, 0, y + 1.4 * s, z)
      box(c, w * 0.34, 0.7 * s, w + 0.15, 0x3a322d, 0, y + 1.5 * s, z)
      box(c, w + 1.1 * s, 0.16 * s, w + 1.1 * s, 0x2e2622, 0, y + 2.2 * s, z)
      cone(c, w * 1.05, 1.5 * s, 0x3a322d, 0, y + 3.0 * s, z, 4, Math.PI / 4)
      cone(c, w * 1.18, 0.45 * s, 0x2a2420, 0, y + 2.35 * s, z, 4, Math.PI / 4)
      y += 2.35 * s
    }
    // 金のしゃちほこ
    for (const dx of [-1, 1]) {
      cone(c, 0.2 * s, 0.9 * s, 0xd8ae2e, dx * 0.85 * s, y + 0.75 * s, z, 6)
      box(c, 0.16 * s, 0.35 * s, 0.5 * s, 0xd8ae2e, dx * 0.85 * s, y + 0.3 * s, z)
    }
    // 櫓門（手前の門）と石段、堀
    box(c, 5.2, 2.4, 3.2, 0xf1ecde, 0, 1.2, z + 8.4 * s)
    box(c, 5.6, 0.25, 3.6, 0x2e2622, 0, 2.55, z + 8.4 * s)
    cone(c, 4.1, 1.2, 0x3a322d, 0, 3.3, z + 8.4 * s, 4, Math.PI / 4)
    box(c, 1.9, 1.8, 3.3, 0x2a211a, 0, 0.9, z + 8.4 * s)
    for (let k = 0; k < 5; k++) box(c, 2.4, 0.18, 0.7, 0x8f8c82, 0, 0.09 + k * 0.18, z + 11.2 * s - k * 0.6)
    box(c, 26 * s, 0.06, 3.4, 0x4f7fa8, 0, 0.03, z + 7.4 * s)
    // 城のまわりの松（浜松は、松の城下）
    for (const side of [-1, 1]) for (let k = 0; k < 3; k++) pine(c, side * (9.5 + k * 3.2) * s, z + 2 + k * 2.6, 4.4 + k * 0.5)
    // 白い幟
    for (const dx of [-1, 1]) {
      cyl(c, 0.05, 0.05, 3.2, 0x5e4328, dx * 3.6, 1.6, z + 12, 6)
      box(c, 0.05, 2.2, 0.8, 0xf4efe2, dx * 3.6, 2.1, z + 12.45)
    }
  },
  tower(c) {
    box(c, 4.4, 2.2, 4.4, 0x8c8a82, -7, 1.1, -14)
    box(c, 3.2, 2.2, 3.2, 0xf4f0e6, -7, 3.3, -14)
    cone(c, 3.2, 1.5, 0x3a322d, -7, 5.2, -14, 4, Math.PI / 4)
    box(c, 5, 0.06, 3, 0x5f8fb0, -7, 0.03, -10)
  },
  torii(c, v) {
    const s = v === 'big' ? 2 : 1.4
    const z = -5
    for (const side of [-1, 1]) cyl(c, 0.22 * s, 0.28 * s, 4 * s, 0xc0392b, side * 1.7 * s, 2 * s, z, 12)
    box(c, 6.2 * s, 0.4 * s, 0.7 * s, 0x2a2220, 0, 4.15 * s, z)
    box(c, 5.0 * s, 0.3 * s, 0.35 * s, 0xc0392b, 0, 3.4 * s, z)
    box(c, 0.4 * s, 0.4 * s, 0.4 * s, 0xc0392b, 0, 3.7 * s, z)
  },
  bridge(c, v) {
    const lacq = v === 'red' ? 0xb03a2e : 0x8a6a45
    const n = 16
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1)
      const z = 4 - u * 22
      const y = 0.25 + 1.5 * Math.sin(Math.PI * u)
      box(c, 4.2, 0.28, 1.45, 0x8a6a45, 0, y, z)
      for (const side of [-1, 1]) box(c, 0.16, 0.5, 1.45, lacq, side * 2.0, y + 0.45, z)
    }
    for (const end of [0, 1]) for (const side of [-1, 1]) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), c.m(lacq))
      m.position.set(side * 2.0, 0.95, 4 - end * 22)
      c.g.add(m)
    }
  },
  temple(c) {
    const z = -8
    for (const side of [-1, 1]) cyl(c, 0.3, 0.34, 3.4, 0x7a2e24, side * 2.4, 1.7, z, 10)
    box(c, 7.4, 0.6, 3.6, 0x3a322d, 0, 3.6, z)
    cone(c, 5.4, 1.8, 0x3a322d, 0, 4.7, z, 4, Math.PI / 4)
    box(c, 9.4, 3.6, 7, 0xe3d5b4, 0, 1.8, -19)
    cone(c, 8.6, 3.6, 0x3a322d, 0, 5.4, -19, 4, Math.PI / 4)
    for (let i = 0; i < 5; i++) box(c, 5.6, 0.22, 1.1, 0x9a978d, 0, 0.12 + i * 0.24, -14 - i * 0.2)
    for (const side of [-1, 1]) box(c, 0.8, 1.6, 0.8, 0x9a978d, side * 3.2, 0.8, -4)
  },
  shrine(c) {
    BUILDERS.torii(c, undefined)
    box(c, 7, 2.6, 5.2, 0xefe6cf, 0, 1.3, -17)
    cone(c, 6.8, 2.8, 0x6b4a32, 0, 4.0, -17, 4, Math.PI / 4)
    for (const dx of [-0.6, 0.6]) box(c, 0.12, 1.6, 0.12, 0xefe6cf, dx, 5.6, -17).rotation.z = dx * 1.2
    for (let i = 0; i < 4; i++) box(c, 4, 0.2, 1, 0x9a978d, 0, 0.1 + i * 0.2, -13 - i * 0.1)
  },
  pagoda(c) {
    let y = 0
    for (let k = 0; k < 5; k++) {
      const w = 3.2 - k * 0.5
      box(c, w, 1.3, w, 0xb03a2e, 12, y + 0.65, -16)
      cone(c, w * 1.25, 0.8, 0x3a322d, 12, y + 1.55, -16, 4, Math.PI / 4)
      y += 1.6
    }
    cyl(c, 0.07, 0.07, 2.4, 0xc9a43a, 12, y + 1.2, -16, 6)
  },
  /** 京の町：両側に、格子の町家（二階建て）と、ならぶ軒の提灯。奥に東山 */
  machiya(c) {
    for (let z = 4; z > -34; z -= 3.4) for (const side of [-1, 1]) {
      const x = side * 6.2
      box(c, 4.2, 3.2, 3.0, side < 0 ? 0xcdb48c : 0xd8c5a0, x, 1.6, z)
      box(c, 4.6, 0.2, 3.3, 0x3a322d, x, 3.3, z)
      cone(c, 3.1, 1.1, 0x4b3d36, x, 3.9, z, 4, Math.PI / 4)
      // 格子
      for (let k = 0; k < 6; k++) box(c, 0.07, 1.4, 0.07, 0x3a2a1c, x - side * 2.15, 1.0, z - 1.2 + k * 0.48)
      // 提灯
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), c.m(0xe85a3c))
      lamp.position.set(x - side * 2.3, 2.5, z + 1.1)
      c.g.add(lamp)
    }
  },
  teahouse(c) {
    box(c, 4.4, 2.2, 3.2, 0xcfb58a, -5, 1.1, -3)
    cone(c, 3.6, 1.4, 0x4b3d36, -5, 2.9, -3, 4, Math.PI / 4)
    for (const [i, col] of [0x2f4f8a, 0xf4efe2, 0x2f4f8a].entries()) box(c, 1.1, 1.4, 0.05, col, -6.3 + i * 1.3, 1.5, -1.35)
    box(c, 3, 0.45, 0.8, 0x7a5a38, -2.2, 0.25, 0.4)
    cyl(c, 0.05, 0.05, 2.2, 0x5e4328, -2.2, 1.1, 0.4, 6)
    cone(c, 1.6, 0.6, 0xc0392b, -2.2, 2.4, 0.4, 10)
  },
  teafields(c) {
    for (let i = 0; i < 16; i++) {
      const side = i % 2 === 0 ? -1 : 1
      const cx = side * (8 + c.rand() * 14)
      const cz = 6 - c.rand() * 42
      box(c, 7, 0.05, 5, 0x6e9d4a, cx, 0.02, cz)
      for (let r = 0; r < 5; r++) box(c, 6.4, 0.42, 0.55, 0x2f6b34, cx, 0.22, cz - 2 + r)
    }
  },
  ferry(c, _v, arg) {
    if (arg === 'river') boat(c, -5, RIVER_Z, 0.1, 1.2)
    else {
      boat(c, -18, -4, 1.4, 1.5)
      boat(c, -30, -22, 1.2, 1.1)
    }
    figure(c, 0x3b5a8a, arg === 'river' ? -5.4 : -18.5, 0.5, arg === 'river' ? RIVER_Z : -4)
  },
  porters(c) {
    for (const [x, z] of [[-6, -11], [1, -13.5], [8, -11.5]] as const) {
      box(c, 2.6, 0.22, 1.8, 0x7a5a38, x, 1.5, z)
      for (const dx of [-1.1, 1.1]) for (const dz of [-0.7, 0.7]) {
        figure(c, 0x3b4f7a, x + dx, 0, z + dz, 1.15)
      }
      figure(c, 0xb08a4a, x, 1.5, z, 0.9)
    }
  },
  kanpyo(c) {
    for (let i = 0; i < 6; i++) {
      const side = i % 2 === 0 ? -1 : 1
      const x = side * (5.5 + (i >> 1) * 2.6)
      const z = 2 - (i >> 1) * 6
      for (const dz of [-2.2, 2.2]) cyl(c, 0.07, 0.07, 3.4, 0x5e4328, x, 1.7, z + dz, 6)
      box(c, 0.1, 0.1, 4.6, 0x5e4328, x, 3.3, z)
      for (let k = 0; k < 14; k++) box(c, 0.12, 2.3, 0.02, 0xf4efe0, x, 2.1, z - 2 + k * 0.32)
    }
  },
  indigo(c, v) {
    const cols = v === 'colors' ? [0xc0392b, 0xe0a030, 0x2f6b7a, 0x7b3f8a, 0x2f4f8a] : [0x2f4f8a, 0x27406f, 0x36588f]
    for (let i = 0; i < 9; i++) {
      const side = i % 2 === 0 ? -1 : 1
      const x = side * (4 + c.rand() * 5)
      const z = 4 - i * 2.8
      for (const dx of [-0.6, 0.6]) cyl(c, 0.06, 0.06, 4.2, 0x5e4328, x + dx, 2.1, z, 6)
      box(c, 1.4, 0.08, 0.08, 0x5e4328, x, 4.1, z)
      box(c, 1.1, 3.4, 0.04, cols[Math.floor(c.rand() * cols.length)], x, 2.3, z)
    }
  },
  sekisho(c) {
    const z = -7
    // 関所の門：太い柱と、屋根つきの門
    for (const side of [-1, 1]) cyl(c, 0.34, 0.4, 4.6, 0x5e4328, side * 2.4, 2.3, z, 10)
    box(c, 6.4, 0.5, 0.6, 0x4a3828, 0, 4.7, z)
    box(c, 8, 0.4, 3.6, 0x3a322d, 0, 5.3, z)
    cone(c, 5.6, 1.4, 0x3a322d, 0, 6.1, z, 4, Math.PI / 4)
    // 柵（関所のかこい）
    for (const side of [-1, 1]) for (let k = 0; k < 6; k++) box(c, 0.16, 1.6, 0.16, 0x7a5a38, side * (4 + k * 1.5), 0.8, z)
    for (const side of [-1, 1]) box(c, 8, 0.14, 0.14, 0x7a5a38, side * 7.6, 1.5, z)
    // 番所：縁側と、大きな屋根、白い障子
    box(c, 9, 2.6, 4.6, 0xcfb58a, 0, 1.3, -15)
    box(c, 9.6, 0.25, 1.4, 0x7a5a38, 0, 0.45, -12.1)
    for (let k = 0; k < 4; k++) box(c, 1.6, 1.5, 0.1, 0xf4efe2, -3.3 + k * 2.2, 1.6, -12.7)
    cone(c, 7.0, 1.9, 0x4b3d36, 0, 3.6, -15, 4, Math.PI / 4)
    // 幔幕：白と藍の縞の長い布（関所の目印）
    for (let k = 0; k < 8; k++) box(c, 1.0, 1.8, 0.06, k % 2 ? 0xf4efe2 : 0x24406e, -3.5 + k * 1.0, 3.2, -12.6)
    // 高札場（お触れ書きの札）
    box(c, 2.4, 1.4, 0.12, 0xefe6cf, 5.6, 2.2, -2)
    for (const dx of [-1, 1]) cyl(c, 0.07, 0.07, 2.4, 0x5e4328, 5.6 + dx, 1.2, -2, 6)
    box(c, 3.0, 0.18, 0.6, 0x3a322d, 5.6, 3.0, -2)
    // 役人の持つ長い棒（突棒・袖がらみ）の立て掛け
    for (let k = 0; k < 3; k++) cyl(c, 0.04, 0.04, 3.2, 0x5e4328, -6 + k * 0.35, 1.7, -3, 5)
    // 通行を待つ旅人の列と、役人
    figure(c, 0x2b4a7a, -1.0, 0, -3.2, 1.0)
    figure(c, 0x7a3a2e, 1.1, 0, -1.8, 1.0)
    figure(c, 0x5b7a3a, -0.6, 0, 0.4, 1.0)
    figure(c, 0x222222, 0.2, 0.55, -9.2, 1.15)
    figure(c, 0x222222, -2.6, 0.55, -9.2, 1.15)
  },
  stonegate(c) {
    for (const side of [-1, 1]) {
      box(c, 7, 3, 4, 0x8c8a82, side * 5.4, 1.5, -6)
      box(c, 7.4, 0.3, 4.4, 0x77756c, side * 5.4, 3.1, -6)
    }
  },
  lantern(c) {
    for (const [x, z] of [[3.8, 0], [-3.8, -8]] as const) {
      cyl(c, 0.3, 0.4, 1.0, 0x9a978d, x, 0.5, z, 8)
      cyl(c, 0.16, 0.16, 1.2, 0x9a978d, x, 1.6, z, 8)
      box(c, 0.9, 0.9, 0.9, 0xb8b4a6, x, 2.6, z)
      cone(c, 0.85, 0.7, 0x8a877d, x, 3.35, z, 4, Math.PI / 4)
      const glow = new THREE.PointLight(0xffc880, c.mood === 'night' || c.mood === 'dusk' ? 6 : 0, 12)
      glow.position.set(x, 2.6, z)
      c.g.add(glow)
    }
  },
  signpost(c, _v, arg) {
    box(c, 1.3, 3.6, 0.9, 0x9a978d, 3.8, 1.8, -2)
    const s = sprite(arg ?? '', 9, 2.2, 56)
    s.position.set(3.8, 5.2, -2)
    c.g.add(s)
  },
  rock(c) {
    const r = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 1), c.m(0x8d8a80))
    r.scale.set(1.4, 1.05, 1.1)
    r.position.set(-4.4, 1.2, -6)
    const moss = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 1), c.m(0x5f7d4a))
    moss.scale.set(1.3, 0.5, 1)
    moss.position.set(-4.4, 2.4, -6)
    c.g.add(r, moss)
  },
  tunnel(c) {
    const z = -14
    for (const side of [-1, 1]) box(c, 1.4, 6, 3.2, 0x8c4a3a, side * 3.9, 3, z)
    const arc = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.0, 3.2, 28, 1, true, 0, Math.PI), toon(0x8c4a3a, THREE.DoubleSide))
    arc.rotation.set(Math.PI / 2, 0, Math.PI / 2)
    arc.position.set(0, 6, z)
    c.g.add(arc)
    box(c, 6.4, 6, 0.2, 0x0e0b09, 0, 3, z - 1.4)
    const hill = new THREE.Mesh(new THREE.SphereGeometry(16, 16, 10), c.m(0x5f7d58))
    hill.scale.set(1.5, 0.8, 1)
    hill.position.set(0, -2, z - 12)
    c.g.add(hill)
    // 蔦
    for (let i = 0; i < 16; i++) box(c, 0.1, 1.0 + c.rand(), 0.1, 0x3f7040, (c.rand() - 0.5) * 8, 5.8 + c.rand() * 0.5, z + 1.6)
  },
  horses(c) {
    for (let i = 0; i < 4; i++) {
      const x = 6 + (i % 2) * 2.6
      const z = -5 - Math.floor(i / 2) * 2.6
      const col = [0x6b4a2e, 0x2a2220, 0xcfc4b0, 0x8a5a36][i]
      box(c, 1.7, 0.85, 0.6, col, x, 1.15, z)
      for (const [dx, dz] of [[-0.7, -0.2], [-0.7, 0.2], [0.7, -0.2], [0.7, 0.2]]) box(c, 0.14, 0.8, 0.14, col, x + dx, 0.4, z + dz)
      box(c, 0.45, 0.9, 0.35, col, x + 1.0, 1.7, z).rotation.z = -0.5
      box(c, 0.65, 0.3, 0.3, col, x + 1.4, 2.0, z)
    }
    for (let k = 0; k < 9; k++) box(c, 0.1, 1.0, 0.1, 0x7a5a38, 4.4 + k * 0.7, 0.5, -2.8)
    box(c, 6, 0.08, 0.08, 0x7a5a38, 7.4, 0.9, -2.8)
  },
  hanabi(c) {
    const N = 480
    const pos = new Float32Array(N * 3)
    const col = new Float32Array(N * 3)
    const vel = new Float32Array(N * 3)
    const life = new Float32Array(N).fill(0)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.7, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
    pts.frustumCulled = false
    c.g.add(pts)
    for (let i = 0; i < N; i++) pos[i * 3 + 1] = -50
    let cursor = 0
    let next = 0.4
    const tint = new THREE.Color()
    const burst = (cx: number, cy: number, cz: number) => {
      tint.setHSL(c.rand(), 0.9, 0.62)
      for (let k = 0; k < 90; k++) {
        const i = cursor++ % N
        const a = c.rand() * Math.PI * 2
        const b = Math.acos(2 * c.rand() - 1)
        const sp = 4 + c.rand() * 5
        pos.set([cx, cy, cz], i * 3)
        vel.set([Math.sin(b) * Math.cos(a) * sp, Math.cos(b) * sp, Math.sin(b) * Math.sin(a) * sp], i * 3)
        col.set([tint.r, tint.g, tint.b], i * 3)
        life[i] = 1.8
      }
    }
    c.effects.push((t, dt) => {
      if (t > next) {
        burst(-14 + c.rand() * 28, 13 + c.rand() * 7, -22 - c.rand() * 12)
        next = t + 0.7 + c.rand() * 0.8
        // 手筒花火：地面近くの火花
        for (let k = 0; k < 14; k++) {
          const i = cursor++ % N
          pos.set([3.4, 1.8, -1], i * 3)
          vel.set([(c.rand() - 0.5) * 2.5, 4 + c.rand() * 5, (c.rand() - 0.5) * 2.5], i * 3)
          col.set([1, 0.7, 0.3], i * 3)
          life[i] = 1.1
        }
      }
      for (let i = 0; i < N; i++) {
        if (life[i] <= 0) {
          pos[i * 3 + 1] = -50
          continue
        }
        life[i] -= dt
        vel[i * 3 + 1] -= 6 * dt
        pos[i * 3] += vel[i * 3] * dt
        pos[i * 3 + 1] += vel[i * 3 + 1] * dt
        pos[i * 3 + 2] += vel[i * 3 + 2] * dt
      }
      geo.attributes.position.needsUpdate = true
      geo.attributes.color.needsUpdate = true
    })
    cyl(c, 0.2, 0.22, 1.8, 0xc9b27a, 3.4, 0.9, -1, 8)
  },
  paddies(c) {
    for (let i = 0; i < 16; i++) {
      const side = i % 2 === 0 ? -1 : 1
      const f = box(c, 6 + c.rand() * 8, 0.05, 4 + c.rand() * 6, c.rand() < 0.7 ? 0xa9c06a : 0xc9b86a, side * (7 + c.rand() * 18), 0.02, 6 - c.rand() * 44)
      f.receiveShadow = false
    }
  },
  maples(c) {
    for (let i = 0; i < 46; i++) {
      const side = c.rand() < 0.5 ? -1 : 1
      const x = side * (4.5 + c.rand() * 14)
      const z = 8 - c.rand() * 44
      const h = 3 + c.rand() * 2.5
      cyl(c, 0.12, 0.2, h * 0.6, 0x5e4328, x, h * 0.3, z, 6)
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3 + c.rand() * 0.6, 1), c.m(c.rand() < 0.5 ? 0xc0392b : 0xe08a2e))
      b.position.set(x, h * 0.85, z)
      c.g.add(b)
    }
  },
  steps(c) {
    for (let i = 0; i < 18; i++) {
      const x = (c.rand() - 0.5) * 0.3
      box(c, 3.4, 0.22, 2.2, i % 2 ? 0x8d8a80 : 0x9a978d, x, 0.1 + i * 0.1, 8 - i * 2.2)
    }
    for (const side of [-1, 1]) for (let i = 0; i < 9; i++) box(c, 0.5, 0.7, 4.4, 0x77756c, side * 2.2, 0.35 + i * 0.2, 7 - i * 4.4)
  },
  flowers(c) {
    plane(c, 12, 9, 0x6f9bb8, 9, 0.01, -8, 0.25)
    for (let i = 0; i < 70; i++) {
      const x = 4 + c.rand() * 11
      const z = -3.8 - c.rand() * 8
      cone(c, 0.12, 0.9, 0x3f7040, x, 0.45, z, 4)
      cone(c, 0.16, 0.4, 0x6a4bb0, x, 1.0, z, 5)
    }
  },
  inn(c) {
    box(c, 9, 2.4, 4.4, 0xcfb58a, -7.4, 1.2, -6)
    box(c, 9.4, 2.2, 4.8, 0xd9c9a4, -7.4, 3.5, -6)
    box(c, 9.8, 0.2, 1.4, 0x5a4636, -7.4, 2.45, -3.1)
    cone(c, 7.6, 2.2, 0x3a322d, -7.4, 5.7, -6, 4, Math.PI / 4)
    for (let i = 0; i < 5; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), c.m(0xc0392b))
      m.position.set(-11 + i * 2, 2.1, -3.4)
      c.g.add(m)
    }
  },
  stakes(c) {
    for (const side of [-1, 1]) {
      cyl(c, 0.16, 0.2, 4.2, 0x5e4328, side * 3.2, 2.1, -6, 8)
      box(c, 0.9, 0.5, 0.12, 0xefe6cf, side * 3.2, 3.6, -5.9)
      for (let k = 0; k < 5; k++) box(c, 0.1, 1.0, 0.1, 0x7a5a38, side * (4.4 + k * 1.1), 0.5, -6)
      box(c, 6, 0.08, 0.08, 0x7a5a38, side * 6.7, 0.9, -6)
    }
  },
  harbor(c) {
    for (let i = 0; i < 6; i++) boat(c, -16 - c.rand() * 30, 8 - c.rand() * 40, c.rand() * 2 + 0.6, 0.8 + c.rand() * 0.5, c.rand() < 0.7)
    for (let k = 0; k < 8; k++) box(c, 2, 0.2, 1.6, 0x7a5a38, -11 - k * 1.8, 0.2, 2)
  },
  boats(c) {
    boat(c, -8, RIVER_Z + 1, 0.1, 0.9, false)
    boat(c, 6, RIVER_Z - 2, -0.1, 0.8, true)
    boat(c, 16, RIVER_Z + 2, 0.15, 0.9, false)
  },
}

/** "motif[:variant][=arg]" を、組み立てる */
export function buildMotifs(c: Ctx, motifs: string[]): void {
  for (const raw of motifs) {
    const eq = raw.indexOf('=')
    const head = eq >= 0 ? raw.slice(0, eq) : raw
    const arg = eq >= 0 ? raw.slice(eq + 1) : undefined
    const [name, variant] = head.split(':')
    const b = BUILDERS[name]
    if (b) b(c, variant, arg)
  }
}

/** 天気の粒（雨・雪）。カメラのまわりに降らせる */
export function addWeather(c: Ctx, kind: 'rain' | 'snow'): THREE.Object3D {
  const N = kind === 'rain' ? 700 : 900
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(N * (kind === 'rain' ? 6 : 3))
  for (let i = 0; i < N; i++) {
    const x = (c.rand() - 0.5) * 60
    const z = 14 - c.rand() * 60
    const y = c.rand() * 24
    if (kind === 'rain') pos.set([x, y, z, x - 0.1, y - 1.1, z], i * 6)
    else pos.set([x, y, z], i * 3)
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const obj =
    kind === 'rain'
      ? new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xdbe8f2, transparent: true, opacity: 0.6 }))
      : new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.28, transparent: true, opacity: 0.95 }))
  obj.frustumCulled = false
  c.g.add(obj)
  c.effects.push((t, dt) => {
    const arr = geo.attributes.position as THREE.BufferAttribute
    if (kind === 'rain') {
      for (let i = 0; i < N; i++) {
        let y = arr.getY(i * 2) - 28 * dt
        if (y < 0) y += 24
        arr.setY(i * 2, y)
        arr.setY(i * 2 + 1, y - 1.1)
      }
    } else {
      for (let i = 0; i < N; i++) {
        let y = arr.getY(i) - 1.6 * dt
        if (y < 0) y += 24
        arr.setY(i, y)
        arr.setX(i, arr.getX(i) + Math.sin(t * 0.6 + i) * 0.01)
      }
    }
    arr.needsUpdate = true
  })
  return obj
}

/** 駒（笠をかぶった旅人） */
export function makePiece(color: THREE.Color): THREE.Group {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.44, 0.95, 16), toon(color))
  body.position.y = 0.55
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), toon(0xf1d3b0))
  head.position.y = 1.32
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.34, 16), toon(0xc9b27a))
  hat.position.y = 1.66
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.3), toon(0x6e5636))
  pack.position.set(0, 0.7, -0.38)
  g.add(body, head, hat, pack)
  return g
}


/** 空：上が濃く、地平に向かって明るく（広重の「ぼかし摺り」）。上・中・地平の3色 */
export interface SkyStops {
  top: string
  mid: string
  horizon: string
}

export const SKIES: Record<Exclude<Mood, 'day'>, SkyStops> = {
  morning: { top: '#4a78a6', mid: '#ecd0b6', horizon: '#f2a27a' },
  dusk: { top: '#3d5384', mid: '#dc8e6e', horizon: '#f5bd78' },
  night: { top: '#0a1130', mid: '#1b2a55', horizon: '#33437a' },
  rain: { top: '#6a7a88', mid: '#a5b2ba', horizon: '#d2dadd' },
  snow: { top: '#1c2943', mid: '#3a4b70', horizon: '#8294b4' },
  mist: { top: '#a7b6b2', mid: '#ccd6d2', horizon: '#eaf0ea' },
}

/** 晴れの空は、県の空の色を中ほどにして、上を濃い藍、地平を淡い黄にする */
export function skyFor(mood: Mood, regionSky: string): SkyStops {
  if (mood !== 'day') return SKIES[mood]
  const c = new THREE.Color(regionSky)
  const top = c.clone().lerp(new THREE.Color('#1f5f9a'), 0.85)
  const horizon = c.clone().lerp(new THREE.Color('#fbeec8'), 0.7)
  return { top: `#${top.getHexString()}`, mid: regionSky, horizon: `#${horizon.getHexString()}` }
}

/** 空のドーム：カメラに付いて動く大きな半球。地平は明るく、見上げるほど濃い（頂点の色で、高さごとに決める） */
export function skyDome(stops: SkyStops): THREE.Mesh {
  const R = 150
  const geo = new THREE.SphereGeometry(R, 32, 24)
  const pos = geo.getAttribute('position')
  const top = new THREE.Color(stops.top)
  const mid = new THREE.Color(stops.mid)
  const hor = new THREE.Color(stops.horizon)
  const col = new Float32Array(pos.count * 3)
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    // 高さ 0（地平）〜0.55（見上げた先）で、地平 → 中 → 上 と変える
    const h = Math.max(0, pos.getY(i) / R)
    const t = Math.min(1, h / 0.42)
    if (t < 0.4) c.copy(hor).lerp(mid, t / 0.4)
    else c.copy(mid).lerp(top, (t - 0.4) / 0.6)
    col[i * 3] = c.r
    col[i * 3 + 1] = c.g
    col[i * 3 + 2] = c.b
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  geo.userData.noOutline = true
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }))
  mesh.renderOrder = -1
  return mesh
}

/** 輪郭線：建物・木・岩などの縁に、濃い藍の細い線を引く（地面・空・天気は除く）。部品が多すぎるときは引かない */
export function outlineAll(group: THREE.Object3D, color = 0x1d2a44, maxMeshes = 700): number {
  const meshes: THREE.Mesh[] = []
  group.traverse((o) => {
    const m = o as THREE.Mesh
    if (m.isMesh && m.geometry && !(m.geometry as THREE.BufferGeometry).userData.noOutline) meshes.push(m)
  })
  if (meshes.length > maxMeshes) return 0
  const mat = new THREE.LineBasicMaterial({ color })
  let n = 0
  for (const m of meshes) {
    const geo = m.geometry as THREE.BufferGeometry
    const pos = geo.getAttribute('position')
    if (!pos || pos.count > 2000) continue
    const type = geo.type
    // 平らな地面（板）には引かない
    if (type === 'PlaneGeometry') continue
    const line = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 35), mat)
    m.add(line)
    n += 1
  }
  return n
}
