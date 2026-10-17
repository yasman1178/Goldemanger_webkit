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
  MapPin,
  Check,
  SlidersHorizontal,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
} from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/shared/components/ui/dropdown-menu'

import type { Product } from '@/features/products/types'
import { typeLabels } from '@/features/products/types'
import { salePerGram } from '@/shared/lib/gold'
import { useTaxStore } from '@/shared/stores/tax-store'
import { cn, formatNumber } from '@/shared/lib/utils'
import type { StorageLocation } from '@/shared/types/api'
import type { CartLine } from './types'
import { karatLabel } from './types'
import { FormatEg } from './Money'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogBody,
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

export const categories = [
  { key: 'all', label: 'كل التصنيفات', icon: LayoutGrid },
  { key: 'ring', label: 'خواتم ودبل', icon: Gem },
  { key: 'twin', label: 'توينز ومحابس', icon: Sparkles },
  { key: 'chain', label: 'سلاسل وعقود', icon: Link2 },
  { key: 'pendant', label: 'دلايات', icon: Gem },
  { key: 'bracelet', label: 'أساور وغوايش', icon: CircleDashed },
  { key: 'earring', label: 'حلقان', icon: Ear },
  { key: 'set', label: 'أطقم', icon: Layers },
  { key: 'bar', label: 'سبائك وجنيهات', icon: Package },
]

export const goldConditions = [
  { key: 'all', label: 'كل الحالات' },
  { key: '1', label: 'جديد' },
  { key: '2', label: 'مجدّد' },
  { key: '3', label: 'كسر' },
] as const

export const karatOptions = [
  { key: 'all', label: 'كل العيارات' },
  { key: '24', label: 'عيار 24' },
  { key: '21', label: 'عيار 21' },
  { key: '18', label: 'عيار 18' },
  { key: '14', label: 'عيار 14' },
] as const

export function matchCategory(product: Product, key: string): boolean {
  if (key === 'all') return true
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
  1: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
  2: 'bg-primary/10 text-primary border border-primary/20',
  3: 'bg-amber-50 text-amber-800 border border-amber-300/80',
}

export function resolveProductImageUrl(raw?: string | null): string {
  if (!raw || !raw.trim()) return ''
  let trimmed = raw.trim().replace(/\\/g, '/')
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    return trimmed
  }
  if (!trimmed.startsWith('/')) {
    trimmed = `/${trimmed}`
  }
  return trimmed
}

export function getProductDisplayImages(product: Product | null): string[] {
  if (!product) return []
  const list: string[] = []
  const add = (url?: string | null) => {
    const resolved = resolveProductImageUrl(url)
    if (resolved && !list.includes(resolved)) {
      list.push(resolved)
    }
  }

  add(product.primaryImageUrl)
  if (Array.isArray(product.imageUrls)) {
    for (const url of product.imageUrls) add(url)
  }
  if (Array.isArray(product.images)) {
    for (const img of product.images) add(img?.imageUrl)
  }
  add(product.imageLink)
  return list
}

export function getProductStorageName(
  product: { storageId?: number | null; storageName?: string | null },
  storages: StorageLocation[] = [],
): string {
  if (product.storageName && product.storageName.trim() !== '') {
    return product.storageName.trim()
  }
  if (product.storageId != null) {
    const sId = String(product.storageId)
    const match = storages.find(
      (s) => String(s.id) === sId || (s.branchId != null && String(s.branchId) === sId),
    )
    if (match?.name?.trim()) return match.name.trim()
    if (match?.location?.trim()) return match.location.trim()
  }
  if (storages.length > 0 && storages[0]?.name?.trim()) {
    return storages[0].name.trim()
  }
  return 'المخزن الرئيسي'
}

