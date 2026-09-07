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
