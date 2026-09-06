/**
 * ضغط صور مستندات المشتريات في المتصفح قبل الرفع (مرحلة أولى).
 * المرحلة الثانية تتم في الـ Backend (ImageSharp → JPEG Q70 بضلع 1600).
 */
export const PURCHASE_IMAGE_MAX_DIM = 1600
export const PURCHASE_IMAGE_QUALITY = 0.72

export async function compressPurchaseImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  if (typeof createImageBitmap === 'undefined') return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, PURCHASE_IMAGE_MAX_DIM / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    bitmap.close?.()
    if (scale >= 1 && file.size <= 700 * 1024) return file

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    const bmp2 = await createImageBitmap(file)
    ctx.drawImage(bmp2, 0, 0, w, h)
    bmp2.close?.()
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', PURCHASE_IMAGE_QUALITY),
    )
    if (!blob) return file
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', {
      type: 'image/jpeg',
    })
  } catch {
    return file
  }
}

export const PIECE_PHOTO_MAX_DIM = 1200
export const PIECE_PHOTO_QUALITY = 0.8
export const PIECE_PHOTO_WATERMARK = 'Gold Master'

/**
 * تحضير صورة القطعة قبل رفعها: ضغط + شريط سفلي + رقم المشغل/اسم المحل كعلامة مائية.
 */
export async function preparePiecePhoto(
  file: File,
  watermark = PIECE_PHOTO_WATERMARK,
): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(
      1,
      PIECE_PHOTO_MAX_DIM / Math.max(bitmap.width, bitmap.height),
    )
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close?.()
      return file
    }
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()

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

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', PIECE_PHOTO_QUALITY),
    )
    if (!blob) return file
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', {
      type: 'image/jpeg',
    })
  } catch {
    return file
  }
}
