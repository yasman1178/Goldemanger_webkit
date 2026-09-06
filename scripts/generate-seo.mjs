/* global process, console */
/**
 * يولّد public/robots.txt و public/sitemap.xml من VITE_SITE_URL في .env
 * (قبل تشغيل dev/build) حتى لا تُخزَّن روابط مطلقة خاطئة في المستودع.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')

function readEnv() {
  try {
    const envFile = readFileSync(join(root, '.env'), 'utf8')
    const match = envFile.match(/^\s*VITE_SITE_URL\s*=\s*(.+)\s*$/m)
    return match?.[1]?.trim() || ''
  } catch {
    return ''
  }
}

const siteUrl = (process.env.VITE_SITE_URL?.trim() || readEnv() || 'http://localhost:5173').replace(/\/+$/, '')

mkdirSync(publicDir, { recursive: true })

writeFileSync(
  join(publicDir, 'robots.txt'),
  [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n'),
  'utf8',
)

writeFileSync(
  join(publicDir, 'sitemap.xml'),
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <url>',
    `    <loc>${siteUrl}/</loc>`,
    '    <changefreq>weekly</changefreq>',
    '    <priority>1.0</priority>',
    '  </url>',
    '</urlset>',
    '',
  ].join('\n'),
  'utf8',
)

console.log(`[generate-seo] robots.txt + sitemap.xml → ${siteUrl}`)