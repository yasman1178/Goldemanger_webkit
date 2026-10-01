import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Calendar,
  Filter,
  Loader2,
  Plus,
  Receipt,
  ReceiptText,
  Search,
  User,
  Wallet,
  X,
  Zap,
  Building2,
  Wrench,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { createExpense, getExpenses } from '@/features/expenses/api'
import {
  EXPENSE_CATEGORY_OTHER,
  EXPENSE_CATEGORY_SALARY,
  canSubmitExpense,
  expenseCategories,
  expenseCategoryLabel,
} from '@/features/expenses/types'
import { getEmployees } from '@/features/employee-debts/api'
import { SalariesReport } from '@/features/expenses/components/SalariesReport'
import { formatEgp, cn } from '@/shared/lib/utils'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Fab } from '@/shared/components/ui/fab'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'

function formatDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

function getCategoryIcon(category: number) {
  switch (category) {
    case EXPENSE_CATEGORY_SALARY:
      return Wallet
    case 2:
      return Zap
    case 3:
      return Building2
    case 4:
      return Wrench
    default:
      return Receipt
  }
}

const QUICK_AMOUNT_PRESETS = [50, 100, 200, 500, 1000]
const QUICK_DESC_SUGGESTIONS = [
  'فاتورة كهرباء',
  'فاتورة مياه',
  'إيجار المحل',
  'ضيافة وبوفيه',
  'أدوات نظافة ومطبوعات',
  'صيانة وتصليح',
]

