export interface SaleItem {
  saleItemId: number
  productId: number
  productName?: string | null
  quantity: number
  price: number
  weight?: number
  karat?: number
  factory?: number
  typegolde?: number
}

export interface Sale {
  saleId: number
  branchId: number | null
  customerId: number
  customerName?: string | null
  employeeId?: string | null
  employeeName?: string | null
  saleDate: string
  totalAmount: number
  discount: number
  priceUpdateGoldeId?: number | null
  gold21Price?: number
  saleItems: SaleItem[]
}

export interface CreateSaleLine {
  productId: number
  quantity: number
}

export interface CreateSalePayload {
  customerId: number
  saleDate: string
  discount: number
  totalAmount: number
  paidAmount: number
  amountOwed: number
  paymentMethod?: 'cash' | 'card' | 'transfer'
  saleItems: CreateSaleLine[]
  branchId?: number | null
}