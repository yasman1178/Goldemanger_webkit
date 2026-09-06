import { useMemo, useState } from 'react'
import {
  Search,
  X,
  Eye,
  Plus,
  TriangleAlert,
  ScanBarcode,
  Boxes,
} from 'lucide-react'

import type { Product } from '@/features/products/types'
import { designLabels, typeLabels } from '@/features/products/types'
import { salePerGram } from '@/shared/lib/gold'
import { cn, formatNumber } from '@/shared/lib/utils'
import type { StorageLocation } from '@/shared/types/api'
import type { CartLine } from './types'
import { karatLabel } from './types'
import { FormatEg } from './Money'
import { Badge } from '@/shared/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'

const categories = [
  { key: 'all', label: 'الكل' },
  { key: 'ring', label: 'خواتم' },
  { key: 'chain', label: 'سلاسل' },
  { key: 'bracelet', label: 'أساور' },
  { key: 'earring', label: 'حلق' },
  { key: 'set', label: 'أطقم' },
  { key: 'bar', label: 'سبائك' },
]

function matchCategory(product: Product, key: string): boolean {
  if (key === 'all') return true
  const name = `${product.productName} ${product.productType ?? ''}`.toLowerCase()
  const map: Record<string, string[]> = {
    ring: ['خاتم', 'ring'],
    chain: ['سلسلة', 'chai'],
    bracelet: ['سوار', 'bracelet', 'أسورة'],
    earring: ['حلق', 'earr', 'قرط'],
    set: ['طقم', 'set'],
    bar: ['سبيكة', 'سبائك', 'bar', 'جنيه'],
  }
  return (map[key] ?? []).some((s) => name.includes(s))
}

function salePriceFor(product: Product, goldPrice: number): number {
  const perGram = salePerGram(goldPrice, product.karat)
  const metal = perGram
  const taxAndStamp = metal * 0.01
  const making = product.factoryForSale || product.factory
  return Math.round((metal + taxAndStamp + making) * product.weight)
}

interface Props {
  products: Product[]
  cart: CartLine[]
  goldPrice: number
  onAdd: (product: Product) => void
  freezeGold: boolean
  onToggleFreezeGold: () => void
  storages: StorageLocation[]
}

