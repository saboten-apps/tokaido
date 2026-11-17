import { defineConfig, devices } from '@playwright/test'

const PORT = 8787

// オンライン対戦の e2e：ローカルの Worker（wrangler dev。Durable Object つき）に、2つのブラウザでつなぐ
export default defineConfig({
  testDir: './e2e-online',
  timeout: 180_000,
  workers: 1,
  reporter: 'list',
  use: { baseURL: `http://localhost:${PORT}`, trace: 'off' },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npx wrangler dev --port ${PORT} --local`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
