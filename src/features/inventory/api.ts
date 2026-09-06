import axios from 'axios'
import api from '@/shared/lib/api'
import type { InventoryUnitRecord, StockRecord } from './types'

const base = '/api/Stock'

export async function getStocks(branchId?: number): Promise<StockRecord[]> {
  try {
    const { data } = await api.get<StockRecord[]>(`${base}/GetAll`, {
      params: branchId ? { branchId } : undefined,
    })
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return []
    }
    throw error
  }
}

export async function getInventoryUnits(branchId?: number): Promise<InventoryUnitRecord[]> {
  const { data } = await api.get<InventoryUnitRecord[]>('/api/InventoryUnit/GetAll', {
    params: branchId ? { branchId } : undefined,
  })
  return data
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