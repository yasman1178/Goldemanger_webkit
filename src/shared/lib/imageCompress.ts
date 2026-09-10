/**
 * ضغط صور المستندات وصور القطع في المتصفح قبل الرفع (مرحلة أولى).
 * المرحلة الثانية تتم في الـ Backend (ImageSharp → JPEG Q70 بضلع 1600).
 *
 * ضمانة الحجم: كل صورة تُحوَّل إلى JPEG بضلع محدود، وإن خرج الحجم أكبر من حد
 * ثابت نعيد الضغط بأبعاد/جودة أقل — حتى لا يفشل الرفع على الاستضافة المجانية.
 * مع فك ترميز احتياطي عبر HTMLImageElement يغطي تنسيقات لا يدعمها createImageBitmap.
 */

export const PURCHASE_IMAGE_MAX_DIM = 1600
export const PURCHASE_IMAGE_QUALITY = 0.72
export const PURCHASE_IMAGE_HARD_MAX_BYTES = 600 * 1024

export const PIECE_PHOTO_MAX_DIM = 1200
export const PIECE_PHOTO_QUALITY = 0.8
export const PIECE_PHOTO_WATERMARK = 'Gold Master'
export const PIECE_PHOTO_HARD_MAX_BYTES = 500 * 1024

type ImageLike = ImageBitmap | HTMLImageElement

function isImage(file: File): boolean {
  return typeof file.type === 'string' && file.type.startsWith('image/')
}

async function decodeImage(file: File): Promise<ImageLike | null> {
  if (typeof createImageBitmap !== 'undefined') {
    try {
      return await createImageBitmap(file)
    } catch {
      /* جرّب المسار الاحتياطي أدناه */
    }
  }
  try {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.decoding = 'async'
    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('decode-error'))
        img.src = url
      })
    } finally {
      URL.revokeObjectURL(url)
    }
    if (!img.naturalWidth || !img.naturalHeight) return null
    return img
  } catch {
    return null
  }
}

function sourceSize(source: ImageLike): { width: number; height: number } {
  return source instanceof HTMLImageElement
    ? { width: source.naturalWidth, height: source.naturalHeight }
    : { width: source.width, height: source.height }
}

function closeSource(source: ImageLike): void {
  if (source instanceof ImageBitmap) source.close?.()
}

function encodeJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
}

async function compressToFile(
  source: ImageLike,
  maxDim: number,
  quality: number,
  watermark?: string,
): Promise<File | null> {
  const { width, height } = sourceSize(source)
  if (!width || !height) return null
  const scale = Math.min(1, maxDim / Math.max(width, height))
  const w = Math.max(1, Math.round(width * scale))
  const h = Math.max(1, Math.round(height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(source, 0, 0, w, h)
  if (watermark) {
    const bandH = Math.max(28, Math.round(h * 0.06))
    const pad = Math.max(12, Math.round(bandH * 0.35))
    const fontSize = Math.max(14, Math.round(bandH * 0.5))
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
    ctx.fillRect(0, h - bandH, w, bandH)
    ctx.fillStyle = '#ffffff'
    ctx.font = `600 ${fontSize}px 'Segoe UI', Tahoma, Arial, sans-serif`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'right'
    ctx.fillText(watermark, w - pad, h - bandH / 2)
  }
  const blob = await encodeJpeg(canvas, quality)
  if (!blob) return null
  return new File([blob], `gold_${Date.now()}.jpg`, { type: 'image/jpeg' })
}

/**
 * تحويل مضمون: أي تنسيق صورة → JPEG صغير الحجم.
 * إن فشل فك الترميز كليةً يُرجَع الملف الأصلي كما هو.
 */
export async function compressImage(
  file: File,
  maxDim: number,
  quality: number,
  hardMaxBytes: number,
  watermark?: string,
): Promise<File> {
  if (!isImage(file)) return file
  if (file.size <= 120 * 1024 && file.type === 'image/jpeg') return file

  const source = await decodeImage(file)
  if (!source) return file
  try {
    let result = await compressToFile(source, maxDim, quality, watermark)
    if (!result) return file
    if (result.size > hardMaxBytes) {
      const tighter = await compressToFile(
        source,
        Math.round(maxDim * 0.6),
        Math.max(0.55, quality - 0.15),
        watermark,
      )
      if (tighter && tighter.size < result.size) result = tighter
    }
    return result
  } finally {
    closeSource(source)
  }
}

export async function compressPurchaseImage(file: File): Promise<File> {
  return compressImage(
    file,
    PURCHASE_IMAGE_MAX_DIM,
    PURCHASE_IMAGE_QUALITY,
    PURCHASE_IMAGE_HARD_MAX_BYTES,
  )
}

/**
 * تحضير صورة القطعة قبل رفعها: ضغط + شريط سفلي + رقم المشغل/اسم المحل كعلامة مائية.
 */
export async function preparePiecePhoto(
  file: File,
  watermark = PIECE_PHOTO_WATERMARK,
): Promise<File> {
  return compressImage(
    file,
    PIECE_PHOTO_MAX_DIM,
    PIECE_PHOTO_QUALITY,
    PIECE_PHOTO_HARD_MAX_BYTES,
    watermark,
  )
}