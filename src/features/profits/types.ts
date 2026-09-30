/**
 * كشف ربح المصنعية — يقابل FactoryProfitReportDto في
 * G:\Goldemanger_ui\GoldeManger.Core\Dor\FactoryProfitDto.cs
 *
 * تنبيه محاسبي: الأرقام ربح مصنعية فقط، أي «بدون تكلفة الذهب».
 * لا تُعرض هذه القيم كـ«صافي ربح» لأن تكلفة البضاعة المباعة غير محسوبة بعد.
 */

export interface FactoryProfitItemLine {
  productName: string
  quantity: number
  weight: number
  karat: number
  factory: number
  factoryForSale: number
  makingPerGram: number
  makingProfit: number
}

export interface FactoryProfitSaleLine {
  saleId: number
  date: string
  customerName: string
  totalAmount: number
  makingProfit: number
  items: FactoryProfitItemLine[]
}

export interface FactoryProfitDayLine {
  date: string
  salesCount: number
  pieces: number
  weight: number
  totalSales: number
  makingProfit: number
}

export interface FactoryProfitReport {
  startDate: string
  endDate: string
  branchName: string
  totalMakingProfit: number
  totalSales: number
  salesCount: number
  totalPieces: number
  totalWeight: number
  days: FactoryProfitDayLine[]
  sales: FactoryProfitSaleLine[]
}

/** مفتاح الاستعلام الموحّد — يُبطل عبر invalidateShopData بعد أي عملية بيع/شراء. */
export const factoryProfitQueryKey = 'factory-profit' as const
