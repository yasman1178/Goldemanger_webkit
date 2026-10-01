/**
 * مولّد صور المشاركة الفاخرة لمنتجات الذهب والمجوهرات — 10 استايلات عصرية مطورة.
 *
 * يدعم قياسين رئيسيين:
 * 1. `9:16` (1080×1920) — قياس الستوري والريلز (Instagram Stories, Facebook Stories, Reels, WhatsApp Status).
 * 2. `1.91:1` (1200×630) — قياس بوستات ومنشورات فيسبوك القياسية وصور الـ OpenGraph.
 */

import { getApiBaseUrl } from '@/shared/lib/api-url'

export type ShareImageStyleId =
  | 'gold-luxury'
  | 'dark-noir'
  | 'minimal-white'
  | 'marble-classic'
  | 'neon-gold'
  | 'arabesque'
  | 'retro-vintage'
  | 'crystal-prism'
  | 'modern-arabic'
  | 'chocolate-brown'

export type ShareImageAspectRatio = '9:16' | '1.91:1'

export interface ShareImageSpec {
  productName: string
  weight: number
  karat: number
  size: number
  imageUrl?: string | null
  phoneDisplay?: string | null
  storeName?: string | null
  style?: ShareImageStyleId
  aspectRatio?: ShareImageAspectRatio
  makingDiscountPercent?: number
}

export const SHARE_IMAGE_STYLES: ReadonlyArray<{
  id: ShareImageStyleId
  label: string
  subtitle: string
  swatch: string
  tone: 'light' | 'dark'
}> = [
  { id: 'gold-luxury', label: 'ذهب ملكي', subtitle: 'Royal Gold', swatch: '#d4af37', tone: 'dark' },
  { id: 'dark-noir', label: 'أسود مخملي', subtitle: 'Velvet Noir', swatch: '#121214', tone: 'dark' },
  { id: 'minimal-white', label: 'عاجي ستوديو', subtitle: 'Studio Ivory', swatch: '#fbfaf8', tone: 'light' },
  { id: 'marble-classic', label: 'رخام كلكتا', subtitle: 'Calacatta Gold', swatch: '#eae5de', tone: 'light' },
  { id: 'neon-gold', label: 'سايبر نيون', subtitle: 'Cyber Glow', swatch: '#0a0d10', tone: 'dark' },
  { id: 'arabesque', label: 'قرمزي أندلسي', subtitle: 'Royal Crimson', swatch: '#5a1218', tone: 'dark' },
  { id: 'retro-vintage', label: 'كهرمان أنتيك', subtitle: 'Warm Amber', swatch: '#9a6b28', tone: 'dark' },
  { id: 'crystal-prism', label: 'ياقوتي أزرق', subtitle: 'Sapphire Prism', swatch: '#11293b', tone: 'dark' },
  { id: 'modern-arabic', label: 'زمردي ملكي', subtitle: 'Imperial Emerald', swatch: '#0c3324', tone: 'dark' },
  { id: 'chocolate-brown', label: 'موكا برونزي', subtitle: 'Warm Mocha', swatch: '#361e12', tone: 'dark' },
]

const FONT_FAMILY = "'Cairo', 'Segoe UI', system-ui, -apple-system, sans-serif"

function fmtWeight(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return value % 1 === 0 ? String(value) : value.toFixed(value >= 100 ? 1 : 2)
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

async function loadImage(url: string): Promise<HTMLImageElement | null> {
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = url
    })
  }

  try {
    const res = await fetch(url, { mode: 'cors' })
    if (res.ok) {
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const img = await new Promise<HTMLImageElement | null>((resolve) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = () => resolve(null)
        image.src = objectUrl
      })
      if (img) return img
    }
  } catch {
    // fallback
  }

  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

function resolveImageUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url
  const apiBase = getApiBaseUrl()
  return `${apiBase}${url.startsWith('/') ? url : `/${url}`}`
}

function drawSparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  alpha = 0.85,
  color = '#ffffff',
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, -size)
  ctx.quadraticCurveTo(size * 0.15, -size * 0.15, size, 0)
  ctx.quadraticCurveTo(size * 0.15, size * 0.15, 0, size)
  ctx.quadraticCurveTo(-size * 0.15, size * 0.15, -size, 0)
  ctx.quadraticCurveTo(-size * 0.15, -size * 0.15, 0, -size)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

