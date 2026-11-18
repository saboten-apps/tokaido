# 引き継ぎ（東海道すごろく）

## いまの状態（2026-11-17 時点）
- **遊べるもの**：ひとり＋CPU、同じ端末で複数人（最大4人）、オンライン対戦（ローカルの Worker で動作確認済み。**デプロイは未**）。盤面は2D（SVG）と3D（試作）。宿場は53次すべて（各宿に専用イベント）、汎用の出来事30件、旅人の身分6つ、称号8つ、旅日記、遊び方、PWA のアイコンとマニフェスト。
- **ブランチ**：`ccr-abfd3fc6-lcu3t4`（main へのマージ・PR・デプロイは、ユーザーが指示したときだけ）。
- **テスト**：`npm run check`（単体82件）、`npm run test:e2e`（24件）、`npm run test:e2e:online`（3件）、`npm run simulate`。
- **セーブ**：SCHEMA_VERSION 3（v1→v2→v3 の移行あり）。
- 流用計画：`docs/REUSE_PLAN.md`。これからの設計案：`docs/ROADMAP.md`。素材の権利：`docs/ASSETS.md`。
- **ユーザーに確認・用意してもらうもの**：①スマホ実機での3Dの重さ（`?stats=1`）、②Cloudflare の Worker 名とトークン（デプロイ用）、③絵の素材（`art-inbox/README.md`）、④「要確認」の名物の一次資料（下の「記録」）。

## 決めたこと（2026-11-17 ユーザー承認）
- 流用表のとおり。umaregacya は変えない。
- 画面は 2D（SVG）。地図どおり右が江戸、左が京都。脇道は本道の下。
- 1ラウンド（全員が1回ずつ動く）＝1日。日の終わりに、宿場にいれば宿代を払って体力回復、それ以外（または宿代不足）は野宿（体力・評判が少し減る）。
- 終了：全員が京都に着く、または `maxDays`（40日）を過ぎる。先に着いた人は待つ。京都は出目が余っても止まる。
- 路銀は 0 未満にならない。脱落なし。手番で「振る」の代わりに「働いて稼ぐ」（進まない・路銀+）。
- 体力が `tiredStamina` 未満だと出目が3まで（疲れ）。
- 必ず止まるマス（`mustStop`）：箱根（関所）・大井川（分かれ道）・新居（関所）。
- 大井川の分かれ道：本道「川越し人足を雇う」（-300文・早い）／脇道「川明けを待つ」（3マス遠回り・川止め宿の専用イベント・思い出）。
- 得点：路銀50文=1点・思い出×1・評判×0.5・名物1つ8点・到着20点＋到着順ボーナス。

## 2D の演出（ROADMAP C、2026-11-17）
- 駒の移動：`rolled` の `path` を1マスずつ（0.12秒/マス）。動いているあいだは、操作の欄と判断の画面を隠し、CPU の次の手も待つ。サイコロは大きく出る（早足は「早足＋2」）。
- 小地図（`MiniMap`）：本道全体の帯。盤面と同じ向き（右が日本橋）。全員の位置を点で見せ、押すとそこへスクロール。
- 通知：増えた道中記の行を、画面の上に3秒ほど出す（最大3件）。人間が京都に着くと、到着の表示。
- 演出を省くとき：`?fast=1`（CPU の番を待たない）、または OS の「動きを減らす」設定。
- 最初の表示は、日本橋の側へ直接移る（以前は京都の側から、ゆっくり動いていた）。
- 補助関数は `src/components/feedback.ts`（テストあり）。

## 早足と野宿（ROADMAP A1・A3、2026-11-17）
- 早足（`hurry`）：出目に+2マス、体力-10。体力35以上のときだけ。CPU は流儀の `hurryLove`（急ぎ旅0.8・人情家0.2・堅実0.15・食い道楽0.1）で、体力に余裕があれば選ぶ。
- 野宿が2日続くと、旗 `camped2` で疲れ（出目が3まで。宿に泊まれば戻る）。セーブの形は変えていない（旗で持つ）。
- 到着順ボーナスを [62,40,24,12,6,0] に（急ぎ旅は1.4番目・32.7日目に着く一方、思い出・名物が少ない）。

## 宿の格・本陣・称号・旅日記（ROADMAP A2・A4、2026-11-17）
- **セーブは SCHEMA_VERSION 2**（`Player.lodging`・`GameState.diary` を追加。移行は `MIGRATIONS[1]`、テストあり）。
- 泊まり方：木賃宿（宿代0.5倍・体力+12）／旅籠（1倍・+22）。手番のはじめに、いつでも切り替え（番は進まない）。CPU は路銀が宿代の4倍未満なら木賃宿。評判70以上は、宿場で日が終わると本陣に招かれる（無料・体力+30・思い出+2。シミュレーションでは1人0.04回と稀）。数値は `balance.json` の `lodging`。
- 称号：`src/data/titles.json`（条件式）。京都に着いた人だけが、結果画面で得る。取得率（CPU4人×400）：川止めの客41%・思い出の旅人38%・名物通27%・一番乗り25%・関所の顔16%・人望の旅人8%・思い出ぶくろ3%。「倹約の旅人」（路銀1000文以上で到着）は CPU では0%（人間なら狙える）。
- 旅日記：`GameState.diary`。出来事・関所・名物・分かれ道・本陣・到着を、日・場所つきで記録。結果画面の「〇〇の東海道」で読む。

## 場所の解説：時代背景と今では（2026-11-17、ユーザーの要望）
- `src/data/places.json`（キーはマスの名前。`era`＝時代背景、`now`＝今では〔現代の豆知識〕）。57か所：53宿・日本橋・京都 三条大橋・大井川・鈴鹿峠など。画面は、`PlaceCard`（盤面の下に、いまいる場所の解説。「江戸から◯番目の宿場・県名（旧国名）」つき。折りたたみ可）と、結果画面の「旅の手帖（訪ねた場所）」。テスト：`places.test.ts`（キーが盤面にある・53宿すべてに時代背景がある）。
- **確認の度合い**：検索で確認できたことを、事実として書いた（本陣・旅籠の数〔天保14年の記録〕、川越制度1696〜1870、新居関所、関宿の重伝建1984、草津宿本陣、桑名の鳥居、岡部の宇津ノ谷、吉原の左富士、白須賀の津波、袋井の中間点 など）。伝承は「伝わる」「という」と書いた。**一次資料までは確認していない**。確認が薄いもの：原（朝之富士）・江尻（追分羊かん）・鳴海（有松の絞り）・水口・亀山・石薬師・藤枝・舞坂・四日市は、短く控えめに書いてある。日本橋（1603・1911）・品川駅（1872・所在地は港区高輪）・掛川城天守（1994復元）・三条大橋の刀傷（伝承）は、広く知られた事実として書いたが、このセッションでは検索していない。
- 数値・年代を直したいときは、`places.json` だけを直せばよい（コードの変更は要らない）。

## 画面の更新（2026-11-17、ユーザーの要望）
- **体力はゲージ**（`StaminaGauge`。旅人の札と、行動の欄。疲れる境目の印つき。色は余裕・注意・疲れ）。**選択肢のボタンに、結果の数値**（体力+8・路銀-30文など。運試しは成功率と、失敗のときの結果。分かれ道も）。**宿代にもマイナス**（宿代 -120文）。
- **基本は3D＝「場面」**（2026-11-17 ユーザー：「旅してる感が薄い。浜松なら城がある。場面ごとに世界が変わってよい。3マス進むなら3マス歩かなくてよい。ワープしてよいから、その土地の情報をしっかり見せたい」）。止まった土地ごとに、その土地専用の世界を立てる（`src/components/SceneStage.tsx`）。**道は歩かず、場面を切り替える**（ワープ：サイコロの目 → 暗転 → 次の土地の場面。2Dの「地図」では、これまでどおり、マスを1つずつ進む）。
  - 場面の中身は `src/data/scenes.json`（マスの名前 → `motifs`〔部品の並び〕と `mood`〔時間・天気〕）。部品は `src/components/sceneKit.ts` の `BUILDERS`（街並み・松並木・杉・海・湖・川・富士・山・城・櫓・鳥居・橋・寺・神社・五重塔・茶屋・茶畑・渡し舟・川越し人足・かんぴょう干し・藍染・関所・石垣の門・灯籠・立て札・夜泣き石・トンネル・馬・花火・田んぼ・紅葉・石畳・かきつばた・旅籠・棒鼻・港・川舟）。書き方：`部品[:種類][=引数]`（例：`castle:big`、`fuji:left`、`signpost=東海道 どまん中`、`ferry=river`）。
  - 例：浜松＝大きな城＋街並み＋松並木／箱根＝関所＋芦ノ湖＋山（朝の霧）／小田原＝城＋海／吉田＝橋＋城＋手筒花火（夜）／蒲原＝雪の夜の町（広重『夜之雪』）／土山＝石畳＋茶畑＋雨／関＝鳥居＋長い町並み／大井川＝川越し人足と輦台／京都＝三条大橋＋五重塔＋紅葉（夕暮れ）。時間・天気：昼・朝・夕・夜・雨・雪・霧。
  - 場面の見せ方：はじめに遠くから寄って、そのあとゆっくり揺れる。土地の名前・「江戸から◯番目の宿場」・県名が、場面の左下に大きく出る（`scene-caption`）。場面の下に、いままでどおり、時代背景と今ではの解説カード。その場所にいる旅人が、手前に立つ（笠の旅人）。小地図を押すと、その土地の場面を7秒見学できる（「見学中」の表示）。
  - 切り替えボタン：「地図で見る」「場面で見る」。**道を歩く追いかけカメラの3D（旧 `Board3D.tsx`）は、場面に置き換えて削除した**（git の履歴にある）。
  - 注意：3D の部品は、図形（箱・円柱・円錐・球）の組み合わせの仮のもの。最終デザインで、Blender のモデル（glTF）などに差し替える前提（`docs/DESIGN_PLAN.md`）。
- 県の内訳（テストで固定）：東京1宿・神奈川9・静岡22・愛知9・三重7・滋賀5（計53）。境目：箱根までが神奈川、三島から静岡、二川から愛知、桑名から三重、土山から滋賀。

