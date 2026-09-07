import { useMemo, useState } from 'react'
import {
  Banknote,
  ShoppingCart,
  Store,
  TrendingUp,
  Wallet,
  Package,
  Boxes,
  Plus,
  Minus,
  ReceiptText,
  ChevronLeft,
  Clock3,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { cn, formatEgp, formatNumber } from '@/shared/lib/utils'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { Fab } from '@/shared/components/ui/fab'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { depositCash, withdrawCash } from '@/features/cash/api'
import { invalidateShopData } from '@/shared/lib/invalidateShop'
import { DepositDialog } from '@/features/cash/components/DepositDialog'
import { WithdrawDialog } from '@/features/cash/components/WithdrawDialog'
import { getOverview } from '@/features/settings/api'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { useAuthStore } from '@/shared/stores/auth-store'
import { getSales } from '@/features/sales/api'
import { getPurchases, getPurchase } from '@/features/purchases/api'
import { PurchaseReceiptDialog, type ReceiptParty } from '@/features/purchases/components/PurchaseReceiptDialog'
import type { Purchase } from '@/features/purchases/types'
import { getCustomers } from '@/shared/lib/parties'
import { getDashboardStats, closeDay } from '@/features/dashboard/api'
import type { DayCloseSummary } from '@/features/dashboard/types'
import { SaleReceiptDialog } from '@/features/sales/components/pos/SaleReceiptDialog'
import { CloseDayDialog } from '@/features/dashboard/components/CloseDayDialog'
import { InstallAppButton } from '@/features/public-site/components/InstallAppButton'

interface Metric {
  label: string
  value: string
  icon: typeof ShoppingCart
  tone: 'neutral' | 'success' | 'warning' | 'error'
}

const toneText: Record<Metric['tone'], string> = {
  neutral: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
}

const toneChip: Record<Metric['tone'], string> = {
  neutral: 'bg-foreground/10 text-foreground',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
}

const quickActions = [
  { label: 'بيع جديد', icon: ShoppingCart, to: '/app/sales', chip: 'bg-success/10 text-success' },
  { label: 'فاتورة شراء', icon: Store, to: '/app/purchases/new', chip: 'bg-amber-500/10 text-amber-600' },
  { label: 'تعريف منتج', icon: Package, to: '/app/products', chip: 'bg-primary/10 text-primary' },
  { label: 'الجرد', icon: Boxes, to: '/app/inventory', chip: 'bg-warning/10 text-warning' },
  { label: 'الخزينة', icon: Banknote, to: '/app/cash', chip: 'bg-foreground/10 text-foreground' },
  { label: 'المديونيات', icon: Wallet, to: '/app/debts', chip: 'bg-error/10 text-error' },
]

export function DashboardPage() {
  const navigate = useNavigate()
  const branchDetails = useAuthStore((s) => s.branchDetails)
  const branchId = useAuthStore((s) => s.branchId)
  const activeBranchId = useActiveBranchId()
  const [receiptSaleId, setReceiptSaleId] = useState<number | null>(null)
  const [receiptPurchase, setReceiptPurchase] = useState<{
    purchase: Purchase
    party: ReceiptParty | null
    isCustomer: boolean
  } | null>(null)
  const [depositOpen, setDepositOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [closeDaySummary, setCloseDaySummary] = useState<DayCloseSummary | null>(null)
  const queryClient = useQueryClient()
  const isOwner = useAuthStore((s) => s.user?.roles ?? []).includes('Owner')
  const isResponsible = useAuthStore((s) => s.user?.roles ?? []).includes('Responsible')
  const isManager = useAuthStore((s) => s.user?.roles ?? []).includes('Manager')
  const isSale = useAuthStore((s) => s.user?.roles ?? []).includes('Sale')
  const canCloseDay = isOwner || isResponsible || isManager || isSale

  const { data: overview } = useQuery({
    queryKey: ['overview'],
    queryFn: getOverview,
    enabled: isOwner,
  })

  const setSelectedBranchId = useAuthStore((s) => s.setSelectedBranchId)

  const branches = useMemo(
    () =>
      overview?.branches.map((b) => ({
        branchId: b.branchId,
        branchName: b.branchName,
      })) ?? [],
    [overview],
  )

  const depositMutation = useMutation({
    mutationFn: ({ amount, targetBranchId }: { amount: number; targetBranchId?: number }) =>
      depositCash(amount, targetBranchId),
    onSuccess: () => {
      toast.success('تم إيداع الرصيد بنجاح')
      invalidateShopData(queryClient)
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
      invalidateShopData(queryClient)
      setWithdrawOpen(false)
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'فشل سحب الرصيد. تأكد من الرصيد المتاح.')
    },
  })

  const closeDayMutation = useMutation({
    mutationFn: closeDay,
    onSuccess: (data) => {
      setCloseDaySummary(data)
      invalidateShopData(queryClient)
      toast.success('تم إغلاق اليوم بنجاح')
    },
    onError: () => {
      toast.error('فشل إغلاق اليوم. حاول مرة أخرى.')
    },
  })

  const {
    data: dashboard,
    isLoading: statsLoading,
    error,
  } = useQuery({
    queryKey: ['dashboard-stats', activeBranchId],
    queryFn: () => getDashboardStats(activeBranchId ?? undefined),
  })

  const { data: sales = [], isLoading: salesLoading } = useQuery({
    queryKey: ['sales', activeBranchId],
    queryFn: () => getSales(activeBranchId ?? undefined),
  })

  const { data: purchases = [], isLoading: purchasesLoading } = useQuery({
    queryKey: ['purchases', activeBranchId],
    queryFn: () => getPurchases(activeBranchId ?? undefined),
  })

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
  })

  const loading =
    statsLoading || (error != null ? !branchDetails : !dashboard && !branchDetails)

  const recentSales = useMemo(() => sales.slice(0, 5), [sales])

  const todaySalesCount = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    return sales.filter((s) => new Date(s.saleDate).getTime() >= start).length
  }, [sales])

  const todaySalesTotal = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    return sales
      .filter((s) => new Date(s.saleDate).getTime() >= start)
      .reduce((sum, s) => sum + (s.totalAmount ?? 0), 0)
  }, [sales])

  const recentPurchases = useMemo(() => purchases.slice(0, 5), [purchases])

  const todayPurchasesCount = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    return purchases.filter((p) => new Date(p.date).getTime() >= start).length
  }, [purchases])

  const todayPurchasesTotal = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    return purchases
      .filter((p) => new Date(p.date).getTime() >= start)
      .reduce((sum, p) => sum + (p.totalAmount ?? 0), 0)
  }, [purchases])

  async function openPurchaseReceipt(purchase: Purchase) {
    const full = await getPurchase(purchase.id)
    const target = full ?? purchase
    const party =
      target.supplierName || target.supplierPhone
        ? { name: target.supplierName ?? null, phone: target.supplierPhone ?? null }
        : null
    const isCustomer =
      target.supplierId != null && customers.some((c) => c.id === target.supplierId)
    setReceiptPurchase({ purchase: target, party, isCustomer })
  }

  const stats: Metric[] = [
    {
      label: 'المبيعات اليوم',
      value: formatEgp(dashboard?.totalSales ?? branchDetails?.totalSales ?? 0),
      icon: ShoppingCart,
      tone: 'success',
    },
    {
      label: 'الخزينة اليوم',
      value: formatEgp(dashboard?.totalCash ?? branchDetails?.totalCash ?? 0),
      icon: Banknote,
      tone: 'neutral',
    },
    {
      label: 'الديون اليوم',
      value: formatEgp(dashboard?.totalDebts ?? branchDetails?.totalDebts ?? 0),
      icon: Wallet,
      tone: 'warning',
    },
    {
      label: 'المصروفات اليوم',
      value: formatEgp(dashboard?.totalExpenses ?? branchDetails?.totalExpenses ?? 0),
      icon: TrendingUp,
      tone: 'error',
    },
  ]

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold leading-[1.45] text-foreground">لوحة التحكم</h1>
        <InstallAppButton />
      </div>
      <div
        className={cn(
          'grid grid-cols-2 gap-3',
          canCloseDay ? 'sm:grid-cols-3 md:grid-cols-5' : 'sm:grid-cols-4',
        )}
      >
        {stats.map((s) => (
          <Card
            key={s.label}
            size="sm"
            className="rounded-[14px] elevation-card"
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2 text-[13px] font-semibold leading-[1.35] text-muted-foreground">
                <span>{s.label}</span>
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-lg',
                    toneChip[s.tone],
                  )}
                >
                  <s.icon className="size-4" />
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-7 w-24 rounded-lg" />
              ) : (
                <div
                  className={cn(
                    'tabular-nums text-[24px] font-bold leading-[1.1]',
                    toneText[s.tone],
                  )}
                >
                  {s.value}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {canCloseDay && (
          <Card
            size="sm"
            className="rounded-[14px] border border-primary/15 bg-primary/[0.03] elevation-card"
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2 text-[13px] font-semibold leading-[1.35] text-muted-foreground">
                <span>إغلاق اليوم</span>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Clock3 className="size-4" />
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                onClick={() => {
                  if (window.confirm('هل تريد إغلاق اليوم؟ سيتم جلب كل العمليات وطباعة التقرير.')) {
                    closeDayMutation.mutate()
                  }
                }}
                disabled={closeDayMutation.isPending}
                className="h-11 w-full gap-2 rounded-full text-[14px] font-semibold touch-target"
              >
                <Clock3 className="size-4" />
                {closeDayMutation.isPending ? 'جارٍ الإغلاق...' : 'إغلاق اليوم'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {isOwner && overview && overview.branches.length > 0 && (
        <section>
          <h2 className="mb-3 text-[17px] font-semibold leading-[1.45] text-foreground">
            الفروع
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {overview.branches.map((b) => (
              <Card
                key={b.branchId}
                size="sm"
                onClick={() => {
                  setSelectedBranchId(b.branchId)
                  navigate('/app/sales')
                }}
                className="cursor-pointer rounded-[14px] elevation-card"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[15px] font-semibold leading-[1.35] text-foreground">
                    <Store className="size-4 text-primary" />
                    {b.branchName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">المبيعات</span>
                    <span className="font-bold tabular-nums text-foreground">
                      {formatEgp(Math.round(b.totalSales ?? 0))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">الخزينة</span>
                    <span className="font-bold tabular-nums text-foreground">
                      {formatEgp(Math.round(b.cash ?? 0))}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {isOwner && (
        <Card size="sm" className="rounded-[14px] elevation-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-[13px] font-semibold leading-[1.35] text-muted-foreground">
              <span>رصيد الخزينة</span>
              <Banknote className="size-4 text-muted-foreground/60" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-[1.6] text-muted-foreground">
              أضف أو اسحب نقداً من الخزينة. هذه العمليات متاحة لصاحب المحل فقط.
            </p>
            <div className="flex gap-2">
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
          </CardContent>
        </Card>
      )}

      <section>
        <h2 className="mb-3 text-[17px] font-semibold leading-[1.45] text-foreground">
          إجراءات سريعة
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {quickActions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => navigate(a.to)}
              className="flex items-center gap-3 rounded-2xl bg-card p-3 text-start transition-colors hover:bg-muted elevation-card touch-target"
            >
              <span
                className={cn(
                  'flex size-11 shrink-0 items-center justify-center rounded-xl',
                  a.chip,
                )}
              >
                <a.icon className="size-5" />
              </span>
              <span className="text-[14px] font-semibold leading-[1.3] text-foreground">
                {a.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShoppingCart className="size-5" />
              </span>
              <h2 className="text-[17px] font-semibold leading-[1.45] text-foreground">
                آخر المبيعات
                <span className="ms-2 align-middle text-[13px] font-semibold text-muted-foreground">
                  {todaySalesCount > 0 ? `${formatNumber(todaySalesCount)} فاتورة اليوم` : ''}
                </span>
              </h2>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate('/app/sales')}
              className="h-10 shrink-0 gap-1 rounded-full px-3 text-[14px] font-semibold text-primary touch-target"
            >
              عرض الكل
              <ChevronLeft className="size-4" />
            </Button>
          </div>

          <div className="mb-3 flex items-center justify-between gap-2 rounded-[14px] bg-primary/5 px-4 py-3">
            <span className="text-[13px] font-semibold text-muted-foreground">
              إجمالي مبيعات اليوم
            </span>
            <span className="text-[22px] font-bold leading-none tabular-nums text-primary">
              {formatEgp(Math.round(todaySalesTotal))}
            </span>
          </div>

          <Card size="sm" className="overflow-hidden rounded-[14px] elevation-card">
            {salesLoading ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : recentSales.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-6 text-center">
                <ReceiptText className="size-8 text-muted-foreground/60" />
                <p className="text-[15px] font-semibold text-foreground">
                  لا توجد مبيعات بعد
                </p>
                <p className="text-sm text-muted-foreground">
                  ستظهر هنا آخر الفواتير الصادرة من هذا الفرع.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-black/5">
                {recentSales.map((s) => {
                  const pieces = (s.saleItems ?? []).reduce(
                    (sum, i) => sum + (i.quantity ?? 0),
                    0,
                  )
                  return (
                    <li key={s.saleId}>
                      <button
                        type="button"
                        onClick={() => setReceiptSaleId(s.saleId)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-start transition-colors hover:bg-muted touch-target"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[13px] font-bold tabular-nums text-primary">
                              #{s.saleId}
                            </span>
                            <span className="truncate text-[14px] font-semibold text-foreground">
                              {s.customerName?.trim() || 'عميل نقدي'}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[12px] text-muted-foreground">
                            {formatDateTime(s.saleDate)} • {formatNumber(pieces)} قطعة
                          </p>
                        </div>
                        <div className="shrink-0 text-end">
                          <span className="text-[15px] font-bold tabular-nums text-foreground">
                            {formatEgp(Math.round(s.totalAmount ?? 0))}
                          </span>
                          {s.discount > 0 && (
                            <p className="text-[11px] text-muted-foreground">
                              خصم {formatEgp(Math.round(s.discount))}
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Store className="size-5" />
              </span>
              <h2 className="text-[17px] font-semibold leading-[1.45] text-foreground">
                آخر المشتريات
                <span className="ms-2 align-middle text-[13px] font-semibold text-muted-foreground">
                  {todayPurchasesCount > 0
                    ? `${formatNumber(todayPurchasesCount)} فاتورة اليوم`
                    : ''}
                </span>
              </h2>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate('/app/purchases')}
              className="h-10 shrink-0 gap-1 rounded-full px-3 text-[14px] font-semibold text-amber-600 touch-target"
            >
              عرض الكل
              <ChevronLeft className="size-4" />
            </Button>
          </div>

          <div className="mb-3 flex items-center justify-between gap-2 rounded-[14px] bg-amber-500/10 px-4 py-3">
            <span className="text-[13px] font-semibold text-muted-foreground">
              إجمالي مشتريات اليوم
            </span>
            <span className="text-[22px] font-bold leading-none tabular-nums text-amber-600">
              {formatEgp(Math.round(todayPurchasesTotal))}
            </span>
          </div>

          <Card size="sm" className="overflow-hidden rounded-[14px] elevation-card">
            {purchasesLoading ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : recentPurchases.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-6 text-center">
                <Store className="size-8 text-muted-foreground/60" />
                <p className="text-[15px] font-semibold text-foreground">
                  لا توجد مشتريات بعد
                </p>
                <p className="text-sm text-muted-foreground">
                  ستظهر هنا آخر فواتير الشراء المسجلة في هذا الفرع.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-black/5">
                {recentPurchases.map((p) => {
                  const pieces =
                    p.productsDot && p.productsDot.length > 0
                      ? p.productsDot.reduce((sum, i) => sum + (i.quantity ?? 0), 0)
                      : (p.quantity ?? 0)
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => openPurchaseReceipt(p)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-start transition-colors hover:bg-muted touch-target"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[13px] font-bold tabular-nums text-amber-600">
                              #{p.id}
                            </span>
                            <span className="truncate text-[14px] font-semibold text-foreground">
                              {p.supplierName?.trim() || 'شراء نقدي'}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[12px] text-muted-foreground">
                            {formatDateTime(p.date)} • {formatNumber(pieces)} قطعة
                          </p>
                        </div>
                        <div className="shrink-0 text-end">
                          <span className="text-[15px] font-bold tabular-nums text-foreground">
                            {formatEgp(Math.round(p.totalAmount ?? 0))}
                          </span>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </section>
      </div>

      <SaleReceiptDialog
        open={Boolean(receiptSaleId)}
        saleId={receiptSaleId ?? 0}
        onClose={() => setReceiptSaleId(null)}
      />

      <PurchaseReceiptDialog
        open={receiptPurchase != null}
        purchase={receiptPurchase?.purchase ?? null}
        party={receiptPurchase?.party ?? null}
        isCustomer={receiptPurchase?.isCustomer ?? false}
        onClose={() => setReceiptPurchase(null)}
      />

      <DepositDialog
        open={depositOpen}
        onOpenChange={setDepositOpen}
        submitting={depositMutation.isPending}
        onSubmit={(amount, targetBranchId) =>
          depositMutation.mutate({ amount, targetBranchId })
        }
        branches={branches}
        defaultBranchId={branchId}
      />

      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        submitting={withdrawMutation.isPending}
        onSubmit={(amount, targetBranchId) =>
          withdrawMutation.mutate({ amount, targetBranchId })
        }
        branches={branches}
        defaultBranchId={branchId}
      />

      <CloseDayDialog
        open={closeDaySummary != null}
        summary={closeDaySummary}
        onClose={() => setCloseDaySummary(null)}
      />

      <Fab
        aria-label="بيع جديد"
        onClick={() => navigate('/app/sales')}
        className="fixed bottom-24 end-6 z-40 lg:bottom-6"
      >
        <Plus />
      </Fab>
    </div>
  )
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d)
}
