import api from '@/shared/lib/api'
import { PAGE_SIZE, type PaginatedResult } from '@/shared/lib/pagination'
import type {
  CreateDebtPayload,
  Debt,
  DebtClientSummary,
  DebtStatus,
  ReturnGoldPayload,
  ReturnGoldResult,
  UpdateDebtPayload,
} from './types'

export async function getBranchDebts(branchId: number): Promise<Debt[]> {
  const { data } = await api.get(`/api/Debts/BranchGetDebts/${branchId}`)
  return data
}

export async function getBranchDebtsPage(params: {
  branchId: number
  page: number
  pageSize?: number
  q?: string
  status?: DebtStatus
}): Promise<PaginatedResult<Debt>> {
  const { data } = await api.get<PaginatedResult<Debt>>(
    `/api/Debts/BranchGetDebts/${params.branchId}`,
    {
      params: {
        page: params.page,
        pageSize: params.pageSize ?? PAGE_SIZE,
        q: params.q || undefined,
        status: params.status,
      },
    },
  )
  return data
}

export interface DebtBranchSummary {
  /** إجماليات نقدية بالجنيه فقط — لا يتسرّب إليها جرام. */
  total: number
  paid: number
  remaining: number
  overdue: number
  cashDebitRemaining: number
  cashCreditRemaining: number
  /** أرصدة الذهب بالجرام وبالجنيه. */
  goldDebitGrams: number
  goldCreditGrams: number
  goldDebitEgp: number
  goldCreditEgp: number
  goldTotalGrams: number
  /** أمانة لدي المحل. */
  entrustmentGrams: number
  entrustmentEgp: number
  sellPrice: number
  buyPrice: number
}

export async function getBranchDebtsSummary(branchId: number): Promise<DebtBranchSummary> {
  const { data } = await api.get<DebtBranchSummary>(`/api/Debts/BranchSummary/${branchId}`)
  return data
}

export async function getClientDebts(clientId: number): Promise<Debt[]> {
  const { data } = await api.get(`/api/Debts/ClientGetDebts/${clientId}`)
  return data
}

export async function getClientSummary(branchId: number): Promise<DebtClientSummary[]> {
  const { data } = await api.get(`/api/Debts/ClientSummary?branchId=${branchId}`)
  return data
}

export async function getDebtById(id: number): Promise<Debt> {
  const { data } = await api.get(`/api/Debts/GetId${id}`)
  return data
}

export async function createDebt(payload: CreateDebtPayload): Promise<Debt> {
  const { data } = await api.post('/api/Debts/CreateNew', payload)
  return data
}

export async function createCustomerDebt(payload: CreateDebtPayload): Promise<Debt> {
  const { data } = await api.post('/api/Debts/CustomerDebt', {
    branchId: payload.branchId ?? null,
    saleId: payload.saleId ?? null,
    purchaseId: payload.purchaseId ?? null,
    clientId: payload.clientId ?? null,
    companyId: payload.companyId ?? null,
    amountOwed: payload.amountOwed,
    paidAmount: payload.paidAmount,
    grams: payload.grams ?? null,
    pricePerGram: payload.pricePerGram ?? null,
    dueDate: payload.dueDate,
    paymentDate: payload.paymentDate ?? null,
    debtType: payload.debtType === 'credit' ? 1 : 0,
    balanceType: payload.balanceType === 'gold' ? 1 : 0,
    description: payload.description ?? null,
  })
  return data
}

export async function updateDebt(id: number, payload: UpdateDebtPayload): Promise<void> {
  await api.put(`/api/Debts/Update${id}`, payload)
}

/**
 * «رد ذهب»: العميل يشتري ذهب المحل نقداً. التسوية بسعر بيع اليوم
 * في الخلفية — لا نرسل سعراً لأن الخادم هو المرجع.
 */
export async function returnGold(id: number, payload: ReturnGoldPayload): Promise<ReturnGoldResult> {
  const { data } = await api.post<ReturnGoldResult>(`/api/Debts/ReturnGold/${id}`, {
    grams: payload.grams ?? null,
    description: payload.description ?? null,
  })
  return data
}

export async function deleteDebt(id: number): Promise<void> {
  await api.delete(`/api/Debts/${id}`)
}
