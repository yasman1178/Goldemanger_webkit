import api from '@/shared/lib/api'
import type {
  PriceUpdateGolde,
  StorageLocation,
  SupplierCustomer,
} from '@/shared/types/api'

export async function getCustomers(): Promise<SupplierCustomer[]> {
  const { data } = await api.get<SupplierCustomer[]>(
    '/api/SupplierAndCustomer/GetAllCustemor',
  )
  return data
}

export async function getSuppliers(): Promise<SupplierCustomer[]> {
  const { data } = await api.get<SupplierCustomer[]>(
    '/api/SupplierAndCustomer/GetAll',
  )
  return data
}

export async function getStorages(): Promise<StorageLocation[]> {
  const { data } = await api.get<StorageLocation[]>(
    '/api/Storage/GetStoragesByBranch',
  )
  return data
}

export async function createStorage(name: string): Promise<StorageLocation> {
  const { data } = await api.post<StorageLocation>('/api/Storage', {
    location: name,
  })
  return data
}

export async function createCustomer(input: {
  name: string
  phone?: string
  idcard: string
}): Promise<SupplierCustomer> {
  const { data } = await api.post<SupplierCustomer>('/api/SupplierAndCustomer', {
    name: input.name,
    phone: input.phone ?? '',
    idcard: input.idcard,
  })
  return data
}

export async function createSupplier(input: {
  name: string
  phone?: string
  address?: string
}): Promise<SupplierCustomer> {
  const { data } = await api.post<SupplierCustomer>(
    '/api/SupplierAndCustomer',
    {
      name: input.name,
      phone: input.phone ?? '',
      address: input.address ?? '',
    },
  )
  return data
}

export async function getLatestGoldPrice(): Promise<number | null> {
  const { data } = await api.get<PriceUpdateGolde[]>('/api/PriceUpdate/GetAll')
  const latest = data
    .filter((p) => p.priceUpdateGoldeId)
    .sort((a, b) => b.priceUpdateGoldeId - a.priceUpdateGoldeId)[0]
  return latest ? latest.newPrice : null
}

export interface LiveGoldPrice {
  gram24: number
  gram21: number
  gram18: number
  currency: string
  source: string
}

export async function fetchLiveGoldPrice(): Promise<LiveGoldPrice | null> {
  try {
    const { data } = await api.get<LiveGoldPrice>(`/api/GoldPrice/Live`)
    return data
  } catch {
    return null
  }
}

export async function saveGoldPrice(
  price: number,
  mode: 'create' | 'update',
): Promise<PriceUpdateGolde | null> {
  try {
    const request =
      mode === 'create'
        ? api.post<PriceUpdateGolde>(`/api/PriceUpdate/Create`, null, {
            params: { price },
          })
        : api.put<PriceUpdateGolde>(`/api/PriceUpdate/UpdatePrice`, null, {
            params: { price },
          })
    const { data } = await request
    return data
  } catch {
    return null
  }
}