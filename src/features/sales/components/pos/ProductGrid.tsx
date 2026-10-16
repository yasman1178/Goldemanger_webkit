import { useMemo, useState } from 'react'
import {
  Search,
  X,
  Eye,
  Plus,
  TriangleAlert,
  ScanBarcode,
  LayoutGrid,
  Gem,
  Link2,
  CircleDashed,
  Ear,
  Layers,
  Package,
  Scale,
  Lock,
  LockOpen,
  ChevronDown,
  Clock,
  Sparkles,
  RefreshCw,
  Recycle,
  MapPin,
} from 'lucide-react'

import type { Product } from '@/features/products/types'
import { typeLabels } from '@/features/products/types'
import { salePerGram } from '@/shared/lib/gold'
import { useTaxStore } from '@/shared/stores/tax-store'
import { cn, formatNumber } from '@/shared/lib/utils'
import type { StorageLocation } from '@/shared/types/api'
import type { CartLine } from './types'
import { karatLabel } from './types'
import { FormatEg } from './Money'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { StoragePicker } from '@/shared/components/StoragePicker'
import {
  WeightFilterDialog,
  type WeightRange,
} from '@/shared/components/WeightFilterDialog'

const categories = [
  { key: 'all', label: 'الكل', icon: LayoutGrid },
  { key: 'ring', label: 'خواتم ودبل', icon: Gem },
  { key: 'twin', label: 'توينز ومحابس', icon: Sparkles },
  { key: 'chain', label: 'سلاسل وعقود', icon: Link2 },
  { key: 'pendant', label: 'دلايات', icon: Gem },
  { key: 'bracelet', label: 'أساور وغوايش', icon: CircleDashed },
  { key: 'earring', label: 'حلق', icon: Ear },
  { key: 'set', label: 'أطقم', icon: Layers },
  { key: 'bar', label: 'سبائك وجنيهات', icon: Package },
  { key: 'new', label: 'جديد', icon: Sparkles },
  { key: 'renewed', label: 'مجدّد', icon: RefreshCw },
  { key: 'break', label: 'كسر', icon: Recycle },
]

function matchCategory(product: Product, key: string): boolean {
  if (key === 'all') return true
  if (key === 'new') return product.typegolde === 1
  if (key === 'renewed') return product.typegolde === 2
  if (key === 'break') return product.typegolde === 3
  const name = `${product.productName} ${product.productType ?? ''}`.toLowerCase()
  const map: Record<string, string[]> = {
    ring: ['خاتم', 'دبلة', 'دبله', 'ring', 'band'],
    twin: ['توينز', 'توين', 'محبس', 'twin'],
    chain: ['سلسلة', 'سلسال', 'عقد', 'كوليه', 'chai', 'necklace'],
    pendant: [
      'دلاية',
      'دلايه',
      'ميدالية',
      'ميداليه',
      'تعليقة',
      'تعليقه',
      'علّاقة',
      'علاقة',
      'pendant',
      'charm',
    ],
    bracelet: [
      'سوار',
      'bracelet',
      'أسورة',
      'اسورة',
      'غويشة',
      'غويشه',
      'غوايش',
      'انسيال',
    ],
    earring: ['حلق', 'earr', 'قرط'],
    set: ['طقم', 'set'],
    bar: ['سبيكة', 'سبيكه', 'سبائك', 'bar', 'جنيه', 'اونصة'],
  }

  if (key === 'ring') {
    const isTwin = ['توينز', 'توين', 'محبس', 'twin'].some((t) => name.includes(t))
    if (isTwin) return false
    return (map.ring ?? []).some((s) => name.includes(s))
  }

  if (key === 'chain') {
    const isPendant = [
      'دلاية',
      'دلايه',
      'ميدالية',
      'ميداليه',
      'تعليقة',
      'تعليقه',
      'علّاقة',
      'علاقة',
      'pendant',
      'charm',
    ].some((p) => name.includes(p))
    if (isPendant) return false
    return (map.chain ?? []).some((s) => name.includes(s))
  }

  return (map[key] ?? []).some((s) => name.includes(s))
}

