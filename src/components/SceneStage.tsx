// 3D の場面。止まった土地ごとに、その土地の世界を立てる（浜松なら浜松城、箱根なら関所と芦ノ湖と山…）。
// 何マス進んでも、道は歩かず、場面を切り替える（ワープ）。何を立てるか・時間と天気は src/data/scenes.json、部品は sceneKit.ts。
// three.js は、この画面を開いたときだけ読み込む（遅延読み込み）。

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { pieceColors } from '../art/theme'
import { REGIONS, regionAt, shukuNumber } from '../engine'
import scenesJson from '../data/scenes.json'
import { PrintCard } from './parts'
import { MOODS, addWeather, buildMotifs, makeCtx, makePiece, type Mood } from './sceneKit'
import type { BoardState, Player } from '../types/game'

interface SceneDef {
  motifs: string[]
  mood: Mood
}
export const SCENES = scenesJson as Record<string, SceneDef>

interface Props {
  board: BoardState
  players: Player[]
  activeId: string | null
  focusId: string | null
  positions: Record<string, number>
  /** 小地図で押された位置（押すと、その場所の場面を、しばらく見学できる） */
  jump?: { index: number; n: number } | null
  /** 旅人が道を歩いているあいだ（歩いて遠ざかり、通る場所の名前が順に点く）。着いたら、次の場面へ */
  travel?: { id: string; playerId: string; via: string[]; ms: number } | null
}

const QS = new URLSearchParams(window.location.search)
/** ?stats=1：描画の速さ（FPS）を出す。?lite=1：軽量（アンチエイリアスなし・解像度を落とす） */
const SHOW_STATS = QS.has('stats')
const LITE = QS.has('lite')
const FADE_MS = 900

function hash(s: string): number {
  let h = 2166136261
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return h >>> 0
}

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

