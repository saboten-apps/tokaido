// 広重『東海道五拾三次』の絵の取り込み。権利の表示（credit）のない絵は、入れない。
//
// 使い方
//   npm run import:hiroshige -- --credit "出どころ・権利の表示"
//       art-inbox/hiroshige/ の画像（ファイル名＝マスの名前。例：箱根.jpg）を、public/hiroshige/*.webp にして、
//       src/data/hiroshige.json に登録する。図ごとに違う出どころは art-inbox/hiroshige/credits.json に
//       { "箱根": { "credit": "...", "source": "https://..." }, "*": { "credit": "..." } } と書く（"*" は、書いていない図の既定）。
//   npm run import:hiroshige -- --met
//       メトロポリタン美術館のオープンアクセス（CC0）から、候補を探して一覧にする（まだ取り込まない）。
//       一覧を見て、よければ  --met --apply  で、取り込む（--min / --max で、資料番号の範囲を絞れる）。
//
// 絵を入れたら、docs/ASSETS.md に出どころを書いて、npm run check・npm run test:e2e を通す。

import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import sharp from 'sharp'

const args = process.argv.slice(2)
const opt = (name: string, def: string): string => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : def
}
const flag = (name: string): boolean => args.includes(`--${name}`)

const INBOX = opt('inbox', 'art-inbox/hiroshige')
const OUT = opt('out', 'public/hiroshige')
const MANIFEST = opt('manifest', 'src/data/hiroshige.json')
const WIDTH = 1000

interface Entry {
  plate: number
  station: string
  subtitle: string
  image?: string
  credit?: string
  source?: string
}
type Manifest = Record<string, Entry>
interface Credit {
  credit?: string
  source?: string
}

async function loadManifest(): Promise<Manifest> {
  return JSON.parse(await readFile(MANIFEST, 'utf8')) as Manifest
}

async function saveImage(buf: Buffer | string, name: string): Promise<string> {
  await mkdir(OUT, { recursive: true })
  await sharp(buf).resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: 80 }).toFile(join(OUT, `${name}.webp`))
  return `/${basename(OUT)}/${encodeURIComponent(name)}.webp`
}

/** 手元の画像を取り込む */
async function importLocal(): Promise<void> {
  const manifest = await loadManifest()
  if (!existsSync(INBOX)) {
    console.log(`${INBOX} がありません。画像（ファイル名＝マスの名前）を置いてください。`)
    return
  }
  const credits: Record<string, Credit> = existsSync(join(INBOX, 'credits.json')) ? JSON.parse(await readFile(join(INBOX, 'credits.json'), 'utf8')) : {}
  const fallback: Credit = { ...(credits['*'] ?? {}), ...(opt('credit', '') ? { credit: opt('credit', '') } : {}) }
  const files = (await readdir(INBOX)).filter((f) => ['.png', '.jpg', '.jpeg', '.webp', '.tif', '.tiff'].includes(extname(f).toLowerCase()))
  let done = 0
  for (const f of files) {
    const name = basename(f, extname(f))
    if (!manifest[name]) {
      console.warn(`スキップ：「${name}」という図はありません（${f}）`)
      continue
    }
    const c = { ...fallback, ...(credits[name] ?? {}) }
    if (!c.credit) {
      console.warn(`スキップ：「${name}」に出どころ（credit）がありません。--credit か credits.json で指定してください`)
      continue
    }
    manifest[name].image = await saveImage(join(INBOX, f), name)
    manifest[name].credit = c.credit
    if (c.source) manifest[name].source = c.source
    done += 1
    console.log(`取り込み：${f} → ${OUT}/${name}.webp`)
  }
  await writeFile(MANIFEST, JSON.stringify(manifest, null, 1) + '\n')
  console.log(`${done}枚を取り込みました（絵のある図は、全部で ${Object.values(manifest).filter((e) => e.image).length}枚）`)
}

// ---- メトロポリタン美術館（オープンアクセス、CC0） ----
const MET = 'https://collectionapi.metmuseum.org/public/collection/v1'

