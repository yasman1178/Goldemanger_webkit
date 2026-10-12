import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Banknote, Eye, Plus, Minus, ReceiptText } from 'lucide-react'
import { useAuthStore } from '@/shared/stores/auth-store'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import {
  depositCash,
  withdrawCash,
  getCashFilteredPage,
  getCurrentCash,
} from '@/features/cash/api'
import { invalidateAfterCash } from '@/shared/lib/invalidateShop'
import { transactionLabels, type CashRecord, type TransactionType } from '@/shared/types/api'
import { cn, formatEgp } from '@/shared/lib/utils'
import { PAGE_SIZE, usePaginablePage } from '@/shared/lib/pagination'
import { PaginationBar } from '@/shared/components/ui/pagination'
import { getPurchase } from '@/features/purchases/api'
import {
  PurchaseReceiptDialog,
  type ReceiptParty,
} from '@/features/purchases/components/PurchaseReceiptDialog'
import type { Purchase } from '@/features/purchases/types'
import { getOverview } from '@/features/settings/api'
import { DepositDialog } from '@/features/cash/components/DepositDialog'
import { WithdrawDialog } from '@/features/cash/components/WithdrawDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'

function formatTime(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('ar-EG', {
    timeStyle: 'short',
  }).format(d)
}

function typeVariant(type: TransactionType) {
  if (type === 'Sale' || type === 'CardSale' || type === 'TransferSale') return 'default' as const
  if (type === 'Purchase' || type === 'Expense') return 'destructive' as const
  return 'secondary' as const
}

const cashTypeOrder: TransactionType[] = [
  'Sale',
  'Purchase',
  'Expense',
  'AmountOwed',
  'PurchaseUpdate',
  'PurchaseRefund',
  'Deposit',
  'Withdrawal',
  'EmployeeAdvance',
  'EmployeeRepayment',
  'DayClose',
  'CardSale',
  'TransferSale',
  'WeightAdjust',
]

function cashTypeValue(type: TransactionType): number {
  return cashTypeOrder.indexOf(type)
}

