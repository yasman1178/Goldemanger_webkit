import { describe, expect, it } from 'vitest'

import {
  getBalanceType,
  getDebtStatus,
  getRemainingGrams,
  type Debt,
} from '../types'

function makeDebt(overrides: Partial<Debt> = {}): Debt {
  return {
    debtId: 1,
    amountOwed: 0,
    paidAmount: 0,
    dueDate: '2030-01-01',
    balanceType: 0,
    debtType: 0,
    ...overrides,
  }
}

/**
 * عمود AmountOwed كان يحفظ الجرام (decimal(18,2)) فيقصّ 1.235 إلى 1.24،
 * وواجهة العرض كانت تطبعه «جم». الآن القيمة بالجنيه والوزن في Grams
 * بمنازل ثلاث عشرية، فالمتبقي يُشتق بلا فقد.
 */
describe('getRemainingGrams', () => {
  it('يحسب المتبقي بالجرام من الجنيه المتبقي ÷ لقطة السعر', () => {
    const debt = makeDebt({
      balanceType: 1,
      grams: 5,
      pricePerGram: 5000,
      amountOwed: 25000,
      paidAmount: 10000,
    })

    expect(getRemainingGrams(debt)).toBe(3)
  })

  it('يحافظ على ثلاث منازل عشرية ولا يقرّب لـ decimal(18,2)', () => {
    const debt = makeDebt({
      balanceType: 1,
      grams: 1.235,
      pricePerGram: 5000,
      amountOwed: 6175,
      paidAmount: 0,
    })

    expect(getRemainingGrams(debt)).toBe(1.235)
  })

  it('يستخدم الوزن المتبقي المحسوب من الخلفية إن وُجد', () => {
    const debt = makeDebt({
      balanceType: 1,
      grams: 5,
      pricePerGram: 5000,
      amountOwed: 25000,
      paidAmount: 10000,
      remainingGrams: 2.5,
    })

    expect(getRemainingGrams(debt)).toBe(2.5)
  })

  it('لا يُرجع وزناً سالباً بعد السداد الكامل', () => {
    const debt = makeDebt({
      balanceType: 1,
      grams: 5,
      pricePerGram: 5000,
      amountOwed: 25000,
      paidAmount: 25000,
    })

    expect(getRemainingGrams(debt)).toBe(0)
  })

  it('يعيد صفراً للمديونية النقدية', () => {
    expect(
      getRemainingGrams(makeDebt({ amountOwed: 900, paidAmount: 100, pricePerGram: 5000 })),
    ).toBe(0)
  })

  it('يعيد الوزن كاملاً بلا لقطة سعر بدل NaN', () => {
    const debt = makeDebt({ balanceType: 1, grams: 2.5, pricePerGram: null, amountOwed: 100 })

    expect(getRemainingGrams(debt)).toBe(0)
  })
})

describe('getBalanceType', () => {
  it('يميّز الذهب عن النقد', () => {
    expect(getBalanceType(makeDebt({ balanceType: 1 }))).toBe('gold')
    expect(getBalanceType(makeDebt({ balanceType: 0 }))).toBe('cash')
  })
})

describe('getDebtStatus', () => {
  it('لا يصنّف مبلغاً نقدياً صغيراً كمدفوع', () => {
    // Math.round كان يصنّف 25,000.60 كمسدَّد رغم متبقٍّ 0.40 جنيه.
    const debt = makeDebt({ amountOwed: 25000.6, paidAmount: 25000.2, dueDate: '2030-01-01' })

    expect(getDebtStatus(debt)).not.toBe('paid')
    expect(getDebtStatus(debt)).toBe('partial')
  })

  it('يصنّف المسدَّد تماماً', () => {
    expect(getDebtStatus(makeDebt({ amountOwed: 500, paidAmount: 500 }))).toBe('paid')
  })

  it('يصنّف المسدَّد مع فارق كسور أقل من نصف قرش', () => {
    expect(getDebtStatus(makeDebt({ amountOwed: 500, paidAmount: 499.996 }))).toBe('paid')
  })

  it('يصنّف المتأخر حتى لو مسدَّد جزئياً', () => {
    expect(
      getDebtStatus(makeDebt({ amountOwed: 500, paidAmount: 100, dueDate: '2020-01-01' })),
    ).toBe('overdue')
  })

  it('يصنّف الجزئي وغير المدفوع', () => {
    expect(getDebtStatus(makeDebt({ amountOwed: 500, paidAmount: 100 }))).toBe('partial')
    expect(getDebtStatus(makeDebt({ amountOwed: 500, paidAmount: 0 }))).toBe('unpaid')
  })
})
