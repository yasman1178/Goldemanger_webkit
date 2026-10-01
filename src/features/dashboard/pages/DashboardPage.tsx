import { useMemo, useState } from 'react'
import {
  Banknote,
  ShoppingCart,
  Store,
  TrendingDown,
  Wallet,
  Package,
  Boxes,
  Plus,
  ReceiptText,
  ChevronLeft,
  Clock3,
  Gem,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { cn, formatEgp, formatNumber } from '@/shared/lib/utils'
import { Card } from '@/shared/components/ui/card'
import { Fab } from '@/shared/components/ui/fab'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { invalidateShopData } from '@/shared/lib/invalidateShop'
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
import { getFactoryProfit } from '@/features/profits/api'
import { factoryProfitQueryKey } from '@/features/profits/types'
import { resolvePeriod } from '@/shared/lib/period'

interface Metric {
  label: string
  value: string
  icon: typeof ShoppingCart
  tone: 'neutral' | 'success' | 'warning' | 'error'
  badge?: string
  to?: string
}

const quickActions = [
  { label: 'بيع', icon: ShoppingCart, to: '/app/sales', chip: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  { label: 'مشتريات', icon: Store, to: '/app/purchases/new', chip: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  { label: 'منتجات', icon: Package, to: '/app/products', chip: 'bg-primary/15 text-primary' },
  { label: 'جرد', icon: Boxes, to: '/app/inventory', chip: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  { label: 'خزينة', icon: Banknote, to: '/app/cash', chip: 'bg-purple-500/15 text-purple-600 dark:text-purple-400' },
  { label: 'مديونيات', icon: Wallet, to: '/app/debts', chip: 'bg-rose-500/15 text-rose-600 dark:text-rose-400' },
]

export function DashboardPage() {
  const navigate = useNavigate()
  const branchDetails = useAuthStore((s) => s.branchDetails)
  const activeBranchId = useActiveBranchId()
  const [receiptSaleId, setReceiptSaleId] = useState<number | null>(null)
  const [receiptPurchase, setReceiptPurchase] = useState<{
    purchase: Purchase
    party: ReceiptParty | null
    isCustomer: boolean
  } | null>(null)
  const [closeDaySummary, setCloseDaySummary] = useState<DayCloseSummary | null>(null)
  const queryClient = useQueryClient()
  const branchId = useAuthStore((s) => s.branchId)
  const isOwner = useAuthStore((s) => s.user?.roles ?? []).includes('Owner')
  const isResponsible = useAuthStore((s) => s.user?.roles ?? []).includes('Responsible')
  const isManager = useAuthStore((s) => s.user?.roles ?? []).includes('Manager')
  const isSale = useAuthStore((s) => s.user?.roles ?? []).includes('Sale')
  const canCloseDay = isOwner || isResponsible || isManager || isSale
  const hasValidBranch = Boolean(activeBranchId && activeBranchId > 0)

  // إذا كان صاحب محل جديد وليس لديه فرع أو شركة بعد، يتم توجيهه مباشرة لإعداد الشركة
  if (typeof window !== 'undefined' && isOwner && (!branchId || branchId <= 0)) {
    navigate('/app/settings', { replace: true })
  }

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
    enabled: hasValidBranch,
    retry: false,
  })

  // ربح مصنعية اليوم فقط (بدون تكلفة الذهب) — لصاحب المحل فقط.
  const today = useMemo(() => resolvePeriod('today'), [])
  const { data: todayProfit } = useQuery({
    queryKey: [
      factoryProfitQueryKey,
      activeBranchId,
      today.startDate,
      today.endDate,
    ],
    queryFn: () =>
      getFactoryProfit({
        startDate: today.startDate,
        endDate: today.endDate,
        branchId: activeBranchId ?? undefined,
      }),
    enabled: hasValidBranch && isOwner,
    retry: false,
  })

  // نفس اشتقاق صفحة الأرباح: إجمالي الخادم يبقى صفراً (يُجمَّع قبل حساب
  // أرباح الفواتير)، فيُجمع ربح اليوم من سطور الفواتير في الواجهة.
  const todayMakingProfit = useMemo(
    () =>
      (todayProfit?.sales ?? []).reduce(
        (sum, s) => sum + (s.makingProfit ?? 0),
        0,
      ),
    [todayProfit],
  )

  const { data: sales = [], isLoading: salesLoading } = useQuery({
    queryKey: ['sales', activeBranchId],
    queryFn: () => getSales(activeBranchId ?? undefined),
    enabled: hasValidBranch,
    retry: false,
  })

  const { data: purchases = [], isLoading: purchasesLoading } = useQuery({
    queryKey: ['purchases', activeBranchId],
    queryFn: () => getPurchases(activeBranchId ?? undefined),
    enabled: hasValidBranch,
    retry: false,
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
      label: 'إجمالي المديونية',
      value: formatEgp(dashboard?.totalDebts ?? branchDetails?.totalDebts ?? 0),
      icon: Wallet,
      tone: 'warning',
    },
    {
      label: 'المصروفات اليوم',
      value: formatEgp(dashboard?.totalExpenses ?? branchDetails?.totalExpenses ?? 0),
      icon: TrendingDown,
      tone: 'error',
    },
    ...(isOwner
      ? [
          {
            label: 'ربح المصنعية اليوم',
            value: formatEgp(todayMakingProfit),
            icon: Gem,
            tone: 'success' as const,
            badge: 'بدون تكلفة الذهب',
            to: '/app/profits',
          },
        ]
      : []),
  ]

  const totalCards = stats.length + (canCloseDay ? 1 : 0)
  const gridCols =
    totalCards >= 6
      ? 'sm:grid-cols-3 lg:grid-cols-6'
      : totalCards === 5
        ? 'sm:grid-cols-3 lg:grid-cols-5'
        : 'sm:grid-cols-2 lg:grid-cols-4'

  return (
    <div className="space-y-6 pb-20">
      <div className={cn('grid grid-cols-2 gap-2.5 sm:gap-3', gridCols)}>
        {stats.map((s) => {
          const config = {
            success: {
              border: 'border-emerald-500/25 hover:border-emerald-500/45',
              bg: 'bg-gradient-to-br from-white via-white to-emerald-50/60',
              iconBg: 'bg-emerald-500/15 text-emerald-600',
              valueColor: 'text-emerald-700 dark:text-emerald-400',
              badge: 'حركة البيع',
              badgeColor: 'bg-emerald-500/10 text-emerald-700',
            },
            neutral: {
              border: 'border-blue-500/25 hover:border-blue-500/45',
              bg: 'bg-gradient-to-br from-white via-white to-blue-50/60',
              iconBg: 'bg-blue-500/15 text-blue-600',
              valueColor: 'text-blue-900 dark:text-blue-200',
              badge: 'الرصيد النقدي',
              badgeColor: 'bg-blue-500/10 text-blue-700',
            },
            warning: {
              border: 'border-amber-500/25 hover:border-amber-500/45',
              bg: 'bg-gradient-to-br from-white via-white to-amber-50/60',
              iconBg: 'bg-amber-500/15 text-amber-600',
              valueColor: 'text-amber-700 dark:text-amber-400',
              badge: 'آجل ومستحق',
              badgeColor: 'bg-amber-500/10 text-amber-700',
            },
            error: {
              border: 'border-rose-500/25 hover:border-rose-500/45',
              bg: 'bg-gradient-to-br from-white via-white to-rose-50/60',
              iconBg: 'bg-rose-500/15 text-rose-600',
              valueColor: 'text-rose-700 dark:text-rose-400',
              badge: 'منصرفات',
              badgeColor: 'bg-rose-500/10 text-rose-700',
            },
          }[s.tone]
          const badgeText = s.badge ?? config.badge
          const cardClass = cn(
            'group relative flex flex-col justify-between rounded-[14px] border p-3 sm:p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm',
            config.border,
            config.bg,
            s.to && 'cursor-pointer touch-target text-start',
          )
          const cardInner = (
            <>
              <div className="flex items-center justify-between gap-1.5 pb-1">
                <span className="text-[12px] font-bold text-foreground/85 truncate">
                  {s.label}
                </span>
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-[9px] transition-transform group-hover:scale-105',
                    config.iconBg,
                  )}
                >
                  <s.icon className="size-3.5" />
                </span>
              </div>

              <div className="pt-0.5">
                {loading ? (
                  <Skeleton className="h-6 w-20 rounded-md" />
                ) : (
                  <div className="flex items-baseline justify-between gap-1">
                    <span
                      className={cn(
                        'tabular-nums text-[18px] sm:text-[20px] font-black tracking-tight leading-tight',
                        config.valueColor,
                      )}
                    >
                      {s.value}
                    </span>
                    <span
                      className={cn(
                        'hidden xl:inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                        config.badgeColor,
                      )}
                    >
                      {badgeText}
                    </span>
                  </div>
                )}
              </div>
            </>
          )

          if (s.to) {
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => navigate(s.to as string)}
                aria-label={`${s.label} — عرض التفاصيل`}
                title="عرض كشف الأرباح"
                className={cardClass}
              >
                {cardInner}
              </button>
            )
          }

          return (
            <div key={s.label} className={cardClass}>
              {cardInner}
            </div>
          )
        })}

        {canCloseDay && (
          <div className="group relative flex flex-col justify-between rounded-[14px] border border-primary/25 bg-gradient-to-br from-white via-white to-primary/[0.06] p-3 sm:p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm hover:border-primary/40">
            <div className="flex items-center justify-between gap-1.5 pb-1">
              <span className="text-[12px] font-bold text-foreground/85">
                إغلاق اليوم
              </span>
              <span className="flex size-7 shrink-0 items-center justify-center rounded-[9px] bg-primary/10 text-primary">
                <Clock3 className="size-3.5" />
              </span>
            </div>

            <Button
              type="button"
              onClick={() => {
                if (window.confirm('هل تريد إغلاق اليوم؟ سيتم جلب كل العمليات وطباعة التقرير.')) {
                  closeDayMutation.mutate()
                }
              }}
              disabled={closeDayMutation.isPending}
              className="mt-1 h-8 w-full gap-1.5 rounded-[10px] bg-primary px-2 text-[11px] font-bold text-white shadow-xs transition-all hover:bg-primary/90 active:scale-[0.98] touch-target"
            >
              <Clock3 className="size-3" />
              <span>{closeDayMutation.isPending ? 'جارٍ الإغلاق...' : 'إغلاق اليوم'}</span>
            </Button>
          </div>
        )}
      </div>

      <section aria-label="أزرار الوصول السريع">
        <div className="grid grid-cols-6 gap-1.5 sm:gap-2.5">
          {quickActions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => navigate(a.to)}
              className="group flex flex-col items-center justify-center gap-1 sm:flex-row sm:gap-2 rounded-[12px] border border-black/5 bg-white p-1.5 sm:px-2.5 sm:py-2 text-center sm:text-start shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-black/10 hover:bg-slate-50/90 hover:shadow-sm active:translate-y-0 touch-target"
              title={a.label}
            >
              <span
                className={cn(
                  'flex size-6 sm:size-7 shrink-0 items-center justify-center rounded-[8px] transition-transform duration-150 group-hover:scale-110',
                  a.chip,
                )}
              >
                <a.icon className="size-3.5 sm:size-4" />
              </span>
              <span className="truncate text-[11px] sm:text-[12.5px] font-bold text-foreground/90 group-hover:text-foreground">
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
