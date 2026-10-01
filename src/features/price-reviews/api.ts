import api from '@/shared/lib/api'
import { PAGE_SIZE, type PaginatedResult } from '@/shared/lib/pagination'
import type { PriceDeviation, PriceDeviationQuery } from './types'

const base = '/api/PriceDeviations'

export async function getPriceDeviations(
  params: PriceDeviationQuery,
): Promise<PaginatedResult<PriceDeviation>> {
  const { data } = await api.get<{
    data: PriceDeviation[]
    totalCount: number
    pageNumber: number
    pageSize: number
  }>(base, {
    params: {
      branchId: params.branchId ?? undefined,
      kind: params.kind || undefined,
      unacknowledgedOnly: params.unacknowledgedOnly || undefined,
      from: params.from || undefined,
      to: params.to || undefined,
      page: params.page,
      pageSize: params.pageSize ?? PAGE_SIZE,
    },
  })
  return {
    data: data?.data ?? [],
    totalCount: data?.totalCount ?? 0,
    pageNumber: data?.pageNumber ?? params.page,
    pageSize: data?.pageSize ?? params.pageSize ?? PAGE_SIZE,
  }
}

export async function acknowledgeDeviation(
  id: number,
  note?: string,
): Promise<void> {
  await api.post(`${base}/${id}/acknowledge`, { note: note?.trim() || null })
}
