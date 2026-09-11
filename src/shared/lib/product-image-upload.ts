import api from '@/shared/lib/api'

export interface PieceImageUploadResult {
  url: string
}

/**
 * رفع صورة قطعة/منتج عبر Relay من Vercel (POST /api/upload-catbox → catbox.moe).
 * لماذا Relay بدل الرفع المباشر؟ Catbox لا يرسل `Access-Control-Allow-Origin`
 * فالمتصفح لا يستطيع قراءة الـ URL المُعاد، والـ Backend على SmarterASP محجوب
 * نحو catbox (503). دالة Vercel ترفع وتعيد الـ URL العام الذي يُحفظ في ImageLink.
 */
export async function uploadProductImage(file: File): Promise<PieceImageUploadResult> {
  const form = new FormData()
  form.append('file', file, file.name || 'product-image.jpg')
  const { data } = await api.post<{ url: string }>('/api/upload-catbox', form, {
    headers: { 'Content-Type': undefined },
  })
  const url = (data as { url?: string } | undefined)?.url?.trim()
  if (!url) {
    throw new Error('تعذّر رفع الصورة إلى الاستضافة — رد غير صالح من الخادم.')
  }
  return { url }
}
