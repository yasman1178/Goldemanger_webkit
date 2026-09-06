import { describe, expect, it } from 'vitest'
import { extractServerMessage } from './serverError'

describe('extractServerMessage', () => {
  it('يقرأ message الصغيرة (تحقق الـ Backend)', () => {
    const error = { response: { status: 400, data: { message: 'الفرع غير صحيح' } } }
    expect(extractServerMessage(error, 'fallback')).toBe('الفرع غير صحيح')
  })

  it('يقرأ Message الكبيرة', () => {
    const error = { response: { status: 400, data: { Message: 'بيانات الاعتماد غير صحيحة.' } } }
    expect(extractServerMessage(error, 'fallback')).toBe('بيانات الاعتماد غير صحيحة.')
  })

  it('يجمع أوصاف IdentityError', () => {
    const error = {
      response: {
        status: 400,
        data: [
          { code: 'DuplicatePhone', description: 'رقم الهاتف مستخدم بالفعل' },
          { code: 'PasswordTooShort', description: 'كلمة المرور قصيرة' },
        ],
      },
    }
    expect(extractServerMessage(error, 'fallback')).toBe(
      'رقم الهاتف مستخدم بالفعل؛ كلمة المرور قصيرة',
    )
  })

  it('يفكك قاموس ModelState', () => {
    const error = {
      response: {
        status: 400,
        data: { errors: { PhoneNumber: ['رقم الهاتف غير صالح'], Email: ['a', 'b'] } },
      },
    }
    expect(extractServerMessage(error, 'fallback')).toBe(
      'رقم الهاتف غير صالح؛ a؛ b',
    )
  })

  it('يعرض النص الخام', () => {
    const error = { response: { status: 400, data: 'بيانات غير صالحة' } }
    expect(extractServerMessage(error, 'fallback')).toBe('بيانات غير صالحة')
  })

  it('يشرح 403 بلا جسم (Forbid)', () => {
    const error = { response: { status: 403, data: null } }
    expect(extractServerMessage(error, 'fallback')).toBe('غير مصرّح بهذا الإجراء (403)')
  })

  it('يميز انقطاع الشبكة عن الاحتياطي', () => {
    expect(extractServerMessage(new Error('Network Error'), 'fallback')).toBe(
      'Network Error',
    )
    expect(extractServerMessage({}, 'fallback')).toBe(
      'تعذّر الاتصال بالخادم — تحقق من الشبكة ثم أعد المحاولة',
    )
  })

  it('يعود للاحتياطي عند جسم فارغ', () => {
    expect(
      extractServerMessage({ response: { status: 400, data: {} } }, 'fallback'),
    ).toBe('fallback')
  })
})
