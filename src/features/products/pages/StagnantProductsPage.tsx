import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Boxes, Clock, Gem, Recycle, Scale, Search, X } from 'lucide-react'

import { getStagnantProducts } from '@/features/products/api'
import { typeLabels, type Product } from '@/features/products/types'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { formatGrams, formatNumber } from '@/shared/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { Skeleton } from '@/shared/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'

const DAY_OPTIONS: { value: number; label: string }[] = [
  { value: 30, label: 'أكثر من 30 يوم' },
  { value: 60, label: 'أكثر من 60 يوم' },
  { value: 90, label: 'أكثر من 90 يوم' },
]

function formatDate(value?: string): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

export function StagnantProductsPage() {
  const activeBranchId = useActiveBranchId()
  const [minDays, setMinDays] = useState(60)
  const [query, setQuery] = useState('')

  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ['products-stagnant', activeBranchId, minDays],
    queryFn: () =>
      getStagnantProducts({
        branchId: activeBranchId ?? undefined,
        minDays,
      }),
    enabled: !!activeBranchId,
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => {
      const name = (p.productName ?? '').toLowerCase()
      const sku = (p.sku ?? '').toLowerCase()
      const barcode = (p.barcode ?? '').toLowerCase()
      return name.includes(q) || sku.includes(q) || barcode.includes(q)
    })
  }, [products, query])

  const totals = useMemo(
    () => ({
      items: filtered.length,
      pieces: filtered.reduce((sum, p) => sum + (p.quantity ?? 0), 0),
      weight: filtered.reduce(
        (sum, p) => sum + (p.quantity ?? 0) * (p.weight ?? 0),
        0,
      ),
    }),
    [filtered],
  )

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[34px] font-bold leading-[1.2] text-foreground">
            الأصناف الراكدة
          </h1>
          <p className="text-muted-foreground">
            القطع المتاحة التي لم تُبع منذ مدة — لمراجعة المخزون البطيء
          </p>
        </div>
        <div className="flex size-11 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
          <Recycle className="size-5" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card size="sm" className="rounded-[14px] elevation-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-[13px] font-semibold leading-[1.35] text-muted-foreground">
              <span>عدد الأصناف الراكدة</span>
              <Recycle className="size-4 text-primary/60" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="tabular-nums text-[24px] font-bold leading-[1.1] text-foreground">
              {formatNumber(totals.items)}
            </div>
          </CardContent>
        </Card>
        <Card size="sm" className="rounded-[14px] elevation-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-[13px] font-semibold leading-[1.35] text-muted-foreground">
              <span>عدد القطع</span>
              <Boxes className="size-4 text-primary/60" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="tabular-nums text-[24px] font-bold leading-[1.1] text-foreground">
              {formatNumber(totals.pieces)}
            </div>
          </CardContent>
        </Card>
        <Card size="sm" className="rounded-[14px] elevation-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-[13px] font-semibold leading-[1.35] text-muted-foreground">
              <span>الوزن الكلي</span>
              <Scale className="size-4 text-primary/60" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="tabular-nums text-[24px] font-bold leading-[1.1] text-amber-600">
              {formatGrams(totals.weight)}{' '}
              <span className="text-[14px] font-semibold text-muted-foreground">جم</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالمنتج أو الكود..."
            className="h-11 ps-9 pe-9"
          />
          {query && (
            <button
              type="button"
              aria-label="مسح البحث"
              onClick={() => setQuery('')}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground touch-target"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <Select
          value={String(minDays)}
          onValueChange={(v) => setMinDays(Number(v))}
        >
          <SelectTrigger className="h-11 w-full rounded-full border border-black/10 bg-white px-4 sm:w-52">
            <SelectValue placeholder="مدة الركود" />
          </SelectTrigger>
          <SelectContent>
            {DAY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center py-20 text-error">
          تعذّر تحميل تقرير الرواكد.
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/10 bg-white py-20 text-center">
          <Recycle className="size-12 text-muted-foreground" />
          <p className="text-[17px] font-semibold text-foreground">
            لا توجد أصناف راكدة
          </p>
          <p className="text-sm text-muted-foreground">
            لا توجد قطع متاحة تجاوزت المدة المحددة.
          </p>
        </div>
      ) : (
        <Card className="elevation-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-black/[0.03]">
                <TableHead>المنتج</TableHead>
                <TableHead>العيار</TableHead>
                <TableHead className="text-end">العدد</TableHead>
                <TableHead className="text-end">وزن القطعة</TableHead>
                <TableHead className="text-end">الوزن الكلي</TableHead>
                <TableHead>تاريخ الإضافة</TableHead>
                <TableHead className="text-end">عمر الصنف</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <StagnantRow key={p.productId} product={p} />
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}

function StagnantRow({ product: p }: { product: Product }) {
  const ageDays = p.ageDays ?? 0
  const urgent = ageDays >= 120
  return (
    <TableRow>
      <TableCell>
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{p.productName}</p>
          <p className="text-[12px] text-muted-foreground">
            {p.sku ? `SKU: ${p.sku}` : typeLabels[p.typegolde as keyof typeof typeLabels] ?? ''}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="gap-1 border-amber-300 text-amber-700">
          <Gem className="size-3" />
          {p.karat}k
        </Badge>
      </TableCell>
      <TableCell className="text-end font-semibold tabular-nums text-foreground">
        {formatNumber(p.quantity ?? 0)}
      </TableCell>
      <TableCell className="text-end tabular-nums text-muted-foreground">
        {formatGrams(p.weight ?? 0)} جم
      </TableCell>
      <TableCell className="text-end font-semibold tabular-nums text-foreground">
        {formatGrams((p.quantity ?? 0) * (p.weight ?? 0))} جم
      </TableCell>
      <TableCell className="tabular-nums text-muted-foreground">
        {formatDate(p.createdDate)}
      </TableCell>
      <TableCell className="text-end">
        <span
          className={`inline-flex items-center gap-1 font-bold tabular-nums ${
            urgent ? 'text-error' : 'text-warning'
          }`}
        >
          <Clock className="size-3.5" />
          {formatNumber(ageDays)} يوم
        </span>
      </TableCell>
    </TableRow>
  )
}