export function ProductGrid({
  products,
  cart,
  goldPrice,
  onAdd,
  freezeGold,
  onToggleFreezeGold,
  storages,
}: Props) {
  const [query, setQuery] = useState('')
  const [barcode, setBarcode] = useState('')
  const [category, setCategory] = useState('all')
  const [storageFilter, setStorageFilter] = useState('all')
  const [storageOpen, setStorageOpen] = useState(false)
  const [preview, setPreview] = useState<Product | null>(null)
  const [barcodeStatus, setBarcodeStatus] = useState<
    'idle' | 'notfound' | 'found'
  >('idle')

  const cartCount = useMemo(
    () => new Map(cart.map((l) => [l.product.productId, l.quantity])),
    [cart],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      if (!p.isActive || !p.productId || (p.quantity ?? 0) <= 0) return false
      if (!matchCategory(p, category)) return false
      if (storageFilter !== 'all' && String(p.storageId) !== storageFilter)
        return false
      if (!q) return true
      return (
        p.productName.toLowerCase().includes(q) ||
        (p.sku ?? '').toLowerCase().includes(q) ||
        (p.barcode ?? '').toLowerCase().includes(q)
      )
    })
  }, [products, query, category, storageFilter])

  function handleBarcodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = barcode.trim()
    if (!code) {
      setBarcodeStatus('idle')
      return
    }
    const match = products.find(
      (p) =>
        p.isActive &&
        (p.quantity ?? 0) > 0 &&
        p.productId != null &&
        (p.barcode ?? '').toLowerCase() === code.toLowerCase(),
    )
    if (match) {
      setBarcodeStatus('found')
      onAdd(match)
      setBarcode('')
    } else {
      setBarcodeStatus('notfound')
    }
  }

  const selectedStorage = storages.find((s) => String(s.id) === storageFilter)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max items-center gap-2">
          <label className="flex h-10 shrink-0 touch-target cursor-pointer items-center gap-1 rounded-full border border-black/10 bg-white px-2">
            <input
              type="checkbox"
              checked={freezeGold}
              onChange={onToggleFreezeGold}
              className="size-4 accent-primary"
            />
            <span className="text-[11px] font-semibold text-foreground">
              {freezeGold
                ? 'سعر الذهب مثبّت (لا يتحدث تلقائياً)'
                : 'تثبيت سعر الذهب الحالي'}
            </span>
          </label>

          <div className="relative w-[min(24vw,250px)] min-w-[190px] shrink-0">
          <Search className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث باسم القطعة أو SKU أو الباركود"
            className="h-11 w-full touch-target rounded-full border border-input bg-white ps-10 pe-10 text-[12px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          {query && (
            <button
              type="button"
              aria-label="مسح البحث"
              onClick={() => setQuery('')}
              className="absolute end-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/5 text-muted-foreground touch-target"
            >
              <X className="size-4" />
            </button>
          )}
          </div>

          <form
            onSubmit={handleBarcodeSubmit}
            className="relative flex w-[min(24vw,250px)] min-w-[190px] shrink-0 items-center"
          >
          <ScanBarcode className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={barcode}
            onChange={(e) => {
              setBarcode(e.target.value)
              setBarcodeStatus('idle')
            }}
            onFocus={() => setBarcodeStatus('idle')}
            dir="ltr"
            placeholder="أدخل الباركود ثم Enter لإضافة القطعة مباشرة"
            className="h-11 w-full touch-target rounded-full border border-input bg-white ps-10 pe-10 text-end text-[12px] tabular-nums text-foreground outline-none placeholder:text-muted-foreground placeholder:text-start focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          </form>
          {barcodeStatus === 'found' && (
            <span className="h-11 shrink-0 text-[13px] font-semibold text-success">
              تمت الإضافة
            </span>
          )}
          {barcodeStatus === 'notfound' && (
            <span className="h-11 shrink-0 text-[13px] font-semibold text-error">
              لم نجد هذا الباركود
            </span>
          )}
        </div>
      </div>

      <div
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
        role="tablist"
        aria-label="تصنيفات المنتجات"
      >
        {categories.map((c) => (
          <button
            key={c.key}
            role="tab"
            aria-selected={category === c.key}
            onClick={() => setCategory(c.key)}
            className={cn(
              'h-11 shrink-0 touch-target rounded-full px-4 text-[15px] font-semibold transition-colors',
              category === c.key
                ? 'bg-primary text-white'
                : 'bg-secondary text-foreground hover:bg-black/5',
            )}
          >
            {c.label}
          </button>
        ))}

        <span className="ms-1 h-8 w-px shrink-0 bg-black/10" aria-hidden />

        <button
          type="button"
          onClick={() => setStorageOpen(true)}
          className={cn(
            'flex h-11 shrink-0 touch-target items-center gap-2 rounded-xl border-2 px-4 text-[13px] font-semibold transition-colors',
            selectedStorage
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-dashed border-black/25 bg-white text-muted-foreground hover:border-primary/60 hover:text-primary',
          )}
        >
          <Boxes className="size-4" />
          {selectedStorage ? (
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="hidden text-[11px] font-bold tabular-nums md:inline">
                مخزن #{selectedStorage.id}
              </span>
              <span className="min-w-0 truncate text-foreground">
                {selectedStorage.name}
              </span>
            </span>
          ) : (
            <span>المخزن</span>
          )}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Search className="size-10 text-muted-foreground" />
            <p className="text-[17px] font-semibold text-foreground">
              لا توجد قطع تطابق البحث
            </p>
            <p className="text-sm text-muted-foreground">
              جرّب تصنيفاً آخر أو ابحث باسم مختلف
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-8">
            {filtered.map((product) => {
              const available =
                product.isActive && product.quantity > 0 && product.productId != null
              const inCart = available ? (cartCount.get(product.productId!) ?? 0) : 0
              return (
                <div
                  key={product.productId}
                  role="button"
                  tabIndex={available ? 0 : -1}
                  aria-disabled={!available}
                  onClick={() => available && onAdd(product)}
                  onKeyDown={(e) => {
                    if (available && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      onAdd(product)
                    }
                  }}
                  className={cn(
                    'group relative flex touch-target flex-col gap-1 rounded-[10px] border border-black/5 bg-white p-1.5 text-start elevation-card transition-transform active:scale-[0.98]',
                    available ? 'cursor-pointer' : 'cursor-not-allowed opacity-50',
                  )}
                >
                  <button
                    type="button"
                    aria-label={`عرض تفاصيل ${product.productName}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setPreview(product)
                    }}
                    className="absolute end-1 top-1 z-10 flex size-6 items-center justify-center rounded-full bg-black/5 text-muted-foreground transition-colors hover:bg-black/10 hover:text-foreground"
                  >
                    <Eye className="size-3" />
                  </button>

                  <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-[6px] bg-secondary">
                    {product.primaryImageUrl ? (
                      <img
                        src={product.primaryImageUrl}
                        alt={product.productName}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        {product.weight} جم
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold leading-[1.35] text-foreground">
                      {product.productName}
                    </p>
                    <p className="mt-0.5 truncate text-[9px] font-semibold">
                      {available ? (
                        product.quantity === 1 ? (
                          <span className="inline-flex items-center gap-1 text-warning">
                            <TriangleAlert className="size-2.5" />
                            متبقي {product.quantity}
                          </span>
                        ) : (
                          <span className="text-success">متاح للبيع</span>
                        )
                      ) : (
                        <span className="text-error">غير متاح</span>
                      )}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {karatLabel(product.karat)} • {product.weight} جم
                    </p>
                    {(product.sku || product.barcode) && (
                      <p
                        dir="ltr"
                        className="mt-0.5 truncate text-end text-[8px] tabular-nums text-muted-foreground"
                      >
                        {product.sku ? `SKU ${product.sku}` : ''}
                        {product.sku && product.barcode ? ' • ' : ''}
                        {product.barcode ? product.barcode : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="tabular-nums text-[12px] font-bold text-foreground">
                      <FormatEg value={salePriceFor(product, goldPrice)} />
                      <span className="text-[9px] font-semibold text-muted-foreground">
                        {' '}ج.م
                      </span>
                    </span>
                    {inCart > 0 && (
                      <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white">
                        {inCart}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ProductQuickView
        product={preview}
        goldPrice={goldPrice}
        onClose={() => setPreview(null)}
        onAdd={(p) => {
          onAdd(p)
          setPreview(null)
        }}
      />

      <StoragePickerDialog
        open={storageOpen}
        storages={storages}
        value={storageFilter}
        onClose={() => setStorageOpen(false)}
        onSelect={(value) => {
          setStorageFilter(value)
          setStorageOpen(false)
        }}
      />
    </div>
  )
}

function ProductQuickView({
  product,
  goldPrice,
  onClose,
  onAdd,
}: {
  product: Product | null
  goldPrice: number
  onClose: () => void
  onAdd: (p: Product) => void
}) {
  const available = Boolean(
    product && product.isActive && product.quantity > 0 && product.productId != null,
  )

  return (
    <Dialog open={Boolean(product)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{product?.productName ?? ''}</DialogTitle>
          <DialogDescription>
            {product
              ? `${typeLabels[product.typegolde as keyof typeof typeLabels] ?? '—'} • ${
                  designLabels[product.design as keyof typeof designLabels] ?? '—'
                }`
              : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 text-[15px]">
          {product?.primaryImageUrl ? (
            <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl bg-secondary">
              <img
                src={product.primaryImageUrl}
                alt={product.productName}
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2.5">
            <QuickViewRow label="العيار" value={`${product?.karat ?? 0}k`} />
            <QuickViewRow label="الوزن" value={`${formatNumber(product?.weight ?? 0)} جم`} />
            <QuickViewRow label="المصنعية" value={formatNumber(product?.factory ?? 0)} />
            <QuickViewRow
              label="سعر البيع"
              value={
                product
                  ? `${formatNumber(salePriceFor(product, goldPrice))} ج.م`
                  : '—'
              }
            />
          </div>

          {(product?.sku || product?.barcode) && (
            <p className="rounded-xl bg-black/5 p-2.5 text-[13px] text-muted-foreground">
              {product?.sku && <span>SKU: {product.sku}</span>}
              {product?.sku && product?.barcode && <span> • </span>}
              {product?.barcode && <span>باركود: {product.barcode}</span>}
            </p>
          )}

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">الحالة</span>
            {available ? (
              <Badge>متاح</Badge>
            ) : (
              <Badge variant="destructive">غير متاح</Badge>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-11 flex-1 rounded-full touch-target"
          >
            إغلاق
          </Button>
          <Button
            type="button"
            disabled={!available || !product}
            onClick={() => product && onAdd(product)}
            className="h-11 flex-1 gap-2 rounded-full touch-target"
          >
            <Plus className="size-4" />
            إضافة للفاتورة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function QuickViewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-3">
      <p className="text-[12px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-[16px] font-bold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  )
}

function StoragePickerDialog({
  open,
  storages,
  value,
  onClose,
  onSelect,
}: {
  open: boolean
  storages: StorageLocation[]
  value: string
  onClose: () => void
  onSelect: (value: string) => void
}) {
  const allCount = storages.length

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[18px]">
            <Boxes className="size-5 text-primary" />
            اختيار المخزن
          </DialogTitle>
          <DialogDescription>
            اعرض قطع مخزن واحد بالضغط على رقمه
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => onSelect('all')}
            className={cn(
              'flex h-14 w-full touch-target items-center gap-3 rounded-2xl border-2 px-4 text-start transition-colors',
              value === 'all'
                ? 'border-primary bg-primary/10'
                : 'border-black/10 bg-white hover:border-primary/50',
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted-foreground/10 text-[13px] font-bold tabular-nums text-foreground">
              {allCount}
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-bold text-foreground">
                كل المخازن
              </span>
              <span className="block text-[11px] text-muted-foreground">
                عرض كل القطع المتاحة
              </span>
            </span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            {storages.map((s) => {
              const active = value === String(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelect(String(s.id))}
                  className={cn(
                    'flex h-16 touch-target items-center gap-3 rounded-2xl border-2 px-3 text-start transition-colors',
                    active
                      ? 'border-primary bg-primary/10'
                      : 'border-black/10 bg-white hover:border-primary/50',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold tabular-nums',
                      active
                        ? 'bg-primary text-white'
                        : 'bg-primary/10 text-primary',
                    )}
                  >
                    {s.id}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-bold text-foreground">
                      {s.name}
                    </span>
                    <span className="block text-[10px] tabular-nums text-muted-foreground">
                      مخزن #{s.id}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-full touch-target"
          >
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}