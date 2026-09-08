import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useCurrencyStore } from '@/shared/stores/currency-store'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const numberFormatter = new Intl.NumberFormat('ar-EG')

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return numberFormatter.format(value)
}

export type Currency = 'EGP' | 'SAR'

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EGP: 'ج.م',
  SAR: 'ر.س',
}

export function currencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency] ?? 'ج.م'
}

export function currencyFromCountry(country?: string): Currency {
  return country === 'SA' ? 'SAR' : 'EGP'
}

export function formatCurrency(
  value: number,
  currency: Currency = useCurrencyStore.getState().currency,
): string {
  return `${formatNumber(Math.round(value))} ${currencySymbol(currency)}`
}

export function formatEgp(value: number): string {
  return formatCurrency(value)
}
