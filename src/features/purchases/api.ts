import axios from 'axios'
import api from '@/shared/lib/api'
import { compressPurchaseImage } from '@/shared/lib/imageCompress'
import type {
  ApiResponse,
  CompanyInfo,
  CreatePurchasePayload,
  Purchase,
} from './types'

const base = '/api/Purchases'

export async function getPurchases(branchId?: number): Promise<Purchase[]> {
  try {
    const { data } = await api.get<ApiResponse<Purchase[]>>(
      `${base}/GetAllPurchases`,
      { params: branchId ? { branchId } : undefined },
    )
    return data?.data ?? []
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return []
    }
    throw error
  }
}

export async function getPurchasesByPhone(
  phone: string,
  branchId?: number,
): Promise<Purchase[]> {
  try {
    const { data } = await api.get<ApiResponse<Purchase[]>>(
      `${base}/ByPhone`,
      { params: { phone, ...(branchId ? { branchId } : {}) } },
    )
    return data?.data ?? []
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return []
    }
    throw error
  }
}

export async function getPurchasesByDate(
  startDate: string,
  endDate: string,
  branchId?: number,
): Promise<Purchase[]> {
  try {
    const { data } = await api.get<ApiResponse<Purchase[]>>(
      `${base}/ByDate`,
      { params: { startDate, endDate, ...(branchId ? { branchId } : {}) } },
    )
    return data?.data ?? []
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return []
    }
    throw error
  }
}

export async function getPurchase(id: number): Promise<Purchase | null> {
  try {
    const { data } = await api.get<ApiResponse<Purchase>>(`${base}/GetPurchase/${id}`)
    return data?.data ?? null
  } catch {
    return null
  }
}

export async function createPurchase(
  payload: CreatePurchasePayload,
): Promise<Purchase> {
  const form = new FormData()
  form.append('BranchId', String(payload.branchId))
  form.append('SupplierId', String(payload.supplierId))
  form.append('TotalAmount', String(payload.totalAmount))
  form.append('IsInitialStock', String(payload.isInitialStock))

  payload.products.forEach((p, index) => {
    form.append(`ProductsDot[${index}].ProductName`, p.productName)
    form.append(`ProductsDot[${index}].Weight`, String(p.weight))
    form.append(`ProductsDot[${index}].Karat`, String(p.karat))
    form.append(`ProductsDot[${index}].Typegolde`, String(p.typegolde))
    form.append(`ProductsDot[${index}].Design`, '0')
    form.append(`ProductsDot[${index}].Quantity`, String(p.quantity))
    form.append(`ProductsDot[${index}].StorageId`, String(p.storageId))
    form.append(`ProductsDot[${index}].Factory`, String(p.factory))
    form.append(`ProductsDot[${index}].FactoryForSale`, String(p.factoryForSale))
    form.append(`ProductsDot[${index}].ProductType`, '')
    form.append(`ProductsDot[${index}].Notes`, '')
    form.append(`ProductsDot[${index}].ImageLink`, p.imageLink ?? '')
    form.append(`ProductsDot[${index}].IsActive`, 'true')
  })

  if (payload.invoiceImageFile) {
    form.append('invoiceImageFile', await compressPurchaseImage(payload.invoiceImageFile))
  }
  if (payload.idCardImageFile) {
    form.append('idCardImageFile', await compressPurchaseImage(payload.idCardImageFile))
  }

  const { data } = await api.post<ApiResponse<Purchase>>(
    `${base}/SavePurchaseAndProduct`,
    form,
    { headers: { 'Content-Type': undefined } },
  )
  return data.data
}

export interface PieceImageUploadResult {
  url: string
}

export async function uploadPieceImage(file: File): Promise<PieceImageUploadResult> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<PieceImageUploadResult>(
    '/api/Images/upload',
    form,
    { headers: { 'Content-Type': undefined } },
  )
  return data
}

export interface PurchaseDocumentDto {
  kind: string
  kindValue: number
  contentType: string
  sizeBytes: number
  width: number
  height: number
  dataUrl: string
}

export async function getPurchaseImages(
  id: number,
  branchId?: number,
): Promise<PurchaseDocumentDto[]> {
  try {
    const { data } = await api.get<ApiResponse<PurchaseDocumentDto[]>>(
      `${base}/${id}/Images`,
      { params: branchId ? { branchId } : undefined },
    )
    return data?.data ?? []
  } catch {
    return []
  }
}

export async function downloadPurchaseImagesPdf(id: number, branchId?: number): Promise<void> {
  const response = await api.get(`${base}/${id}/ImagesPdf`, {
    params: branchId ? { branchId } : undefined,
    responseType: 'blob',
  })
  const blob = new Blob([response.data], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `purchase-${id}-images.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

export async function getCompanyInfo(): Promise<CompanyInfo> {
  try {
    const { data } = await api.get<CompanyInfo>(`/api/Company/MyInfo`)
    return data ?? {}
  } catch {
    return {}
  }
}