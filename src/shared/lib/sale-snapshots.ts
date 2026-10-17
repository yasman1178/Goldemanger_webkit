import api from '@/shared/lib/api'
import type { SalePrintData } from '@/features/sales/api'
import { purchasePerGram } from '@/shared/lib/gold'
import { useGoldStore } from '@/shared/stores/gold-store'

export interface SaleItemSnapshot {
  productId: number
  productName?: string | null
  quantity: number
  weight: number
  karat: number
  goldPerGram: number
  makingPerGram: number
  taxPerGram: number
  taxAmount: number
  lineTotal: number
}

export interface SaleSnapshot {
  saleId: number
  branchId?: number | null
  saleDate: string
  totalAmount: number
  discount: number
  gold21Price: number
  stampAndTaxRate: number
  karatMakingFees?: Record<number, number>
  items?: SaleItemSnapshot[]
  createdAt?: string
}

const LOCAL_SNAPSHOT_PREFIX = 'goldmaster_sale_snapshot_'

export function getSnapshotKey(saleId: number): string {
  return `sale_snapshot_${saleId}`
}

/**
 * حفظ لقطة الفاتورة محلياً وعلى خادم الباك إند عبر /api/Settings/KeyValues
 * لضمان عدم تغيير نسب ومعاملات الفاتورة أبداً عند تعديل إعدادات الفرع أو الشركة لاحقاً.
 */
export async function saveSaleSnapshot(snapshot: SaleSnapshot): Promise<void> {
  if (!snapshot.saleId || snapshot.saleId <= 0) return

  const key = getSnapshotKey(snapshot.saleId)
  const jsonStr = JSON.stringify(snapshot)

  // 1. حفظ فوري في التخزين المحلي كـ Cache سريع
  try {
    localStorage.setItem(`${LOCAL_SNAPSHOT_PREFIX}${snapshot.saleId}`, jsonStr)
  } catch {
    // ignore local storage errors
  }

  // 2. إرسال وتثبيت اللقطة التاريخية على خادم الباك إند
  try {
    await api.put('/api/Settings/KeyValues', {
      key,
      value: jsonStr,
    })
  } catch (err) {
    console.warn(`[sale-snapshots] تعذّر حفظ اللقطة على السيرفر للفاتورة #${snapshot.saleId}:`, err)
  }
}

/**
 * جلب لقطة الفاتورة: يفحص الذاكرة المحلية أولاً، ثم يستعلم من السيرفر.
 */
export async function getSaleSnapshot(
  saleId: number,
  serverKeyValues?: Array<{ key: string; value?: string | null }>,
): Promise<SaleSnapshot | null> {
  if (!saleId || saleId <= 0) return null

  const key = getSnapshotKey(saleId)

  // 1. فحص قائمة المفاتيح الواردة من السيرفر إذا وُجدت
  if (Array.isArray(serverKeyValues)) {
    const found = serverKeyValues.find((kv) => kv.key === key)
    if (found?.value) {
      try {
        const parsed = JSON.parse(found.value) as SaleSnapshot
        if (parsed && parsed.saleId === saleId) {
          // تحديث الكاش المحلي
          try {
            localStorage.setItem(`${LOCAL_SNAPSHOT_PREFIX}${saleId}`, found.value)
          } catch {
            // ignore
          }
          return parsed
        }
      } catch {
        // invalid JSON
      }
    }
  }

  // 2. فحص التخزين المحلي
  try {
    const localRaw = localStorage.getItem(`${LOCAL_SNAPSHOT_PREFIX}${saleId}`)
    if (localRaw) {
      const parsed = JSON.parse(localRaw) as SaleSnapshot
      if (parsed && parsed.saleId === saleId) {
        return parsed
      }
    }
  } catch {
    // ignore
  }

  // 3. محاولة جلب المفاتيح من السيرفر مباشرة
  try {
    const { data } = await api.get<Array<{ key: string; value?: string | null }>>(
      '/api/Settings/KeyValues',
    )
    if (Array.isArray(data)) {
      const found = data.find((kv) => kv.key === key)
      if (found?.value) {
        const parsed = JSON.parse(found.value) as SaleSnapshot
        if (parsed && parsed.saleId === saleId) {
          try {
            localStorage.setItem(`${LOCAL_SNAPSHOT_PREFIX}${saleId}`, found.value)
          } catch {
            // ignore
          }
          return parsed
        }
      }
    }
  } catch {
    // ignore server errors
  }

  return null
}

