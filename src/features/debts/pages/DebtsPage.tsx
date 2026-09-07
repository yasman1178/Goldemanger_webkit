import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import {
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  FileText,
} from 'lucide-react'

import { getBranchDebts, updateDebt } from '@/features/debts/api'
import {
  getDebtStatus,
  debtStatusLabels,
  type Debt,
  type DebtStatus,
} from '@/features/debts/types'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { formatEgp } from '@/shared/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Skeleton } from '@/shared/components/ui/skeleton'
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
  const queryClient = useQueryClient()
  const activeBranchId = useActiveBranchId()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<DebtStatus | 'all'>('all')
  const [paymentSheet, setPaymentSheet] = useState<Debt | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')

  const { data: debts = [], isLoading, isError } = useQuery({
    queryKey: ['debts', activeBranchId],
    queryFn: () => getBranchDebts(activeBranchId ?? 0),
    enabled: !!activeBranchId,
  })

  const paymentMutation = useMutation({
    mutationFn: async () => {
      if (!paymentSheet) return
      const amount = Number(paymentAmount) || 0
      const remaining = paymentSheet.amountOwed - paymentSheet.paidAmount
      if (amount <= 0 || amount > remaining) {
        throw new Error('invalid')
      }
      await updateDebt(paymentSheet.debtId, {
        ...paymentSheet,
        paidAmount: paymentSheet.paidAmount + amount,
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

  const filtered = debts.filter((d) => {
    const status = getDebtStatus(d)
    if (filterStatus !== 'all' && status !== filterStatus) return false
    if (searchQuery) {
      const name = d.clientName ?? ''
      const phone = d.clientPhone ?? ''
      const q = searchQuery.toLowerCase()
      return name.toLowerCase().includes(q) || phone.includes(q)
    }
    return true
  })

  const summary = {
    total: debts.reduce((s, d) => s + d.amountOwed, 0),
    paid: debts.reduce((s, d) => s + d.paidAmount, 0),
    remaining: debts.reduce((s, d) => s + (d.amountOwed - d.paidAmount), 0),
    overdue: debts.filter((d) => getDebtStatus(d) === 'overdue').length,
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[34px] font-bold leading-[1.2] text-foreground">
            المديونيات
          </h1>
          <p className="text-muted-foreground">إدارة ديون العملاء والمستحقات</p>
        </div>
        <Button
          type="button"
          variant="outline"
          asChild
          className="h-11 rounded-full touch-target"
        >
          <Link to="/app/debts/report">
            <FileText className="size-4" />
            التقرير المفصل
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card size="sm" className="rounded-[14px] elevation-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-[13px] font-semibold leading-[1.35] text-muted-foreground">
              <span>إجمالي الدين</span>
              <Wallet className="size-4 text-muted-foreground/60" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="tabular-nums text-[24px] font-bold leading-[1.1] text-foreground">
              {formatEgp(summary.total)}
            </div>
          </CardContent>
        </Card>

        <Card size="sm" className="rounded-[14px] elevation-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-[13px] font-semibold leading-[1.35] text-muted-foreground">
              <span>المدفوع</span>
              <CheckCircle2 className="size-4 text-success/60" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="tabular-nums text-[24px] font-bold leading-[1.1] text-success">
              {formatEgp(summary.paid)}
            </div>
          </CardContent>
        </Card>

        <Card size="sm" className="rounded-[14px] elevation-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-[13px] font-semibold leading-[1.35] text-muted-foreground">
              <span>المتبقي</span>
              <AlertTriangle className="size-4 text-warning/60" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="tabular-nums text-[24px] font-bold leading-[1.1] text-warning">
              {formatEgp(summary.remaining)}
            </div>
          </CardContent>
        </Card>

        <Card size="sm" className="rounded-[14px] elevation-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-[13px] font-semibold leading-[1.35] text-muted-foreground">
              <span>ديون متأخرة</span>
              <AlertTriangle className="size-4 text-error/60" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="tabular-nums text-[24px] font-bold leading-[1.1] text-error">
              {summary.overdue}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
              onClick={() => setFilterStatus(s)}
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
      ) : filtered.length === 0 ? (
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
              {filtered.map((debt) => {
                const status = getDebtStatus(debt)
                const remaining = Math.max(0, debt.amountOwed - debt.paidAmount)
                const cfg = statusConfig[status]
                return (
                  <TableRow key={debt.debtId}>
                    <TableCell className="font-semibold text-foreground">
                      {debt.clientName ?? `عميل #${debt.clientId ?? '—'}`}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatEgp(debt.amountOwed)}
                    </TableCell>
                    <TableCell className="tabular-nums text-success">
                      {formatEgp(debt.paidAmount)}
                    </TableCell>
                    <TableCell className="tabular-nums font-semibold text-warning">
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
                      {remaining > 0 && (
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
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
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
                    {formatEgp(paymentSheet.amountOwed - paymentSheet.paidAmount)}
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
    </div>
  )
}
