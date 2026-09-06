import { describe, expect, it } from 'vitest'
import { purchaseLineMath } from './gold'

describe('purchaseLineMath', () => {
  const GOLD21 = 30000

  it('شراء من مورد: يضيف الدمغة والضريبة (1%) على قيمة الذهب', () => {
    const m = purchaseLineMath(GOLD21, 21, 10, 2, 5, true)
    const metal = GOLD21 * 10 * 2
    expect(m.metal).toBe(metal)
    expect(m.making).toBe(5 * 10 * 2)
    expect(m.taxAndStamp).toBe(metal * 0.01)
    expect(m.total).toBe(metal + 100 + metal * 0.01)
  })

  it('شراء من عميل: يستبعد الدمغة والضريبة', () => {
    const withTax = purchaseLineMath(GOLD21, 21, 10, 1, 5, true)
    const withoutTax = purchaseLineMath(GOLD21, 21, 10, 1, 5, false)
    expect(withoutTax.taxAndStamp).toBe(0)
    expect(withoutTax.total).toBe(withTax.total - withTax.taxAndStamp)
  })

  it('المصنعية تُضاف بغض النظر عن الضريبة', () => {
    const m = purchaseLineMath(GOLD21, 18, 4, 3, 10, false)
    expect(m.making).toBe(10 * 4 * 3)
    expect(m.total).toBe(m.metal + m.making)
  })

  it('يعامل العيار غير الصالح كقيمة صفر بلا ضريبة', () => {
    const m = purchaseLineMath(GOLD21, 0, 5, 1, 0, true)
    expect(m.metal).toBe(0)
    expect(m.taxAndStamp).toBe(0)
  })

  it('شراء من عميل مع عمولة 1.5%: يخصم العمولة من قيمة الذهب', () => {
    const metal = GOLD21 * 10 * 1
    const m = purchaseLineMath(GOLD21, 21, 10, 1, 0, false, 0.015)
    expect(m.taxAndStamp).toBe(0)
    expect(m.commission).toBe(metal * 0.015)
    expect(m.total).toBe(metal - metal * 0.015)
  })

  it('العمولة لا تُطبق على فاتورة مورد (مع دمغة)', () => {
    const m = purchaseLineMath(GOLD21, 21, 10, 1, 0, true, 0.015)
    expect(m.commission).toBe(0)
  })
})