# 最終デザインへ向けた道具（2026-11-17 ユーザーの質問への答え）

「デザインは、最終的には大幅に変える」。変えやすくするための作りと、使える道具。

## いまの作り（差し替えやすいところ）
- 2D の絵：`src/art/theme.ts` と `art-inbox/`（`scripts/importArt.mjs`）。マスの名前で、画像を差し替える。
- 県ごとの色・紹介：`src/data/regions.json`。3D の場面：`src/data/scenes.json`（どの土地に何を立てるか・時間と天気）と、部品 `src/components/sceneKit.ts`。部品ごとに、glTF のモデルへ差し替えられる（同じ名前の `BUILDERS` の中身を、モデルの読み込みに変える）。
- 画面の部品：`src/components/parts.tsx`（旅人の札・行動・選択肢・場所カード）、`src/index.css`（色は `:root` の変数）。
- 数値・文章は JSON（`balance.json`・`events/*.json`・`places.json`）なので、見た目と独立して直せる。

## 道具（用途別）
| 用途 | 候補 | メモ |
|---|---|---|
| 画面の設計・モック | **Figma** | スマホ縦の画面（盤面・札・選択肢・結果）を先に描く。色・文字・間隔を決めてから、`index.css` の変数に写す。Claude の Design 型（キャンバス）でも、モックを作れる |
| 浮世絵風の絵（マス・イベント・駒） | 画像生成（Midjourney・Stable Diffusion・Adobe Firefly など）、手描き（Procreate・Krita・Clip Studio） | 商用利用の条件・既存作品に似すぎていないかを確かめる（`docs/ASSETS.md`）。広重の原画はパブリックドメインだが、美術館の写真は条件を確認 |
| 3D のモデル（駒・家・橋・城・鳥居・五重塔） | **Blender**（低ポリ）→ glTF（`.glb`）で書き出し | three.js の `GLTFLoader` で読める。いまは、図形（円柱・円錐・箱）で組んでいる |
| 3D の確認・調整 | three.js editor、Spline | 配置・光・カメラの見え方を、コードなしで試せる |
| 色・字 | Coolors（配色）、Google Fonts（和文：Zen Old Mincho・Shippori Mincho・Kaisei など） | 書体は、CSP のない通常の Web なので、そのまま読み込める |
| 音 | OhMyGame（umaregacya の記録 `docs/TODO.md` 33 に、「駒のイラスト・3D・音の素材が必要になったら」とある手段。詳細は、このセッションでは未確認） | |

## 進め方（案）
1. Figma で、スマホ縦の画面を数枚（盤面・札・選択肢・結果）。
2. 素材の方針を決める（絵：浮世絵風の2D／3D のモデル化）。
3. 小さく差し替え：まず1県（静岡）で、2D の絵・3D のモデル・色を入れて、見え方と重さを確かめる。
4. 良ければ、ほかの県へ広げる。差し替えのたびに `npm run check`・e2e、3D は `?stats=1` で速さを確認。
