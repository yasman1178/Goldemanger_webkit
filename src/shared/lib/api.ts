import axios from 'axios'
import { getApiBaseUrl } from '@/shared/lib/api-url'
import { useAuthStore } from '@/shared/stores/auth-store'

/**
 * المصادقة قائمة على كوكيز HttpOnly فقط.
 * التوكنات لا تُقرأ ولا تُكتب في localStorage إطلاقاً: الخادم يضعها في
 * `access_token`/`refresh_token` مع HttpOnly فلا تصلها جافاسكربت، والمتصفح
 * يُعيدها مع كل طلب لأن `withCredentials` مفعّل.
 *
 * بنية requests إطلاقاً ترويسة Authorization: فأي قيمة محلية (حتى النص الحرفي
 * "undefined") كانت تُرسَل كـ `Bearer undefined` فيرفضها الخادم رغم أن الكوكي
 * السليم موجود — وهو ما كان يطرد المستخدم بعد أول 401.
 */
const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}> = []

function processQueue(error: unknown) {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error)
    } else {
      p.resolve(undefined)
    }
  })
  failedQueue = []
}

/** هدم الجلسة محلياً وإخراج المستخدم — يُستدعى عند فشل تجديد الكوكي. */
function endSession() {
  useAuthStore.getState().clearAuth()
  if (window.location.pathname.startsWith('/app')) {
    window.location.href = '/login'
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as import('axios').AxiosRequestConfig & {
      _retry?: boolean
    }

    // مسارات المصادقة نفسها لا تُجدَّد: 401 عليها يعني أن الجلسة انتهت فعلاً،
    // ولو حاولنا التجديد لأعدنا إرسال طلب دخول فاشل إلى ما لا نهاية.
    const isAuthEndpoint =
      typeof originalRequest?.url === 'string' &&
      /\/api\/Auth\/(login|refresh|verifyToken)/i.test(originalRequest.url)

    if (error.response?.status !== 401 || originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then(() => api(originalRequest))
        .catch((err) => Promise.reject(err))
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      // بلا جسم: الخادم يقرأ رمز التحديث من الكوكي (EmptyBodyBehavior.Allow)
      // — إرسال أي نص هنا يجعله يتجاهل الكوكي ويبحث عن قيمة وهمية في القاعدة.
      await axios.post(
        `${api.defaults.baseURL}/api/Auth/refresh`,
        null,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' },
        },
      )

      processQueue(null)

      return api(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError)
      endSession()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default api