export const getSaleSnapshotFromServer = getSaleSnapshot
export const saveSaleSnapshotToServer = saveSaleSnapshot

/**
 * استنتاج لقطة تاريخية دقيقة للفواتير القديمة التي صدرت قبل تفعيل نظام اللقطات
 * بمطابقة الإجمالي المسجل على السيرفر مع سعر الذهب والوزن والمصنعية،
 * وحفظها فوراً على السيرفر لتثبيتها.
 */
export function deduceAndFreezeLegacySnapshot(
  data: SalePrintData,
  currentTaxRate = 0.01,
): SaleSnapshot {
  const items = data.saleItems ?? []
  let gold21 = data.gold21Price ?? 0
  if (!gold21 || gold21 <= 0) {
    const itemWithPrice = items.find((i) => i.price && i.price > 0)
    if (itemWithPrice) {
      gold21 = Math.round(itemWithPrice.price * (21 / (itemWithPrice.karat || 21)))
    } else {
      gold21 = useGoldStore.getState().gold21 || 0
    }
  }

  const goldSubtotal = items.reduce((sum, i) => {
    const grams = (i.weight ?? 0) * (i.quantity ?? 0)
    return sum + purchasePerGram(gold21, i.karat ?? 21) * grams
  }, 0)

  const makingSubtotal = items.reduce((sum, i) => {
    const grams = (i.weight ?? 0) * (i.quantity ?? 0)
    return sum + (i.factory ?? 0) * grams
  }, 0)

  const rounded = Math.round(data.totalAmount ?? 0)
  const discount = data.discount ?? 0
  const grossBeforeTax = goldSubtotal + makingSubtotal - discount

  // مطابقة النسبة التاريخية: فحص ما إذا كانت قريبة من 1% أو 1.5% أو النسبة المحتسبة
  let resolvedTaxRate = currentTaxRate > 0 ? currentTaxRate : 0.01
  if (goldSubtotal > 0) {
    const diff = rounded - Math.round(grossBeforeTax)
    if (diff > 1) {
      const exactRate = diff / goldSubtotal
      if (Math.abs(exactRate - 0.01) < 0.003) {
        resolvedTaxRate = 0.01
      } else if (Math.abs(exactRate - 0.015) < 0.003) {
        resolvedTaxRate = 0.015
      } else if (Math.abs(exactRate - 0.02) < 0.003) {
        resolvedTaxRate = 0.02
      } else if (Math.abs(exactRate - 0.005) < 0.002) {
        resolvedTaxRate = 0.005
      } else if (exactRate > 0) {
        resolvedTaxRate = Math.round(exactRate * 10000) / 10000
      }
    }
  }

  const snapshot: SaleSnapshot = {
    saleId: data.saleId,
    branchId: data.branchId,
    saleDate: data.saleDate,
    totalAmount: data.totalAmount,
    discount: data.discount,
    gold21Price: gold21,
    stampAndTaxRate: resolvedTaxRate,
    items: items.map((i) => {
      const grams = (i.weight ?? 0) * (i.quantity ?? 0)
      const goldPerGram = purchasePerGram(gold21, i.karat ?? 21)
      const makingPerGram = i.factory ?? 0
      const taxPerGram = goldPerGram * resolvedTaxRate
      const taxAmount = taxPerGram * grams
      const lineTotal = (goldPerGram + makingPerGram) * grams + taxAmount
      return {
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        weight: i.weight,
        karat: i.karat,
        goldPerGram,
        makingPerGram,
        taxPerGram,
        taxAmount,
        lineTotal,
      }
    }),
    createdAt: new Date().toISOString(),
  }

  // حفظها على السيرفر في الخلفية لتجميدها
  void saveSaleSnapshot(snapshot)

  return snapshot
}
