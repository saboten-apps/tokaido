// 絵の取り込み：art-inbox/ の画像（マスの名前.png・.jpg・.webp。例：箱根.png）を、
// 192×192 の webp にして public/art/ へ置き、src/art/overrides.json に、マスの名前 → 画像の URL を書く。
// 使い方：node scripts/importArt.mjs        （art-inbox/README.md も参照）
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, basename, join } from 'node:path'
import sharp from 'sharp'

const INBOX = 'art-inbox'
const OUT = 'public/art'
const MANIFEST = 'src/art/overrides.json'
const SIZE = 192
const EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp'])

const board = JSON.parse(await readFile('src/data/board.json', 'utf8'))
const names = new Set([...board.main, ...board.forks.flatMap((f) => f.laneTiles)].map((t) => t.name))

const files = existsSync(INBOX) ? (await readdir(INBOX)).filter((f) => EXTS.has(extname(f).toLowerCase())) : []
const manifest = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, 'utf8')) : {}
await mkdir(OUT, { recursive: true })

let done = 0
for (const f of files) {
  const name = basename(f, extname(f))
  if (!names.has(name)) {
    console.warn(`スキップ：「${name}」という名前のマスがありません（${f}）`)
    continue
  }
  const file = `${name}.webp`
  await sharp(join(INBOX, f)).resize(SIZE, SIZE, { fit: 'cover', position: 'centre' }).webp({ quality: 82 }).toFile(join(OUT, file))
  manifest[name] = `/art/${encodeURIComponent(name)}.webp`
  done += 1
  console.log(`取り込み：${f} → ${OUT}/${file}`)
}
const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b, 'ja')))
await writeFile(MANIFEST, JSON.stringify(sorted, null, 2) + '\n')
console.log(`${done}枚を取り込みました（登録は全部で ${Object.keys(sorted).length}枚）`)
