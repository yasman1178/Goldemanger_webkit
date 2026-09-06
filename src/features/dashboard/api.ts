import api from '@/shared/lib/api'
import type { DayCloseSummary } from './types'

export interface DashboardStats {
  totalSales: number
  totalCash: number
  totalDebts: number
  totalExpenses: number
}

export async function getDashboardStats(branchId?: number): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/api/Dashboard/Stats', {
    params: branchId ? { branchId } : undefined,
  })
  return data
}

export async function closeDay(): Promise<DayCloseSummary> {
  const { data } = await api.post<DayCloseSummary>('/api/Dashboard/CloseDay')
  return data
}