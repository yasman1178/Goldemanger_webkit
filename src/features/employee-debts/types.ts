export interface EmployeeDebt {
  employeeDebtId: number
  employeeId: string
  employeeName?: string | null
  branchId?: number | null
  companyId?: number | null
  amount: number
  paidAmount: number
  remaining: number
  notes?: string | null
  dueDate: string
  createdDate: string
  paymentDate?: string | null
}

export interface EmployeeOption {
  id: string
  fullName: string
  phone?: string | null
}

export interface CreateEmployeeDebtPayload {
  employeeId: string
  amount: number
  notes?: string
  dueDate: string
  branchId?: number | null
}

export interface PayEmployeeDebtPayload {
  amount: number
}

export type EmployeeDebtStatus = 'unpaid' | 'partial' | 'paid' | 'overdue'

export function getEmployeeDebtStatus(debt: EmployeeDebt): EmployeeDebtStatus {
  const remaining = debt.amount - debt.paidAmount
  if (remaining <= 0) return 'paid'
  if (new Date(debt.dueDate) < new Date()) return 'overdue'
  if (debt.paidAmount > 0) return 'partial'
  return 'unpaid'
}

export const employeeDebtStatusLabels: Record<EmployeeDebtStatus, string> = {
  unpaid: 'غير مسدد',
  partial: 'مسدد جزئياً',
  paid: 'مسدد',
  overdue: 'متأخر',
}