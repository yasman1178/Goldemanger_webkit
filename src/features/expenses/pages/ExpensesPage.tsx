import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Loader2,
  Plus,
  ReceiptText,
  Search,
  User,
  Trash2,
  Printer,
  TrendingDown,
  Wallet,
  HandCoins,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react'

import {
  createExpense,
  deleteExpense,
  getExpenses,
  getSalaries,
  updateExpense,
} from '@/features/expenses/api'
import {
  EXPENSE_CATEGORY_SALARY,
  canSubmitExpense,
  expenseCategories,
  expenseCategoryLabel,
  type CreateExpensePayload,
  type UpdateExpensePayload,
  type Expense,
} from '@/features/expenses/types'
import {
  createEmployeeDebt,
  getBranchEmployeeDebts,
  getEmployees,
  payEmployeeDebt,
  deleteEmployeeDebt,
} from '@/features/employee-debts/api'
import {
  getEmployeeDebtStatus,
  type EmployeeDebt,
  type EmployeeDebtStatus,
} from '@/features/employee-debts/types'
import { SalariesReport } from '@/features/expenses/components/SalariesReport'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { formatEgp } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { Card } from '@/shared/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Fab } from '@/shared/components/ui/fab'

type TabKey = 'expenses' | 'advances' | 'salaries' | 'ledger'

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

function formatDateShort(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'short',
  }).format(d)
}

const statusConfig: Record<
  EmployeeDebtStatus,
  { variant: 'default' | 'destructive' | 'secondary' | 'outline'; label: string; icon: typeof Wallet }
> = {
  unpaid: { variant: 'destructive', label: 'غير مسدد', icon: AlertTriangle },
  partial: { variant: 'outline', label: 'سداد جزئي', icon: Clock },
  paid: { variant: 'default', label: 'مسدد بالكامل', icon: CheckCircle2 },
  overdue: { variant: 'destructive', label: 'متأخر', icon: AlertTriangle },
}

const QUICK_EXPENSE_PRESETS = [
  'فاتورة كهرباء ومياه',
  'أدوات تغليف وعلب مجوهرات',
  'ضيافة وبوفيه العملاء',
  'أدوات ورشة وتنظيف الذهب',
  'دعاية وإعلانات سوشيال ميديا',
  'نثريات وصيانة المحل',
  'رسوم نقل وشحن بضاعة',
]

interface UnifiedLedgerItem {
  id: string
  date: string
  type: 'expense' | 'advance' | 'advance_repay' | 'salary'
  typeLabel: string
  title: string
  beneficiary?: string
  amount: number
  isOutflow: boolean
  tagVariant: 'destructive' | 'default' | 'secondary' | 'outline'
}