export function ExpensesPage() {
  const queryClient = useQueryClient()
  const activeBranchId = useActiveBranchId()
  const [searchParams, setSearchParams] = useSearchParams()
  const [addOpen, setAddOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [descraption, setDescraption] = useState('')
  const [category, setCategory] = useState<string>(String(EXPENSE_CATEGORY_OTHER))
  const [employeeId, setEmployeeId] = useState('')

  // فلاتر البحث
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'month'>('today')

  const activeTab = searchParams.get('tab') === 'salaries' ? 'salaries' : 'expenses'
  function setActiveTab(value: string) {
    setSearchParams(value === 'salaries' ? { tab: 'salaries' } : {}, { replace: true })
  }

  const { data: expenses = [], isLoading, isError } = useQuery({
    queryKey: ['expenses', activeBranchId],
    queryFn: () => getExpenses(activeBranchId ?? undefined),
    enabled: !!activeBranchId,
  })

  const isSalary = Number(category) === EXPENSE_CATEGORY_SALARY

  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['employee-options', activeBranchId],
    queryFn: () => getEmployees(activeBranchId ?? undefined),
    enabled: isSalary && activeBranchId != null,
    staleTime: 5 * 60 * 1000,
  })

  // إحصائيات عامة
  const todayKey = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  }, [])

  const monthKey = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${d.getMonth()}`
  }, [])

  const todayExpenses = useMemo(
    () =>
      expenses.filter((e) => {
        const s = new Date(e.expenseDate)
        return `${s.getFullYear()}-${s.getMonth()}-${s.getDate()}` === todayKey
      }),
    [expenses, todayKey],
  )

  const monthExpenses = useMemo(
    () =>
      expenses.filter((e) => {
        const s = new Date(e.expenseDate)
        return `${s.getFullYear()}-${s.getMonth()}` === monthKey
      }),
    [expenses, monthKey],
  )

  const totalToday = useMemo(
    () => todayExpenses.reduce((sum, e) => sum + e.amount, 0),
    [todayExpenses],
  )

  const totalSalariesToday = useMemo(
    () =>
      todayExpenses
        .filter((e) => e.category === EXPENSE_CATEGORY_SALARY)
        .reduce((sum, e) => sum + e.amount, 0),
    [todayExpenses],
  )

  const totalMonth = useMemo(
    () => monthExpenses.reduce((sum, e) => sum + e.amount, 0),
    [monthExpenses],
  )

  // تصفية السجلات المعروضة
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // فلترة الفترة
      if (periodFilter === 'today') {
        const s = new Date(e.expenseDate)
        if (`${s.getFullYear()}-${s.getMonth()}-${s.getDate()}` !== todayKey) {
          return false
        }
      } else if (periodFilter === 'month') {
        const s = new Date(e.expenseDate)
        if (`${s.getFullYear()}-${s.getMonth()}` !== monthKey) {
          return false
        }
      }

      // فلترة التصنيف
      if (selectedCategoryFilter !== 'all') {
        if (String(e.category) !== selectedCategoryFilter) return false
      }

      // فلترة النص
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase()
        const matchDesc = (e.descraption || '').toLowerCase().includes(q)
        const matchEmp = (e.employeeName || '').toLowerCase().includes(q)
        const matchCat = expenseCategoryLabel(e.category).toLowerCase().includes(q)
        if (!matchDesc && !matchEmp && !matchCat) return false
      }

      return true
    })
  }, [expenses, periodFilter, selectedCategoryFilter, searchQuery, todayKey, monthKey])

  const filteredTotal = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses],
  )

  const addMutation = useMutation({
    mutationFn: () =>
      createExpense({
        amount: Number(amount) || 0,
        descraption: descraption.trim(),
        category: Number(category),
        employeeId: isSalary ? employeeId : null,
        branchId: activeBranchId ?? undefined,
      }),
    onSuccess: () => {
      toast.success('تم تسجيل المصروف بنجاح وخصمه من الخزينة')
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['salaries'] })
      queryClient.invalidateQueries({ queryKey: ['cash'] })
      setAddOpen(false)
      setAmount('')
      setDescraption('')
      setCategory(String(EXPENSE_CATEGORY_OTHER))
      setEmployeeId('')
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? 'تعذّر تسجيل المصروف.')
    },
  })

  const canAdd = canSubmitExpense({
    amount: Number(amount) || 0,
    descraption,
    category: Number(category),
    employeeId,
  })

  return (
    <div className="space-y-6 pb-20">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-bold leading-tight text-foreground">
            المصروفات والأجور
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            سجل المصروفات اليومية والنثريات ورواتب الموظفين مع الخصم التلقائي من الخزينة
          </p>
        </div>

        {activeTab === 'expenses' && (
          <Button
            onClick={() => setAddOpen(true)}
            className="h-11 gap-2 rounded-full px-5 font-bold shadow-xs touch-target self-start sm:self-auto cursor-pointer"
          >
            <Plus className="size-4.5" />
            <span>تسجيل مصروف جديد</span>
          </Button>
        )}
      </div>

      {/* ─── Tabs Bar ─── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <TabsList className="grid h-11 w-full max-w-md grid-cols-2 rounded-[12px] p-1 bg-secondary/80 border border-black/5">
          <TabsTrigger
            value="expenses"
            className="h-9 rounded-[9px] text-[13px] font-bold touch-target data-[state=active]:bg-white data-[state=active]:shadow-xs"
          >
            المصروفات اليومية
          </TabsTrigger>
          <TabsTrigger
            value="salaries"
            className="h-9 rounded-[9px] text-[13px] font-bold touch-target data-[state=active]:bg-white data-[state=active]:shadow-xs"
          >
            كشف الرواتب والأجور
          </TabsTrigger>
        </TabsList>

        {/* ─── Tab 1: المصروفات ─── */}
        <TabsContent value="expenses" className="space-y-5 mt-4">
          {/* كروت الإحصائيات الأربعة الأنيقة والمتوازنة */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. مصروفات اليوم */}
            <Card className="rounded-[14px] border border-black/5 bg-white p-3.5 elevation-card shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[12px] font-semibold">مصروفات اليوم</span>
                <span className="flex size-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40">
                  <ReceiptText className="size-3.5" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="text-[20px] sm:text-[22px] font-black text-rose-600 dark:text-rose-400 tabular-nums">
                  {formatEgp(totalToday)}
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {todayExpenses.length} حركة
                </span>
              </div>
            </Card>

            {/* 2. أجور اليوم */}
            <Card className="rounded-[14px] border border-black/5 bg-white p-3.5 elevation-card shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[12px] font-semibold">أجور اليوم</span>
                <span className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40">
                  <Wallet className="size-3.5" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="text-[20px] sm:text-[22px] font-black text-amber-600 dark:text-amber-400 tabular-nums">
                  {formatEgp(totalSalariesToday)}
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">رواتب</span>
              </div>
            </Card>

            {/* 3. إجمالي هذا الشهر */}
            <Card className="rounded-[14px] border border-black/5 bg-white p-3.5 elevation-card shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[12px] font-semibold">إجمالي الشهر الحالي</span>
                <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40">
                  <Calendar className="size-3.5" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="text-[20px] sm:text-[22px] font-black text-foreground tabular-nums">
                  {formatEgp(totalMonth)}
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {monthExpenses.length} حركة
                </span>
              </div>
            </Card>

            {/* 4. إجمالي المعروض حالياً */}
            <Card className="rounded-[14px] border border-black/5 bg-white p-3.5 elevation-card shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[12px] font-semibold">المعروض بالفلترة</span>
                <span className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <Filter className="size-3.5" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="text-[20px] sm:text-[22px] font-black text-foreground tabular-nums">
                  {formatEgp(filteredTotal)}
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {filteredExpenses.length} بند
                </span>
              </div>
            </Card>
          </div>

          {/* ─── الفلاتر والبحث (توفير المساحة وتجميع الخيارات) ─── */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between rounded-[14px] border border-black/5 bg-white p-3 shadow-xs">
            {/* حقل البحث */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالبيان أو اسم الموظف..."
                className="h-10 ps-9 pe-9 rounded-[10px] text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="مسح البحث"
                  className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* تصنيف المصروف */}
              <Select
                value={selectedCategoryFilter}
                onValueChange={setSelectedCategoryFilter}
              >
                <SelectTrigger className="h-10 w-[140px] sm:w-[155px] rounded-[10px] text-xs font-semibold">
                  <SelectValue placeholder="التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع التصنيفات</SelectItem>
                  {expenseCategories.map((c) => (
                    <SelectItem key={c.value} value={String(c.value)}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* أزرار الفترة الزمنية المدمجة */}
              <div className="inline-flex rounded-[10px] bg-secondary p-0.5 border border-black/5">
                <button
                  type="button"
                  onClick={() => setPeriodFilter('today')}
                  className={cn(
                    'h-9 px-3 rounded-[8px] text-xs font-bold transition-all cursor-pointer touch-target',
                    periodFilter === 'today'
                      ? 'bg-white text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  اليوم
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodFilter('month')}
                  className={cn(
                    'h-9 px-3 rounded-[8px] text-xs font-bold transition-all cursor-pointer touch-target',
                    periodFilter === 'month'
                      ? 'bg-white text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  هذا الشهر
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodFilter('all')}
                  className={cn(
                    'h-9 px-3 rounded-[8px] text-xs font-bold transition-all cursor-pointer touch-target',
                    periodFilter === 'all'
                      ? 'bg-white text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  الكل
                </button>
              </div>
            </div>
          </div>

          {/* ─── جدول / قائمة المصروفات العصرية ─── */}
          {isLoading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-[14px]" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center py-16 text-error text-sm font-semibold">
              تعذّر تحميل قائمة المصروفات.
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-[16px] border border-dashed border-black/10 bg-white py-16 text-center">
              <ReceiptText className="size-10 text-muted-foreground/60" />
              <p className="text-[15px] font-bold text-foreground">
                {expenses.length === 0
                  ? 'لا توجد مصروفات مسجلة بعد'
                  : 'لا توجد نتائج تطابق شروط الفلترة'}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                {expenses.length === 0
                  ? 'سجّل أول مصروف وسيتم خصم المبلغ من رصيد الخزينة تلقائياً وبدقة محاسبية.'
                  : 'جرّب تغيير التصنيف أو نطاق البحث أو الفترة.'}
              </p>
              {expenses.length === 0 && (
                <Button
                  onClick={() => setAddOpen(true)}
                  variant="outline"
                  className="mt-2 h-9 rounded-full text-xs font-bold touch-target"
                >
                  <Plus className="size-3.5 me-1" />
                  تسجيل أول مصروف
                </Button>
              )}
            </div>
          ) : (
            <Card className="rounded-[14px] border border-black/5 bg-white overflow-hidden shadow-xs elevation-card">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-secondary/60">
                    <TableRow className="border-b border-black/5">
                      <TableHead className="w-[140px] text-xs font-bold text-muted-foreground">
                        التاريخ والوقت
                      </TableHead>
                      <TableHead className="w-[130px] text-xs font-bold text-muted-foreground">
                        التصنيف
                      </TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground">
                        البيان
                      </TableHead>
                      <TableHead className="w-[160px] text-xs font-bold text-muted-foreground">
                        الموظف
                      </TableHead>
                      <TableHead className="text-start w-[140px] text-xs font-bold text-muted-foreground">
                        المبلغ
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-black/5">
                    {filteredExpenses.map((e) => {
                      const Icon = getCategoryIcon(e.category)
                      return (
                        <TableRow
                          key={e.expenseId}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <TableCell className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                            {formatDate(e.expenseDate)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary text-foreground/70">
                                <Icon className="size-3" />
                              </span>
                              <span className="text-xs font-bold text-foreground">
                                {expenseCategoryLabel(e.category)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-medium text-foreground max-w-xs truncate">
                            {e.descraption}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {e.employeeName ? (
                              <div className="flex items-center gap-1 text-foreground font-semibold">
                                <User className="size-3 text-primary" />
                                <span>{e.employeeName}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/60">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-start">
                            <span className="text-sm font-black tabular-nums text-rose-600 dark:text-rose-400">
                              {formatEgp(e.amount)}
                            </span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ─── Tab 2: كشف الرواتب ─── */}
        <TabsContent value="salaries" className="space-y-4 mt-4">
          <SalariesReport />
        </TabsContent>
      </Tabs>

      {/* ─── Dialog تسجيل مصروف جديد — عصري وسريع ─── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تسجيل مصروف جديد</DialogTitle>
            <DialogDescription>
              يُخصم المبلغ مباشرة من الخزينة ويُسجّل في حركات اليوم المالية.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 sm:p-5 space-y-4">
            {/* المبلغ وأزرار المبالغ السريعة للتابلت */}
            <div className="space-y-2">
              <Label htmlFor="exp-amount" className="text-xs font-bold">
                المبلغ (ج.م) *
              </Label>
              <div className="relative">
                <Input
                  id="exp-amount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="h-12 rounded-[12px] text-lg font-bold tabular-nums pe-10"
                />
                <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                  ج.م
                </span>
              </div>

              {/* شرائح المبالغ السريعة */}
              <div className="flex items-center gap-1.5 pt-1">
                {QUICK_AMOUNT_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAmount(String(p))}
                    className="flex-1 h-7 rounded-md border border-black/10 bg-secondary/60 hover:bg-secondary text-[11px] font-bold tabular-nums text-foreground transition-colors cursor-pointer"
                  >
                    +{p}
                  </button>
                ))}
              </div>
            </div>

            {/* تصنيف المصروف */}
            <div className="space-y-1.5">
              <Label htmlFor="exp-category" className="text-xs font-bold">
                التصنيف *
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="exp-category" className="h-11 w-full rounded-[12px] text-xs font-bold">
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

            {/* اختيار الموظف في حال كان تصنيف راتب */}
            {isSalary && (
              <div className="space-y-1.5 rounded-[12px] border border-amber-200 bg-amber-50/50 p-3">
                <Label htmlFor="exp-employee" className="text-xs font-bold text-amber-900">
                  الموظف المستلم *
                </Label>
                <Select
                  value={employeeId}
                  onValueChange={setEmployeeId}
                  disabled={employeesLoading || employees.length === 0}
                >
                  <SelectTrigger id="exp-employee" className="h-11 w-full rounded-[10px] bg-white text-xs font-bold">
                    <SelectValue
                      placeholder={
                        employeesLoading
                          ? 'جارٍ تحميل الموظفين…'
                          : employees.length === 0
                            ? 'لا يوجد موظفون في هذا الفرع'
                            : 'اختر الموظف'
                      }
                    />
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

            {/* البيان ومقترحات سريعة */}
            <div className="space-y-2">
              <Label htmlFor="exp-desc" className="text-xs font-bold">
                البيان / الوصف *
              </Label>
              <Input
                id="exp-desc"
                value={descraption}
                onChange={(e) => setDescraption(e.target.value)}
                placeholder={
                  isSalary ? 'مثال: سلفة / راتب شهر سبتمبر' : 'مثال: فاتورة كهرباء، صيانة تكيف...'
                }
                className="h-11 rounded-[12px] text-xs"
              />

              {!isSalary && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {QUICK_DESC_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setDescraption(s)}
                      className="h-6 px-2 rounded-full border border-black/5 bg-secondary/80 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t border-black/5 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddOpen(false)}
              className="h-10 rounded-full px-5 text-xs font-bold touch-target cursor-pointer"
            >
              إلغاء
            </Button>
            <Button
              type="button"
              disabled={!canAdd || addMutation.isPending}
              onClick={() => addMutation.mutate()}
              className="h-10 rounded-full px-6 text-xs font-bold touch-target cursor-pointer"
            >
              {addMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                'حفظ وخصم من الخزينة'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Action Button for mobile & touch */}
      {activeTab === 'expenses' && (
        <Fab
          aria-label="تسجيل مصروف جديد"
          className="fixed bottom-6 end-6 z-40 md:hidden"
          onClick={() => setAddOpen(true)}
        >
          <Plus />
        </Fab>
      )}
    </div>
  )
}
