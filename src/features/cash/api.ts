import axios from 'axios'
import api from '@/shared/lib/api'
import { PAGE_SIZE, type PaginatedResult } from '@/shared/lib/pagination'
import type { CashRecord } from '@/shared/types/api'

export async function getCashToday(branchId?: number): Promise<CashRecord[]> {
  try {
    const { data } = await api.get<CashRecord[]>('/api/Cash/GetCashDay', {
      params: branchId ? { branchId } : undefined,
    })
    return data ?? []
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return []
    }
    throw error
  }
}

export async function getCashFiltered(params: {
  date?: string
  transactionType?: number
  branchId?: number
}): Promise<CashRecord[]> {
  try {
    const { data } = await api.get<CashRecord[]>('/api/Cash/GetCashFiltered', {
      params,
    })
    return data ?? []
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return []
    }
    throw error
  }
}

export async function getCashFilteredPage(params: {
  date?: string
  transactionType?: number
  branchId?: number
  page: number
  pageSize?: number
}): Promise<PaginatedResult<CashRecord>> {
  const { data } = await api.get<PaginatedResult<CashRecord>>(
    '/api/Cash/GetCashFiltered',
    {
      params: {
        date: params.date || undefined,
        transactionType: params.transactionType ?? undefined,
        branchId: params.branchId ?? undefined,
        page: params.page,
        pageSize: params.pageSize ?? PAGE_SIZE,
      },
    },
  )
  return data
}

export async function getCurrentCash(branchId?: number): Promise<CashRecord | null> {
  try {
    const { data } = await api.get<CashRecord>('/api/Cash/GetCash', {
      params: branchId ? { branchId } : undefined,
    })
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null
    }
    throw error
  }
}

export async function getOpeningBalance(
  date?: string,
  branchId?: number,
): Promise<number> {
  try {
    const { data } = await api.get<number>('/api/Cash/GetOpeningBalance', {
      params: {
        ...(date ? { date } : {}),
        ...(branchId ? { branchId } : {}),
      },
    })
    return data ?? 0
  } catch {
    return 0
  }
}

export async function depositCash(
  amount: number,
  branchId?: number,
): Promise<{ cashId: number; amount: number }> {
  const { data } = await api.post<{ cashId: number; amount: number }>('/api/Cash/Deposit', {
    amount,
    branchId,
  })
  return data
}

export async function withdrawCash(
  amount: number,
  branchId?: number,
): Promise<{ cashId: number; amount: number }> {
  const { data } = await api.post<{ cashId: number; amount: number }>('/api/Cash/Withdraw', {
    amount,
    branchId,
  })
  return data
}