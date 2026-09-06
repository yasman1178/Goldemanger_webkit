import axios from 'axios'
import api from '@/shared/lib/api'
import type { CreateProductPayload, Product, PublicProduct } from './types'

const base = '/api/Products'
const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? ''

/** جلب بيانات المنتج العامة — بدون interceptor بهدف تجنّب تحويل 401 إلى صفحة تسجيل الدخول. */
export async function getPublicProduct(
  productId: number,
): Promise<PublicProduct | null> {
  try {
    const { data } = await axios.get<PublicProduct>(
      `${API_BASE}${base}/public/${productId}`,
    )
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
}

export async function getProducts(branchId?: number): Promise<Product[]> {
  try {
    const { data } = await api.get<Product[]>(`${base}/GetAllProduct`, {
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

export async function createProduct(
  payload: CreateProductPayload,
): Promise<Product> {
  const { data } = await api.post<Product>(`${base}/AddProduct`, payload)
  return data
}

export async function updateProduct(
  id: number,
  payload: CreateProductPayload,
): Promise<Product> {
  const { data } = await api.put<Product>(`${base}/${id}`, payload)
  return data
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`${base}/${id}`)
}
