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

const SITE_URL = 'https://goldemanger.vercel.app'
const SITE_URL_PATTERN = /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/i

/** يقبل VITE_SITE_URL فقط إن كان رابط https صالحاً؛ وإلا يعود للثابت ويسجّل تحذيراً. */
function resolveSiteUrl(raw) {
  const candidate = (raw || '').trim().replace(/\/+$/, '')
  if (candidate && SITE_URL_PATTERN.test(candidate)) return candidate
  if (candidate) {
    console.warn(`[generate-seo] تجاهل VITE_SITE_URL غير صالح: "${raw}" → استخدام ${SITE_URL}`)
  }
  return SITE_URL
}

const siteUrl = resolveSiteUrl(process.env.VITE_SITE_URL || readEnv())

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
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    '  <url>',
    `    <loc>${siteUrl}/</loc>`,
    '    <changefreq>daily</changefreq>',
    '    <priority>1.0</priority>',
    '  </url>',
    '  <url>',
    `    <loc>${siteUrl}/login</loc>`,
    '    <changefreq>monthly</changefreq>',
    '    <priority>0.8</priority>',
    '  </url>',
    '</urlset>',
    '',
  ].join('\n'),
  'utf8',
)

console.log(`[generate-seo] robots.txt + sitemap.xml → ${siteUrl}`)