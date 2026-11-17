// タイトル画面：東海道五拾三次（日本橋）の浮世絵と、旅籠の宿帳風フォーム

import { DEFAULT_CONFIG, MAX_PLAYERS, MIN_PLAYERS, ROLE_IDS } from '../engine'
import type { GameState, RoleId } from '../types/game'

interface Props {
  humans: number
  setHumans: (n: number) => void
  names: string[]
  setNames: React.Dispatch<React.SetStateAction<string[]>>
  roles: RoleId[]
  setRoles: React.Dispatch<React.SetStateAction<RoleId[]>>
  count: number
  setCount: (n: number) => void
  saved: GameState | null
  onStart: () => void
  onContinue: () => void
  onOnline: () => void
  onHowTo: () => void
  howtoDialog: React.ReactNode
}

export function TitleScreen({
  humans,
  setHumans,
  names,
  setNames,
  roles,
  setRoles,
  count,
  setCount,
  saved,
  onStart,
  onContinue,
  onOnline,
  onHowTo,
  howtoDialog,
}: Props) {
  return (
    <div className="title">
      {howtoDialog}
      <header className="title-header">
        <span className="title-badge">東海道五十三次</span>
        <h1>東海道すごろく</h1>
        <p className="lead">
          江戸・日本橋から京都・三条大橋へ。路銀をやりくりし、名物を味わい、思い出を集める旅。
        </p>
      </header>

      <div className="title-content">
        {/* 左カラム：浮世絵アイキャッチ（PC幅で見開き、スマホ幅で上部配置） */}
        <div className="title-art-card">
          <div className="title-art-frame">
            <img
              src="/hiroshige/%E6%97%A5%E6%9C%AC%E6%A9%8B.webp"
              alt="東海道五拾三次 日本橋 朝之景"
              loading="eager"
            />
          </div>
          <div className="title-art-caption">
            歌川広重『東海道五拾三次之内 日本橋 朝之景』（保永堂版・第1図）
            <br />
            メトロポリタン美術館所蔵（CC0）
          </div>
        </div>

        {/* 右カラム：宿帳風設定フォーム */}
        <div className="title-form-card">
          <label>
            遊ぶ人の数（同じ端末で、順番に遊ぶ）
            <select
              data-testid="humans"
              value={humans}
              onChange={(e) => {
                const h = Number(e.target.value)
                setHumans(h)
                if (count < h) setCount(h)
              }}
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>{n}人</option>
              ))}
            </select>
          </label>

          {names.slice(0, humans).map((n, i) => (
            <label key={i}>
              {humans > 1 ? `${i + 1}人目の名前` : '旅人の名前'}
              <input
                data-testid={`name-${i}`}
                value={n}
                maxLength={8}
                onChange={(e) =>
                  setNames((cur) => cur.map((x, j) => (j === i ? e.target.value : x)))
                }
              />
              <select
                data-testid={`role-${i}`}
                aria-label={`${n}の身分`}
                value={roles[i]}
                onChange={(e) =>
                  setRoles((cur) =>
                    cur.map((x, j) => (j === i ? (e.target.value as RoleId) : x)),
                  )
                }
              >
                {ROLE_IDS.map((id) => (
                  <option key={id} value={id}>
                    {DEFAULT_CONFIG.balance.roles[id].name}
                  </option>
                ))}
              </select>
              <small className="role-desc" data-testid={`role-desc-${i}`}>
                {DEFAULT_CONFIG.balance.roles[roles[i]].desc}
              </small>
            </label>
          ))}

          <label>
            旅人の総数（遊ぶ人＋CPU）
            <select
              data-testid="count"
              value={Math.max(count, humans)}
              onChange={(e) => setCount(Number(e.target.value))}
            >
              {Array.from(
                { length: MAX_PLAYERS - Math.max(MIN_PLAYERS, humans) + 1 },
                (_, i) => i + Math.max(MIN_PLAYERS, humans),
              ).map((n) => (
                <option key={n} value={n}>{n}人</option>
              ))}
            </select>
          </label>

          <button className="primary" data-testid="start" onClick={onStart}>
            旅に出る
          </button>
          <button data-testid="go-online" onClick={onOnline}>
            オンラインで遊ぶ
          </button>
          <button data-testid="open-howto" className="linkish" onClick={onHowTo}>
            遊び方
          </button>
          {saved && (
            <button data-testid="continue" onClick={onContinue}>
              続きから（{saved.day}日目）
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
