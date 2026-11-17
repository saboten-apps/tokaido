# AI エージェント向け開発ルール

東海道五十三次のすごろく。エンジンと仕組みは `saboten-apps/umaregacya` から流用（コピーして作り替え。元は変えない）。流用の判断は `docs/REUSE_PLAN.md`、今の状態は `docs/HANDOFF.md`。

- 作業後は必ず `npm run check`（lint + unit test + build）を通す。画面を変えたら `npm run test:e2e` も通す。
- `src/engine/` に React・DOM・`localStorage` を持ち込まない。保存は `src/storage/saveGame.ts` のみ。
- 乱数は `Math.random()` を直接使わず、引数の `Rng` を使う（`rng.ts` の `randomSeed` のみ例外）。
- エンジンの公開関数は受け取った `GameState` を変更しない（`structuredClone` してから更新する）。
- `GameState` / `Player` の構造を変えたら `SCHEMA_VERSION` を上げ、`saveGame.ts` の `MIGRATIONS` に移行とテストを書く。
- バランス値は `src/data/balance.json`、盤面は `src/data/board.json`。変えたら `npm run simulate` で確認する。
- 出来事は `src/events/*.json`。ID とタイトルは一意、条件なしの選択肢を 1 つ以上。時代の人々をからかわず、旅の面白さに寄せる。
- 絵は `src/art/theme.ts` だけで差し替える（仮の絵＝色と記号）。
- 認証情報をコード・コミット・文書に書かない。main へのマージ・PR 作成・デプロイは、ユーザーが指示したときだけ。
- 作業の終わりに `docs/HANDOFF.md` を更新する。
