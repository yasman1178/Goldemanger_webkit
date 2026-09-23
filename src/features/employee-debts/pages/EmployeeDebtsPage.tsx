import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Loader2,
  Users,
  Banknote,
} from 'lucide-react'

import {
  createEmployeeDebt,
  getBranchEmployeeDebts,
  getEmployees,
  payEmployeeDebt,
} from '@/features/employee-debts/api'
import {
  employeeDebtStatusLabels,
  getEmployeeDebtStatus,
  type EmployeeDebt,
  type EmployeeDebtStatus,
} from '@/features/employee-debts/types'
import { formatEgp } from '@/shared/lib/utils'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Fab } from '@/shared/components/ui/fab'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'

function formatDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(d)
}

const statusConfig: Record<
  EmployeeDebtStatus,
  { variant: 'default' | 'destructive' | 'secondary' | 'outline'; icon: typeof Wallet }
> = {
  unpaid: { variant: 'secondary', icon: AlertTriangle },
  partial: { variant: 'outline', icon: AlertTriangle },
  paid: { variant: 'default', icon: CheckCircle2 },
  overdue: { variant: 'destructive', icon: AlertTriangle },
}

export function EmployeeDebtsPage() {
  const queryClient = useQueryClient()
  const activeBranchId = useActiveBranchId()

  const [addOpen, setAddOpen] = useState(false)
  const [employeeId, setEmployeeId] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')

  const [paySheet, setPaySheet] = useState<EmployeeDebt | null>(null)
  const [payAmount, setPayAmount] = useState('')

  const { data: debts = [], isLoading, isError } = useQuery({
    queryKey: ['employee-debts', activeBranchId],
    queryFn: () => getBranchEmployeeDebts(activeBranchId ?? undefined),
  })

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', activeBranchId],
    queryFn: () => getEmployees(activeBranchId ?? undefined),
    staleTime: 5 * 60 * 1000,
  })

  const addMutation = useMutation({
    mutationFn: () =>
      createEmployeeDebt({
        employeeId,
        amount: Number(amount) || 0,
        notes: notes.trim() || undefined,
        dueDate: new Date().toISOString(),
        branchId: activeBranchId ?? undefined,
      }),
    onSuccess: () => {
      toast.success('تم تسجيل السلفة بنجاح')
      queryClient.invalidateQueries({ queryKey: ['employee-debts'] })
      setAddOpen(false)
      setEmployeeId('')
      setAmount('')
      setNotes('')
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? 'تعذّر تسجيل السلفة.')
    },
  })

  const payMutation = useMutation({
    mutationFn: async () => {
      if (!paySheet) return
      const val = Number(payAmount) || 0
      const remaining = paySheet.amount - paySheet.paidAmount
      if (val <= 0 || val > remaining) {
        throw new Error('invalid')
      }
      await payEmployeeDebt(paySheet.employeeDebtId, { amount: val })
    },
    onSuccess: () => {
      toast.success('تم تسجيل الدفعة')
      queryClient.invalidateQueries({ queryKey: ['employee-debts'] })
      setPaySheet(null)
      setPayAmount('')
    },
    onError: () => toast.error('قيمة دفع غير صالحة.'),
  })

  const summary = useMemo(
    () => ({
      total: debts.reduce((s, d) => s + d.amount, 0),
      paid: debts.reduce((s, d) => s + d.paidAmount, 0),
      remaining: debts.reduce((s, d) => s + d.remaining, 0),
    }),
    [debts],
  )

  const canAdd = !!employeeId && Number(amount) > 0

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[34px] font-bold leading-[1.2] text-foreground">
            مديونيات الموظفين
          </h1>
          <p className="text-muted-foreground">سلف ومديونيات موظفي الفرع</p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="hidden h-12 gap-2 rounded-full px-6 sm:inline-flex touch-target"
        >
          <Plus className="size-5" />
          تسجيل سلفة
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card size="sm" className="rounded-[14px] elevation-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-[13px] font-semibold leading-[1.35] text-muted-foreground">
              <span>إجمالي السلف</span>
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
              <span>المسدَّد</span>
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
              <span>عدد الموظفين</span>
              <Users className="size-4 text-muted-foreground/60" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="tabular-nums text-[24px] font-bold leading-[1.1] text-foreground">
              {employees.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center py-20 text-error">
          تعذّر تحميل مديونيات الموظفين.
        </div>
      ) : debts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/10 bg-white py-20 text-center">
          <Banknote className="size-12 text-muted-foreground" />
          <p className="text-[17px] font-semibold text-foreground">
            لا توجد سلف
          </p>
          <p className="text-sm text-muted-foreground">
            اضغط «تسجيل سلفة» لإضافة أول سلفة لموظف — ستُخصم من الخزينة تلقائياً.
          </p>
        </div>
      ) : (
        <Card className="elevation-card overflow-hidden">
          <ul className="divide-y divide-black/5">
            {debts.map((d) => {
              const status = getEmployeeDebtStatus(d)
              const cfg = statusConfig[status]
              return (
                <li key={d.employeeDebtId}>
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[15px] font-bold text-foreground">
                          {d.employeeName ?? 'موظف'}
                        </p>
                        <Badge variant={cfg.variant}>
                          <cfg.icon className="me-1 size-3" />
                          {employeeDebtStatusLabels[status]}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-muted-foreground">
                        <span>{formatDate(d.createdDate)}</span>
                        {!!d.notes && <span className="truncate">— {d.notes}</span>}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[13px]">
                        <span className="tabular-nums">
                          السلفة: <b className="text-foreground">{formatEgp(d.amount)}</b>
                        </span>
                        <span className="tabular-nums text-success">
                          المدفوع: {formatEgp(d.paidAmount)}
                        </span>
                        <span className="tabular-nums font-semibold text-warning">
                          المتبقي: {formatEgp(d.remaining)}
                        </span>
                      </div>
                    </div>
                    {d.remaining > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPaySheet(d)
                          setPayAmount('')
                        }}
                        className="shrink-0 rounded-full touch-target"
                      >
                        سداد
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>تسجيل سلفة</DialogTitle>
            <DialogDescription>تُخصم قيمة السلفة من الخزينة فوراً.</DialogDescription>
          </DialogHeader>

          <div className="p-5 sm:p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ed-employee">الموظف</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger id="ed-employee" className="h-12 w-full rounded-[14px]">
                  <SelectValue placeholder="اختر الموظف" />
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
              <Label htmlFor="ed-amount">المبلغ</Label>
              <Input
                id="ed-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-12 touch-target rounded-[14px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ed-notes">البيان (اختياري)</Label>
              <Input
                id="ed-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: سلفة صيانة، سلفة شهرية..."
                className="h-12 touch-target rounded-[14px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddOpen(false)}
              className="h-11 rounded-full px-6 touch-target"
            >
              رجوع
            </Button>
            <Button
              type="button"
              disabled={!canAdd || addMutation.isPending}
              onClick={() => addMutation.mutate()}
              className="h-11 rounded-full px-6 touch-target"
            >
              {addMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : 'حفظ السلفة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!paySheet} onOpenChange={(o) => { if (!o) { setPaySheet(null); setPayAmount('') } }}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="text-end">
            <SheetTitle>تسجيل سداد</SheetTitle>
            <SheetDescription>
              {paySheet ? `سداد من ${paySheet.employeeName ?? 'الموظف'}` : ''}
            </SheetDescription>
          </SheetHeader>
          {paySheet && (
            <div className="space-y-4 px-4 pb-6 pt-2">
              <div className="rounded-2xl bg-black/5 p-4 space-y-2">
                <div className="flex justify-between text-[14px]">
                  <span className="text-muted-foreground">قيمة السلفة</span>
                  <span className="font-semibold tabular-nums">{formatEgp(paySheet.amount)}</span>
                </div>
                <div className="flex justify-between text-[14px]">
                  <span className="text-muted-foreground">المسدَّد سابقاً</span>
                  <span className="font-semibold tabular-nums text-success">{formatEgp(paySheet.paidAmount)}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between text-[15px]">
                  <span className="font-semibold text-foreground">المتبقي</span>
                  <span className="font-bold tabular-nums text-warning">
                    {formatEgp(paySheet.remaining)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[15px] font-semibold">مبلغ السداد</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0.00"
                  className="h-12 touch-target rounded-[14px]"
                />
              </div>

              <Button
                type="button"
                onClick={() => payMutation.mutate()}
                disabled={payMutation.isPending || !payAmount || Number(payAmount) <= 0}
                className="h-12 w-full gap-2 rounded-full touch-target"
              >
                {payMutation.isPending ? 'جارٍ الحفظ...' : 'تأكيد السداد'}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Fab
        aria-label="تسجيل سلفة"
        className="fixed bottom-6 end-6 z-40 sm:hidden"
        onClick={() => setAddOpen(true)}
      >
        <Plus />
      </Fab>
    </div>
  )
}