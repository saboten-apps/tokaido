// 遊び方。数値は balance.json から読む（ルールを変えても、説明が古くならない）。

import { DEFAULT_CONFIG, ROLE_IDS } from '../engine'

const cfg = DEFAULT_CONFIG

export function HowToPlay({ onClose }: { onClose: () => void }) {
  const b = cfg.balance
  const t = b.travel
  const s = b.scoring
  return (
    <div className="howto" role="dialog" aria-label="遊び方" data-testid="howto">
      <div className="howto-body">
        <h2>遊び方</h2>
        <h3>めざすところ</h3>
        <p>江戸・日本橋から京都・三条大橋まで、東海道の宿場を旅します。先に着くことより、着いたときの<strong>得点</strong>で競います。{b.game.maxDays}日が過ぎると、そこで旅は終わります。</p>

        <h3>1日の流れ</h3>
        <ul>
          <li><strong>サイコロを振る</strong>：出た目の数だけ進みます。箱根・新居の関所と大井川では、目が余っても必ず止まります。</li>
          <li><strong>宿場をめざす</strong>：出目の分だけ進みますが、宿場に着いたらそこで止まります（出目の残りは使いません）。止まると<strong>スタンプ</strong>・名物・宿が手に入ります。ただし、先へは進めません。</li>
          <li><strong>早足で振る</strong>：目に+{t.hurryBonus}マス。そのかわり体力を余分に使います（体力{t.hurryMinStamina}以上のとき）。</li>
          <li><strong>働いて稼ぐ</strong>：進まずに、路銀（+{t.workMoney}文）を稼ぎます。路銀が尽きても脱落しません。</li>
          <li><strong>泊まり方</strong>：宿場で日が終わると宿に泊まり、体力が戻ります。木賃宿は安く、旅籠はふつうです。</li>
        </ul>

        <h3>能力値</h3>
        <ul>
          <li><strong>路銀</strong>：宿代（{t.innCost}文）、名物、茶屋、出来事で使います。</li>
          <li><strong>体力</strong>：歩くと減ります。{t.tiredStamina}未満だと、疲れて出目が{t.tiredMaxFace}までになります。宿以外（野宿）で日が終わると体力が減り、2日続くと疲れます。</li>
          <li><strong>思い出</strong>：名所・名物・出来事で増えます。得点になります。</li>
          <li><strong>評判</strong>：{b.reputation.goodAt}以上で宿代が割引、{b.lodging.honjin.reputationAt}以上だと本陣に招かれます。関所や出会いで、特別な選択肢が出ます。</li>
        </ul>

        <h3>止まったマス</h3>
        <ul>
          <li><strong>宿場</strong>：スタンプを押せます。その宿場の話が一度だけ起きます。名物があれば買えます（思い出と得点）。</li>
          <li><strong>出来事・名所・茶屋</strong>：道中の出会いや景色、ひと休み。</li>
          <li><strong>大井川</strong>：人足を雇ってすぐ渡るか、川明けを待つ脇道へ進むかを選びます。</li>
        </ul>

        <h3>得点</h3>
        <p>路銀 {s.moneyPerPoint}文＝1点／思い出×{s.memoriesWeight}／評判×{s.reputationWeight}／名物 1つ{s.meibutsuPoints}点／宿場スタンプ 1つ{s.stampPoints}点（止まった宿場だけ。通り過ぎただけでは押せません）／京都に着くと{s.arrivedBonus}点＋到着順（1番目 +{s.arrivalRankBonus[0]}点、2番目 +{s.arrivalRankBonus[1]}点…）。</p>

        <h3>旅人の身分</h3>
        <ul>
          {ROLE_IDS.map((id) => (
            <li key={id}><strong>{b.roles[id].name}</strong>：{b.roles[id].desc}</li>
          ))}
        </ul>

        <h3>オンライン</h3>
        <p>「オンラインで遊ぶ」で部屋をつくり、コードか招待リンクを友だちに伝えます。持ち時間（45秒）を切らすと、CPU が代わりに進めます。</p>
        <button className="primary" data-testid="howto-close" onClick={onClose}>閉じる</button>
      </div>
    </div>
  )
}
