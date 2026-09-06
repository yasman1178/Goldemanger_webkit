import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Plus, ReceiptText, Trash2 } from 'lucide-react'

import {
  createExpense,
  deleteExpense,
  getExpenses,
} from '@/features/expenses/api'
import { formatEgp } from '@/shared/lib/utils'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Fab } from '@/shared/components/ui/fab'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'

function formatDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

export function ExpensesPage() {
  const queryClient = useQueryClient()
  const activeBranchId = useActiveBranchId()
  const [addOpen, setAddOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [descraption, setDescraption] = useState('')

  const { data: expenses = [], isLoading, isError } = useQuery({
    queryKey: ['expenses', activeBranchId],
    queryFn: () => getExpenses(activeBranchId ?? undefined),
  })

  const totalToday = expenses
    .filter((e) => {
      const s = new Date(e.expenseDate)
      const now = new Date()
      return (
        s.getFullYear() === now.getFullYear() &&
        s.getMonth() === now.getMonth() &&
        s.getDate() === now.getDate()
      )
    })
    .reduce((sum, e) => sum + e.amount, 0)

  const addMutation = useMutation({
    mutationFn: () =>
      createExpense({
        amount: Number(amount) || 0,
        descraption: descraption.trim(),
        branchId: activeBranchId ?? undefined,
      }),
    onSuccess: () => {
      toast.success('تم تسجيل المصروف')
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      setAddOpen(false)
      setAmount('')
      setDescraption('')
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? 'تعذّر تسجيل المصروف.')
    },
  })

  const removeMutation = useMutation({
    mutationFn: (id: number) => deleteExpense(id),
    onSuccess: () => {
      toast.success('تم حذف المصروف')
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
    onError: () => toast.error('تعذّر حذف المصروف.'),
  })

  const canAdd = Number(amount) > 0 && descraption.trim().length > 0

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[34px] font-bold leading-[1.2] text-foreground">
            المصروفات
          </h1>
          <p className="text-muted-foreground">إدارة مصروفات الفرع اليومية</p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="h-12 gap-2 rounded-full px-6 touch-target"
        >
          <Plus className="size-5" />
          <span className="hidden sm:inline">تسجيل مصروف</span>
        </Button>
      </div>

      <Card size="sm" className="rounded-[14px] elevation-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 text-[13px] font-semibold leading-[1.35] text-muted-foreground">
            <span>مصروفات اليوم</span>
            <ReceiptText className="size-4 text-muted-foreground/60" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="tabular-nums text-[24px] font-bold leading-[1.1] text-error">
            {formatEgp(totalToday)}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center py-20 text-error">
          تعذّر تحميل المصروفات.
        </div>
      ) : expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/10 bg-white py-20 text-center">
          <ReceiptText className="size-12 text-muted-foreground" />
          <p className="text-[17px] font-semibold text-foreground">
            لا توجد مصروفات
          </p>
          <p className="text-sm text-muted-foreground">
            اضغط "تسجيل مصروف" لإضافة أول بند — سيُخصم من الخزينة تلقائياً.
          </p>
        </div>
      ) : (
        <Card className="elevation-card overflow-hidden">
          <ul className="divide-y divide-black/5">
            {expenses.map((e) => (
              <li key={e.expenseId}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-foreground">
                      {e.descraption}
                    </p>
                    <p className="mt-0.5 flex items-center gap-2 text-[12px] text-muted-foreground">
                      {formatDate(e.expenseDate)}
                      <Badge variant="destructive">{formatEgp(e.amount)}</Badge>
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="حذف"
                    onClick={() => {
                      if (window.confirm('حذف هذا المصروف؟')) removeMutation.mutate(e.expenseId)
                    }}
                    className="shrink-0 rounded-full text-muted-foreground hover:text-destructive touch-target"
                  >
                    <Trash2 className="size-5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>تسجيل مصروف</DialogTitle>
            <DialogDescription>يُخصم المبلغ من الخزينة فوراً.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="exp-amount">المبلغ</Label>
              <Input
                id="exp-amount"
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
              <Label htmlFor="exp-desc">البيان</Label>
              <Input
                id="exp-desc"
                value={descraption}
                onChange={(e) => setDescraption(e.target.value)}
                placeholder="مثال: كهرباء، إيجار..."
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
              {addMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                'حفظ المصروف'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Fab
        aria-label="تسجيل مصروف"
        className="fixed bottom-6 end-6 z-40"
        onClick={() => setAddOpen(true)}
      >
        <Plus />
      </Fab>
    </div>
  )
}