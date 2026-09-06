export interface Expense {
  expenseId: number
  branchId: number
  amount: number
  descraption: string
  expenseDate: string
}

export interface CreateExpensePayload {
  amount: number
  descraption: string
  branchId?: number
}

export interface UpdateExpensePayload {
  expenseId: number
  branchId: number
  amount: number
  descraption: string
}
