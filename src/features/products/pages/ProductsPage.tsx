import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Download,
  ExternalLink,
  Gem,
  Package,
  Percent,
  Plus,
  Search,
  Share2,
  Wand2,
  X,
} from 'lucide-react'

import { getProductKarats, getProductsPage } from '@/features/products/api'
import type { Product } from '@/features/products/types'
import { ProductFormSheet } from '@/features/products/components/ProductFormSheet'
import { salePerGram } from '@/shared/lib/gold'
import { getLatestGoldPrice } from '@/shared/lib/parties'
import { useGoldStore } from '@/shared/stores/gold-store'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { formatEgp, formatNumber } from '@/shared/lib/utils'
import { PAGE_SIZE, usePaginablePage } from '@/shared/lib/pagination'
import { PaginationBar } from '@/shared/components/ui/pagination'
import { getSiteUrl, resolveProductImage } from '@/shared/lib/seo'
import { buildProductShareImage, canvasToPngBlob, SHARE_IMAGE_STYLES } from '@/shared/lib/share-image'
import type { ShareImageStyleId } from '@/shared/lib/share-image'
import { getStoreSummary } from '@/features/settings/api'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Fab } from '@/shared/components/ui/fab'
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
} from '@/shared/components/ui/dialog'

const BROKEN_GOLD_IMAGE = '/broken-gold.svg'

function getProductImage(product: Product) {
  if (product.typegolde === 3) return BROKEN_GOLD_IMAGE
  return (
    product.primaryImageUrl ||
    (Array.isArray(product.imageUrls) && product.imageUrls[0]) ||
    product.imageLink ||
    null
  )
}

function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden p-0 elevation-card">
      <div className="aspect-square w-full bg-secondary">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-10 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-8 w-full rounded-full" />
      </div>
    </Card>
  )
}

interface ShareState {
  product: Product
  original: string
  composed: string | null
  link: string
}

