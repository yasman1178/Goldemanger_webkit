/**
 * تصنيفات المصروف — مطابقة لـ ExpenseCategory في GoldeManger.Core/Models/Expenses.cs.
 * القيم أرقام وليست نصوصاً حتى يبقى صنف الراتب قابلاً للفلترة في الاستعلام.
 */
export const EXPENSE_CATEGORY_OTHER = 0
export const EXPENSE_CATEGORY_SALARY = 1

export const expenseCategories: { value: number; label: string }[] = [
  { value: EXPENSE_CATEGORY_OTHER, label: 'أخرى' },
  { value: EXPENSE_CATEGORY_SALARY, label: 'راتب' },
  { value: 2, label: 'كهرباء ومياه' },
  { value: 3, label: 'إيجار المحل' },
  { value: 4, label: 'صيانة وإصلاحات' },
]

export function expenseCategoryLabel(value: number): string {
  return expenseCategories.find((c) => c.value === value)?.label ?? 'أخرى'
}

/**
 * هل يمكن حفظ المصروف؟ الراتب وحده يحتاج موظفاً.
 * يعكس شرط ExpenseController.ResolveSalaryEmployeeAsync على السيرفر،
 * كي لا يُرسل النموذج طلباً ناقصاً رحلة بلا فائدة.
 */
export function canSubmitExpense(input: {
  amount: number
  descraption: string
  category: number
  employeeId: string
}): boolean {
  if (!(input.amount > 0)) return false
  if (input.descraption.trim().length === 0) return false
  if (input.category === EXPENSE_CATEGORY_SALARY && input.employeeId.length === 0) {
    return false
  }
  return true
}

export interface Expense {
  expenseId: number
  branchId: number
  amount: number
  descraption: string
  expenseDate: string
  category: number
  employeeId: string | null
  employeeName: string | null
}

export interface CreateExpensePayload {
  amount: number
  descraption: string
  category: number
  employeeId?: string | null
  branchId?: number
}

export interface UpdateExpensePayload {
  expenseId: number
  amount: number
  descraption: string
  category: number
  employeeId?: string | null
}

/** سطر موظف واحد في كشف الأجور. */
export interface SalaryReportEmployee {
  employeeId: string | null
  employeeName: string
  paymentsCount: number
  totalAmount: number
}

export interface SalaryReport {
  startDate: string
  endDate: string
  totalAmount: number
  paymentsCount: number
  employeesCount: number
  employees: SalaryReportEmployee[]
}