## 3D の盤面（試作、ROADMAP F、2026-11-17）
- `src/components/Board3D.tsx`（three.js。`React.lazy` で、3D を開いたときだけ読み込む：約547KB・gzip 136KB の別チャンク）。2D と同じ座標（`boardLayout`）を地面の上の街道にし、マス（種類の色・必ず止まるマスは金の輪）・名前の札・松並木・山・富士・駒（笠の旅人）を立てる。カメラは焦点の駒を追う（小地図で押した所を4秒映す）。駒は、2D と同じ `positions` を、なめらかに追いかける。
- 切り替え：画面の上の「3D表示／2D表示」（`localStorage` に覚える）。WebGL が使えなければ、メッセージを出す。ひとり用・オンラインの両方で使える。
- **実機での重さの測り方**：URL に `?stats=1` を付けると、3D の左上に FPS・描画回数・三角形の数が出る。`?lite=1` で軽量（アンチエイリアスなし・解像度1倍）。例：`/?stats=1`、`/?stats=1&lite=1`。**実機の数字は未確認**（ヘッドレス Chromium のソフトウェア描画で、描画・駒の追従・切り替えは確認した）。
- 試作の割り切り：マスの絵（`artFor` の画像）は、3D では使っていない（色だけ）。駒は共通の形。夜・天気・水面なし。

## オンライン対戦（ROADMAP D2、2026-11-17）
- **ローカルで動作確認済み**：`npm run test:e2e:online`（`wrangler dev --local` に、2つのブラウザでつなぎ、部屋づくり→招待リンクで入室→身分の選択→準備→開始→最後まで→同じ結果、を確認。約3分）。
- 構成：`src/engine/room.ts`（ロビー・席・身分・持ち時間・切断・自動プレイ）／`src/online/protocol.ts`（通信の形式。行動は厳しく検証）／`roomServer.ts`（認証・重複送信の防止・猶予・アラーム。純粋な関数）／`client.ts`（WebSocket・つなぎ直し・ack・再送）／`worker/`（`index.ts` が入口、`roomDO.ts` が Durable Object）／`wrangler.jsonc`。画面は `src/components/online/OnlineScreen.tsx`（入口・ロビー・対戦・結果）と、共有部品 `src/components/parts.tsx`。umaregacya のものを旅向けに作り替えた（1ターンの年数・人生の目標を外し、身分の選択を足した）。
- 遊び方：タイトル画面の「オンラインで遊ぶ」→ 部屋をつくる → コード（5文字）か招待リンク（`/?room=CODE`）を伝える。席が余れば CPU が埋める。持ち時間は1人45秒、続けて2回切らすと CPU が代わりに進める（「自分で続ける」で戻れる）。切断しても、8秒の猶予のあとに自動プレイで進み、つなぎ直せば席に戻れる。
- オンラインでも、駒の移動アニメーション・サイコロの目・通知が出る（サーバーから届く進行の記録 `steps` を順番に再生。`?fast=1` か「動きを減らす」設定で省略）。
- **未**：ひとり用とオンラインの演出コードの共通化（いまは `GameScreen` と `OnlineScreen` に、同じ形の再生処理が2つある）。
- **デプロイするには**（ユーザーが決めてから）：Cloudflare の Worker 名（`wrangler.jsonc` の `name`、いまは `tokaido-sugoroku`）と認証情報（トークン）が要る。`npm run build` → `npx wrangler versions upload --assets dist`（プレビュー）、`npx wrangler deploy`（本番。ユーザーの指示があるときだけ）。Durable Object は SQLite 方式（`migrations`）。**この環境には認証情報がないので、デプロイは未実施**。
- 注意：Claude のプレビューページ（静的な1枚）では、オンラインは動かない（Worker がないため）。

## 旅人の身分（ROADMAP H、2026-11-17）
- **セーブは SCHEMA_VERSION 3**（`Player.role` を追加。移行は `MIGRATIONS[2]`＝「ふつうの旅人」に。v1 からも続けて移行でき、テストあり）。
- 身分は6つ（`balance.json` の `roles`）：ふつうの旅人（初期路銀+300）／商人（路銀+200・体力-10・働く+60文）／伊勢参りの旅人（評判+4）／飛脚（体力+20・路銀+260・早足の体力4）／旅芸人（路銀-500・評判+5・働くと思い出+2）／武士（路銀+950・宿代1.25倍・関所で手形の選択肢）。人間はタイトル画面で選ぶ（説明つき）。CPU は重ならないように配られ、判断の流儀は身分から決まる（`roles.<id>.personality`）。
- 職業（就職・昇進）は作らない（ユーザー決定）。
- 身分ごとの勝率（`npm run simulate` が出す。全員が同じ強さなら 1/人数）：2人=ふ52・旅56・武52・商50・伊53・飛35／4人=ふ24・旅25・武27・伊26・商27・飛21／6人=ふ16・旅18・武17・伊16・商15・飛19。飛脚が2・4人でやや弱い（早足のぶん、思い出・名物を取りこぼす）。
- 調整の経緯：初期路銀の差が、思ったより強く効いた（武士+1200・宿代1.2倍だと6人で34%）。伊勢参りの「名所の思い出+3」は強すぎたので0にした。堅実の重みも調整（路銀2→1.3・思い出1→1.35・評判1→1.1）。

## 同じ端末で複数人（ROADMAP D1、2026-11-17）
- タイトル画面で「遊ぶ人の数」（1〜4）と名前、全体の人数（遊ぶ人＋CPU、最大6）を選ぶ。エンジンは `createGame({ humanNames })`（変更なし）。手番の人は、操作の欄の「〇〇の番」と、判断の画面の上の名前で分かる。
- 結果画面の旅日記は、遊んだ人ごとに切り替えて読める（`diary-tab-<id>`）。
- 注意：同じ画面を共有するので、他の人の路銀・体力は、旅人の札で全員に見える（隠さない）。

## 評判・思い出の効果（2026-11-17 ユーザー決定「効果を持たせる」）
- 評判（`balance.json` の `reputation`）：45以上で宿代が0.75倍、20未満で1.25倍（`innCostFor`）。関所（箱根・新居）に「評判45以上」の特別な選択肢、旅人との出会いに「評判45以上」の追加の選択肢。
- 野宿の評判の減り（`campReputation`）は0にした（-1だと評判が上がらず、60以上は1%だった）。評判は、働く・人助けの出来事・特別な選択肢で動く。
- 思い出は、いまも得点だけ。使い道の案：一定数ごとの称号、旅日記。

## 盤面（53次・案C、2026-11-17 ユーザー確認）
日本橋＋53宿（品川〜大津）＋京都 三条大橋＋有名な峠・渡しなど14マス（高輪の大木戸・六郷の渡し・大磯の松並木・箱根の山道・芦ノ湖と富士・薩埵峠・丸子の茶屋・小夜の中山・浜名の今切・岡崎の城下・七里の渡し・関の茶屋・鈴鹿峠・琵琶湖のほとり）＋大井川（分かれ道）。**本道70マス（スタートからゴールまで69マス）＋脇道3マス＝73マス**。`src/data/board.json`。
- 以前は宿場のあいだに汎用マスを1つずつ挟んで108マスだった（ユーザーの意図は「53マス」に近かったため、案Cに縮めた）。
- 宿場に止まると、専用イベントがなければ `shukuEventChance`（0.5）で、汎用の出来事が起きる。
- 名物のある宿場は**17**（以前の記録の「27」は数え間違いで、正しくは23。2026-11-17 の見直しで、確認できないものを外して17）。ない宿場は、泊まるだけ。江戸時代の名物と確認できたものだけを置く（下の「記録」）。
- 必ず止まるマス：箱根（関所）・大井川（分かれ道）・新居（関所）。
- 脇道の専用イベントは、旗 `lane:<大井川のマス番号>`（いま31）で起きる。盤面を変えて番号が動くと、`src/events/lane.json` の旗も直す（テストで検出）。
- 平均手番数（サイコロだけ）：本道21.6・脇道22.5・疲れ続き35.8・早足14.4（計算：`pathFrom` を使った動的計画法）。

## シミュレーション（案C以前の記録。最新は「記録」を参照）
- 4人：到着率100%・到着 平均39日目・終了44日・平均得点164・名物6.2個・働く14%・野宿17回・脇道53%
- 流儀ごとの勝率（4人）：食い道楽32%・人情家30%・堅実24%・急ぎ旅14%
- 調整：maxDays 30→60、初期路銀2000→3000、宿代200→120、1歩の体力消費3→2、野宿の体力-10→-8、働く350→300、到着順ボーナス[24,16,10,6,3,0]→[50,34,22,12,6,0]
- 急ぎ旅が弱いまま：出目は流儀に関係なく同じなので、急ぎ旅の利点（寄り道・名物の省略）が足りない。名物を買わない・働かない分だけ早く着く、という差を、流儀に持たせる（例：急ぎ旅は体力が減りにくい、など）のが候補

## 次にやること（候補）
- バランス：急ぎ旅の弱さ、野宿の多さ（宿場マス以外で日が終わることが多い）の調整
- 出来事を増やす（宿場ごとの専用イベント。いまは汎用30件＋専用53件）。名物のない26宿に名物・一言紹介を足す
- 長い盤面の表示：駒の移動のアニメーション、全体の小地図
- 演出：駒の移動アニメーション、サイコロ表示
- 同じ端末で複数人（`humanNames` はエンジン対応済み・画面は未対応）
- オンライン（umaregacya の `room.ts`・`online/`・`worker/` を移植）
- 旅日記（umaregacya の chronicle を作り直す）

## 記録（新しいものを上に）

- 2026-11-18 **取り込み**：`antigravity/scenes-1`（デザイン改善 Phase1〜5・FIX1・FIX2・全55宿の場面作り込み）を、このブランチ（ccr-abfd3fc6-lcu3t4）にマージ（`03e7c9e`）。単体129・e2e50・online3 通過。リアル版の箱根試作は、`antigravity/real-hakone-1`（ローカルのみ・未push）。次：絵の主役の風物（桑名の帆船・浜松の大松と焚き火・鳴海の絞り・馬と旅人など）をデザイン担当へ差し戻し。

