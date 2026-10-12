/**
 * مولّد صور إعلانات ومشاركات الذهب والمجوهرات الاحترافية — 10 تصاميم معمارية وفنية متمايزة كلياً.
 * 
 * يدعم بدقة القياسات الثلاثة الرئيسية لشبكات التواصل الاجتماعي:
 * 1. `9:16` (1080×1920): قياس الستوري والريلز (Instagram / Facebook Stories, WhatsApp Status, TikTok)
 * 2. `1:1` (1080×1080): قياس المنشورات المربعة لإنستغرام وفيسبوك وكتالوجات الواتساب
 * 3. `1.91:1` (1200×630): قياس المنشورات الأفقية لفيسبوك ولينكدإن وبطاقات OpenGraph
 */

import QRCode from 'qrcode'

import { getApiBaseUrl } from '@/shared/lib/api-url'

/** العلامة التجارية الموحدة الظاهرة في كل تصاميم المشاركة. */
const BRAND_AR = 'جولد ماستر'
const BRAND_EN = 'Gold Master'
/** واتساب الدعم — يُشفَّر داخل رمز الاستجابة السريعة. */
const SUPPORT_WHATSAPP = 'https://wa.me/201551702595'

export type ShareImageStyleId =
  | 'royal-arch'
  | 'vogue-split'
  | 'assay-cert'
  | 'sagha-deal'
  | 'arabesque-luxury'
  | 'studio-minimal'
  | 'cinematic-bokeh'
  | 'bridal-shabka'
  | 'neo-luxe'
  | 'heritage-sagha'
  // للتوافق العكسي
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

export type ShareImageAspectRatio = '9:16' | '1:1' | '1.91:1'

export interface ShareImageSpec {
  productName: string
  weight: number
  karat: number
  size?: number
  imageUrl?: string | null
  phoneDisplay?: string | null
  storeName?: string | null
  storeCity?: string | null
  style?: ShareImageStyleId
  aspectRatio?: ShareImageAspectRatio
  makingDiscountPercent?: number
  // بيانات الذهب والتسعير التجاري الحقيقية
  gold21Price?: number
  pricePerGram?: number
  makingFeePerGram?: number
  totalPrice?: number
  originalTotalPrice?: number
  barcode?: string | null
  productType?: string | null
}

export const SHARE_IMAGE_STYLES: ReadonlyArray<{
  id: ShareImageStyleId
  label: string
  subtitle: string
  swatch: string
  tone: 'light' | 'dark'
  description: string
}> = [
  {
    id: 'royal-arch',
    label: 'القوس الملكي والمنصة',
    subtitle: 'Royal Palace Arch',
    swatch: '#d4af37',
    tone: 'dark',
    description: 'قوس معماري مذهب فوق منصة رخامية ثلاثية الأبعاد مع شارة الصاغة الملكية',
  },
  {
    id: 'vogue-split',
    label: 'البوستر التحريري العصري',
    subtitle: 'Vogue Haute Joaillerie',
    swatch: '#1c1b18',
    tone: 'dark',
    description: 'تقسيم جريء كأغلفة مجلات المجوهرات العالمية مع باركود عصري وتيبوغرافي فخم',
  },
  {
    id: 'assay-cert',
    label: 'شهادة الصاغة والسبائك',
    subtitle: 'Certified Assay Ingot',
    swatch: '#f4ebd9',
    tone: 'light',
    description: 'محاكاة شهادة سبيكة الذهب المعتمدة، خطوط أمان، باركود، ودمغة رسمية',
  },
  {
    id: 'sagha-deal',
    label: 'عرض الصاغة والخصومات',
    subtitle: 'Sagha Deal Showcase',
    swatch: '#c8102e',
    tone: 'dark',
    description: 'شارة خصم ثلاثية الأبعاد، مقارنة السعر قبل وبعد، وشريط حجز فوري',
  },
  {
    id: 'arabesque-luxury',
    label: 'مشربية الأرابيسك والمخمل',
    subtitle: 'Imperial Arabesque',
    swatch: '#0c3826',
    tone: 'dark',
    description: 'زخارف إسلامية ذهبية مفرغة على خلفية مخملية زمردية وتوهج قناديل',
  },
  {
    id: 'studio-minimal',
    label: 'ستوديو المجوهرات النقي',
    subtitle: 'Clean Studio Light',
    swatch: '#fbfaf7',
    tone: 'light',
    description: 'إضاءة ستوديو عاجية ناعمة مع انعكاس مرآة زجاجي وغبار ذهب دقيق',
  },
  {
    id: 'cinematic-bokeh',
    label: 'البريق السينمائي والبوكيه',
    subtitle: 'Cinematic Spotlight',
    swatch: '#14171d',
    tone: 'dark',
    description: 'إضاءة مسرحية مركزة على القطعة مع كريات بوكيه ذهبية طافية',
  },
  {
    id: 'bridal-shabka',
    label: 'شبكة العروس والزفاف',
    subtitle: 'Bridal Shabka',
    swatch: '#45101a',
    tone: 'dark',
    description: 'إطار أكاليل الزهور المذهبة وخواتم الزواج التراثية للعروس',
  },
  {
    id: 'neo-luxe',
    label: 'النيو-تيك والتيتانيوم',
    subtitle: 'Neo-Luxe Cyber Dark',
    swatch: '#0b0f14',
    tone: 'dark',
    description: 'خطوط ليزر نيون ذهبية وشاشات قياس دائرية رقمية لجيل اليوم',
  },
  {
    id: 'heritage-sagha',
    label: 'خان الخليلي والصاغة',
    subtitle: 'Heritage Khan el-Khalili',
    swatch: '#2a1a08',
    tone: 'dark',
    description: 'ملمس الصاغة القديمة، ميزان العدل، ختم الشمع التراثي، وطابع أثري',
  },
]

function canonicalStyle(id?: ShareImageStyleId): ShareImageStyleId {
  if (!id) return 'royal-arch'
  switch (id) {
    case 'gold-luxury':
      return 'royal-arch'
    case 'dark-noir':
      return 'vogue-split'
    case 'minimal-white':
      return 'studio-minimal'
    case 'marble-classic':
      return 'assay-cert'
    case 'neon-gold':
      return 'neo-luxe'
    case 'arabesque':
      return 'arabesque-luxury'
    case 'retro-vintage':
      return 'heritage-sagha'
    case 'crystal-prism':
      return 'cinematic-bokeh'
    case 'modern-arabic':
      return 'sagha-deal'
    case 'chocolate-brown':
      return 'bridal-shabka'
    default:
      return id
  }
}

const FONT_FAMILY = 'Cairo, system-ui, -apple-system, BlinkMacSystemFont, sans-serif'

function fmtMoney(val: number): string {
  return `${new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(Math.round(val))} ج.م`
}

function fmtWeight(val: number): string {
  return new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val)
}

/** مسارات وسائط الخادم التي تُخدَم نفس-الأصل (Vite proxy / Vercel rewrite). */
function isServerMediaPath(pathname: string): boolean {
  return pathname.startsWith('/uploads/') || pathname.startsWith('/images/')
}

function resolveImageUrl(raw: string): string {
  if (!raw) return ''
  if (raw.startsWith('data:') || raw.startsWith('blob:')) return raw
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    // بعض الصور مخزّنة بروابط مطلقة على مضيف الـ API؛ نُسقط الأصل ونبقي
    // المسار فقط ليُمرَّر عبر وسيط الواجهة فيصبح نفس-الأصل بلا CORS ولا تلويث للكانفس.
    try {
      const { pathname } = new URL(raw)
      if (isServerMediaPath(pathname)) return pathname
    } catch {
      /* رابط غير صالح — نُبقيه كما هو */
    }
    return raw
  }
  const clean = raw.startsWith('/') ? raw : `/${raw}`
  // وسائط الخادم (/images, /uploads) تُخدَم نفس-الأصل عبر وسيط الواجهة
  // (Vite proxy / Vercel rewrite) — فلا CORS ولا تلويث للكانفس.
  if (isServerMediaPath(clean)) {
    return clean
  }
  const base = getApiBaseUrl()
  return `${base}${clean}`
}

