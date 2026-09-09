/**
 * إعدادات الموقع العامة + أدوات SEO (Meta / Open Graph / Twitter / JSON-LD).
 * تُحقن الميتا ديناميكياً في صفحات SPA بعد التركيب.
 */

import { getApiBaseUrl } from '@/shared/lib/api-url'

export const SITE_NAME = 'جولد ماستر'
export const SITE_NAME_LATIN = 'GOLDMASTER'
export const SITE_DESCRIPTION =
  'نظام ERP ذكي ومتكامل لإدارة محلات الذهب والصاغة: مخزون المشغولات، كاشير POS باللمس للتابلت 10 إنش، حساب كسر ومصنعية الذهب عيار 18 و 21 و 24، حركات الخزينة والتقارير.'

export const SITE_PHONE_DISPLAY = '01551702595'
export const SITE_PHONE_INTL = '+201551702595'
export const TEL_LINK = `tel:${SITE_PHONE_INTL}`
export const WHATSAPP_LINK = `https://wa.me/201551702595?text=${encodeURIComponent('مرحباً، أرغب في الاستفسار عن نظام جولد ماستر لإدارة محلات الذهب.')}`

const API_BASE = getApiBaseUrl()

/**
 * رابط الموقع النهائي؛ يُحدد عبر VITE_SITE_URL عند البناء، وإلا يُشتق من النطاق الحالي.
 */
export function getSiteUrl(): string {
  const env = import.meta.env.VITE_SITE_URL as string | undefined
  return (env?.trim() ? env.trim().replace(/\/+$/, '') : window.location.origin)
}

/** تحويل مسار نسبي إلى رابط مطلق كامل. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  const base = path.startsWith('/') ? getSiteUrl() : `${getSiteUrl()}/`
  return `${base}${path.replace(/^\//, '')}`
}

/**
 * صورة المنتج قد تكون رابطاً كاملاً (Catbox) أو مساراً نسبياً على خادم الـ API.
 * الحالة الثانية تُحل بالنسبة للسيرفر الخلفي وليس الموقع الأمامي.
 */
export function resolveProductImage(path: string | null | undefined): string {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  if (path.startsWith('/')) return `${API_BASE}${path}`
  return `${API_BASE}/${path}`
}

function setMetaBy(attr: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export interface PageMeta {
  title: string
  description: string
  url: string
  image?: string
  type?: string
}

const DEFAULT_META: PageMeta = {
  title: `${SITE_NAME} | نظام إدارة محلات الذهب والصاغة الذكي ERP`,
  description: SITE_DESCRIPTION,
  url: '/',
  type: 'website',
}

/** تحديث بيانات الصفحة الحالية: العنوان + الوصف + الكانونيكال + OG + Twitter. */
export function setPageMeta(meta: PageMeta): void {
  const url = meta.url.startsWith('http') ? meta.url : absoluteUrl(meta.url)
  const image = meta.image ? resolveProductImage(meta.image) : ''

  document.title = meta.title
  setMetaBy('name', 'description', meta.description)

  let canonical = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  )
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }
  canonical.setAttribute('href', url)

  const og = meta.type ?? 'website'
  setMetaBy('property', 'og:type', og)
  setMetaBy('property', 'og:site_name', SITE_NAME)
  setMetaBy('property', 'og:title', meta.title)
  setMetaBy('property', 'og:description', meta.description)
  setMetaBy('property', 'og:url', url)
  setMetaBy('name', 'twitter:card', 'summary_large_image')
  setMetaBy('name', 'twitter:title', meta.title)
  setMetaBy('name', 'twitter:description', meta.description)
  setMetaBy('name', 'twitter:url', url)

  if (image) {
    setMetaBy('property', 'og:image', image)
    setMetaBy('property', 'og:image:alt', meta.title)
    setMetaBy('name', 'twitter:image', image)
  }
  const ogImage = document.head.querySelector<HTMLMetaElement>(
    'meta[property="og:image"]',
  )
  if (!image && ogImage) ogImage.setAttribute('content', '')
}

/** إرجاع ميتا الصفحة الافتراضية (الرئيسية) بعد الخروج من صفحة منتج عامة. */
export function resetPageMeta(): void {
  setPageMeta(DEFAULT_META)
}

/** إضافة/تحديث سكيما schema.org بصيغة JSON-LD داخل الـ head. */
export function setJsonLd(id: string, payload: unknown): void {
  const selector = `script[data-seo-jsonld][data-id="${id}"]`
  let script = document.head.querySelector<HTMLScriptElement>(selector)
  if (!script) {
    script = document.createElement('script')
    script.setAttribute('type', 'application/ld+json')
    script.setAttribute('data-seo-jsonld', '')
    script.setAttribute('data-id', id)
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(payload)
}

export function removeJsonLd(id: string): void {
  document.head
    .querySelector<HTMLScriptElement>(
      `script[data-seo-jsonld][data-id="${id}"]`,
    )
    ?.remove()
}