/**
 * رسم الإطار الدائري الماسي الفاخر للمنتج (Hero Bezel Ring)
 */
function drawHeroProduct(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  img: HTMLImageElement | null,
  accentColor: string,
  tone: 'light' | 'dark',
) {
  ctx.save()

  // 1. هالة ضوئية خلفية متوهجة (Radial Ambient Bloom)
  const aura = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.5)
  aura.addColorStop(0, accentColor === '#ffffff' ? 'rgba(212,175,55,0.30)' : `${accentColor}33`)
  aura.addColorStop(0.6, accentColor === '#ffffff' ? 'rgba(212,175,55,0.10)' : `${accentColor}12`)
  aura.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = aura
  ctx.beginPath()
  ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2)
  ctx.fill()

  // 2. ظل أرضي ثلاثي الأبعاد تحت القرص (Drop Shadow Pedestal)
  const shadowGrad = ctx.createRadialGradient(cx, cy + r * 0.95, 20, cx, cy + r * 0.95, r * 1.1)
  shadowGrad.addColorStop(0, 'rgba(0,0,0,0.55)')
  shadowGrad.addColorStop(0.7, 'rgba(0,0,0,0.20)')
  shadowGrad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = shadowGrad
  ctx.beginPath()
  ctx.ellipse(cx, cy + r * 0.95, r * 1.05, r * 0.22, 0, 0, Math.PI * 2)
  ctx.fill()

  // 3. الإطار الذهبي الخارجي المتدرج
  ctx.shadowColor = 'rgba(0,0,0,0.40)'
  ctx.shadowBlur = 24
  ctx.shadowOffsetY = 12

  const outerGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
  outerGrad.addColorStop(0, '#fff4d0')
  outerGrad.addColorStop(0.25, '#d4af37')
  outerGrad.addColorStop(0.5, '#aa7c11')
  outerGrad.addColorStop(0.75, '#f3e5ab')
  outerGrad.addColorStop(1, '#8c6209')

  ctx.strokeStyle = outerGrad
  ctx.lineWidth = Math.max(6, Math.round(r * 0.045))
  ctx.beginPath()
  ctx.arc(cx, cy, r + 5, 0, Math.PI * 2)
  ctx.stroke()
  ctx.shadowColor = 'transparent'

  // 4. حلقة زجاجية رفيعة داخلية
  ctx.strokeStyle = 'rgba(255,255,255,0.70)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(cx, cy, r - 3, 0, Math.PI * 2)
  ctx.stroke()

  // 5. خلفية طبق العرض المخملية (Platter Background)
  const platter = ctx.createRadialGradient(cx, cy - r * 0.3, 10, cx, cy, r)
  if (tone === 'light') {
    platter.addColorStop(0, '#ffffff')
    platter.addColorStop(1, '#f1ede4')
  } else {
    platter.addColorStop(0, '#222226')
    platter.addColorStop(0.6, '#141416')
    platter.addColorStop(1, '#0a0a0c')
  }
  ctx.fillStyle = platter
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()

  // 6. رسم صورة المنتج بداخل القرص
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r - 2, 0, Math.PI * 2)
  ctx.clip()

  if (img) {
    const scale = Math.max((r * 2) / img.width, (r * 2) / img.height)
    const dw = img.width * scale
    const dh = img.height * scale
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh)
  } else {
    // أيقونة مجوهرات هندسية راقية عند عدم توفر صورة
    const gemGrad = ctx.createLinearGradient(cx - r * 0.4, cy - r * 0.4, cx + r * 0.4, cy + r * 0.4)
    gemGrad.addColorStop(0, '#ffe89c')
    gemGrad.addColorStop(0.5, '#d4af37')
    gemGrad.addColorStop(1, '#946808')
    ctx.fillStyle = gemGrad
    ctx.beginPath()
    ctx.moveTo(cx, cy - r * 0.5)
    ctx.lineTo(cx + r * 0.4, cy - r * 0.1)
    ctx.lineTo(cx + r * 0.25, cy + r * 0.5)
    ctx.lineTo(cx - r * 0.25, cy + r * 0.5)
    ctx.lineTo(cx - r * 0.4, cy - r * 0.1)
    ctx.closePath()
    ctx.fill()
  }

  // 7. لمعة زجاجية أفقية (Glass Reflection Sheen)
  const sheen = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
  sheen.addColorStop(0, 'rgba(255,255,255,0.32)')
  sheen.addColorStop(0.4, 'rgba(255,255,255,0.06)')
  sheen.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = sheen
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
  ctx.restore()

  // 8. لمعات ماسية على الإطار (Jewelry Facet Sparkles)
  drawSparkle(ctx, cx + r * 0.72, cy - r * 0.68, Math.max(10, r * 0.08), 0.95, '#fff6d8')
  drawSparkle(ctx, cx - r * 0.75, cy + r * 0.65, Math.max(8, r * 0.06), 0.80, '#fff6d8')

  ctx.restore()
}