export function ExpensesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTab = (searchParams.get('tab') as TabKey) || 'expenses'

  const setTab = (tab: TabKey) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', tab)
      return next
    })
  }

  const queryClient = useQueryClient()
  const activeBranchId = useActiveBranchId()

  // ─── Dialogs state ─────────────────────────────────────────────
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseDesc, setExpenseDesc] = useState('')
  const [expenseCategory, setExpenseCategory] = useState<number>(0)
  const [expenseEmployeeId, setExpenseEmployeeId] = useState<string>('')

  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false)
  const [advanceEmployeeId, setAdvanceEmployeeId] = useState('')
  const [advanceAmount, setAdvanceAmount] = useState('')
  const [advanceNotes, setAdvanceNotes] = useState('')

  const [repaySheet, setRepaySheet] = useState<EmployeeDebt | null>(null)
  const [repayAmount, setRepayAmount] = useState('')

  // ─── Delete confirmation modal state (no window.confirm in iframe) ───
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'expense' | 'advance'
    id: number
    label: string
  } | null>(null)

  // ─── Filter states ─────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month')
  const [advanceStatusFilter, setAdvanceStatusFilter] = useState<string>('all')

  // ─── Queries ───────────────────────────────────────────────────
  const { data: expenses = [], isLoading: isExpensesLoading } = useQuery({
    queryKey: ['expenses', activeBranchId],
    queryFn: () => getExpenses(activeBranchId ?? undefined),
  })

  const { data: debts = [], isLoading: isDebtsLoading } = useQuery({
    queryKey: ['employee-debts', activeBranchId],
    queryFn: () => getBranchEmployeeDebts(activeBranchId ?? undefined),
  })

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', activeBranchId],
    queryFn: () => getEmployees(activeBranchId ?? undefined),
    staleTime: 5 * 60 * 1000,
  })

  // Quick salaries query for this month
  const monthRange = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    }
  }, [])

  const { data: salariesData } = useQuery({
    queryKey: ['salaries-summary', activeBranchId, monthRange.startDate, monthRange.endDate],
    queryFn: () =>
      getSalaries({
        startDate: monthRange.startDate,
        endDate: monthRange.endDate,
        branchId: activeBranchId ?? undefined,
      }),
    staleTime: 5 * 60 * 1000,
  })

  // ─── Mutations ─────────────────────────────────────────────────
  const addExpenseMutation = useMutation({
    mutationFn: (payload: CreateExpensePayload) => createExpense(payload),
    onSuccess: () => {
      toast.success('تم تسجيل المصروف في الخزينة بنجاح')
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['cash'] })
      closeExpenseDialog()
    },
    onError: () => toast.error('تعذّر تسجيل المصروف.'),
  })

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateExpensePayload }) =>
      updateExpense(id, payload),
    onSuccess: () => {
      toast.success('تم تعديل المصروف بنجاح')
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      closeExpenseDialog()
    },
    onError: () => toast.error('تعذّر تعديل المصروف.'),
  })

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: number) => deleteExpense(id),
    onSuccess: () => {
      toast.success('تم حذف المصروف بنجاح')
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['cash'] })
    },
    onError: () => toast.error('تعذّر حذف المصروف.'),
  })

  const addAdvanceMutation = useMutation({
    mutationFn: () =>
      createEmployeeDebt({
        employeeId: advanceEmployeeId,
        amount: Number(advanceAmount) || 0,
        notes: advanceNotes.trim() || undefined,
        dueDate: new Date().toISOString(),
        branchId: activeBranchId ?? undefined,
      }),
    onSuccess: () => {
      toast.success('تم تسجيل السلفة وخصمها من الخزينة بنجاح')
      queryClient.invalidateQueries({ queryKey: ['employee-debts'] })
      queryClient.invalidateQueries({ queryKey: ['cash'] })
      setAdvanceDialogOpen(false)
      setAdvanceEmployeeId('')
      setAdvanceAmount('')
      setAdvanceNotes('')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message ?? 'تعذّر تسجيل السلفة.')
    },
  })

  const payAdvanceMutation = useMutation({
    mutationFn: async () => {
      if (!repaySheet) return
      const val = Number(repayAmount) || 0
      const remaining = repaySheet.amount - repaySheet.paidAmount
      if (val <= 0 || val > remaining) {
        throw new Error('invalid amount')
      }
      await payEmployeeDebt(repaySheet.employeeDebtId, { amount: val })
    },
    onSuccess: () => {
      toast.success('تم تسجيل السداد وتوريد المبلغ للخزينة بنجاح')
      queryClient.invalidateQueries({ queryKey: ['employee-debts'] })
      queryClient.invalidateQueries({ queryKey: ['cash'] })
      setRepaySheet(null)
      setRepayAmount('')
    },
    onError: () => toast.error('قيمة السداد غير صالحة.'),
  })

  const deleteAdvanceMutation = useMutation({
    mutationFn: (id: number) => deleteEmployeeDebt(id),
    onSuccess: () => {
      toast.success('تم حذف السلفة')
      queryClient.invalidateQueries({ queryKey: ['employee-debts'] })
    },
    onError: () => toast.error('تعذّر حذف السلفة'),
  })

  // ─── Modal Helpers ─────────────────────────────────────────────
  function openAddExpense() {
    setEditingExpense(null)
    setExpenseAmount('')
    setExpenseDesc('')
    setExpenseCategory(0)
    setExpenseEmployeeId('')
    setExpenseDialogOpen(true)
  }

  function openEditExpense(exp: Expense) {
    setEditingExpense(exp)
    setExpenseAmount(String(exp.amount))
    setExpenseDesc(exp.descraption)
    setExpenseCategory(exp.category)
    setExpenseEmployeeId(exp.employeeId ?? '')
    setExpenseDialogOpen(true)
  }

  function closeExpenseDialog() {
    setExpenseDialogOpen(false)
    setEditingExpense(null)
    setExpenseAmount('')
    setExpenseDesc('')
    setExpenseCategory(0)
    setExpenseEmployeeId('')
  }

  function submitExpense() {
    const num = Number(expenseAmount) || 0
    const empId = expenseCategory === EXPENSE_CATEGORY_SALARY ? expenseEmployeeId : ''
    if (
      !canSubmitExpense({
        amount: num,
        descraption: expenseDesc.trim(),
        category: expenseCategory,
        employeeId: empId,
      })
    ) {
      toast.error('يرجى استيفاء بيانات المصروف والمبلغ بشكل صحيح.')
      return
    }
    if (editingExpense) {
      updateExpenseMutation.mutate({
        id: editingExpense.expenseId,
        payload: {
          expenseId: editingExpense.expenseId,
          amount: num,
          descraption: expenseDesc.trim(),
          category: expenseCategory,
          employeeId: empId || null,
        },
      })
    } else {
      addExpenseMutation.mutate({
        amount: num,
        descraption: expenseDesc.trim(),
        category: expenseCategory,
        employeeId: empId || undefined,
        branchId: activeBranchId ?? undefined,
      })
    }
  }

  // ─── Filtered Data ─────────────────────────────────────────────
  const { todayStr, currentYear, currentMonth, weekAgoMs } = useMemo(() => {
    const d = new Date()
    return {
      todayStr: d.toISOString().split('T')[0],
      currentYear: d.getFullYear(),
      currentMonth: d.getMonth(),
      weekAgoMs: d.getTime() - 7 * 86400000,
    }
  }, [])

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (selectedCategory !== 'all' && String(e.category) !== selectedCategory) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase()
        const matchDesc = e.descraption?.toLowerCase().includes(q)
        const matchEmp = e.employeeName?.toLowerCase().includes(q)
        if (!matchDesc && !matchEmp) return false
      }
      if (selectedPeriod === 'today') {
        return e.expenseDate?.startsWith(todayStr)
      }
      if (selectedPeriod === 'week') {
        const itemDate = new Date(e.expenseDate).getTime()
        return itemDate >= weekAgoMs
      }
      if (selectedPeriod === 'month') {
        const itemDate = new Date(e.expenseDate)
        return (
          itemDate.getFullYear() === currentYear &&
          itemDate.getMonth() === currentMonth
        )
      }
      return true
    })
  }, [expenses, selectedCategory, searchQuery, selectedPeriod, todayStr, weekAgoMs, currentYear, currentMonth])

  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      const status = getEmployeeDebtStatus(d)
      if (advanceStatusFilter !== 'all' && status !== advanceStatusFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase()
        const matchEmp = d.employeeName?.toLowerCase().includes(q)
        const matchNotes = d.notes?.toLowerCase().includes(q)
        if (!matchEmp && !matchNotes) return false
      }
      return true
    })
  }, [debts, advanceStatusFilter, searchQuery])

  // ─── Executive Summary KPI ──────────────────────────────────────
  const kpis = useMemo(() => {
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
    const todayExpenses = expenses
      .filter((e) => e.expenseDate?.startsWith(todayStr))
      .reduce((s, e) => s + e.amount, 0)

    const totalAdvances = debts.reduce((s, d) => s + d.amount, 0)
    const paidAdvances = debts.reduce((s, d) => s + d.paidAmount, 0)
    const remainingAdvances = debts.reduce((s, d) => s + d.remaining, 0)

    const totalSalaries = salariesData?.totalAmount ?? 0

    // Net Outflow: All operational expenses + given advances (not yet repaid) + salaries paid
    const netOutflow = totalExpenses + (totalAdvances - paidAdvances)

    return {
      totalExpenses,
      todayExpenses,
      totalAdvances,
      paidAdvances,
      remainingAdvances,
      totalSalaries,
      netOutflow,
    }
  }, [expenses, debts, salariesData, todayStr])

  // ─── Unified Financial Ledger Stream ───────────────────────────
  const unifiedLedger = useMemo<UnifiedLedgerItem[]>(() => {
    const items: UnifiedLedgerItem[] = []

    // 1. Operational expenses
    for (const exp of expenses) {
      const isSal = exp.category === EXPENSE_CATEGORY_SALARY
      items.push({
        id: `exp-${exp.expenseId}`,
        date: exp.expenseDate,
        type: isSal ? 'salary' : 'expense',
        typeLabel: isSal ? 'راتب موظف' : expenseCategoryLabel(exp.category),
        title: exp.descraption,
        beneficiary: exp.employeeName ?? undefined,
        amount: exp.amount,
        isOutflow: true,
        tagVariant: isSal ? 'default' : 'destructive',
      })
    }

    // 2. Advances given
    for (const d of debts) {
      items.push({
        id: `debt-${d.employeeDebtId}`,
        date: d.createdDate,
        type: 'advance',
        typeLabel: 'سلفة موظف',
        title: d.notes || `سلفة مسجلة لـ ${d.employeeName ?? 'موظف'}`,
        beneficiary: d.employeeName ?? 'موظف',
        amount: d.amount,
        isOutflow: true,
        tagVariant: 'outline',
      })

      // If debt was partially or fully paid, record repayments as inflows/credits
      if (d.paidAmount > 0) {
        items.push({
          id: `debt-pay-${d.employeeDebtId}`,
          date: d.createdDate, // approximate
          type: 'advance_repay',
          typeLabel: 'سداد سلفة',
          title: `سداد سلفة من ${d.employeeName ?? 'الموظف'}`,
          beneficiary: d.employeeName ?? 'موظف',
          amount: d.paidAmount,
          isOutflow: false,
          tagVariant: 'default',
        })
      }
    }

    // Sort descending by date
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [expenses, debts])

  const canSaveAdvance = !!advanceEmployeeId && Number(advanceAmount) > 0

  return (
    <div className="space-y-6 pb-24">
      {/* ─── Page Header with Actions ───────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[28px] sm:text-[34px] font-bold leading-tight text-foreground tracking-tight">
              المصروفات والسلف والأجور
            </h1>
            <Badge variant="outline" className="hidden sm:inline-flex border-primary/20 bg-primary/5 text-primary text-[12px] font-bold px-2.5 py-0.5 rounded-full">
              مركز النفقات الموحد
            </Badge>
          </div>
          <p className="text-[14px] text-muted-foreground mt-1">
            إدارة النفقات التشغيلية وسلف الموظفين وكشوفات الرواتب وحركة الخزينة
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={openAddExpense}
            className="h-11 rounded-full px-5 text-[13px] font-bold gap-2 touch-target shadow-xs"
          >
            <Plus className="size-4" />
            <span>تسجيل مصروف</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setAdvanceDialogOpen(true)}
            className="h-11 rounded-full px-5 text-[13px] font-bold gap-2 touch-target border-warning/40 bg-warning/5 text-warning-foreground hover:bg-warning/10"
          >
            <HandCoins className="size-4 text-warning" />
            <span>تسجيل سلفة</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setTab('salaries')}
            className="h-11 rounded-full px-5 text-[13px] font-bold gap-2 touch-target"
          >
            <Wallet className="size-4 text-primary" />
            <span>كشف الأجور</span>
          </Button>
        </div>
      </div>

      {/* ─── Executive 5-Column KPI Dashboard ───────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* 1. المصروفات التشغيلية */}
        <Card className="rounded-[14px] elevation-card border-black/5 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[13px] font-semibold text-muted-foreground">
            <span>إجمالي المصروفات</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <TrendingDown className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="tabular-nums text-[22px] sm:text-[24px] font-bold leading-none text-destructive">
              {formatEgp(kpis.totalExpenses)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>اليوم: {formatEgp(kpis.todayExpenses)}</span>
              <span>{expenses.length} حركة</span>
            </div>
          </div>
        </Card>

        {/* 2. سلف الموظفين القائمة */}
        <Card className="rounded-[14px] elevation-card border-black/5 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[13px] font-semibold text-muted-foreground">
            <span>سلف قائمة (متبقية)</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-warning/15 text-warning">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="tabular-nums text-[22px] sm:text-[24px] font-bold leading-none text-warning">
              {formatEgp(kpis.remainingAdvances)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>إجمالي السلف: {formatEgp(kpis.totalAdvances)}</span>
              <span>{debts.length} سلفة</span>
            </div>
          </div>
        </Card>

        {/* 3. المسدد من السلف */}
        <Card className="rounded-[14px] elevation-card border-black/5 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[13px] font-semibold text-muted-foreground">
            <span>المسدد من السلف</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-success/15 text-success">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="tabular-nums text-[22px] sm:text-[24px] font-bold leading-none text-success">
              {formatEgp(kpis.paidAdvances)}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              وردت للخزينة نقدياً
            </div>
          </div>
        </Card>

        {/* 4. كشف الأجور والرواتب */}
        <Card className="rounded-[14px] elevation-card border-black/5 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[13px] font-semibold text-muted-foreground">
            <span>أجور الشهر الحالي</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="tabular-nums text-[22px] sm:text-[24px] font-bold leading-none text-foreground">
              {formatEgp(kpis.totalSalaries)}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {salariesData?.employeesCount ?? employees.length} موظف مسجل
            </div>
          </div>
        </Card>

        {/* 5. صافي النفقات الصافية */}
        <Card className="col-span-2 sm:col-span-2 lg:col-span-1 rounded-[14px] elevation-card border-primary/20 bg-primary/5 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[13px] font-semibold text-primary">
            <span>صافي المنصرف العام</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-white">
              <DollarSign className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="tabular-nums text-[22px] sm:text-[24px] font-extrabold leading-none text-primary">
              {formatEgp(kpis.netOutflow)}
            </div>
            <div className="mt-1 text-[11px] text-primary/75">
              مصروفات + سلف جارية
            </div>
          </div>
        </Card>
      </div>

      {/* ─── Unified Segmented Tab Navigation ──────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-black/10 pb-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/5 overflow-x-auto no-scrollbar scroll-smooth flex-nowrap max-w-full">
            <button
              type="button"
              onClick={() => setTab('expenses')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 text-[13px] font-bold rounded-lg transition-all touch-target whitespace-nowrap shrink-0 ${
                currentTab === 'expenses'
                  ? 'bg-white text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TrendingDown className="size-4" />
              <span>المصروفات التشغيلية</span>
              <span className="tabular-nums text-[11px] px-1.5 py-0.5 rounded-full bg-black/5">
                {expenses.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTab('advances')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 text-[13px] font-bold rounded-lg transition-all touch-target whitespace-nowrap shrink-0 ${
                currentTab === 'advances'
                  ? 'bg-white text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <HandCoins className="size-4 text-warning" />
              <span>سلف ومديونيات الموظفين</span>
              <span className="tabular-nums text-[11px] px-1.5 py-0.5 rounded-full bg-warning/15 text-warning font-bold">
                {debts.filter((d) => d.remaining > 0).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTab('salaries')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 text-[13px] font-bold rounded-lg transition-all touch-target whitespace-nowrap shrink-0 ${
                currentTab === 'salaries'
                  ? 'bg-white text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Wallet className="size-4 text-primary" />
              <span>الأجور والرواتب</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('ledger')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 text-[13px] font-bold rounded-lg transition-all touch-target whitespace-nowrap shrink-0 ${
                currentTab === 'ledger'
                  ? 'bg-white text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="size-4 text-emerald-600" />
              <span>السجل المالي الموحد</span>
              <span className="tabular-nums text-[11px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700">
                {unifiedLedger.length}
              </span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            <span>تحديث فوري مرتبط بالخزينة</span>
          </div>
        </div>

        {/* ─── TAB 1: OPERATIONAL EXPENSES ─────────────────────────────── */}
        {currentTab === 'expenses' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-[14px] border border-black/5 elevation-card">
              <div className="flex flex-1 items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث في بيان المصروف..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-9 h-10 rounded-[10px] text-[13px]"
                  />
                </div>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-10 w-[170px] rounded-[10px] text-[13px]">
                    <SelectValue placeholder="كل التصنيفات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل التصنيفات</SelectItem>
                    {expenseCategories.map((c) => (
                      <SelectItem key={c.value} value={String(c.value)}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Period presets */}
              <div className="flex items-center gap-1 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSelectedPeriod('today')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    selectedPeriod === 'today'
                      ? 'bg-primary text-white'
                      : 'bg-black/5 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  اليوم
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPeriod('week')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    selectedPeriod === 'week'
                      ? 'bg-primary text-white'
                      : 'bg-black/5 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  أسبوع
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPeriod('month')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    selectedPeriod === 'month'
                      ? 'bg-primary text-white'
                      : 'bg-black/5 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  هذا الشهر
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPeriod('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    selectedPeriod === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-black/5 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  الكل
                </button>
              </div>
            </div>

            {/* Expenses List / Table */}
            {isExpensesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-[14px]" />
                ))}
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-[14px] border border-dashed border-black/10 bg-white py-16 text-center">
                <ReceiptText className="size-12 text-muted-foreground/50" />
                <p className="text-[16px] font-semibold text-foreground">
                  لا توجد مصروفات مسجلة
                </p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  اضغط على «تسجيل مصروف» لإضافة مصروف جديد؛ سيتم خصمه تلقائياً من رصيد الخزينة.
                </p>
                <Button
                  onClick={openAddExpense}
                  className="mt-2 h-10 rounded-full px-5 text-xs font-bold"
                >
                  <Plus className="me-1 size-3.5" />
                  تسجيل أول مصروف
                </Button>
              </div>
            ) : (
              <Card className="rounded-[14px] elevation-card overflow-hidden border-black/5">
                {/* ─── بطاقات المصروفات للهواتف ─── */}
                <div className="divide-y divide-black/5 sm:hidden">
                  {filteredExpenses.map((exp) => (
                    <div key={exp.expenseId} className="p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="border-black/10 font-semibold text-[11px]">
                          {expenseCategoryLabel(exp.category)}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {formatDate(exp.expenseDate)}
                        </span>
                      </div>
                      <p className="text-[14px] font-bold text-foreground leading-snug">
                        {exp.descraption}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[16px] font-extrabold tabular-nums text-destructive">
                          -{formatEgp(exp.amount)}
                        </span>
                        <div className="flex items-center gap-1">
                          {exp.employeeName && (
                            <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1 me-2">
                              <User className="size-3 text-primary" />
                              {exp.employeeName}
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditExpense(exp)}
                            className="h-7 px-2 text-xs rounded-lg"
                          >
                            تعديل
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setDeleteTarget({
                                type: 'expense',
                                id: exp.expenseId,
                                label: exp.descraption || 'هذا المصروف',
                              })
                            }
                            className="h-7 px-2 text-xs text-destructive rounded-lg hover:bg-destructive/10"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ─── جدول المصروفات للتابلت والكمبيوتر ─── */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-start text-[14px]">
                    <thead className="bg-black/5 text-muted-foreground text-[12px] font-semibold">
                      <tr>
                        <th className="py-3 px-4 text-start">التاريخ والوقت</th>
                        <th className="py-3 px-4 text-start">التصنيف</th>
                        <th className="py-3 px-4 text-start">البيان والتفاصيل</th>
                        <th className="py-3 px-4 text-start">المستفيد / الموظف</th>
                        <th className="py-3 px-4 text-end">المبلغ المنصرف</th>
                        <th className="py-3 px-4 text-center w-24">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {filteredExpenses.map((exp) => (
                        <tr key={exp.expenseId} className="hover:bg-black/[0.02] transition-colors">
                          <td className="py-3.5 px-4 text-muted-foreground text-[13px] whitespace-nowrap">
                            {formatDate(exp.expenseDate)}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <Badge variant="outline" className="border-black/10 font-medium text-[12px]">
                              {expenseCategoryLabel(exp.category)}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-foreground">
                            {exp.descraption}
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground text-[13px]">
                            {exp.employeeName ? (
                              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                                <User className="size-3.5 text-primary" />
                                {exp.employeeName}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-end whitespace-nowrap font-bold tabular-nums text-[16px] text-destructive">
                            -{formatEgp(exp.amount)}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditExpense(exp)}
                                className="h-8 px-2 text-xs rounded-lg text-muted-foreground hover:text-foreground"
                              >
                                تعديل
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setDeleteTarget({
                                    type: 'expense',
                                    id: exp.expenseId,
                                    label: exp.descraption || 'هذا المصروف',
                                  })
                                }
                                className="h-8 px-2 text-xs rounded-lg text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ─── TAB 2: EMPLOYEE ADVANCES & DEBTS ────────────────────────── */}
        {currentTab === 'advances' && (
          <div className="space-y-4">
            {/* Advance Filters & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-[14px] border border-black/5 elevation-card">
              <div className="flex flex-1 items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث باسم الموظف أو ملاحظات السلفة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-9 h-10 rounded-[10px] text-[13px]"
                  />
                </div>

                <Select value={advanceStatusFilter} onValueChange={setAdvanceStatusFilter}>
                  <SelectTrigger className="h-10 w-[160px] rounded-[10px] text-[13px]">
                    <SelectValue placeholder="حالة السداد" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الحالات</SelectItem>
                    <SelectItem value="unpaid">غير مسددة</SelectItem>
                    <SelectItem value="partial">مسددة جزئياً</SelectItem>
                    <SelectItem value="paid">مسددة بالكامل</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => setAdvanceDialogOpen(true)}
                className="h-10 rounded-full px-5 text-xs font-bold gap-1.5 touch-target"
              >
                <Plus className="size-3.5" />
                تسجيل سلفة موظف
              </Button>
            </div>

            {/* Debts Table */}
            {isDebtsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-[14px]" />
                ))}
              </div>
            ) : filteredDebts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-[14px] border border-dashed border-black/10 bg-white py-16 text-center">
                <HandCoins className="size-12 text-muted-foreground/50" />
                <p className="text-[16px] font-semibold text-foreground">
                  لا توجد سلف مطابقة للبحث
                </p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  يمكنك تسجيل سلفة لأي موظف وسيتم خصم قيمتها من الخزينة وتتبع سدادها بالأقساط.
                </p>
                <Button
                  onClick={() => setAdvanceDialogOpen(true)}
                  className="mt-2 h-10 rounded-full px-5 text-xs font-bold"
                >
                  <Plus className="me-1 size-3.5" />
                  تسجيل سلفة جديدة
                </Button>
              </div>
            ) : (
              <Card className="rounded-[14px] elevation-card overflow-hidden border-black/5">
                {/* ─── بطاقات السلف للهواتف ─── */}
                <div className="divide-y divide-black/5 sm:hidden">
                  {filteredDebts.map((d) => {
                    const status = getEmployeeDebtStatus(d)
                    const cfg = statusConfig[status]
                    return (
                      <div key={d.employeeDebtId} className="p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-bold text-foreground">
                              {d.employeeName ?? 'موظف'}
                            </span>
                            <Badge variant={cfg.variant} className="text-[10px] font-semibold">
                              <cfg.icon className="me-1 size-3" />
                              {cfg.label}
                            </Badge>
                          </div>
                          <span className="text-[11px] text-muted-foreground tabular-nums">
                            {formatDateShort(d.createdDate)}
                          </span>
                        </div>
                        {d.notes && (
                          <p className="text-[12px] text-muted-foreground leading-snug">
                            {d.notes}
                          </p>
                        )}
                        <div className="grid grid-cols-3 gap-2 rounded-xl bg-black/5 p-2 text-center text-xs">
                          <div>
                            <span className="text-[10px] text-muted-foreground block">السلفة</span>
                            <span className="font-bold tabular-nums text-foreground">{formatEgp(d.amount)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block">المسدد</span>
                            <span className="font-bold tabular-nums text-success">{formatEgp(d.paidAmount)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block">المتبقي</span>
                            <span className="font-extrabold tabular-nums text-warning">{formatEgp(d.remaining)}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          {d.remaining > 0 ? (
                            <Button
                              size="sm"
                              onClick={() => {
                                setRepaySheet(d)
                                setRepayAmount(String(d.remaining))
                              }}
                              className="h-8 rounded-full px-4 text-xs font-bold bg-success hover:bg-success/90 text-white"
                            >
                              سداد
                            </Button>
                          ) : (
                            <Badge variant="outline" className="border-success/30 text-success text-[11px]">
                              خالصة
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setDeleteTarget({
                                type: 'advance',
                                id: d.employeeDebtId,
                                label: `سلفة ${d.employeeName ?? 'الموظف'} بقيمة ${d.amount} ج.م`,
                              })
                            }
                            className="h-8 px-2 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* ─── جدول السلف للتابلت والكمبيوتر ─── */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-start text-[14px]">
                    <thead className="bg-black/5 text-muted-foreground text-[12px] font-semibold">
                      <tr>
                        <th className="py-3 px-4 text-start">تاريخ السلفة</th>
                        <th className="py-3 px-4 text-start">اسم الموظف</th>
                        <th className="py-3 px-4 text-start">ملاحظات وبيان</th>
                        <th className="py-3 px-4 text-start">الحالة</th>
                        <th className="py-3 px-4 text-end">أصل السلفة</th>
                        <th className="py-3 px-4 text-end">المسدد</th>
                        <th className="py-3 px-4 text-end">المتبقي المطلوب</th>
                        <th className="py-3 px-4 text-center w-28">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {filteredDebts.map((d) => {
                        const status = getEmployeeDebtStatus(d)
                        const cfg = statusConfig[status]
                        return (
                          <tr key={d.employeeDebtId} className="hover:bg-black/[0.02] transition-colors">
                            <td className="py-3.5 px-4 text-muted-foreground text-[13px] whitespace-nowrap">
                              {formatDateShort(d.createdDate)}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-foreground whitespace-nowrap">
                              {d.employeeName ?? 'موظف'}
                            </td>
                            <td className="py-3.5 px-4 text-muted-foreground text-[13px]">
                              {d.notes || '—'}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <Badge variant={cfg.variant} className="text-[11px] font-semibold">
                                <cfg.icon className="me-1 size-3" />
                                {cfg.label}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-4 text-end whitespace-nowrap font-bold tabular-nums text-foreground">
                              {formatEgp(d.amount)}
                            </td>
                            <td className="py-3.5 px-4 text-end whitespace-nowrap font-semibold tabular-nums text-success">
                              {formatEgp(d.paidAmount)}
                            </td>
                            <td className="py-3.5 px-4 text-end whitespace-nowrap font-bold tabular-nums text-[15px] text-warning">
                              {formatEgp(d.remaining)}
                            </td>
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                {d.remaining > 0 ? (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setRepaySheet(d)
                                      setRepayAmount(String(d.remaining))
                                    }}
                                    className="h-8 rounded-full px-3 text-xs font-bold bg-success hover:bg-success/90 text-white touch-target shadow-xs"
                                  >
                                    سداد
                                  </Button>
                                ) : (
                                  <Badge variant="outline" className="border-success/30 text-success text-[11px]">
                                    خالصة
                                  </Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setDeleteTarget({
                                      type: 'advance',
                                      id: d.employeeDebtId,
                                      label: `سلفة ${d.employeeName ?? 'الموظف'} بقيمة ${d.amount} ج.م`,
                                    })
                                  }
                                  className="h-8 px-2 text-destructive hover:bg-destructive/10 rounded-lg"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ─── TAB 3: SALARIES & WAGES REPORT ─────────────────────────── */}
        {currentTab === 'salaries' && (
          <div className="space-y-4">
            <SalariesReport />
          </div>
        )}

        {/* ─── TAB 4: CONSOLIDATED FINANCIAL LEDGER ────────────────────── */}
        {currentTab === 'ledger' && (
          <div className="space-y-4">
            <Card className="rounded-[14px] elevation-card border-black/5 overflow-hidden">
              <div className="p-4 border-b border-black/5 flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] font-bold text-foreground">
                    كشف الحساب المالي الشامل للمصروفات والسلف
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    عرض تسلسلي زمني لكافة الحركات المالية الخارجة والداخلة المرتبطة بمصاريف الفرع وسلف العاملين
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="gap-1.5 text-xs rounded-full h-8"
                >
                  <Printer className="size-3.5" />
                  طباعة الكشف
                </Button>
              </div>

              {/* ─── عرض بطاقات السجل المالي للهواتف ─── */}
              <div className="divide-y divide-black/5 sm:hidden">
                {unifiedLedger.map((item) => (
                  <div key={item.id} className="p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={item.tagVariant} className="text-[11px] font-semibold">
                        {item.isOutflow ? (
                          <ArrowDownLeft className="me-1 size-3 text-destructive" />
                        ) : (
                          <ArrowUpRight className="me-1 size-3 text-success" />
                        )}
                        {item.typeLabel}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {formatDate(item.date)}
                      </span>
                    </div>
                    <p className="text-[14px] font-bold text-foreground leading-snug">
                      {item.title}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      {item.beneficiary ? (
                        <span className="text-[12px] text-muted-foreground inline-flex items-center gap-1">
                          <User className="size-3 text-primary" />
                          {item.beneficiary}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">حركة عامة</span>
                      )}
                      <span className="text-[16px] font-extrabold tabular-nums">
                        {item.isOutflow ? (
                          <span className="text-destructive">-{formatEgp(item.amount)}</span>
                        ) : (
                          <span className="text-success">+{formatEgp(item.amount)}</span>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* ─── جدول السجل المالي للتابلت والكمبيوتر ─── */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-start text-[14px]">
                  <thead className="bg-black/5 text-muted-foreground text-[12px] font-semibold">
                    <tr>
                      <th className="py-3 px-4 text-start">التاريخ والوقت</th>
                      <th className="py-3 px-4 text-start">النوع</th>
                      <th className="py-3 px-4 text-start">البيان والتفاصيل</th>
                      <th className="py-3 px-4 text-start">الموظف / الطرف</th>
                      <th className="py-3 px-4 text-end">التدفق المالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {unifiedLedger.map((item) => (
                      <tr key={item.id} className="hover:bg-black/[0.02] transition-colors">
                        <td className="py-3 px-4 text-muted-foreground text-[13px] whitespace-nowrap">
                          {formatDate(item.date)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge variant={item.tagVariant} className="text-[11px] font-semibold">
                            {item.isOutflow ? (
                              <ArrowDownLeft className="me-1 size-3 text-destructive" />
                            ) : (
                              <ArrowUpRight className="me-1 size-3 text-success" />
                            )}
                            {item.typeLabel}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-medium text-foreground">
                          {item.title}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-[13px]">
                          {item.beneficiary || '—'}
                        </td>
                        <td className="py-3 px-4 text-end whitespace-nowrap font-bold tabular-nums text-[15px]">
                          {item.isOutflow ? (
                            <span className="text-destructive">-{formatEgp(item.amount)}</span>
                          ) : (
                            <span className="text-success">+{formatEgp(item.amount)}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* ─── Add/Edit Expense Dialog ────────────────────────────────────── */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[20px]">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? 'تعديل المصروف' : 'تسجيل مصروف جديد'}
            </DialogTitle>
            <DialogDescription>
              يتم خصم المبلغ المسجل فوراً من رصيد الخزينة العامة للفرع.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">المبلغ المنصرف (ج.م) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="h-12 text-lg font-bold tabular-nums rounded-[12px] border-black/10 focus-visible:ring-primary"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">التصنيف *</Label>
              <Select
                value={String(expenseCategory)}
                onValueChange={(val) => setExpenseCategory(Number(val))}
              >
                <SelectTrigger className="h-11 rounded-[12px] text-sm">
                  <SelectValue placeholder="اختر التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((c) => (
                    <SelectItem key={c.value} value={String(c.value)}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {expenseCategory === EXPENSE_CATEGORY_SALARY && (
              <div className="space-y-1.5 rounded-xl bg-primary/5 p-3 border border-primary/15">
                <Label className="text-xs font-bold text-primary">الموظف المعني بالراتب *</Label>
                <Select
                  value={expenseEmployeeId}
                  onValueChange={setExpenseEmployeeId}
                >
                  <SelectTrigger className="h-11 rounded-[12px] text-sm bg-white">
                    <SelectValue placeholder="اختر الموظف المستلم" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">بيان وتفاصيل المصروف *</Label>
              <Input
                placeholder="مثال: فاتورة كهرباء، أدوات تغليف، صيانة ميزان..."
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                className="h-11 rounded-[12px] text-sm"
              />
            </div>

            {/* Quick chips presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground">أمثلة سريعة:</span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_EXPENSE_PRESETS.slice(0, 4).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setExpenseDesc(p)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-black/5 hover:bg-black/10 text-foreground transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={closeExpenseDialog}
              className="h-11 rounded-full px-5 text-xs font-bold"
            >
              إلغاء
            </Button>
            <Button
              type="button"
              disabled={
                !expenseAmount ||
                Number(expenseAmount) <= 0 ||
                !expenseDesc.trim() ||
                addExpenseMutation.isPending ||
                updateExpenseMutation.isPending
              }
              onClick={submitExpense}
              className="h-11 rounded-full px-6 text-xs font-bold"
            >
              {addExpenseMutation.isPending || updateExpenseMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : editingExpense ? (
                'حفظ التعديلات'
              ) : (
                'تأكيد وحفظ المصروف'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Add Advance Dialog ────────────────────────────────────────── */}
      <Dialog open={advanceDialogOpen} onOpenChange={setAdvanceDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[20px]">
          <DialogHeader>
            <DialogTitle>تسجيل سلفة موظف</DialogTitle>
            <DialogDescription>
              تُصرف السلفة من الخزينة وتُسجل كمديونية على الموظف يتم سدادها لاحقاً.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">الموظف *</Label>
              <Select value={advanceEmployeeId} onValueChange={setAdvanceEmployeeId}>
                <SelectTrigger className="h-12 w-full rounded-[12px]">
                  <SelectValue placeholder="اختر الموظف المستفيد" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">قيمة السلفة (ج.م) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                placeholder="0.00"
                className="h-12 text-lg font-bold tabular-nums rounded-[12px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">بيان أو سبب السلفة (اختياري)</Label>
              <Input
                value={advanceNotes}
                onChange={(e) => setAdvanceNotes(e.target.value)}
                placeholder="مثال: سلفة شهرية، طارئ عائلي، صيانة..."
                className="h-11 rounded-[12px] text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAdvanceDialogOpen(false)}
              className="h-11 rounded-full px-5 text-xs font-bold"
            >
              إلغاء
            </Button>
            <Button
              type="button"
              disabled={!canSaveAdvance || addAdvanceMutation.isPending}
              onClick={() => addAdvanceMutation.mutate()}
              className="h-11 rounded-full px-6 text-xs font-bold bg-warning hover:bg-warning/90 text-warning-foreground"
            >
              {addAdvanceMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                'تأكيد وصرف السلفة'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Repay Advance Sheet / Dialog ─────────────────────────────── */}
      <Sheet open={!!repaySheet} onOpenChange={(o) => { if (!o) { setRepaySheet(null); setRepayAmount('') } }}>
        <SheetContent side="bottom" className="rounded-t-3xl max-w-xl mx-auto">
          <SheetHeader className="text-start">
            <SheetTitle>سداد سلفة موظف</SheetTitle>
            <SheetDescription>
              {repaySheet ? `سداد دفعة من سلفة: ${repaySheet.employeeName ?? 'الموظف'}` : ''}
            </SheetDescription>
          </SheetHeader>

          {repaySheet && (
            <div className="space-y-4 px-4 pb-6 pt-2">
              <div className="rounded-2xl bg-black/5 p-4 space-y-2">
                <div className="flex justify-between text-[14px]">
                  <span className="text-muted-foreground">أصل مبلغ السلفة</span>
                  <span className="font-semibold tabular-nums">{formatEgp(repaySheet.amount)}</span>
                </div>
                <div className="flex justify-between text-[14px]">
                  <span className="text-muted-foreground">المسدد سابقاً</span>
                  <span className="font-semibold tabular-nums text-success">{formatEgp(repaySheet.paidAmount)}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between text-[15px]">
                  <span className="font-bold text-foreground">المتبقي المطلوب سداده</span>
                  <span className="font-extrabold tabular-nums text-warning text-[17px]">
                    {formatEgp(repaySheet.remaining)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[14px] font-bold">مبلغ السداد الحالي (ج.م)</Label>
                  <button
                    type="button"
                    onClick={() => setRepayAmount(String(repaySheet.remaining))}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    سداد كامل المتبقي ({formatEgp(repaySheet.remaining)})
                  </button>
                </div>
                <Input
                  type="number"
                  min="0"
                  max={repaySheet.remaining}
                  step="0.01"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  placeholder="0.00"
                  className="h-12 text-lg font-bold tabular-nums rounded-[14px]"
                  autoFocus
                />
              </div>

              <Button
                type="button"
                onClick={() => payAdvanceMutation.mutate()}
                disabled={
                  payAdvanceMutation.isPending ||
                  !repayAmount ||
                  Number(repayAmount) <= 0 ||
                  Number(repayAmount) > repaySheet.remaining
                }
                className="h-12 w-full gap-2 rounded-full font-bold text-sm bg-success hover:bg-success/90 text-white touch-target shadow-xs"
              >
                {payAdvanceMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  'تأكيد السداد وتوريد للخزينة'
                )}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ─── Delete Confirmation Dialog ────────────────────────────── */}
      <Dialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-md rounded-[20px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="size-5" />
              تأكيد الحذف
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في حذف{' '}
              <strong className="text-foreground font-bold">{deleteTarget?.label}</strong>؟
              هذا الإجراء سيقوم بإلغاء المعاملة وتعديل حركة الخزينة المرتبطة بها.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="rounded-full touch-target"
            >
              إلغاء
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!deleteTarget) return
                if (deleteTarget.type === 'expense') {
                  deleteExpenseMutation.mutate(deleteTarget.id)
                } else {
                  deleteAdvanceMutation.mutate(deleteTarget.id)
                }
                setDeleteTarget(null)
              }}
              className="rounded-full touch-target font-bold"
            >
              تأكيد الحذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Action Button for Mobile */}
      <Fab
        aria-label="تسجيل مصروف"
        className="fixed bottom-6 end-6 z-40 sm:hidden"
        onClick={openAddExpense}
      >
        <Plus />
      </Fab>
    </div>
  )
}
