export const SALE_MARKUP = 0
export const TAX_AND_STAMP_RATE = 0.01
/** عمولة الشراء من عميل (نسبة من سعر الذهب تُخصم عند الشراء من عميل) — تطابق افتراضي الباك (Branch). */
export const BUY_FROM_CUSTOMER_COMMISSION = 0.015

export function amountToNumber(value: string): number {
  return Number(value) || 0
}

export function purchasePerGram(gold21Price: number, karat: number): number {
  if (karat <= 0) return gold21Price
  return (gold21Price * karat) / 21
}

export function salePerGram(gold21Price: number, karat: number): number {
  return purchasePerGram(gold21Price, karat) + SALE_MARKUP
}

export function buyPerGram(gold21Price: number, karat: number): number {
  return purchasePerGram(gold21Price, karat)
}

export interface CartLineMath {
  metal: number
  margin: number
  making: number
  taxAndStamp: number
  grams: number
  total: number
}

export interface PurchaseLineMath {
  metal: number
  making: number
  taxAndStamp: number
  commission: number
  total: number
}

/**
 * حساب سطر من فاتورة شراء:
 * - metal: سعر الذهب (الوزن × سعر الجرام حسب العيار)
 * - making: مصنعية المورد (مصنعية المورد/جم × الوزن)
 * - taxAndStamp: الدمغة والضريبة (نسبة من سعر الذهب، افتراضياً 1%) — تُستبعد عند الشراء من عميل
 * - commission: عمولة الشراء من عميل (نسبة × سعر الذهب) — تُخصم عند الشراء من عميل
 */
export function purchaseLineMath(
  gold21Price: number,
  karat: number,
  weight: number,
  quantity: number,
  supplierMaking: number,
  includeTax = true,
  commissionRate = 0,
  taxRate = TAX_AND_STAMP_RATE,
): PurchaseLineMath {
  const perGram = karat > 0 ? purchasePerGram(gold21Price, karat) : 0
  const metal = perGram * weight * quantity
  const making = supplierMaking * weight * quantity
  const taxAndStamp = includeTax ? metal * (taxRate > 0 ? taxRate : 0) : 0
  const commission = includeTax ? 0 : metal * (commissionRate > 0 ? commissionRate : 0)
  return { metal, making, taxAndStamp, commission, total: metal + making + taxAndStamp - commission }
}

/**
 * حساب سطر من فاتورة بيع:
 * - metal: سعر الذهب (الوزن × سعر الجرام اللحظي)
 * - taxAndStamp: الدمغة والضريبة مجتمعين (نسبة من سعر الذهب، افتراضياً 1%)
 * - making: المصنعية البيعية (مصنعية البيع × الوزن)
 */
export function cartLineMath(
  gold21Price: number,
  karat: number,
  grams: number,
  factory: number,
  taxRate = TAX_AND_STAMP_RATE,
): CartLineMath {
  const purchase = purchasePerGram(gold21Price, karat)
  const metal = purchase * grams
  const margin = SALE_MARKUP * grams
  const making = factory * grams
  const effectiveTaxRate = taxRate >= 0 ? taxRate : TAX_AND_STAMP_RATE
  const taxAndStamp = metal * effectiveTaxRate
  return {
    metal,
    margin,
    making,
    taxAndStamp,
    grams,
    total: Math.round(metal + margin + making + taxAndStamp),
  }
}