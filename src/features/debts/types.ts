export interface Debt {
  debtId: number
  clientId?: number | null
  saleId?: number | null
  branchId?: number | null
  companyId?: number | null
  amountOwed: number
  paidAmount: number
  dueDate: string
  paymentDate?: string | null
  clientName?: string | null
  clientPhone?: string | null
  debtType?: number
  balanceType?: number
  description?: string | null
}

export type DebtType = 'debit' | 'credit'
export type BalanceValue = 'cash' | 'gold'

export function getDebtType(debt: Debt): DebtType {
  return debt.debtType === 1 ? 'credit' : 'debit'
}

export function getBalanceType(debt: Debt): BalanceValue {
  return debt.balanceType === 1 ? 'gold' : 'cash'
}

export const debtTypeLabels: Record<DebtType, string> = {
  debit: 'مدين (عليه للمحل)',
  credit: 'دائن (له رصيد لدى المحل)',
}

export const debtTypeShortLabels: Record<DebtType, string> = {
  debit: 'مدين',
  credit: 'دائن',
}

export const balanceTypeLabels: Record<BalanceValue, string> = {
  cash: 'نقدي',
  gold: 'ذهب',
}

export interface CreateDebtPayload {
  clientId?: number | null
  saleId?: number | null
  branchId?: number | null
  companyId?: number | null
  amountOwed: number
  paidAmount: number
  dueDate: string
  paymentDate?: string | null
  debtType?: DebtType
  balanceType?: BalanceValue
  description?: string | null
}

export interface UpdateDebtPayload extends CreateDebtPayload {
  debtId: number
}

export type DebtStatus = 'unpaid' | 'partial' | 'paid' | 'overdue'

export interface DebtClientSummary {
  clientId: number
  clientName?: string | null
  clientPhone?: string | null
  totalOwed: number
  totalPaid: number
  debitRemaining: number
  creditRemaining: number
  remaining: number
  invoiceCount: number
  dueDate: string
}

export function getDebtStatus(debt: Debt): DebtStatus {
  const remaining = debt.amountOwed - debt.paidAmount
  if (remaining <= 0) return 'paid'
  if (new Date(debt.dueDate) < new Date()) return 'overdue'
  if (debt.paidAmount > 0) return 'partial'
  return 'unpaid'
}

export const debtStatusLabels: Record<DebtStatus, string> = {
  unpaid: 'غير مدفوع',
  partial: 'جزئي',
  paid: 'مدفوع',
  overdue: 'متأخر',
}