- 2026-11-18 **全55宿の3D場面作り込み（広重風：図形＋平らな色）（Antigravity／デザイン）**：
  - **ブランチ**：`antigravity/scenes-1`
  - **コミット**：
    - `95eaf90` 第1群（1〜10：日本橋〜小田原）
    - `3da9261` 第2群（11〜20：箱根〜府中）
    - `c6adef6` 第3群（21〜30：鞠子〜浜松）
    - `cc393fe` 第4群（31〜40：舞坂〜池鯉鮒）
    - `833aa6f` 第5群（41〜50：鳴海〜土山）
    - `5158039` 第6群（51〜55：水口〜京都 三条大橋）
  - **変更点**：
    1. 広重風3D表現の導入（`src/components/sceneKit.ts`）：
       - 山（`mountains:layered`、`mountains:round`、`cliff`）：単一円錐から多層カラー積層（藍・黄土・深緑）および急峻な断崖・丸山へ刷新。
       - 水（`river:wide`、`sea:wide`、`bay`）：画面全体に広がるベロ藍（プルシアンブルー）のグラデーション水面。
       - 遠景・霞（`distanthills`、`kasumi`）：輪郭線を排した淡い遠山並みと伝統の「すやり霞」帯。
       - 風物部品の大幅拡充：大名行列（`procession`）、魚河岸（`fishmarket`）、蕎麦屋（`soba`）、土手・飛脚（`dike`）、満月（`moon`）、湿地（`marsh`）、雪屋根（`snowroofs`）、紅白梅（`plum`）、大凧（`kite`）、薬缶（`kettle`）、蘇鉄（`sotetsu`）、大鳥居（`torii:grand`）、千石船群（`ships`）、干瓢干し（`gourd`）など。
    2. 全55宿（全73マス）の構成最適化（`src/data/scenes.json`）：
       - 保永堂版浮世絵（`public/hiroshige/`）および `src/data/places.json` の時代背景に基づき、全73場面の `motifs` と `mood` を完全リファイン。
    3. 代表5場面を含む11宿の比較画像生成（`shots-scenes/`）：
       - 箱根・浜松・蒲原・桑名・京都 三条大橋（代表5宿）を含む全11宿について、広重浮世絵とスマホ幅（390px）3D描画の左右比較画像を生成。
  - **確認結果**：
    - `npm run check`：oxlint 0 warning / 0 error、vitest 14 files / 129 tests passed、tsc build 成功（615ms）。
    - `npm run test:e2e`：Playwright 50 tests 全件 passed。
    - `npm run test:e2e:online`：Playwright 3 tests 全件 passed（2ブラウザ実接続対戦含む）。
    - 部品数（Mesh）検証：全73場面測定、最大は「京都 三条大橋」の 392 個（輪郭線対象 389 個）。全場面が上限 500 個以下（`outlineAll` 上限 700 個未満）を完全にクリア。
    - 描画速度（`?stats=1`）：スマホ幅（Pixel 7、390px相当）E2Eにて安定動作（約 8 FPS / 描画 348 回 / 三角形 7098、headless ソフトウェア描画環境）。
  - **史実・確認事項**：広重浮世絵および `places.json` に記載された確かな風物・景観のみを採用。
  - **次にやること**：さぼてんによるパッチ化、実機スマホでの描画体感確認、本番環境への反映検討。

- 2026-11-18 **デザイン改善 FIX2：スマホ幅での操作ドック折りたたみと場面可視性確保（Antigravity／デザイン）**：
  - **ブランチ**：`antigravity/design-1`
  - **変更点**：
    1. 操作ドック（`.dock`）の折りたたみUI化：スマホ幅（640px以下）において、「サイコロを振る」と「宿場をめざす」を主行動として常時表示し、早足・泊まり方・働くは「ほかの行動 ▾」（`data-testid="dock-more"`）でアコーディオン開閉する構造に変更。
    2. 場面（`.board3d`）表示領域の適正化：スマホ表示高さを 315px（min-height 300px）に調整し、上部要素（topbar/minimap）の余白およびドックの高さをコンパクト化。幅390×高さ664pxの閉状態において、場面の表示領域 315px（画面高さの 47.44%）を確保（要件 45% 以上を達成）。開いた際はドックが前面に展開され各行動を選択可能。
    3. PC幅（1280px）の現行表示維持：メディアクエリ（641px以上）にてトグルボタンを非表示化し、全行動を横並びで常時展開するレイアウトを維持。
    4. E2Eテスト適応：`e2e/journey.spec.ts` でモバイル実行時に「ほかの行動」を開く操作を追加し、全50件パス。
  - **検証**：`npm run check`（oxlint 0 errors / 0 warnings、vitest 129 passed、tsc build 成功）、`npm run test:e2e`（50 passed）、`npm run test:e2e:online`（3 passed）。確認用スクリーンショットを `shots-fix2/` に保存。

- 2026-11-18 **デザイン改善 FIX1：結果画面のスマホ幅表示修正（順位表の旅人列・スタンプ帳グリッド）（Antigravity／デザイン）**：
  - **ブランチ**：`antigravity/design-1`
  - **変更点**：
    1. 順位表の「旅人」列（スマホ幅390px）：旅人名（`traveler-name`）の nowrap＋最小幅確保、身分（`role-sub`）を名前の下に小さく横書き表示、列の padding（7px 3px）とフォントサイズ（12px / th 11px）調整を実施。名前が1文字ずつ縦に折れていた問題を解消し、表全体が390px幅に横オーバーフローなしで美しく収まるよう改善。PC幅（768px以上）では名前と身分の横並び（inline）を維持し、2カラム表示を保護。
    2. 宿場スタンプ帳のグリッド（スマホ幅390px）：順位表の横オーバーフロー解消によりページ全体の横スクロール（435px→390px）が消滅。あわせてスタンプ帳の padding（8px 10px）とグリッド（`minmax(52px, 1fr)`、gap 5px）を最適化し、右端の見切れ・はみ出しなく画面内に完全収容。
  - **検証**：`npm run check`（oxlint 0 errors / 0 warnings、vitest 14 files / 129 passed、tsc build 成功）、`npm run test:e2e`（50 passed）。スマホ幅（390px）およびPC幅（1280px）のスクリーンショットを `shots-fix1/` に保存。

- 2026-11-18 **デザイン改善 Phase 1〜5（Antigravity／デザイン）**：
  - **ブランチ**：`antigravity/design-1`
  - **変更点**：
    1. Phase 1 デザイン基盤：和の伝統色（墨 `#2b2825`、朱 `#b33e2b`、山吹 `#c98e28`、藍 `#1e3a5f`、和紙 `#f8f4ec`）、書体階層（Zen Old Mincho / Shippori Mincho）、和紙質感テクスチャ、木札・木版風コンポーネントを `src/index.css` に集約・統一。
    2. Phase 2 重なり崩れ解消＆共通UI刷新：3D場面のスマホ表示高さを 230px に適正化し、下部操作ドック（`.dock`）との重なり・潜り込み・文字切れを解消。アクションボタン、体力ゲージ（竹細工・印籠調）、イベントカットイン（定式幕調）、モーダルを刷新。
    3. Phase 3 画面別刷新：
       - タイトル（`TitleScreen.tsx`）：広重『日本橋 朝之景』の額装アイキャッチ、落款印、宿帳風フォーム、PC幅2カラム見開き。
       - ゲーム（`SceneStage.tsx`, `BoardView.tsx`, `parts.tsx`）：白木道標風宿場看板、浮世絵小窓の黒漆額縁、街道二重線、PlaceCard の短冊タグ付き道中案内記風デザイン。
       - 結果（`ResultScreen.tsx`）：表彰状・絵巻物風ヘッダー、道中勘定帳風テーブル、落款風称号チップ、PC幅2カラム化。
    4. Phase 4 3D場面（`sceneKit.ts`）：toonシェーディングの和紙温かみ調整、朝焼け・夕暮れ・広重ブルーの空ぼかしグラデーション調整（ポリゴン数・部品数は維持）。
  - **確認結果**：
    - `npm run check` 通過（oxlint 0エラー/0警告、vitest 14 files / 129 tests passed、tsc build 成功）。
    - `npm run test:e2e` 通過（Playwright 50 tests 全件 passed）。
    - スマホ幅（390px）およびPC幅で目視・スクリーンショット撮影確認済み（8枚保存、重なり崩れ解消確認）。
  - **次にやること**：実機（スマホ実機）での 3D レンダリング負荷（`?stats=1`）の確認、オンライン対戦（Worker）のデプロイ準備。


- 2026-11-17 **書体**：Google Fonts の Zen Old Mincho（見出し・場所名・カットイン・称号）と Shippori Mincho（本文）。`index.html` で読み込み、`--font-display` / `--font-body`。読めないときは端末の明朝体。※オフライン（PWA）では端末の明朝体になる。e2e「3D は場面」の assertion を、時代背景のない土地でも通るよう直した。

- 2026-11-17 **3D を広重風に**：①toon（3段の平らな色）②輪郭線（`outlineAll`・LITE では引かない）③空のドーム（頂点色のぼかし。`skyDome`）④紙の縁・紙の目（`.scene-wrap::after`）。**場面の作り込み**：浜松城（石垣の段・多層天守・しゃちほこ・櫓門・堀・松）、箱根関所（門・番所・幔幕・高札場・列の旅人・役人）、京都（町家の並び `machiya`）。※e2e の「3D は場面」は、並列で重いと稀に落ちる（単独では通る）。

- 2026-11-17 **広重の絵55枚を取り込み**（メトロポリタン美術館 CC0・保永堂版）。Met の公開データ（CSV）で宿場ごとの資料番号を決め（`scripts/metHoeido.json`）、objects API で `isPublicDomain` を確認して取得。紙のふち・色見本を切って webp 化（`public/hiroshige/` 6.7MB）。出どころは `docs/ASSETS.md` と `hiroshige.json`。※このセッションからは、search API が bot 対策でブロックされるため、CSV と objects API を使った。

- 2026-11-17 スタンプを押した瞬間の印の演出（`useStampPop`・`StampPop`）。スタンプ帳の並びを詰めた。

- 2026-11-17 面白さの強化 2：①**天気**（`weather.ts`：種と日から決まる。雨は1歩ごとに体力-1。場面も雨の景色。画面上に表示）②**同宿の語らい**（同じ宿場に泊まった旅人は思い出+2。`lodging.shared`）。単体129・e2e48・online3 通過。シミュレーション 4人：勝率 飛脚18%〜旅芸人27%。

- 2026-11-17 面白さの強化 1：①**宿場をめざす**（`stroll` 行動：宿場で止まる。CPU は流儀の `strollLove`）②**宿場スタンプ**（`Player.visited`、止まった宿場だけ。1つ1点＝`scoring.stampPoints`。SCHEMA 5・移行・テスト、称号「宿場めぐり(20)」「宿場の通(30)」、スタンプ帳 UI）③**演出の速さ**（ゆっくり/ふつう/はやい、`speed.ts`）。バランス：旅芸人の開始路銀 -820、飛脚 +560（4人の勝率 19〜29%）。単体124・e2e46・online3 通過。

