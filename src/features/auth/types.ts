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
  totalCash: number
  totalDebts: number
  totalExpenses: number
  totalSales: number
}

export interface LoginResponse {
  token: string
  refreshToken: string
  role: string
  message: string
  employeeDetails: EmployeeDetails
  branchDetails: BranchDetails
}

export interface LoginRequest {
  phoneNumber: string
  password: string
}
