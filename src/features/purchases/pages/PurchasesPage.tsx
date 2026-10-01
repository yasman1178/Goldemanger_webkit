import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Images,
  PackagePlus,
  Plus,
  Printer,
  Scale,
  SearchX,
  Sparkles,
} from 'lucide-react'

import {
  getPurchase,
  getPurchasesByDate,
  getPurchasesPage,
} from '@/features/purchases/api'
import { PurchaseReceiptDialog, type ReceiptParty } from '@/features/purchases/components/PurchaseReceiptDialog'
import { PurchaseImagesDialog } from '@/features/purchases/components/PurchaseImagesDialog'
import { PurchaseListReceiptPrint } from '@/features/purchases/components/PurchaseListReceiptPrint'
import { InitialStockDialog } from '@/features/purchases/components/InitialStockDialog'
import type { Purchase } from '@/features/purchases/types'
import { getCustomers, getSuppliers } from '@/shared/lib/parties'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { useAuthStore } from '@/shared/stores/auth-store'
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

function PurchaseCardSkeleton() {
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

export function PurchasesPage() {
  const navigate = useNavigate()
  const activeBranchId = useActiveBranchId()
  const [query, setQuery] = useState('')
  const [dateResults, setDateResults] = useState<Purchase[] | null>(null)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [printTarget, setPrintTarget] = useState<{
    purchase: Purchase
    party: ReceiptParty | null
    isCustomer: boolean
  } | null>(null)
  const [imagesTargetId, setImagesTargetId] = useState<number | null>(null)
  const [listPrintOpen, setListPrintOpen] = useState(false)
  const [initialStockOpen, setInitialStockOpen] = useState(false)
  const roles = useAuthStore((s) => s.user?.roles ?? [])
  const isOwner = roles.includes('Owner')

  const { data: pageResult, isLoading, isError } = useQuery({
    queryKey: ['purchases', activeBranchId, 'page', page, query.trim()],
    queryFn: () =>
      getPurchasesPage({
        branchId: activeBranchId ?? undefined,
        page,
        q: query.trim() || undefined,
      }),
    enabled: !!activeBranchId,
  })

  const purchases = pageResult?.data ?? []
  const { page: safePage, pageCount, goToPage, reset } = usePaginablePage(
    pageResult?.totalCount ?? 0,
    page,
    PAGE_SIZE,
    setPage,
  )

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
    reset()
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

  const displayed = dateResults
    ? dateResults.filter((p) => {
        const q = query.trim().toLowerCase()
        if (!q) return true
        return (
          (p.supplierName ?? '').toLowerCase().includes(q) ||
          (p.supplierPhone ?? '').toLowerCase().includes(q) ||
          String(p.id).includes(q)
        )
      })
    : purchases
  const dateSearching = dateResults !== null

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[34px] font-bold leading-[1.2] text-foreground">
            المشتريات
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* رصيد أول المدة قرار محل لا تفويض موظف: الزر لا يظهر لغير
              صاحب المحل، والخادم يرفض الحفظ حتى لو طُلب مباشرة من جهازه. */}
          {isOwner && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setInitialStockOpen(true)}
              className="h-12 gap-2 rounded-full border-amber-500/30 bg-amber-500/10 px-5 font-bold text-amber-800 hover:bg-amber-500/20 touch-target"
            >
              <Sparkles className="size-5 text-amber-600" />
              <span>رصيد أول المدة</span>
            </Button>
          )}
          <Button
            onClick={openCreate}
            className="h-12 gap-2 rounded-full px-6 touch-target"
          >
            <Plus className="size-5" />
            <span className="hidden sm:inline">فاتورة شراء جديدة</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        <div className="relative flex-1">
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              reset()
            }}
            placeholder="ابحث بالاسم أو الهاتف أو رقم الفاتورة..."
            className="search-field h-full min-h-12 touch-target pe-24"
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

        <div className="flex shrink-0 items-end gap-2 rounded-[14px] border border-black/5 bg-white p-3 lg:max-w-[480px]">
          <div className="flex w-[150px] shrink-0 flex-col gap-1">
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
          <div className="flex w-[150px] shrink-0 flex-col gap-1">
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
            className="h-11 shrink-0 gap-2 rounded-full px-4 touch-target"
          >
            <CalendarDays className="size-4" />
            {searchLoading ? 'جارٍ البحث...' : 'بحث بالتاريخ'}
          </Button>
          {dateSearching && (
            <Button
              type="button"
              variant="outline"
              onClick={clearDateSearch}
              className="h-11 shrink-0 gap-2 rounded-full px-4 touch-target"
            >
              <SearchX className="size-4" />
              مسح
            </Button>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setListPrintOpen(true)}
          disabled={displayed.length === 0 || searchLoading || isLoading}
          className="h-11 shrink-0 gap-2 rounded-full px-4 touch-target"
        >
          <Printer className="size-4" />
          طباعة
        </Button>
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
        <>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {displayed.map((purchase) => {
            const pieces =
              purchase.productsDot?.reduce((sum, p) => sum + (p.quantity ?? 1), 0) ??
              (purchase.quantity ?? 1)
            const totalWeight =
              purchase.productsDot?.reduce((sum, p) => sum + (p.weight ?? 0) * (p.quantity ?? 1), 0) ?? 0
            const supplierLabel = purchase.supplierName?.trim() || 'مورد / عميل ذهب'
            const initialLetter = supplierLabel.charAt(0)
            const docsCount = purchase.documentsCount ?? 0
            const hasImages = purchase.hasDocuments || docsCount > 0 || purchase.image || purchase.idCardImage

            return (
              <Card
                key={purchase.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-[18px] border border-black/8 bg-white shadow-xs elevation-card transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-500/40 hover:shadow-md"
              >
                {/* شريط تمييز علوي ذهبي دافئ */}
                <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600/40" />

                <div className="p-4 space-y-3.5">
                  {/* رأس الكارت: رقم الفاتورة والحالة والوقت */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
                        <PackagePlus className="size-4" />
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[15px] font-black text-foreground">
                            فاتورة شراء #{purchase.id}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
                          <Clock className="size-3" />
                          {formatDate(purchase.date)}
                        </span>
                      </div>
                    </div>

                    {!purchase.isActive ? (
                      <Badge variant="destructive" className="text-[11px] font-bold px-2 py-0.5 rounded-full">
                        معطلة
                      </Badge>
                    ) : purchase.paymentType === 2 ? (
                      <Badge
                        variant="secondary"
                        className="bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-full"
                      >
                        بدل ذهب / كسر
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-full"
                      >
                        <CheckCircle2 className="me-1 size-3 text-emerald-600" />
                        شراء كاش
                      </Badge>
                    )}
                  </div>

                  {/* بيانات المورد / العميل والمسؤول */}
                  <div className="flex items-center gap-2.5 rounded-[12px] bg-secondary/50 p-2.5">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-600 text-white text-xs font-bold shadow-xs">
                      {initialLetter}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold text-foreground">
                        {supplierLabel}
                      </p>
                      {purchase.supplierPhone && (
                        <span className="text-[11px] text-muted-foreground tabular-nums block">
                          📞 {purchase.supplierPhone}
                        </span>
                      )}
                    </div>
                    {purchase.userName && purchase.userName !== 'N/A' && (
                      <span className="shrink-0 text-[11px] text-muted-foreground bg-black/5 px-2 py-0.5 rounded-md">
                        المسؤول: {purchase.userName}
                      </span>
                    )}
                  </div>

                  {/* شريط الإجماليات والذهب */}
                  <div className="flex items-baseline justify-between border-b border-black/5 pb-2.5">
                    <div>
                      <span className="text-[11px] font-semibold text-muted-foreground block">
                        إجمالي الشراء
                      </span>
                      <span className="text-[22px] font-black tabular-nums text-foreground tracking-tight">
                        {formatEgp(purchase.totalAmount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-end">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-black/5 px-2 py-1 text-[12px] font-bold text-foreground tabular-nums">
                        {formatNumber(pieces)} قطعة
                      </span>
                      {totalWeight > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 text-amber-800 border border-amber-300/40 px-2 py-1 text-[12px] font-bold tabular-nums">
                          <Scale className="size-3 text-amber-700" />
                          {formatNumber(totalWeight)} جم
                        </span>
                      )}
                    </div>
                  </div>

                  {/* سعر الذهب وقت الشراء */}
                  {purchase.goldPrice21AtPurchase != null && (
                    <div className="flex items-center justify-between text-[11px] bg-amber-50/60 border border-amber-200/50 rounded-lg px-2.5 py-1 text-amber-900">
                      <span>سعر عيار 21 المسجل وقت الشراء:</span>
                      <span className="font-bold tabular-nums">{formatEgp(purchase.goldPrice21AtPurchase)} / جم</span>
                    </div>
                  )}

                  {/* درج استعراض القطع المشتراة */}
                  {purchase.productsDot && purchase.productsDot.length > 0 && (
                    <div className="space-y-1.5 rounded-[12px] bg-black/[0.02] p-2.5 border border-black/5">
                      <div className="flex flex-col divide-y divide-black/5">
                        {purchase.productsDot.slice(0, 3).map((p) => (
                          <div
                            key={p.productId ?? `${purchase.id}-${p.productName}`}
                            className="flex items-center justify-between gap-2 py-1 text-[12px] first:pt-0 last:pb-0"
                          >
                            <span className="truncate font-medium text-foreground flex items-center gap-1.5">
                              <span className="size-1.5 rounded-full bg-amber-600 shrink-0" />
                              {p.productName}
                              {p.karat ? <span className="text-[10px] text-amber-700 font-bold">(عيار {p.karat})</span> : null}
                            </span>
                            <span className="shrink-0 tabular-nums text-muted-foreground font-semibold">
                              {formatNumber(p.weight ?? 0)} جم × {p.quantity ?? 1}
                            </span>
                          </div>
                        ))}
                      </div>
                      {purchase.productsDot.length > 3 && (
                        <p className="text-[11px] text-muted-foreground pt-1 text-center font-bold">
                          + {purchase.productsDot.length - 3} قطع إضافية بالفاتورة
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* تذييل الكارت والإجراءات */}
                <div className="flex items-center justify-between border-t border-black/5 bg-secondary/30 p-3">
                  {hasImages ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setImagesTargetId(purchase.id)}
                      className="h-9 gap-1.5 rounded-full px-3 text-xs font-bold touch-target"
                      title="عرض صور الفاتورة والمستندات"
                    >
                      <Images className="size-3.5 text-amber-700" />
                      <span>الصور</span>
                      {docsCount > 0 && <span className="tabular-nums">({docsCount})</span>}
                    </Button>
                  ) : (
                    <span className="text-[11px] text-muted-foreground font-medium">
                      إيصال شراء موثق
                    </span>
                  )}

                  <Button
                    type="button"
                    onClick={() => printPurchase(purchase)}
                    className="h-9 gap-1.5 rounded-full px-4 text-xs font-bold touch-target shadow-xs"
                  >
                    <Printer className="size-3.5" />
                    <span>عرض وطباعة</span>
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>

        {!dateSearching && (
          <PaginationBar
            page={safePage}
            pageCount={pageCount}
            onChange={goToPage}
            totalCount={pageResult?.totalCount ?? 0}
          />
        )}
        </>
      )}

      <PurchaseReceiptDialog
        open={printTarget != null}
        purchase={printTarget?.purchase ?? null}
        party={printTarget?.party ?? null}
        isCustomer={printTarget?.isCustomer ?? false}
        onClose={() => setPrintTarget(null)}
      />

      <PurchaseListReceiptPrint
        open={listPrintOpen}
        onOpenChange={setListPrintOpen}
        title={
          dateSearching && (fromDate || toDate)
            ? `${fromDate} ← ${toDate}`
            : query.trim()
              ? `بحث: ${query.trim()}`
              : ''
        }
        purchases={displayed}
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

      <InitialStockDialog
        open={initialStockOpen}
        onOpenChange={setInitialStockOpen}
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