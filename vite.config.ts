/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // 3D の盤面（three.js）は、開いたときだけ読み込む別の塊。大きいのは承知なので、警告の基準を上げる
  build: { chunkSizeWarningLimit: 700 },
  test: {
    include: ['src/**/*.test.ts'],
    testTimeout: 20000,
  },
})
