import { create } from 'zustand'

const STORAGE_KEY = 'goldmaster_sale_tax_rate'
const MAKING_FEES_STORAGE_KEY = 'goldmaster_karat_making_fees'

export const SALE_TAX_RATE_KEY = 'saleTaxAndStampRate'
export const KARAT_MAKING_KEYS = {
  14: 'branchMakingFee14',
  18: 'branchMakingFee18',
  21: 'branchMakingFee21',
  24: 'branchMakingFee24',
} as const

export interface KaratMakingFees {
  14: number
  18: number
  21: number
  24: number
}

const DEFAULT_MAKING_FEES: KaratMakingFees = {
  14: 0,
  18: 0,
  21: 0,
  24: 0,
}

interface TaxState {
  /** نسبة الدمغة والضريبة (مثلاً 0.01 تعني 1%، و 0.015 تعني 1.5%) */
  stampAndTaxRate: number
  setStampAndTaxRate: (rate: number) => void

  /** مصنعية الجرام لكل عيار (14، 18، 21، 24) محددة من إعدادات الفرع */
  karatMakingFees: KaratMakingFees
  setKaratMakingFee: (karat: 14 | 18 | 21 | 24, fee: number) => void
  setKaratMakingFees: (fees: Partial<KaratMakingFees>) => void
  getEffectiveMakingFee: (karat: number, productFee?: number) => number
}

function loadInitialTaxRate(): number {
  if (typeof window === 'undefined') return 0.01
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw != null) {
      const parsed = parseFloat(raw)
      if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 1) {
        return parsed
      }
    }
  } catch {
    // تجاهل أخطاء التخزين المحلي
  }
  return 0.01
}

function loadInitialMakingFees(): KaratMakingFees {
  if (typeof window === 'undefined') return { ...DEFAULT_MAKING_FEES }
  try {
    const raw = localStorage.getItem(MAKING_FEES_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        14: Number(parsed[14]) || 0,
        18: Number(parsed[18]) || 0,
        21: Number(parsed[21]) || 0,
        24: Number(parsed[24]) || 0,
      }
    }
  } catch {
    // تجاهل أخطاء التخزين المحلي
  }
  return { ...DEFAULT_MAKING_FEES }
}

export const useTaxStore = create<TaxState>((set, get) => ({
  stampAndTaxRate: loadInitialTaxRate(),
  setStampAndTaxRate: (rate: number) => {
    const safeRate = Math.max(0, Math.min(1, rate))
    try {
      localStorage.setItem(STORAGE_KEY, String(safeRate))
    } catch {
      // تجاهل أخطاء التخزين المحلي
    }
    set({ stampAndTaxRate: safeRate })
  },

  karatMakingFees: loadInitialMakingFees(),
  setKaratMakingFee: (karat, fee) => {
    const safeFee = Math.max(0, Number(fee) || 0)
    set((state) => {
      const next = { ...state.karatMakingFees, [karat]: safeFee }
      try {
        localStorage.setItem(MAKING_FEES_STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return { karatMakingFees: next }
    })
  },
  setKaratMakingFees: (fees) => {
    set((state) => {
      const next: KaratMakingFees = {
        14: fees[14] != null ? Math.max(0, Number(fees[14]) || 0) : state.karatMakingFees[14],
        18: fees[18] != null ? Math.max(0, Number(fees[18]) || 0) : state.karatMakingFees[18],
        21: fees[21] != null ? Math.max(0, Number(fees[21]) || 0) : state.karatMakingFees[21],
        24: fees[24] != null ? Math.max(0, Number(fees[24]) || 0) : state.karatMakingFees[24],
      }
      try {
        localStorage.setItem(MAKING_FEES_STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return { karatMakingFees: next }
    })
  },
  getEffectiveMakingFee: (karat, productFee) => {
    const fees = get().karatMakingFees
    const k = Math.round(karat)
    if (k in fees) {
      const branchFee = fees[k as 14 | 18 | 21 | 24]
      // إذا كانت مصنعية العيار محددة في الفرع يتم تطبيقها إلزامياً
      if (branchFee > 0) return branchFee
    }
    return productFee ?? 0
  },
}))

/** تنسيق نسبة الضريبة كنسبة مئوية واضحة (مثال: "1%" أو "1.5%") */
export function formatTaxRatePercent(rate: number): string {
  const pct = rate * 100
  return `${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(2)}%`
}
