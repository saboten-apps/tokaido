// 3D の盤面（試作）。2D と同じ座標（boardLayout）を、地面の上の街道として立てる。three.js は、この画面を開いたときだけ読み込む（遅延読み込み）。
// 駒の位置（positions）は、2D と同じものを受け取り、なめらかに追いかける。

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { pieceColors, tileArt } from '../art/theme'
import { SPACING, layoutBoard } from './boardLayout'
import type { BoardState, Player } from '../types/game'

const UNIT = 2 / SPACING // 2D の座標 → 世界の座標（マス間は 2）

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
  c.width = 256
  c.height = 64
  const g = c.getContext('2d')!
  g.font = `${bold ? 'bold ' : ''}34px "Hiragino Mincho ProN","Yu Mincho",serif`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.lineWidth = 8
  g.strokeStyle = 'rgba(246,239,224,0.95)'
  g.strokeText(text, 128, 34)
  g.fillStyle = '#2b2118'
  g.fillText(text, 128, 34)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }))
  s.scale.set(4, 1, 1)
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

export default function Board3D({ board, players, activeId, focusId, positions, jump }: Props) {
  const box = useRef<HTMLDivElement | null>(null)
  const live = useRef({ players, activeId, focusId, positions, jump })
  live.current = { players, activeId, focusId, positions, jump }
  const manual = useRef<{ n: number; until: number } | null>(null)

  useEffect(() => {
    const el = box.current
    if (!el) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true })
    } catch {
      el.textContent = '3D 表示にはWebGLが必要です。2D表示に切り替えてください。'
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0xefe3c8)
    el.appendChild(renderer.domElement)
    renderer.domElement.setAttribute('data-testid', 'board3d-canvas')

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0xefe3c8, 28, 70)
    scene.add(new THREE.HemisphereLight(0xfff4dc, 0x9a8460, 1.9))
    const sun = new THREE.DirectionalLight(0xffffff, 1.6)
    sun.position.set(-8, 16, 10)
    scene.add(sun)

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 140)
    const pts = layoutBoard(board).map((p) => new THREE.Vector3(p.x * UNIT, 0, p.y * UNIT * 1.4))
    const road = new THREE.Group()
    scene.add(road)

    // 地面
    const xs = pts.map((p) => p.x)
    const minX = Math.min(...xs) - 30
    const maxX = Math.max(...xs) + 30
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(maxX - minX, 90), new THREE.MeshStandardMaterial({ color: 0xcdbf93, roughness: 1 }))
    ground.rotation.x = -Math.PI / 2
    ground.position.set((minX + maxX) / 2, -0.16, 8)
    scene.add(ground)

    // 街道（マスとマスをつなぐ）
    const roadMat = new THREE.MeshStandardMaterial({ color: 0xa88b5f, roughness: 1 })
    const link = (a: THREE.Vector3, b: THREE.Vector3) => {
      const len = a.distanceTo(b)
      const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.12, 0.7), roadMat)
      m.position.copy(a).lerp(b, 0.5)
      m.position.y = -0.05
      m.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x)
      road.add(m)
    }
    for (let i = 0; i < board.mainLength - 1; i++) link(pts[i], pts[i + 1])
    for (const f of board.forks) {
      link(pts[f.tileIndex], pts[f.laneStart])
      for (let k = 0; k < f.laneLength - 1; k++) link(pts[f.laneStart + k], pts[f.laneStart + k + 1])
      link(pts[f.laneStart + f.laneLength - 1], pts[f.mergeIndex])
    }

    // マス
    board.tiles.forEach((t, i) => {
      const big = t.type === 'shuku' || t.type === 'start' || t.type === 'goal' || t.type === 'fork'
      const r = big ? 0.85 : 0.6
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, big ? 0.42 : 0.28, 28), new THREE.MeshStandardMaterial({ color: tileArt[t.type].fill, roughness: 0.7 }))
      m.position.copy(pts[i])
      m.position.y = 0.1
      scene.add(m)
      if (t.mustStop) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r + 0.08, 0.07, 8, 32), new THREE.MeshStandardMaterial({ color: 0xf5d76e }))
        ring.rotation.x = Math.PI / 2
        ring.position.copy(pts[i])
        ring.position.y = 0.32
        scene.add(ring)
      }
      if (big || t.mustStop) {
        const s = label(t.name, big)
        s.position.copy(pts[i])
        s.position.y = 1.9
        s.position.z += 0.2
        scene.add(s)
      }
    })

    // 景色：松並木・山・富士
    const rand = rng(7)
    const trunk = new THREE.MeshStandardMaterial({ color: 0x6b4a2b })
    const leaf = new THREE.MeshStandardMaterial({ color: 0x3f6b3a, flatShading: true })
    for (let i = 0; i < board.mainLength * 3; i++) {
      const base = pts[Math.floor(rand() * board.mainLength)]
      const side = rand() < 0.5 ? -1 : 1
      const x = base.x + (rand() - 0.5) * 4
      const z = base.z + side * (2.2 + rand() * 7)
      const h = 1.3 + rand() * 1.2
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, h * 0.5, 6), trunk)
      tr.position.set(x, h * 0.25 - 0.1, z)
      const lf = new THREE.Mesh(new THREE.ConeGeometry(0.55 + rand() * 0.3, h, 7), leaf)
      lf.position.set(x, h * 0.5 + h * 0.2, z)
      scene.add(tr, lf)
    }
    const mountain = new THREE.MeshStandardMaterial({ color: 0x7d8f6a, flatShading: true })
    for (let i = 0; i < 26; i++) {
      const x = minX + 10 + rand() * (maxX - minX - 20)
      const m = new THREE.Mesh(new THREE.ConeGeometry(3 + rand() * 4, 4 + rand() * 6, 6), mountain)
      m.position.set(x, 1.5, -16 - rand() * 14)
      scene.add(m)
    }
    // 富士（原〜吉原のあたり）
    const near = board.tiles.findIndex((t) => t.name === '吉原')
    const fx = (near >= 0 ? pts[near].x : (minX + maxX) / 2) + 4
    const fuji = new THREE.Mesh(new THREE.ConeGeometry(11, 15, 24), new THREE.MeshStandardMaterial({ color: 0x4a5f86, flatShading: true }))
    fuji.position.set(fx, 6.8, -30)
    const cap = new THREE.Mesh(new THREE.ConeGeometry(4.2, 5.6, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true }))
    cap.position.set(fx, 12.6, -30)
    scene.add(fuji, cap)

    // 駒
    const pieces = new Map<string, THREE.Group>()
    players.forEach((p, idx) => {
      const g = new THREE.Group()
      const color = new THREE.Color(pieceColors[idx % pieceColors.length])
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.9, 16), new THREE.MeshStandardMaterial({ color }))
      body.position.y = 0.55
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), new THREE.MeshStandardMaterial({ color: 0xf1d3b0 }))
      head.position.y = 1.3
      const hat = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.3, 16), new THREE.MeshStandardMaterial({ color: 0xc9b27a }))
      hat.position.y = 1.62
      g.add(body, head, hat)
      g.userData.id = p.id
      scene.add(g)
      pieces.set(p.id, g)
    })

    // 描画
    const target = new THREE.Vector3()
    const camPos = new THREE.Vector3()
    let ready = false
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
    const tick = () => {
      const cur = live.current
      const slot = new Map<number, number>()
      cur.players.forEach((p) => {
        const idx = cur.positions[p.id] ?? 0
        const n = slot.get(idx) ?? 0
        slot.set(idx, n + 1)
        const g = pieces.get(p.id)
        const base = pts[Math.min(idx, pts.length - 1)]
        if (!g || !base) return
        const want = new THREE.Vector3(base.x + (n - 0.5) * 0.55, 0.3 + (p.id === cur.activeId ? Math.abs(Math.sin((performance.now() - t0) / 260)) * 0.25 : 0), base.z + 0.05)
        g.position.lerp(want, ready ? 0.22 : 1)
      })
      if (cur.jump && cur.jump.n !== (manual.current?.n ?? -1)) manual.current = { n: cur.jump.n, until: performance.now() + 4000 }
      const f = pieces.get(cur.focusId ?? '') ?? [...pieces.values()][0]
      if (manual.current && performance.now() < manual.current.until && cur.jump) target.lerp(pts[Math.min(cur.jump.index, pts.length - 1)], 0.1)
      else if (f) target.lerp(f.position, ready ? 0.08 : 1)
      camPos.set(target.x + 2, 12.5, target.z + 15)
      camera.position.lerp(camPos, ready ? 0.08 : 1)
      camera.lookAt(target.x, 0.5, target.z - 1)
      ready = true
      renderer.render(scene, camera)
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

  return <div className="board3d" ref={box} data-testid="board3d" />
}
