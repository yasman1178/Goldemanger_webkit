/**
 * يُرجع عنوان الباك إند الأساسي.
 * في هذا المشروع تُدار طلبات الباك إند عبر وسيط same-origin:
 *   - الإنتاج: Vercel Rewrites (يراجِع vercel.json) يمرِّر /api/* و /uploads/* إلى https://goldmaster.runasp.net/
 *   - التطوير: Vite server.proxy (يراجِع vite.config.ts) يمرِّر نفس المسارين
 * لذلك الطلبات تخرج من الأوريغين ذاته بلا CORS ولا Mixed Content.
 * - أي قيمة بعيدة لـ VITE_API_URL (غير localhost) تُلغى ليُرسَل الطلب نفس الأوريغين
 *   حتى لو ظل المتغير مضبوطاً بالإعدادات أو البيئة.
 * - قيمة localhost تُحترم (مثلاً http://localhost:5086/) مع ترقية http:// إلى https://
 *   عند تحميل الصفحة على https.
 */
const LOCAL_HOST_RE = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/i

export function getApiBaseUrl(): string {
  const base = (import.meta.env.VITE_API_URL as string | undefined)?.trim() ?? ''
  if (!base) return ''
  if (!LOCAL_HOST_RE.test(base)) return ''
  if (
    base.startsWith('http://') &&
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:'
  ) {
    return base.replace(/^http:\/\//, 'https://')
  }
  return base
}