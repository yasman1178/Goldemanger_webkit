import api from '@/shared/lib/api'
import type {
  CreateExpensePayload,
  Expense,
  SalaryReport,
  UpdateExpensePayload,
} from './types'

export async function getExpenses(branchId?: number): Promise<Expense[]> {
  const { data } = await api.get<Expense[]>('/api/Expense/GetAllExpenses', {
    params: branchId ? { branchId } : undefined,
  })
  return data ?? []
}

export async function createExpense(payload: CreateExpensePayload): Promise<Expense> {
  const { data } = await api.post<Expense>('/api/Expense/AddExpense', payload)
  return data
}

export async function updateExpense(
  id: number,
  payload: UpdateExpensePayload,
): Promise<void> {
  await api.put(`/api/Expense/UpdateExpense/${id}`, payload)
}

export async function deleteExpense(id: number): Promise<void> {
  await api.delete(`/api/Expense/DeleteExpense/${id}`)
}

/**
 * كشف أجور الفترة. تاريخ النهاية شامل — يتحول إلى حدّ أعلى حصري في
 * ExpenseController.GetSalaries ليخدم فهرس (BranchId, ExpenseDate).
 */
export async function getSalaries(params: {
  startDate: string
  endDate: string
  branchId?: number
}): Promise<SalaryReport> {
  const { data } = await api.get<SalaryReport>('/api/Expense/GetSalaries', { params })
  return data
}