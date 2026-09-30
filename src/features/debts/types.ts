export interface Debt {
  debtId: number
  clientId?: number | null
  saleId?: number | null
  /** فاتورة الشراء المرتبطة — مديونية الأمانة وفارق التبديل. */
  purchaseId?: number | null
  branchId?: number | null
  companyId?: number | null
  /** قيمة المديونية بالجنيه دائماً (حتى الذهبية — تُشتق من الوزن × لقطة السعر). */
  amountOwed: number
  paidAmount: number
  /** الوزن المسجَّل بالجرام (معادل عيار 21) — للمديونيات الذهبية فقط. */
  grams?: number | null
  /** لقطة سعر الجرام عند تسجيل المديونية — لا تتغيّر بتحديث الأسعار. */
  pricePerGram?: number | null
  /** الوزن المتبقي المحسوب من الخلفية (جديد). */
  remainingGrams?: number | null
  /** ذهب العميل المحتجز لدى المحل كأمانة. */
  isEntrustment?: boolean
  dueDate: string
  paymentDate?: string | null
  clientName?: string | null
  clientPhone?: string | null
  debtType?: number
  balanceType?: number
  description?: string | null
}

export type DebtType = 'debit' | 'credit'
export type BalanceValue = 'cash' | 'gold'

export function getDebtType(debt: Debt): DebtType {
  return debt.debtType === 1 ? 'credit' : 'debit'
}

export function getBalanceType(debt: Debt): BalanceValue {
  return debt.balanceType === 1 ? 'gold' : 'cash'
}

/**
 * الوزن المتبقي بالجرام. الخلفية تحسبه، ونحسبه محلياً كاحتياط للصفوف
 * القديمة أو قبل إعادة الجلب: (المتبقي بالجنيه ÷ لقطة السعر).
 */
export function getRemainingGrams(debt: Debt): number {
  if (getBalanceType(debt) !== 'gold') return 0
  if (debt.remainingGrams != null) return debt.remainingGrams
  const price = debt.pricePerGram ?? 0
  if (!price || debt.grams == null) return 0
  return Math.round(Math.max(0, debt.amountOwed - debt.paidAmount) / price * 1000) / 1000
}

/** الوزن المسجَّل (وليس المتبقي) — المديونية الذهبية تُعرض بوزنها الكامل. */
export function getDebtGrams(debt: Debt): number {
  return debt.grams ?? 0
}

export const debtTypeLabels: Record<DebtType, string> = {
  debit: 'مدين (عليه للمحل)',
  credit: 'دائن (له رصيد لدى المحل)',
}

export const debtTypeShortLabels: Record<DebtType, string> = {
  debit: 'مدين',
  credit: 'دائن',
}

export const balanceTypeLabels: Record<BalanceValue, string> = {
  cash: 'نقدي',
  gold: 'ذهب',
}

export interface CreateDebtPayload {
  clientId?: number | null
  saleId?: number | null
  purchaseId?: number | null
  branchId?: number | null
  companyId?: number | null
  /** قيمة المديونية بالجنيه. */
  amountOwed: number
  paidAmount: number
  /** الوزن بالجرام — مطلوب للمديونية الذهبية. */
  grams?: number | null
  /** لقطة سعر الجرام — تُحسب في الخلفية إن أُهملت. */
  pricePerGram?: number | null
  dueDate: string
  paymentDate?: string | null
  debtType?: DebtType
  balanceType?: BalanceValue
  description?: string | null
}

export interface UpdateDebtPayload extends CreateDebtPayload {
  debtId: number
}

/** طلب «رد ذهب» — Grams اختياري (ردّ كامل المتبقي إن أُهمل). */
export interface ReturnGoldPayload {
  grams?: number | null
  description?: string | null
}

/** نتيجة «رد ذهب» بعد الحفظ. */
export interface ReturnGoldResult {
  debtId: number
  saleId: number
  grams: number
  pricePerGram: number
  cashIn: number
  releasedValue: number
  margin: number
  remainingGrams: number
  cashBalance: number
}

export type DebtStatus = 'unpaid' | 'partial' | 'paid' | 'overdue'

export interface DebtClientSummary {
  clientId: number
  clientName?: string | null
  clientPhone?: string | null
  /** حقول نقدية صرفة — لم يعد يتسرّب إليها جرام. */
  totalOwed: number
  totalPaid: number
  debitRemaining: number
  creditRemaining: number
  remaining: number
  invoiceCount: number
  dueDate: string
  /** ذهب: الاتجاهان معاً بالجرام وبالجنيه. */
  goldDebitGrams: number
  goldCreditGrams: number
  goldTotalGrams: number
  goldDebitEgp: number
  goldCreditEgp: number
  /** أمانة لدي المحل (ذهب العميل المحتجز). */
  entrustmentGrams: number
  entrustmentEgp: number
  sellPrice: number
  buyPrice: number
}

export function getDebtStatus(debt: Debt): DebtStatus {
  // بلا تقريب صحيح: كان Math.round يصنّف ديوناً نقدية صغيرة كمسدَّدة.
  const remaining = debt.amountOwed - debt.paidAmount
  if (remaining <= 0.005) return 'paid'
  if (new Date(debt.dueDate) < new Date()) return 'overdue'
  if (debt.paidAmount > 0) return 'partial'
  return 'unpaid'
}

export const debtStatusLabels: Record<DebtStatus, string> = {
  unpaid: 'غير مدفوع',
  partial: 'جزئي',
  paid: 'مدفوع',
  overdue: 'متأخر',
}
