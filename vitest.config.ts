/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    css: true,
    // worktrees الأدوات تحوي نسخاً كاملة من التطبيق — بدون هذا exclusion
    // يجمع vitest اختبارات منها ويستنزف عمّال التشغيل فينفد المهلة.
    exclude: ['**/node_modules/**', '**/dist/**', '**/.kilo/**'],
  },
})
