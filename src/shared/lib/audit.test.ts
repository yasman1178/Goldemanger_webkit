import { describe, expect, it } from 'vitest'
import { auditPurchase, auditSale } from './audit'

/**
 * هذه الاختبارات هي عقد المطابقة مع الخادم:لو فشل أي منها فهو يعني أن
 * حساب الواجهة وحساب GoldeManger/Helpers/InvoiceAudit.cs قد ابتعدا أحدهما
 * عن الآخر. الحالة الأولى تحديداً هي التي كان التقريب فيها يولّد 2 ج.م
 * انحرافاً وهمياً على فاتورة سليمة تماماً.
 */

const COMMISSION = 0.015
const STAMP = 0.01

function saleLine(overrides: Partial<Parameters<typeof auditSale>[0]['lines'][number]> = {}) {
  return {
    productName: 'خاتم',
    karat: 21,
    weight: 1,
    quantity: 1,
    factory: 100,
    factoryForSale: 0,
    ...overrides,
  }
}

describe('auditPurchase', () => {
  it('يطابق حساب الخادم تماماً في الحالة المرجعية', () => {
    const lines = Array.from({ length: 4 }, () => ({
      productName: 'خاتم',
      karat: 21,
      weight: 1,
      quantity: 1,
      factory: 100,
    }))

    // metal 13800 + دمغة 138 + مصنعية 400
    const result = auditPurchase({
      lines,
      gold21: 3450,
      totalAmount: 14338,
      fromCustomer: false,
      commissionRate: COMMISSION,
      stampTaxRate: STAMP,
    })

    expect(result.expectedTotal).toBe(14338)
    expect(result.diff).toBe(0)
    expect(result.message).toBeNull()
  })

  it('لا يولّد انحرافاً عند تكرار الحالة في ثمانية أسطر', () => {
    const lines = Array.from({ length: 8 }, () => ({
      productName: 'خاتم',
      karat: 21,
      weight: 1,
      quantity: 1,
      factory: 100,
    }))

    const result = auditPurchase({
      lines,
      gold21: 3450,
      totalAmount: 28676,
      fromCustomer: false,
      commissionRate: COMMISSION,
      stampTaxRate: STAMP,
    })

    expect(result.diff).toBe(0)
  })

  it('يستبدل الدمغة بعمولة الخصم عند الشراء من عميل', () => {
    // 34500 ذهب + 500 مصنعية − 517.5 عمولة = 34482.5 ← الإجمالي يُقرَّب إلى 34483
    const result = auditPurchase({
      lines: [{ productName: 'سوار', karat: 21, weight: 10, quantity: 1, factory: 50 }],
      gold21: 3450,
      totalAmount: 34483,
      fromCustomer: true,
      commissionRate: COMMISSION,
      stampTaxRate: STAMP,
    })

    // الشراء من عميل يُلغي الدمغة (نتحقق أن includeTax=false فعلياً) ويخصم العمولة
    // بدلها. الاختبار السابق كان يمرّ لمجادلات عرضية لا لأن العمولة صُحّحت.
    expect(result.lines[0].taxAndStamp).toBe(0)
    expect(result.lines[0].commission).toBeCloseTo(517.5, 2)
    expect(result.expectedTotal).toBe(34483)
    expect(result.diff).toBe(0)
  })

  it('يتجاوز رصيد أول المدة بلا تدقيق', () => {
    const result = auditPurchase({
      lines: [{ productName: 'بند', karat: 21, weight: 5, quantity: 1, factory: 10 }],
      gold21: 3450,
      totalAmount: 0,
      fromCustomer: false,
      commissionRate: COMMISSION,
      stampTaxRate: STAMP,
      isInitialStock: true,
    })

    expect(result.diff).toBe(0)
    expect(result.message).toBeNull()
  })

  it('يرصد فرقاً ضمن العتبة ولا يرفضه', () => {
    const result = auditPurchase({
      lines: [{ productName: 'بند', karat: 21, weight: 1, quantity: 1, factory: 0 }],
      gold21: 3450,
      totalAmount: 3485,
      fromCustomer: false,
      commissionRate: COMMISSION,
      stampTaxRate: STAMP,
    })

    expect(Math.abs(result.diff)).toBeLessThanOrEqual(1)
    expect(result.message).toBeNull()
  })

  it('يرفض فرقاً يتجاوز العتبة مع سبب واضح', () => {
    const result = auditPurchase({
      lines: [{ productName: 'بند', karat: 21, weight: 1, quantity: 1, factory: 0 }],
      gold21: 3450,
      totalAmount: 3520,
      fromCustomer: false,
      commissionRate: COMMISSION,
      stampTaxRate: STAMP,
    })

    expect(result.message).toContain('35')
    expect(result.expectedTotal).toBe(3485)
  })
})

