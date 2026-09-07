import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { defineConfig, type Plugin } from 'vite'

const defaultSiteUrl = 'https://goldemanger.vercel.app'

function siteUrlDefault(): Plugin {
  return {
    name: 'site-url-default',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const siteUrl = (process.env.VITE_SITE_URL?.trim() || defaultSiteUrl).replace(/\/+$/, '')
        return html.replace(/%VITE_SITE_URL%/g, siteUrl)
      },
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    siteUrlDefault(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'جولد ماستر | نظام إدارة محلات الذهب',
        short_name: 'جولد ماستر',
        description:
          'نظام ERP ذكي لإدارة محلات الذهب: مخزون، مبيعات، مشتريات، خزينة وتقارير على تابلت 10 إنش.',
        lang: 'ar',
        dir: 'rtl',
        start_url: '/app',
        scope: '/',
        display: 'standalone',
        orientation: 'landscape',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // بيانات API لا تُخزَّن بقوة: الشبكة أولاً حتى لا تعود مشكلة القدم.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ request }) =>
              request.destination === 'image' || request.destination === 'font',
            handler: 'CacheFirst',
            options: {
              cacheName: 'assets-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': { target: 'https://goldmaster.runasp.net', changeOrigin: true },
      '/uploads': { target: 'https://goldmaster.runasp.net', changeOrigin: true },
    },
  },
})