export function CashPage() {
  const queryClient = useQueryClient()
  const roles = useAuthStore((s) => s.user?.roles ?? [])
  const isOwner = roles.includes('Owner')
  const activeBranchId = useActiveBranchId()
  const [selected, setSelected] = useState<{
    record: CashRecord
    delta: number
  } | null>(null)
  const [depositOpen, setDepositOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [filterDate, setFilterDate] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [page, setPage] = useState(1)

  const { data: overview } = useQuery({
    queryKey: ['overview'],
    queryFn: getOverview,
    enabled: isOwner,
  })

  const branches = useMemo(
    () =>
      overview?.branches.map((b) => ({
        branchId: b.branchId,
        branchName: b.branchName,
      })) ?? [],
    [overview],
  )

  const { data: balance } = useQuery({
    queryKey: ['cash-current', activeBranchId],
    queryFn: () => getCurrentCash(activeBranchId ?? undefined),
  })

  const {
    data: pageResult,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['cash-today', filterDate, filterType, activeBranchId, 'page', page],
    queryFn: () =>
      getCashFilteredPage({
        date: filterDate || undefined,
        transactionType: filterType === 'all' ? undefined : Number(filterType),
        branchId: activeBranchId ?? undefined,
        page,
      }),
    enabled: !!activeBranchId,
  })

  const transactions = pageResult?.data ?? []
  const { page: safePage, pageCount, goToPage, reset } = usePaginablePage(
    pageResult?.totalCount ?? 0,
    page,
    PAGE_SIZE,
    setPage,
  )

  const depositMutation = useMutation({
    mutationFn: ({ amount, targetBranchId }: { amount: number; targetBranchId?: number }) =>
      depositCash(amount, targetBranchId),
    onSuccess: () => {
      toast.success('تم إيداع الرصيد بنجاح')
      invalidateAfterCash(queryClient)
      setDepositOpen(false)
    },
    onError: () => {
      toast.error('فشل إيداع الرصيد. تأكد من المبلغ.')
    },
  })

  const withdrawMutation = useMutation({
    mutationFn: ({ amount, targetBranchId }: { amount: number; targetBranchId?: number }) =>
      withdrawCash(amount, targetBranchId),
    onSuccess: () => {
      toast.success('تم سحب الرصيد بنجاح')
      invalidateAfterCash(queryClient)
      setWithdrawOpen(false)
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'فشل سحب الرصيد. تأكد من الرصيد المتاح.')
    },
  })

  const rows = useMemo(() => {
    const items = pageResult?.data ?? []
    const carry = pageResult?.carryAmount ?? 0
    return items.map((record, i) => {
      const prev = i + 1 < items.length ? items[i + 1].amount : carry
      return { record, delta: record.amount - prev }
    })
  }, [pageResult])

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-[34px] font-bold leading-[1.2] text-foreground">
          الخزينة
        </h1>
        <p className="text-muted-foreground">حركات الخزينة والرصيد الحالي</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
        <div className="space-y-1.5">
          <label
            htmlFor="cash-filter-date"
            className="text-[13px] font-semibold leading-[1.35] text-foreground"
          >
            اليوم
          </label>
          <Input
            id="cash-filter-date"
            type="date"
            value={filterDate}
            onChange={(e) => {
              setFilterDate(e.target.value)
              reset()
            }}
            className="h-11 rounded-[14px] touch-target"
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="cash-filter-type"
            className="text-[13px] font-semibold leading-[1.35] text-foreground"
          >
            نوع العملية
          </label>
          <Select
            value={filterType}
            onValueChange={(v) => {
              reset()
              setFilterType(v)
            }}
          >
            <SelectTrigger
              id="cash-filter-type"
              className="h-11 w-full min-w-40 rounded-[14px] touch-target"
            >
              <SelectValue placeholder="كل العمليات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل العمليات</SelectItem>
              {(Object.keys(transactionLabels) as TransactionType[]).map(
                (type) => (
                  <SelectItem
                    key={type}
                    value={String(cashTypeValue(type))}
                  >
                    {transactionLabels[type]}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card size="sm" className="rounded-[14px] elevation-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-[13px] font-semibold leading-[1.35] text-muted-foreground">
              <span>الرصيد الحالي</span>
              <Banknote className="size-4 text-muted-foreground/60" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="tabular-nums text-[24px] font-bold leading-[1.1] text-success">
              {formatEgp(balance?.amount ?? 0)}
            </div>
          </CardContent>
          {isOwner && (
            <div className="flex gap-2 px-5 pb-5">
              <Button
                type="button"
                onClick={() => setDepositOpen(true)}
                className="h-11 flex-1 gap-2 rounded-full touch-target"
              >
                <Plus className="size-4" />
                إيداع رصيد
              </Button>
              <Button
                type="button"
                onClick={() => setWithdrawOpen(true)}
                variant="destructive"
                className="h-11 flex-1 gap-2 rounded-full touch-target"
              >
                <Minus className="size-4" />
                سحب رصيد
              </Button>
            </div>
          )}
        </Card>

        <Card size="sm" className="rounded-[14px] elevation-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-[13px] font-semibold leading-[1.35] text-muted-foreground">
              <span>عدد الحركات</span>
              <ReceiptText className="size-4 text-muted-foreground/60" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="tabular-nums text-[24px] font-bold leading-[1.1] text-foreground">
              {pageResult?.totalCount ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          جارٍ تحميل الحركات...
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center py-20 text-error">
          تعذّر تحميل حركات الخزينة.
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/10 bg-white py-20 text-center">
          <Banknote className="size-12 text-muted-foreground" />
          <p className="text-[17px] font-semibold text-foreground">
            لا توجد حركات مطابقة
          </p>
          <p className="text-sm text-muted-foreground">
            لا توجد حركات خزينة ضمن اليوم ونوع العملية المحددين.
          </p>
        </div>
      ) : (
        <>
        <Card className="elevation-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الوقت</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>المرجع</TableHead>
                <TableHead className="text-end">المبلغ المؤثر</TableHead>
                <TableHead className="text-end">الرصيد بعد الحركة</TableHead>
                <TableHead className="text-end">التفاصيل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ record: t, delta }) => (
                <TableRow key={t.cashId}>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {formatTime(t.transactionDate)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={typeVariant(t.transactionType)}>
                      {transactionLabels[t.transactionType] ?? t.transactionType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {t.description
                      ? t.description
                      : t.saleId
                        ? `بيع #${t.saleId}`
                        : t.purchaseId
                          ? `شراء #${t.purchaseId}`
                          : t.expenseId
                            ? `مصروف #${t.expenseId}`
                            : '—'}
                    {t.userName && (
                      <span className="block text-[12px] text-muted-foreground/70">
                        بواسطة: {t.userName}
                      </span>
                    )}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-end tabular-nums font-bold',
                      delta < 0 ? 'text-error' : 'text-success',
                    )}
                  >
                    {delta < 0 ? '-' : '+'}
                    {formatEgp(Math.abs(delta))}
                  </TableCell>
                  <TableCell className="text-end tabular-nums font-semibold">
                    {formatEgp(t.amount)}
                  </TableCell>
                  <TableCell className="text-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelected({ record: t, delta })}
                      className="gap-1 rounded-full touch-target"
                    >
                      <Eye className="size-3.5" />
                      عرض
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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

      <CashDetailsDialog
        selected={selected}
        onClose={() => setSelected(null)}
      />

      <DepositDialog
        open={depositOpen}
        onOpenChange={setDepositOpen}
        submitting={depositMutation.isPending}
        onSubmit={(amount, targetBranchId) =>
          depositMutation.mutate({ amount, targetBranchId })
        }
        branches={branches}
        defaultBranchId={activeBranchId}
      />

      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        submitting={withdrawMutation.isPending}
        onSubmit={(amount, targetBranchId) =>
          withdrawMutation.mutate({ amount, targetBranchId })
        }
        branches={branches}
        defaultBranchId={activeBranchId}
      />
    </div>
  )
}

function formatFullDate(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d)
}

