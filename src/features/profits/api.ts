import api from '@/shared/lib/api'
import type { FactoryProfitReport } from '@/features/profits/types'

export async function getFactoryProfit(params: {
  startDate: string
  endDate: string
  branchId?: number
}): Promise<FactoryProfitReport> {
  const { data } = await api.get<FactoryProfitReport>('/api/Profit/Factory', {
    params: {
      startDate: params.startDate,
      endDate: params.endDate,
      branchId: params.branchId,
    },
  })
  return data
}
