import api from '@/shared/lib/api'

export interface PieceImageUploadResult {
  url: string
}

/**
 * رفع صورة قطعة/منتج عبر الباك اند (POST /api/Images/upload → Catbox).
 * الضغط والعلامة المائية يتمّان قبل الاستدعاء عبر preparePiecePhoto في AddPieceDialog،
 * وهنا نرفع الملف مباشرة ونعيد الـ URL العام الذي يُحفظ في ImageLink.
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
