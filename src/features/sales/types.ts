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
  status?: number
}

export interface CreateSaleLine {
  productId: number
  quantity: number
  /**
   * وزن القطعة الفعلي بعد تعديل الوزن (جم) — يُرسل فقط عند خلافه عن وزن المنتج.
   * يخصّ الفاتورة وحدها؛ وزن المنتج/المخزون لا يتغيّر.
   */
  weight?: number
}

export interface CreateSalePayload {
  customerId: number
  saleDate: string
  discount: number
  totalAmount: number
  paidAmount: number
  amountOwed: number
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'hold'
  saleItems: CreateSaleLine[]
  branchId?: number | null
  saleId?: number
  isHold?: boolean
  // لا لقطة سعر هنا عن قصد: الخادم يربط الفاتورة باللقطة التي حُسبت عليها
  // فعلاً، وأي رقم ترسله الواجهة يُتجاهل — وإلا صار السجل يشير لسعر لم
  // تُحسب عليه الفاتورة.
}

export interface HeldSaleItem extends SaleItem {
  grams21?: number
}

/** فاتورة معلّقة (بيع محجوز) بتفاصيل القطع ومعادل عيار 21 والمديونية الذهبية. */
export interface HeldSale {
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
  saleItems: HeldSaleItem[]
  heldGrams: number
  heldDebtDescription?: string | null
}

export type HeldPaymentPayload = {
  paidAmount: number
  paymentMethod: Exclude<PaymentMethod, 'hold'>
}

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'hold'