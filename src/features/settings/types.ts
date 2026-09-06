export interface OnboardingStatus {
  completed: boolean
  completedAt?: string | null
  completedBy?: string | null
}

export interface StoreSummary {
  name?: string | null
  phone?: string | null
  city?: string | null
}

export interface StoreProfile {
  name?: string | null
  phone?: string | null
  location?: string | null
  city?: string | null
  station?: string | null
  commercialRegistrationNumber?: string | null
  taxCardNumber?: string | null
  logoPath?: string | null
  longitude?: number | null
  latitude?: number | null
}

export interface EmployeeSummary {
  id: string
  fullName?: string | null
  phone?: string | null
  email?: string | null
  roles: string[]
}

export interface BranchSummary {
  branchId: number
  branchName: string
  city?: string | null
  location?: string | null
  station?: string | null
  buyFromCustomerCommission?: number
  totalSales: number
  cash: number
  employees: EmployeeSummary[]
}

export interface Overview {
  companyId: number
  companyName?: string | null
  branches: BranchSummary[]
}

export interface EmployeeItem {
  id: string
  fullName?: string | null
  phone?: string | null
  email?: string | null
  cardNumber?: string | null
  branchId?: number | null
  roles: string[]
}

export interface KeyValueItem {
  key: string
  value?: string | null
  updatedByName?: string | null
  updatedAt?: string | null
}
