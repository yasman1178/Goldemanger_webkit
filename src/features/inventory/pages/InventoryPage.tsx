import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Boxes,
  Layers,
  MapPin,
  Package,
  Printer,
  Search,
  Scale,
  X,
  Gem,
} from 'lucide-react'

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
import { getStorages } from '@/shared/lib/parties'
import { typeLabels } from '@/features/products/types'
import { formatNumber, cn } from '@/shared/lib/utils'
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

const INVENTORY_CATEGORIES = [
  { key: 'all', label: 'كل الأصناف' },
  { key: 'earring', label: 'حلقان' },
  { key: 'bracelet', label: 'غوايش وأساور' },
  { key: 'ring', label: 'خواتم ودبل' },
  { key: 'chain', label: 'سلاسل وعقود' },
  { key: 'set', label: 'أطقم' },
  { key: 'bar', label: 'سبائك وجنيهات' },
  { key: 'new', label: 'جديد' },
  { key: 'renewed', label: 'مجدّد' },
  { key: 'break', label: 'كسر' },
] as const

function matchInventoryCategory(product: Product, key: string): boolean {
  if (key === 'all') return true
  if (key === 'new') return product.typegolde === 1
  if (key === 'renewed') return product.typegolde === 2
  if (key === 'break') return product.typegolde === 3
  const name = `${product.productName} ${product.productType ?? ''}`.toLowerCase()
  const map: Record<string, string[]> = {
    ring: ['خاتم', 'دبلة', 'محبس', 'ring'],
    chain: ['سلسلة', 'سلسال', 'عقد', 'دلاية', 'ميدالية', 'chai'],
    bracelet: ['غويشة', 'غوايش', 'سوار', 'أسورة', 'انسيال', 'bracelet'],
    earring: ['حلق', 'قرط', 'earr'],
    set: ['طقم', 'نصف طقم', 'set'],
    bar: ['سبيكة', 'سبائك', 'bar', 'جنيه'],
  }
  return (map[key] ?? []).some((s) => name.includes(s))
}

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
        <div className="p-5 sm:p-6 space-y-2.5 text-[15px]">
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
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">تاريخ الإضافة</span>
            <span className="font-semibold tabular-nums text-foreground">
              {product?.createdDate
                ? new Intl.DateTimeFormat('ar-EG', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }).format(new Date(product.createdDate))
                : '—'}
            </span>
          </div>
          {typeof product?.ageDays === 'number' && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">عمر الصنف</span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatNumber(product.ageDays)} يوم
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function InventoryPage() {
  const activeBranchId = useActiveBranchId()
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
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

  const { data: branchStorages = [] } = useQuery({
    queryKey: ['storages', activeBranchId],
    queryFn: getStorages,
    select: (list) =>
      activeBranchId
        ? list.filter((s) => s.branchId === activeBranchId)
        : list,
  })

  /** مخازن الكسر: أي مخزن اسمه يحوي «كسر» — كل قطعة فيه تُحسب ضمن رصيد الكسر مهما كان نوعها. */
  const scrapStoreIds = useMemo(() => {
    const set = new Set<number>()
    for (const s of branchStorages) {
      const name = (s.name || s.location || '')
      if (name.includes('كسر')) set.add(s.id)
    }
    return set
  }, [branchStorages])

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
        if (!matchInventoryCategory(p, categoryFilter)) return false
        if (!q) return true
        return p.productName.toLowerCase().includes(q)
      })
      .sort((a, b) => b.productId - a.productId)
  }, [availableProducts, query, categoryFilter])

  const storages = useMemo(() => {
    const map = new Map<number, { id: number; name: string; location: string; branchId?: number }>()
    for (const s of branchStorages) {
      const label = s.name?.trim() || s.location?.trim() || `مخزن #${s.id}`
      map.set(s.id, {
        id: s.id,
        name: label,
        location: label,
        branchId: s.branchId,
      })
    }
    for (const p of products) {
      if (p.storageId != null && !map.has(p.storageId)) {
        map.set(p.storageId, {
          id: p.storageId,
          name: `مخزن #${p.storageId}`,
          location: `مخزن #${p.storageId}`,
        })
      }
    }
    return Array.from(map.values())
  }, [branchStorages, products])

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

  /** إجمالي وزن الذهب بمعادل عيار 21 لجميع القطع المتاحة */
  const totalGrams21All = useMemo(() => {
    return availableProducts.reduce((sum, p) => {
      const qty = p.quantity ?? 0
      const w = (p.weight ?? 0) * qty
      const k = p.karat || 21
      return sum + w * (k / 21)
    }, 0)
  }, [availableProducts])

  /** تجميعة فئات الأصناف المجمعة (حلقان، غوايش وأساور، خواتم، سلاسل، سبائك...) */
  const categoryGroups = useMemo(() => {
    const definitions = [
      { key: 'earring', label: 'حلقان', keywords: ['حلق', 'قرط', 'earr'] },
      { key: 'bracelet', label: 'غوايش وأساور', keywords: ['غويشة', 'غوايش', 'سوار', 'أسورة', 'انسيال', 'bracelet'] },
      { key: 'ring', label: 'خواتم ودبل', keywords: ['خاتم', 'دبلة', 'محبس', 'ring'] },
      { key: 'chain', label: 'سلاسل وعقود', keywords: ['سلسلة', 'سلسال', 'عقد', 'دلاية', 'ميدالية', 'chai'] },
      { key: 'set', label: 'أطقم', keywords: ['طقم', 'نصف طقم', 'set'] },
      { key: 'bar', label: 'سبائك وجنيهات', keywords: ['سبيكة', 'سبائك', 'bar', 'جنيه'] },
    ]

    const groups = definitions.map((def) => {
      let pieces = 0
      let weight = 0
      let grams21 = 0
      let itemsCount = 0

      for (const p of availableProducts) {
        const name = `${p.productName} ${p.productType ?? ''}`.toLowerCase()
        if (def.keywords.some((kw) => name.includes(kw))) {
          const qty = p.quantity ?? 0
          const w = (p.weight ?? 0) * qty
          const k = p.karat || 21
          pieces += qty
          weight += w
          grams21 += w * (k / 21)
          itemsCount += 1
        }
      }

      return {
        key: def.key,
        label: def.label,
        itemsCount,
        pieces,
        weight: Math.round(weight * 100) / 100,
        grams21: Math.round(grams21 * 100) / 100,
      }
    })

    let otherPieces = 0
    let otherWeight = 0
    let otherGrams21 = 0
    let otherItemsCount = 0

    for (const p of availableProducts) {
      const name = `${p.productName} ${p.productType ?? ''}`.toLowerCase()
      const matchedAny = definitions.some((d) => d.keywords.some((kw) => name.includes(kw)))
      if (!matchedAny) {
        const qty = p.quantity ?? 0
        const w = (p.weight ?? 0) * qty
        const k = p.karat || 21
        otherPieces += qty
        otherWeight += w
        otherGrams21 += w * (k / 21)
        otherItemsCount += 1
      }
    }

    if (otherItemsCount > 0) {
      groups.push({
        key: 'other',
        label: 'أصناف متنوعة أخرى',
        itemsCount: otherItemsCount,
        pieces: otherPieces,
        weight: Math.round(otherWeight * 100) / 100,
        grams21: Math.round(otherGrams21 * 100) / 100,
      })
    }

    return groups.filter((g) => g.pieces > 0)
  }, [availableProducts])

  const selectedStorageName =
    storageFilter === 'all'
      ? 'كل المخازن'
      : storages.find((storage) => String(storage.id) === storageFilter)?.name ||
        storages.find((storage) => String(storage.id) === storageFilter)?.location ||
        'المخزن'

  const storageNameOf = useCallback(
    (storageId: number | null) => {
      if (storageId == null) return 'بدون مخزن'
      const found = storages.find((s) => s.id === storageId)
      return found?.name || found?.location || `مخزن #${storageId}`
    },
    [storages],
  )

  const kaserShop = useMemo(() => {
    const build = (
      include: (p: Product, inScrapStore: boolean) => boolean,
    ) => {
      const map = new Map<number, { pieces: number; weight: number }>()
      for (const p of availableProducts) {
        const inScrapStore = p.storageId != null && scrapStoreIds.has(p.storageId)
        if (!include(p, inScrapStore)) continue
        const current = map.get(p.karat) ?? { pieces: 0, weight: 0 }
        map.set(p.karat, {
          pieces: current.pieces + (p.quantity ?? 0),
          weight: current.weight + (p.quantity ?? 0) * (p.weight ?? 0),
        })
      }
      const rows = Array.from(map, ([karat, values]) => {
        const grams21 = values.weight * (karat / 21)
        return { karat, ...values, grams21 }
      }).sort(
        (first, second) => second.karat - first.karat,
      )
      return {
        rows,
        totalWeight: rows.reduce((sum, r) => sum + r.weight, 0),
        totalGrams21: rows.reduce((sum, r) => sum + r.grams21, 0),
      }
    }
    return {
      kaser: build((p, inScrapStore) => p.typegolde === 3 || inScrapStore),
      renewed: build((p, inScrapStore) => p.typegolde === 2 && !inScrapStore),
      shop: build((p, inScrapStore) => p.typegolde !== 3 && !inScrapStore),
    }
  }, [availableProducts, scrapStoreIds])

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-[34px] font-bold leading-[1.2] text-foreground">
          الجرد
        </h1>
        <p className="text-muted-foreground">
          أرصدة القطع في مواقع التخزين مع معادل عيار 21 وتصنيف الأصناف
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
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
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
            label="الوزن الفعلي المتاح"
            value={formatNumber(totals.weight)}
            unit="جم"
            color="emerald"
          />
          <StatCard
            icon={Gem}
            label="إجمالي معادل عيار 21K"
            value={formatNumber(totalGrams21All)}
            unit="جم/21"
            color="amber"
          />
          <StatCard
            icon={MapPin}
            label="المخازن ذات الرصيد"
            value={formatNumber(totals.storages)}
            color="rose"
          />
        </div>
      )}

      {/* كروت الأرصدة الثلاثة مع معادل عيار 21 الصريح لكل عيار والإجمالي */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* رصيد الكسر */}
        <Card className="elevation-card border-amber-200/60 bg-gradient-to-br from-amber-50/80 to-card">
          <CardContent className="space-y-2 px-3.5 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block size-2.5 rounded-full bg-amber-400" />
                <p className="text-[13px] font-bold text-amber-800">رصيد الكسر</p>
              </div>
              <span className="text-[10.5px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md tabular-nums">
                معادل 21: {formatNumber(kaserShop.kaser.totalGrams21)} جم
              </span>
            </div>
            {kaserShop.kaser.rows.length === 0 ? (
              <p className="text-[12px] text-muted-foreground py-1">لا يوجد رصيد كسر</p>
            ) : (
              <div className="space-y-1">
                {kaserShop.kaser.rows.map((entry) => (
                  <div key={entry.karat} className="flex items-center justify-between gap-2 text-[12px]">
                    <span className="font-semibold text-foreground">عيار {entry.karat}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatNumber(entry.pieces)} ق • {formatNumber(entry.weight)} جم
                      {entry.karat !== 21 && (
                        <span className="text-amber-700 font-semibold ms-1">
                          ({formatNumber(entry.grams21)} جم/21)
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between gap-2 border-t border-amber-200/50 pt-2 text-[12px]">
              <span className="font-bold text-foreground">الإجمالي الفعلي</span>
              <span className="font-bold tabular-nums text-amber-700">
                {formatNumber(kaserShop.kaser.totalWeight)} جم
              </span>
            </div>
          </CardContent>
        </Card>

        {/* رصيد المجدّد */}
        <Card className="elevation-card border-primary/20 bg-gradient-to-br from-primary/5 to-card">
          <CardContent className="space-y-2 px-3.5 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block size-2.5 rounded-full bg-primary" />
                <p className="text-[13px] font-bold text-primary">رصيد المجدّد</p>
              </div>
              <span className="text-[10.5px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md tabular-nums">
                معادل 21: {formatNumber(kaserShop.renewed.totalGrams21)} جم
              </span>
            </div>
            {kaserShop.renewed.rows.length === 0 ? (
              <p className="text-[12px] text-muted-foreground py-1">لا يوجد رصيد مجدّد</p>
            ) : (
              <div className="space-y-1">
                {kaserShop.renewed.rows.map((entry) => (
                  <div key={entry.karat} className="flex items-center justify-between gap-2 text-[12px]">
                    <span className="font-semibold text-foreground">عيار {entry.karat}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatNumber(entry.pieces)} ق • {formatNumber(entry.weight)} جم
                      {entry.karat !== 21 && (
                        <span className="text-primary font-semibold ms-1">
                          ({formatNumber(entry.grams21)} جم/21)
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between gap-2 border-t border-primary/20 pt-2 text-[12px]">
              <span className="font-bold text-foreground">الإجمالي الفعلي</span>
              <span className="font-bold tabular-nums text-primary">
                {formatNumber(kaserShop.renewed.totalWeight)} جم
              </span>
            </div>
          </CardContent>
        </Card>

        {/* رصيد المحل */}
        <Card className="elevation-card border-sky-200/60 bg-gradient-to-br from-sky-50/80 to-card">
          <CardContent className="space-y-2 px-3.5 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block size-2.5 rounded-full bg-sky-500" />
                <p className="text-[13px] font-bold text-sky-800">رصيد المحل (الجديد)</p>
              </div>
              <span className="text-[10.5px] font-bold text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded-md tabular-nums">
                معادل 21: {formatNumber(kaserShop.shop.totalGrams21)} جم
              </span>
            </div>
            {kaserShop.shop.rows.length === 0 ? (
              <p className="text-[12px] text-muted-foreground py-1">لا يوجد رصيد بالمحل</p>
            ) : (
              <div className="space-y-1">
                {kaserShop.shop.rows.map((entry) => (
                  <div key={entry.karat} className="flex items-center justify-between gap-2 text-[12px]">
                    <span className="font-semibold text-foreground">عيار {entry.karat}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatNumber(entry.pieces)} ق • {formatNumber(entry.weight)} جم
                      {entry.karat !== 21 && (
                        <span className="text-sky-700 font-semibold ms-1">
                          ({formatNumber(entry.grams21)} جم/21)
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between gap-2 border-t border-sky-200/50 pt-2 text-[12px]">
              <span className="font-bold text-foreground">الإجمالي الفعلي</span>
              <span className="font-bold tabular-nums text-sky-700">
                {formatNumber(kaserShop.shop.totalWeight)} جم
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* قسم تجميعة فئات الأصناف المجمعة (حلقان، غوايش وأساور، خواتم، سلاسل، سبائك...) */}
      {categoryGroups.length > 0 && (
        <Card className="elevation-card overflow-hidden border-black/5 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 bg-secondary/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <Boxes className="size-4.5 text-primary" />
              <h2 className="text-[15px] font-bold text-foreground">
                تجميعة الأصناف المجمعة (حلقان • غوايش • خواتم • سلاسل • سبائك)
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground">
              تجميعة الجرامات المحولة لمعادل عيار 21 لكل فئة
            </span>
          </div>

          {/* كروت الفئات السريعة */}
          <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-6 border-b border-black/5">
            {categoryGroups.map((group) => {
              const isSelected = categoryFilter === group.key
              return (
                <button
                  key={group.key}
                  type="button"
                  onClick={() => {
                    reset()
                    setCategoryFilter(isSelected ? 'all' : group.key)
                  }}
                  className={`flex flex-col justify-between rounded-xl border p-2.5 text-start transition-all touch-target cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30'
                      : 'border-black/5 bg-secondary/40 hover:border-primary/40 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-bold text-foreground">
                      {group.label}
                    </span>
                    <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold text-muted-foreground tabular-nums">
                      {group.pieces} ق
                    </span>
                  </div>
                  <div className="mt-2 space-y-0.5">
                    <div className="flex items-baseline justify-between text-[11px]">
                      <span className="text-muted-foreground">فعلي:</span>
                      <span className="font-bold tabular-nums text-foreground">
                        {formatNumber(group.weight)} جم
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-[11px]">
                      <span className="text-amber-700 font-bold">معادل 21:</span>
                      <span className="font-bold tabular-nums text-amber-700">
                        {formatNumber(group.grams21)} جم
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* جدول مجمع تفصيلي لتصنيفات الأصناف بمعادل 21K */}
          <div className="overflow-x-auto p-1">
            <Table>
              <TableHeader>
                <TableRow className="bg-black/[0.02] text-[12px]">
                  <TableHead className="font-bold text-foreground">الفئة</TableHead>
                  <TableHead className="text-center font-bold text-foreground">عدد الأصناف</TableHead>
                  <TableHead className="text-center font-bold text-foreground">عدد القطع</TableHead>
                  <TableHead className="text-end font-bold text-foreground">الوزن الفعلي (جم)</TableHead>
                  <TableHead className="text-end font-bold text-amber-800 bg-amber-500/10">معادل عيار 21 (جم/21)</TableHead>
                  <TableHead className="text-end font-bold text-foreground">نسبة المخزون</TableHead>
                  <TableHead className="text-center font-bold text-foreground">تصفية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryGroups.map((group) => {
                  const isSelected = categoryFilter === group.key
                  const percent = totalGrams21All > 0 ? ((group.grams21 / totalGrams21All) * 100).toFixed(1) : '0'
                  return (
                    <TableRow
                      key={group.key}
                      className={cn(
                        'text-[12.5px] transition-colors',
                        isSelected && 'bg-primary/5 font-semibold',
                      )}
                    >
                      <TableCell className="font-bold text-foreground">
                        {group.label}
                      </TableCell>
                      <TableCell className="text-center tabular-nums text-muted-foreground">
                        {formatNumber(group.itemsCount)} صنف
                      </TableCell>
                      <TableCell className="text-center font-semibold tabular-nums text-foreground">
                        {formatNumber(group.pieces)} قطعة
                      </TableCell>
                      <TableCell className="text-end font-bold tabular-nums text-foreground">
                        {formatNumber(group.weight)} جم
                      </TableCell>
                      <TableCell className="text-end font-extrabold tabular-nums text-amber-700 bg-amber-500/5">
                        {formatNumber(group.grams21)} جم/21
                      </TableCell>
                      <TableCell className="text-end tabular-nums font-semibold text-muted-foreground">
                        {percent}%
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            reset()
                            setCategoryFilter(isSelected ? 'all' : group.key)
                          }}
                          className="h-7 text-[11px] rounded-full px-2.5 font-bold touch-target"
                        >
                          {isSelected ? 'إلغاء الفلترة' : 'عرض القطع'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {/* صف الإجمالي العام للتجميعة */}
                <TableRow className="bg-secondary/60 font-bold border-t-2 border-black/10 text-[12.5px]">
                  <TableCell className="text-foreground">الإجمالي الكلي</TableCell>
                  <TableCell className="text-center tabular-nums text-foreground">
                    {formatNumber(totals.items)} صنف
                  </TableCell>
                  <TableCell className="text-center tabular-nums text-foreground">
                    {formatNumber(totals.pieces)} قطعة
                  </TableCell>
                  <TableCell className="text-end tabular-nums text-foreground">
                    {formatNumber(totals.weight)} جم
                  </TableCell>
                  <TableCell className="text-end tabular-nums text-amber-800 bg-amber-500/15 font-extrabold">
                    {formatNumber(totalGrams21All)} جم/21
                  </TableCell>
                  <TableCell className="text-end tabular-nums text-foreground">
                    100%
                  </TableCell>
                  <TableCell className="text-center">
                    {categoryFilter !== 'all' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          reset()
                          setCategoryFilter('all')
                        }}
                        className="h-7 text-[11px] rounded-full px-2 text-primary hover:bg-primary/10 font-bold"
                      >
                        عرض الكل
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* شريط الفلترة حسب الصنف (كما بفاتورة البيع) */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {INVENTORY_CATEGORIES.map((cat) => {
            const active = categoryFilter === cat.key
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => {
                  reset()
                  setCategoryFilter(cat.key)
                }}
                className={`h-9 shrink-0 rounded-full px-3.5 text-[12px] font-semibold transition-all touch-target cursor-pointer ${
                  active
                    ? 'bg-primary text-white shadow-xs'
                    : 'border border-black/10 bg-white text-muted-foreground hover:border-black/20 hover:text-foreground'
                }`}
              >
                {cat.label}
              </button>
            )
          })}
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
                <TableHead className="text-end text-amber-800 bg-amber-500/10 font-bold">معادل 21K</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((p) => {
                const totalW = (p.quantity ?? 0) * (p.weight ?? 0)
                const g21 = totalW * ((p.karat || 21) / 21)
                return (
                  <TableRow
                    key={p.productId}
                    className="cursor-pointer"
                    onClick={() => setSelected(p)}
                  >
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-1.5">
                        <p className="truncate font-semibold text-foreground">
                          {p.productName}
                        </p>
                        <RenewedBadge typegolde={p.typegolde} />
                      </div>
                    </TableCell>
                    <TableCell className="text-end font-semibold tabular-nums text-foreground">
                      {formatNumber(p.quantity ?? 0)}
                    </TableCell>
                    <TableCell className="text-end tabular-nums text-muted-foreground">
                      {formatNumber(p.weight ?? 0)} gm
                    </TableCell>
                    <TableCell className="text-end font-semibold tabular-nums text-foreground">
                      {formatNumber(totalW)} gm
                    </TableCell>
                    <TableCell className="text-end text-muted-foreground">
                      {p.karat}k
                    </TableCell>
                    <TableCell className="text-end font-extrabold tabular-nums text-amber-700 bg-amber-500/5">
                      {formatNumber(g21)} gm
                    </TableCell>
                  </TableRow>
                )
              })}
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
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-semibold text-foreground">
                          {u.products?.productName ?? `منتج #${u.productId}`}
                        </p>
                        <RenewedBadge typegolde={u.products?.typegolde} />
                      </div>
                      {u.products?.sku ? (
                        <p className="text-[13px] text-muted-foreground">
                          SKU: {u.products.sku}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {storageNameOf(u.storageId) || u.storage?.location || '—'}
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

function RenewedBadge({ typegolde }: { typegolde?: number }) {
  if (typegolde !== 2) return null
  return (
    <Badge className="h-5 shrink-0 bg-black/5 px-1.5 text-[10px] text-primary">
      مجدّد
    </Badge>
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
