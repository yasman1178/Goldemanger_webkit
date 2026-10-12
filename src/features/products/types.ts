export type Designgole = 0 | 1 | 2 | 3

export type Typegolde = 0 | 1 | 2 | 3 | 4

export const designLabels: Record<Designgole, string> = {
  0: 'كلاسيك',
  1: 'بسيط',
  2: 'مخرّز',
  3: 'مودرن',
}

export const typeLabels: Record<Typegolde, string> = {
  0: '',
  1: 'جديد',
  2: 'مجدّد',
  3: 'كسر',
  4: 'فضة',
}

export interface Product {
  productId: number
  productName: string
  productDescription: string
  productType: string
  size: number
  quantity: number
  factory: number
  factoryForSale: number
  tax: number
  weight: number
  karat: number
  design: number
  typegolde: number
  sku: string | null
  barcode: string | null
  isActive: boolean
  imageLink: string
  notes: string
  branchId: number
  storageId: number | null
  imageUrls: string[]
  primaryImageUrl: string | null
  images?: ProductImageRecord[]
  createdDate?: string
  ageDays?: number
}

export interface ProductImageRecord {
  productImageId: number
  imageUrl: string
  isPrimary: boolean
}

export interface PublicProduct {
  productId: number
  productName: string
  productDescription: string
  productType: string
  karat: number
  size: number
  quantity: number
  weight: number
  notes: string
  imageUrls: string[] | null
  primaryImageUrl: string | null
}

export interface CreateProductPayload {
  productName: string
  productDescription: string
  productType: string
  size: number
  factory: number
  factoryForSale: number
  weight: number
  karat: number
  design: number
  typegolde: number
  isActive: boolean
  imageLink: string
  notes: string
  branchId: number
  storageId: number | null
}
