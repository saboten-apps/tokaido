# 東海道すごろく

江戸・日本橋から京都・三条大橋まで、東海道を旅するすごろく（2〜6人・人間＋CPU）。
京都に着いたときの得点（路銀・思い出・評判・名物・到着順）で競う。路銀が尽きても脱落せず、「働いて稼ぐ」で立て直せる。

```
npm install
npm run dev        # 開発サーバー
npm run check      # lint + 単体テスト + ビルド
npm run test:e2e   # 画面のテスト（Playwright）
npm run simulate   # CPU 同士で大量に回してバランスを見る（身分ごとの勝率）
npm run test:e2e:online  # オンライン対戦のテスト（wrangler dev に2つのブラウザでつなぐ）
npm run dev:online # ローカルの Worker で、オンライン対戦を試す
node scripts/importArt.mjs  # art-inbox/ の絵を取り込む（art-inbox/README.md）
```

構成：`src/engine/`（ルール。画面なし）・`src/online/`・`worker/`（オンライン対戦。Cloudflare Workers ＋ Durable Objects）・`src/data/`（数値・盤面）・`src/events/`（出来事）・`src/storage/`（保存）・`src/components/`（2D 画面）・`src/art/`（仮の絵）。
URL の `?seed=数` で展開を固定、`?fast=1` で CPU の番を待たずに進める。
