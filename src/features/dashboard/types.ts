export interface DayCloseSaleItem {
  saleId: number
  customerName: string | null
  totalAmount: number
  discount: number
  saleDate: string
  itemCount: number
}

export interface DayClosePurchaseItem {
  id: number
  supplierName: string | null
  totalAmount: number
  date: string
  pieceCount: number
}

export interface DayCloseExpenseItem {
  expenseId: number
  descraption: string | null
  amount: number
  expenseDate: string
}

export interface DayCloseSummary {
  date: string
  shopName: string
  branchName: string
  address: string
  commercialRegistration: string
  taxCard: string
  openingBalance: number
  closingBalance: number
  totalSales: number
  totalPurchases: number
  totalExpenses: number
  sales: DayCloseSaleItem[]
  purchases: DayClosePurchaseItem[]
  expenses: DayCloseExpenseItem[]
}