/**
 * ختم خصم المصنعية الراقي — وسام ملكي ذهبي وأحمر مخملي
 */
function drawDiscountSeal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  percent: number,
) {
  if (!(percent > 0)) return
  ctx.save()

  // ظل قوي للوسام
  ctx.shadowColor = 'rgba(0,0,0,0.50)'
  ctx.shadowBlur = 18
  ctx.shadowOffsetY = 8

  // إطار خارجي مسنن أو حلقة ذهبية مذهّبة
  const outerGold = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
  outerGold.addColorStop(0, '#ffe89c')
  outerGold.addColorStop(0.5, '#d4af37')
  outerGold.addColorStop(1, '#855905')
  ctx.fillStyle = outerGold
  ctx.beginPath()
  ctx.arc(cx, cy, r + 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowColor = 'transparent'

  // قرص أحمر مخملي داخلي
  const redGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 5, cx, cy, r)
  redGrad.addColorStop(0, '#ff3b3b')
  redGrad.addColorStop(0.7, '#c8102e')
  redGrad.addColorStop(1, '#800517')
  ctx.fillStyle = redGrad
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()

  // حلقة بيضاء رقيقة
  ctx.strokeStyle = 'rgba(255,255,255,0.70)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(cx, cy, r - 4, 0, Math.PI * 2)
  ctx.stroke()

  // كتابة النسبة
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.direction = 'rtl'
  ctx.font = `900 ${Math.round(r * 0.65)}px ${FONT_FAMILY}`
  ctx.fillText(`${Math.round(percent)}%`, cx, cy - r * 0.12)

  ctx.font = `800 ${Math.round(r * 0.28)}px ${FONT_FAMILY}`
  ctx.fillStyle = '#ffe89c'
  ctx.fillText('خصم مصنعية', cx, cy + r * 0.40)

  ctx.restore()
}

/**
 * رسم نسيج وخلفية خاصة بكل استايل
 */
function drawStyleBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  styleId: ShareImageStyleId,
) {
  ctx.save()

  switch (styleId) {
    case 'gold-luxury': {
      // تدرج دافئ فاخر بين الذهب والشامبين والأسود الملكي
      const bg = ctx.createRadialGradient(w / 2, h * 0.38, 50, w / 2, h / 2, h * 0.8)
      bg.addColorStop(0, '#2e2410')
      bg.addColorStop(0.5, '#181308')
      bg.addColorStop(1, '#0c0a04')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      // شبكة نقاط ذهبية متقاطعة
      ctx.fillStyle = 'rgba(212,175,55,0.06)'
      for (let y = 30; y < h; y += 45) {
        for (let x = 30; x < w; x += 45) {
          ctx.beginPath()
          ctx.arc(x, y, 1.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      break
    }

    case 'dark-noir': {
      // أسود أوبسيديان مخملي مع توهج مركزي دافئ
      const bg = ctx.createRadialGradient(w / 2, h * 0.4, 40, w / 2, h / 2, h * 0.85)
      bg.addColorStop(0, '#1c1c20')
      bg.addColorStop(0.6, '#0f0f11')
      bg.addColorStop(1, '#050506')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)
      break
    }

    case 'minimal-white': {
      // عاجي ستوديو نقي وفاتح
      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#ffffff')
      bg.addColorStop(0.6, '#f8f6f0')
      bg.addColorStop(1, '#eee9de')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      // إطار داخلي رفيع جداً
      ctx.strokeStyle = 'rgba(212,175,55,0.40)'
      ctx.lineWidth = 1.5
      ctx.strokeRect(30, 30, w - 60, h - 60)
      break
    }

    case 'marble-classic': {
      // رخام كلكتا مع عروق ذهبية
      const bg = ctx.createLinearGradient(0, 0, w, h)
      bg.addColorStop(0, '#f9f6f0')
      bg.addColorStop(0.5, '#eee8dc')
      bg.addColorStop(1, '#ded5c3')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      ctx.save()
      ctx.strokeStyle = 'rgba(180,140,80,0.18)'
      ctx.lineWidth = 2
      for (let i = 0; i < 7; i++) {
        ctx.beginPath()
        ctx.moveTo(0, h * 0.15 + i * (h * 0.14))
        ctx.bezierCurveTo(
          w * 0.35,
          h * 0.1 + i * (h * 0.14),
          w * 0.65,
          h * 0.22 + i * (h * 0.14),
          w,
          h * 0.18 + i * (h * 0.14),
        )
        ctx.stroke()
      }
      ctx.restore()
      break
    }

    case 'neon-gold': {
      // سايبر جولد على أسود فحمي
      ctx.fillStyle = '#06080a'
      ctx.fillRect(0, 0, w, h)

      // حلقات نيون متوهجة متحدة المركز
      ctx.save()
      ctx.shadowColor = '#d4af37'
      ctx.shadowBlur = 30
      ctx.strokeStyle = 'rgba(212,175,55,0.25)'
      ctx.lineWidth = 1.5
      for (const r of [160, 260, 380, 520]) {
        ctx.beginPath()
        ctx.arc(w / 2, h * 0.38, r, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.restore()
      break
    }

    case 'arabesque': {
      // قرمزي ملكي عميق
      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#4a0e14')
      bg.addColorStop(0.5, '#2b070b')
      bg.addColorStop(1, '#150204')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      // زخارف هندسية عربية خفيفة
      ctx.save()
      ctx.strokeStyle = 'rgba(212,175,55,0.14)'
      ctx.lineWidth = 1.2
      const step = 80
      for (let y = 40; y < h; y += step) {
        for (let x = 40; x < w; x += step) {
          ctx.beginPath()
          ctx.arc(x, y, 16, 0, Math.PI * 2)
          ctx.moveTo(x - 16, y)
          ctx.lineTo(x + 16, y)
          ctx.moveTo(x, y - 16)
          ctx.lineTo(x, y + 16)
          ctx.stroke()
        }
      }
      ctx.restore()
      break
    }

    case 'retro-vintage': {
      // كهرمان دافئ أنتيك
      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#5a3d16')
      bg.addColorStop(0.5, '#3c2509')
      bg.addColorStop(1, '#201203')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)
      break
    }

    case 'crystal-prism': {
      // ياقوتي ملكي كحلي
      const bg = ctx.createLinearGradient(0, 0, w, h)
      bg.addColorStop(0, '#0a1d2e')
      bg.addColorStop(0.5, '#061320')
      bg.addColorStop(1, '#02070c')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      // حزم كريستالية منشورية
      ctx.save()
      const ray = ctx.createLinearGradient(0, 0, w, 0)
      ray.addColorStop(0, 'rgba(100,180,240,0)')
      ray.addColorStop(0.5, 'rgba(100,180,240,0.12)')
      ray.addColorStop(1, 'rgba(100,180,240,0)')
      ctx.fillStyle = ray
      ctx.fillRect(0, h * 0.2, w, 120)
      ctx.restore()
      break
    }

    case 'modern-arabic': {
      // أخضر زمردي ملكي
      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#0a3022')
      bg.addColorStop(0.5, '#051d14')
      bg.addColorStop(1, '#020d09')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      // أشعة شمسية ذهبية تنبثق من المركز
      ctx.save()
      ctx.strokeStyle = 'rgba(212,175,55,0.09)'
      ctx.lineWidth = 1
      for (let i = 0; i < 32; i++) {
        const ang = (i * Math.PI) / 16
        ctx.beginPath()
        ctx.moveTo(w / 2 + Math.cos(ang) * 80, h * 0.38 + Math.sin(ang) * 80)
        ctx.lineTo(w / 2 + Math.cos(ang) * w, h * 0.38 + Math.sin(ang) * w)
        ctx.stroke()
      }
      ctx.restore()
      break
    }

    case 'chocolate-brown': {
      // موكا برونزي ودافئ
      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#2d180c')
      bg.addColorStop(0.5, '#1e0e06')
      bg.addColorStop(1, '#110702')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)
      break
    }
  }

  // فينيت خفيف للأطراف
  const vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.8)
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(0,0,0,0.35)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, w, h)

  ctx.restore()
}

