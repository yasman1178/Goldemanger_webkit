import type { Product } from '@/features/products/types'
import type { PaymentMethod } from '@/features/sales/types'

export type { PaymentMethod }

export interface CartLine {
  key: number
  product: Product
  quantity: number
  /**
   * وزن القطعة الفعلي في الفاتورة (جم). يبدأ بوزن المنتج ويمكن تعديله يدوياً
   * بخطوة 0.01 جم — التعديل يخصّ الفاتورة ولا يغيّر وزن المنتج/المخزون.
   */
  weight: number
}

/** هل عُدّل وزن البند يدوياً عن وزن المنتج المسجَّل؟ */
export function isWeightAdjusted(line: CartLine): boolean {
  return line.weight !== line.product.weight
}

export interface CartTotals {
  grams: number
  metal: number
  margin: number
  making: number
  taxAndStamp: number
  beforeDiscount: number
  discount: number
  total: number
}

export function karatLabel(karat: number): string {
  return `${karat}K`
}