/**
 * يُرجع عنوان الباك إند الأساسي.
 * - فارغ → نفس الأوريغين (وسيط Vercel proxy في الإنتاج يتكفل بـ /api/* و /uploads/*).
 * - إذا صدر http:// والصفحة تُحمَّل على https:// يُرقَّى تلقائياً إلى https://
 *   لتفادي خطأ Mixed Content من المتصفح.
 */
export function getApiBaseUrl(): string {
  const base = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
  if (
    base.startsWith('http://') &&
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:'
  ) {
    return base.replace(/^http:\/\//, 'https://')
  }
  return base
}