import axios from 'axios'
import api from '@/shared/lib/api'
import { PAGE_SIZE, type PaginatedResult } from '@/shared/lib/pagination'
import type { InventoryUnitRecord, InventoryUnitStatus, StockRecord } from './types'

const base = '/api/Stock'

/**
 * تطبيع الردود القادمة من الباك إلى مصفوفة دائماً.
 * السبب: عقد الاستجابة drift بين النسخ — نسخة تُعيد مصفوفة مباشرة `[...]` ونسخة
 * تُعيد غلاف `ApiResponse` بشكل `{ data: [...] }`. بدون هذا التحصين ينهار أي
 * مكوّن يستدعي `.filter` على الرد (شاشة بيضاء: units.filter is not a function).
 */
export function extractArray<T>(payload: unknown, endpoint: string): T[] {
  if (Array.isArray(payload)) return payload as T[]
  const inner = (payload as { data?: unknown } | null | undefined)?.data
  if (Array.isArray(inner)) return inner as T[]
  console.warn(`[inventory] ${endpoint} أعاد شكلاً غير متوقع — أُعيدت قائمة فارغة.`, payload)
  return []
}

export async function getStocks(branchId?: number): Promise<StockRecord[]> {
  try {
    const { data } = await api.get<unknown>(`${base}/GetAll`, {
      params: branchId ? { branchId } : undefined,
    })
    return extractArray<StockRecord>(data, `${base}/GetAll`)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return []
    }
    throw error
  }
}

export async function getInventoryUnits(branchId?: number): Promise<InventoryUnitRecord[]> {
  const { data } = await api.get<unknown>('/api/InventoryUnit/GetAll', {
    params: branchId ? { branchId } : undefined,
  })
  return extractArray<InventoryUnitRecord>(data, '/api/InventoryUnit/GetAll')
}

export async function getInventoryUnitsPage(params: {
  branchId?: number
  page: number
  pageSize?: number
  q?: string
  status?: InventoryUnitStatus | 'all'
  storageId?: number
}): Promise<PaginatedResult<InventoryUnitRecord>> {
  const { data } = await api.get<unknown>(
    '/api/InventoryUnit/GetAll',
    {
      params: {
        branchId: params.branchId ?? undefined,
        page: params.page,
        pageSize: params.pageSize ?? PAGE_SIZE,
        q: params.q || undefined,
        status: params.status === 'all' ? undefined : params.status,
        storageId: params.storageId,
      },
    },
  )
  return extractPage<InventoryUnitRecord>(data, '/api/InventoryUnit/GetAll?page')
}

/**
 * تطبيع الرد المرقّم: يقبل الصفحة مباشرة `{ data: [...], totalCount }`
 * أو مغلفة `ApiResponse` بشكل `{ data: { data: [...], totalCount } }`.
 */
export function extractPage<T>(payload: unknown, endpoint: string): PaginatedResult<T> {
  const outer = payload as { data?: unknown } | null | undefined
  const inner = outer?.data
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    return inner as PaginatedResult<T>
  }
  if (outer && typeof outer === 'object') {
    return payload as PaginatedResult<T>
  }
  console.warn(`[inventory] ${endpoint} أعاد شكلاً غير متوقع.`, payload)
  return { data: [], totalCount: 0, pageNumber: 1, pageSize: PAGE_SIZE } as PaginatedResult<T>
}

export interface TransferResult {
  inventoryUnitId: number
  inventoryNumber: string
  status: string
  storageId: number | null
  branchId: number
  productName?: string | null
}

export async function transferUnit(
  inventoryUnitId: number,
  storageId: number,
): Promise<TransferResult> {
  const { data } = await api.post<TransferResult>('/api/InventoryUnit/Transfer', {
    inventoryUnitId,
    storageId,
  })
  return data
}

export interface VerifyCountResult {
  unit: {
    inventoryUnitId: number
    inventoryNumber: string
    status: string
    storageId: number | null
    branchId: number
    productName?: string | null
  }
  found: boolean
  locationChanged: boolean
  actualLocation?: string | null
}

export async function verifyUnitCount(
  inventoryUnitId: number,
  found: boolean,
  storageId?: number,
): Promise<VerifyCountResult> {
  const { data } = await api.post<VerifyCountResult>(
    '/api/InventoryUnit/VerifyCount',
    { inventoryUnitId, found, storageId },
  )
  return data
}