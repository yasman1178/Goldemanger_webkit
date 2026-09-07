import api from '@/shared/lib/api'
import type { CreateDebtPayload, Debt, DebtClientSummary, UpdateDebtPayload } from './types'

export async function getBranchDebts(branchId: number): Promise<Debt[]> {
  const { data } = await api.get(`/api/Debts/BranchGetDebts/${branchId}`)
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

export async function updateDebt(id: number, payload: UpdateDebtPayload): Promise<void> {
  await api.put(`/api/Debts/Update${id}`, payload)
}

export async function deleteDebt(id: number): Promise<void> {
  await api.delete(`/api/Debts/${id}`)
}
