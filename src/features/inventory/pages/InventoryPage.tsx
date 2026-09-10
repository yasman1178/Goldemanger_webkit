import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Boxes, Layers, MapPin, Package, Printer, Search, Scale, X } from 'lucide-react'

import { getInventoryUnitsPage } from '@/features/inventory/api'
import type {
  InventoryUnitRecord,
  InventoryUnitStatus,
} from '@/features/inventory/types'
import { inventoryUnitStatusLabels } from '@/features/inventory/types'
import { InventoryUnitActions } from '@/features/inventory/components/InventoryUnitActions'
import { InventoryUnitLabelPrint } from '@/features/inventory/components/InventoryUnitLabelPrint'
import { InventoryReceiptPrint } from '@/features/inventory/components/InventoryReceiptPrint'
import { getProducts } from '@/features/products/api'
import type { Product } from '@/features/products/types'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { typeLabels } from '@/features/products/types'
import { formatNumber } from '@/shared/lib/utils'
import { PAGE_SIZE, usePaginablePage } from '@/shared/lib/pagination'
import { PaginationBar } from '@/shared/components/ui/pagination'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { StoragePicker } from '@/shared/components/StoragePicker'
import { Card, CardContent } from '@/shared/components/ui/card'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  color = 'amber',
}: {
  icon: typeof Boxes
  label: string
  value: string
  unit?: string
  color?: 'amber' | 'blue' | 'emerald' | 'rose'
}) {
  const colorMap = {
    amber: 'from-amber-300 to-amber-500',
    blue: 'from-sky-300 to-sky-500',
    emerald: 'from-emerald-300 to-emerald-500',
    rose: 'from-rose-300 to-rose-500',
  }
  const valueColorMap = {
    amber: 'text-amber-600',
    blue: 'text-sky-600',
    emerald: 'text-emerald-600',
    rose: 'text-rose-600',
  }
  return (
    <Card className="elevation-card">
      <CardContent className="flex items-center gap-2.5 px-3 py-2.5">
        <div className={`flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b ${colorMap[color]} shadow-sm`}>
          <Icon className="size-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] leading-tight text-muted-foreground">{label}</p>
          <p className={`truncate text-[17px] font-bold leading-tight tabular-nums ${valueColorMap[color]}`}>
            {value}
            {unit && (
              <span className="text-[11px] font-semibold text-muted-foreground">
                {' '}
                {unit}
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function ProductDetail({
  product,
  onClose,
}: {
  product: Product | null
  onClose: () => void
}) {
  return (
    <Dialog open={Boolean(product)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{product?.productName ?? 'تفاصيل المنتج'}</DialogTitle>
          <DialogDescription>تفاصيل رصيد المنتج في الجرد.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2.5 text-[15px]">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">العدد</span>
            <span className="font-semibold tabular-nums text-foreground">
              {formatNumber(product?.quantity ?? 0)} قطعة
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">الوزن للقطعة</span>
            <span className="font-semibold tabular-nums text-foreground">
              {formatNumber(product?.weight ?? 0)} gm
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">الوزن الكلي</span>
            <span className="font-semibold tabular-nums text-foreground">
              {formatNumber((product?.quantity ?? 0) * (product?.weight ?? 0))} gm
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">العيار</span>
            <span className="font-semibold tabular-nums text-foreground">
              {product?.karat ? `${product.karat}k` : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">النوع</span>
            <span className="font-semibold text-foreground">
              {product
                ? (typeLabels[product.typegolde as keyof typeof typeLabels] ?? '—')
                : '—'}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function InventoryPage() {
  const activeBranchId = useActiveBranchId()
  const [query, setQuery] = useState('')
  const [storageFilter, setStorageFilter] = useState('all')
  const [unitStorageFilter, setUnitStorageFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<InventoryUnitStatus | 'all'>('AVAILABLE')
  const [selected, setSelected] = useState<Product | null>(null)
  const [printUnit, setPrintUnit] = useState<InventoryUnitRecord | null>(null)
  const [printInventory, setPrintInventory] = useState(false)
  const [page, setPage] = useState(1)

  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ['products', activeBranchId],
    queryFn: () => getProducts(activeBranchId ?? undefined),
  })

  const {
    data: unitsPage,
    isLoading: unitsLoading,
  } = useQuery({
    queryKey: [
      'inventory-units',
      activeBranchId,
      'page',
      page,
      query.trim(),
      unitStorageFilter,
      statusFilter,
    ],
    queryFn: () =>
      getInventoryUnitsPage({
        branchId: activeBranchId ?? undefined,
        page,
        q: query.trim() || undefined,
        status:
          statusFilter === 'all'
            ? undefined
            : statusFilter,
        storageId:
          unitStorageFilter === 'all' ? undefined : Number(unitStorageFilter),
      }),
    enabled: !!activeBranchId,
  })

  const units = unitsPage?.data
  const { page: safePage, pageCount, goToPage, reset } = usePaginablePage(
    unitsPage?.totalCount ?? 0,
    page,
    PAGE_SIZE,
    setPage,
  )

  const availableProducts = useMemo(() => {
    return products.filter(
      (p) =>
        (p.quantity ?? 0) > 0 &&
        p.isActive &&
        (storageFilter === 'all' || String(p.storageId) === storageFilter),
    )
  }, [products, storageFilter])

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    return availableProducts
      .filter((p) => {
        if (!q) return true
        return p.productName.toLowerCase().includes(q)
      })
      .sort((a, b) => b.productId - a.productId)
  }, [availableProducts, query])

  const storages = useMemo(() => {
    const map = new Map<number, string>()
    for (const p of products) {
      if (p.storageId != null) {
        map.set(p.storageId, `مخزن #${p.storageId}`)
      }
    }
    for (const u of units ?? []) {
      if (u.storage) map.set(u.storage.storageId, u.storage.location)
    }
    return Array.from(map, ([id, location]) => ({ id, location }))
  }, [products, units])

  const totals = useMemo(() => {
    const productIds = new Set(availableProducts.map((p) => p.productId))
    return {
      items: productIds.size,
      pieces: availableProducts.reduce((sum, p) => sum + (p.quantity ?? 0), 0),
      weight: availableProducts.reduce((sum, p) => sum + (p.quantity ?? 0) * (p.weight ?? 0), 0),
      storages: new Set(
        availableProducts.map((p) => p.storageId).filter((v) => v != null),
      ).size,
    }
  }, [availableProducts])

  const selectedStorageName =
    storageFilter === 'all'
      ? 'كل المخازن'
      : storages.find((storage) => String(storage.id) === storageFilter)?.location ?? 'المخزن'

  const storageNameOf = useCallback(
    (storageId: number | null) => {
      if (storageId == null) return 'بدون مخزن'
      return storages.find((s) => s.id === storageId)?.location ?? `مخزن #${storageId}`
    },
    [storages],
  )

  const kaserShop = useMemo(() => {
    const build = (isKaser: boolean) => {
      const map = new Map<number, { pieces: number; weight: number }>()
      for (const p of availableProducts) {
        if ((p.typegolde === 3) !== isKaser) continue
        const current = map.get(p.karat) ?? { pieces: 0, weight: 0 }
        map.set(p.karat, {
          pieces: current.pieces + (p.quantity ?? 0),
          weight: current.weight + (p.quantity ?? 0) * (p.weight ?? 0),
        })
      }
      const rows = Array.from(map, ([karat, values]) => ({ karat, ...values })).sort(
        (first, second) => second.karat - first.karat,
      )
      return {
        rows,
        totalWeight: rows.reduce((sum, r) => sum + r.weight, 0),
      }
    }
    return { kaser: build(true), shop: build(false) }
  }, [availableProducts])

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-[34px] font-bold leading-[1.2] text-foreground">
          الجرد
        </h1>
        <p className="text-muted-foreground">
          أرصدة القطع في مواقع التخزين — مشتقة من المخزون الفعلي
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-2.5 px-3 py-2.5">
                <Skeleton className="size-8 rounded-xl" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatCard
            icon={Layers}
            label="الأصناف المتاحة"
            value={formatNumber(totals.items)}
            color="amber"
          />
          <StatCard
            icon={Boxes}
            label="القطع المتاحة فعلياً"
            value={formatNumber(totals.pieces)}
            color="blue"
          />
          <StatCard
            icon={Scale}
            label="الوزن المتاح فعلياً"
            value={formatNumber(totals.weight)}
            unit="gm"
            color="emerald"
          />
          <StatCard
            icon={MapPin}
            label="المخازن ذات الرصيد"
            value={formatNumber(totals.storages)}
            color="rose"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card className="elevation-card border-amber-200/60 bg-gradient-to-br from-amber-50/80 to-card">
          <CardContent className="space-y-1.5 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="inline-block size-2 rounded-full bg-amber-400" />
              <p className="text-[13px] font-bold text-amber-700">رصيد الكسر</p>
            </div>
            {kaserShop.kaser.rows.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">لا يوجد رصيد كسر</p>
            ) : (
              kaserShop.kaser.rows.map((entry) => (
                <div key={entry.karat} className="flex items-center justify-between gap-2 text-[12px]">
                  <span className="font-semibold text-foreground">عيار {entry.karat}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatNumber(entry.pieces)} قطعة • {formatNumber(entry.weight)} جم
                  </span>
                </div>
              ))
            )}
            <div className="flex items-center justify-between gap-2 border-t border-amber-200/40 pt-1.5 text-[12px]">
              <span className="font-bold text-foreground">الإجمالي</span>
              <span className="font-bold tabular-nums text-amber-600">
                {formatNumber(kaserShop.kaser.totalWeight)} جم
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="elevation-card border-sky-200/60 bg-gradient-to-br from-sky-50/80 to-card">
          <CardContent className="space-y-1.5 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="inline-block size-2 rounded-full bg-sky-400" />
              <p className="text-[13px] font-bold text-sky-700">رصيد المحل</p>
            </div>
            {kaserShop.shop.rows.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">لا يوجد رصيد بالمحل</p>
            ) : (
              kaserShop.shop.rows.map((entry) => (
                <div key={entry.karat} className="flex items-center justify-between gap-2 text-[12px]">
                  <span className="font-semibold text-foreground">عيار {entry.karat}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatNumber(entry.pieces)} قطعة • {formatNumber(entry.weight)} جم
                  </span>
                </div>
              ))
            )}
            <div className="flex items-center justify-between gap-2 border-t border-sky-200/40 pt-1.5 text-[12px]">
              <span className="font-bold text-foreground">الإجمالي</span>
              <span className="font-bold tabular-nums text-sky-600">
                {formatNumber(kaserShop.shop.totalWeight)} جم
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              reset()
            }}
            placeholder="ابحث بالمنتج..."
            className="search-field h-11 ps-9 pe-9"
          />
          {query && (
            <button
              type="button"
              aria-label="مسح البحث"
              onClick={() => {
                setQuery('')
                reset()
              }}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <StoragePicker
          value={storageFilter}
          storages={storages}
          onChange={(value) => {
            reset()
            setStorageFilter(value)
            setUnitStorageFilter(value)
          }}
          triggerClassName="flex h-11 w-full items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-[13px] font-medium text-foreground sm:w-48"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center py-16 text-error">
          تعذّر تحميل الجرد.
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/10 bg-white py-20 text-center">
          <Search className="size-12 text-muted-foreground" />
          <p className="text-[17px] font-semibold text-foreground">
            لا نتائج مطابقة
          </p>
          <p className="text-sm text-muted-foreground">
            جرّب تعديل البحث أو الفلتر.
          </p>
        </div>
      ) : (
        <Card className="overflow-hidden elevation-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-black/[0.03]">
                <TableHead>المنتج</TableHead>
                <TableHead className="text-end">العدد</TableHead>
                <TableHead className="text-end">وزن القطعة</TableHead>
                <TableHead className="text-end">الوزن الكلي</TableHead>
                <TableHead className="text-end">العيار</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((p) => (
                <TableRow
                  key={p.productId}
                  className="cursor-pointer"
                  onClick={() => setSelected(p)}
                >
                  <TableCell>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {p.productName}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-end font-semibold tabular-nums text-foreground">
                    {formatNumber(p.quantity ?? 0)}
                  </TableCell>
                  <TableCell className="text-end tabular-nums text-muted-foreground">
                    {formatNumber(p.weight ?? 0)} gm
                  </TableCell>
                  <TableCell className="text-end font-semibold tabular-nums text-foreground">
                    {formatNumber((p.quantity ?? 0) * (p.weight ?? 0))} gm
                  </TableCell>
                  <TableCell className="text-end text-muted-foreground">
                    {p.karat}k
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <div className="flex items-center gap-2 pt-2">
        <Package className="size-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">القطع الفعلية</h2>
        <Button
          type="button"
          variant="outline"
          onClick={() => setPrintInventory(true)}
          disabled={availableProducts.length === 0}
          className="ms-auto h-11 gap-2 rounded-full touch-target"
        >
          <Printer className="size-4" />
          طباعة كشف الجرد
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {selectedStorageName} — {formatNumber(totals.pieces)} قطعة متاحة فعلياً، بوزن {formatNumber(totals.weight)} جم.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={statusFilter} onValueChange={(v) => { reset(); setStatusFilter(v as InventoryUnitStatus | 'all') }}>
          <SelectTrigger className="w-full h-11 rounded-full border-black/10 bg-white sm:w-48">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            {(Object.keys(inventoryUnitStatusLabels) as InventoryUnitStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {inventoryUnitStatusLabels[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {unitsLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !units || units.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/10 bg-white py-16 text-center">
          <Package className="size-12 text-muted-foreground" />
          <p className="text-[17px] font-semibold text-foreground">
            لا توجد قطع مخزنية بعد
          </p>
          <p className="text-sm text-muted-foreground">
            سجّل فاتورة شراء وسيُنشأ لكل قطعة رقم مخزن تلقائياً.
          </p>
        </div>
      ) : (
        <>
        <Card className="overflow-hidden elevation-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-black/[0.03]">
                <TableHead>رقم المخزن</TableHead>
                <TableHead>المنتج</TableHead>
                <TableHead>المخزن</TableHead>
                <TableHead className="text-end">الوزن</TableHead>
                <TableHead className="text-end">العيار</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-end">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((u) => (
                <TableRow key={u.inventoryUnitId}>
                  <TableCell>
                    <span
                      dir="ltr"
                      className="font-mono font-semibold text-foreground"
                    >
                      {u.inventoryNumber}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {u.products?.productName ?? `منتج #${u.productId}`}
                      </p>
                      {u.products?.sku ? (
                        <p className="text-[13px] text-muted-foreground">
                          SKU: {u.products.sku}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {u.storage?.location ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-end font-semibold tabular-nums text-foreground">
                    {formatNumber(u.weight)} gm
                  </TableCell>
                  <TableCell className="text-end text-muted-foreground">
                    {u.karat}k
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={u.status} />
                  </TableCell>
                  <TableCell>
                    <InventoryUnitActions
                      unit={u}
                      onPrint={setPrintUnit}
                    />
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
          totalCount={unitsPage?.totalCount ?? 0}
        />
        </>
      )}

      <ProductDetail product={selected} onClose={() => setSelected(null)} />
      <InventoryUnitLabelPrint unit={printUnit} onClose={() => setPrintUnit(null)} />
      <InventoryReceiptPrint
        open={printInventory}
        onOpenChange={setPrintInventory}
        title={selectedStorageName}
        products={availableProducts}
        storageNameOf={storageNameOf}
      />
    </div>
  )
}

function StatusBadge({ status }: { status: InventoryUnitStatus }) {
  const variant =
    status === 'AVAILABLE'
      ? 'default'
      : status === 'SOLD'
        ? 'destructive'
        : 'secondary'
  return (
    <Badge variant={variant}>{inventoryUnitStatusLabels[status] ?? status}</Badge>
  )
}
