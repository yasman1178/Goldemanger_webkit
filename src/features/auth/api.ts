import api from '@/shared/lib/api'
import type { LoginRequest, LoginResponse } from './types'

export async function loginRequest(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/api/Auth/login', payload)
  return data
}

export async function changeMyPassword(payload: {
  currentPassword: string
  newPassword: string
}): Promise<{ message?: string }> {
  const { data } = await api.put<{ message?: string }>('/api/Auth/changeMyPassword', payload)
  return data
}

/**
 * تسجيل خروج حقيقي: يمسح كوكيز HttpOnly على الخادم ويصفّر رمز التحديث.
 * مسح الحالة في الواجهة وحده لا يكفي بعد الانتقال للكوكيز — الكوكي يبقى
 * صالحاً ويعتمد كل طلبات API لو لم يُمسح من الخادم.
 */
export async function logoutRequest(): Promise<void> {
  await api.post('/api/Auth/logout')
}

/**
 * استعادة الجلسة عند الإقلاع: الحالة المحفوظة في localStorage تصف هوية
 * المستخدم فقط، والكوكي HttpOnly هو ما يثبت أن الجلسة حيّة. 200 ⇒ الكوكي
 * صالح فنُحدّث الحالة بأرقام الفروع والأرصدة الحديثة؛ 401 ⇒ الجلسة انتهت
 * فنمحوها قبل أن يفتح /app.
 */
export async function restoreSession(): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/api/Auth/verifyToken')
  return data
}
