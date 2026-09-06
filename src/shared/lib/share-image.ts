/**
 * مولّدات صور المشاركة (og:image) للمنتج — 10 استايلات جاهزة.
 *
 * كل استايل دالة تأخذ (ctx, spec) وترسم على نفس Canvas بأبعاد 1200×630.
 * صورة المنتج هي دائماً العنصر الأبرز في كل استايل.
 *
 * `buildProductShareImage` يفوّض الرسم إلى الاستايل المختار في `spec.style`
 * (افتراضياً `'gold-luxury'`). الواجهة (`ProductsPage`) تعرض شريط اختيار
 * يولّد معاينة مصغّرة لكل استايل قبل الرفع.
 */

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

export interface ShareImageSpec {
  productName: string
  weight: number
  karat: number
  size: number
  imageUrl?: string | null
  phoneDisplay?: string | null
  storeName?: string | null
  style?: ShareImageStyleId
  /**
   * نسبة الخصم على المصنعية (0–100). تُعرض كشعار دائري على صورة المشاركة
   * عند إنشائها — لا تُخصم من قيمة المنتج الفعلية.
   */
  makingDiscountPercent?: number
}

export const SHARE_IMAGE_STYLES: ReadonlyArray<{
  id: ShareImageStyleId
  label: string
  swatch: string
}> = [
  { id: 'gold-luxury', label: 'ذهبي فاخر', swatch: '#e7b94a' },
  { id: 'dark-noir', label: 'أسود احترافي', swatch: '#171717' },
  { id: 'minimal-white', label: 'أبيض نظيف', swatch: '#f8f8f6' },
  { id: 'marble-classic', label: 'رخام راقٍ', swatch: '#e8e0d3' },
  { id: 'neon-gold', label: 'ذهبي عصري', swatch: '#111315' },
  { id: 'arabesque', label: 'تراث عربي', swatch: '#651d22' },
  { id: 'retro-vintage', label: 'كلاسيك دافئ', swatch: '#b78a42' },
  { id: 'crystal-prism', label: 'أزرق بارد', swatch: '#246078' },
  { id: 'modern-arabic', label: 'زمردي فاخر', swatch: '#164b3b' },
  { id: 'chocolate-brown', label: 'بني دافئ', swatch: '#452816' },
]

const W = 1200
const H = 630

const CERTIFIED_FONT = "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif"

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

function loadImage(
  url: string,
  crossOrigin = 'anonymous',
): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = crossOrigin
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

function resolveImageUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url
  const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5000'
  return `${apiBase}${url.startsWith('/') ? url : `/${url}`}`
}

/* ============================================================
 * إطار الصورة البارز — يُستخدم في كل الاستايلات لتكبير المنتج
 * ============================================================ */

