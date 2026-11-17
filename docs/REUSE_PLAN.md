# umaregacya からの流用計画（2026-11-17 調査・ユーザー承認済み）

調査元：`saboten-apps/umaregacya` の `main`（`29e1789`）。元のコードは変更しない。コピーして作り替える。
`board.ts`・`session.ts` は人生固有のモジュールと密に結びついているので、骨組み（状態の進め方・型の形）を写し、中身は旅向けに書き直す。

| ファイル | 判定 | 内容 |
|---|---|---|
| `rng.ts` | そのまま | コピー済み |
| `stats.ts` | 作り替え（小） | 路銀・体力・思い出・評判 |
| `events.ts` | 作り替え | 条件判定・重み抽選・選択肢の適用。年齢・職業・学歴・犯罪を外した |
| `board.ts` | 骨組みのみ | 分かれ道・脇道・合流と、複製してから更新する形。周回をやめ、京都で止まる。必ず止まるマス（関所・川） |
| `session.ts` | 作り替え | TurnControl・判断待ち・submitAction/runUntilHuman/advanceOne。干渉・アイテム・捨て身・収監を外し、「働いて稼ぐ」と到着済みの飛ばしを追加 |
| `turn.ts` | 大半を捨てる | 加齢・年収・死亡。終了は「全員到着 or 日数上限」 |
| `setup.ts`・`cpu.ts` | 作り替え | プレイヤー生成・性格の重み評価 |
| `scoring.ts`・`simulate.ts` | 作り替え | 路銀・思い出・評判・名物・到着順 |
| `room.ts`・`online/`・`worker/` | ほぼそのまま（MVP後） | `createGame` と設定だけ差し替え。OGP・計測・リダイレクトは持ってこない |
| `saveGame.ts` | 作り替え | 封筒・段階的な移行の仕組み。v1 から |
| `components/board/` | 2D で新規 | 3D は重いので、SVG の一本道 |
| `balance.json`・`events/*.json` | 形式のみ | 中身は新規 |
| 捨てる | — | crime / shadow / realEstate / marriage / singularity / era / upheaval / decade / upbringing / promotion / lifeTitle / death / lastResort / interference / items / fortune / goals / chronicle（旅日記として作り直す候補） |