- 2026-11-17 場面転換を遅く：道を歩く 2.6〜5.6秒、暗転 0.9秒、着いてからの滞在 3.2秒、サイコロ 1.9秒（feedback.ts / SceneStage.tsx）。単体・e2e 通過。
### 2026-11-17 Claude（サイコロの不具合：遅い端末で、出目が見えないことがあった）
- 負荷のかかったテストで、「◯マス進む」の表示が出ないことがあった（繰り返し実行で、8回中6回再現）。原因：サイコロが「ころがり終わる」のを、目を入れ替える回数（10回×70ms）で決めていたため、遅い端末では、ころがり終わる前に、表示の消える時刻が来ていた。
- 直し：ころがる時間を実時間で決める（0.7秒。目の入れ替えは見た目だけ）、出目が決まってから**1秒は必ず見せる**（`DICE_ROLL_MS`・`DICE_HOLD_MS`。`DicePop` の `onDone` で消す）。繰り返し実行で、8回すべて通ることを確認。道中の帯・出目の e2e は、画面の変化を監視して記録する形にした（短い表示を見逃さない）。

### 2026-11-17 Claude（広重の絵：見せる部品と取り込みの手順。**絵そのものは、まだ入っていない**）
- ユーザー要望「歌川広重の絵は見れるようにしたい」。`hiroshige.json`（保永堂版55図の題名）、`PrintCard`（解説カードに題名、絵があればサムネイル → 押すと大きく〔出どころ・所蔵館リンクつき〕）、場面の右上の小さな絵（`print-compact`）、結果の手帖。`scripts/importHiroshige.ts`（手元の画像／メトロポリタン美術館 CC0）。テスト：`hiroshige.test.ts`（55図・番号・出どころのない絵は入れない）。仮の画像で、サムネイル・拡大表示・取り込み（出どころなしは断る）を確認（仮の画像は消した）。
- **絵が入らなかった理由（要対応）**：このセッションのネットワークは、許可した場所以外に出られない。メトロポリタン美術館（`collectionapi.metmuseum.org`・`images.metmuseum.org`）への許可を、環境「umimachilab」に**追加した**（ユーザーの個人の環境。umaregacya のセッションにも効く）が、続けて `curl` で取ろうとしたところ、権限の確認（auto mode）で止められた。回避せずに止めた。続けるには、ユーザーが、この取得を許可する（Bash の許可ルールに、メトロポリタン美術館への取得を追加する）か、手元で `npm run import:hiroshige -- --met` を実行するか、画像を `art-inbox/hiroshige/` に置く。
- 題名は、標準的な保永堂版の題名を、記憶から書いた（庄野 白雨・土山 春之雨・坂之下 筆捨嶺・藤川 棒鼻ノ図・赤阪 旅舎招婦ノ図・蒲原 夜之雪・池鯉鮒 首夏馬市 などは、検索で確認）。ほかの図の副題は、美術館の資料と見比べて、確認してほしい。

### 2026-11-17 Claude（カットイン：ユーザー要望「各マスでイベントをカットインさせたい」）
- イベントの場面に入るとき、画面が暗くなり、**帯が画面を横切って、イベントの名前が大きく出る**（約1.7秒）。そのあとに、選択肢。帯の札と色：宿場の話（橙）・関所（金）・道中の出来事（赤茶）・名物（緑）・分かれ道（青緑）。小さな字に、場所とだれが。
- 出すもの：人間のイベント（選択を待つとき）、CPU のイベント（自動で済んだとき。道中記の「【題名】名前：…」から）、人間が名物を買うか選ぶとき、人間が分かれ道を選ぶとき。人間の選択の結果の行では、出さない（二度出ないように）。
- 順番：サイコロ → 道を歩く → 着く → **カットイン** → 選択肢（出ているあいだは、操作の欄を出さず、CPU も待つ）。`?fast=1`・「動きを減らす」設定のときは省く（動きを減らす設定では、フェードだけ）。
- 実装：判断は `feedback.ts` の `cutinsFromTransition(prev, next)`（画面の外で、テストできる）、順番待ちは `useCutins.ts`、帯は `parts.tsx` の `CutIn`、色と動きは `index.css`。ひとり用（`GameScreen`）とオンライン（`OnlineScreen`）の両方で動く。
- 確認：`npm run check`（単体108件）、`npm run test:e2e`（38件）、`npm run test:e2e:online`（3件）。スクリーンショットで、帯の見た目を確認。

### 2026-11-17 Claude（実機の指摘：県の表示の不具合・出目・歩きながらの場面転換）
- **不具合を直した**：保存したゲームの盤面（マス・県など）が、古い設定のまま残り、草津で「東京都（武蔵）」と出た。盤面は設定から作るものなので、**SCHEMA_VERSION 4**：保存を読むとき、盤面を最新の設定で作り直す（旅人の位置は、マスの名前で対応づける。`MIGRATIONS[3]`、テストあり）。
- **出目をしっかり**：大きなサイコロ（132px）がころがってから出目が決まり、「◯マス進む」（早足は「早足 3＋2」）も出る。場面では約1.7秒、見せる（`DicePop`）。
- **進みながら場面転換**（場面〔3D〕のとき）：サイコロ → 旅人が道を歩いて遠ざかる（カメラも前へ。上に、通る宿場の名前が順に点く「日本橋 → 高輪の大木戸 → 品川 → …」）→ 暗転 → 次の土地の場面で、旅人が遠くから歩いて入ってくる。道を歩く時間は、通る数に応じて 1.4〜3.6 秒（`feedback.ts` の `travelMs`・`phaseDelay`）。解説カードは、着くまでは、まだ前の場所のまま。
- 確認：`npm run check`（単体105件）、`npm run test:e2e`（36件）。スクリーンショットで、ころがるサイコロ・道中の表示・到着の場面を確認。

### 2026-11-17 Claude（3D を「場面」に：ワープ・土地ごとの世界）
- `SceneStage.tsx`・`sceneKit.ts`・`scenes.json`（73か所）を追加、`Board3D.tsx` を削除。3D のときは、通る道を見せずに場面を切り替える（ワープ）。
- 確認：`npm run check`（単体102件）、`npm run test:e2e`（34件）、`npm run test:e2e:online`（3件）。スクリーンショットで、浜松・箱根・小田原・吉田・蒲原・関・土山・京都・日本橋・袋井・大井川の場面を確認（ヘッドレスのソフトウェア描画）。
- 次の候補：場面ごとの出来事の演出（その場面の中で、選択肢の絵を出す）、場面の中の人物（人足・旅人・馬子）の動き、実機での重さの確認（`?stats=1`）。

### 2026-11-17 Claude（路銀の緊張感：ユーザー承認）
- 初期路銀 3000→2200文、宿代 120→150文（木賃宿75・旅籠150）。CPU が「働く」を選ぶ基準は、300文のまま。
- 結果（CPU 600旅）：路銀が宿代を下回った旅人 0.1%→9.2%（武士26%・商人7%・ふつう7%・旅芸人6%・飛脚4%・伊勢参り3%）、働く手番 1旅あたり5.7回→13.4回、路銀の最低値の平均 337→211文。路銀がちょうど0になる旅人は0%（CPU は、宿代を割る前に働くため。人間は、使い込めば0になれる）。
- 身分の調整（初期路銀）：ふつう +300→+500、商人 +350→+480、飛脚 +120→+340、旅芸人 -350→-700、武士 +950→+1250。勝率（各2500回）：4人=ふ27・旅23・武26・伊25・商25・飛25、6人=ふ15・旅18・武15・伊15・飛22・商15。飛脚は、2人で弱く(37%)6人で強い(22%)。
- 称号：倹約の旅人は「路銀500文以上」に（1000文だと0%だった）。
### 2026-11-17 Claude（場所の解説・デザインの道具）
- `places.json`（57か所）、`PlaceCard`、旅の手帖、`shukuNumber`（何番目の宿場か）。検索で、本陣・旅籠・川越制度・新居関所・関宿・草津宿本陣などを確認。
- `docs/DESIGN_PLAN.md`：最終デザインへ向けた道具（Figma・Blender+glTF・画像生成・手描き・書体）と進め方。
- 確認：`npm run check`（単体97件）、`npm run test:e2e`（32件）。

### 2026-11-17 Claude（体力ゲージ・選択肢の数値・基本3D・追いかけカメラ・県ごとのデザイン）
- 上の「画面の更新」のとおり。`choiceText.ts`（結果の数値）、`regions.json`、`Board3D.tsx` の作り直し、2D の県の帯。
- 確認：`npm run check`（単体92件）、`npm run test:e2e`（30件）。3D は、ヘッドレスのソフトウェア描画で、8か所のスクリーンショットを確認（東京・大磯・小田原・由比・岡崎・関・土山・京都）。
- 気づいたこと：遠くの京都の五重塔・紅葉が、滋賀・三重からも霧の向こうに見える（旅の先が見えて、よいと判断してそのまま）。

### 2026-11-17 Claude（史実の見直し・続き：名物8つを検索で確認）
- 確認できたので残した：品川海苔（品川沖に養殖用のソダヒビが立てられたのは享保2年〔1718〕とされる）、掛川の葛布（掛川藩の奨励・参勤交代の武士が買った、と市の資料）、鞠子のとろろ汁（丁子屋は慶長元年〔1596〕創業、芭蕉の句は『猿蓑』）、箱根の寄木細工（開祖は畑宿の石川仁兵衛〔1790〜1850〕とされ、1826年のシーボルトの記録にも）、小田原のかまぼこ（東海道の宿場で大名が味わって評判を広めたといわれる。起源の年代は諸説）。
- **確認できなかったので直した**：日坂のわらび餅 → **子育て飴**（小夜の中山の茶屋で売られた、夜泣き石の言い伝えにつながる飴。広重の絵にも夜泣き石）／二川の柏餅（外した。出来事の選択肢の文も直した）／四日市のなが餅（江戸時代の由来が確認できず外した。日永の追分は確認できたので出来事は残した）。
- 名物のある宿場は17。身分の調整：飛脚の初期路銀 +260→+120、旅芸人 -500→-350、商人 +200→+350。称号：名物通 6つ以上、思い出ぶくろ 100以上。
- シミュレーション（各2500回、全員同じ強さなら 1/人数）：2人=ふ54・旅53・武52・商56・伊52・飛32、4人=ふ24・旅21・武30・伊27・商29・飛21、6人=ふ14・旅14・武17・伊16・飛20・商18。飛脚は、人数が多いほど強い（早足で先に着く価値が、順位ボーナスで上がるため）。称号：名物通41%・思い出の旅人21%・川止めの客34%・一番乗り25%・関所の顔22%・人望の旅人8%・倹約の旅人2%・思い出ぶくろ2%。
- まだ確認していないもの：安倍川もち（家康の伝承）、八丁味噌、鳴海絞り、焼き蛤、関の戸、水口のかんぴょう（広重の絵に名物干瓢）、うばがもち、大津絵。広く知られた名物だが、一次資料の確認はしていない。