const typeBadgeClasses: Record<number, string> = {
  1: 'bg-black/5 text-success',
  2: 'bg-black/5 text-primary',
  3: 'bg-black/5 text-warning',
}

function salePriceFor(product: Product, goldPrice: number, taxRate = 0.01): number {
  const perGram = salePerGram(goldPrice, product.karat)
  const metal = perGram
  const taxAndStamp = metal * (taxRate >= 0 ? taxRate : 0.01)
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
  view?: 'pos' | 'held'
  heldCount?: number
  onViewChange?: (view: 'pos' | 'held') => void
}

export function ProductGrid({
  products,
  cart,
  goldPrice,
  onAdd,
  freezeGold,
  onToggleFreezeGold,
  storages,
  view = 'pos',
  heldCount = 0,
  onViewChange,
}: Props) {
  const [query, setQuery] = useState('')
  const [barcode, setBarcode] = useState('')
  const [category, setCategory] = useState('all')
  const [storageFilter, setStorageFilter] = useState('all')
  const [preview, setPreview] = useState<Product | null>(null)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [weightDialogOpen, setWeightDialogOpen] = useState(false)
  const [weightRange, setWeightRange] = useState<WeightRange>({ min: null, max: null })
  const [barcodeStatus, setBarcodeStatus] = useState<
    'idle' | 'notfound' | 'found'
  >('idle')

  const cartCount = useMemo(
    () => new Map(cart.map((l) => [l.product.productId, l.quantity])),
    [cart],
  )
  const stampAndTaxRate = useTaxStore((s) => s.stampAndTaxRate)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      if (!p.isActive || !p.productId || (p.quantity ?? 0) <= 0) return false
      if (!matchCategory(p, category)) return false
      if (storageFilter !== 'all' && String(p.storageId) !== storageFilter)
        return false
      if (weightRange.min != null && (p.weight ?? 0) < weightRange.min)
        return false
      if (weightRange.max != null && (p.weight ?? 0) > weightRange.max)
        return false
      if (!q) return true
      return (
        p.productName.toLowerCase().includes(q) ||
        (p.sku ?? '').toLowerCase().includes(q) ||
        (p.barcode ?? '').toLowerCase().includes(q)
      )
    })
  }, [products, query, category, storageFilter, weightRange])

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
  const activeCategory = categories.find((c) => c.key === category)
  const ActiveCategoryIcon = activeCategory?.icon ?? LayoutGrid
  const isFreezed = freezeGold

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* شريط واحد مدمج: كل أدوات POS في سطر واحد لتوفير المساحة */}
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max items-center gap-1.5">
          {/* تبديل الشاشة (شاشة البيع / المعلقات) */}
          {onViewChange && (
            <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-black/5 p-0.5">
              <button
                type="button"
                onClick={() => onViewChange('pos')}
                className={cn(
                  'h-10 touch-target rounded-full px-3.5 text-[12px] font-bold transition-colors',
                  view === 'pos'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-foreground/70 hover:text-foreground',
                )}
              >
                شاشة البيع
              </button>
              <button
                type="button"
                onClick={() => onViewChange('held')}
                className={cn(
                  'flex h-10 touch-target items-center gap-1.5 rounded-full px-3.5 text-[12px] font-bold transition-colors',
                  view === 'held'
                    ? 'bg-warning text-white shadow-xs'
                    : 'text-foreground/70 hover:text-foreground',
                )}
              >
                <Clock className="size-3.5" />
                المعلقات
                {heldCount > 0 && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] leading-none',
                      view === 'held'
                        ? 'bg-white/25 text-white'
                        : 'bg-warning/15 text-warning',
                    )}
                  >
                    {heldCount}
                  </span>
                )}
              </button>
            </div>
          )}

          <span className="h-8 w-px shrink-0 bg-black/10" aria-hidden />

          {/* تثبيت سعر الذهب */}
          <button
            type="button"
            onClick={onToggleFreezeGold}
            aria-pressed={isFreezed}
            className={cn(
              'flex h-10 shrink-0 touch-target items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold transition-colors',
              isFreezed
                ? 'border-amber-300 bg-amber-50 text-amber-700'
                : 'border-black/10 bg-white text-muted-foreground hover:border-amber-300/60 hover:text-amber-700',
            )}
          >
            {isFreezed ? <Lock className="size-3.5" /> : <LockOpen className="size-3.5" />}
            {isFreezed ? 'مثبّت' : 'تثبيت السعر'}
          </button>

          {/* البحث */}
          <div className="relative w-[min(24vw,220px)] min-w-[160px] shrink-0">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث باسم القطعة أو SKU أو الباركود"
              className="h-10 w-full touch-target rounded-full border border-input bg-white ps-9 pe-9 text-[12px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            {query && (
              <button
                type="button"
                aria-label="مسح البحث"
                onClick={() => setQuery('')}
                className="absolute end-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/5 text-muted-foreground touch-target"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* الباركود */}
          <form
            onSubmit={handleBarcodeSubmit}
            className={cn(
              'relative flex w-[min(24vw,220px)] min-w-[160px] shrink-0 items-center',
              barcodeStatus === 'found'
                ? '[&_input]:border-emerald-400'
                : barcodeStatus === 'notfound'
                  ? '[&_input]:border-rose-400'
                  : '',
            )}
          >
            <ScanBarcode className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={barcode}
              onChange={(e) => {
                setBarcode(e.target.value)
                setBarcodeStatus('idle')
              }}
              onFocus={() => setBarcodeStatus('idle')}
              dir="ltr"
              placeholder="أدخل الباركود ثم Enter"
              className="h-10 w-full touch-target rounded-full border border-input bg-white ps-9 pe-9 text-end text-[12px] tabular-nums text-foreground outline-none placeholder:text-muted-foreground placeholder:text-start focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </form>

          {/* التصنيفات (في ديالوج لتوفير المساحة) */}
          <button
            type="button"
            onClick={() => setCategoryOpen(true)}
            className="flex h-10 shrink-0 touch-target items-center gap-1.5 rounded-full border px-3 text-[12px] font-bold transition-colors hover:border-primary/50 hover:text-primary"
            aria-haspopup="dialog"
          >
            <ActiveCategoryIcon className="size-4 text-amber-500" />
            <span className={category === 'all' ? 'text-muted-foreground' : 'text-foreground'}>
              {activeCategory?.label ?? 'التصنيفات'}
            </span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>

          {/* المخزن (في ديالوج) */}
          <StoragePicker
            value={storageFilter}
            storages={storages}
            onChange={(value) => setStorageFilter(value)}
            allLabel="كل المخازن"
            placeholder="المخزن"
            triggerClassName={
              selectedStorage
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-dashed border-black/25 bg-white text-muted-foreground hover:border-primary/60 hover:text-primary'
            }
          />

          {/* فلتر الوزن (ديالوج متكامل مع المخزن) */}
          {weightRange.min != null || weightRange.max != null ? (
            <div className="flex h-10 shrink-0 touch-target items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50/95 px-3 text-[12px] font-bold text-amber-900 shadow-xs">
              <Scale className="size-3.5 text-amber-600" />
              <button
                type="button"
                onClick={() => setWeightDialogOpen(true)}
                className="hover:underline cursor-pointer"
              >
                {weightRange.min ?? 0} - {weightRange.max ? `${weightRange.max} جم` : 'الكل'}
              </button>
              <button
                type="button"
                aria-label="مسح فلتر الوزن"
                onClick={() => setWeightRange({ min: null, max: null })}
                className="ms-0.5 flex size-4 items-center justify-center rounded-full bg-amber-200 text-amber-800 hover:bg-amber-300 cursor-pointer"
              >
                <X className="size-2.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setWeightDialogOpen(true)}
              className="flex h-10 shrink-0 touch-target items-center gap-1.5 rounded-full border border-dashed border-black/25 bg-white px-3 text-[12px] font-semibold text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary cursor-pointer"
            >
              <Scale className="size-3.5 text-muted-foreground" />
              <span>فلتر بالوزن</span>
            </button>
          )}
        </div>
      </div>

      {/* شبكة المنتجات */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Search className="size-10 text-muted-foreground" />
            <p className="text-[17px] font-semibold text-foreground">
              لا توجد قطع تطابق البحث
            </p>
            <p className="text-sm text-muted-foreground">
              جرّب تعديل نطاق الوزن أو التصنيف أو المخزن
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {filtered.map((product) => {
              const available =
                product.isActive && product.quantity > 0 && product.productId != null
              const inCart = available ? (cartCount.get(product.productId!) ?? 0) : 0
              const karatText = karatLabel(product.karat)
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
                    'group relative flex touch-target flex-col gap-1.5 rounded-[16px] border border-black/8 bg-white p-2 text-start elevation-card transition-all duration-150 active:scale-[0.98]',
                    available
                      ? 'cursor-pointer hover:border-amber-400 hover:shadow-md'
                      : 'cursor-not-allowed opacity-45',
                  )}
                >
                  {/* زر المعاينة السريعة */}
                  <button
                    type="button"
                    aria-label={`عرض تفاصيل ${product.productName}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setPreview(product)
                    }}
                    className="absolute end-2 top-2 z-10 flex size-7 items-center justify-center rounded-full bg-white/90 backdrop-blur-xs text-muted-foreground shadow-xs transition-colors hover:bg-white hover:text-foreground cursor-pointer"
                  >
                    <Eye className="size-3.5" />
                  </button>

                  {/* إشارة السلة أعلى الصورة */}
                  {inCart > 0 && (
                    <span className="absolute start-2 top-2 z-10 flex items-center gap-0.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-white shadow-xs">
                      +{inCart}
                    </span>
                  )}

                  {/* حاوية الصورة مع تدرج مجوهرات دافئ */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-[12px] border border-black/5 bg-gradient-to-b from-amber-50/20 via-neutral-50 to-neutral-100 flex items-center justify-center">
                    {product.primaryImageUrl ? (
                      <img
                        src={product.primaryImageUrl}
                        alt={product.productName}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1 text-center p-2">
                        <Gem className="size-6 text-amber-500/70" />
                        <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                          {formatNumber(product.weight)} جم
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-bold leading-[1.3] text-foreground">
                      {product.productName}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] font-semibold">
                      {available ? (
                        product.quantity === 1 ? (
                          <span className="inline-flex items-center gap-1 text-warning">
                            <TriangleAlert className="size-2.5" />
                            متبقي {product.quantity}
                          </span>
                        ) : (
                          <span className="text-emerald-600">متاح</span>
                        )
                      ) : (
                        <span className="text-destructive">غير متوفر</span>
                      )}
                    </p>

                    {/* شارات العيار والوزن ورقم المخزن البارزة بأرقام ثابتة */}
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <span className="inline-flex items-center rounded-md bg-amber-100/90 border border-amber-300/60 px-1.5 py-0.5 text-[10px] font-black leading-none text-amber-900 tabular-nums">
                        {karatText}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 border border-black/5 px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-foreground tabular-nums">
                        <Scale className="size-2.5 text-muted-foreground" />
                        {formatNumber(product.weight)} جم
                      </span>
                      {/* شارة رقم واسم المخزن للقطعة */}
                      <span
                        className="inline-flex items-center gap-1 rounded-md bg-sky-50 border border-sky-300/80 px-1.5 py-0.5 text-[9.5px] font-bold text-sky-900 tabular-nums shadow-2xs"
                        title={
                          storages.find((s) => s.id === product.storageId)?.name ||
                          (product.storageId != null ? `مخزن #${product.storageId}` : 'بدون مخزن')
                        }
                      >
                        <MapPin className="size-2.5 text-sky-600 shrink-0" />
                        <span>
                          {product.storageId != null ? `مخزن #${product.storageId}` : 'بدون مخزن'}
                        </span>
                      </span>
                      {product.typegolde >= 1 && product.typegolde <= 3 && (
                        <span
                          className={cn(
                            'inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-black leading-none',
                            typeBadgeClasses[product.typegolde] ??
                              'bg-black/5 text-foreground',
                          )}
                        >
                          {typeLabels[product.typegolde as keyof typeof typeLabels]}
                        </span>
                      )}
                    </div>

                    {(product.sku || product.barcode) && (
                      <p
                        dir="ltr"
                        className="mt-1 truncate text-end text-[8px] font-mono tabular-nums text-muted-foreground"
                      >
                        {product.sku ? `SKU: ${product.sku}` : ''}
                        {product.sku && product.barcode ? ' • ' : ''}
                        {product.barcode ? product.barcode : ''}
                      </p>
                    )}
                  </div>

                  {/* السعر الإجمالي بارز في الأسفل */}
                  <div className="mt-auto flex items-center justify-between border-t border-black/6 pt-1.5">
                    <span className="tabular-nums text-[13px] font-black text-primary">
                      <FormatEg value={salePriceFor(product, goldPrice, stampAndTaxRate)} />
                      <span className="ms-0.5 text-[9px] font-bold text-amber-600">
                        ج.م
                      </span>
                    </span>
                    {available && (
                      <div className="flex size-6 items-center justify-center rounded-full bg-secondary text-muted-foreground group-hover:bg-primary group-hover:text-white transition-colors">
                        <Plus className="size-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ديالوج التصنيفات */}
      <CategoryDialog
        open={categoryOpen}
        onOpenChange={setCategoryOpen}
        value={category}
        onChange={(key) => {
          setCategory(key)
          setCategoryOpen(false)
        }}
      />

      {/* ديالوج فلترة الوزن المتكامل مع المخزن */}
      <WeightFilterDialog
        open={weightDialogOpen}
        onOpenChange={setWeightDialogOpen}
        range={weightRange}
        onApply={setWeightRange}
        items={products}
        currentStorageId={storageFilter}
        storageName={selectedStorage?.name || selectedStorage?.location || 'كل المخازن'}
      />

      <ProductQuickView
        product={preview}
        goldPrice={goldPrice}
        onClose={() => setPreview(null)}
        onAdd={(p) => {
          onAdd(p)
          setPreview(null)
        }}
      />
    </div>
  )
}

function CategoryDialog({
  open,
  onOpenChange,
  value,
  onChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: string
  onChange: (key: string) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[18px]">
            <LayoutGrid className="size-5 text-amber-500" />
            اختيار التصنيف
          </DialogTitle>
          <DialogDescription>
            اعرض القطع بالتصنيف الذي تريده — توفيراً للمساحة على شاشة البيع
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 sm:p-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {categories.map(({ key, label, icon: Icon }) => {
            const active = value === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange(key)}
                className={cn(
                  'flex h-16 touch-target flex-col items-center justify-center gap-1.5 rounded-2xl border-2 transition-colors',
                  active
                    ? 'border-primary bg-primary/10'
                    : 'border-black/10 bg-white hover:border-primary/50',
                )}
              >
                <Icon
                  className={cn(
                    'size-5',
                    active ? 'text-primary' : 'text-amber-500',
                  )}
                />
                <span
                  className={cn(
                    'text-[12px] font-bold',
                    active ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {label}
                </span>
              </button>
            )
          })}
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-11 flex-1 rounded-full touch-target"
          >
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
                  designLabel(product)
                }`
              : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 sm:p-6 space-y-2.5 text-[15px]">
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
              label="المخزن"
              value={product?.storageId != null ? `مخزن #${product.storageId}` : 'بدون مخزن'}
            />
            <QuickViewRow
              label="سعر البيع"
              value={
                product
                  ? `${formatNumber(salePriceFor(product, goldPrice, useTaxStore.getState().stampAndTaxRate))} ج.م`
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

function designLabel(product: Product): string {
  const map: Record<number, string> = {
    0: 'كلاسيك',
    1: 'بسيط',
    2: 'مخرّز',
    3: 'مودرن',
  }
  return map[product.design] ?? '—'
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