export function ProductsPage() {
  const activeBranchId = useActiveBranchId()
  const [formOpen, setFormOpen] = useState(false)
  const [share, setShare] = useState<ShareState | null>(null)
  const [shareBusy, setShareBusy] = useState(false)
  const [shareStyle, setShareStyle] = useState<ShareImageStyleId>('gold-luxury')
  const [pendingStyle, setPendingStyle] = useState<ShareImageStyleId>('gold-luxury')
  const [makingDiscount, setMakingDiscount] = useState('')
  const [query, setQuery] = useState('')
  const [karatFilter, setKaratFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const searchActive =
    query.trim().length > 0 || karatFilter !== 'all' || statusFilter !== 'all'

  const [page, setPage] = useState(1)

  const {
    data: pageResult,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      'products',
      activeBranchId,
      'page',
      page,
      query.trim(),
      karatFilter,
      statusFilter,
    ],
    queryFn: () =>
      getProductsPage({
        branchId: activeBranchId ?? undefined,
        page,
        q: query.trim() || undefined,
        karat: karatFilter === 'all' ? undefined : karatFilter,
        active: statusFilter === 'all' ? undefined : statusFilter,
        inStock: searchActive ? undefined : true,
      }),
    enabled: !!activeBranchId,
  })

  const products = pageResult?.data ?? []
  const { page: safePage, pageCount, goToPage, reset } = usePaginablePage(
    pageResult?.totalCount ?? 0,
    page,
    PAGE_SIZE,
    setPage,
  )

  const { data: karatOptions = [] } = useQuery({
    queryKey: ['product-karats', activeBranchId],
    queryFn: () => getProductKarats(activeBranchId ?? undefined),
    enabled: !!activeBranchId,
  })

  const gold21 = useGoldStore((s) => s.gold21)

  const { data: serverPrice } = useQuery({
    queryKey: ['gold-price'],
    queryFn: getLatestGoldPrice,
    staleTime: 5 * 60 * 1000,
  })

  const effectiveGold = gold21 > 0 ? gold21 : serverPrice ?? 0

  const { data: storeSummary } = useQuery({
    queryKey: ['store-summary'],
    queryFn: getStoreSummary,
    staleTime: 10 * 60 * 1000,
  })

  async function openShare(p: Product) {
    const base = `${getSiteUrl()}/products/${p.productId}`
    const original = resolveProductImage(getProductImage(p))
    setShare({ product: p, original, composed: null, link: base })
    setPendingStyle(shareStyle)
    setMakingDiscount('')
    setShareBusy(true)
    try {
      const canvas = await buildProductShareImage({
        productName: p.productName,
        weight: p.weight,
        karat: p.karat,
        size: p.size,
        imageUrl: getProductImage(p),
        phoneDisplay: storeSummary?.phone ?? null,
        storeName: storeSummary?.name ?? null,
        style: shareStyle,
        makingDiscountPercent: 0,
      })
      const blob = await canvasToPngBlob(canvas)
      if (blob) {
        const composed = canvas.toDataURL('image/png')
        setShare((s) =>
          s
            ? { ...s, composed, link: `${base}?img=${encodeURIComponent(original)}` }
            : s,
        )
      }
    } catch {
      toast.error('تعذّر إنشاء صورة المشاركة')
    } finally {
      setShareBusy(false)
    }
  }

  async function applyShare() {
    if (!share) return
    const discountValue = Math.max(
      0,
      Math.min(100, Number(makingDiscount) || 0),
    )
    setShareStyle(pendingStyle)
    setShare((s) => (s ? { ...s, composed: null } : s))
    setShareBusy(true)
    try {
      const canvas = await buildProductShareImage({
        productName: share.product.productName,
        weight: share.product.weight,
        karat: share.product.karat,
        size: share.product.size,
        imageUrl: getProductImage(share.product),
        phoneDisplay: storeSummary?.phone ?? null,
        storeName: storeSummary?.name ?? null,
        style: pendingStyle,
        makingDiscountPercent: discountValue,
      })
      const blob = await canvasToPngBlob(canvas)
      if (!blob) {
        toast.error('تعذّر إنشاء صورة المشاركة')
        return
      }
      const composed = canvas.toDataURL('image/png')
      const base = `${getSiteUrl()}/products/${share.product.productId}`
      const original = resolveProductImage(getProductImage(share.product))
      setShare((s) =>
        s
          ? { ...s, composed, link: `${base}?img=${encodeURIComponent(original)}` }
          : s,
      )
      toast.success(
        discountValue > 0
          ? `تم تطبيق خصم ${discountValue}% على المصنعية وإنشاء الصورة`
          : 'تم إنشاء صورة المشاركة بالاستايل المختار',
      )
    } catch {
      toast.error('تعذّر إعادة إنشاء صورة المشاركة')
    } finally {
      setShareBusy(false)
    }
  }

  async function copyShareLink() {
    if (!share) return
    try {
      await navigator.clipboard.writeText(share.link)
      toast.success('تم نسخ رابط المشاركة — جاهز للنشر على فيسبوك')
    } catch {
      toast.error('تعذّر نسخ الرابط')
    }
  }

  function selectShareStyle(styleId: ShareImageStyleId) {
    if (!share) return
    setPendingStyle(styleId)
  }

  function shareOnFacebook() {
    if (!share) return
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(share.link)}`,
      '_blank',
      'noopener',
    )
  }

  function openAdd() {
    setFormOpen(true)
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[34px] font-bold leading-[1.2] text-foreground">
            المنتجات
          </h1>
          <p className="text-muted-foreground">
            إدارة تعريفات المنتجات قبل إدخالها للمخزون
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="h-12 gap-2 rounded-full px-6 touch-target"
        >
          <Plus className="size-5" />
          <span className="hidden sm:inline">إنشاء تعريف منتج</span>
        </Button>
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
            placeholder="ابحث بالاسم أو SKU أو الباركود..."
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
        <div className="flex gap-3">
          <Select
            value={karatFilter}
            onValueChange={(v) => {
              reset()
              setKaratFilter(v)
            }}
          >
            <SelectTrigger className="w-36 h-11 rounded-full border-black/10 bg-white">
              <SelectValue placeholder="كل الأعيرة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأعيرة</SelectItem>
              {karatOptions.map((k) => (
                <SelectItem key={k} value={String(k)}>
                  {k} قيراط
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              reset()
              setStatusFilter(v as 'all' | 'active' | 'inactive')
            }}
          >
            <SelectTrigger className="w-36 h-11 rounded-full border-black/10 bg-white">
              <SelectValue placeholder="كل الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="inactive">غير نشط</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center py-20 text-error">
          تعذّر تحميل المنتجات.
        </div>
      ) : !products || products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/10 bg-white py-20 text-center">
          <Package className="size-12 text-muted-foreground" />
          <p className="text-[17px] font-semibold text-foreground">
            لا توجد منتجات بعد
          </p>
          <p className="text-sm text-muted-foreground">
            اضغط "إنشاء تعريف منتج" لإضافة منتج جديد.
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/10 bg-white py-20 text-center">
          <Search className="size-12 text-muted-foreground" />
          <p className="text-[17px] font-semibold text-foreground">
            {searchActive ? 'لا نتائج مطابقة' : 'لا توجد منتجات برصيد متاح'}
          </p>
          <p className="text-sm text-muted-foreground">
            {searchActive
              ? 'جرّب تعديل كلمة البحث أو الفلاتر.'
              : 'المنتجات التي لها رصيد فقط تظهر هنا — ابحث لعرض كل الأصناف المسجلة.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((p) => (
            <Card
              key={p.productId}
              className="group/product overflow-hidden p-0 rounded-[14px] elevation-card transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-secondary">
                {getProductImage(p) ? (
                  <img
                    src={getProductImage(p) ?? undefined}
                    alt={p.productName}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover/product:scale-105"
                  />
                ) : (
                  <Gem className="size-10 text-muted-foreground/25" />
                )}
                {(p.quantity ?? 0) <= 0 && (
                  <span className="absolute top-2 start-2 inline-flex items-center rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                    نافد
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/10 to-transparent" />
              </div>

              <div className="flex flex-col gap-2 p-3">
                <p className="truncate text-[14px] font-bold leading-snug text-foreground">
                  {p.productName}
                </p>

                <div className="flex flex-wrap items-center gap-1">
                  {p.typegolde === 3 && (
                    <Badge className="bg-warning/90 text-white text-[10px] h-5 px-1.5">كسر</Badge>
                  )}
                  <Badge className="bg-amber-500/10 text-amber-700 border-amber-300/50 text-[10px] h-5 px-1.5">{p.karat}k</Badge>
                  {p.size > 0 && (
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5">مقاس {p.size}</Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5">{formatNumber(p.weight)} جم</Badge>
                </div>

                <div className="rounded-lg bg-primary/5 px-3 py-2 border border-primary/10">
                  <p className="tabular-nums text-[15px] font-extrabold text-primary leading-none">
                    {effectiveGold > 0
                      ? formatEgp(salePerGram(effectiveGold, p.karat) * p.weight)
                      : '—'}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-1.5 rounded-full h-8 text-[11px] mt-0.5"
                  onClick={() => openShare(p)}
                >
                  <Share2 className="size-3" />
                  مشاركة
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <PaginationBar
          page={safePage}
          pageCount={pageCount}
          onChange={goToPage}
          totalCount={pageResult?.totalCount ?? 0}
        />

      </>
      )}

      <Dialog
        open={Boolean(share)}
        onOpenChange={(o) => !o && setShare(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="left-1/2 top-1/2 w-[min(96vw,920px)] max-w-none sm:max-w-none md:max-w-none lg:max-w-none max-h-[92vh] overflow-hidden gap-0 rounded-[20px] bg-background p-0 text-foreground ring-1 ring-foreground/10"
        >
          {share && (
            <div className="flex h-full max-h-[92vh] flex-col">
              {/* ─── Header ───────────────────────────────────────────── */}
              <header className="flex items-start justify-between gap-4 border-b border-border bg-secondary/60 px-6 py-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
                    <Share2 className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-[20px] font-bold leading-tight text-foreground">
                      مشاركة «{share.product.productName}»
                    </h2>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                      صوّر قطعة مميزة بانستايل من اختيارك وأضف خصماً على المصنعية
                      إن أردت.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="إغلاق"
                  onClick={() => setShare(null)}
                  className="size-10 rounded-full text-muted-foreground hover:bg-secondary"
                >
                  <X className="size-5" />
                </Button>
              </header>

              {shareBusy ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <p className="text-sm text-muted-foreground">
                    جارٍ إنشاء صورة المشاركة ورفعها...
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  <div className="grid gap-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,1fr)]">
                    {/* ─── Preview pane ─────────────────────────────── */}
                    <section className="flex flex-col gap-3 border-border bg-secondary/40 p-6 md:border-l">
                      <p className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground">
                        المعاينة
                      </p>
                      <div className="relative overflow-hidden rounded-[16px] bg-muted ring-1 ring-black/5">
                        {share.composed ? (
                          <img
                            src={share.composed}
                            alt={`صورة مشاركة ${share.product.productName}`}
                            className="block aspect-[1200/630] w-full object-cover"
                          />
                        ) : (
                          <div className="grid aspect-[1200/630] w-full place-items-center text-center">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <Wand2 className="size-8 opacity-40" />
                              <p className="text-[13px]">
                                لم تُنشأ صورة بعد — اختر استايلاً ثم اضغط «تطبيق».
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 rounded-full bg-background px-3 py-2 ring-1 ring-border">
                        <span
                          className="block size-5 shrink-0 rounded-full ring-1 ring-black/10"
                          style={{
                            background:
                              SHARE_IMAGE_STYLES.find((s) => s.id === pendingStyle)
                                ?.swatch ?? '#e7b94a',
                          }}
                        />
                        <span className="min-w-0 flex-1 truncate text-[12px] text-muted-foreground">
                          {SHARE_IMAGE_STYLES.find((s) => s.id === pendingStyle)?.label}
                          {Number(makingDiscount) > 0
                            ? ` • خصم ${Math.round(Number(makingDiscount))}٪ على المصنعية`
                            : ''}
                        </span>
                        {pendingStyle === shareStyle && (
                          <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                            مُطبَّق
                          </span>
                        )}
                      </div>
                    </section>

                    {/* ─── Controls pane ─────────────────────────────── */}
                    <section className="flex flex-col gap-5 p-6">
                      {/* Style picker */}
                      <div>
                        <div className="mb-2 flex items-baseline justify-between">
                          <Label className="text-[13px] font-bold text-foreground">
                            استايل الصورة
                          </Label>
                          <span className="text-[11px] text-muted-foreground">
                            {SHARE_IMAGE_STYLES.length} استايلات
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" dir="ltr">
                          {SHARE_IMAGE_STYLES.map((s) => {
                            const active = pendingStyle === s.id
                            const applied = shareStyle === s.id
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => selectShareStyle(s.id)}
                                disabled={shareBusy}
                                className={[
                                  'group relative flex flex-col items-center gap-1.5 rounded-[12px] border-2 bg-background px-1.5 py-2 transition-all touch-target',
                                  active
                                    ? 'border-primary ring-2 ring-primary/30'
                                    : 'border-border hover:border-primary/40',
                                  shareBusy ? 'opacity-60' : '',
                                ].join(' ')}
                                aria-label={`استايل ${s.label}`}
                                aria-pressed={active}
                              >
                                <span
                                  className="block h-7 w-full rounded-md ring-1 ring-black/10"
                                  style={{ background: s.swatch }}
                                />
                                <span className="line-clamp-1 text-[10px] font-semibold text-foreground">
                                  {s.label}
                                </span>
                                {applied && (
                                  <span className="absolute -top-1.5 -end-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[8px] font-bold text-white shadow">
                                    ✓
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Discount card */}
                      <div className="rounded-[14px] border border-border bg-secondary/60 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <Label
                            htmlFor="making-discount"
                            className="flex items-center gap-2 text-[13px] font-bold text-foreground"
                          >
                            <Percent className="size-4 text-primary" />
                            خصم على المصنعية
                          </Label>
                          <span className="text-[11px] text-muted-foreground">
                            اختياري
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          <div className="relative flex-1">
                            <Input
                              id="making-discount"
                              type="number"
                              inputMode="numeric"
                              min={0}
                              max={100}
                              step={1}
                              value={makingDiscount}
                              onChange={(e) => setMakingDiscount(e.target.value)}
                              placeholder="0"
                              className="h-12 rounded-[12px] border-border bg-background pe-10 text-[17px] font-bold tabular-nums"
                              disabled={shareBusy}
                            />
                            <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[15px] font-bold text-muted-foreground">
                              ٪
                            </span>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            {[10, 20, 30].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setMakingDiscount(String(preset))}
                                disabled={shareBusy}
                                className={[
                                  'h-7 min-w-[48px] rounded-full px-3 text-[12px] font-bold tabular-nums transition-colors',
                                  makingDiscount === String(preset)
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-background text-foreground ring-1 ring-border hover:ring-primary/40',
                                ].join(' ')}
                                aria-label={`خصم ${preset} في المئة`}
                              >
                                {preset}٪
                              </button>
                            ))}
                          </div>
                        </div>
                        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                          يظهر كشعار أحمر أعلى الصورة — لا يغيّر سعر البيع الفعلي.
                        </p>
                      </div>

                      {/* Primary action */}
                      <Button
                        type="button"
                        onClick={applyShare}
                        disabled={shareBusy || !share}
                        className="h-12 w-full gap-2 rounded-full text-[15px] font-bold touch-target"
                      >
                        <Wand2 className="size-5" />
                        {shareBusy ? 'جارٍ التطبيق...' : 'تطبيق وإنشاء الصورة'}
                      </Button>
                    </section>
                  </div>
                </div>
              )}

              {/* ─── Footer ───────────────────────────────────────────── */}
              <footer className="flex flex-wrap items-center gap-2 border-t border-border bg-secondary/40 px-6 py-4">
                <div
                  dir="ltr"
                  title={share.link}
                  className="min-w-0 basis-full whitespace-nowrap overflow-x-auto rounded-full bg-background px-4 py-2 text-[12px] text-muted-foreground ring-1 ring-border"
                >
                  {share.link}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    share.composed &&
                    (() => {
                      const a = document.createElement('a')
                      a.href = share.composed
                      a.download = `share-${share.product.productId}.png`
                      a.click()
                    })()
                  }
                  disabled={!share.composed}
                  className="h-11 gap-1.5 rounded-full px-4 touch-target"
                >
                  <Download className="size-4" />
                  تنزيل
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyShareLink}
                  disabled={!share.link}
                  className="h-11 rounded-full px-4 touch-target"
                >
                  نسخ الرابط
                </Button>
                <Button
                  size="sm"
                  onClick={shareOnFacebook}
                  disabled={!share.link}
                  className="h-11 gap-2 rounded-full px-5 touch-target"
                >
                  <ExternalLink className="size-4" />
                  نشر على فيسبوك
                </Button>
              </footer>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ProductFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        product={null}
      />

      <Fab
        aria-label="إنشاء تعريف منتج"
        className="fixed bottom-6 end-6 z-40"
        onClick={openAdd}
      >
        <Plus />
      </Fab>
    </div>
  )
}