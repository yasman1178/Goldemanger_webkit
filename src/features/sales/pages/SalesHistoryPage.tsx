import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Clock,
  Eye,
  Plus,
  ReceiptText,
  Scale,
  SearchX,
  Wallet,
} from 'lucide-react'

import { getSalesPage } from '@/features/sales/api'
import { SaleReceiptDialog } from '@/features/sales/components/pos/SaleReceiptDialog'
import { getBranchDebts } from '@/features/debts/api'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { formatEgp, formatNumber } from '@/shared/lib/utils'
import { PAGE_SIZE, usePaginablePage } from '@/shared/lib/pagination'
import { PaginationBar } from '@/shared/components/ui/pagination'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Fab } from '@/shared/components/ui/fab'
import { Input } from '@/shared/components/ui/input'

function formatDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

function SaleCardSkeleton() {
  return (
    <Card className="rounded-[18px] border border-black/8 bg-white p-4 elevation-card space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="size-8 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-14 rounded-xl" />
      <Skeleton className="h-16 rounded-xl" />
      <div className="flex justify-between pt-1">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>
    </Card>
  )
}

export function SalesHistoryPage() {
  const navigate = useNavigate()
  const activeBranchId = useActiveBranchId()
  const [query, setQuery] = useState('')
  const [printTarget, setPrintTarget] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  const { data: pageResult, isLoading, isError } = useQuery({
    queryKey: ['sales', activeBranchId, 'page', page, query.trim()],
    queryFn: () =>
      getSalesPage({
        branchId: activeBranchId ?? undefined,
        page,
        q: query.trim() || undefined,
      }),
    enabled: !!activeBranchId,
  })

  const sales = pageResult?.data ?? []
  const { page: safePage, pageCount, goToPage, reset } = usePaginablePage(
    pageResult?.totalCount ?? 0,
    page,
    PAGE_SIZE,
    setPage,
  )

  const { data: debts = [] } = useQuery({
    queryKey: ['debts', activeBranchId],
    queryFn: () => getBranchDebts(activeBranchId ?? 0),
    enabled: !!activeBranchId,
  })

  const debtSaleIds = useMemo(() => new Set(debts.map((d) => d.saleId)), [debts])

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[34px] font-bold leading-[1.2] text-foreground">
            سجلات المبيعات
          </h1>
          <p className="text-muted-foreground">استعراض فواتير البيع الصادرة</p>
        </div>
        <Button
          onClick={() => navigate('/app/sales')}
          className="h-12 gap-2 rounded-full px-6 touch-target"
        >
          <Plus className="size-5" />
          <span className="hidden sm:inline">بيع جديد</span>
        </Button>
      </div>

      <div className="relative">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            reset()
          }}
          placeholder="ابحث بالعميل أو رقم الفاتورة أو المبلغ..."
          className="search-field h-12 touch-target pe-24"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              reset()
            }}
            className="absolute end-2 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-full px-3 py-1 text-[12px] text-primary hover:bg-primary/10 touch-target"
          >
            <SearchX className="size-4" />
            مسح
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SaleCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center py-20 text-error">
          تعذّر تحميل المبيعات.
        </div>
      ) : sales.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/10 bg-white py-20 text-center">
          <ReceiptText className="size-12 text-muted-foreground" />
          <p className="text-[17px] font-semibold text-foreground">
            {query ? 'لا توجد نتائج مطابقة' : 'لا توجد مبيعات بعد'}
          </p>
          <p className="text-sm text-muted-foreground">
            {query ? 'جرّب كلمة بحث أخرى.' : 'ستظهر هنا فواتير البيع الصادرة من هذا الفرع.'}
          </p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sales.map((s) => {
            const pieces = (s.saleItems ?? []).reduce(
              (sum, i) => sum + (i.quantity ?? 0),
              0,
            )
            const totalWeight = (s.saleItems ?? []).reduce(
              (sum, i) => sum + (i.weight ?? 0) * (i.quantity ?? 1),
              0,
            )
            const hasDebt = s.saleId != null && debtSaleIds.has(s.saleId)
            const customerLabel = s.customerName?.trim() || 'عميل نقدي'
            const initialLetter = customerLabel.charAt(0)

            return (
              <Card
                key={s.saleId}
                className="group relative flex flex-col justify-between overflow-hidden rounded-[18px] border border-black/8 bg-white shadow-xs elevation-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                {/* شريط تمييز علوي ذهبي أزرق */}
                <div className="h-1.5 w-full bg-gradient-to-r from-primary via-amber-400 to-primary/30" />

                <div className="p-4 space-y-3.5">
                  {/* رأس الكارت: رقم الفاتورة والحالة والوقت */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <ReceiptText className="size-4" />
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[15px] font-black text-foreground">
                            فاتورة بيع #{s.saleId}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
                          <Clock className="size-3" />
                          {formatDate(s.saleDate)}
                        </span>
                      </div>
                    </div>

                    {hasDebt ? (
                      <Badge
                        variant="secondary"
                        className="bg-warning/15 text-warning-foreground border border-warning/30 text-[11px] font-bold px-2 py-0.5 rounded-full"
                      >
                        <Wallet className="me-1 size-3 text-warning" />
                        عليها مديونية
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-full"
                      >
                        <CheckCircle2 className="me-1 size-3 text-emerald-600" />
                        مسددة بالكامل
                      </Badge>
                    )}
                  </div>

                  {/* بيانات العميل */}
                  <div className="flex items-center gap-2.5 rounded-[12px] bg-secondary/50 p-2.5">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-bold shadow-xs">
                      {initialLetter}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold text-foreground">
                        {customerLabel}
                      </p>
                    </div>
                    {s.discount > 0 && (
                      <span className="shrink-0 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                        خصم {formatEgp(s.discount)}
                      </span>
                    )}
                  </div>

                  {/* شريط الإجماليات والذهب */}
                  <div className="flex items-baseline justify-between border-b border-black/5 pb-2.5">
                    <div>
                      <span className="text-[11px] font-semibold text-muted-foreground block">
                        إجمالي الفاتورة
                      </span>
                      <span className="text-[22px] font-black tabular-nums text-foreground tracking-tight">
                        {formatEgp(s.totalAmount ?? 0)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-end">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-black/5 px-2 py-1 text-[12px] font-bold text-foreground tabular-nums">
                        {formatNumber(pieces)} قطعة
                      </span>
                      {totalWeight > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 text-amber-800 border border-amber-300/40 px-2 py-1 text-[12px] font-bold tabular-nums">
                          <Scale className="size-3 text-amber-700" />
                          {formatNumber(totalWeight)} جم ذهب
                        </span>
                      )}
                    </div>
                  </div>

                  {/* درج استعراض القطع المباعة */}
                  {s.saleItems && s.saleItems.length > 0 && (
                    <div className="space-y-1.5 rounded-[12px] bg-black/[0.02] p-2.5 border border-black/5">
                      <div className="flex flex-col divide-y divide-black/5">
                        {s.saleItems.slice(0, 3).map((i) => (
                          <div
                            key={i.saleItemId ?? `${s.saleId}-${i.productId}`}
                            className="flex items-center justify-between gap-2 py-1 text-[12px] first:pt-0 last:pb-0"
                          >
                            <span className="truncate font-medium text-foreground flex items-center gap-1.5">
                              <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                              {i.productName}
                            </span>
                            <span className="shrink-0 tabular-nums text-muted-foreground font-semibold">
                              {formatNumber(i.weight ?? 0)} جم × {i.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                      {s.saleItems.length > 3 && (
                        <p className="text-[11px] text-muted-foreground pt-1 text-center font-bold">
                          + {s.saleItems.length - 3} قطع إضافية بالفاتورة
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* تذييل الكارت والإجراءات */}
                <div className="flex items-center justify-between border-t border-black/5 bg-secondary/30 p-3">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    فاتورة رسمية مختومة
                  </span>

                  <Button
                    type="button"
                    onClick={() => setPrintTarget(s.saleId)}
                    className="h-9 gap-1.5 rounded-full px-4 text-xs font-bold touch-target shadow-xs"
                  >
                    <Eye className="size-3.5" />
                    <span>عرض وطباعة</span>
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>

        <PaginationBar
          page={safePage}
          pageCount={pageCount}
          onChange={goToPage}
          totalCount={pageResult?.totalCount ?? 0}
        />
        </>
      )}

      <SaleReceiptDialog
        open={printTarget != null}
        saleId={printTarget ?? 0}
        onClose={() => setPrintTarget(null)}
      />

      <Fab
        aria-label="بيع جديد"
        className="fixed bottom-6 end-6 z-40"
        onClick={() => navigate('/app/sales')}
      >
        <Plus />
      </Fab>
    </div>
  )
}