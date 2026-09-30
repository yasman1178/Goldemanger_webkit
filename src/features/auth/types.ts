export type Role = 'Responsible' | 'Owner' | 'Manager' | 'Sale'

export interface EmployeeDetails {
  employeeId: string
  employeeName: string
  roles: string
  phoneNumber: string
  companyName: string
  branchId: string
}

export interface BranchDetails {
  branchName: string
  country?: string
  currency?: string
  totalCash: number
  totalDebts: number
  totalExpenses: number
  totalSales: number
}

/**
 * لا `token`/`refreshToken` — الخادم يضعهما في كوكيز HttpOnly
 * (AppendAuthCookies) فلا يعودان في جسم الاستجابة أصلاً.
 */
export interface LoginResponse {
  role: string
  message: string
  employeeDetails: EmployeeDetails
  branchDetails: BranchDetails
}

export interface LoginRequest {
  phoneNumber: string
  password: string
}
