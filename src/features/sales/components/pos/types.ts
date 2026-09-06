import type { Product } from '@/features/products/types'

export interface CartLine {
  key: number
  product: Product
  quantity: number
}

export type PaymentMethod = 'cash' | 'card' | 'transfer'

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