/**
 * إنشاء صورة المشاركة الشاملة — يدعم قياس 9:16 (ستوري/ريلز) وقياس 1.91:1 (بوست/فيسبوك)
 */
export async function buildProductShareImage(
  spec: ShareImageSpec,
): Promise<HTMLCanvasElement> {
  if (typeof document === 'undefined') throw new Error('Canvas requires a browser environment')

  try {
    await document.fonts.load(`900 64px Cairo`)
    await document.fonts.load(`700 32px Cairo`)
  } catch {
    // continue
  }

  const isStory = spec.aspectRatio === '9:16'
  const W = isStory ? 1080 : 1200
  const H = isStory ? 1920 : 630

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  const styleId = spec.style ?? 'gold-luxury'
  const styleObj = SHARE_IMAGE_STYLES.find((s) => s.id === styleId) ?? SHARE_IMAGE_STYLES[0]
  const isLight = styleObj.tone === 'light'

  // تحميل صورة المنتج إن وجدت
  const img = spec.imageUrl ? await loadImage(resolveImageUrl(spec.imageUrl)) : null

  const storeName = (spec.storeName ?? '').trim() || 'GOLD MASTER'
  const phone = (spec.phoneDisplay ?? '').trim() || '—'
  const discountPercent = Math.max(0, Math.min(100, Number(spec.makingDiscountPercent ?? 0) || 0))
  const productName = spec.productName.trim() || 'قطعة ذهبية مختارة'

  // 1. رسم الخلفية المخصصة
  drawStyleBackground(ctx, W, H, styleId)

  // ألوان النصوص والعناصر بناءً على التون (فاتح أو داكن)
  const primaryText = isLight ? '#1a1814' : '#ffffff'
  const subText = isLight ? '#665d50' : 'rgba(255,255,255,0.70)'
  const accentGold = '#d4af37'
  const cardBg = isLight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.07)'
  const cardBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(212,175,55,0.25)'

  // ─── مسار الرسم: قياس 9:16 (الستوري الرأسي) ───
  if (isStory) {
    // A. ترويسة المتجر العلوية (Top Brand Bar)
    ctx.save()
    const topBarY = 90
    // شارة المتجر الذهبية
    roundedRect(ctx, W / 2 - 220, topBarY, 440, 76, 38)
    ctx.fillStyle = cardBg
    ctx.fill()
    ctx.strokeStyle = cardBorder
    ctx.lineWidth = 1.5
    ctx.stroke()

    // الحرف الذهبي أو الشعار
    const emblemGrad = ctx.createLinearGradient(0, topBarY + 14, 0, topBarY + 62)
    emblemGrad.addColorStop(0, '#ffe89c')
    emblemGrad.addColorStop(1, '#aa7c11')
    ctx.fillStyle = emblemGrad
    roundedRect(ctx, W / 2 + 150, topBarY + 14, 48, 48, 14)
    ctx.fill()
    ctx.fillStyle = '#1c1505'
    ctx.font = `900 28px ${FONT_FAMILY}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('G', W / 2 + 174, topBarY + 38)

    // اسم المتجر
    ctx.direction = 'rtl'
    ctx.textAlign = 'right'
    ctx.font = `900 28px ${FONT_FAMILY}`
    ctx.fillStyle = primaryText
    ctx.fillText(storeName, W / 2 + 130, topBarY + 34)

    ctx.font = `600 16px ${FONT_FAMILY}`
    ctx.fillStyle = accentGold
    ctx.fillText('مجوهرات راقية • صاغة معتمدة', W / 2 + 130, topBarY + 58)
    ctx.restore()

    // B. صورة المنتج الكبيرة البارزة (Hero Product)
    const heroCx = W / 2
    const heroCy = 640
    const heroR = 360
    drawHeroProduct(ctx, heroCx, heroCy, heroR, img, accentGold, styleObj.tone)

    // C. ختم الخصم (إذا وجد)
    if (discountPercent > 0) {
      drawDiscountSeal(ctx, heroCx + heroR * 0.70, heroCy - heroR * 0.65, 86, discountPercent)
    }

    // D. اسم المنتج والعيار (Headline Title Zone)
    ctx.save()
    ctx.direction = 'rtl'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // شارة العيار العلوية
    const karatY = 1080
    const karatLabel = `ذهب عيار ${spec.karat} قيراط`
    ctx.font = `800 22px ${FONT_FAMILY}`
    const kw = ctx.measureText(karatLabel).width + 44
    roundedRect(ctx, W / 2 - kw / 2, karatY - 20, kw, 40, 20)
    ctx.fillStyle = 'rgba(212,175,55,0.18)'
    ctx.fill()
    ctx.strokeStyle = accentGold
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.fillStyle = accentGold
    ctx.fillText(karatLabel, W / 2, karatY)

    // اسم القطعة الرئيسي
    const titleY = 1170
    ctx.font = `900 56px ${FONT_FAMILY}`
    ctx.fillStyle = primaryText
    ctx.fillText(productName, W / 2, titleY)

    // وصف فرعي
    ctx.font = `600 24px ${FONT_FAMILY}`
    ctx.fillStyle = subText
    ctx.fillText('تصميم حصري • تشطيب متقن ودمغة رسمية', W / 2, titleY + 60)
    ctx.restore()

    // E. شبكة المواصفات الفاخرة (3 Cards Specs Grid)
    const specsY = 1320
    const specCards = [
      { label: 'الوزن الصافي', value: `${fmtWeight(spec.weight)} جم` },
      { label: 'عيار الذهب', value: `${spec.karat}K` },
      ...(spec.size > 0 ? [{ label: 'القياس', value: `${spec.size}` }] : [{ label: 'الحالة', value: 'جديد ومضمون' }]),
    ]

    const cardW = 280
    const cardGap = 20
    const totalW = specCards.length * cardW + (specCards.length - 1) * cardGap
    let startX = (W - totalW) / 2

    for (const card of specCards) {
      ctx.save()
      roundedRect(ctx, startX, specsY, cardW, 140, 24)
      ctx.fillStyle = cardBg
      ctx.fill()
      ctx.strokeStyle = cardBorder
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.direction = 'rtl'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // التسمية
      ctx.font = `700 20px ${FONT_FAMILY}`
      ctx.fillStyle = subText
      ctx.fillText(card.label, startX + cardW / 2, specsY + 44)

      // القيمة
      ctx.font = `900 36px ${FONT_FAMILY}`
      ctx.fillStyle = accentGold
      ctx.fillText(card.value, startX + cardW / 2, specsY + 95)
      ctx.restore()

      startX += cardW + cardGap
    }

    // F. تذييل الاتصال والدعوة للشراء (Bottom CTA & Contact Footer)
    ctx.save()
    const footerY = 1680
    roundedRect(ctx, 60, footerY, W - 120, 150, 32)
    const footerGrad = ctx.createLinearGradient(0, footerY, 0, footerY + 150)
    if (isLight) {
      footerGrad.addColorStop(0, '#ffffff')
      footerGrad.addColorStop(1, '#f5efe4')
    } else {
      footerGrad.addColorStop(0, '#1c1b18')
      footerGrad.addColorStop(1, '#0e0e0c')
    }
    ctx.fillStyle = footerGrad
    ctx.fill()
    ctx.strokeStyle = accentGold
    ctx.lineWidth = 2
    ctx.stroke()

    // اليمين: زر الحجز أو الاتصال
    ctx.direction = 'rtl'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = primaryText
    ctx.font = `900 32px ${FONT_FAMILY}`
    ctx.fillText('متاح الآن للحجز والشراء الفوري', 100, footerY + 52)

    ctx.font = `700 22px ${FONT_FAMILY}`
    ctx.fillStyle = subText
    ctx.fillText('تواصل معنا للاستفسار وتأكيد القطعة', 100, footerY + 98)

    // اليسار: كبسولة الهاتف
    if (phone && phone !== '—') {
      ctx.direction = 'ltr'
      ctx.textAlign = 'center'
      const phonePillX = W - 360
      const phonePillY = footerY + 42
      roundedRect(ctx, phonePillX, phonePillY, 260, 66, 33)
      ctx.fillStyle = accentGold
      ctx.fill()
      ctx.fillStyle = '#1c1505'
      ctx.font = `900 26px ${FONT_FAMILY}`
      ctx.fillText(`📞 ${phone}`, phonePillX + 130, phonePillY + 34)
    }
    ctx.restore()
  } else {
    // ─── مسار الرسم: قياس 1.91:1 (Landscape / بوست فيسبوك 1200×630) ───
    const heroCx = 320
    const heroCy = H / 2
    const heroR = 220
    drawHeroProduct(ctx, heroCx, heroCy, heroR, img, accentGold, styleObj.tone)

    if (discountPercent > 0) {
      drawDiscountSeal(ctx, heroCx + heroR * 0.75, heroCy - heroR * 0.70, 65, discountPercent)
    }

    // الجانب الأيمن: البيانات والنصوص
    ctx.save()
    const rightX = W - 70
    ctx.direction = 'rtl'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'

    // شعار المتجر أعلى اليمين
    const topY = 75
    roundedRect(ctx, rightX - 320, topY - 30, 320, 60, 16)
    ctx.fillStyle = cardBg
    ctx.fill()
    ctx.strokeStyle = cardBorder
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.font = `900 24px ${FONT_FAMILY}`
    ctx.fillStyle = primaryText
    ctx.fillText(storeName, rightX - 20, topY)

    // عنوان المنتج
    const titleY = 190
    ctx.font = `900 48px ${FONT_FAMILY}`
    ctx.fillStyle = primaryText
    ctx.fillText(productName, rightX, titleY)

    ctx.font = `700 20px ${FONT_FAMILY}`
    ctx.fillStyle = accentGold
    ctx.fillText(`ذهب أصلي عيار ${spec.karat}K معتمد ومدموغ رسمياً`, rightX, titleY + 48)

    // بطاقات المواصفات الأفقية
    const specsY = 320
    const chips = [
      { label: 'الوزن', value: `${fmtWeight(spec.weight)} جم` },
      { label: 'العيار', value: `${spec.karat}K` },
      ...(spec.size > 0 ? [{ label: 'القياس', value: `${spec.size}` }] : []),
    ]

    let currX = rightX
    for (const chip of chips) {
      ctx.font = `700 16px ${FONT_FAMILY}`
      const lw = ctx.measureText(chip.label).width
      ctx.font = `900 22px ${FONT_FAMILY}`
      const vw = ctx.measureText(chip.value).width
      const cw = lw + vw + 50

      roundedRect(ctx, currX - cw, specsY, cw, 60, 16)
      ctx.fillStyle = cardBg
      ctx.fill()
      ctx.strokeStyle = cardBorder
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.font = `700 16px ${FONT_FAMILY}`
      ctx.fillStyle = subText
      ctx.fillText(chip.label, currX - 20, specsY + 30)

      ctx.font = `900 22px ${FONT_FAMILY}`
      ctx.fillStyle = accentGold
      ctx.fillText(chip.value, currX - cw + 25 + vw / 2, specsY + 30)

      currX -= cw + 15
    }
    ctx.restore()

    // الشريط السفلي (Bottom Bar)
    ctx.save()
    const barY = H - 85
    const barH = 85
    ctx.fillStyle = isLight ? 'rgba(255,255,255,0.92)' : 'rgba(10,10,12,0.92)'
    ctx.fillRect(0, barY, W, barH)

    ctx.strokeStyle = accentGold
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, barY)
    ctx.lineTo(W, barY)
    ctx.stroke()

    // اليمين: رقم الهاتف
    ctx.direction = 'rtl'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.font = `800 22px ${FONT_FAMILY}`
    ctx.fillStyle = primaryText
    ctx.fillText(`📞 للتواصل والحجز: ${phone}`, W - 60, barY + barH / 2)

    // اليسار: جملة ترويجية
    ctx.direction = 'rtl'
    ctx.textAlign = 'left'
    ctx.font = `700 18px ${FONT_FAMILY}`
    ctx.fillStyle = accentGold
    ctx.fillText('جولد ماستر • أحدث تشكيلات الذهب والمجوهرات بالصاغة', 60, barY + barH / 2)
    ctx.restore()
  }

  return canvas
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}
