/**
 * استخراج رسالة الخطأ الحقيقية من رد الخادم.
 * يغطي أشكال الردود الفعلية في الـ Backend:
 * - `{ message }` / `{ Message }` (التحقق اليدوي في الـ Controllers)
 * - مصفوفة `IdentityError[]` (`[{ code, description }]`)
 * - قاموس `ModelState` (`{ errors: { حقل: [...] } }`)
 * - نص خام أو `403` بلا جسم (Forbid) أو انقطاع الشبكة.
 */

interface IdentityItem {
  description?: string
  message?: string
  code?: string
}

function pickText(value: unknown): string | null {
  if (typeof value === 'string') {
    const text = value.trim()
    return text ? text : null
  }
  return null
}

function fromArray(items: unknown[]): string | null {
  const parts: string[] = []
  for (const item of items) {
    if (typeof item === 'string') {
      const text = pickText(item)
      if (text) parts.push(text)
      continue
    }
    if (item != null && typeof item === 'object') {
      const entry = item as IdentityItem
      const text = pickText(entry.description) ?? pickText(entry.message)
      if (text) {
        parts.push(text)
        continue
      }
      if (typeof entry.code === 'string' && entry.code.trim()) {
        parts.push(entry.code.trim())
      }
    }
  }
  return parts.length > 0 ? parts.join('؛ ') : null
}

function fromDictErrors(errors: Record<string, unknown>): string | null {
  const parts: string[] = []
  for (const value of Object.values(errors)) {
    if (typeof value === 'string') {
      const text = pickText(value)
      if (text) parts.push(text)
    } else if (Array.isArray(value)) {
      const text = fromArray(value)
      if (text) parts.push(text)
    }
  }
  return parts.length > 0 ? parts.join('؛ ') : null
}

function fromBody(data: unknown): string | null {
  if (data == null) return null
  const text = pickText(data)
  if (text) return text
  if (Array.isArray(data)) return fromArray(data)
  if (typeof data === 'object') {
    const body = data as Record<string, unknown>
    const direct =
      pickText(body['message']) ??
      pickText(body['Message']) ??
      pickText(body['title'])
    if (direct) return direct
    const errors = body['errors']
    if (Array.isArray(errors)) return fromArray(errors)
    if (errors != null && typeof errors === 'object') {
      return fromDictErrors(errors as Record<string, unknown>)
    }
    // قد يكون الجسم نفسه قاموس ModelState ({ "PhoneNumber": [...] })
    const dict = fromDictErrors(body)
    if (dict) return dict
  }
  return null
}

export function extractServerMessage(error: unknown, fallback: string): string {
  if (error != null && typeof error === 'object') {
    const response = (error as { response?: { data?: unknown; status?: number } })
      .response
    if (response) {
      const message = fromBody(response.data)
      if (message) return message
      if (response.status === 403) return 'غير مصرّح بهذا الإجراء (403)'
      if (response.status === 404) return 'العنصر غير موجود (404)'
      if (response.status != null && response.status >= 500) {
        return 'خطأ في الخادم — حاول مرة أخرى'
      }
      return fallback
    }
    const message = pickText((error as { message?: unknown }).message)
    if (message) return message
    return 'تعذّر الاتصال بالخادم — تحقق من الشبكة ثم أعد المحاولة'
  }
  return fallback
}