### 2026-11-17 Claude（史実の見直し：名物・出来事の時代）
- 自分で書いた名物・出来事を、検索で見直した。**時代が合わないもの・確認できないものを直した**：
  - 由比の桜えび：桜えび漁は明治時代に始まったので、江戸の旅に合わない → 「正雪紺屋（由比正雪の生家と伝わる藍染の店）」の出来事と、「紺屋の手ぬぐい」に差し替え。
  - 三島のうなぎ・沼津の干物・宮のきしめん・土山茶：江戸時代の名物と確認できなかったので、名物から外した（きしめんは、起源の説が宮宿でなく、芋川・池鯉鮒など、定まっていない）。
  - 浜名湖のうなぎ：養殖は1900年だが、江戸時代も天然のうなぎが名物で、広重の新居の絵に串焼きが描かれている → 浜松から**新居**の名物に移した。
  - 確認できて残したもの：川崎の久寿餅（天保年間〔1830〜44〕に生まれたと伝わる）。
- 確認できていないもの（そのまま残しているが、要確認）：品川海苔・小田原かまぼこ・箱根の寄木細工・安倍川もち・鞠子のとろろ汁・日坂のわらび餅・掛川の葛布・二川の柏餅・八丁味噌・鳴海絞り・焼き蛤・なが餅・関の戸・水口のかんぴょう・うばがもち・大津絵。いずれも、広く知られた江戸の名物のつもりだが、年代・名称の一次資料の確認はしていない。
- シミュレーション（各1500回）：4人=ふ25・旅20・武30・伊27・商26・飛24、6人=ふ16・旅15・武18・伊17・飛21・商14。称号の取得率：名物通27%・思い出の旅人23%・関所の顔22%・川止めの客34%・一番乗り25%・人望の旅人9%・倹約の旅人2%。

### 2026-11-17 Claude（ROADMAP F：3D の試作）
- 3D の盤面（遅延読み込み）、2D/3D の切り替え（記憶つき）、e2e。`viewMode.ts`・`BoardStage.tsx` を追加。
- 確認：`npm run check`（単体82件）、`npm run test:e2e`（22件）。スクリーンショットで、街道・名前・駒・景色が出ることを確認。
- 次：実機での重さの確認（ユーザー）。重ければ、マス数を減らして描く・影を使わない・低解像度、などの手がある。

### 2026-11-17 Claude（絵の取り込み・PWA の準備・結果画面）
- 絵の差し替え（ROADMAP E）：`scripts/importArt.mjs`（`art-inbox/<マスの名前>.png` → `public/art/*.webp` ＋ `src/art/overrides.json`）、`artFor` がマスの名前か `art` のキーで探す、盤面では円形に切り抜いて表示。仮の画像で、取り込み→表示まで確認（コミットしていない）。`docs/ASSETS.md` に権利の注意。
- 公開の準備（G の一部）：アイコン（`public/favicon.svg`・png）、`manifest.webmanifest`、`index.html` のメタ。service worker は入れていない（オフライン対応は未）。
- 結果画面：優勝者と、自分の順位を最初に。表の見出しが折り返さないように。
- 確認：`npm run check`（単体82件）、`npm run test:e2e`（20件）。

### 2026-11-17 Claude（遊び方・オンラインの駒のアニメーション）
- 遊び方の画面（`HowToPlay`。数値は balance.json から読む。タイトルと、遊んでいる途中の「遊び方」から開く）。
- オンラインの駒の移動アニメーション・サイコロの目（steps の再生）。オンライン e2e を、1回の呼び出しでボタンを押す形にして安定・高速化（約2.6分→約43秒）、通常の速さの動作確認を追加。
- 確認：`npm run check`（単体79件）、`npm run test:e2e`（20件）、`npm run test:e2e:online`（3件）。

### 2026-11-17 Claude（ROADMAP D2：オンライン対戦）
- 部屋・通信・サーバー処理・クライアント・Worker・画面を移植。`parts.tsx` に画面の部品を切り出し（ひとり用とオンラインで共有）。lint から `.wrangler` を除外。
- 確認：`npm run check`（単体79件：room 11・roomServer 17を追加）、`npm run test:e2e`（18件）、`npm run test:e2e:online`（2件）。
- 次：オンラインの駒のアニメーション、Cloudflare のデプロイ（Worker 名・トークンが要る）、E 絵、F 3D の試作、G 公開の準備。

### 2026-11-19 Antigravity（風物・人馬作り込み：第5群 41〜50 鳴海〜土山）
- ブランチ: `antigravity/scenes-2`
- 広重『東海道五拾三次』の絵に合わせた「絵の主役の風物」と「人・馬」の作り込み。
- 作り込み完了宿場（第5群 41〜50）:
  41. 鳴海（名物有松絞）: arimatsu:shop, packhorse:rider, travelers:shop, machiya
  42. 宮（熱田神事）: shrine, torii:big, bonfire, horses, travelers:two
  - 七里の渡し: sea:wide, boats:sails, travelers:two
  43. 桑名（七里渡口）: ship:big, castle:seaside, torii:big, sea:wide, travelers:two
  44. 四日市（三重川）: river, bridge:plank, willow, travelers:rain, dike, signpost=伊勢街道 追分
  45. 石薬師（石薬師寺）: temple, paddies, mountains:suzuka, travelers:walking, pinelane
  46. 庄野（白雨）: bamboo, travelers:rain, steps, dike, street
  47. 亀山（雪晴）: castle:small, mountains:snow, snowroofs, procession, travelers:snow
  - 関の茶屋: teahouse:thatched, travelers:two, pinelane, lantern
  48. 関（本陣早立）: honjin:maku, travelers:maku, street:long, lantern, kasumi:morning
  49. 坂下（筆捨嶺）: mountains:suzuka, cedar, steps, travelers:shop, teahouse:thatched
  - 鈴鹿峠: mountains:suzuka, steps, cedar, travelers:walking
  50. 土山（春之雨）: river, bridge:plank, procession, travelers:rain, teafields
- 特記事項:
  - 桑名（七里渡口）: 画面の2〜3割を覆う巨大千石船（`ship:big`）と海に突き出た城郭・蟠龍櫓（`castle:seaside`）、大鳥居、広い海面を配置し、桑名の迫力ある港の景観を再現。
  - 鳴海（名物有松絞）: 藍染めの大絞り暖簾と反物が吊るされた有松絞り問屋（`arimatsu:shop`）、馬上の旅人と馬方（`packhorse:rider`）、買い物をする旅人たち。
  - 関（本陣早立）: 本陣の大屋根と正面に張られた巨大な白大幔幕（黒家紋の円、`honjin:maku`）、早立ちする大名行列と提灯・旅人たち（`travelers:maku`）。
  - 庄野（白雨）: 激しい夕立に煽られる竹林（`bamboo`）と、坂道を急ぐ合羽・笠の旅人たち（`travelers:rain`）。
  - 亀山（雪晴）: 雪晴れの朝、雪を被った亀山城と大名行列、雪合羽の旅人（`travelers:snow`）。
  - 四日市（三重川）: 三重川の板橋、風に吹かれる柳と合羽を押さえて歩く旅人（`travelers:rain`）。
  - 坂下・鈴鹿峠・石薬師: 鈴鹿山脈の険しい奇峰・筆捨山（`mountains:suzuka`）。
- 確認：`npm run check`（単体129件通過）、`npm run test:e2e`（50件通過）
- 次：第6群（51〜55：水口〜京都 三条大橋・全場面完成）

### 2026-11-19 Antigravity（風物・人馬作り込み：第4群 31〜40 舞坂〜池鯉鮒）
- ブランチ: `antigravity/scenes-2`
- 広重『東海道五拾三次』の絵に合わせた「絵の主役の風物」と「人・馬」の作り込み。
- 作り込み完了宿場（第4群 31〜40）:
  31. 舞坂（今切真景）: lake:wide, ferry=lake, stakes, travelers:two, pinelane, fuji:distant
  - 浜名の今切: lake:wide, stakes, ferry=lake, travelers:walking, fuji:distant
  32. 新居（関所）: sekisho, lake:wide, ferry=lake, travelers:walking, stakes
  33. 白須賀（汐見坂）: steps, sea:wide, procession, travelers:two, pinelane
  34. 二川（猿が馬場）: teahouse:thatched, travelers:shop, pinelane, street, paddies
  35. 吉田（豊川橋）: bridge:long, river, castle:small, travelers:bridge, hanabi
  36. 御油（旅人留女）: inn, travelers:two, pinelane, street, lantern
  37. 赤坂（旅籠屋招婦）: inn, sotetsu, travelers:shop, lantern, street
  38. 藤川（棒鼻ノ図）: stakes, horses, packhorse:cargo, procession, travelers:two, pinelane
  39. 岡崎（矢矧之橋）: bridge:long, river:wide, castle, procession, travelers:bridge
  - 岡崎の城下: castle, river:wide, bridge:long, travelers:walking, street
  40. 池鯉鮒（首夏馬市）: horses, packhorse:standing, travelers:two, paddies, pinelane, distanthills
- 特記事項:
  - 岡崎（矢矧之橋）: 矢矧川に架かる大木橋（`bridge:long`）と遠景の岡崎城（`castle`）、橋上を行き交う大名行列（`procession`）と旅人たち（`travelers:bridge`）。
  - 池鯉鮒（首夏馬市）: 草原で商談される繋ぎ馬（`packhorse:standing`）と放牧馬（`horses`）、馬喰や旅人たち（`travelers:two`）。
  - 舞坂・新居: 浜名湖今切の広い青水面（`lake:wide`）と杭（`stakes`）、今切関所、渡し舟、旅人。
  - 吉田（豊川橋）: 豊川橋と夜空に打ち上がる花火（`hanabi`）、城、橋上の旅人。
  - 御油・赤坂: 東海道屈指の旅籠街。留女や旅人で賑わう夕暮れの御油、中庭の蘇鉄が印象的な赤坂の夜の旅籠（`travelers:shop`）。
  - 藤川（棒鼻ノ図）: 宿場境の棒鼻、馬列と大名行列、出迎える役人・旅人。
