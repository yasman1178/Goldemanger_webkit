import api from '@/shared/lib/api'
import type { CreateExpensePayload, Expense, UpdateExpensePayload } from './types'

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