export interface PurchaseProduct {
  productId?: number
  productName: string
  productDescription?: string
  productType?: string
  size?: number
  quantity?: number
  factory?: number
  factoryForSale?: number
  tax?: number
  weight: number
  karat: number
  design?: number
  typegolde?: number
  imageLink?: string
  notes?: string
  storageId?: number | null
}

export interface Purchase {
  id: number
  userId?: string
  userName?: string | null
  branchId?: number | null
  totalAmount: number
  date: string
  quantity?: number | null
  purchasePrice?: number | null
  image?: string | null
  idCardImage?: string | null
  documentsCount?: number
  hasDocuments?: boolean
  supplierId?: number | null
  supplierName?: string | null
  supplierPhone?: string | null
  isActive: boolean
  goldPrice21AtPurchase?: number | null
  productsDot?: PurchaseProduct[]
}

export interface PurchaseLineDraft {
  key: number
  productName: string
  weight: string
  karat: string
  typegolde: string
  factory: string
  factoryForSale: string
  quantity: string
  committed?: boolean
  imageLink?: string
}

export interface CreatePurchasePayload {
  supplierId: number
  branchId: number
  totalAmount: number
  isInitialStock: boolean
  products: Array<{
    productName: string
    weight: number
    karat: number
    typegolde: number
    factory: number
    factoryForSale: number
    quantity: number
    storageId: number
    imageLink?: string
  }>
  invoiceImageFile?: File | null
  idCardImageFile?: File | null
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string | null
}

export interface CompanyInfo {
  name?: string | null
  location?: string | null
  city?: string | null
  station?: string | null
  commercialRegistrationNumber?: string | null
  taxCardNumber?: string | null
  logoPath?: string | null
  branchName?: string | null
}