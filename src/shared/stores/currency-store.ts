import { create } from 'zustand'
import type { Currency } from '@/shared/lib/utils'

interface CurrencyState {
  currency: Currency
  setCurrency: (currency: Currency) => void
}

/**
 * العملة الفاعلة للفرع الحالي (EGP أو SAR).
 * تُضبط عند تسجيل الدخول وعند تبديل الفرع، وتستهلكها صفحات العرض والتنسيق.
 */
export const useCurrencyStore = create<CurrencyState>((set) => ({
  currency: 'EGP',
  setCurrency: (currency) => set({ currency }),
}))