function loadImageElement(
  src: string,
  useCrossOrigin: boolean,
): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null)
  return new Promise((resolve) => {
    const img = new Image()
    if (useCrossOrigin) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/**
 * تحميل صورة القطعة بضمان رسمها داخل الكانفس:
 * 1) سحبها كـ Blob ثم drawImage عبر ObjectURL — بلا تلويث ولا CORS.
 * 2) عند التعذّر: تحميل مباشر مع crossOrigin ثم بدونه كحل أخير.
 */
async function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return null
  if (src.startsWith('data:') || src.startsWith('blob:')) {
    return loadImageElement(src, false)
  }
  try {
    const res = await fetch(src, { credentials: 'omit' })
    if (res.ok) {
      const blob = await res.blob()
      if (blob.type.startsWith('image/') && blob.size > 0) {
        const objectUrl = URL.createObjectURL(blob)
        const img = await loadImageElement(objectUrl, false)
        if (img) return img
      }
    }
  } catch {
    /* المتابعة إلى الحل المباشر أدناه */
  }
  const anon = await loadImageElement(src, true)
  if (anon) return anon
  return loadImageElement(src, false)
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rad = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rad, y)
  ctx.lineTo(x + w - rad, y)
  ctx.arcTo(x + w, y, x + w, y + rad, rad)
  ctx.lineTo(x + w, y + h - rad)
  ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad)
  ctx.lineTo(x + rad, y + h)
  ctx.arcTo(x, y + h, x, y + h - rad, rad)
  ctx.lineTo(x, y + rad)
  ctx.arcTo(x, y, x + rad, y, rad)
  ctx.closePath()
}

/**
 * دالة تقسيم النص العربي على عدة أسطر لضمان عدم خروجه عن حدود التصميم نهائياً
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 2,
): string[] {
  const words = text.trim().split(/\s+/)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
      if (lines.length >= maxLines - 1) {
        break
      }
    } else {
      currentLine = testLine
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine)
  }

  return lines.length > 0 ? lines : [text]
}

/**
 * رسم شارة الخصم ثلاثية الأبعاد بختم الصاغة القرمزي والذهبي
 */
function drawDiscountBadge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  percent: number,
  savings?: number,
) {
  ctx.save()

  // وهج ذهبي
  ctx.shadowColor = 'rgba(212,175,55,0.7)'
  ctx.shadowBlur = 24

  // الإطار الذهبي المزدوج
  const goldGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
  goldGrad.addColorStop(0, '#fff4cc')
  goldGrad.addColorStop(0.3, '#d4af37')
  goldGrad.addColorStop(0.7, '#8b6914')
  goldGrad.addColorStop(1, '#ffd700')
  ctx.fillStyle = goldGrad
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // قلب قرمزي ملكي
  const redGrad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 5, cx, cy, r * 0.88)
  redGrad.addColorStop(0, '#e52d27')
  redGrad.addColorStop(0.7, '#b31217')
  redGrad.addColorStop(1, '#7a0509')
  ctx.fillStyle = redGrad
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2)
  ctx.fill()

  // حلقة رقيقة داخلية
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2)
  ctx.stroke()

  // نصوص الخصم
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.direction = 'rtl'

  ctx.font = `900 ${Math.round(r * 0.58)}px ${FONT_FAMILY}`
  ctx.fillText(`${Math.round(percent)}%`, cx, cy - r * 0.16)

  ctx.font = `800 ${Math.round(r * 0.22)}px ${FONT_FAMILY}`
  ctx.fillStyle = '#ffeaa7'
  ctx.fillText('خصم مصنعية', cx, cy + r * 0.34)

  if (savings && savings > 0) {
    ctx.font = `700 ${Math.round(r * 0.16)}px ${FONT_FAMILY}`
    ctx.fillStyle = '#ffffff'
    ctx.fillText(`وفر ${Math.round(savings)} ج.م`, cx, cy + r * 0.62)
  }

  ctx.restore()
}

/**
 * رسم باركود تجاري دقيق وأنيق
 */
function drawBarcodeBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  code: string,
  isDark: boolean,
) {
  ctx.save()
  roundedRect(ctx, x, y, w, h, 10)
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  ctx.fill()
  ctx.strokeStyle = isDark ? 'rgba(212,175,55,0.35)' : 'rgba(0,0,0,0.12)'
  ctx.lineWidth = 1
  ctx.stroke()

  const barY = y + 8
  const barH = h - 24
  const barStartX = x + 14
  const barEndX = x + w - 14
  const barColor = isDark ? '#f4eedb' : '#222222'
  ctx.fillStyle = barColor

  let curX = barStartX
  const widths = [2, 4, 1, 3, 5, 2, 4, 1, 3, 2, 4, 1, 5, 2, 3]
  let idx = 0
  while (curX < barEndX) {
    const bw = widths[idx % widths.length]
    ctx.fillRect(curX, barY, bw, barH)
    curX += bw + (idx % 2 === 0 ? 3 : 2)
    idx++
  }

  ctx.direction = 'ltr'
  ctx.textAlign = 'center'
  ctx.font = `700 11px ${FONT_FAMILY}`
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'
  ctx.fillText(code, x + w / 2, y + h - 5)
  ctx.restore()
}

/**
 * رسم صورة قطعة الذهب باحترافية وتوسيط كامل بدون أي تشويه أو قص للأطراف (Contain-fit)
 */
