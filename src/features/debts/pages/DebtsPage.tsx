import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import {
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  FileText,
  Plus,
  Coins,
  Scale,
} from 'lucide-react'

import { getBranchDebtsPage, getBranchDebtsSummary, updateDebt } from '@/features/debts/api'
import { createCustomerDebt } from '@/features/debts/api'
import {
  getDebtStatus,
  debtStatusLabels,
  type Debt,
  type DebtStatus,
  type DebtType,
  type BalanceValue,
} from '@/features/debts/types'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { formatEgp, cn } from '@/shared/lib/utils'
import { PAGE_SIZE, usePaginablePage } from '@/shared/lib/pagination'
import { PaginationBar } from '@/shared/components/ui/pagination'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { getCustomers } from '@/shared/lib/parties'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/shared/components/ui/sheet'
import { Label } from '@/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

function formatDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

const statusConfig: Record<
  DebtStatus,
  { variant: 'default' | 'destructive' | 'secondary' | 'outline'; icon: typeof Wallet }
> = {
  unpaid: { variant: 'secondary', icon: Clock },
  partial: { variant: 'outline', icon: AlertTriangle },
  paid: { variant: 'default', icon: CheckCircle2 },
  overdue: { variant: 'destructive', icon: AlertTriangle },
}

export function DebtsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const activeBranchId = useActiveBranchId()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<DebtStatus | 'all'>('all')
  const [paymentSheet, setPaymentSheet] = useState<Debt | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [page, setPage] = useState(1)
  const [newDebtOpen, setNewDebtOpen] = useState(false)
  const [newDebtForm, setNewDebtForm] = useState({
    clientId: '',
    debtType: 'debit' as DebtType,
    balanceType: 'cash' as BalanceValue,
    amountOwed: '',
    paidAmount: '',
    dueDate: '',
    description: '',
  })

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
  })

  const { data: pageResult, isLoading, isError } = useQuery({
    queryKey: [
      'debts',
      activeBranchId,
      'page',
      page,
      searchQuery.trim(),
      filterStatus,
    ],
    queryFn: () =>
      getBranchDebtsPage({
        branchId: activeBranchId ?? 0,
        page,
        q: searchQuery.trim() || undefined,
        status: filterStatus === 'all' ? undefined : filterStatus,
      }),
    enabled: !!activeBranchId,
  })

  const debts = pageResult?.data ?? []
  const { page: safePage, pageCount, goToPage, reset } = usePaginablePage(
    pageResult?.totalCount ?? 0,
    page,
    PAGE_SIZE,
    setPage,
  )

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['debts-summary', activeBranchId],
    queryFn: () => getBranchDebtsSummary(activeBranchId ?? 0),
    enabled: !!activeBranchId,
  })

  const summaryTotal = summaryLoading
    ? 0
    : (summary?.total ?? 0)
  const summaryPaid = summaryLoading ? 0 : (summary?.paid ?? 0)
  const summaryRemaining = summaryLoading ? 0 : (summary?.remaining ?? 0)
  const summaryOverdue = summaryLoading ? 0 : (summary?.overdue ?? 0)

  const paymentMutation = useMutation({
    mutationFn: async () => {
      if (!paymentSheet) return
      const amount = Number(paymentAmount) || 0
      const remaining = paymentSheet.amountOwed - paymentSheet.paidAmount
      if (amount <= 0 || amount > remaining) {
        throw new Error('invalid')
      }
      await updateDebt(paymentSheet.debtId, {
        debtId: paymentSheet.debtId,
        clientId: paymentSheet.clientId,
        saleId: paymentSheet.saleId,
        branchId: paymentSheet.branchId,
        companyId: paymentSheet.companyId,
        amountOwed: paymentSheet.amountOwed,
        paidAmount: paymentSheet.paidAmount + amount,
        dueDate: paymentSheet.dueDate,
        paymentDate: new Date().toISOString(),
      })
    },
    onSuccess: () => {
      toast.success('تم تسجيل الدفعة بنجاح')
      queryClient.invalidateQueries({ queryKey: ['debts'] })
      setPaymentSheet(null)
      setPaymentAmount('')
    },
    onError: () => {
      toast.error('فشل تسجيل الدفعة. تأكد من المبلغ.')
    },
  })

  const newDebtMutation = useMutation({
    mutationFn: async () => {
      const clientId = Number(newDebtForm.clientId)
      if (!clientId) {
        throw new Error('no-client')
      }
      const amount = Number(newDebtForm.amountOwed) || 0
      if (amount <= 0) {
        throw new Error('invalid-amount')
      }
      const paid = Number(newDebtForm.paidAmount) || 0
      await createCustomerDebt({
        clientId,
        branchId: activeBranchId ?? 0,
        amountOwed: amount,
        paidAmount: Math.min(paid, amount),
        dueDate:
          newDebtForm.dueDate ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10),
        paymentDate: paid > 0 ? new Date().toISOString() : null,
        debtType: newDebtForm.debtType,
        balanceType: newDebtForm.balanceType,
        description: newDebtForm.description.trim() || null,
      })
    },
    onSuccess: () => {
      toast.success('تم تسجيل المديونية بنجاح')
      queryClient.invalidateQueries({ queryKey: ['debts'] })
      queryClient.invalidateQueries({ queryKey: ['debts-summary'] })
      setNewDebtOpen(false)
      setNewDebtForm({
        clientId: '',
        debtType: 'debit',
        balanceType: 'cash',
        amountOwed: '',
        paidAmount: '',
        dueDate: '',
        description: '',
      })
    },
    onError: (error: { message?: string }) => {
      if (error?.message === 'no-client') {
        toast.error('اختر العميل.')
        return
      }
      if (error?.message === 'invalid-amount') {
        toast.error('أدخل قيمة مديونية صحيحة أكبر من صفر.')
        return
      }
      toast.error('فشل تسجيل المديونية. تأكد من البيانات.')
    },
  })

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[34px] font-bold leading-[1.2] text-foreground">
            المديونيات
          </h1>
          <p className="text-muted-foreground">إدارة ديون العملاء والمستحقات</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => setNewDebtOpen(true)}
            className="h-11 gap-2 rounded-full px-5 touch-target"
          >
            <Plus className="size-4" />
            تسجيل مديونية
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void navigate('/app/debts/report')}
            className="h-11 gap-2 rounded-full px-4 touch-target"
          >
            <FileText className="size-4" />
            التقرير المفصل
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card size="sm" className="rounded-[14px] elevation-card border-sky-200/60 bg-gradient-to-br from-sky-50/80 to-card">
          <CardHeader className="px-3 pt-2.5 pb-0">
            <CardTitle className="flex items-center justify-between gap-1.5 text-[11px] font-semibold leading-[1.3] text-sky-600">
              <span>إجمالي الدين</span>
              <Wallet className="size-3.5 text-sky-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-2.5 pt-0.5">
            <div className="tabular-nums text-[17px] font-bold leading-[1.1] text-sky-700">
              {formatEgp(summaryTotal)}
            </div>
          </CardContent>
        </Card>

        <Card size="sm" className="rounded-[14px] elevation-card border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-card">
          <CardHeader className="px-3 pt-2.5 pb-0">
            <CardTitle className="flex items-center justify-between gap-1.5 text-[11px] font-semibold leading-[1.3] text-emerald-600">
              <span>المدفوع</span>
              <CheckCircle2 className="size-3.5 text-emerald-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-2.5 pt-0.5">
            <div className="tabular-nums text-[17px] font-bold leading-[1.1] text-emerald-700">
              {formatEgp(summaryPaid)}
            </div>
          </CardContent>
        </Card>

        <Card size="sm" className="rounded-[14px] elevation-card border-amber-200/60 bg-gradient-to-br from-amber-50/80 to-card">
          <CardHeader className="px-3 pt-2.5 pb-0">
            <CardTitle className="flex items-center justify-between gap-1.5 text-[11px] font-semibold leading-[1.3] text-amber-600">
              <span>المديونية الحالية</span>
              <AlertTriangle className="size-3.5 text-amber-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-2.5 pt-0.5">
            <div className="tabular-nums text-[17px] font-bold leading-[1.1] text-amber-700">
              {formatEgp(summaryRemaining)}
            </div>
          </CardContent>
        </Card>

        <Card size="sm" className="rounded-[14px] elevation-card border-rose-200/60 bg-gradient-to-br from-rose-50/80 to-card">
          <CardHeader className="px-3 pt-2.5 pb-0">
            <CardTitle className="flex items-center justify-between gap-1.5 text-[11px] font-semibold leading-[1.3] text-rose-600">
              <span>ديون متأخرة</span>
              <AlertTriangle className="size-3.5 text-rose-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-2.5 pt-0.5">
            <div className="tabular-nums text-[17px] font-bold leading-[1.1] text-rose-700">
              {summaryOverdue}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              reset()
            }}
            placeholder="ابحث بالاسم أو رقم الهاتف..."
            className="search-field h-12 touch-target"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'unpaid', 'partial', 'paid', 'overdue'] as const).map((s) => (
            <Button
              key={s}
              type="button"
              variant={filterStatus === s ? 'default' : 'outline'}
              onClick={() => {
                reset()
                setFilterStatus(s)
              }}
              className="h-10 rounded-full px-4 text-[13px] touch-target"
            >
              <Filter className="size-3.5" />
              {s === 'all' ? 'الكل' : debtStatusLabels[s]}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center py-20 text-error">
          تعذّر تحميل بيانات المديونيات.
        </div>
      ) : debts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/10 bg-white py-20 text-center">
          <Wallet className="size-12 text-muted-foreground" />
          <p className="text-[17px] font-semibold text-foreground">
            {searchQuery ? 'لا توجد نتائج' : 'لا توجد مديونيات'}
          </p>
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? 'جرّب بحثاً مختلفاً.'
              : 'ستظهر هنا الديون المستحقة من مبيعات العملات.'}
          </p>
        </div>
      ) : (
        <>
        <Card className="elevation-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العميل</TableHead>
                <TableHead>المستحق</TableHead>
                <TableHead>المدفوع</TableHead>
                <TableHead>المتبقي</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الاستحقاق</TableHead>
                <TableHead className="text-end">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debts.map((debt) => {
                const status = getDebtStatus(debt)
                const remaining = Math.max(0, Math.round(debt.amountOwed - debt.paidAmount))
                const cfg = statusConfig[status]
                return (
                  <TableRow key={debt.debtId}>
                    <TableCell className="font-semibold text-foreground">
                      {debt.clientName ?? `عميل #${debt.clientId ?? '—'}`}
                      {debt.debtType === 1 && (
                        <span className="ms-1.5 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                          دائن
                        </span>
                      )}
                      {debt.balanceType === 1 && (
                        <span className="ms-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                          <Scale className="size-3" />
                          ذهب
                        </span>
                      )}
                      {debt.description && (
                        <span className="block text-[11px] font-normal text-muted-foreground">
                          {debt.description}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatEgp(debt.amountOwed)}
                    </TableCell>
                    <TableCell className="tabular-nums text-success">
                      {formatEgp(debt.paidAmount)}
                    </TableCell>
                    <TableCell className={cn('tabular-nums font-semibold', remaining > 0 ? 'text-warning' : 'text-success')}>
                      {formatEgp(remaining)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={cfg.variant}>
                        <cfg.icon className="me-1 size-3" />
                        {debtStatusLabels[status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {formatDate(debt.dueDate)}
                    </TableCell>
                    <TableCell className="text-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPaymentSheet(debt)
                          setPaymentAmount('')
                        }}
                        className="rounded-full touch-target"
                      >
                        تسجيل دفعة
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>

        <PaginationBar
          page={safePage}
          pageCount={pageCount}
          onChange={goToPage}
          totalCount={pageResult?.totalCount ?? 0}
        />
        </>
      )}

      <Sheet open={!!paymentSheet} onOpenChange={(o) => { if (!o) { setPaymentSheet(null); setPaymentAmount('') } }}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="text-end">
            <SheetTitle>تسجيل دفعة</SheetTitle>
            <SheetDescription>
              تسجيل دفعة جزئية أو كاملة للعميل {paymentSheet?.clientName ?? ''}
            </SheetDescription>
          </SheetHeader>
          {paymentSheet && (
            <div className="space-y-4 px-4 pb-6 pt-2">
              <div className="space-y-2 rounded-2xl border border-warning/25 bg-warning/5 p-3">
                <div className="flex justify-between text-[14px]">
                  <span className="text-muted-foreground">المستحق</span>
                  <span className="font-semibold tabular-nums text-foreground">{formatEgp(paymentSheet.amountOwed)}</span>
                </div>
                <div className="flex justify-between text-[14px]">
                  <span className="text-muted-foreground">المدفوع سابقاً</span>
                  <span className="font-semibold tabular-nums text-success">{formatEgp(paymentSheet.paidAmount)}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between text-[15px]">
                  <span className="font-bold text-warning">المتبقي</span>
                  <span className="rounded-lg bg-warning px-2 py-1 font-bold tabular-nums text-white shadow-sm">
                    {formatEgp(Math.round(paymentSheet.amountOwed - paymentSheet.paidAmount))}
                  </span>
                </div>
              </div>

              <div className="space-y-2 rounded-2xl border-2 border-primary/25 bg-primary/5 p-3">
                <Label className="text-[15px] font-bold text-primary">مبلغ الدفعة</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="no-number-spin h-12 touch-target rounded-xl border-primary/40 bg-white text-[17px] font-bold tabular-nums focus-visible:ring-primary/30"
                />
              </div>

                  <Button
                    type="button"
                    onClick={() => paymentMutation.mutate()}
                    disabled={paymentMutation.isPending || !paymentAmount || Number(paymentAmount) <= 0}
                    className="h-12 w-full gap-2 rounded-full touch-target"
                  >
                    {paymentMutation.isPending ? 'جارٍ الحفظ...' : 'تأكيد الدفعة'}
                  </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={newDebtOpen} onOpenChange={(o) => { if (!o) { setNewDebtOpen(false); newDebtMutation.reset() } }}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl">
          <SheetHeader className="text-end">
            <SheetTitle>تسجيل مديونية عميل</SheetTitle>
            <SheetDescription>
              سجّل رصيداً على العميل (مدين) أو رصيداً لصالحه (دائن) — نقدي أو ذهب.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-6 pt-2">
            <div className="space-y-2">
              <Label className="text-[13px]">العميل *</Label>
              <Select
                value={newDebtForm.clientId}
                onValueChange={(v) => setNewDebtForm((f) => ({ ...f, clientId: v }))}
              >
                <SelectTrigger className="h-12 w-full rounded-[14px]">
                  <SelectValue placeholder="اختر العميل" />
                </SelectTrigger>
                <SelectContent>
                  {customers.length === 0 ? (
                    <p className="py-3 text-center text-[13px] text-muted-foreground">
                      لا يوجد عملاء مسجّلون.
                    </p>
                  ) : (
                    customers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[13px]">النوع</Label>
              <div className="flex items-center gap-1 rounded-full border border-black/10 bg-black/5 p-1">
                <button
                  type="button"
                  onClick={() => setNewDebtForm((f) => ({ ...f, debtType: 'debit' }))}
                  className={cn(
                    'flex h-10 flex-1 touch-target items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold transition-colors',
                    newDebtForm.debtType === 'debit'
                      ? 'bg-primary text-white'
                      : 'text-muted-foreground hover:bg-black/5',
                  )}
                >
                  <AlertTriangle className="size-4" />
                  مدين (عليه للمحل)
                </button>
                <button
                  type="button"
                  onClick={() => setNewDebtForm((f) => ({ ...f, debtType: 'credit' }))}
                  className={cn(
                    'flex h-10 flex-1 touch-target items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold transition-colors',
                    newDebtForm.debtType === 'credit'
                      ? 'bg-success text-white'
                      : 'text-muted-foreground hover:bg-black/5',
                  )}
                >
                  <CheckCircle2 className="size-4" />
                  دائن (له رصيد لدى المحل)
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[13px]">نوع الرصيد</Label>
              <div className="flex items-center gap-1 rounded-full border border-black/10 bg-black/5 p-1">
                <button
                  type="button"
                  onClick={() => setNewDebtForm((f) => ({ ...f, balanceType: 'cash' }))}
                  className={cn(
                    'flex h-10 flex-1 touch-target items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold transition-colors',
                    newDebtForm.balanceType === 'cash'
                      ? 'bg-primary text-white'
                      : 'text-muted-foreground hover:bg-black/5',
                  )}
                >
                  <Coins className="size-4" />
                  نقدي (ج.م)
                </button>
                <button
                  type="button"
                  onClick={() => setNewDebtForm((f) => ({ ...f, balanceType: 'gold' }))}
                  className={cn(
                    'flex h-10 flex-1 touch-target items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold transition-colors',
                    newDebtForm.balanceType === 'gold'
                      ? 'bg-warning text-white'
                      : 'text-muted-foreground hover:bg-black/5',
                  )}
                >
                  <Scale className="size-4" />
                  ذهب (جم)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[13px]">
                  القيمة ({newDebtForm.balanceType === 'gold' ? 'جم' : 'ج.م'}) *
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newDebtForm.amountOwed}
                  onChange={(e) => setNewDebtForm((f) => ({ ...f, amountOwed: e.target.value }))}
                  placeholder="0.00"
                  className="no-number-spin h-12 touch-target rounded-[14px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">سداد فوري (اختياري)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newDebtForm.paidAmount}
                  onChange={(e) => setNewDebtForm((f) => ({ ...f, paidAmount: e.target.value }))}
                  placeholder="0.00"
                  className="no-number-spin h-12 touch-target rounded-[14px]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[13px]">تاريخ الاستحقاق</Label>
              <Input
                type="date"
                value={newDebtForm.dueDate}
                onChange={(e) => setNewDebtForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="h-12 touch-target rounded-[14px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[13px]">البيان / السبب (اختياري)</Label>
              <Input
                value={newDebtForm.description}
                onChange={(e) => setNewDebtForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="مثال: فارق استبدال ذهب، رصيد سابق..."
                className="h-12 touch-target rounded-[14px]"
              />
            </div>

            {newDebtForm.balanceType === 'cash' &&
              Number(newDebtForm.paidAmount) > 0 && (
                <p className="rounded-xl bg-warning/10 px-3 py-2 text-[13px] leading-[1.6] text-foreground">
                  سيُوجَّه السداد الفوري إلى حركة الخزينة النقدي{' '}
                  {newDebtForm.debtType === 'credit' ? '(خروج — سداد رصيد العميل الدائن)' : '(دخول — تسديد مديونية العميل)'}.
                </p>
              )}
            {newDebtForm.balanceType === 'gold' &&
              Number(newDebtForm.paidAmount) > 0 && (
                <p className="rounded-xl bg-secondary px-3 py-2 text-[13px] leading-[1.6] text-foreground">
                  رصيد ذهب — لن يُضاف السداد الفوري إلى الخزينة النقدي.
                </p>
              )}

            <Button
              type="button"
              onClick={() => newDebtMutation.mutate()}
              disabled={newDebtMutation.isPending}
              className="h-12 w-full gap-2 rounded-full touch-target"
            >
              {newDebtMutation.isPending ? (
                <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Plus className="size-5" />
              )}
              {newDebtMutation.isPending ? 'جارٍ الحفظ...' : 'تسجيل المديونية'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
