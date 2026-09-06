import api from '@/shared/lib/api'
import type {
  CreateEmployeeDebtPayload,
  EmployeeDebt,
  EmployeeOption,
  PayEmployeeDebtPayload,
} from './types'

export async function getBranchEmployeeDebts(branchId?: number): Promise<EmployeeDebt[]> {
  const { data } = await api.get<EmployeeDebt[]>('/api/EmployeeDebt/GetAllBranchDebts', {
    params: branchId ? { branchId } : undefined,
  })
  return data ?? []
}

export async function getEmployees(branchId?: number): Promise<EmployeeOption[]> {
  const { data } = await api.get<EmployeeOption[]>('/api/EmployeeDebt/GetEmployees', {
    params: branchId ? { branchId } : undefined,
  })
  return data ?? []
}

export async function createEmployeeDebt(payload: CreateEmployeeDebtPayload): Promise<EmployeeDebt> {
  const { data } = await api.post<EmployeeDebt>('/api/EmployeeDebt/Create', payload)
  return data
}

export async function payEmployeeDebt(id: number, payload: PayEmployeeDebtPayload): Promise<EmployeeDebt> {
  const { data } = await api.put<EmployeeDebt>(`/api/EmployeeDebt/Pay/${id}`, payload)
  return data
}

export async function deleteEmployeeDebt(id: number): Promise<void> {
  await api.delete(`/api/EmployeeDebt/Delete/${id}`)
}