describe('auditSale', () => {
  it('يطابق حساب الخادم في الحالة المرجعية', () => {
    const result = auditSale({
      lines: [saleLine(), saleLine(), saleLine(), saleLine()],
      gold21: 3450,
      discount: 0,
      totalAmount: 14338,
    })

    // 4 × 3584.5 = 14338 — تقريب واحد على الإجمالي، لا 4 × 3585 = 14340.
    expect(result.expectedTotal).toBe(14338)
    expect(result.diff).toBe(0)
    expect(result.message).toBeNull()
  })

  it('لا ينشأ انحراف تراكمي بتكرار الأسطر', () => {
    const four = auditSale({
      lines: Array.from({ length: 4 }, () => saleLine()),
      gold21: 3450,
      discount: 0,
      totalAmount: 14338,
    })
    const eight = auditSale({
      lines: Array.from({ length: 8 }, () => saleLine()),
      gold21: 3450,
      discount: 0,
      totalAmount: 28676,
    })

    expect(four.diff).toBe(0)
    expect(eight.diff).toBe(0)
  })

  it('يقرّب الإجمالي مرة واحدة لا كل سطر', () => {
    const result = auditSale({
      lines: [saleLine()],
      gold21: 3450,
      discount: 0,
      totalAmount: 3585,
    })

    // 3450 + 34.5 دمغة + 100 مصنعية = 3584.5 ← 3585
    expect(result.expectedTotal).toBe(3585)
  })

  it('يستخدم مصنعية البيع إن وُجدت وإلا مصنعية الشراء', () => {
    const withSaleMaking = auditSale({
      lines: [saleLine({ factoryForSale: 150 })],
      gold21: 3450,
      discount: 0,
      totalAmount: 3635,
    })
    const withSupplierMaking = auditSale({
      lines: [saleLine({ factoryForSale: 0, factory: 150 })],
      gold21: 3450,
      discount: 0,
      totalAmount: 3635,
    })

    expect(withSaleMaking.expectedTotal).toBe(3635)
    expect(withSupplierMaking.expectedTotal).toBe(3635)
  })

  it('يحدّ الخصم بالمصنعية ولا يشارك سالباً', () => {
    const capped = auditSale({
      lines: [saleLine()],
      gold21: 3450,
      discount: 99999,
      totalAmount: 3485,
    })

    expect(capped.expectedTotal).toBe(3485)

    const negative = auditSale({
      lines: [saleLine()],
      gold21: 3450,
      discount: -500,
      totalAmount: 3585,
    })

    expect(negative.expectedTotal).toBe(3585)
  })

  it('يرصد انحرافاً ناتجاً عن سعر ذهب مختلف', () => {
    const result = auditSale({
      lines: [saleLine()],
      gold21: 3480,
      discount: 0,
      totalAmount: 3615,
    })

    expect(result.expectedTotal).toBe(3615)
    expect(result.diff).toBe(0)

    const tampered = auditSale({
      lines: [saleLine()],
      gold21: 3480,
      discount: 0,
      totalAmount: 4000,
    })

    expect(tampered.message).not.toBeNull()
    expect(tampered.expectedTotal).toBe(3615)
  })

  it('يضرب الوزن في الكمية', () => {
    // 2 جم × 3 قطع = 6 جم ← ذهب 20700 + دمغة 207 + مصنعية 600
    const result = auditSale({
      lines: [saleLine({ weight: 2, quantity: 3 })],
      gold21: 3450,
      discount: 0,
      totalAmount: 21507,
    })

    expect(result.lines[0].grams).toBe(6)
    expect(result.expectedTotal).toBe(21507)
    expect(result.diff).toBe(0)
  })
})