import api from '@/shared/lib/api'

export interface PieceImageUploadResult {
  url: string
}

/**
 * رفع صورة قطعة/منتج إلى الخادم (POST /api/Images/upload → مجلد uploads على السيرفر).
 * الضغط يتم قبل الاستدعاء عبر preparePiecePhoto في AddPieceDialog،
 * والخادم يُرجع URL مطلق يُحفظ في ImageLink.
 */
export async function uploadProductImage(file: File): Promise<PieceImageUploadResult> {
  const form = new FormData()
  form.append('file', file, file.name || 'product-image.jpg')
  const { data } = await api.post<{ url: string }>('/api/Images/upload', form, {
    headers: { 'Content-Type': undefined },
  })
  const url = (data as { url?: string } | undefined)?.url?.trim()
  if (!url) {
    throw new Error('تعذّر رفع الصورة إلى الاستضافة — رد غير صالح من الخادم.')
  }
  return { url }
}