function salePriceFor(product: Product, goldPrice: number, taxRate = 0.01): number {
  const perGram = salePerGram(goldPrice, product.karat)
  const metal = perGram
  const taxAndStamp = metal * (taxRate >= 0 ? taxRate : 0.01)
  const making = useTaxStore
    .getState()
    .getEffectiveMakingFee(product.karat, product.factoryForSale || product.factory)
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
  const [goldTypeFilter, setGoldTypeFilter] = useState('all')
  const [karatFilter, setKaratFilter] = useState('all')
  const [storageFilter, setStorageFilter] = useState('all')
  const [preview, setPreview] = useState<Product | null>(null)
  const [combinedFiltersOpen, setCombinedFiltersOpen] = useState(false)
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
      if (karatFilter !== 'all' && (p.karat == null || Math.round(p.karat) !== Number(karatFilter)))
        return false
      if (goldTypeFilter !== 'all' && String(p.typegolde) !== goldTypeFilter)
        return false
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
  }, [products, query, category, goldTypeFilter, karatFilter, storageFilter, weightRange])

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

  // عدد الفلاتر النشطة لحساب شارة الفلاتر المدمجة
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (category !== 'all') count++
    if (goldTypeFilter !== 'all') count++
    if (karatFilter !== 'all') count++
    if (storageFilter !== 'all') count++
    if (weightRange.min != null || weightRange.max != null) count++
    return count
  }, [category, goldTypeFilter, karatFilter, storageFilter, weightRange])

  function resetAllFilters() {
    setCategory('all')
    setGoldTypeFilter('all')
    setKaratFilter('all')
    setStorageFilter('all')
    setWeightRange({ min: null, max: null })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* شريط واحد مدمج: كل أدوات POS في سطر واحد لتوفير المساحة على التابلت */}
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max items-center gap-1.5">
          {/* تبديل الشاشة (شاشة البيع / المعلقات) */}
          {onViewChange && (
            <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-black/5 p-0.5">
              <button
                type="button"
                onClick={() => onViewChange('pos')}
                className={cn(
                  'h-10 touch-target rounded-full px-3.5 text-[12px] font-bold transition-colors cursor-pointer',
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
                  'flex h-10 touch-target items-center gap-1.5 rounded-full px-3.5 text-[12px] font-bold transition-colors cursor-pointer',
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
              'flex h-10 shrink-0 touch-target items-center gap-1.5 rounded-full border px-3 text-[11px] font-bold transition-colors cursor-pointer',
              isFreezed
                ? 'border-amber-300 bg-amber-50 text-amber-700'
                : 'border-black/10 bg-white text-muted-foreground hover:border-amber-300/60 hover:text-amber-700',
            )}
          >
            {isFreezed ? <Lock className="size-3.5" /> : <LockOpen className="size-3.5" />}
            {isFreezed ? 'مثبّت' : 'تثبيت السعر'}
          </button>

          {/* البحث بالاسم أو SKU أو الباركود */}
          <div className="relative w-[min(24vw,220px)] min-w-[160px] shrink-0">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث بالاسم، SKU، الباركود"
              className="h-10 w-full touch-target rounded-full border border-input bg-white ps-9 pe-9 text-[12px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            {query && (
              <button
                type="button"
                aria-label="مسح البحث"
                onClick={() => setQuery('')}
                className="absolute end-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/5 text-muted-foreground touch-target cursor-pointer hover:bg-black/10"
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

          {/* زر منسدل سريع: التصنيف */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex h-10 shrink-0 touch-target items-center gap-1.5 rounded-full border px-3 text-[12px] font-bold transition-colors cursor-pointer',
                  category !== 'all'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-black/10 bg-white text-muted-foreground hover:border-primary/50 hover:text-primary',
                )}
              >
                <ActiveCategoryIcon className="size-4 text-amber-500" />
                <span>
                  {category === 'all' ? 'التصنيف' : activeCategory?.label ?? 'التصنيف'}
                </span>
                {category !== 'all' ? (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="مسح فلتر التصنيف"
                    onClick={(e) => {
                      e.stopPropagation()
                      setCategory('all')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation()
                        setCategory('all')
                      }
                    }}
                    className="ms-0.5 flex size-4 items-center justify-center rounded-full bg-primary/20 text-primary hover:bg-primary/30"
                  >
                    <X className="size-2.5" />
                  </span>
                ) : (
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 rounded-2xl p-1.5 shadow-lg">
              {categories.map((c) => {
                const Icon = c.icon
                return (
                  <DropdownMenuItem
                    key={c.key}
                    onClick={() => setCategory(c.key)}
                    className={cn(
                      'flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-[12px] font-bold',
                      category === c.key && 'bg-primary/10 text-primary',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="size-3.5 text-amber-500" />
                      {c.label}
                    </span>
                    {category === c.key && <Check className="size-3.5 text-primary" />}
                  </DropdownMenuItem>
                )
              })}
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                onClick={() => setCombinedFiltersOpen(true)}
                className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-bold text-muted-foreground hover:text-foreground"
              >
                <SlidersHorizontal className="size-3.5 text-primary" />
                <span>فتح الديالوج المدمج...</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* زر منسدل سريع: فلتر حالة الذهب (مفصول تماماً عن التصنيفات) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex h-10 shrink-0 touch-target items-center gap-1.5 rounded-full border px-3 text-[12px] font-bold transition-colors cursor-pointer',
                  goldTypeFilter !== 'all'
                    ? 'border-primary bg-primary/10 text-primary shadow-2xs'
                    : 'border-dashed border-black/25 bg-white text-muted-foreground hover:border-primary/60 hover:text-primary',
                )}
              >
                <Sparkles className="size-3.5 text-amber-500" />
                <span>
                  {goldTypeFilter === 'all'
                    ? 'حالة الذهب'
                    : goldConditions.find((c) => c.key === goldTypeFilter)?.label ?? 'حالة الذهب'}
                </span>
                {goldTypeFilter !== 'all' ? (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="مسح فلتر حالة الذهب"
                    onClick={(e) => {
                      e.stopPropagation()
                      setGoldTypeFilter('all')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation()
                        setGoldTypeFilter('all')
                      }
                    }}
                    className="ms-0.5 flex size-4 items-center justify-center rounded-full bg-primary/20 text-primary hover:bg-primary/30"
                  >
                    <X className="size-2.5" />
                  </span>
                ) : (
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40 rounded-2xl p-1.5 shadow-lg">
              {goldConditions.map((opt) => (
                <DropdownMenuItem
                  key={opt.key}
                  onClick={() => setGoldTypeFilter(opt.key)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-[12px] font-bold',
                    goldTypeFilter === opt.key && 'bg-primary/10 text-primary',
                  )}
                >
                  <span>{opt.label}</span>
                  {goldTypeFilter === opt.key && <Check className="size-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* زر منسدل سريع: فلتر العيار */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex h-10 shrink-0 touch-target items-center gap-1.5 rounded-full border px-3 text-[12px] font-bold transition-colors cursor-pointer',
                  karatFilter !== 'all'
                    ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-2xs font-extrabold'
                    : 'border-dashed border-black/25 bg-white text-muted-foreground hover:border-amber-400/60 hover:text-amber-800',
                )}
              >
                <Gem className="size-3.5 text-amber-500" />
                <span>{karatFilter === 'all' ? 'العيار' : `عيار ${karatFilter}`}</span>
                {karatFilter !== 'all' ? (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="مسح فلتر العيار"
                    onClick={(e) => {
                      e.stopPropagation()
                      setKaratFilter('all')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation()
                        setKaratFilter('all')
                      }
                    }}
                    className="ms-0.5 flex size-4 items-center justify-center rounded-full bg-amber-200 text-amber-900 hover:bg-amber-300"
                  >
                    <X className="size-2.5" />
                  </span>
                ) : (
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-36 rounded-2xl p-1.5 shadow-lg">
              {karatOptions.map((opt) => (
                <DropdownMenuItem
                  key={opt.key}
                  onClick={() => setKaratFilter(opt.key)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-[12px] font-bold',
                    karatFilter === opt.key && 'bg-amber-50 text-amber-900',
                  )}
                >
                  <span>{opt.label}</span>
                  {karatFilter === opt.key && <Check className="size-3.5 text-amber-600" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

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

          {/* فلتر الوزن */}
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

          {/* زر الديالوج المدمج الشامل: كل الفلاتر والتصنيفات في مكان واحد */}
          <button
            type="button"
            onClick={() => setCombinedFiltersOpen(true)}
            className={cn(
              'flex h-10 shrink-0 touch-target items-center gap-1.5 rounded-full border px-3 text-[12px] font-bold transition-all cursor-pointer',
              activeFiltersCount > 0
                ? 'border-primary bg-primary text-white shadow-xs'
                : 'border-black/10 bg-white text-foreground hover:border-primary/50',
            )}
            title="فتح نافذة الفلاتر والتصنيفات المدمجة"
          >
            <SlidersHorizontal className="size-3.5" />
            <span>فلاتر القطع</span>
            {activeFiltersCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-white text-[11px] font-black text-primary leading-none">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* شبكة المنتجات وقسم القطع المضافة المثبت بأعلى يمين الشاشة */}
      <div className="min-h-0 flex-1 overflow-y-auto space-y-3.5 pe-1">
        {/* قسم القطع المضافة للفاتورة: يظل ثابتاً ومفعلاً دائماً في يمين الشاشة حتى عند تغيير التصنيف */}
        {cart.length > 0 && (
          <div className="rounded-[16px] border border-primary/25 bg-gradient-to-br from-primary/[0.04] via-amber-500/[0.03] to-white p-3 shadow-xs">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary text-white text-[11px] font-black shadow-xs">
                  {cart.length}
                </span>
                <span className="text-[13px] font-bold text-foreground">
                  القطع المضافة للفاتورة (مفعلة دائماً)
                </span>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  • تظل مثبتة هنا حتى بعد اختيار تصنيف مختلف
                </span>
              </div>
              <span className="text-[11.5px] font-extrabold text-primary tabular-nums">
                إجمالي الوزن: {formatNumber(cart.reduce((s, l) => s + l.weight * l.quantity, 0))} جم
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
              {cart.map((line) => {
                const product = line.product
                const images = getProductDisplayImages(product)
                const displayImage = images[0]
                const karatText = karatLabel(product.karat)
                const sName = getProductStorageName(product, storages)
                return (
                  <div
                    key={`cart-pinned-${line.key}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => onAdd(product)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onAdd(product)
                      }
                    }}
                    title="اضغط لإلغاء التحديد وحذف القطعة من الفاتورة"
                    className="group relative flex touch-target flex-col gap-1.5 rounded-[14px] border border-primary bg-white p-2 text-start elevation-card ring-2 ring-primary/40 shadow-xs cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <button
                      type="button"
                      aria-label={`معاينة ${product.productName}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreview(product)
                      }}
                      className="absolute end-1.5 top-1.5 z-10 flex size-7 items-center justify-center rounded-full bg-white/95 text-muted-foreground shadow-xs hover:text-primary cursor-pointer border border-black/5"
                    >
                      <Eye className="size-3.5" />
                    </button>

                    <span className="absolute start-1.5 top-1.5 z-10 flex items-center gap-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-black text-white shadow-xs">
                      <Check className="size-2.5" />
                      محدد
                    </span>

                    <div className="relative aspect-square w-full overflow-hidden rounded-[10px] border border-black/5 bg-gradient-to-b from-amber-50/20 via-neutral-50 to-neutral-100 flex items-center justify-center p-1">
                      {displayImage ? (
                        <img
                          src={displayImage}
                          alt={product.productName}
                          className="h-full w-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 text-center p-1">
                          <Gem className="size-5 text-amber-500/70" />
                          <span className="text-[9.5px] font-bold text-muted-foreground tabular-nums">
                            {formatNumber(line.weight)} جم
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11.5px] font-bold text-foreground">
                        {product.productName}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <span className="rounded bg-amber-100/90 border border-amber-300/60 px-1 py-0.2 text-[9px] font-black text-amber-900 tabular-nums">
                          {karatText}
                        </span>
                        <span className="rounded bg-neutral-100 border border-black/5 px-1 py-0.2 text-[9px] font-extrabold text-foreground tabular-nums">
                          {formatNumber(line.weight)} جم
                        </span>
                      </div>
                      <span className="mt-1 inline-flex items-center gap-0.5 text-[9px] font-bold text-sky-800 truncate max-w-full">
                        <MapPin className="size-2.5 shrink-0 text-sky-600" />
                        <span className="truncate">{sName}</span>
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* عنوان المعروضات حسب التصنيف النشط والفلاتر */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-[12.5px] font-bold text-muted-foreground flex items-center gap-1.5">
            <ActiveCategoryIcon className="size-3.5 text-amber-500" />
            <span>المعروضات ({activeCategory?.label ?? 'الكل'})</span>
            <span className="text-[11px] font-medium text-muted-foreground/80">
              — {filtered.length} قطعة متاحة
            </span>
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Search className="size-10 text-muted-foreground" />
            <p className="text-[17px] font-semibold text-foreground">
              لا توجد قطع تطابق البحث
            </p>
            <p className="text-sm text-muted-foreground">
              جرّب تعديل العيار أو حالة الذهب أو التصنيف أو المخزن
            </p>
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                onClick={resetAllFilters}
                className="mt-2 rounded-full h-10 px-4 text-xs font-bold"
              >
                إلغاء تفعيل كل الفلاتر ({activeFiltersCount})
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {filtered.map((product) => {
              const available =
                product.isActive && product.quantity > 0 && product.productId != null
              const inCart = available ? (cartCount.get(product.productId!) ?? 0) : 0
              const karatText = karatLabel(product.karat)
              const images = getProductDisplayImages(product)
              const displayImage = images[0]

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
                    'group relative flex touch-target flex-col gap-1.5 rounded-[16px] border p-2 text-start elevation-card transition-all duration-150 active:scale-[0.98]',
                    inCart > 0
                      ? 'border-primary bg-primary/[0.04] ring-2 ring-primary/40 shadow-xs cursor-pointer'
                      : available
                        ? 'border-black/8 bg-white hover:border-amber-400 hover:shadow-md cursor-pointer'
                        : 'border-black/8 bg-white cursor-not-allowed opacity-45',
                  )}
                >
                  {/* زر المعاينة السريعة للصورة وتفاصيل القطعة */}
                  <button
                    type="button"
                    aria-label={`عرض صورة وتفاصيل ${product.productName}`}
                    title="معاينة الصورة والبيانات بالكامل"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPreview(product)
                    }}
                    className="absolute end-2 top-2 z-10 flex size-8 items-center justify-center rounded-full bg-white/95 backdrop-blur-md text-muted-foreground shadow-sm transition-all hover:bg-white hover:text-primary hover:scale-110 cursor-pointer border border-black/5"
                  >
                    <Eye className="size-4" />
                  </button>

                  {/* إشارة السلة أعلى الصورة: توضح إمكانية إلغاء التحديد فوراً عند الضغط */}
                  {inCart > 0 && (
                    <span
                      className="absolute start-2 top-2 z-10 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[9.5px] font-black text-white shadow-xs"
                      title="اضغط لإلغاء التحديد وحذف القطعة من الفاتورة"
                    >
                      <Check className="size-2.5" />
                      محدد
                    </span>
                  )}

                  {/* حاوية الصورة مع تدرج مجوهرات دافئ تمنع اقتصاص القطعة */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-[12px] border border-black/5 bg-gradient-to-b from-amber-50/20 via-neutral-50 to-neutral-100 flex items-center justify-center p-1">
                    {displayImage ? (
                      <img
                        src={displayImage}
                        alt={product.productName}
                        className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
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
                      {/* شارة اسم المخزن الفعلي للقطعة */}
                      {(() => {
                        const sName = getProductStorageName(product, storages)
                        return (
                          <span
                            className="inline-flex items-center gap-1 rounded-md bg-sky-50 border border-sky-300/80 px-1.5 py-0.5 text-[9.5px] font-bold text-sky-900 tabular-nums shadow-2xs max-w-[130px]"
                            title={sName}
                          >
                            <MapPin className="size-2.5 text-sky-600 shrink-0" />
                            <span className="truncate">{sName}</span>
                          </span>
                        )
                      })()}
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

                  {/* السعر الإجمالي وزر الإضافة/الحذف السريع */}
                  <div className="mt-auto flex items-center justify-between border-t border-black/6 pt-1.5">
                    <span className="tabular-nums text-[13px] font-black text-primary">
                      <FormatEg value={salePriceFor(product, goldPrice, stampAndTaxRate)} />
                      <span className="ms-0.5 text-[9px] font-bold text-amber-600">
                        ج.م
                      </span>
                    </span>
                    {available && (
                      <div
                        title={
                          inCart > 0
                            ? 'القطعة محددة بالسلة — اضغط لإلغاء التحديد وحذفها'
                            : 'اضغط للإضافة للفاتورة'
                        }
                        className={cn(
                          'flex size-6 items-center justify-center rounded-full transition-all',
                          inCart > 0
                            ? 'bg-primary text-white group-hover:bg-rose-600 group-hover:text-white shadow-xs'
                            : 'bg-secondary text-muted-foreground group-hover:bg-primary group-hover:text-white',
                        )}
                      >
                        {inCart > 0 ? (
                          <>
                            <Check className="size-3.5 group-hover:hidden" />
                            <X className="size-3.5 hidden group-hover:block" />
                          </>
                        ) : (
                          <Plus className="size-3.5" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ديالوج الفلاتر والتصنيفات المدمج: يجمع العيار، حالة الذهب، والتصنيفات بحرية كاملة */}
      <CombinedFiltersDialog
        open={combinedFiltersOpen}
        onOpenChange={setCombinedFiltersOpen}
        category={category}
        onCategoryChange={setCategory}
        goldTypeFilter={goldTypeFilter}
        onGoldTypeChange={setGoldTypeFilter}
        karatFilter={karatFilter}
        onKaratChange={setKaratFilter}
        storageFilter={storageFilter}
        onStorageChange={setStorageFilter}
        storages={storages}
        matchingCount={filtered.length}
        onResetAll={resetAllFilters}
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

      {/* معاينة سريعة وكاملة للصورة مع إمكانية التكبير ملء الشاشة وإلغاء/إضافة السلة */}
      <ProductQuickView
        product={preview}
        goldPrice={goldPrice}
        storages={storages}
        inCart={preview && preview.productId ? (cartCount.get(preview.productId) ?? 0) : 0}
        onClose={() => setPreview(null)}
        onToggleCart={(p) => {
          onAdd(p)
        }}
      />
    </div>
  )
}

/**
 * ديالوج الفلاتر المدمج (Combined Filters Dialog)
 * يفصل تصنيف القطعة (حلقان، خواتم...) عن حالة الذهب (جديد، مجدد، كسر) وعن العيار (24، 21، 18، 14)
 * ويسمح بتعديلهم معاً دون أي تعارض
 */
function CombinedFiltersDialog({
  open,
  onOpenChange,
  category,
  onCategoryChange,
  goldTypeFilter,
  onGoldTypeChange,
  karatFilter,
  onKaratChange,
  storageFilter,
  onStorageChange,
  storages,
  matchingCount,
  onResetAll,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: string
  onCategoryChange: (k: string) => void
  goldTypeFilter: string
  onGoldTypeChange: (k: string) => void
  karatFilter: string
  onKaratChange: (k: string) => void
  storageFilter: string
  onStorageChange: (k: string) => void
  storages: StorageLocation[]
  matchingCount: number
  onResetAll: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-w-[calc(100%-1rem)] max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-[26px]">
        <DialogHeader className="px-6 pt-5 pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-5 text-primary" />
              <DialogTitle className="text-[17px] font-bold">فلاتر وتصنيفات القطع</DialogTitle>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary tabular-nums">
              {matchingCount} قطعة مطابقة
            </span>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            حدد التصنيف والعيار وحالة الذهب معاً بحرية تامة دون تعارض
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-5">
          {/* قسم 1: التصنيف (خواتم، سلاسل، حلقان...) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <LayoutGrid className="size-3.5 text-amber-500" />
                تصنيف القطعة
              </label>
              {category !== 'all' && (
                <button
                  type="button"
                  onClick={() => onCategoryChange('all')}
                  className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                >
                  الكل
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
              {categories.map(({ key, label, icon: Icon }) => {
                const active = category === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onCategoryChange(key)}
                    className={cn(
                      'flex h-12 touch-target items-center justify-center gap-1.5 rounded-xl border px-2.5 text-center text-xs font-bold transition-all cursor-pointer',
                      active
                        ? 'border-primary bg-primary/10 text-primary shadow-xs'
                        : 'border-black/10 bg-white text-foreground hover:border-primary/40',
                    )}
                  >
                    <Icon className={cn('size-3.5 shrink-0', active ? 'text-primary' : 'text-amber-500')} />
                    <span className="truncate">{label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* قسم 2: حالة الذهب (مفصول تماماً: جديد / مجدد / كسر) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-amber-500" />
                حالة الذهب (مفصولة ومستقلة)
              </label>
              {goldTypeFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => onGoldTypeChange('all')}
                  className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                >
                  الكل
                </button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {goldConditions.map((cond) => {
                const active = goldTypeFilter === cond.key
                return (
                  <button
                    key={cond.key}
                    type="button"
                    onClick={() => onGoldTypeChange(cond.key)}
                    className={cn(
                      'flex h-11 touch-target items-center justify-center rounded-xl border text-xs font-bold transition-all cursor-pointer',
                      active
                        ? 'border-primary bg-primary text-white shadow-xs'
                        : 'border-black/10 bg-white text-foreground hover:border-primary/40',
                    )}
                  >
                    {cond.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* قسم 3: العيار (مفصول تماماً: 24 / 21 / 18 / 14) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Gem className="size-3.5 text-amber-500" />
                العيار
              </label>
              {karatFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => onKaratChange('all')}
                  className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                >
                  الكل
                </button>
              )}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {karatOptions.map((k) => {
                const active = karatFilter === k.key
                return (
                  <button
                    key={k.key}
                    type="button"
                    onClick={() => onKaratChange(k.key)}
                    className={cn(
                      'flex h-11 touch-target items-center justify-center rounded-xl border text-xs font-bold transition-all cursor-pointer tabular-nums',
                      active
                        ? 'border-amber-400 bg-amber-500 text-white shadow-xs font-extrabold'
                        : 'border-black/10 bg-white text-foreground hover:border-amber-300',
                    )}
                  >
                    {k.key === 'all' ? 'الكل' : `${k.key}k`}
                  </button>
                )
              })}
            </div>
          </div>

          {/* قسم 4: المخزن */}
          {storages.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <MapPin className="size-3.5 text-sky-500" />
                المخزن
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onStorageChange('all')}
                  className={cn(
                    'h-10 touch-target rounded-xl border px-3 text-xs font-bold transition-all cursor-pointer',
                    storageFilter === 'all'
                      ? 'border-sky-500 bg-sky-50 text-sky-800'
                      : 'border-black/10 bg-white text-muted-foreground hover:border-sky-300',
                  )}
                >
                  كل المخازن
                </button>
                {storages.map((s) => {
                  const active = storageFilter === String(s.id)
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onStorageChange(String(s.id))}
                      className={cn(
                        'h-10 touch-target rounded-xl border px-3 text-xs font-bold transition-all cursor-pointer',
                        active
                          ? 'border-sky-500 bg-sky-50 text-sky-800'
                          : 'border-black/10 bg-white text-muted-foreground hover:border-sky-300',
                      )}
                    >
                      {s.name || s.location || `مخزن #${s.id}`}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter className="px-6 py-3.5 flex flex-row items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onResetAll}
            className="rounded-full h-11 px-4 text-xs font-bold text-muted-foreground hover:text-foreground touch-target"
          >
            إعادة ضبط الفلاتر
          </Button>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full h-11 px-6 text-xs font-bold bg-primary text-white touch-target shadow-xs"
          >
            تطبيق (عرض {matchingCount} قطعة)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * معاينة تفصيلية للقطعة:
 * تم حل مشكلة ظهور الصورة غير كاملة عبر:
 * 1. استخدام DialogBody لضمان التمرير الكامل وعدم اقتصاص الصورة على أي شاشة تابلت
 * 2. عرض الصورة كاملة بأبعاد uncropped وتوسيط متناسق
 * 3. إضافة زر "تكبير الصورة بالكامل" Lightbox يتيح معاينة تفاصيل القطعة والدمغة بملء الشاشة مع التكبير
 * 4. إظهار زر إلغاء التحديد وحذفها من السلة إذا كانت محددة
 */
function ProductQuickView({
  product,
  goldPrice,
  storages = [],
  inCart = 0,
  onClose,
  onToggleCart,
}: {
  product: Product | null
  goldPrice: number
  storages?: StorageLocation[]
  inCart?: number
  onClose: () => void
  onToggleCart: (p: Product) => void
}) {
  const [selectedImgIndex, setSelectedImgIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const available = Boolean(
    product && product.isActive && product.quantity > 0 && product.productId != null,
  )

  const effectiveMaking = product
    ? useTaxStore
        .getState()
        .getEffectiveMakingFee(product.karat, product.factoryForSale || product.factory)
    : 0

  const storageName = product ? getProductStorageName(product, storages) : 'بدون مخزن'
  const images = useMemo(() => getProductDisplayImages(product), [product])
  const currentImage = images[selectedImgIndex] || images[0]

  return (
    <>
      <Dialog
        open={Boolean(product) && !lightboxOpen}
        onOpenChange={(o) => {
          if (!o) {
            setSelectedImgIndex(0)
            onClose()
          }
        }}
      >
        <DialogContent className="sm:max-w-xl max-w-[calc(100%-1rem)] max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-[26px]">
          <DialogHeader className="px-6 pt-5 pb-3">
            <div className="flex items-center justify-between pe-8">
              <div>
                <DialogTitle className="text-[17px] font-bold">
                  {product?.productName ?? ''}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {product
                    ? `${typeLabels[product.typegolde as keyof typeof typeLabels] || 'ذهب'} • ${
                        designLabel(product)
                      }`
                    : ''}
                </DialogDescription>
              </div>
              {inCart > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-[11px] font-bold text-primary">
                  <Check className="size-3" />
                  محدد في الفاتورة ({inCart})
                </span>
              )}
            </div>
          </DialogHeader>

          <DialogBody className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
            {/* حاوية الصورة الكاملة مع زر التكبير والألبومات المتعددة */}
            {currentImage ? (
              <div className="space-y-2">
                <div className="relative flex min-h-[260px] sm:min-h-[300px] max-h-[50vh] sm:max-h-[55vh] w-full items-center justify-center rounded-2xl border border-black/8 bg-gradient-to-b from-neutral-50 via-slate-50 to-neutral-100 p-3 group shadow-2xs">
                  <img
                    src={currentImage}
                    alt={product?.productName}
                    className="h-auto max-h-[46vh] sm:max-h-[50vh] w-auto max-w-full object-contain drop-shadow-md select-none transition-transform duration-200 group-hover:scale-[1.02] cursor-zoom-in"
                    onClick={() => setLightboxOpen(true)}
                  />

                  {/* زر التكبير ملء الشاشة لعرض كامل تفاصيل الصورة */}
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    className="absolute end-3 bottom-3 flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold text-foreground shadow-md transition-all hover:bg-white hover:text-primary cursor-pointer border border-black/5 touch-target"
                    title="تكبير الصورة ملء الشاشة لمعاينة التفاصيل والدمغة"
                  >
                    <Maximize2 className="size-3.5 text-primary" />
                    <span>تكبير الصورة كاملة</span>
                  </button>
                </div>

                {/* معرض الصور المصغرة إذا كانت القطعة تحتوي أكثر من صورة */}
                {images.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {images.map((img, idx) => (
                      <button
                        key={img}
                        type="button"
                        onClick={() => setSelectedImgIndex(idx)}
                        className={cn(
                          'relative size-14 shrink-0 overflow-hidden rounded-xl border-2 transition-all cursor-pointer',
                          selectedImgIndex === idx
                            ? 'border-primary ring-2 ring-primary/30'
                            : 'border-black/10 opacity-70 hover:opacity-100',
                        )}
                      >
                        <img src={img} alt="" className="size-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/15 bg-neutral-50">
                <Gem className="size-8 text-amber-500/60" />
                <span className="text-xs text-muted-foreground">لا تتوفر صورة لهذه القطعة</span>
              </div>
            )}

            {/* تفاصيل وبيانات القطعة المالية والفيزيائية */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <QuickViewRow label="العيار" value={`${product?.karat ?? 0}k`} highlight />
              <QuickViewRow label="الوزن" value={`${formatNumber(product?.weight ?? 0)} جم`} />
              <QuickViewRow
                label="المصنعية"
                value={`${formatNumber(effectiveMaking)} ج.م/جم`}
              />
              <QuickViewRow label="المخزن" value={storageName} />
              <QuickViewRow
                label="السعر المقدر للبيع"
                value={
                  product
                    ? `${formatNumber(salePriceFor(product, goldPrice, useTaxStore.getState().stampAndTaxRate))} ج.م`
                    : '—'
                }
                highlight
              />
              <QuickViewRow
                label="حالة التوفر"
                value={available ? 'متاح للبيع' : 'غير متوفر'}
              />
            </div>

            {(product?.sku || product?.barcode) && (
              <div className="rounded-xl border border-black/5 bg-slate-50/70 p-2.5 text-[12px] text-muted-foreground flex items-center justify-between">
                <span>الترميز والباركود:</span>
                <span dir="ltr" className="font-mono font-bold text-foreground">
                  {product?.sku && `SKU: ${product.sku}`}
                  {product?.sku && product?.barcode ? ' • ' : ''}
                  {product?.barcode && `باركود: ${product.barcode}`}
                </span>
              </div>
            )}
          </DialogBody>

          <DialogFooter className="px-6 py-3.5 flex flex-row items-center justify-between gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-full h-11 px-5 touch-target font-bold"
            >
              إغلاق
            </Button>

            {inCart > 0 ? (
              <Button
                type="button"
                onClick={() => product && onToggleCart(product)}
                className="rounded-full h-11 flex-1 gap-2 border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 touch-target font-bold"
              >
                <X className="size-4 text-rose-600" />
                <span>إلغاء التحديد وحذف من الفاتورة</span>
              </Button>
            ) : (
              <Button
                type="button"
                disabled={!available || !product}
                onClick={() => product && onToggleCart(product)}
                className="rounded-full h-11 flex-1 gap-2 bg-primary text-white touch-target font-bold shadow-xs hover:bg-primary/90"
              >
                <Plus className="size-4" />
                <span>إضافة إلى الفاتورة</span>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox تكبير الصورة كاملة ملء الشاشة */}
      {lightboxOpen && currentImage && (
        <FullImageLightbox
          imageUrl={currentImage}
          title={product?.productName ?? ''}
          subtitle={`عيار ${product?.karat ?? 0} • ${formatNumber(product?.weight ?? 0)} جم`}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  )
}

/**
 * نافذة تكبير الصورة ملء الشاشة (Lightbox)
 * تعالج مشكلة عدم اكتمال الصورة بشكل جذري، وتتيح للصائغ فحص أدق تفاصيل القطعة والدمغة بتكبير تفاعلي
 */
function FullImageLightbox({
  imageUrl,
  title,
  subtitle,
  onClose,
}: {
  imageUrl: string
  title: string
  subtitle: string
  onClose: () => void
}) {
  const [zoomLevel, setZoomLevel] = useState(1)

  function handleZoomIn() {
    setZoomLevel((z) => Math.min(3, Math.round((z + 0.5) * 10) / 10))
  }

  function handleZoomOut() {
    setZoomLevel((z) => Math.max(1, Math.round((z - 0.5) * 10) / 10))
  }

  function handleReset() {
    setZoomLevel(1)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-md animate-in fade-in-0 duration-200"
    >
      {/* شريط أدوات Lightbox العلوي */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4 sm:px-6">
        <div className="flex flex-col text-white">
          <p className="text-sm font-bold truncate max-w-[240px] sm:max-w-md">{title}</p>
          <p className="text-xs text-white/70">{subtitle}</p>
        </div>

        {/* أزرار التحكم بالتكبير */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3}
            title="تكبير"
            className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 touch-target cursor-pointer transition-colors"
          >
            <ZoomIn className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            title="تصغير"
            className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 touch-target cursor-pointer transition-colors"
          >
            <ZoomOut className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            title="الحجم الأصلي 100%"
            className="flex h-10 px-3 items-center justify-center gap-1 rounded-full bg-white/10 text-white hover:bg-white/20 touch-target cursor-pointer text-xs font-bold transition-colors"
          >
            <RotateCcw className="size-3.5" />
            <span>{Math.round(zoomLevel * 100)}%</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            title="إغلاق المعاينة"
            className="flex size-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-rose-600 hover:text-white touch-target cursor-pointer transition-colors ms-2"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* منطقة عرض الصورة الكاملة غير المقتطعة */}
      <div
        onClick={onClose}
        className="flex flex-1 items-center justify-center overflow-auto p-4 sm:p-8 cursor-zoom-out"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative flex items-center justify-center max-w-full max-h-full transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[82vh] max-w-[88vw] rounded-xl object-contain drop-shadow-2xl select-none"
          />
        </div>
      </div>
    </div>
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

function QuickViewRow({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-3',
        highlight
          ? 'border-amber-300/70 bg-amber-50/50'
          : 'border-black/5 bg-white',
      )}
    >
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-0.5 text-[15px] font-bold tabular-nums',
          highlight ? 'text-amber-900' : 'text-foreground',
        )}
      >
        {value}
      </p>
    </div>
  )
}