function CashDetailsDialog({
  selected,
  onClose,
}: {
  selected: { record: CashRecord; delta: number } | null
  onClose: () => void
}) {
  const t = selected?.record ?? null
  const [receipt, setReceipt] = useState<{
    purchase: Purchase
    party: ReceiptParty | null
  } | null>(null)

  async function openPurchaseInvoice() {
    if (!t?.purchaseId) return
    const purchase = await getPurchase(t.purchaseId)
    if (!purchase) return
    setReceipt({
      purchase,
      party: purchase.supplierName || purchase.supplierPhone
        ? { name: purchase.supplierName, phone: purchase.supplierPhone }
        : null,
    })
  }

  const delta = selected?.delta ?? 0

  return (
    <>
      <Dialog open={Boolean(t)} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {t
                ? `${
                    transactionLabels[t.transactionType] ?? t.transactionType
                  } — ${
                    t.saleId
                      ? `بيع #${t.saleId}`
                      : t.purchaseId
                        ? `شراء #${t.purchaseId}`
                        : t.expenseId
                          ? `مصروف #${t.expenseId}`
                          : 'حركة'
                  }`
                : ''}
            </DialogTitle>
            <DialogDescription>
              تفاصيل الحركة النقدية
            </DialogDescription>
          </DialogHeader>

          {t && (
            <div className="space-y-2.5 rounded-2xl bg-black/5 p-4 text-[14px]">
              {t.description && (
                <DetailRow label="الوصف" value={t.description} />
              )}
              <DetailRow label="الوقت" value={formatFullDate(t.transactionDate)} />
              <DetailRow
                label="المبلغ المؤثر"
                value={`${delta < 0 ? '-' : '+'}${formatEgp(Math.abs(delta))}`}
                valueClass={delta < 0 ? 'text-error' : 'text-success'}
              />
              <DetailRow label="الرصيد بعد الحركة" value={formatEgp(t.amount)} />
              {t.amountOwed != null && (
                <DetailRow label="المبلغ المستحق" value={formatEgp(t.amountOwed)} />
              )}
              {t.paidAmount != null && (
                <DetailRow label="المدفوع" value={formatEgp(t.paidAmount)} />
              )}
              {t.dueDate && (
                <DetailRow label="تاريخ الاستحقاق" value={formatFullDate(t.dueDate)} />
              )}
              {t.paymentDate && (
                <DetailRow label="تاريخ السداد" value={formatFullDate(t.paymentDate)} />
              )}
            </div>
          )}

          {t?.purchaseId && (
            <Button
              type="button"
              onClick={openPurchaseInvoice}
              className="h-11 w-full gap-2 rounded-full touch-target"
            >
              <ReceiptText className="size-4" />
              فتح فاتورة الشراء
            </Button>
          )}
        </DialogContent>
      </Dialog>

      <PurchaseReceiptDialog
        purchase={receipt?.purchase ?? null}
        party={receipt?.party ?? null}
        onClose={() => setReceipt(null)}
      />
    </>
  )
}

function DetailRow({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          'font-bold tabular-nums text-foreground',
          valueClass,
        )}
      >
        {value}
      </span>
    </div>
  )
}