function drawJewelryShowcase(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  cx: number,
  cy: number,
  maxW: number,
  maxH: number,
) {
  ctx.save()
  if (img && img.width > 0 && img.height > 0) {
    // استخدام Math.min لضمان ظهور كامل القطعة دون قص
    const scale = Math.min((maxW * 0.92) / img.width, (maxH * 0.92) / img.height)
    const dw = img.width * scale
    const dh = img.height * scale

    // ظل القطعة الواقعي
    ctx.shadowColor = 'rgba(0,0,0,0.6)'
    ctx.shadowBlur = 35
    ctx.shadowOffsetY = 18

    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh)
  } else {
    // أيقونة بديلة راقية في حال عدم توفر صورة
    ctx.shadowColor = 'rgba(212,175,55,0.5)'
    ctx.shadowBlur = 30
    ctx.fillStyle = '#ffd700'
    ctx.font = `900 ${Math.round(Math.min(maxW, maxH) * 0.32)}px ${FONT_FAMILY}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('💎', cx, cy)
  }
  ctx.restore()
}

/**
 * رسم بطاقة المواصفات التجارية الرباعية للذهب
 * (العيار • الوزن الصافي • سعر الجرام • السعر التقديري)
 */
function drawCommercialSpecsGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  specs: {
    karatStr: string
    weightStr: string
    gramPriceStr: string
    totalPriceStr: string
  },
  isDark: boolean,
) {
  ctx.save()

  // بطاقات 4 مربعة أو مستطيلة
  const cols = 4
  const gap = 12
  const cardW = (w - gap * (cols - 1)) / cols

  const cards = [
    { label: 'العيار الرسمي', value: specs.karatStr, icon: '👑' },
    { label: 'الوزن الصافي', value: specs.weightStr, icon: '⚖️' },
    { label: 'سعر الجرام اليوم', value: specs.gramPriceStr, icon: '📈' },
    { label: 'السعر الإجمالي التقديري', value: specs.totalPriceStr, icon: '🏷️' },
  ]

  let curX = x
  for (const card of cards) {
    roundedRect(ctx, curX, y, cardW, h, 14)
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.9)'
    ctx.fill()
    ctx.strokeStyle = isDark ? 'rgba(212,175,55,0.35)' : 'rgba(212,175,55,0.5)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.direction = 'rtl'
    ctx.textAlign = 'center'

    // أيقونة وعنوان
    ctx.font = `700 13px ${FONT_FAMILY}`
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.7)' : '#665533'
    ctx.fillText(`${card.icon} ${card.label}`, curX + cardW / 2, y + 26)

    // القيمة الكبرى
    ctx.font = `900 20px ${FONT_FAMILY}`
    ctx.fillStyle = isDark ? '#ffd700' : '#8c6b1b'
    ctx.fillText(card.value, curX + cardW / 2, y + h - 18)

    curX += cardW + gap
  }

  ctx.restore()
}

/**
 * توليد صورة رمز الاستجابة السريعة (QR) لرابط واتساب الدعم.
 * تُعاد كـ HTMLImageElement جاهزة للرسم على الكانفس.
 */
async function buildWhatsAppQr(): Promise<HTMLImageElement | null> {
  try {
    const dataUrl = await QRCode.toDataURL(SUPPORT_WHATSAPP, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 512,
      color: { dark: '#101010', light: '#ffffff' },
    })
    return await loadImageElement(dataUrl, false)
  } catch {
    return null
  }
}

/**
 * رسم شارة QR مدمجة مع اسم العلامة التجارية في موضع مستقل.
 * تُستخدم في التصاميم التي لا تعتمد شريط التواصل الموحّد (الأفقي).
 */
function drawBrandQrBadge(
  ctx: CanvasRenderingContext2D,
  qr: HTMLImageElement | null,
  cx: number,
  cy: number,
  size: number,
  isDark: boolean,
  captionAbove = false,
) {
  ctx.save()
  const plate = size + 24

  // لوحة بيضاء مذهّبة تضمن وضوح الرمز فوق أي خلفية
  ctx.shadowColor = 'rgba(0,0,0,0.45)'
  ctx.shadowBlur = 18
  ctx.shadowOffsetY = 8
  roundedRect(ctx, cx - plate / 2, cy - plate / 2, plate, plate, 18)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
  ctx.strokeStyle = '#d4af37'
  ctx.lineWidth = 2
  ctx.stroke()

  if (qr && qr.width > 0) {
    ctx.drawImage(qr, cx - size / 2, cy - size / 2, size, size)
  } else {
    ctx.fillStyle = '#1c1505'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `900 ${Math.round(size * 0.4)}px ${FONT_FAMILY}`
    ctx.fillText('📞', cx, cy)
  }

  ctx.direction = 'rtl'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  const captionY = captionAbove
    ? cy - plate / 2 - 30
    : cy + plate / 2 + 28
  ctx.font = `900 18px ${FONT_FAMILY}`
  ctx.fillStyle = isDark ? '#ffd700' : '#8c6b1b'
  ctx.fillText(`${BRAND_AR} • ${BRAND_EN}`, cx, captionY)
  ctx.font = `700 14px ${FONT_FAMILY}`
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.8)' : '#665533'
  ctx.fillText('امسح للتواصل على واتساب', cx, captionY + 22)
  ctx.restore()
}

/**
 * رسم شريط الاتصال والحجز الفوري السفلي — مع العلامة التجارية ورمز QR للواتساب.
 */
function drawContactFooter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  phone: string,
  storeCity: string,
  isDark: boolean,
  qr: HTMLImageElement | null = null,
) {
  ctx.save()
  roundedRect(ctx, x, y, w, h, 20)
  ctx.fillStyle = isDark ? '#1a1610' : '#fcfaf6'
  ctx.fill()
  ctx.strokeStyle = isDark ? 'rgba(212,175,55,0.4)' : '#d4af37'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.direction = 'rtl'
  ctx.textAlign = 'right'

  ctx.font = `900 20px ${FONT_FAMILY}`
  ctx.fillStyle = isDark ? '#ffffff' : '#221a0d'
  ctx.fillText('متاح الآن للشراء الفوري بالفرع', x + w - 30, y + h / 2 - 8)

  ctx.font = `700 13px ${FONT_FAMILY}`
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.7)' : '#7a684b'
  ctx.fillText(`${BRAND_AR} • ${BRAND_EN} • فرع ${storeCity}`, x + w - 30, y + h / 2 + 18)

  // رمز واتساب (QR) على الطرف الأيسر داخل لوحة بيضاء واضحة
  const qrSize = h - 28
  const qrX = x + 16
  const qrY = y + 14
  roundedRect(ctx, qrX, qrY, qrSize, qrSize, 12)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = '#d4af37'
  ctx.lineWidth = 1.5
  ctx.stroke()
  if (qr && qr.width > 0) {
    ctx.drawImage(qr, qrX + 6, qrY + 6, qrSize - 12, qrSize - 12)
  } else {
    ctx.fillStyle = '#1c1505'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `900 ${Math.round(qrSize * 0.42)}px ${FONT_FAMILY}`
    ctx.fillText('📞', qrX + qrSize / 2, qrY + qrSize / 2)
    ctx.textBaseline = 'alphabetic'
  }

  if (phone && phone !== '—') {
    const btnW = 200
    const btnH = h - 24
    const btnX = qrX + qrSize + 12
    const btnY = y + 12
    roundedRect(ctx, btnX, btnY, btnW, btnH, btnH / 2)
    ctx.fillStyle = '#d4af37'
    ctx.fill()

    ctx.direction = 'ltr'
    ctx.textAlign = 'center'
    ctx.font = `900 16px ${FONT_FAMILY}`
    ctx.fillStyle = '#1c1505'
    ctx.fillText(`📞 ${phone}`, btnX + btnW / 2, btnY + btnH / 2 + 6)
  }

  ctx.restore()
}

/**
 * الدالة الرئيسية لبناء ورسم صورة إعلان الذهب بدقة مطلقة لجميع القياسات الثلاثة
 */
export async function buildProductShareImage(
  spec: ShareImageSpec,
): Promise<HTMLCanvasElement> {
  if (typeof document === 'undefined') {
    throw new Error('Canvas requires a browser environment')
  }

  try {
    await document.fonts.load(`900 64px Cairo`)
    await document.fonts.load(`700 32px Cairo`)
    await document.fonts.load(`600 20px Cairo`)
  } catch {
    // continue with fallback
  }

  const ratio = spec.aspectRatio ?? '9:16'
  const isStory = ratio === '9:16'
  const isSquare = ratio === '1:1'
  const isLandscape = ratio === '1.91:1'

  const W = isLandscape ? 1200 : 1080
  const H = isStory ? 1920 : isSquare ? 1080 : 630

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  const styleId = canonicalStyle(spec.style)
  const isLight = styleId === 'assay-cert' || styleId === 'studio-minimal'

  // تحميل صورة المنتج الحقيقية + رمز واتساب الدعم
  const [img, qrImg] = await Promise.all([
    spec.imageUrl ? loadImage(resolveImageUrl(spec.imageUrl)) : Promise.resolve(null),
    buildWhatsAppQr(),
  ])

  // تجهيز وحساب البيانات التجارية الحقيقية
  const storeName = (spec.storeName ?? '').trim() || BRAND_AR
  const storeCity = (spec.storeCity ?? '').trim() || 'الصاغة'
  const phone = (spec.phoneDisplay ?? '').trim() || '—'
  const discountPercent = Math.max(0, Math.min(100, Number(spec.makingDiscountPercent ?? 0) || 0))
  const productName = spec.productName.trim() || 'قطعة ذهب فاخرة'
  const barcode = spec.barcode || `GM-${Math.abs(Math.round(spec.weight * 100))}`
  const karatVal = spec.karat || 21
  const karatStr = `عيار ${karatVal}`
  const weightVal = spec.weight > 0 ? spec.weight : 1
  const weightStr = `${fmtWeight(weightVal)} جم`

  // أسعار الذهب الحقيقية
  const gold21Base = spec.gold21Price && spec.gold21Price > 0 ? spec.gold21Price : 3600
  const gramPriceVal = spec.pricePerGram && spec.pricePerGram > 0
    ? spec.pricePerGram
    : Math.round(gold21Base * (karatVal / 21))
  const gramPriceStr = `${new Intl.NumberFormat('ar-EG').format(gramPriceVal)} ج.م/جم`

  const makingFee = spec.makingFeePerGram ?? 150
  const effectiveMaking = makingFee * (1 - discountPercent / 100)
  const totalCalc = spec.totalPrice && spec.totalPrice > 0
    ? spec.totalPrice
    : Math.round((gramPriceVal + effectiveMaking) * weightVal)
  const totalPriceStr = fmtMoney(totalCalc)

  const originalCalc = spec.originalTotalPrice && spec.originalTotalPrice > 0
    ? spec.originalTotalPrice
    : Math.round((gramPriceVal + makingFee) * weightVal)
  const savingsAmount = originalCalc > totalCalc ? originalCalc - totalCalc : 0

  // ══════════════════════════════════════════════════════════════════════
  // النمط 1: royal-arch — القوس الأندلسي الملكي ومنصة الرخام
  // ══════════════════════════════════════════════════════════════════════
  if (styleId === 'royal-arch') {
    const bg = ctx.createRadialGradient(W / 2, H * 0.35, 80, W / 2, H / 2, H * 0.85)
    bg.addColorStop(0, '#1c150c')
    bg.addColorStop(0.5, '#0e0b06')
    bg.addColorStop(1, '#050402')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    if (isStory) {
      // 9:16 ستوري (1080×1920)
      // ترويسة المتجر
      ctx.save()
      ctx.direction = 'rtl'
      ctx.textAlign = 'center'
      ctx.font = `900 38px ${FONT_FAMILY}`
      ctx.fillStyle = '#ffd700'
      ctx.fillText(storeName, W / 2, 90)

      ctx.font = `600 18px ${FONT_FAMILY}`
      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      ctx.fillText(`مجوهرات راقية • صاغة معتمدة • ${storeCity}`, W / 2, 130)
      ctx.restore()

      // القوس الملكي
      const archX = 130
      const archY = 190
      const archW = W - 260
      const archH = 880
      const archR = archW / 2

      ctx.save()
      // وهج القوس
      const glow = ctx.createRadialGradient(W / 2, archY + archR, 50, W / 2, archY + archR, archR * 1.35)
      glow.addColorStop(0, 'rgba(212,175,55,0.25)')
      glow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(W / 2, archY + archR, archR * 1.35, 0, Math.PI * 2)
      ctx.fill()

      // شكل القوس
      ctx.beginPath()
      ctx.moveTo(archX, archY + archH)
      ctx.lineTo(archX, archY + archR)
      ctx.arc(W / 2, archY + archR, archR, Math.PI, 0, false)
      ctx.lineTo(archX + archW, archY + archH)
      ctx.closePath()

      const innerArch = ctx.createLinearGradient(0, archY, 0, archY + archH)
      innerArch.addColorStop(0, '#241a0e')
      innerArch.addColorStop(1, '#120d07')
      ctx.fillStyle = innerArch
      ctx.fill()

      ctx.strokeStyle = '#d4af37'
      ctx.lineWidth = 6
      ctx.stroke()
      ctx.clip()

      // صورة القطعة
      drawJewelryShowcase(ctx, img, W / 2, archY + archR + 20, archW - 40, archH - 60)
      ctx.restore()

      // شارة الخصم
      if (discountPercent > 0) {
        drawDiscountBadge(ctx, archX + archW - 20, archY + 110, 75, discountPercent, savingsAmount)
      }

      // عنوان القطعة متعدد الأسطر مع وسام العيار
      ctx.save()
      ctx.direction = 'rtl'
      ctx.textAlign = 'center'

      const tagY = 1140
      roundedRect(ctx, W / 2 - 130, tagY, 260, 44, 22)
      ctx.fillStyle = 'rgba(212,175,55,0.18)'
      ctx.fill()
      ctx.strokeStyle = '#d4af37'
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.font = `800 20px ${FONT_FAMILY}`
      ctx.fillStyle = '#ffd700'
      ctx.fillText(`👑 ذهب أصلي • ${karatStr}`, W / 2, tagY + 28)

      const titleY = 1240
      ctx.font = `900 48px ${FONT_FAMILY}`
      ctx.fillStyle = '#ffffff'
      const titleLines = wrapText(ctx, productName, W - 160, 2)
      let curTitleY = titleY
      for (const line of titleLines) {
        ctx.fillText(line, W / 2, curTitleY)
        curTitleY += 60
      }
      ctx.restore()

      // شبكة المواصفات التجارية الرباعية
      drawCommercialSpecsGrid(
        ctx,
        70,
        1400,
        W - 140,
        110,
        { karatStr, weightStr, gramPriceStr, totalPriceStr },
        true,
      )

      // شريط السعر البارز والباركود
      const priceCardY = 1540
      roundedRect(ctx, 70, priceCardY, W - 140, 140, 24)
      ctx.fillStyle = '#22190f'
      ctx.fill()
      ctx.strokeStyle = '#d4af37'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.save()
      ctx.direction = 'rtl'
      ctx.textAlign = 'right'
      ctx.font = `700 18px ${FONT_FAMILY}`
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillText('السعر الإجمالي التقديري شامل المصنعية:', W - 110, priceCardY + 45)

      ctx.font = `900 48px ${FONT_FAMILY}`
      ctx.fillStyle = '#ffd700'
      ctx.fillText(totalPriceStr, W - 110, priceCardY + 105)

      drawBarcodeBadge(ctx, 110, priceCardY + 35, 230, 70, barcode, true)
      ctx.restore()

      // شريط التواصل السفلي
      drawContactFooter(ctx, 70, 1720, W - 140, 130, phone, storeCity, true, qrImg)
    } else if (isSquare) {
      // 1:1 مربع (1080×1080)
      // ترويسة أنيقة
      ctx.save()
      ctx.direction = 'rtl'
      ctx.textAlign = 'center'
      ctx.font = `900 32px ${FONT_FAMILY}`
      ctx.fillStyle = '#ffd700'
      ctx.fillText(storeName, W / 2, 60)

      ctx.font = `600 15px ${FONT_FAMILY}`
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillText(`مجوهرات راقية • ${storeCity}`, W / 2, 90)
      ctx.restore()

      // القوس المعماري المربع
      const archX = 180
      const archY = 120
      const archW = W - 360
      const archH = 520
      const archR = archW / 2

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(archX, archY + archH)
      ctx.lineTo(archX, archY + archR)
      ctx.arc(W / 2, archY + archR, archR, Math.PI, 0, false)
      ctx.lineTo(archX + archW, archY + archH)
      ctx.closePath()

      const innerArch = ctx.createLinearGradient(0, archY, 0, archY + archH)
      innerArch.addColorStop(0, '#241a0e')
      innerArch.addColorStop(1, '#120d07')
      ctx.fillStyle = innerArch
      ctx.fill()
      ctx.strokeStyle = '#d4af37'
      ctx.lineWidth = 5
      ctx.stroke()
      ctx.clip()

      drawJewelryShowcase(ctx, img, W / 2, archY + archH / 2 + 10, archW - 30, archH - 40)
      ctx.restore()

      if (discountPercent > 0) {
        drawDiscountBadge(ctx, archX + archW - 10, archY + 80, 62, discountPercent, savingsAmount)
      }

      // عنوان القطعة متعدد الأسطر
      ctx.save()
      ctx.direction = 'rtl'
      ctx.textAlign = 'center'
      ctx.font = `900 38px ${FONT_FAMILY}`
      ctx.fillStyle = '#ffffff'
      const titleLines = wrapText(ctx, productName, W - 140, 2)
      let curY = 690
      for (const line of titleLines) {
        ctx.fillText(line, W / 2, curY)
        curY += 46
      }
      ctx.restore()

      // شبكة المواصفات التجارية
      drawCommercialSpecsGrid(
        ctx,
        50,
        775,
        W - 100,
        96,
        { karatStr, weightStr, gramPriceStr, totalPriceStr },
        true,
      )

      // شريط التواصل والباركود المدمج
      const footY = 895
      roundedRect(ctx, 50, footY, W - 100, 135, 20)
      ctx.fillStyle = '#1c150c'
      ctx.fill()
      ctx.strokeStyle = '#d4af37'
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.save()
      ctx.direction = 'rtl'
      ctx.textAlign = 'right'
      ctx.font = `900 24px ${FONT_FAMILY}`
      ctx.fillStyle = '#ffd700'
      ctx.fillText(`السعر التقديري: ${totalPriceStr}`, W - 80, footY + 45)

      ctx.font = `700 16px ${FONT_FAMILY}`
      ctx.fillStyle = '#ffffff'
      ctx.fillText(`للحجز الفوري بالفرع: 📞 ${phone}`, W - 80, footY + 95)

      drawBarcodeBadge(ctx, 80, footY + 30, 220, 75, barcode, true)
      drawBrandQrBadge(ctx, qrImg, 520, footY + 67, 86, true)
      ctx.restore()
    } else {
      // 1.91:1 أفقي (1200×630)
      const archX = 60
      const archY = 50
      const archW = 460
      const archH = H - 100
      const archR = archW / 2

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(archX, archY + archH)
      ctx.lineTo(archX, archY + archR)
      ctx.arc(archX + archR, archY + archR, archR, Math.PI, 0, false)
      ctx.lineTo(archX + archW, archY + archH)
      ctx.closePath()
      ctx.fillStyle = '#241a0e'
      ctx.fill()
      ctx.strokeStyle = '#d4af37'
      ctx.lineWidth = 5
      ctx.stroke()
      ctx.clip()

      drawJewelryShowcase(ctx, img, archX + archR, archY + archH / 2, archW - 20, archH - 30)
      ctx.restore()

      if (discountPercent > 0) {
        drawDiscountBadge(ctx, archX + archW - 20, archY + 60, 58, discountPercent, savingsAmount)
      }

      // الجانب الأيمن للنصوص والمواصفات
      ctx.save()
      ctx.direction = 'rtl'
      ctx.textAlign = 'right'
      const rx = W - 60

      ctx.font = `900 26px ${FONT_FAMILY}`
      ctx.fillStyle = '#ffd700'
      ctx.fillText(storeName, rx, 80)

      ctx.font = `900 42px ${FONT_FAMILY}`
      ctx.fillStyle = '#ffffff'
      const lines = wrapText(ctx, productName, 580, 2)
      let lineY = 140
      for (const line of lines) {
        ctx.fillText(line, rx, lineY)
        lineY += 50
      }

      ctx.font = `700 22px ${FONT_FAMILY}`
      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      ctx.fillText(`${karatStr} • الوزن الصافي: ${weightStr} • ${gramPriceStr}`, rx, lineY + 15)

      ctx.font = `900 40px ${FONT_FAMILY}`
      ctx.fillStyle = '#ffd700'
      ctx.fillText(`السعر التقديري: ${totalPriceStr}`, rx, lineY + 75)

      // شريط التواصل والباركود
      roundedRect(ctx, 560, H - 110, W - 620, 75, 18)
      ctx.fillStyle = '#22190f'
      ctx.fill()
      ctx.strokeStyle = '#d4af37'
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.font = `900 22px ${FONT_FAMILY}`
      ctx.fillStyle = '#ffffff'
      ctx.fillText(`📞 للتواصل والحجز: ${phone}`, rx - 30, H - 65)

      drawBarcodeBadge(ctx, 580, H - 100, 180, 55, barcode, true)
      drawBrandQrBadge(ctx, qrImg, W - 210, H - 195, 92, true)
      ctx.restore()
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // النمط 2: vogue-split — البوستر التحريري العصري (Vogue Haute Joaillerie)
  // ══════════════════════════════════════════════════════════════════════
  else if (styleId === 'vogue-split') {
    ctx.fillStyle = '#141416'
    ctx.fillRect(0, 0, W, H)

    if (isStory) {
      // 9:16
      ctx.fillStyle = '#0a0a0c'
      ctx.fillRect(0, 0, 150, H)

      ctx.save()
      ctx.translate(75, H / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.textAlign = 'center'
      ctx.font = `900 42px ${FONT_FAMILY}`
      ctx.fillStyle = 'rgba(212,175,55,0.35)'
      ctx.fillText('HAUTE JOAILLERIE • EXCLUSIVE', 0, 0)
      ctx.restore()

      ctx.save()
      ctx.direction = 'rtl'
      ctx.textAlign = 'right'
      ctx.font = `900 36px ${FONT_FAMILY}`
      ctx.fillStyle = '#ffffff'
      ctx.fillText(storeName, W - 80, 100)

      ctx.font = `700 18px ${FONT_FAMILY}`
      ctx.fillStyle = '#d4af37'
      ctx.fillText('مجموعة الصاغة الحصرية • إصدار فاخر', W - 80, 140)
      ctx.restore()

      const pX = 200
      const pY = 200
      const pW = W - 280
      const pH = 840

      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,0.7)'
      ctx.shadowBlur = 40
      ctx.shadowOffsetY = 20
      roundedRect(ctx, pX, pY, pW, pH, 30)
      ctx.fillStyle = '#1f1f24'
      ctx.fill()
      ctx.strokeStyle = '#d4af37'
      ctx.lineWidth = 2.5
      ctx.stroke()
      ctx.clip()

      drawJewelryShowcase(ctx, img, pX + pW / 2, pY + pH / 2, pW - 20, pH - 20)
      ctx.restore()

      drawBarcodeBadge(ctx, pX + 25, pY + pH - 85, 220, 60, barcode, true)

      ctx.save()
      ctx.direction = 'rtl'
      ctx.textAlign = 'right'

      const textY = 1120
      ctx.font = `900 52px ${FONT_FAMILY}`
      ctx.fillStyle = '#ffffff'
      const titleLines = wrapText(ctx, productName, W - 280, 2)
      let curY = textY
      for (const line of titleLines) {
        ctx.fillText(line, W - 80, curY)
        curY += 60
      }

      ctx.font = `700 24px ${FONT_FAMILY}`
      ctx.fillStyle = '#d4af37'
      ctx.fillText(`${karatStr} • تشطيب ليزر متقن`, W - 80, curY + 20)
      ctx.restore()

      drawCommercialSpecsGrid(
        ctx,
        200,
        1380,
        W - 280,
        110,
        { karatStr, weightStr, gramPriceStr, totalPriceStr },
        true,
      )

      const footY = 1530
      roundedRect(ctx, 200, footY, W - 280, 130, 20)
      ctx.fillStyle = '#222228'
      ctx.fill()
      ctx.strokeStyle = '#d4af37'
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.save()
      ctx.direction = 'rtl'
      ctx.textAlign = 'right'
      ctx.font = `700 16px ${FONT_FAMILY}`
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillText('السعر المعتمد النهائي شامل المصنعية:', W - 240, footY + 45)

      ctx.font = `900 44px ${FONT_FAMILY}`
      ctx.fillStyle = '#ffffff'
      ctx.fillText(totalPriceStr, W - 240, footY + 100)
      ctx.restore()

      drawContactFooter(ctx, 200, 1710, W - 280, 120, phone, storeCity, true, qrImg)
    } else if (isSquare) {
      // 1:1
      ctx.save()
      ctx.direction = 'rtl'
      ctx.textAlign = 'right'
      ctx.font = `900 32px ${FONT_FAMILY}`
      ctx.fillStyle = '#ffffff'
      ctx.fillText(storeName, W - 60, 65)

      ctx.font = `700 16px ${FONT_FAMILY}`
      ctx.fillStyle = '#d4af37'
      ctx.fillText('HAUTE JOAILLERIE • صاغة راقية', W - 60, 95)
      ctx.restore()

      const pX = 60
      const pY = 130
      const pW = W - 120
      const pH = 510

      ctx.save()
      roundedRect(ctx, pX, pY, pW, pH, 24)
      ctx.fillStyle = '#1c1b20'
      ctx.fill()
      ctx.strokeStyle = '#d4af37'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.clip()

      drawJewelryShowcase(ctx, img, pX + pW / 2, pY + pH / 2, pW - 20, pH - 20)
      ctx.restore()

      drawBarcodeBadge(ctx, pX + 20, pY + pH - 75, 200, 55, barcode, true)

      ctx.save()
      ctx.direction = 'rtl'
      ctx.textAlign = 'right'
      ctx.font = `900 38px ${FONT_FAMILY}`
      ctx.fillStyle = '#ffffff'
      const titleLines = wrapText(ctx, productName, W - 120, 2)
      let curY = 690
      for (const line of titleLines) {
        ctx.fillText(line, W - 60, curY)
        curY += 46
      }
      ctx.restore()

      drawCommercialSpecsGrid(
        ctx,
        60,
        775,
        W - 120,
        96,
        { karatStr, weightStr, gramPriceStr, totalPriceStr },
        true,
      )

      drawContactFooter(ctx, 60, 895, W - 120, 135, phone, storeCity, true, qrImg)
    } else {
      // 1.91:1
      const pX = 50
      const pY = 50
      const pW = 480
      const pH = H - 100

      ctx.save()
      roundedRect(ctx, pX, pY, pW, pH, 24)
      ctx.fillStyle = '#1c1b18'
      ctx.fill()
      ctx.strokeStyle = '#d4af37'
      ctx.lineWidth = 2.5
      ctx.stroke()
      ctx.clip()
      drawJewelryShowcase(ctx, img, pX + pW / 2, pY + pH / 2, pW - 20, pH - 20)
      ctx.restore()

      drawBarcodeBadge(ctx, pX + 20, pY + pH - 75, 200, 55, barcode, true)

      ctx.save()
      ctx.direction = 'rtl'
      ctx.textAlign = 'right'
      const rx = W - 60

      ctx.font = `900 26px ${FONT_FAMILY}`
      ctx.fillStyle = '#d4af37'
      ctx.fillText(storeName, rx, 85)

      ctx.font = `900 42px ${FONT_FAMILY}`
      ctx.fillStyle = '#ffffff'
      const titleLines = wrapText(ctx, productName, 560, 2)
      let curY = 145
      for (const line of titleLines) {
        ctx.fillText(line, rx, curY)
        curY += 48
      }

      ctx.font = `800 22px ${FONT_FAMILY}`
      ctx.fillStyle = '#ffd700'
      ctx.fillText(`${karatStr} • ${weightStr} • ${gramPriceStr}`, rx, curY + 20)

      ctx.font = `900 42px ${FONT_FAMILY}`
      ctx.fillStyle = '#ffffff'
      ctx.fillText(`السعر التقديري: ${totalPriceStr}`, rx, curY + 80)

      roundedRect(ctx, 580, H - 110, W - 640, 75, 18)
      ctx.fillStyle = '#ffd700'
      ctx.fill()

      ctx.font = `900 22px ${FONT_FAMILY}`
      ctx.fillStyle = '#0a0a0c'
      ctx.fillText(`للحجز والطلب: 📞 ${phone}`, rx - 30, H - 65)
      drawBrandQrBadge(ctx, qrImg, W - 210, H - 195, 92, true)
      ctx.restore()
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // النمط 3: assay-cert — شهادة الصاغة والسبائك الرسمية
  // ══════════════════════════════════════════════════════════════════════
  else if (styleId === 'assay-cert') {
    ctx.fillStyle = '#f8f4ec'
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = 'rgba(180,140,50,0.3)'
    ctx.lineWidth = 2
    ctx.strokeRect(25, 25, W - 50, H - 50)
    ctx.strokeRect(35, 35, W - 70, H - 70)

    if (isStory) {
      // 9:16
      ctx.save()
      ctx.direction = 'rtl'
      ctx.textAlign = 'center'
      ctx.font = `900 34px ${FONT_FAMILY}`
      ctx.fillStyle = '#2d2212'
      ctx.fillText(`شهادة اعتماد ومواصفات ذهب رسمية`, W / 2, 95)

      ctx.font = `800 22px ${FONT_FAMILY}`
      ctx.fillStyle = '#8c6b1b'
      ctx.fillText(storeName, W / 2, 135)
      ctx.restore()

      const bX = 140
      const bY = 190
      const bW = W - 280
      const bH = 800

      ctx.save()
      roundedRect(ctx, bX, bY, bW, bH, 20)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.strokeStyle = '#d4af37'
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.clip()
      drawJewelryShowcase(ctx, img, bX + bW / 2, bY + bH / 2, bW - 20, bH - 20)
      ctx.restore()

      drawBarcodeBadge(ctx, bX + 25, bY + bH - 80, 220, 60, barcode, false)

      // جدول الشهادة
      const tY = 1040
      const tW = W - 200
      const tX = 100

      roundedRect(ctx, tX, tY, tW, 530, 20)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.strokeStyle = 'rgba(180,140,50,0.4)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      const rows = [
        { label: 'الصنف والموديل', val: productName },
        { label: 'العيار ودرجة النقاء', val: `${karatStr} (${karatVal === 24 ? '999.9' : karatVal === 21 ? '875' : '750'})` },
        { label: 'الوزن القائم الصافي', val: weightStr },
        { label: 'سعر الجرام اليومي', val: gramPriceStr },
        { label: 'السعر الإجمالي المعتمد', val: totalPriceStr },
        { label: 'الدمغة والضمان', val: 'مصلحة الدمغة والموازين المصرية' },
      ]

      let rowY = tY + 50
      ctx.direction = 'rtl'
      for (const r of rows) {
        ctx.textAlign = 'right'
        ctx.font = `700 18px ${FONT_FAMILY}`
        ctx.fillStyle = '#6b5836'
        ctx.fillText(r.label, tX + tW - 25, rowY)

        ctx.textAlign = 'left'
        ctx.font = `900 20px ${FONT_FAMILY}`
        ctx.fillStyle = '#2d2212'
        ctx.fillText(r.val, tX + 25, rowY)

        rowY += 45
        ctx.strokeStyle = 'rgba(180,140,50,0.15)'
        ctx.beginPath()
        ctx.moveTo(tX + 20, rowY - 20)
        ctx.lineTo(tX + tW - 20, rowY - 20)
        ctx.stroke()
      }

      drawContactFooter(ctx, 100, 1680, W - 200, 140, phone, storeCity, false, qrImg)
    } else if (isSquare) {
      // 1:1
      ctx.save()
      ctx.direction = 'rtl'
      ctx.textAlign = 'center'
      ctx.font = `900 30px ${FONT_FAMILY}`
      ctx.fillStyle = '#2d2212'
      ctx.fillText(`شهادة اعتماد ومواصفات صاغة`, W / 2, 65)

      ctx.font = `800 18px ${FONT_FAMILY}`
      ctx.fillStyle = '#8c6b1b'
      ctx.fillText(storeName, W / 2, 95)
      ctx.restore()

      const bX = 140
      const bY = 125
      const bW = W - 280
      const bH = 500

      ctx.save()
      roundedRect(ctx, bX, bY, bW, bH, 20)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.strokeStyle = '#d4af37'
      ctx.lineWidth = 2.5
      ctx.stroke()
      ctx.clip()
      drawJewelryShowcase(ctx, img, bX + bW / 2, bY + bH / 2, bW - 20, bH - 20)
      ctx.restore()

      drawCommercialSpecsGrid(
        ctx,
        50,
        660,
        W - 100,
        96,
        { karatStr, weightStr, gramPriceStr, totalPriceStr },
        false,
      )

      drawContactFooter(ctx, 50, 790, W - 100, 130, phone, storeCity, false, qrImg)
      drawBarcodeBadge(ctx, W / 2 - 120, 935, 240, 65, barcode, false)
    } else {
      // 1.91:1
      const bX = 50
      const bY = 50
      const bW = 460
      const bH = H - 100

      ctx.save()
      roundedRect(ctx, bX, bY, bW, bH, 20)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.strokeStyle = '#d4af37'
      ctx.lineWidth = 2.5
      ctx.stroke()
      ctx.clip()
      drawJewelryShowcase(ctx, img, bX + bW / 2, bY + bH / 2, bW - 20, bH - 20)
      ctx.restore()

      drawBarcodeBadge(ctx, bX + 20, bY + bH - 75, 200, 55, barcode, false)

      ctx.save()
      ctx.direction = 'rtl'
      ctx.textAlign = 'right'
      const rx = W - 60

      ctx.font = `900 24px ${FONT_FAMILY}`
      ctx.fillStyle = '#8c6b1b'
      ctx.fillText(`شهادة اعتماد ومواصفات ذهب رسمية`, rx, 80)

      ctx.font = `900 38px ${FONT_FAMILY}`
      ctx.fillStyle = '#2d2212'
      const lines = wrapText(ctx, productName, 580, 2)
      let lineY = 140
      for (const line of lines) {
        ctx.fillText(line, rx, lineY)
        lineY += 46
      }

      ctx.font = `700 22px ${FONT_FAMILY}`
      ctx.fillStyle = '#6b5836'
      ctx.fillText(`${karatStr} • الوزن: ${weightStr} • ${gramPriceStr}`, rx, lineY + 15)

      ctx.font = `900 40px ${FONT_FAMILY}`
      ctx.fillStyle = '#8c6b1b'
      ctx.fillText(`السعر المعتمد: ${totalPriceStr}`, rx, lineY + 75)

      roundedRect(ctx, 560, H - 110, W - 620, 75, 18)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.strokeStyle = '#d4af37'
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.font = `900 22px ${FONT_FAMILY}`
      ctx.fillStyle = '#2d2212'
      ctx.fillText(`📞 للاستفسار والحجز: ${phone}`, rx - 30, H - 65)
      drawBrandQrBadge(ctx, qrImg, W - 210, H - 195, 92, false)
      ctx.restore()
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // النمط 4: sagha-deal — عروض وتخفيضات الصاغة الكبرى
  // ══════════════════════════════════════════════════════════════════════
  else if (styleId === 'sagha-deal') {
    const bg = ctx.createLinearGradient(0, 0, W, H)
    bg.addColorStop(0, '#240206')
    bg.addColorStop(0.5, '#120104')
    bg.addColorStop(1, '#050001')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    if (isStory) {
      // 9:16
      ctx.save()
      ctx.direction = 'rtl'
      ctx.textAlign = 'center'
      ctx.font = `900 36px ${FONT_FAMILY}`
      ctx.fillStyle = '#ff4d4d'
      ctx.fillText('🔥 عرض الصاغة الحصري لفترة محدودة', W / 2, 85)

      ctx.font = `800 24px ${FONT_FAMILY}`
      ctx.fillStyle = '#ffffff'
      ctx.fillText(storeName, W / 2, 130)
      ctx.restore()

      const sX = 120
      const sY = 180
      const sW = W - 240
      const sH = 880

      ctx.save()
      roundedRect(ctx, sX, sY, sW, sH, 26)
      ctx.fillStyle = '#1c0508'
      ctx.fill()
      ctx.strokeStyle = '#ff3344'
      ctx.lineWidth = 4
      ctx.stroke()
      ctx.clip()

      drawJewelryShowcase(ctx, img, W / 2, sY + sH / 2, sW - 20, sH - 20)
      ctx.restore()

      drawDiscountBadge(ctx, sX + sW - 10, sY + 110, 85, discountPercent > 0 ? discountPercent : 25, savingsAmount)

      ctx.save()
      ctx.direction = 'rtl'
      ctx.textAlign = 'center'

      const titleY = 1140
      ctx.font = `900 48px ${FONT_FAMILY}`
      ctx.fillStyle = '#ffffff'
      const titleLines = wrapText(ctx, productName, W - 140, 2)
      let curY = titleY
      for (const line of titleLines) {
        ctx.fillText(line, W / 2, curY)
        curY += 56
      }
      ctx.restore()

      drawCommercialSpecsGrid(
        ctx,
        70,
        1380,
        W - 140,
        110,
        { karatStr, weightStr, gramPriceStr, totalPriceStr },
        true,
      )

      // بطاقة السعر المخفض
      const pY = 1530
      roundedRect(ctx, 70, pY, W - 140, 140, 22)
      ctx.fillStyle = '#2c080e'
      ctx.fill()
      ctx.strokeStyle = '#ff4d4d'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.save()
      ctx.direction = 'rtl'
      ctx.textAlign = 'right'

      if (savingsAmount > 0) {
        ctx.font = `700 20px ${FONT_FAMILY}`
        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        ctx.fillText(`السعر الأصلي: ${fmtMoney(originalCalc)}`, W - 110, pY + 45)
      }

      ctx.font = `900 48px ${FONT_FAMILY}`
      ctx.fillStyle = '#ffd700'
      ctx.fillText(`سعر العرض: ${totalPriceStr}`, W - 110, pY + 105)

      drawBarcodeBadge(ctx, 110, pY + 35, 230, 70, barcode, true)
      ctx.restore()

      drawContactFooter(ctx, 70, 1720, W - 140, 130, phone, storeCity, true, qrImg)
    } else if (isSquare) {
      // 1:1
      ctx.save()
      ctx.direction = 'rtl'
      ctx.textAlign = 'center'
      ctx.font = `900 32px ${FONT_FAMILY}`
      ctx.fillStyle = '#ff4d4d'
      ctx.fillText(`🔥 عرض صاغة خاص • ${storeName}`, W / 2, 60)
      ctx.restore()

      const sX = 140
      const sY = 100
      const sW = W - 280
      const sH = 540

      ctx.save()
      roundedRect(ctx, sX, sY, sW, sH, 24)
      ctx.fillStyle = '#1c0508'
      ctx.fill()
      ctx.strokeStyle = '#ff3344'
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.clip()
      drawJewelryShowcase(ctx, img, W / 2, sY + sH / 2, sW - 20, sH - 20)
      ctx.restore()

      drawDiscountBadge(ctx, sX + sW - 10, sY + 80, 70, discountPercent > 0 ? discountPercent : 25, savingsAmount)

      ctx.save()
      ctx.direction = 'rtl'
      ctx.textAlign = 'center'
      ctx.font = `900 38px ${FONT_FAMILY}`
      ctx.fillStyle = '#ffffff'
      const titleLines = wrapText(ctx, productName, W - 120, 2)
      let curY = 690
      for (const line of titleLines) {
        ctx.fillText(line, W / 2, curY)
        curY += 46
      }
      ctx.restore()

      drawCommercialSpecsGrid(
        ctx,
        50,
        775,
        W - 100,
        96,
        { karatStr, weightStr, gramPriceStr, totalPriceStr },
        true,
      )

      drawContactFooter(ctx, 50, 895, W - 100, 135, phone, storeCity, true, qrImg)
    } else {
      // 1.91:1
      const sX = 50
      const sY = 50
      const sW = 460
      const sH = H - 100

      ctx.save()
      roundedRect(ctx, sX, sY, sW, sH, 24)
      ctx.fillStyle = '#1c0508'
      ctx.fill()
      ctx.strokeStyle = '#ff3344'
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.clip()
      drawJewelryShowcase(ctx, img, sX + sW / 2, sY + sH / 2, sW - 20, sH - 20)
      ctx.restore()

      drawDiscountBadge(ctx, sX + sW - 20, sY + 60, 65, discountPercent > 0 ? discountPercent : 25, savingsAmount)

      ctx.save()
      ctx.direction = 'rtl'
      ctx.textAlign = 'right'
      const rx = W - 60

      ctx.font = `900 24px ${FONT_FAMILY}`
      ctx.fillStyle = '#ff4d4d'
      ctx.fillText(`🔥 عرض حصري • ${storeName}`, rx, 80)

      ctx.font = `900 42px ${FONT_FAMILY}`
      ctx.fillStyle = '#ffffff'
      const lines = wrapText(ctx, productName, 580, 2)
      let lineY = 140
      for (const line of lines) {
        ctx.fillText(line, rx, lineY)
        lineY += 48
      }

      ctx.font = `700 22px ${FONT_FAMILY}`
      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      ctx.fillText(`${karatStr} • ${weightStr} • ${gramPriceStr}`, rx, lineY + 15)

      ctx.font = `900 42px ${FONT_FAMILY}`
      ctx.fillStyle = '#ffd700'
      ctx.fillText(`سعر العرض: ${totalPriceStr}`, rx, lineY + 75)

      roundedRect(ctx, 560, H - 110, W - 620, 75, 18)
      ctx.fillStyle = '#2c080e'
      ctx.fill()
      ctx.strokeStyle = '#ff4d4d'
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.font = `900 22px ${FONT_FAMILY}`
      ctx.fillStyle = '#ffffff'
      ctx.fillText(`📞 للحجز والشراء: ${phone}`, rx - 30, H - 65)

      drawBarcodeBadge(ctx, 580, H - 100, 180, 55, barcode, true)
      drawBrandQrBadge(ctx, qrImg, W - 210, H - 195, 92, true)
      ctx.restore()
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // باقي الأنماط (5 إلى 10): تُبنى بنظام العمارة المرنة الموحد
  // ══════════════════════════════════════════════════════════════════════
  else {
    // إعدادات ألوان كل استايل
    let bgBase1 = '#0f1715'
    let bgBase2 = '#060a08'
    let accent = '#ffd700'

    if (styleId === 'arabesque-luxury') {
      bgBase1 = '#082016'
      bgBase2 = '#020c08'
      accent = '#ffd700'
    } else if (styleId === 'studio-minimal') {
      bgBase1 = '#fcfaf6'
      bgBase2 = '#f5efe4'
      accent = '#8c6b1b'
    } else if (styleId === 'cinematic-bokeh') {
      bgBase1 = '#12151c'
      bgBase2 = '#080a0e'
      accent = '#ffd700'
    } else if (styleId === 'bridal-shabka') {
      bgBase1 = '#300a14'
      bgBase2 = '#150308'
      accent = '#ffd700'
    } else if (styleId === 'neo-luxe') {
      bgBase1 = '#090d12'
      bgBase2 = '#040608'
      accent = '#ffd700'
    } else if (styleId === 'heritage-sagha') {
      bgBase1 = '#281708'
      bgBase2 = '#120a03'
      accent = '#ffd700'
    }

    // خلفية
    const bg = ctx.createLinearGradient(0, 0, W, H)
    bg.addColorStop(0, bgBase1)
    bg.addColorStop(1, bgBase2)
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    const dark = !isLight

    if (isStory) {
      // 9:16
      ctx.save()
      ctx.direction = 'rtl'
      ctx.textAlign = 'center'
      ctx.font = `900 38px ${FONT_FAMILY}`
      ctx.fillStyle = accent
      ctx.fillText(storeName, W / 2, 90)

      ctx.font = `600 18px ${FONT_FAMILY}`
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.75)' : '#665533'
      ctx.fillText(`صاغة ومجوهرات • ${storeCity}`, W / 2, 130)
      ctx.restore()

      const sX = 130
      const sY = 190
      const sW = W - 260
      const sH = 880

      ctx.save()
      roundedRect(ctx, sX, sY, sW, sH, 26)
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.04)' : '#ffffff'
      ctx.fill()
      ctx.strokeStyle = accent
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.clip()

      drawJewelryShowcase(ctx, img, W / 2, sY + sH / 2, sW - 20, sH - 20)
      ctx.restore()

      if (discountPercent > 0) {
        drawDiscountBadge(ctx, sX + sW - 10, sY + 110, 75, discountPercent, savingsAmount)
      }

      ctx.save()
      ctx.direction = 'rtl'
      ctx.textAlign = 'center'

      const titleY = 1140
      ctx.font = `900 48px ${FONT_FAMILY}`
      ctx.fillStyle = dark ? '#ffffff' : '#221a0d'
      const titleLines = wrapText(ctx, productName, W - 140, 2)
      let curY = titleY
      for (const line of titleLines) {
        ctx.fillText(line, W / 2, curY)
        curY += 56
      }
      ctx.restore()

      drawCommercialSpecsGrid(
        ctx,
        70,
        1380,
        W - 140,
        110,
        { karatStr, weightStr, gramPriceStr, totalPriceStr },
        dark,
      )

      const pY = 1530
      roundedRect(ctx, 70, pY, W - 140, 140, 22)
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.06)' : '#ffffff'
      ctx.fill()
      ctx.strokeStyle = accent
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.save()
      ctx.direction = 'rtl'
      ctx.textAlign = 'right'
      ctx.font = `700 18px ${FONT_FAMILY}`
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.7)' : '#665533'
      ctx.fillText('السعر التقديري الإجمالي شامل المصنعية:', W - 110, pY + 45)

      ctx.font = `900 48px ${FONT_FAMILY}`
      ctx.fillStyle = accent
      ctx.fillText(totalPriceStr, W - 110, pY + 105)

      drawBarcodeBadge(ctx, 110, pY + 35, 230, 70, barcode, dark)
      ctx.restore()

      drawContactFooter(ctx, 70, 1720, W - 140, 130, phone, storeCity, dark)
    } else if (isSquare) {
      // 1:1
      ctx.save()
      ctx.direction = 'rtl'
      ctx.textAlign = 'center'
      ctx.font = `900 32px ${FONT_FAMILY}`
      ctx.fillStyle = accent
      ctx.fillText(storeName, W / 2, 60)

      ctx.font = `600 15px ${FONT_FAMILY}`
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.7)' : '#665533'
      ctx.fillText(`مجوهرات فاخرة • ${storeCity}`, W / 2, 90)
      ctx.restore()

      const sX = 140
      const sY = 110
      const sW = W - 280
      const sH = 530

      ctx.save()
      roundedRect(ctx, sX, sY, sW, sH, 24)
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.04)' : '#ffffff'
      ctx.fill()
      ctx.strokeStyle = accent
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.clip()
      drawJewelryShowcase(ctx, img, W / 2, sY + sH / 2, sW - 20, sH - 20)
      ctx.restore()

      if (discountPercent > 0) {
        drawDiscountBadge(ctx, sX + sW - 10, sY + 80, 68, discountPercent, savingsAmount)
      }

      ctx.save()
      ctx.direction = 'rtl'
      ctx.textAlign = 'center'
      ctx.font = `900 38px ${FONT_FAMILY}`
      ctx.fillStyle = dark ? '#ffffff' : '#221a0d'
      const titleLines = wrapText(ctx, productName, W - 120, 2)
      let curY = 690
      for (const line of titleLines) {
        ctx.fillText(line, W / 2, curY)
        curY += 46
      }
      ctx.restore()

      drawCommercialSpecsGrid(
        ctx,
        50,
        775,
        W - 100,
        96,
        { karatStr, weightStr, gramPriceStr, totalPriceStr },
        dark,
      )

      drawContactFooter(ctx, 50, 895, W - 100, 135, phone, storeCity, dark)
    } else {
      // 1.91:1
      const sX = 50
      const sY = 50
      const sW = 460
      const sH = H - 100

      ctx.save()
      roundedRect(ctx, sX, sY, sW, sH, 24)
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.04)' : '#ffffff'
      ctx.fill()
      ctx.strokeStyle = accent
      ctx.lineWidth = 2.5
      ctx.stroke()
      ctx.clip()
      drawJewelryShowcase(ctx, img, sX + sW / 2, sY + sH / 2, sW - 20, sH - 20)
      ctx.restore()

      if (discountPercent > 0) {
        drawDiscountBadge(ctx, sX + sW - 20, sY + 60, 60, discountPercent, savingsAmount)
      }

      ctx.save()
      ctx.direction = 'rtl'
      ctx.textAlign = 'right'
      const rx = W - 60

      ctx.font = `900 24px ${FONT_FAMILY}`
      ctx.fillStyle = accent
      ctx.fillText(storeName, rx, 80)

      ctx.font = `900 40px ${FONT_FAMILY}`
      ctx.fillStyle = dark ? '#ffffff' : '#221a0d'
      const lines = wrapText(ctx, productName, 580, 2)
      let lineY = 140
      for (const line of lines) {
        ctx.fillText(line, rx, lineY)
        lineY += 46
      }

      ctx.font = `700 22px ${FONT_FAMILY}`
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.75)' : '#665533'
      ctx.fillText(`${karatStr} • ${weightStr} • ${gramPriceStr}`, rx, lineY + 15)

      ctx.font = `900 42px ${FONT_FAMILY}`
      ctx.fillStyle = accent
      ctx.fillText(`السعر التقديري: ${totalPriceStr}`, rx, lineY + 75)

      roundedRect(ctx, 560, H - 110, W - 620, 75, 18)
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.06)' : '#ffffff'
      ctx.fill()
      ctx.strokeStyle = accent
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.font = `900 22px ${FONT_FAMILY}`
      ctx.fillStyle = dark ? '#ffffff' : '#221a0d'
      ctx.fillText(`📞 للتواصل والحجز: ${phone}`, rx - 30, H - 65)

      drawBarcodeBadge(ctx, 580, H - 100, 180, 55, barcode, dark)
      drawBrandQrBadge(ctx, qrImg, W - 210, H - 195, 92, dark)
      ctx.restore()
    }
  }

  return canvas
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png')
  })
}