export default function SceneStage({ board, players, activeId, focusId, positions, jump, travel }: Props) {
  const box = useRef<HTMLDivElement | null>(null)
  const statsEl = useRef<HTMLDivElement | null>(null)
  const live = useRef({ players, activeId, focusId, positions })
  useEffect(() => {
    live.current = { players, activeId, focusId, positions }
  })

  // 道を歩く：旅人が遠ざかる（その時間と、だれが歩くか）。次の場面では、その旅人が、遠くから歩いてくる
  const travelRef = useRef<{ start: number; ms: number; playerId: string } | null>(null)
  const walkIn = useRef<string | null>(null)
  useEffect(() => {
    if (!travel) return
    travelRef.current = { start: performance.now(), ms: travel.ms, playerId: travel.playerId }
    walkIn.current = travel.playerId
    // 同じ道中の間は、一度だけ（id が変わったときに、やり直す）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [travel?.id])

  // 見学（小地図で押した場所）
  const [preview, setPreview] = useState<number | null>(null)
  useEffect(() => {
    if (!jump) return
    setPreview(jump.index)
    const t = setTimeout(() => setPreview(null), 7000)
    return () => clearTimeout(t)
  }, [jump])

  const actual = positions[focusId ?? ''] ?? 0
  const want = preview ?? actual
  const [shown, setShown] = useState<number | null>(null)
  const [fade, setFade] = useState(false)

  // 場面の切り替え：暗転 → 場面を作り直す → 明るく
  useEffect(() => {
    if (shown === null) {
      setShown(want)
      return
    }
    if (want === shown) return
    setFade(true)
    const t = setTimeout(() => {
      setShown(want)
      setFade(false)
    }, FADE_MS)
    return () => clearTimeout(t)
  }, [want, shown])

  useEffect(() => {
    const el = box.current
    if (!el || shown === null) return
    const tile = board.tiles[shown]
    const def: SceneDef = SCENES[tile.name] ?? { motifs: ['street'], mood: 'day' }
    const region = REGIONS[regionAt(board, shown)]
    const mood = MOODS[def.mood]

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !LITE })
    } catch {
      el.textContent = '3D 表示にはWebGLが必要です。地図表示に切り替えてください。'
      return
    }
    renderer.setPixelRatio(LITE ? 1 : Math.min(window.devicePixelRatio, 2))
    el.appendChild(renderer.domElement)
    renderer.domElement.setAttribute('data-testid', 'board3d-canvas')

    const sky = new THREE.Color(mood.sky ?? region.sky)
    const fogColor = new THREE.Color(mood.fog ?? region.fog)
    renderer.setClearColor(sky)
    const scene = new THREE.Scene()
    scene.background = sky
    scene.fog = new THREE.Fog(fogColor, mood.near, mood.far)
    scene.add(new THREE.HemisphereLight(def.mood === 'night' ? 0x6f86c8 : 0xfff6e0, 0x8a7a55, mood.hemi))
    const sun = new THREE.DirectionalLight(mood.sunColor, mood.sun)
    sun.position.set(def.mood === 'dusk' || def.mood === 'morning' ? -20 : -10, def.mood === 'dusk' ? 8 : 18, 8)
    scene.add(sun)

    const world = new THREE.Group()
    scene.add(world)
    const ctx = makeCtx(world, rng(hash(tile.name)), region, def.mood)
    // 地面と道
    const groundMat = new THREE.MeshStandardMaterial({ color: mood.ground ?? region.ground, roughness: 1 })
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.set(0, -0.06, -40)
    world.add(ground)
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(260, 120), new THREE.MeshStandardMaterial({ color: mood.ground ?? region.grass, roughness: 1 }))
    grass.rotation.x = -Math.PI / 2
    grass.position.set(0, -0.05, -70)
    world.add(grass)
    const road = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.1, 80), new THREE.MeshStandardMaterial({ color: def.mood === 'snow' ? 0xdfe6ee : region.road, roughness: 1 }))
    road.position.set(0, 0.0, -24)
    world.add(road)

    buildMotifs(ctx, def.motifs)
    if (mood.particles) addWeather(ctx, mood.particles)

    // 駒：その場所にいる旅人だけを、手前に並べる
    const pieces = new Map<string, THREE.Group>()
    players.forEach((p, idx) => {
      const g = makePiece(new THREE.Color(pieceColors[idx % pieceColors.length]))
      world.add(g)
      pieces.set(p.id, g)
    })

    const camera = new THREE.PerspectiveCamera(56, 1, 0.1, 260)
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
    let last = t0
    let frames = 0
    let lastStat = t0
    const tick = () => {
      const now = performance.now()
      const t = (now - t0) / 1000
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      // カメラ：場面のはじめに、遠くから寄って、そのあとは、ゆっくり揺れる
      const k = Math.min(1, t / 3)
      const e = 1 - Math.pow(1 - k, 3)
      const az = THREE.MathUtils.lerp(-0.95, -0.12, e) + (k >= 1 ? Math.sin(t * 0.25) * 0.09 : 0)
      const R = THREE.MathUtils.lerp(42, 27, e)
      const y = THREE.MathUtils.lerp(2.0, 4.8, e)
      camera.position.set(Math.sin(az) * R, y, -9 + Math.cos(az) * R)
      camera.lookAt(0, 5.2, -10)
      // 旅人：その場所にいる人だけ、手前に並べる。道を歩く旅人は、遠ざかる。着いた旅人は、遠くから歩いてくる
      const cur = live.current
      const tr = travelRef.current
      const walkingNow = tr !== null && now - tr.start < tr.ms + 150
      const trp = walkingNow && tr ? Math.min(1, (now - tr.start) / tr.ms) : 0
      let slot = 0
      const here = cur.players.filter((p) => (cur.positions[p.id] ?? 0) === shown)
      for (const p of cur.players) {
        const g = pieces.get(p.id)
        if (!g) continue
        const present = (cur.positions[p.id] ?? 0) === shown
        g.visible = present
        if (!present) continue
        const baseX = (slot - (here.length - 1) / 2) * 1.15 * 1.4 - 1.6 * 1.4
        slot += 1
        g.scale.setScalar(1.5)
        const bob = Math.abs(Math.sin(t * 9)) * 0.14
        if (walkingNow && tr && p.id === tr.playerId) {
          const e = trp < 0.5 ? 2 * trp * trp : 1 - Math.pow(-2 * trp + 2, 2) / 2
          g.position.set(baseX, 0.15 + bob, 2.4 + (-38 - 2.4) * e)
          g.rotation.y = Math.PI
        } else if (walkIn.current === p.id && t < 1.9) {
          const q = Math.min(1, t / 1.9)
          const e = 1 - Math.pow(1 - q, 2)
          g.position.set(baseX, 0.15 + bob, -34 + (2.4 + 34) * e)
          g.rotation.y = 0
        } else {
          if (walkIn.current === p.id && t >= 1.9) walkIn.current = null
          g.position.set(baseX, 0.15 + (p.id === cur.activeId ? Math.abs(Math.sin(t * 4)) * 0.25 : 0), 2.4)
          g.rotation.y = 0.35
        }
      }
      // 道を歩くあいだは、カメラも、前へ進む
      if (trp > 0) {
        camera.position.z -= trp * trp * 12
        camera.lookAt(0, 5.2, -10 - trp * 16)
      }
      for (const fx of ctx.effects) fx(t, dt)
      renderer.render(scene, camera)
      frames += 1
      if (SHOW_STATS && statsEl.current && now - lastStat >= 500) {
        statsEl.current.textContent = `${Math.round((frames * 1000) / (now - lastStat))} FPS ／ 描画 ${renderer.info.render.calls} 回 ／ 三角形 ${renderer.info.render.triangles}${LITE ? ' ／ 軽量' : ''}`
        frames = 0
        lastStat = now
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
        const mats = Array.isArray(mat) ? mat : mat ? [mat] : []
        for (const x of mats) {
          ;(x as THREE.SpriteMaterial).map?.dispose?.()
          x.dispose()
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
    // 場面を作り直すのは、止まる場所が変わったとき（旅人の位置・手番は live から読む）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, players.length])

  const tile = shown !== null ? board.tiles[shown] : null
  const no = shown !== null ? shukuNumber(board, shown) : null
  const region = shown !== null ? REGIONS[regionAt(board, shown)] : null
  return (
    <div className="scene-wrap">
      <div className="board3d" ref={box} data-testid="board3d" />
      <div className="scene-fade" style={{ opacity: fade ? 1 : 0 }} aria-hidden />
      {tile && (
        <div className="scene-print">
          <PrintCard name={tile.name} compact />
        </div>
      )}
      {tile && region && (
        <div className="scene-caption" key={tile.name} data-testid="scene-caption">
          <div className="scene-name">{tile.name}</div>
          <div className="scene-sub">
            {no !== null ? `江戸から${no}番目の宿場・` : ''}
            {region.name}（{region.province}）
            {preview !== null && preview !== actual && <span className="scene-tour">見学中</span>}
          </div>
        </div>
      )}
      {travel && (
        <>
          <div className="travel-lines" aria-hidden />
          <div className="travel-strip" data-testid="travel-strip" key={travel.id}>
            {travel.via.map((n, i) => (
              <span key={i}>
                {i > 0 && <span className="travel-arrow">→</span>}
                <span className="travel-chip" style={{ animationDelay: `${Math.round((i / Math.max(1, travel.via.length)) * travel.ms * 0.85)}ms` }}>
                  {n}
                </span>
              </span>
            ))}
          </div>
        </>
      )}
      {SHOW_STATS && <div className="stats3d" ref={statsEl} data-testid="stats3d" />}
    </div>
  )
}
