import type { ReactNode } from 'react'

export function FormatEg({ value }: { value: number }) {
  const formatted = new Intl.NumberFormat('ar-EG').format(Math.round(value))
  return <>{formatted}</>
}

export function Eg({ children }: { children: ReactNode }) {
  return <>{children} ج.م</>
}