- 確認：`npm run check`（単体129件通過）、`npm run test:e2e`（50件通過）
- 次：第5群（41〜50：鳴海〜土山）

### 2026-11-19 Antigravity（風物・人馬作り込み：第3群 21〜30 鞠子〜浜松）
- ブランチ: `antigravity/scenes-2`
- 広重『東海道五拾三次』の絵に合わせた「絵の主役の風物」と「人・馬」の作り込み。
- 作り込み完了宿場（第3群 21〜30）:
  - 丸子の茶屋: teahouse:thatched, plum, travelers:two, street
  21. 鞠子（名物茶店）: teahouse:thatched, plum, travelers:shop, mountains:round, street
  22. 岡部（宇津之谷）: mountains:cliff, steps, travelers:walking, cedar, river
  23. 藤枝（人馬継立）: street, horses, packhorse:cargo, travelers:two, distanthills
  24. 島田（大井川駿岸）: river:vast, porters, travelers:walking, distanthills, street
  - 大井川: river:vast, porters, travelers:two, distanthills
  - 島田の川止め宿: inn, river:vast, travelers:two, street
  - 川明けを待つ河原: river:vast, porters, travelers:walking, mountains:layered
  - 川越しの朝: river:vast, porters, travelers:two, mountains:layered, kasumi:morning
  25. 金谷（大井川遠望）: river:vast, steps, packhorse:cargo, travelers:walking, teafields, mountains:layered
  - 小夜の中山: rock, steps, mountains:cliff, travelers:walking
  26. 日坂（佐夜ノ中山）: rock, steps, travelers:two, mountains:cliff, teahouse:thatched
  27. 掛川（秋葉道）: bridge:wood, river, castle:small, kite, travelers:two, distanthills
  28. 袋井（出茶屋ノ図）: teahouse:thatched, kettle, travelers:shop, signpost=東海道 どまん中, paddies
  29. 見附（天竜川図）: river:vast, ferry=river, travelers:two, kasumi, pinelane
  30. 浜松（冬枯ノ図）: bigpine:bonfire, travelers:bonfire, smoke, bonfire, castle:distant, pinelane, distanthills
- 特記事項:
  - 浜松（冬枯ノ図）: 絵の主役である冬枯れの大松（`bigpine:bonfire`）と、焚き火にあたる旅人たち（`travelers:bonfire`）、風になびく煙のパーティクル（`smoke`）を中央に大写しで配置。遠景に浜松城（`castle:distant`）と松並木・遠山を配し、広重の構図を忠実に再現。
  - 鞠子（名物茶店）: 茅葺き茶屋（丸子の茶屋）と梅の木、名物とろろ汁を食べる旅人と給仕（`travelers:shop`）。
  - 藤枝（人馬継立）: 伝馬所の荷駄馬（`packhorse:cargo`）と繋ぎ馬（`horses`）、交代の旅人たち。
  - 大井川・島田・金谷: 広大な水面（`river:vast`）と蓮台・肩車で渡る川越人足（`porters`）、荷駄馬、坂道を登る旅人。
  - 日坂（佐夜ノ中山）: 街道真ん中の巨大な夜泣き石（`rock`）と急坂の石段（`steps`）、旅人二人連れ。
  - 掛川（秋葉道）: 秋葉道の木橋を渡る旅人と、空高く揚がる大凧（`kite`）。
  - 袋井（出茶屋ノ図）: 街道どまん中の出茶屋、大木に吊るされた巨大薬缶（`kettle`）と休む旅人。
- 確認：`npm run check`（単体129件通過）、`npm run test:e2e`（50件通過）
- 次：第4群（31〜40：舞坂〜池鯉鮒）

### 2026-11-19 Antigravity（風物・人馬作り込み：第2群 11〜20 箱根〜府中）
- ブランチ: `antigravity/scenes-2`
- 広重『東海道五拾三次』の絵に合わせた「絵の主役の風物」と「人・馬」の作り込み。
- 作り込み完了宿場（第2群 11〜20）:
  11. 箱根（湖水図）: lake:wide, mountains:layered, distanthills, procession, torii:grand
  - 箱根の山道: mountains:cliff, cedar, steps, packhorse:rider, travelers:walking
  - 芦ノ湖と富士: lake:wide, fuji, torii, travelers:two
  12. 三島（朝霧）: torii:big, packhorse:rider, travelers:two, kasumi:morning, distanthills
  13. 沼津（黄昏図）: river:wide, dike, travelers:two, packhorse:standing, moon:full, pinelane
  14. 原（朝之富士）: fuji:huge, travelers:three, paddies, marsh, distanthills
  15. 吉原（左富士）: bigpine:lane, packhorse:rider, fuji:left, dike, travelers:two
  16. 蒲原（夜之雪）: mountains:snow, snowroofs, travelers:snow, street:quiet, snow_particles
  17. 由井（薩埵嶺）: cliff:steep, sea:wide, fuji, boats:sails, pinelane, travelers:two
  - 薩埵峠: cliff:steep, sea:wide, fuji, pinelane, travelers:walking
  18. 興津（興津川）: river:wide, packhorse:cargo, porters, travelers:two, distanthills
  19. 江尻（三保遠望）: bay:wide, boats:sails, pinelane, travelers:two, fuji:distant, kasumi
  20. 府中（安部川）: river:vast, porters, travelers:walking, packhorse:cargo, distanthills, teahouse:thatched
- 特記事項:
  - 原（朝之富士）: 画面の3割を覆う巨大富士（`fuji:huge`）と、菅笠・道中合羽・天秤棒の旅人三人連れ（`travelers:three`）を主役として配置。
  - 吉原（左富士）: 街道を覆う大松（`bigpine:lane`）と、馬に乗る旅人と手綱引く馬方（`packhorse:rider`）、左手に見える富士（`fuji:left`）を忠実に再現。
  - 箱根（湖水図）: 芦ノ湖の広い青水面（`lake:wide`）と険しい層状岩山、大名行列、杉並木。
  - 蒲原（夜之雪）: 静まり返る夜の雪景色（`snowroofs`, `mountains:snow`）と雪笠・蓑を着た三人連れの旅人（`travelers:snow`）。
- 確認：`npm run check`（単体129件通過）、`npm run test:e2e`（50件通過）
- 次：第3群（21〜30：鞠子〜浜松）

### 2026-11-19 Antigravity（風物・人馬作り込み：第1群 1〜10 日本橋〜小田原）
- ブランチ: `antigravity/scenes-2`
- 広重『東海道五拾三次』の絵に合わせた「絵の主役の風物」と「人・馬」の作り込み。
- 新風物部品・基盤整備（`sceneKit.ts`）:
  - `traveler`: 低ポリ旅人（着物・頭・菅笠・道中合羽・背負い荷・肩掛け・天秤棒）。歩行（上下動・左右揺れ）や呼吸の微小アニメーション（`effects`）対応。
  - `packhorse`: 低ポリ馬（胴体・首・頭・耳・4脚・尾・鞍・荷駄）、馬に乗る旅人（横座り/跨ぎ・合羽・笠）、手綱を引く口取り（馬方）。歩行・揺れアニメーション対応。
  - `travelers`: 各種バリエーション（`three` 三人連れ、`bonfire` 焚火、`maku` 早立、`bridge` 橋の行き交い、`shop` 店先、`rain` 雨合羽、`snow` 雪合羽、`two` 二人連れ）。
  - `packhorse`: `rider`（馬乗り旅人と馬方）、`standing`（繋ぎ馬）、荷駄馬。
  - `bigpine`: `bonfire`（浜松の冬枯れ大松）、`lane`（吉原左富士の街道大松）。
  - `smoke`: 焚火から立ちのぼり風にたなびく煙（パーティクル上昇効果）。
  - `ship:big`: 桑名七里渡口の大千石船（画面の2〜3割を占める大帆船・白大一枚帆・帆柱・水夫・波揺れ）。
  - `honjin:maku`: 関本陣の白大幔幕（黒家紋の円・大屋根・玄関）。
  - `arimatsu:shop`: 鳴海有松絞り問屋（大藍染絞り暖簾・吊るされた反物・格子）。
  - `sanjo_bridge`: 京都三条大橋（太い橋桁・金の擬宝珠・高欄・木製橋脚）。
  - `fuji:huge`: 原の画面を突き抜ける超巨大朝富士。
  - `mountains`: `higashiyama`（京都東山連峰）、`suzuka`（鈴鹿峠奇峰）、層状岩山（黄土・青緑・茶褐色の縞層）強化。
- 作り込み完了宿場（第1群 1〜10）:
  1. 日本橋（朝之景）: river:wide, bridge:wood, procession, fishmarket, travelers:bridge, street, distanthills
  - 高輪の大木戸: stonegate, sea, street, travelers:walking
  2. 品川（日之出）: sea:wide, boats:sails, teahouse, travelers:two, street, kasumi:morning
  - 六郷の渡し: river:wide, ferry=river, packhorse:cargo, travelers:walking, paddies
  3. 川崎（六郷渡舟）: river:wide, ferry=river, travelers:two, fuji:distant, teahouse:thatched, pinelane
  4. 神奈川（台之景）: sea:wide, steps, teahouse, travelers:two, boats:sails, pinelane
  5. 保土ヶ谷（新町橋）: river, bridge:wood, soba, packhorse:rider, travelers:two, pinelane
  6. 戸塚（元町別道）: signpost=左 かまくら道, teahouse:thatched, packhorse:standing, travelers:two, river, bridge:wood, pinelane
  7. 藤沢（遊行寺）: river, bridge:long, torii:big, temple, travelers:bridge, mountains:layered
  8. 平塚（縄手道）: dike, travelers:two, paddies, mountains:round, fuji:distant, pinelane
  9. 大磯（虎ヶ雨）: pinelane, travelers:rain, packhorse:rider, sea:wide, dike, kasumi
  - 大磯の松並木: pinelane, travelers:walking, sea, lantern
  10. 小田原（酒匂川）: river:wide, porters, travelers:two, castle, mountains:layered, pinelane
