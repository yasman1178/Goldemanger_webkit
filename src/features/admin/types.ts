export interface AdminBranchInfo {
  branchId: number
  branchName: string
  city?: string | null
}

export interface AdminCompany {
  companyId: number
  name?: string | null
  city?: string | null
  phone?: string | null
  isActive: boolean
  branchCount: number
  branches: AdminBranchInfo[]
  latestExpiry?: string | null
  earliestExpiry?: string | null
  lastUpdate?: string | null
  employeeCount: number
}

export interface ExtendSubscriptionResult {
  message: string
  days: number
  newExpiries: Record<string, string>
}

export interface AdminAddBranchPayload {
  branchName: string
  city?: string
  location?: string
  station?: string
  buyFromCustomerCommission?: number
}

export interface DatabaseSizeInfo {
  databaseName?: string | null
  databaseSize?: string | null
  unallocatedSpace?: string | null
  reserved?: string | null
  dataSize?: string | null
  indexSize?: string | null
  unused?: string | null
  error?: string | null
}

export interface AdminOverview {
  generatedAt: string
  companiesCount: number
  branchesCount: number
  employeesCount: number
  productsCount: number
  totalSales: number
  totalCash: number
  totalDebts: number
  database?: DatabaseSizeInfo | null
}

export interface AdminEmployee {
  id: string
  fullName?: string | null
  phone?: string | null
  email?: string | null
  cardNumber?: string | null
  branchId?: number | null
  roles: string[]
  isActive?: boolean
}

export interface AdminCompanyEmployees {
  companyId: number
  companyName?: string | null
  employees: AdminEmployee[]
}

export interface AdminAddEmployeePayload {
  fullName?: string
  phoneNumber?: string
  email?: string
  cardNumber?: string
  password?: string
  role?: 'Owner' | 'Manager' | 'Sale' | 'Responsible'
  branchId?: number | null
}

export interface AdminUpdateEmployeePayload {
  fullName?: string
  phoneNumber?: string
  email?: string
  cardNumber?: string
  password?: string
  role?: 'Owner' | 'Manager' | 'Sale' | 'Responsible'
  branchId?: number | null
}

export interface SystemLogEntry {
  id: number
  timestamp: string
  level: 'Info' | 'Warning' | 'Error'
  source: string
  message: string
  companyId?: number | null
  branchId?: number | null
  userId?: string | null
  meta?: string | null
}

export interface SystemLogsResponse {
  generatedAt: string
  logs: SystemLogEntry[]
}