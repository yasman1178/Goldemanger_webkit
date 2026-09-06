import api from '@/shared/lib/api'
import type {
  BranchSummary,
  EmployeeItem,
  KeyValueItem,
  OnboardingStatus,
  Overview,
  StoreProfile,
  StoreSummary,
} from '@/features/settings/types'

export async function createInitialCompany(payload: {
  companyName: string
  branchName: string
  city?: string
  location?: string
  station?: string
}): Promise<{ companyId: number; branchId: number; isActive: boolean }> {
  const { data } = await api.post('/api/Company/CreateInitialCompany', payload)
  return data
}

export async function getOnboardingStatus(branchId?: number): Promise<OnboardingStatus> {
  const { data } = await api.get<OnboardingStatus>('/api/Settings/OnboardingStatus', {
    params: branchId ? { branchId } : undefined,
  })
  return data
}

export async function completeOnboarding(branchId: number): Promise<{ completed: boolean }> {
  const { data } = await api.post<{ completed: boolean }>(
    '/api/Settings/CompleteOnboarding',
    { branchId },
  )
  return data
}

export async function getStoreProfile(): Promise<StoreProfile> {
  const { data } = await api.get<StoreProfile>('/api/Settings/Store')
  return data
}

export async function getStoreSummary(): Promise<StoreSummary> {
  const { data } = await api.get<StoreSummary>('/api/Settings/StoreSummary')
  return data
}

export async function updateStoreProfile(
  payload: Partial<StoreProfile>,
): Promise<{ message?: string }> {
  const { data } = await api.put('/api/Settings/Store', payload)
  return data
}

export async function getOverview(): Promise<Overview> {
  const { data } = await api.get<Overview>('/api/Settings/Overview')
  return data
}

export async function addBranch(
  payload: {
    branchName: string
    citey?: string
    location?: string
    station?: string
    buyFromCustomerCommission?: number
  },
): Promise<BranchSummary> {
  const { data } = await api.post('/api/Settings/Branches', payload)
  return data
}

export async function updateBranch(
  id: number,
  payload: {
    branchName: string
    citey?: string
    location?: string
    station?: string
    buyFromCustomerCommission?: number
  },
): Promise<BranchSummary> {
  const { data } = await api.put(`/api/Settings/Branches/${id}`, payload)
  return data
}

export async function deleteBranch(id: number): Promise<void> {
  await api.delete(`/api/Settings/Branches/${id}`)
}

export async function getEmployees(): Promise<EmployeeItem[]> {
  const { data } = await api.get<EmployeeItem[]>('/api/Settings/Employees')
  return data
}

export async function addEmployee(payload: {
  fullName?: string
  email?: string
  phoneNumber?: string
  cardNumber?: string
  password?: string
  role?: string
  branchId?: number | null
}): Promise<{ id: string }> {
  const { data } = await api.post('/api/Settings/Employees', payload)
  return data
}

export async function updateEmployee(
  id: string,
  payload: {
    fullName?: string
    email?: string
    phoneNumber?: string
    cardNumber?: string
    branchId?: number | null
    password?: string
  },
): Promise<{ message?: string }> {
  const { data } = await api.put(`/api/Settings/Employees/${id}`, payload)
  return data
}

export async function updateEmployeeRoles(
  id: string,
  roles: string[],
): Promise<{ roles: string[] }> {
  const { data } = await api.put(`/api/Settings/Employees/${id}/roles`, roles)
  return data
}

export async function disableEmployee(id: string): Promise<void> {
  await api.delete(`/api/Settings/Employees/${id}`)
}

export async function getKeyValues(): Promise<KeyValueItem[]> {
  const { data } = await api.get<KeyValueItem[]>('/api/Settings/KeyValues')
  return data
}

export async function upsertKeyValue(payload: {
  key: string
  value?: string
}): Promise<{ key: string; value?: string }> {
  const { data } = await api.put('/api/Settings/KeyValues', payload)
  return data
}