- 確認：`npm run check`（単体129件通過）、`npm run test:e2e`（50件通過）
- 次：第2群（11〜20：箱根〜府中）

### 2026-11-18 Antigravity（全55宿の場面作り込み：第6群 51〜55 水口〜京都 三条大橋・全場面完成）
- ブランチ: `antigravity/scenes-1`
- 広重『東海道五拾三次』の絵に合わせた3D場面（`sceneKit.ts` / `scenes.json`）の作り込み。
- 新風物部品・改修：
  - 水口の名物干瓢干しと松・水口城、石部の夕暮れ目川茶店と街道松並木、草津の追分立場姥が餅茶屋と大名駕籠行列、大津の走井茶店と名木柳・清水、京都 三条大橋の鴨川に架かる木造長橋（金色の擬宝珠）・五重塔・多層の東山連峰・京都町家の夕暮れ
- 作り込み完了宿場（第6群 51〜55）:
  51. 水口（名物干瓢）: day, kanpyo, castle:small, pinelane, street
  52. 石部（目川ノ里）: dusk, teahouse:thatched, street, pinelane, lantern, signpost=京立ち石部泊まり
  53. 草津（名物立場）: day, teahouse:thatched, inn, signpost=追分 東海道・中山道, procession（琵琶湖のほとり反映）
  54. 大津（走井茶店）: day, teahouse:thatched, willow, street, signpost=逢坂の関
  55. 京都 三条大橋（三条大橋）★代表: dusk, river:wide, bridge:long, pagoda, mountains:layered, machiya
- 確認：`npm run check`（単体129件通過）、`npm run test:e2e`（50件全通過）
- スクリーンショット（比較画像）：`京都 三条大橋-compare.png`（★代表）
- これにより東海道五十三次（日本橋〜京都 三条大橋 全55宿および分岐・名所マス計73箇所）すべての場面作り込みが完了。

### 2026-11-18 Antigravity（全55宿の場面作り込み：第5群 41〜50 鳴海〜土山）
- ブランチ: `antigravity/scenes-1`
- 広重『東海道五拾三次』の絵に合わせた3D場面（`sceneKit.ts` / `scenes.json`）の作り込み。
- 新風物部品・改修：
  - 鳴海の有松絞り問屋街と揺れる反物、宮の熱田神事の篝火と疾走する神馬、桑名の七里渡口に立つ大鳥居・城郭の櫓・千石船群、四日市三重川の板橋・風にしなる柳と追分道標、石薬師の門前と鈴鹿連峰、庄野白雨の豪雨にしなる竹藪と急坂、亀山雪晴の白銀の山城と行列、関の本陣早立・長大な格子町家、坂下の筆捨嶺奇峰、土山の春之雨・田村川板橋
- 作り込み完了宿場（第5群 41〜50）:
  41. 鳴海（名物有松絞）: day, indigo:colors, street, machiya
  42. 宮（熱田神事）: night, shrine, torii:big, bonfire, horses
  43. 桑名（七里渡口）★代表: day, torii:big, sea:wide, tower, boats:sails（七里の渡し反映）
  44. 四日市（三重川）: day, river, bridge:plank, willow, dike, signpost=伊勢街道 追分
  45. 石薬師（石薬師寺）: day, temple, paddies, mountains:layered, pinelane
  46. 庄野（白雨）: rain, bamboo, steps, dike, street
  47. 亀山（雪晴）: day, castle:small, mountains:snow, snowroofs, procession
  48. 関（本陣早立）: morning, street:long, procession, lantern, torii（関の茶屋反映）
  49. 坂下（筆捨嶺）: mist, mountains:cliff, cedar, steps, teahouse:thatched（鈴鹿峠反映）
  50. 土山（春之雨）: rain, river, bridge:plank, procession, teafields
- 確認：`npm run check`（単体129件通過）、`npm run test:e2e`（50件全通過）
- スクリーンショット（比較画像）：`桑名-compare.png`（★代表）、`庄野-compare.png`
- 次：第6群（51〜55：水口〜京都 三条大橋）

### 2026-11-18 Antigravity（全55宿の場面作り込み：第4群 31〜40 舞坂〜池鯉鮒）
- ブランチ: `antigravity/scenes-1`
- 広重『東海道五拾三次』の絵に合わせた3D場面（`sceneKit.ts` / `scenes.json`）の作り込み。
- 新風物部品・改修：
  - `sotetsu`: 赤坂「旅舎招婦ノ図」の旅籠大橋屋の中庭に茂る名物蘇鉄
  - 舞坂・新居・今切の渡し舟と海中の木杭、白須賀の高台汐見坂から見下ろす遠州灘と大名行列、吉田の豊川橋と吉田城・夜空の手筒花火、御油の夕暮れ松並木と旅籠町、藤川の棒示杭と出迎える大名行列、岡崎の東海道最長・矢矧之橋と岡崎城、池鯉鮒の初夏馬市
- 作り込み完了宿場（第4群 31〜40）:
  31. 舞坂（今切真景）: day, lake:wide, ferry=lake, stakes, pinelane, fuji:distant（浜名の今切も反映）
  32. 新居（渡舟ノ図）: day, sekisho, lake, ferry=lake, stakes
  33. 白須賀（汐見阪図）: day, steps, sea:wide, procession, pinelane
  34. 二川（猿ヶ馬場）: day, teahouse:thatched, pinelane, street, paddies
  35. 吉田（豊川橋）: night, bridge:long, river, castle:small, hanabi
  36. 御油（旅人留女）: dusk, inn, pinelane, street, lantern
  37. 赤坂（旅舎招婦ノ図）: night, inn, sotetsu, lantern, street
  38. 藤川（棒鼻ノ図）: day, stakes, horses, procession, pinelane
  39. 岡崎（矢矧之橋）: day, bridge:long, river:wide, castle, procession（岡崎の城下も反映）
  40. 池鯉鮒（首夏馬市）: day, horses, paddies, pinelane, distanthills
- 確認：`npm run check`（単体129件通過）、`npm run test:e2e`（50件全通過）
- スクリーンショット（比較画像）：`岡崎-compare.png`、`白須賀-compare.png`
- 次：第5群（41〜50：鳴海〜土山）

### 2026-11-18 Antigravity（全55宿の場面作り込み：第3群 21〜30 鞠子〜浜松）
- ブランチ: `antigravity/scenes-1`
- 広重『東海道五拾三次』の絵に合わせた3D場面（`sceneKit.ts` / `scenes.json`）の作り込み。
- 新風物部品・改修：
  - `plum`: 鞠子「名物茶店」の丁子屋を彩る紅白の梅
  - `kite`: 掛川「秋葉山遠望」の空に舞う大凧と尾の吹き流し
  - `kettle`: 袋井「出茶屋ノ図」の大木の枝から吊るされた大鉄薬缶と立ち上る湯気・焚火
  - `rock`: 日坂「佐夜ノ中山」の街道中央に鎮座する夜泣き石と注連縄
  - 岡部の宇津之山山峡、島田・金谷・大井川の広大な川筋、浜松の冬枯れの松と焚火
- 作り込み完了宿場（第3群 21〜30）:
  21. 鞠子（名物茶店）: day, teahouse:thatched, plum, mountains:round, street
  22. 岡部（宇津之山）: mist, mountains:cliff, steps, cedar, river
  23. 藤枝（人馬継立）: day, street, horses, distanthills
  24. 島田（大井川駿岸）: day, river:vast, porters, distanthills, street
  25. 金谷（大井川遠岸）: day, river:vast, steps, teafields, mountains:layered
  26. 日坂（佐夜ノ中山）: day, rock, steps, mountains:cliff, teahouse:thatched（小夜の中山も反映）
  27. 掛川（秋葉山遠望）: day, bridge:wood, river, castle:small, kite, distanthills
  28. 袋井（出茶屋ノ図）: day, teahouse:thatched, kettle, signpost=東海道 どまん中, paddies
  29. 見附（天竜川図）: mist, river:vast, ferry=river, kasumi, pinelane
  30. 浜松（冬枯ノ図）★代表: day, castle:big, bonfire, pinelane, distanthills（大井川も反映）
- 確認：`npm run check`（単体129件通過）、`npm run test:e2e`（50件全通過）
- スクリーンショット（比較画像）：`浜松-compare.png`（★代表）、`袋井-compare.png`
- 次：第4群（31〜40：舞坂〜池鯉鮒）

### 2026-11-18 Antigravity（全55宿の場面作り込み：第2群 11〜20 箱根〜府中）
- ブランチ: `antigravity/scenes-1`
- 広重『東海道五拾三次』の絵に合わせた3D場面（`sceneKit.ts` / `scenes.json`）の作り込み。
- 新風物部品・改修：
  - `marsh`: 原「朝之富士」の浮島ヶ原に広がる広大な湿地・葦原と水面
  - `moon`: 沼津「黄昏図」の狩野川沿いに浮かぶ大きな満月と淡い夜光
  - `snowroofs`: 蒲原「夜之雪」のしんしんと雪が積もる茅葺き・瓦屋根の静寂な町並み
  - 箱根の屏風山（`mountains:layered`）と芦ノ湖の青、三島の朝霧（`mist` と `kasumi`）、由比の薩埵峠断崖（`mountains:cliff`）と駿河湾
- 作り込み完了宿場（第2群 11〜20）:
  11. 箱根（湖水図）: morning, lake, mountains:layered, fuji:distant, procession, sekisho
  12. 三島（朝霧）: mist, shrine, torii, cedar, kasumi
  13. 沼津（黄昏図）: dusk, river:wide, moon, pinelane, teahouse:thatched
  14. 原（朝之富士）: morning, fuji:big, marsh, paddies, pinelane
  15. 吉原（左富士）: day, pinelane, fuji:left, dike, street
  16. 蒲原（夜之雪）: snow, snowroofs, mountains:snow, pinelane
  17. 由比（薩埵嶺）: day, mountains:cliff, sea:wide, fuji, pinelane（薩埵峠も反映）
  18. 興津（興津川）: day, river:wide, mountains:layered, pinelane, street
  19. 江尻（三保遠望）: day, sea:wide, boats:sails, pinelane, harbor
  20. 府中（安倍川）: day, river:vast, porters, mountains:layered, fuji:distant
- 確認：`npm run check`（単体129件通過）、`npm run test:e2e`（50件全通過）
- スクリーンショット（比較画像）：`箱根-compare.png`、`蒲原-compare.png`
- 次：第3群（21〜30：鞠子〜浜松）

