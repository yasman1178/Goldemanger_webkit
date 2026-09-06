import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Eye, Images, PackagePlus, Plus, SearchX } from 'lucide-react'

import {
  getPurchase,
  getPurchases,
  getPurchasesByDate,
} from '@/features/purchases/api'
import { PurchaseReceiptDialog, type ReceiptParty } from '@/features/purchases/components/PurchaseReceiptDialog'
import { PurchaseImagesDialog } from '@/features/purchases/components/PurchaseImagesDialog'
import type { Purchase } from '@/features/purchases/types'
import { getCustomers, getSuppliers } from '@/shared/lib/parties'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { formatEgp, formatNumber } from '@/shared/lib/utils'
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

function PurchaseCardSkeleton() {
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

export function PurchasesPage() {
  const navigate = useNavigate()
  const activeBranchId = useActiveBranchId()
  const [query, setQuery] = useState('')
  const [dateResults, setDateResults] = useState<Purchase[] | null>(null)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [printTarget, setPrintTarget] = useState<{
    purchase: Purchase
    party: ReceiptParty | null
    isCustomer: boolean
  } | null>(null)
  const [imagesTargetId, setImagesTargetId] = useState<number | null>(null)

  const { data: purchases = [], isLoading, isError } = useQuery({
    queryKey: ['purchases', activeBranchId],
    queryFn: () => getPurchases(activeBranchId ?? undefined),
  })

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
    enabled: true,
  })
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
    enabled: true,
  })

  function openCreate() {
    navigate('/app/purchases/new')
  }

  async function runDateSearch() {
    if (!fromDate || !toDate) return
    if (new Date(fromDate) > new Date(toDate)) return
    setSearchLoading(true)
    try {
      const result = await getPurchasesByDate(fromDate, toDate, activeBranchId ?? undefined)
      setDateResults(result)
    } catch {
      setDateResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  function clearDateSearch() {
    setDateResults(null)
    setFromDate('')
    setToDate('')
  }

  function resolveParty(purchase: Purchase): ReceiptParty | null {
    if (purchase.supplierName || purchase.supplierPhone) {
      return {
        name: purchase.supplierName ?? null,
        phone: purchase.supplierPhone ?? null,
      }
    }
    if (purchase.supplierId == null) return null
    const list = [...customers, ...suppliers]
    const found = list.find((s) => s.id === purchase.supplierId)
    return found
      ? { name: found.name, phone: found.phone ?? null }
      : null
  }

  function isCustomerPurchase(purchase: Purchase): boolean {
    return purchase.supplierId != null && customers.some((c) => c.id === purchase.supplierId)
  }

  async function printPurchase(purchase: Purchase) {
    const full = await getPurchase(purchase.id)
    const target = full ?? purchase
    const party = resolveParty(target)
    setPrintTarget({ purchase: target, party, isCustomer: isCustomerPurchase(target) })
  }

  const displayed = (dateResults ?? purchases).filter((p) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      (p.supplierName ?? '').toLowerCase().includes(q) ||
      (p.supplierPhone ?? '').toLowerCase().includes(q) ||
      String(p.id).includes(q)
    )
  })
  const dateSearching = dateResults !== null

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[34px] font-bold leading-[1.2] text-foreground">
            المشتريات
          </h1>
          <p className="text-muted-foreground">فواتير الشراء وتحديث الجرد</p>
        </div>
        <Button
          onClick={openCreate}
          className="h-12 gap-2 rounded-full px-6 touch-target"
        >
          <Plus className="size-5" />
          <span className="hidden sm:inline">فاتورة شراء جديدة</span>
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالاسم أو الهاتف أو رقم الفاتورة..."
            className="search-field h-12 touch-target pe-24"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute end-2 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-full px-3 py-1 text-[12px] text-primary hover:bg-primary/10 touch-target"
            >
              <SearchX className="size-4" />
              مسح
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2 rounded-[14px] border border-black/5 bg-white p-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="from-date" className="text-[12px] text-muted-foreground">
              من تاريخ
            </label>
            <Input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-11 touch-target rounded-full"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="to-date" className="text-[12px] text-muted-foreground">
              إلى تاريخ
            </label>
            <Input
              id="to-date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-11 touch-target rounded-full"
            />
          </div>
          <Button
            type="button"
            onClick={runDateSearch}
            disabled={searchLoading || !fromDate || !toDate}
            className="h-11 gap-2 rounded-full px-5 touch-target"
          >
            <CalendarDays className="size-4" />
            {searchLoading ? 'جارٍ البحث...' : 'بحث بالتاريخ'}
          </Button>
          {dateSearching && (
            <Button
              type="button"
              variant="outline"
              onClick={clearDateSearch}
              className="h-11 gap-2 rounded-full px-4 touch-target"
            >
              <SearchX className="size-4" />
              مسح
            </Button>
          )}
        </div>
      </div>

      {searchLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <PurchaseCardSkeleton key={i} />
          ))}
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PurchaseCardSkeleton key={i} />
          ))}
        </div>
      ) : isError && !dateSearching ? (
        <div className="flex items-center justify-center py-20 text-error">
          تعذّر تحميل المشتريات.
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/10 bg-white py-20 text-center">
          <PackagePlus className="size-12 text-muted-foreground" />
          <p className="text-[17px] font-semibold text-foreground">
            {dateSearching || query
              ? 'لا توجد نتائج مطابقة'
              : 'لا توجد مشتريات بعد'}
          </p>
          <p className="text-sm text-muted-foreground">
            {dateSearching || query
              ? 'جرّب كلمة بحث أخرى أو تاريخاً مختلفاً.'
              : 'اضغط "فاتورة شراء جديدة" لتسجيل أول شراء — ستُضاف القطع للمخزون تلقائياً.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {displayed.map((purchase) => (
            <Card key={purchase.id} className="elevation-card">
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="truncate">
                    شراء #{purchase.id}
                  </CardTitle>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {formatDate(purchase.date)}
                  </p>
                  {purchase.supplierName && (
                    <p className="mt-1 truncate text-[14px] font-semibold text-foreground">
                      {purchase.supplierName}
                      {purchase.supplierPhone && (
                        <span className="text-[12px] font-normal text-muted-foreground">
                          {' '}• {purchase.supplierPhone}
                        </span>
                      )}
                    </p>
                  )}
                  {purchase.userName && purchase.userName !== 'N/A' && (
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      المسؤول: {purchase.userName}
                    </p>
                  )}
                </div>
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-amber-300 to-amber-500 shadow-sm">
                  <PackagePlus className="size-6 text-white" />
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>
                    {purchase.productsDot?.length ?? purchase.quantity ?? 0}{' '}
                    قطعة
                  </Badge>
                  {purchase.goldPrice21AtPurchase != null && (
                    <Badge variant="secondary">
                      سعر الذهب {formatEgp(purchase.goldPrice21AtPurchase)}
                    </Badge>
                  )}
                  {!purchase.isActive && (
                    <Badge variant="destructive">معطلة</Badge>
                  )}
                </div>

                {purchase.productsDot && purchase.productsDot.length > 0 && (
                  <div className="rounded-2xl bg-black/5 p-3">
                    <div className="flex flex-col gap-1">
                      {purchase.productsDot.map((p) => (
                        <div
                          key={p.productId ?? `${purchase.id}-${p.productName}`}
                          className="flex items-center justify-between gap-2 text-[14px]"
                        >
                          <span className="truncate text-foreground">
                            {p.productName}
                          </span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {formatNumber(p.weight ?? 0)} gm × {p.quantity ?? 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(purchase.hasDocuments ||
                  (purchase.documentsCount ?? 0) > 0 ||
                  purchase.image ||
                  purchase.idCardImage) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setImagesTargetId(purchase.id)}
                    className="gap-1.5 rounded-full touch-target"
                    title="عرض صور الفاتورة المخزنة"
                  >
                    <Images className="size-4" />
                    عرض الصور
                    {(purchase.documentsCount ?? 0) > 0 && (
                      <span className="tabular-nums">({purchase.documentsCount})</span>
                    )}
                  </Button>
                )}
              </CardContent>

              <CardFooter className="justify-between pt-0">
                <span className="text-[20px] font-bold tabular-nums text-foreground">
                  {formatEgp(purchase.totalAmount)}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => printPurchase(purchase)}
                  className="gap-1.5 rounded-full touch-target"
                >
                  <Eye className="size-4" />
                  عرض
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <PurchaseReceiptDialog
        open={printTarget != null}
        purchase={printTarget?.purchase ?? null}
        party={printTarget?.party ?? null}
        isCustomer={printTarget?.isCustomer ?? false}
        onClose={() => setPrintTarget(null)}
      />

      <PurchaseImagesDialog
        purchaseId={imagesTargetId}
        legacyImages={(() => {
          const p = (dateResults ?? purchases).find((x) => x.id === imagesTargetId)
          if (!p) return []
          const arr: { label: string; path: string }[] = []
          if (p.image) arr.push({ label: 'فاتورة الشراء', path: p.image })
          if (p.idCardImage) arr.push({ label: 'بطاقة العميل', path: p.idCardImage })
          return arr
        })()}
        onClose={() => setImagesTargetId(null)}
      />

      <Fab
        aria-label="فاتورة شراء جديدة"
        className="fixed bottom-6 end-6 z-40"
        onClick={openCreate}
      >
        <Plus />
      </Fab>
    </div>
  )
}