function drawProductHero(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  img: HTMLImageElement | null,
  opts: {
    ringGradient?: [string, string, string]
    shadow?: string
    matGradient?: [string, string]
    useClip?: boolean
  } = {},
) {
  const ringGrad = opts.ringGradient ?? ['#fff3cf', '#e7b94a', '#6b4c10']
  const matGrad = opts.matGradient ?? ['#ffffff', '#f3e1b2']
  const shadow = opts.shadow ?? 'rgba(106, 60, 0, 0.45)'

  ctx.save()
  ctx.shadowColor = shadow
  ctx.shadowBlur = 36
  ctx.shadowOffsetY = 16
  const mat = ctx.createLinearGradient(cx, cy - r, cx, cy + r)
  mat.addColorStop(0, matGrad[0])
  mat.addColorStop(1, matGrad[1])
  ctx.fillStyle = mat
  ctx.beginPath()
  ctx.arc(cx, cy, r + 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.restore()

  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.72)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, r + 17, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  ctx.save()
  const ring = ctx.createLinearGradient(cx, cy - r, cx, cy + r)
  ring.addColorStop(0, ringGrad[0])
  ring.addColorStop(0.5, ringGrad[1])
  ring.addColorStop(1, ringGrad[2])
  ctx.strokeStyle = ring
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.arc(cx, cy, r + 4, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, r - 8, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  if (opts.useClip !== false) ctx.clip()
  if (img) {
    const scale = Math.max((r * 2) / img.width, (r * 2) / img.height)
    const dw = img.width * scale
    const dh = img.height * scale
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh)
  } else {
    const gem = ctx.createLinearGradient(cx, cy - r, cx, cy + r)
    gem.addColorStop(0, ringGrad[0])
    gem.addColorStop(0.5, ringGrad[1])
    gem.addColorStop(1, ringGrad[2])
    ctx.fillStyle = gem
    ctx.translate(cx, cy)
    ctx.beginPath()
    ctx.moveTo(0, -r * 0.72)
    ctx.lineTo(r * 0.52, 0)
    ctx.lineTo(0, r * 0.72)
    ctx.lineTo(-r * 0.52, 0)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()
  const shine = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
  shine.addColorStop(0, 'rgba(255,255,255,0.28)')
  shine.addColorStop(0.5, 'rgba(255,255,255,0.05)')
  shine.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = shine
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
  ctx.restore()
}

function drawProductHalo(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
) {
  ctx.save()
  const aura = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 1.8)
  aura.addColorStop(0, color)
  aura.addColorStop(0.5, color.replace(/[\d.]+\)$/, '0.10)'))
  aura.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = aura
  ctx.beginPath()
  ctx.arc(cx, cy, r * 1.8, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/* ============================================================
 * شعار خصم المصنعية — دائرة حمراء أعلى الصورة
 * ============================================================ */

function drawMakingDiscountBadge(
  ctx: CanvasRenderingContext2D,
  percent: number,
) {
  if (!(percent > 0)) return
  const cx = W - 110
  const cy = 110
  const r = 86
  ctx.save()
  // ظل خفيف
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 16
  ctx.shadowOffsetY = 4
  // خلفية حمراء متدرجة
  const grad = ctx.createRadialGradient(cx - 18, cy - 18, 10, cx, cy, r)
  grad.addColorStop(0, '#ff6b6b')
  grad.addColorStop(1, '#c81d1d')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowColor = 'transparent'
  // حلقة ذهبية
  ctx.strokeStyle = '#e7b94a'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.arc(cx, cy, r - 6, 0, Math.PI * 2)
  ctx.stroke()
  // النسبة المئوية بخط كبير
  ctx.fillStyle = '#ffffff'
  ctx.font = `900 56px ${CERTIFIED_FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.direction = 'rtl'
  ctx.fillText(`${Math.round(percent)}%`, cx, cy - 8)
  // كلمة "خصم"
  ctx.font = `800 22px ${CERTIFIED_FONT}`
  ctx.fillText('خصم', cx, cy + 30)
  // "على المصنعية" خارج الدائرة
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#c81d1d'
  ctx.lineWidth = 4
  ctx.font = `900 22px ${CERTIFIED_FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.direction = 'rtl'
  const label = 'على المصنعية'
  const lw = ctx.measureText(label).width + 24
  const lx = cx
  const ly = cy + r + 26
  roundedRect(ctx, lx - lw / 2, ly - 18, lw, 36, 18)
  ctx.fillStyle = '#c81d1d'
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#ffffff'
  ctx.fillText(label, lx, ly)
  ctx.restore()
}

/* ============================================================
 * أدوات نص/شريط سفلي مشتركة
 * ============================================================ */

interface RenderCtx {
  productName: string
  weight: number
  karat: number
  size: number
  img: HTMLImageElement | null
  storeName: string
  phoneDisplay: string
  makingDiscountPercent: number
}

interface StyleRender {
  bg: (ctx: CanvasRenderingContext2D, c: RenderCtx) => void
  productCenter: { x: number; y: number; r: number }
  bottomBar: (ctx: CanvasRenderingContext2D, c: RenderCtx) => void
  title: (ctx: CanvasRenderingContext2D, c: RenderCtx) => void
  specs: (ctx: CanvasRenderingContext2D, c: RenderCtx) => void
}

function defaultSpecs(
  ctx: CanvasRenderingContext2D,
  c: RenderCtx,
  xRight: number,
  y: number,
  theme: {
    label: string
    value: string
    fill: [string, string]
    stroke: string
    labelColor: string
    valueColor: string
    h?: number
  },
) {
  const chips: Array<{ label: string; value: string }> = [
    { label: 'الوزن', value: `${fmtWeight(c.weight)} جم` },
    { label: 'العيار', value: `${c.karat}K` },
  ]
  if (c.size > 0) chips.push({ label: 'القياس', value: `${c.size}` })
  const h = theme.h ?? 56
  const gap = 12
  const padX = 22
  let x = xRight

  for (let i = chips.length - 1; i >= 0; i -= 1) {
    const chip = chips[i]
    ctx.save()
    ctx.font = `800 20px ${CERTIFIED_FONT}`
    ctx.direction = 'rtl'
    const labelW = ctx.measureText(chip.label).width
    ctx.font = `800 22px ${CERTIFIED_FONT}`
    const valueW = ctx.measureText(chip.value).width
    const w = labelW + valueW + padX * 2 + 14
    x -= w
    roundedRect(ctx, x, y, w, h, h / 2)
    const fill = ctx.createLinearGradient(0, y, 0, y + h)
    fill.addColorStop(0, theme.fill[0])
    fill.addColorStop(1, theme.fill[1])
    ctx.fillStyle = fill
    ctx.fill()
    ctx.strokeStyle = theme.stroke
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.textBaseline = 'middle'
    ctx.font = `800 20px ${CERTIFIED_FONT}`
    ctx.textAlign = 'right'
    ctx.fillStyle = theme.labelColor
    ctx.fillText(chip.label, x + w - padX, y + h / 2)
    ctx.font = `800 22px ${CERTIFIED_FONT}`
    ctx.textAlign = 'left'
    ctx.fillStyle = theme.valueColor
    ctx.fillText(chip.value, x + padX, y + h / 2)
    ctx.restore()
    x -= gap
  }
}

function defaultBottomBar(
  ctx: CanvasRenderingContext2D,
  c: RenderCtx,
  theme: {
    bg: [string, string]
    accent: string
    text: string
    subtext: string
  },
) {
  const y0 = 552
  const barH = 60
  ctx.save()
  const barGrad = ctx.createLinearGradient(0, y0, 0, y0 + barH)
  barGrad.addColorStop(0, theme.bg[0])
  barGrad.addColorStop(1, theme.bg[1])
  ctx.fillStyle = barGrad
  ctx.fillRect(0, y0, W, barH)
  ctx.fillStyle = theme.accent
  ctx.fillRect(0, y0, W, 3)

  ctx.textBaseline = 'middle'
  ctx.direction = 'rtl'
  const phone = c.phoneDisplay.trim() || '—'
  ctx.textAlign = 'right'
  ctx.font = `800 26px ${CERTIFIED_FONT}`
  ctx.fillStyle = theme.text
  ctx.fillText(`📞 ${phone}`, W - 40, y0 + barH / 2)
  ctx.font = `600 18px ${CERTIFIED_FONT}`
  ctx.fillStyle = theme.subtext
  ctx.fillText('هاتف المحل — تواصل واتساب واتصال مباشر', W - 40, y0 + barH / 2 + 22)

  ctx.textAlign = 'left'
  ctx.font = `800 24px ${CERTIFIED_FONT}`
  ctx.fillStyle = theme.accent
  ctx.fillText('GOLD MASTER', 40, y0 + barH / 2)
  ctx.font = `600 16px ${CERTIFIED_FONT}`
  ctx.fillStyle = theme.subtext
  ctx.fillText('برنامج إدارة محل الذهب', 40, y0 + barH / 2 + 22)
  ctx.restore()
}

function drawRightSideText(
  ctx: CanvasRenderingContext2D,
  text: string,
  xRight: number,
  y: number,
  fontSize: number,
  fill: string | CanvasGradient,
  shadow?: string,
) {
  ctx.save()
  ctx.font = `900 ${fontSize}px ${CERTIFIED_FONT}`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  ctx.direction = 'rtl'
  if (shadow) {
    ctx.fillStyle = shadow
    ctx.fillText(text, xRight + 4, y + 6)
  }
  ctx.fillStyle = fill
  ctx.fillText(text, xRight, y)
  ctx.restore()
}

/* ============================================================
 * الاستايلات العشرة
 * ============================================================ */

const STYLES: Record<ShareImageStyleId, StyleRender> = {
  /* 1 — ذهبي فاخر (الافتراضي) */
  'gold-luxury': {
    bg(ctx) {
      const bg = ctx.createLinearGradient(0, 0, W, H)
      bg.addColorStop(0, '#fff8e3')
      bg.addColorStop(0.45, '#f6e3a8')
      bg.addColorStop(1, '#e7b94a')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)
      const halo = ctx.createRadialGradient(W * 0.18, H * 0.5, 40, W * 0.18, H * 0.5, 520)
      halo.addColorStop(0, 'rgba(255,255,255,0.55)')
      halo.addColorStop(0.6, 'rgba(255,255,255,0.10)')
      halo.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = halo
      ctx.fillRect(0, 0, W, H)
    },
    productCenter: { x: W * 0.74, y: H * 0.47, r: 232 },
    bottomBar(ctx, c) {
      defaultBottomBar(ctx, c, {
        bg: ['#2a1d05', '#1a1206'],
        accent: '#e7b94a',
        text: '#fff3cf',
        subtext: 'rgba(255,243,207,0.75)',
      })
    },
    title(ctx, c) {
      drawRightSideText(ctx, c.productName.trim() || 'منتج ذهبي', W * 0.52, H * 0.26, 64, (() => {
        const g = ctx.createLinearGradient(0, H * 0.2, 0, H * 0.32)
        g.addColorStop(0, '#a8742a')
        g.addColorStop(0.5, '#e7b94a')
        g.addColorStop(1, '#6b4c10')
        return g
      })(), 'rgba(106, 60, 0, 0.35)')
      ctx.save()
      ctx.font = `700 24px ${CERTIFIED_FONT}`
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.direction = 'rtl'
      ctx.fillStyle = '#6b4c10'
      ctx.fillText('قطعة مختارة بعناية', W * 0.52, H * 0.36)
      ctx.restore()
    },
    specs(ctx, c) {
      defaultSpecs(ctx, c, W * 0.52, H * 0.44, {
        label: 'الوزن',
        value: 'الوزن',
        fill: ['rgba(255,255,255,0.85)', 'rgba(255,231,168,0.70)'],
        stroke: '#a8742a',
        labelColor: '#6b4c10',
        valueColor: '#2a1d05',
      })
    },
  },

  /* 2 — أسود فاخر */
  'dark-noir': {
    bg(ctx) {
      const bg = ctx.createLinearGradient(0, 0, W, H)
      bg.addColorStop(0, '#0a0a0a')
      bg.addColorStop(0.5, '#181818')
      bg.addColorStop(1, '#050505')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)
      const halo = ctx.createRadialGradient(W * 0.72, H * 0.45, 50, W * 0.72, H * 0.45, 480)
      halo.addColorStop(0, 'rgba(231,185,74,0.18)')
      halo.addColorStop(1, 'rgba(231,185,74,0)')
      ctx.fillStyle = halo
      ctx.fillRect(0, 0, W, H)
    },
    productCenter: { x: W * 0.74, y: H * 0.47, r: 232 },
    bottomBar(ctx, c) {
      defaultBottomBar(ctx, c, {
        bg: ['#000000', '#1a1a1a'],
        accent: '#e7b94a',
        text: '#f5e6b3',
        subtext: 'rgba(245,230,179,0.70)',
      })
    },
    title(ctx, c) {
      drawRightSideText(ctx, c.productName.trim() || 'منتج ذهبي', W * 0.52, H * 0.26, 64, '#e7b94a', 'rgba(231,185,74,0.25)')
      ctx.save()
      ctx.font = `600 22px ${CERTIFIED_FONT}`
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.direction = 'rtl'
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.fillText('فخامة تليق بقطعتك', W * 0.52, H * 0.36)
      ctx.restore()
    },
    specs(ctx, c) {
      defaultSpecs(ctx, c, W * 0.52, H * 0.44, {
        label: 'الوزن',
        value: 'الوزن',
        fill: ['rgba(255,255,255,0.10)', 'rgba(231,185,74,0.08)'],
        stroke: 'rgba(231,185,74,0.55)',
        labelColor: '#f5e6b3',
        valueColor: '#ffffff',
      })
    },
  },

  /* 3 — أبيض مينيمال */
  'minimal-white': {
    bg(ctx) {
      ctx.fillStyle = '#fafafa'
      ctx.fillRect(0, 0, W, H)
      ctx.strokeStyle = '#ececec'
      ctx.lineWidth = 1
      ctx.strokeRect(40, 40, W - 80, H - 80)
    },
    productCenter: { x: W * 0.73, y: H * 0.47, r: 232 },
    bottomBar(ctx, c) {
      defaultBottomBar(ctx, c, {
        bg: ['#1a1a1a', '#0a0a0a'],
        accent: '#c89a4a',
        text: '#ffffff',
        subtext: 'rgba(255,255,255,0.65)',
      })
    },
    title(ctx, c) {
      drawRightSideText(ctx, c.productName.trim() || 'منتج ذهبي', W * 0.46, H * 0.28, 58, '#1a1a1a', 'rgba(0,0,0,0.15)')
      ctx.save()
      ctx.font = `500 22px ${CERTIFIED_FONT}`
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.direction = 'rtl'
      ctx.fillStyle = '#c89a4a'
      ctx.fillText('تصميم واضح • تفاصيل دقيقة', W * 0.46, H * 0.38)
      ctx.restore()
    },
    specs(ctx, c) {
      defaultSpecs(ctx, c, W * 0.46, H * 0.48, {
        label: 'الوزن',
        value: 'الوزن',
        fill: ['#ffffff', '#f3f3f3'],
        stroke: '#1a1a1a',
        labelColor: '#1a1a1a',
        valueColor: '#1a1a1a',
      })
    },
  },

  /* 4 — رخام كلاسيك */
  'marble-classic': {
    bg(ctx) {
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, '#f7f3ec')
      bg.addColorStop(1, '#e2d9cb')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)
      ctx.save()
      ctx.globalAlpha = 0.35
      ctx.strokeStyle = '#a89881'
      ctx.lineWidth = 1
      for (let i = 0; i < 6; i += 1) {
        ctx.beginPath()
        ctx.moveTo(0, 80 + i * 90)
        ctx.bezierCurveTo(W * 0.3, 60 + i * 90, W * 0.7, 110 + i * 90, W, 80 + i * 90)
        ctx.stroke()
      }
      ctx.restore()
    },
    productCenter: { x: W * 0.73, y: H * 0.47, r: 232 },
    bottomBar(ctx, c) {
      defaultBottomBar(ctx, c, {
        bg: ['#1a1410', '#0a0604'],
        accent: '#c89a4a',
        text: '#f0e6d2',
        subtext: 'rgba(240,230,210,0.70)',
      })
    },
    title(ctx, c) {
      drawRightSideText(ctx, c.productName.trim() || 'منتج ذهبي', W * 0.48, H * 0.28, 60, '#3a2a14', 'rgba(58,42,20,0.20)')
      ctx.save()
      ctx.font = `italic 600 22px ${CERTIFIED_FONT}`
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.direction = 'rtl'
      ctx.fillStyle = '#8a6a3a'
      ctx.fillText('أناقة كلاسيكية', W * 0.48, H * 0.38)
      ctx.restore()
    },
    specs(ctx, c) {
      defaultSpecs(ctx, c, W * 0.48, H * 0.48, {
        label: 'الوزن',
        value: 'الوزن',
        fill: ['#ffffff', '#f4ebdc'],
        stroke: '#8a6a3a',
        labelColor: '#5a3a14',
        valueColor: '#1a1410',
      })
    },
  },

  /* 5 — نيون ذهبي */
  'neon-gold': {
    bg(ctx) {
      ctx.fillStyle = '#0b0b0b'
      ctx.fillRect(0, 0, W, H)
      ctx.save()
      ctx.shadowColor = '#e7b94a'
      ctx.shadowBlur = 20
      ctx.strokeStyle = '#e7b94a'
      ctx.lineWidth = 1.5
      for (const r of [180, 260, 340]) {
        ctx.beginPath()
        ctx.arc(W * 0.74, H * 0.48, r, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.restore()
    },
    productCenter: { x: W * 0.74, y: H * 0.47, r: 232 },
    bottomBar(ctx, c) {
      defaultBottomBar(ctx, c, {
        bg: ['#000000', '#1a1a1a'],
        accent: '#ffec80',
        text: '#ffec80',
        subtext: 'rgba(255,236,128,0.75)',
      })
    },
    title(ctx, c) {
      ctx.save()
      ctx.shadowColor = '#ffec80'
      ctx.shadowBlur = 18
      drawRightSideText(ctx, c.productName.trim() || 'منتج ذهبي', W * 0.5, H * 0.28, 64, '#ffec80', 'rgba(255,236,128,0.30)')
      ctx.restore()
      ctx.save()
      ctx.font = `700 22px ${CERTIFIED_FONT}`
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.direction = 'rtl'
      ctx.fillStyle = '#e7b94a'
      ctx.fillText('لمعة تلفت الانتباه', W * 0.5, H * 0.38)
      ctx.restore()
    },
    specs(ctx, c) {
      defaultSpecs(ctx, c, W * 0.5, H * 0.48, {
        label: 'الوزن',
        value: 'الوزن',
        fill: ['rgba(255,236,128,0.10)', 'rgba(231,185,74,0.05)'],
        stroke: '#ffec80',
        labelColor: '#ffec80',
        valueColor: '#ffffff',
      })
    },
  },

  /* 6 — عربي تقليدي (أرابيسك) */
  'arabesque': {
    bg(ctx) {
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, '#5a1414')
      bg.addColorStop(1, '#2a0808')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)
      ctx.save()
      ctx.globalAlpha = 0.18
      ctx.strokeStyle = '#e7b94a'
      ctx.lineWidth = 1
      for (let row = 0; row < 5; row += 1) {
        for (let col = 0; col < 9; col += 1) {
          const x = 80 + col * 130
          const y = 80 + row * 100
          ctx.beginPath()
          ctx.arc(x, y, 28, 0, Math.PI * 2)
          ctx.moveTo(x - 28, y)
          ctx.lineTo(x + 28, y)
          ctx.moveTo(x, y - 28)
          ctx.lineTo(x, y + 28)
          ctx.stroke()
        }
      }
      ctx.restore()
    },
    productCenter: { x: W * 0.73, y: H * 0.47, r: 232 },
    bottomBar(ctx, c) {
      defaultBottomBar(ctx, c, {
        bg: ['#1a0606', '#0a0202'],
        accent: '#e7b94a',
        text: '#fff3cf',
        subtext: 'rgba(255,243,207,0.75)',
      })
    },
    title(ctx, c) {
      drawRightSideText(ctx, c.productName.trim() || 'منتج ذهبي', W * 0.5, H * 0.28, 60, '#fff3cf', 'rgba(0,0,0,0.40)')
      ctx.save()
      ctx.font = `600 22px ${CERTIFIED_FONT}`
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.direction = 'rtl'
      ctx.fillStyle = '#e7b94a'
      ctx.fillText('تراث • أصالة • ذهب', W * 0.5, H * 0.38)
      ctx.restore()
    },
    specs(ctx, c) {
      defaultSpecs(ctx, c, W * 0.5, H * 0.48, {
        label: 'الوزن',
        value: 'الوزن',
        fill: ['rgba(255,243,207,0.15)', 'rgba(231,185,74,0.08)'],
        stroke: '#e7b94a',
        labelColor: '#fff3cf',
        valueColor: '#ffffff',
      })
    },
  },

  /* 7 — ريترو فينتاج */
  'retro-vintage': {
    bg(ctx) {
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, '#d4a857')
      bg.addColorStop(0.5, '#b8853a')
      bg.addColorStop(1, '#8a5d20')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)
      ctx.save()
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'
      ctx.lineWidth = 1
      for (const r of [200, 290, 380]) {
        ctx.beginPath()
        ctx.arc(W * 0.72, H * 0.48, r, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.restore()
      ctx.save()
      ctx.fillStyle = 'rgba(58,28,8,0.15)'
      for (let i = 0; i < 80; i += 1) {
        ctx.fillRect((i * 97) % W, (i * 71) % H, 3, 3)
      }
      ctx.restore()
    },
    productCenter: { x: W * 0.73, y: H * 0.47, r: 232 },
    bottomBar(ctx, c) {
      defaultBottomBar(ctx, c, {
        bg: ['#2a1408', '#0e0604'],
        accent: '#d4a857',
        text: '#f5e0b0',
        subtext: 'rgba(245,224,176,0.75)',
      })
    },
    title(ctx, c) {
      drawRightSideText(ctx, c.productName.trim() || 'منتج ذهبي', W * 0.5, H * 0.28, 60, '#2a1408', 'rgba(42,20,8,0.25)')
      ctx.save()
      ctx.font = `italic 700 24px ${CERTIFIED_FONT}`
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.direction = 'rtl'
      ctx.fillStyle = '#3a1c08'
      ctx.fillText('اختيار يدوم', W * 0.5, H * 0.38)
      ctx.restore()
    },
    specs(ctx, c) {
      defaultSpecs(ctx, c, W * 0.5, H * 0.48, {
        label: 'الوزن',
        value: 'الوزن',
        fill: ['#f4e2b0', '#d4a857'],
        stroke: '#2a1408',
        labelColor: '#2a1408',
        valueColor: '#1a0a04',
      })
    },
  },

  /* 8 — كريستال (هولوغرافي) */
  'crystal-prism': {
    bg(ctx) {
      const bg = ctx.createLinearGradient(0, 0, W, H)
      bg.addColorStop(0, '#0e2a3a')
      bg.addColorStop(0.5, '#15475e')
      bg.addColorStop(1, '#0a1a26')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)
      ctx.save()
      ctx.globalAlpha = 0.45
      const hue1 = ctx.createLinearGradient(0, 0, W, 0)
      hue1.addColorStop(0, 'rgba(158,214,231,0.0)')
      hue1.addColorStop(0.5, 'rgba(158,214,231,0.3)')
      hue1.addColorStop(1, 'rgba(158,214,231,0.0)')
      ctx.fillStyle = hue1
      ctx.fillRect(0, H * 0.25, W, 60)
      const hue2 = ctx.createLinearGradient(0, 0, W, 0)
      hue2.addColorStop(0, 'rgba(231,185,74,0.0)')
      hue2.addColorStop(0.5, 'rgba(231,185,74,0.25)')
      hue2.addColorStop(1, 'rgba(231,185,74,0.0)')
      ctx.fillStyle = hue2
      ctx.fillRect(0, H * 0.55, W, 50)
      ctx.restore()
    },
    productCenter: { x: W * 0.73, y: H * 0.47, r: 232 },
    bottomBar(ctx, c) {
      defaultBottomBar(ctx, c, {
        bg: ['#06141c', '#0a1f2a'],
        accent: '#9ed6e7',
        text: '#dff4f9',
        subtext: 'rgba(223,244,249,0.75)',
      })
    },
    title(ctx, c) {
      drawRightSideText(ctx, c.productName.trim() || 'منتج ذهبي', W * 0.5, H * 0.28, 62, '#9ed6e7', 'rgba(158,214,231,0.25)')
      ctx.save()
      ctx.font = `600 22px ${CERTIFIED_FONT}`
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.direction = 'rtl'
      ctx.fillStyle = '#e7b94a'
      ctx.fillText('تفاصيل تلمع', W * 0.5, H * 0.38)
      ctx.restore()
    },
    specs(ctx, c) {
      defaultSpecs(ctx, c, W * 0.5, H * 0.48, {
        label: 'الوزن',
        value: 'الوزن',
        fill: ['rgba(158,214,231,0.10)', 'rgba(255,255,255,0.05)'],
        stroke: 'rgba(158,214,231,0.60)',
        labelColor: '#9ed6e7',
        valueColor: '#ffffff',
      })
    },
  },

  /* 9 — عربي حديث (أخضر زمردي) */
  'modern-arabic': {
    bg(ctx) {
      const bg = ctx.createLinearGradient(0, 0, W, H)
      bg.addColorStop(0, '#0f3d2e')
      bg.addColorStop(0.5, '#0a2a1f')
      bg.addColorStop(1, '#06180f')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)
      ctx.save()
      ctx.globalAlpha = 0.12
      ctx.strokeStyle = '#e7b94a'
      ctx.lineWidth = 1.2
      for (let i = 0; i < 24; i += 1) {
        const angle = (i * Math.PI) / 12
        const x1 = W * 0.72 + Math.cos(angle) * 100
        const y1 = H * 0.48 + Math.sin(angle) * 100
        const x2 = W * 0.72 + Math.cos(angle) * 360
        const y2 = H * 0.48 + Math.sin(angle) * 360
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }
      ctx.restore()
    },
    productCenter: { x: W * 0.73, y: H * 0.47, r: 232 },
    bottomBar(ctx, c) {
      defaultBottomBar(ctx, c, {
        bg: ['#06180f', '#021008'],
        accent: '#e7b94a',
        text: '#fff3cf',
        subtext: 'rgba(255,243,207,0.75)',
      })
    },
    title(ctx, c) {
      drawRightSideText(ctx, c.productName.trim() || 'منتج ذهبي', W * 0.5, H * 0.28, 62, '#e7b94a', 'rgba(231,185,74,0.25)')
      ctx.save()
      ctx.font = `600 22px ${CERTIFIED_FONT}`
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.direction = 'rtl'
      ctx.fillStyle = '#9ed6b3'
      ctx.fillText('ذوق • رقي • جودة', W * 0.5, H * 0.38)
      ctx.restore()
    },
    specs(ctx, c) {
      defaultSpecs(ctx, c, W * 0.5, H * 0.48, {
        label: 'الوزن',
        value: 'الوزن',
        fill: ['rgba(231,185,74,0.12)', 'rgba(158,214,179,0.08)'],
        stroke: '#e7b94a',
        labelColor: '#fff3cf',
        valueColor: '#ffffff',
      })
    },
  },

  /* 10 — شوكولاتة بني */
  'chocolate-brown': {
    bg(ctx) {
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, '#3a1f0d')
      bg.addColorStop(0.5, '#2a160a')
      bg.addColorStop(1, '#180a04')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)
      ctx.save()
      ctx.globalAlpha = 0.35
      ctx.strokeStyle = 'rgba(231,185,74,0.18)'
      ctx.lineWidth = 1
      for (const r of [220, 310, 400]) {
        ctx.beginPath()
        ctx.arc(W * 0.72, H * 0.48, r, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.restore()
    },
    productCenter: { x: W * 0.73, y: H * 0.47, r: 232 },
    bottomBar(ctx, c) {
      defaultBottomBar(ctx, c, {
        bg: ['#180a04', '#0a0402'],
        accent: '#e7b94a',
        text: '#f5e6b3',
        subtext: 'rgba(245,230,179,0.70)',
      })
    },
    title(ctx, c) {
      drawRightSideText(ctx, c.productName.trim() || 'منتج ذهبي', W * 0.5, H * 0.28, 62, '#e7b94a', 'rgba(231,185,74,0.25)')
      ctx.save()
      ctx.font = `italic 600 24px ${CERTIFIED_FONT}`
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.direction = 'rtl'
      ctx.fillStyle = '#d4a857'
      ctx.fillText('دفء • فخامة • ذهب', W * 0.5, H * 0.38)
      ctx.restore()
    },
    specs(ctx, c) {
      defaultSpecs(ctx, c, W * 0.5, H * 0.48, {
        label: 'الوزن',
        value: 'الوزن',
        fill: ['rgba(231,185,74,0.18)', 'rgba(180,120,40,0.10)'],
        stroke: '#e7b94a',
        labelColor: '#fff3cf',
        valueColor: '#ffffff',
      })
    },
  },
}