### 2026-11-18 Antigravity（全55宿の場面作り込み：第1群 1〜10 日本橋〜小田原）
- ブランチ: `antigravity/scenes-1`
- 広重『東海道五拾三次』の絵に合わせた3D場面（`sceneKit.ts` / `scenes.json`）の作り込み。
- 山・水・遠景・霞の基盤改修：
  - `mountains`: 裾野（黄土層）・中腹（青緑層）・上部（岩肌層）の多層山（`layered`）、丸山（`round`）、断崖（`cliff`）、雪山（`snow`）
  - `river`: 広重の深いベロ藍（`0x1b466f`）と浅葱のグラデーション、砂州・中州の配置（`wide`, `vast`）
  - `sea`: 手前の砂浜、白波、深いベロ藍の沖合（`wide`）
  - `distanthills`: 輪郭線を引かず遠景に溶け込む淡藍の遠山
  - `kasumi`: 水平に広がるすやり霞（和紙色・薄紅）
  - 新風物部品: `procession`（大名行列の毛槍・奴）、`fishmarket`（日本橋の魚河岸・天秤棒）、`soba`（保土ヶ谷の二八蕎麦屋）、`dike`（平塚縄手道・土手・飛脚）、`bonfire`（焚火・篝火）、`bamboo`（竹藪）、`willow`（柳）
- 作り込み完了宿場（第1群 1〜10）:
  1. 日本橋（朝之景）: morning, river:wide, bridge:wood, procession, fishmarket, street, distanthills
  2. 品川（日之出）: morning, sea:wide, boats:sails, teahouse, street, kasumi:morning
  3. 川崎（六郷渡舟）: day, river:wide, ferry=river, fuji:distant, teahouse:thatched, pinelane
  4. 神奈川（台之景）: day, sea:wide, steps, teahouse, boats:sails, pinelane
  5. 保土ヶ谷（新町橋）: day, river, bridge:wood, soba, pinelane, street
  6. 戸塚（元町別道）: dusk, signpost=左 かまくら道, teahouse:thatched, river, bridge:wood, pinelane
  7. 藤沢（遊行寺）: day, river, bridge:long, torii, temple, mountains:layered
  8. 平塚（縄手道）: day, dike, paddies, mountains:round, fuji:distant, pinelane
  9. 大磯（虎ヶ雨）: rain, pinelane, sea:wide, dike, kasumi
  10. 小田原（酒匂川）: day, river:wide, porters, castle, mountains:layered, pinelane
- 確認：`npm run check`（単体129件通過）、`npm run test:e2e`（50件全通過）
- スクリーンショット（比較画像）：`日本橋-compare.png`、`小田原-compare.png`
- 次：第2群（11〜20：箱根〜府中）

### 2026-11-17 Claude（ROADMAP H：旅人の身分）
- SCHEMA_VERSION 3、身分6つ、タイトル画面の選択、札と結果に身分、シミュレーションを身分ごとの集計に。
- 確認：`npm run check`（単体53件）、`npm run test:e2e`（18件：desktop・mobile × 9）。

### 2026-11-17 Claude（ROADMAP D1：同じ端末で複数人）
- タイトル画面（人数・名前）、判断の画面に名前、結果の旅日記を人ごとに。焦点（盤面・小地図）は手番の人間を追う。
- 確認：`npm run check`（単体46件）、`npm run test:e2e`（16件：desktop・mobile × 8）。

### 2026-11-17 Claude（ROADMAP B：専用イベント53宿・汎用30件）
- 専用イベントを残り40宿に追加（`src/events/shuku.json`）。汎用の出来事を16→30件に（`road.json`）。
- 確認できた史実（検索）：袋井は江戸からも京からも27番目（中間点）／白須賀は宝永地震（1707）の津波のあと高台へ移った／御油〜赤坂は約1.7kmで宿間が最も短く、御油の松並木は家康の命による植樹と伝わる／赤坂の旅籠「大橋屋」は現存し、豊川市が保存／石部は「京立ち石部泊まり」（京から来た旅人の最初の宿）／吉原の左富士は津波による宿場移転で街道が迂回したため／岡部の宇津ノ谷峠は『伊勢物語』の蔦の細道、江戸の東海道は秀吉が開いた新道／藤川の棒鼻は広重の図（八朔の馬の献上）／庄野は広重「白雨」／蒲原は広重「夜之雪」／戸塚は江戸から一日目の宿（膝栗毛の二人も）／大磯の虎御前は曽我十郎との伝承／興津の清見寺は朝鮮通信使の宿所／吉田の手筒花火（馬琴が天下一と記したと伝わる）／大津の逢坂の関は蝉丸の歌／見附の天竜川は舟渡しで川止めが少ない／筆捨山（狩野元信）と土山の雨（馬子唄）は伝承。
- 確認できなかったので、表現をぼかしたもの：池鯉鮒の馬市の細部、各宿の細かい料金・日数など。`ja.wikipedia.org` は、このセッションのネットワークで開けなかった（許可が必要）。
- バランス調整：食い道楽の思い出の重み 1.6→1.15、堅実 1.0→1.2、本陣の評判 70→60、関所の特別な選択肢の評判 45→40、称号の基準（思い出の旅人80・思い出ぶくろ120・人望の旅人50）。
- シミュレーション（各800回）：到着21日目・勝率 2人=社29/食28/急16/堅27、4人=社25/食32/堅23/急21、6人=社27/食26/堅21/急27。
- 確認：`npm run check`（単体46件）、`npm run test:e2e`。

### 2026-11-17 Claude（ROADMAP C：2D の演出）
- 駒の移動アニメーション、サイコロ表示、小地図、通知、到着表示。エンジンは変更なし。
- 確認：`npm run check`（単体46件）、`npm run test:e2e`（14件：desktop・mobile × 7。演出・動きを減らす設定・小地図を追加）。
- 決定（ユーザー）：職業は作らない。**旅人の身分（商人・伊勢参り・飛脚・旅芸人・武士）は、演出（C）のあとに入れる**（ROADMAP に追記。SCHEMA_VERSION 3 になる）。
- 次：身分、または B（専用イベントを残り40宿へ）。

### 2026-11-17 Claude（案C：盤面を73マスに）
- 汎用の道中マス（5種）を外し、有名な峠・渡しだけ残した。本道108→70マス。宿場に止まったときの出来事抽選（`shukuEventChance` 0.5）を追加。`maxDays` 60→40、到着順ボーナス [58,36,20,10,5,0]。称号の基準を下げた（名物通7・思い出の旅人55・思い出ぶくろ70・人望の旅人55）。
- シミュレーション（各1000回）：到着22日目・終了27日・野宿4.6回（15回→）・勝率 2人=社28/食28/堅24/急19、4人=社30/食27/堅16/急28、6人=社24/食27/堅19/急31。堅実が4人で16%と少し低い（名物を買うかは路銀の余裕で決まるので、`meibutsuLove` では動かない）。
- 確認：`npm run check`（単体43件）、`npm run test:e2e`（8件）。e2e の「働く」テストは、道中記が流れて不安定だったので、路銀の変化の確認に変えた。

### 2026-11-17 Claude（ROADMAP A2・A4：宿の格・称号・旅日記）
- SCHEMA_VERSION 2。宿の格・本陣、称号8、旅日記、結果画面の称号と日記、宿の切り替えボタン。
- シミュレーション（各1000回）：勝率 2人=社29/食27/堅24/急20、4人=社30/食29/堅21/急20、6人=社32/食23/堅20/急25（すべて20〜32%）。
- 確認：`npm run check`（単体43件）、`npm run test:e2e`（8件：desktop・mobile × 4）。
- 野宿の回数（目標10回前後）は、宿場以外で日が終わる構造のため減らず、15回前後。次の案：宿場の手前で「ここで泊まる」を選べる、など（要相談）。
- 次：ROADMAP C（2D の演出）。

### 2026-11-17 Claude（ROADMAP A1・A3：早足・野宿）
- 早足の行動、野宿の連続で疲れ、CPU の早足、画面のボタン。
- シミュレーション（各1000回）：勝率 2人=社29/食27/急19/堅25、4人=社32/食27/堅20/急22、6人=社29/食27/堅17/急28。到着37.6日目・野宿15.5回（目標10回前後は、A2 宿の格で）。
- 確認：`npm run check`（単体37件）、`npm run test:e2e`（6件）。
- 次：A2 宿の格＋A4 称号・旅日記（SCHEMA_VERSION 2・移行・テスト）。

### 2026-11-17 Claude（設計案）
- `docs/ROADMAP.md` を作成（A ゲームの芯 → C 2Dの演出 → B 中身 → D 複数人 → E 絵 → F 3D → G 公開）。コードの変更なし。

### 2026-11-17 Claude（評判の効果）
- 宿代の割引・割増、関所と出会いの特別な選択肢。画面の旅人の札に「宿代」を表示。
- シミュレーション（4人×500）：到着38.7日目・平均得点200・終了時の評判 平均49（45以上は約半数）。勝率：食い道楽34%・人情家31%・堅実21%・急ぎ旅14%。
- 確認：`npm run check`（単体34件）、`npm run test:e2e`（6件）。

### 2026-11-17 Claude（宿場の専用イベント10件）
- 話の濃い10宿に専用イベント（二択・各宿一度だけ）を追加。史実は有名な範囲に絞った（細部は資料で要確認）。
- シミュレーション（4人×500）：到着39.4日目・平均得点186.5（専用イベントで思い出・評判が増えた）。勝率：食い道楽39%・人情家28%・堅実20%・急ぎ旅13%（食い道楽が強くなった。次の調整候補）。
- 確認：`npm run check`（単体31件）、`npm run test:e2e`（6件）。
- 次：残りの宿の話、2D の演出（駒のアニメーション・サイコロ・小地図）、その後に3Dの試作（1区間だけ）。

### 2026-11-17 Claude（53次）
- 盤面を53宿・108マスに。名物27、新居の関所、出来事6件追加。バランスを再調整（上記）。
- 確認：`npm run check`（単体29件）、`npm run test:e2e`（6件）、`npm run simulate`。

### 2026-11-17 Claude（MVP）
- 雛形（Vite + React + TS + vitest + oxlint + Playwright）、エンジン（rng・stats・events・board・cpu・setup・scoring・session・simulate）、保存、2D 画面。
- 確認：`npm run check`（単体24件）、`npm run test:e2e`（6件：desktop・mobile × 3）、`npm run simulate`。
