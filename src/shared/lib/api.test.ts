import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'

/**
 * انحدار «الطرد المفاجئ»: الخادم ينقل التوكن إلى كوكي HttpOnly ولا يعيده في
 * جسم الاستجابة، بينما الواجهة كانت ترسل `Authorization: Bearer undefined`
 * لأن الكوكي لا يُقرأ من localStorage. الخادم كان يرفض كل طلب رغم صحة
 * الجلسة، ثم يفشل التجديد بالقيمة الوهمية نفسها ⇒ `location = '/login'`.
 *
 * الاختبارات تثبت القاعدة الجديدة:
 *   1. لا ترويسة Authorization إطلاقاً مهما كانت بقايا localStorage.
 *   2. الاعتماد عبر withCredentials على الكوكي.
 *   3. التجديد بلا جسم فيقرأ من الكوكي، ثم يُعاد إرسال الطلب الأصلي.
 */
describe('api interceptors', () => {
  let api: typeof import('./api').default

  beforeEach(async () => {
    vi.resetModules()
    localStorage.clear()

    const { useAuthStore } = await import('@/shared/stores/auth-store')
    useAuthStore.setState({ isAuthenticated: false, user: null })
    vi.spyOn(useAuthStore.getState(), 'clearAuth').mockImplementation(() => undefined)

    const mod = await import('./api')
    api = mod.default
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends no Authorization header and relies on cookies', async () => {
    // بقايا تالفة عمداً: لا يجوز أن تتحول إلى ترويسة Bearer
    localStorage.setItem('access_token', 'undefined')
    localStorage.setItem('refresh_token', 'undefined')

    const adapter = vi.fn(async (config) => ({
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }))
    api.defaults.adapter = adapter as never

    await api.get('/api/Dashboard/Stats')

    expect(api.defaults.withCredentials).toBe(true)
    const sent = adapter.mock.calls[0][0] as unknown as { headers: Record<string, string> }
    expect(sent.headers.Authorization).toBeUndefined()
  })

  it('refreshes through the cookie with an empty body, then replays the request', async () => {
    let attempts = 0
    const adapter = vi.fn(async (config) => {
      attempts += 1
      // أول محاولة فقط تفشل بـ 401؛ إعادة الإرسال تُقبل
      if (attempts === 1) {
        const err = new Error('unauthorized') as Error & {
          response?: { status: number }
          config: unknown
        }
        err.response = { status: 401 }
        err.config = config
        throw err
      }
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
    })
    api.defaults.adapter = adapter as never

    const refreshSpy = vi.spyOn(axios, 'post').mockResolvedValue({ data: {} } as never)

    await expect(api.get('/api/Dashboard/Stats')).resolves.toBeDefined()

    expect(refreshSpy).toHaveBeenCalledTimes(1)
    const [url, body, config] = refreshSpy.mock.calls[0]
    expect(url).toContain('/api/Auth/refresh')
    // جسم فارغ: إرسال أي نص يجعل الخادم يتجاهل الكوكي ويبحث عن قيمة وهمية
    expect(body).toBeNull()
    expect(config).toMatchObject({ withCredentials: true })

    const urls = adapter.mock.calls.map((c) => (c[0] as { url: string }).url)
    expect(urls.filter((u) => u === '/api/Dashboard/Stats').length).toBe(2)
  })

  it('does not try to refresh when the failing call is itself an auth endpoint', async () => {
    const adapter = vi.fn(async (config) => {
      const err = new Error('unauthorized') as Error & {
        response?: { status: number }
        config: unknown
      }
      err.response = { status: 401 }
      err.config = config
      throw err
    })
    api.defaults.adapter = adapter as never
    const refreshSpy = vi.spyOn(axios, 'post').mockResolvedValue({ data: {} } as never)

    await expect(api.post('/api/Auth/login', { phoneNumber: '1', password: '2' })).rejects.toBeDefined()

    expect(refreshSpy).not.toHaveBeenCalled()
  })
})
