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

export async function createStorage(
  nameOrInput: string | { location: string; branchId?: number; name?: string },
  branchId?: number,
): Promise<StorageLocation> {
  const payload =
    typeof nameOrInput === 'string'
      ? {
          location: nameOrInput,
          name: nameOrInput,
          ...(branchId ? { branchId } : {}),
        }
      : {
          location: nameOrInput.location ?? nameOrInput.name ?? '',
          name: nameOrInput.name ?? nameOrInput.location ?? '',
          ...(nameOrInput.branchId ? { branchId: nameOrInput.branchId } : {}),
        }
  const { data } = await api.post<StorageLocation>('/api/Storage', payload)
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

/**
 * لقطة سعر الفرع كما يراها الخادم — المرجع الذي تُقارن عليه الفاتورة.
 *
 * الأهم هنا `priceUpdateGoldeId`: بدونه تُسجَّل الفاتورة بلا رابط بسعرها،
 * فلا يمكن إعادة حسابها ولا تتبّع أي تعديل على السعر لاحقاً.
 */
export interface GoldPriceSnapshot {
  priceUpdateGoldeId: number | null
  sell: number
  buy: number
  isManual: boolean
  updateDate: string | null
}

export async function getGoldPriceSnapshot(
  branchId?: number | null,
): Promise<GoldPriceSnapshot> {
  const { data } = await api.get<PriceUpdateGolde[]>('/api/PriceUpdate/GetAll', {
    params: branchId ? { branchId } : undefined,
  })

  const latest = (data ?? [])
    .filter((p) => p.priceUpdateGoldeId)
    .sort(
      (a, b) =>
        new Date(b.updateDate ?? 0).getTime() -
        new Date(a.updateDate ?? 0).getTime(),
    )[0]

  if (!latest) {
    return {
      priceUpdateGoldeId: null,
      sell: 0,
      buy: 0,
      isManual: false,
      updateDate: null,
    }
  }

  return {
    priceUpdateGoldeId: latest.priceUpdateGoldeId,
    sell: latest.newPrice ?? 0,
    buy: latest.buyPrice ?? latest.newPrice ?? 0,
    isManual: latest.isManual ?? false,
    updateDate: latest.updateDate ?? null,
  }
}

export interface LiveGoldPrice {
  gram24Sell: number
  gram24Buy?: number | null
  gram21Sell: number
  gram21Buy?: number | null
  gram18Sell: number
  gram18Buy?: number | null
  currency: string
  country: string
  source: string
}

export async function fetchLiveGoldPrice(
  country: 'eg' | 'sa' = 'eg',
): Promise<LiveGoldPrice | null> {
  try {
    const { data } = await api.get<LiveGoldPrice>(`/api/GoldPrice/Live`, {
      params: country && country !== 'eg' ? { country } : undefined,
    })
    return data
  } catch {
    return null
  }
}

/**
 * تسجيل سعر الذهب على الخادم: البيع والشراء في لقطة واحدة.
 *
 * كان الحفظ يقبل سعر البيع وحده عبر query parameter، فسعر الشراء لم يكن
 * يُحفظ إطلاقاً ويبقى في ذاكرة الجهاز. ولأن تدقيق الفاتورة صار يقارن بسعر
 * الخادم، فالprix الذي لا يُحفظ على الخادم لا يمكن الاعتماد عليه في أي حساب.
 *
 * لا نُخفي الخطأ: الفشل يُرمي للواجهة، وحالة «لا يوجد سعر محفوظ» (null) هي
 * النتيجة الصريحة الوحيدة.
 */
export async function saveGoldPrice(input: {
  sell: number
  buy?: number | null
  isManual?: boolean
  branchId?: number | null
}): Promise<PriceUpdateGolde> {
  const { data } = await api.post<PriceUpdateGolde>('/api/PriceUpdate/SetPrices', {
    sell: input.sell,
    buy: input.buy ?? input.sell,
    isManual: input.isManual ?? false,
    branchId: input.branchId ?? undefined,
  })
  return data
}