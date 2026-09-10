import { put } from '@vercel/blob'

import { preparePiecePhoto } from '@/shared/lib/imageCompress'

const BLOB_TOKEN = import.meta.env.VITE_BLOB_READ_WRITE_TOKEN as string | undefined

export interface PieceImageUploadResult {
  url: string
}

/**
 * رفع صورة قطعة/منتج إلى استضافة مجانية (Vercel Blob) فقط — بلا fallback على الباك.
 * الصورة تُضغط وتُوضَع عليها علامة مائية (ترميز) قبل الرفع عبر preparePiecePhoto،
 * ويُحفظ الـ URL النهائي فقط في قاعدة البيانات.
 */
export async function uploadProductImage(file: File): Promise<PieceImageUploadResult> {
  if (!BLOB_TOKEN) {
    throw new Error('VITE_BLOB_READ_WRITE_TOKEN غير مضبوط — لا يمكن رفع الصورة.')
  }
  const prepared = await preparePiecePhoto(file)
  const blob = await put(
    `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`,
    prepared,
    {
      access: 'public',
      token: BLOB_TOKEN,
      addRandomSuffix: true,
    },
  )
  return { url: blob.url }
}