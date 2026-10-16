import { create } from 'zustand'

const STORAGE_KEY = 'goldmaster_sale_tax_rate'

interface TaxState {
  /** نسبة الدمغة والضريبة (مثلاً 0.01 تعني 1%، و 0.015 تعني 1.5%) */
  stampAndTaxRate: number
  setStampAndTaxRate: (rate: number) => void
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

export const useTaxStore = create<TaxState>((set) => ({
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
}))

/** تنسيق نسبة الضريبة كنسبة مئوية واضحة (مثال: "1%" أو "1.5%") */
export function formatTaxRatePercent(rate: number): string {
  const pct = rate * 100
  return `${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(2)}%`
}