/** 英語の題名に出る、宿の名前（マクロンなし・小文字） */
const ROMAJI: Record<string, string> = {
  日本橋: 'nihonbashi', 品川: 'shinagawa', 川崎: 'kawasaki', 神奈川: 'kanagawa', 保土ヶ谷: 'hodogaya', 戸塚: 'totsuka', 藤沢: 'fujisawa', 平塚: 'hiratsuka',
  大磯: 'oiso', 小田原: 'odawara', 箱根: 'hakone', 三島: 'mishima', 沼津: 'numazu', 原: 'hara', 吉原: 'yoshiwara', 蒲原: 'kanbara', 由比: 'yui', 興津: 'okitsu',
  江尻: 'ejiri', 府中: 'fuchu', 鞠子: 'mariko', 岡部: 'okabe', 藤枝: 'fujieda', 島田: 'shimada', 金谷: 'kanaya', 日坂: 'nissaka', 掛川: 'kakegawa',
  袋井: 'fukuroi', 見附: 'mitsuke', 浜松: 'hamamatsu', 舞坂: 'maisaka', 新居: 'arai', 白須賀: 'shirasuka', 二川: 'futagawa', 吉田: 'yoshida', 御油: 'goyu',
  赤坂: 'akasaka', 藤川: 'fujikawa', 岡崎: 'okazaki', 池鯉鮒: 'chiryu', 鳴海: 'narumi', 宮: 'miya', 桑名: 'kuwana', 四日市: 'yokkaichi', 石薬師: 'ishiyakushi',
  庄野: 'shono', 亀山: 'kameyama', 関: 'seki', 坂下: 'sakanoshita', 土山: 'tsuchiyama', 水口: 'minakuchi', 石部: 'ishibe', 草津: 'kusatsu', 大津: 'otsu',
  '京都 三条大橋': 'kyoto',
}

interface MetObject {
  objectID: number
  title: string
  objectDate: string
  objectURL: string
  artistDisplayName: string
  isPublicDomain: boolean
  primaryImage: string
}

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`)
  return (await r.json()) as T
}

const normalize = (t: string): string => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

async function importMet(): Promise<void> {
  const manifest = await loadManifest()
  const q = opt('q', 'Hiroshige Fifty-three Stations of the Tokaido')
  const min = Number(opt('min', '0'))
  const max = Number(opt('max', '99999999'))
  const res = await getJson<{ total: number; objectIDs: number[] | null }>(`${MET}/search?hasImages=true&isPublicDomain=true&q=${encodeURIComponent(q)}`)
  const ids = (res.objectIDs ?? []).filter((id) => id >= min && id <= max)
  console.log(`検索「${q}」：${res.total}件（範囲内 ${ids.length}件）。資料を調べます…`)
  const found: Record<string, MetObject[]> = {}
  for (const id of ids) {
    let o: MetObject
    try {
      o = await getJson<MetObject>(`${MET}/objects/${id}`)
    } catch (e) {
      console.warn(String(e))
      continue
    }
    if (!o.isPublicDomain || !o.primaryImage || !/hiroshige/i.test(o.artistDisplayName)) continue
    const title = normalize(o.title)
    const hit = Object.entries(ROMAJI).find(([, r]) => title.startsWith(`${r}:`) || title.startsWith(`${r} `))
    if (hit) (found[hit[0]] ??= []).push(o)
    await new Promise((r) => setTimeout(r, 120))
  }
  console.log('\n宿ごとの候補（資料番号・題名・年代）。複数あれば、版の違うものが混ざっています。--min / --max で範囲を絞ってください。')
  for (const name of Object.keys(ROMAJI)) {
    const list = (found[name] ?? []).sort((a, b) => a.objectID - b.objectID)
    console.log(`${name.padEnd(8)} ${list.length === 0 ? '（候補なし）' : list.map((o) => `${o.objectID}「${o.title}」${o.objectDate}`).join(' ／ ')}`)
  }
  if (!flag('apply')) {
    console.log('\n（まだ取り込んでいません。よければ --met --apply を付けて、もう一度実行してください）')
    return
  }
  let done = 0
  for (const [name, list] of Object.entries(found)) {
    const o = list.sort((a, b) => a.objectID - b.objectID)[0]
    if (!manifest[name]) continue
    const r = await fetch(o.primaryImage)
    if (!r.ok) {
      console.warn(`画像が取れません：${name}（${o.primaryImage}）`)
      continue
    }
    manifest[name].image = await saveImage(Buffer.from(await r.arrayBuffer()), name)
    manifest[name].credit = `The Metropolitan Museum of Art, Open Access（CC0）。資料番号 ${o.objectID}`
    manifest[name].source = o.objectURL
    done += 1
    console.log(`取り込み：${name} ← ${o.objectID}「${o.title}」`)
  }
  await writeFile(MANIFEST, JSON.stringify(manifest, null, 1) + '\n')
  console.log(`${done}枚を取り込みました`)
}

await (flag('met') ? importMet() : importLocal())
