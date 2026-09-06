import axios from 'axios'
import api from '@/shared/lib/api'
import type { CreateSalePayload, Sale } from './types'

const base = '/api/Sale'

export async function getSales(branchId?: number): Promise<Sale[]> {
  try {
    const { data } = await api.get<Sale[]>(`${base}/GetAllSales`, {
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

export interface SalePrintItem {
  saleItemId: number
  productId: number
  productName?: string | null
  quantity: number
  price: number
  weight: number
  karat: number
  factory: number
  typegolde?: number
}

export interface SalePayment {
  date: string
  amount: number
  type: 'sale' | 'debt'
}

export interface SalePrintData {
  saleId: number
  branchId: number | null
  customerId: number
  customerName?: string | null
  employeeId?: string | null
  employeeName?: string | null
  saleDate: string
  totalAmount: number
  discount: number
  priceUpdateGoldeId?: number | null
  gold21Price?: number
  saleItems: SalePrintItem[]
  paid: number
  amountOwed: number
  hasDebt: boolean
  payments: SalePayment[]
}

export async function getSaleForPrint(saleId: number): Promise<SalePrintData> {
  const { data } = await api.get<SalePrintData>(
    `${base}/GetSaleForPrint/${saleId}`,
  )
  return data
}

export async function createSale(payload: CreateSalePayload): Promise<Sale> {
  const { data } = await api.post<Sale>(`${base}/AddSale`, payload)
  return data
}