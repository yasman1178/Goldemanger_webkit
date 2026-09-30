import { describe, expect, it } from 'vitest'

import {
  EXPENSE_CATEGORY_OTHER,
  EXPENSE_CATEGORY_SALARY,
  canSubmitExpense,
  expenseCategories,
  expenseCategoryLabel,
} from './types'

describe('expenseCategoryLabel', () => {
  it('maps every declared category to its Arabic label', () => {
    for (const category of expenseCategories) {
      expect(expenseCategoryLabel(category.value)).toBe(category.label)
    }
  })

  it('keeps "أخرى" as the first (default) option and treats it as value 0', () => {
    expect(expenseCategories[0]).toEqual({
      value: EXPENSE_CATEGORY_OTHER,
      label: 'أخرى',
    })
  })

  it('falls back to "أخرى" for an unknown value', () => {
    // السيرفر قد يرسل رقماً لم يُعرَّف محلياً بعد إضافة تصنيف جديد.
    expect(expenseCategoryLabel(99)).toBe('أخرى')
  })
})

describe('canSubmitExpense', () => {
  const valid = {
    amount: 500,
    descraption: 'فاتورة كهرباء',
    category: EXPENSE_CATEGORY_OTHER,
    employeeId: '',
  }

  it('accepts a non-salary expense with no employee', () => {
    expect(canSubmitExpense(valid)).toBe(true)
  })

  it('rejects a zero or negative amount', () => {
    expect(canSubmitExpense({ ...valid, amount: 0 })).toBe(false)
    expect(canSubmitExpense({ ...valid, amount: -1 })).toBe(false)
  })

  it('rejects an empty or whitespace-only statement', () => {
    expect(canSubmitExpense({ ...valid, descraption: '' })).toBe(false)
    expect(canSubmitExpense({ ...valid, descraption: '   ' })).toBe(false)
  })

  it('rejects a salary expense with no employee selected', () => {
    expect(
      canSubmitExpense({ ...valid, category: EXPENSE_CATEGORY_SALARY }),
    ).toBe(false)
  })

  it('accepts a salary expense once an employee is chosen', () => {
    expect(
      canSubmitExpense({
        ...valid,
        category: EXPENSE_CATEGORY_SALARY,
        employeeId: 'a-guid',
      }),
    ).toBe(true)
  })

  it('accepts a non-salary expense even when a stale employee is still set', () => {
    // الموظف يُصفَّر على السيرفر لغير تصنيف الراتب، فلا يُعطَّل الحفظ هنا.
    expect(canSubmitExpense({ ...valid, employeeId: 'a-guid' })).toBe(true)
  })
})
