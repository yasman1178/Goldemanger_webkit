import type { Product } from '@/features/products/types'

export interface InventoryStorage {
  storageId: number
  location: string
  branchId: number
}

export interface StockPurchaseRef {
  id: number
  date: string | null
  totalAmount: number
}

export interface StockRecord {
  stockId: number
  quantity: number
  totalWeight: number
  date: string
  productId: number
  purchaseId: number
  storageId: number | null
  saleId: number | null
  branchId: number
  products: Product | null
  storage: InventoryStorage | null
  purchase: StockPurchaseRef | null
}

export type InventoryUnitStatus =
  | 'AVAILABLE'
  | 'SOLD'
  | 'RETURNED'
  | 'DAMAGED'
  | 'LOST'

export const inventoryUnitStatusLabels: Record<InventoryUnitStatus, string> = {
  AVAILABLE: 'متاح',
  SOLD: 'مباع',
  RETURNED: 'مرتجع',
  DAMAGED: 'تالف',
  LOST: 'مفقود',
}

export interface InventoryUnitRecord {
  inventoryUnitId: number
  inventoryNumber: string
  productId: number
  weight: number
  karat: number
  status: InventoryUnitStatus
  storageId: number | null
  branchId: number
  purchaseId: number | null
  saleId: number | null
  createdDate: string
  soldDate: string | null
  products: Product | null
  storage: InventoryStorage | null
  purchase: StockPurchaseRef | null
}