/* ============================================================
 * نقطة الدخول الرئيسية
 * ============================================================ */

export async function buildProductShareImage(
  spec: ShareImageSpec,
): Promise<HTMLCanvasElement> {
  if (typeof document === 'undefined') throw new Error('Canvas requires a browser')
  try {
    await document.fonts.load(`900 110px Cairo`)
  } catch {
    /* تجاهل خطأ تحميل الخط */
  }

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  const styleId = spec.style ?? 'gold-luxury'
  const style = STYLES[styleId]

  const img = spec.imageUrl
    ? await loadImage(resolveImageUrl(spec.imageUrl))
    : null

  const renderCtx: RenderCtx = {
    productName: spec.productName,
    weight: spec.weight,
    karat: spec.karat,
    size: spec.size,
    img,
    storeName: (spec.storeName ?? '').trim() || 'GOLD MASTER',
    phoneDisplay: (spec.phoneDisplay ?? '').trim() || '—',
    makingDiscountPercent: Math.max(
      0,
      Math.min(100, Number(spec.makingDiscountPercent ?? 0) || 0),
    ),
  }

  style.bg(ctx, renderCtx)

  if (styleId === 'gold-luxury' || styleId === 'minimal-white' || styleId === 'dark-noir') {
    ctx.save()
    ctx.globalAlpha = 0.10
    ctx.fillStyle = '#6b4c10'
    ctx.font = `900 200px ${CERTIFIED_FONT}`
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.direction = 'rtl'
    ctx.fillText(renderCtx.storeName, W - 60, H * 0.5)
    ctx.restore()
  }

  drawProductHalo(
    ctx,
    style.productCenter.x,
    style.productCenter.y,
    style.productCenter.r,
    styleId === 'dark-noir' || styleId === 'arabesque' || styleId === 'modern-arabic' || styleId === 'chocolate-brown'
      ? 'rgba(231,185,74,0.25)'
      : 'rgba(255,255,255,0.40)',
  )

  drawProductHero(
    ctx,
    style.productCenter.x,
    style.productCenter.y,
    style.productCenter.r,
    img,
    {
      ringGradient:
        styleId === 'dark-noir' || styleId === 'neon-gold' || styleId === 'crystal-prism' || styleId === 'modern-arabic'
          ? ['#ffec80', '#e7b94a', '#a8742a']
          : ['#fff3cf', '#e7b94a', '#6b4c10'],
      shadow:
        styleId === 'minimal-white' || styleId === 'marble-classic'
          ? 'rgba(0,0,0,0.18)'
          : 'rgba(106, 60, 0, 0.45)',
      matGradient:
        styleId === 'minimal-white' || styleId === 'marble-classic'
          ? ['#ffffff', '#f5f5f5']
          : ['#ffffff', '#f3e1b2'],
    },
  )

  style.title(ctx, renderCtx)
  style.specs(ctx, renderCtx)
  style.bottomBar(ctx, renderCtx)

  drawMakingDiscountBadge(ctx, renderCtx.makingDiscountPercent)

  return canvas
}

export function canvasToPngBlob(
  canvas: HTMLCanvasElement,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}
