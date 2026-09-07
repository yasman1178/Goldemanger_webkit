import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Eye, Plus, ReceiptText, SearchX, Wallet } from 'lucide-react'

import { getSalesPage } from '@/features/sales/api'
import { SaleReceiptDialog } from '@/features/sales/components/pos/SaleReceiptDialog'
import { getBranchDebts } from '@/features/debts/api'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { formatEgp, formatNumber } from '@/shared/lib/utils'
import { PAGE_SIZE, usePaginablePage } from '@/shared/lib/pagination'
import { PaginationBar } from '@/shared/components/ui/pagination'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card'
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
    <Card className="elevation-card">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="size-11 rounded-2xl" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-16 rounded-2xl" />
      </CardContent>
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
            const hasDebt = s.saleId != null && debtSaleIds.has(s.saleId)
            return (
              <Card key={s.saleId} className="elevation-card overflow-hidden border-black/5 transition-shadow hover:shadow-md">
                <CardHeader className="flex-row items-start justify-between gap-3 bg-secondary/40">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-[17px] font-bold">فاتورة بيع #{s.saleId}</CardTitle>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      {formatDate(s.saleDate)}
                    </p>
                    <p className="mt-1 truncate text-[14px] font-semibold text-foreground">
                      {s.customerName?.trim() || 'عميل نقدي'}
                    </p>
                  </div>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                    <ReceiptText className="size-5" />
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{formatNumber(pieces)} قطعة</Badge>
                    {hasDebt && (
                      <Badge variant="secondary" className="bg-warning/10 text-warning">
                        <Wallet className="me-1 size-3" />
                        عليها مديونية
                      </Badge>
                    )}
                    {s.discount > 0 && (
                      <Badge variant="secondary">خصم {formatEgp(s.discount)}</Badge>
                    )}
                  </div>

                  {s.saleItems && s.saleItems.length > 0 && (
                    <div className="rounded-xl bg-secondary/70 p-3">
                      <div className="flex flex-col divide-y divide-black/5">
                        {s.saleItems.map((i) => (
                          <div
                            key={i.saleItemId ?? `${s.saleId}-${i.productId}`}
                            className="flex items-center justify-between gap-2 py-1.5 text-[13px] first:pt-0 last:pb-0"
                          >
                            <span className="truncate text-foreground">
                              {i.productName}
                            </span>
                            <span className="shrink-0 tabular-nums text-muted-foreground">
                              {formatNumber(i.weight ?? 0)} gm × {i.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="justify-between border-t bg-secondary/30 pt-0">
                  <span className="text-[20px] font-bold tabular-nums text-primary">
                    {formatEgp(s.totalAmount ?? 0)}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPrintTarget(s.saleId)}
                    className="gap-1.5 rounded-full touch-target"
                  >
                    <Eye className="size-4" />
                    عرض
                  </Button>
                </CardFooter>
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