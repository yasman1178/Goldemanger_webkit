export type PriceDeviationKind = 'Sale' | 'Purchase'

export interface PriceDeviation {
  id: number
  kind: PriceDeviationKind | string
  documentId: number | null
  actualAmount: number
  expectedAmount: number
  difference: number
  serverGold21: number | null
  clientGold21: number | null
  isAcknowledged: boolean
  userNote: string | null
  breakdownJson: string | null
  companyId: number | null
  branchId: number | null
  userId: string | null
  createdAt: string
}

export interface PriceDeviationQuery {
  branchId?: number
  kind?: '' | PriceDeviationKind
  unacknowledgedOnly?: boolean
  from?: string
  to?: string
  page: number
  pageSize?: number
}
