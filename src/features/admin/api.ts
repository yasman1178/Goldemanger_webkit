import api from '@/shared/lib/api'
import type {
  AdminAddBranchPayload,
  AdminAddEmployeePayload,
  AdminCompanyEmployees,
  AdminCompany,
  AdminOverview,
  AdminUpdateEmployeePayload,
  ExtendSubscriptionResult,
  SystemLogsResponse,
} from '@/features/admin/types'

export async function getCompanies(): Promise<AdminCompany[]> {
  const { data } = await api.get<AdminCompany[]>('/api/Admin/Companies')
  return data
}

export async function getOverview(): Promise<AdminOverview> {
  const { data } = await api.get<AdminOverview>('/api/Admin/Overview')
  return data
}

export async function getSystemLogs(top = 100): Promise<SystemLogsResponse> {
  const { data } = await api.get<SystemLogsResponse>('/api/Admin/Logs', { params: { top } })
  return data
}

export async function extendSubscription(
  companyId: number,
  days: number,
): Promise<ExtendSubscriptionResult> {
  const { data } = await api.put<ExtendSubscriptionResult>(
    `/api/Admin/Companies/${companyId}/ExtendSubscription`,
    { days },
  )
  return data
}

export async function updateCompanyStatus(
  companyId: number,
  isActive: boolean,
): Promise<{ companyId: number; isActive: boolean; message: string }> {
  const { data } = await api.put(`/api/Admin/Companies/${companyId}/Status`, { isActive })
  return data
}

export async function addBranch(
  companyId: number,
  payload: AdminAddBranchPayload,
): Promise<{ branchId: number; branchName: string }> {
  const { data } = await api.post(`/api/Admin/Companies/${companyId}/Branches`, payload)
  return data
}

export async function getCompanyEmployees(companyId: number): Promise<AdminCompanyEmployees> {
  const { data } = await api.get<AdminCompanyEmployees>(
    `/api/Admin/Companies/${companyId}/Employees`,
  )
  return data
}

export async function addCompanyEmployee(
  companyId: number,
  payload: AdminAddEmployeePayload,
): Promise<{ id: string; fullName: string; role: string }> {
  const { data } = await api.post(
    `/api/Admin/Companies/${companyId}/Employees`,
    payload,
  )
  return data
}

export async function addOwner(payload: AdminAddEmployeePayload): Promise<{
  id: string
  fullName: string
  role: string
}> {
  const { data } = await api.post('/api/Admin/Owners', payload)
  return data
}

export async function updateCompanyEmployee(
  companyId: number,
  empId: string,
  payload: AdminUpdateEmployeePayload,
): Promise<{ id: string; message: string }> {
  const { data } = await api.put(
    `/api/Admin/Companies/${companyId}/Employees/${empId}`,
    payload,
  )
  return data
}

export async function disableCompanyEmployee(
  companyId: number,
  empId: string,
): Promise<void> {
  await api.delete(`/api/Admin/Companies/${companyId}/Employees/${empId}`)
}