export interface SupplierCustomer {
  id: number
  name: string
  address?: string | null
  phone?: string | null
  idcard?: string | null
  contactNumber?: string | null
  companyId: number
}

export interface StorageLocation {
  id: number
  name: string
  branchId: number
  location?: string | null
}

export interface PriceUpdateGolde {
  priceUpdateGoldeId: number
  goldPriceId?: number | null
  newPrice: number
  employeeId?: string | null
  branchId: number
  updateDate: string
  isExpired?: boolean
}

export type TransactionType =
  | 'Sale'
  | 'Purchase'
  | 'Expense'
  | 'AmountOwed'
  | 'PurchaseUpdate'
  | 'PurchaseRefund'
  | 'Deposit'
  | 'EmployeeAdvance'
  | 'EmployeeRepayment'
  | 'DayClose'
  | 'Withdrawal'
  | 'CardSale'
  | 'TransferSale'

export interface CashRecord {
  cashId: number
  companyId?: number | null
  branchId?: number | null
  expenseId?: number | null
  saleId?: number | null
  purchaseId?: number | null
  amount: number
  transactionDate: string
  transactionType: TransactionType
  dueDate?: string | null
  amountOwed?: number | null
  paidAmount?: number | null
  paymentDate?: string | null
  description?: string | null
  userId?: string | null
  userName?: string | null
}

export const transactionLabels: Record<TransactionType, string> = {
  Sale: 'بيع',
  Purchase: 'شراء',
  Expense: 'مصروف',
  AmountOwed: 'مديونية',
  PurchaseUpdate: 'تعديل شراء',
  PurchaseRefund: 'استرداد شراء',
  Deposit: 'إيداع رصيد',
  EmployeeAdvance: 'سلفة موظف',
  EmployeeRepayment: 'سداد سلفة',
  DayClose: 'إغلاق يوم',
  Withdrawal: 'سحب رصيد',
  CardSale: 'بيع بالبطاقة',
  TransferSale: 'تحويل/محفظة إلكترونية',
}