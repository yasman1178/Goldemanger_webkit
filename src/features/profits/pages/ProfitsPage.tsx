import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronDown,
  ChevronUp,
  Printer,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react'

import { useAuthStore } from '@/shared/stores/auth-store'

import { getFactoryProfit } from '@/features/profits/api'
import {
  factoryProfitQueryKey,
  type FactoryProfitSaleLine,
} from '@/features/profits/types'
import {
  periodPresets,
  resolvePeriod,
  toDateInputValue,
  type PeriodPreset,
} from '@/shared/lib/period'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { formatEgp, formatNumber, cn } from '@/shared/lib/utils'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
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

function formatDay(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('ar-EG', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

function StatCard({
  label,
  value,
  hint,
  tone = 'default',
  noPrint,
}: {
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'accent' | 'success'
  noPrint?: boolean
}) {
  return (
    <Card
      className={cn(
        'rounded-[14px] elevation-card',
        tone === 'accent' && 'border-primary/20 bg-primary/[0.04]',
        tone === 'success' && 'border-success/25 bg-success/[0.06]',
        noPrint && 'receipt-no-print',
      )}
    >
      <CardContent className="p-4 sm:p-5">
        <p className="text-[13px] text-muted-foreground">{label}</p>
        <p
          className={cn(
            'mt-1.5 text-[20px] font-bold tabular-nums',
            tone === 'accent' && 'text-primary',
            tone === 'success' && 'text-success',
            tone === 'default' && 'text-foreground',
          )}
        >
          {value}
        </p>
        {hint && <p className="mt-1 text-[12px] text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}

function SaleRow({ line }: { line: FactoryProfitSaleLine }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <TableRow>
        <TableCell>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-primary"
          >
            {open ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
            #{line.saleId}
          </button>
        </TableCell>
        <TableCell className="text-[13px]">{formatDay(line.date)}</TableCell>
        <TableCell className="text-[13px]">{line.customerName}</TableCell>
        <TableCell className="text-[13px] tabular-nums">
          {line.items.length} صنف
        </TableCell>
        <TableCell className="text-[13px] tabular-nums">
          {formatEgp(line.totalAmount)}
        </TableCell>
        <TableCell className="text-[13px] font-bold tabular-nums text-success">
          {formatEgp(line.makingProfit)}
        </TableCell>
      </TableRow>

      {open &&
        line.items.map((item, index) => (
          <TableRow key={`${line.saleId}-${index}`} className="bg-muted/40">
            <TableCell />
            <TableCell colSpan={5} className="py-2">
              <div className="space-y-1.5 ps-2">
                <p className="text-[13px] font-semibold text-foreground">
                  {item.productName}
                </p>
                <p className="text-[12px] text-muted-foreground">
                  {formatNumber(item.quantity)} قطعة ·{' '}
                  {formatNumber(item.weight)} جم · {item.karat}k — المصنعية{' '}
                  {formatNumber(item.factory)} ← {formatNumber(item.factoryForSale)} جم
                  (فرق {formatNumber(item.makingPerGram)}/جم ⇒{' '}
                  {formatEgp(item.makingProfit)})
                </p>
                {(item.factory === 0 || item.factoryForSale === 0) && (
                  <p className="text-[12px] font-semibold tabular-nums text-warning">
                    {item.factory === 0 && item.factoryForSale === 0
                      ? 'بيانات المصنعية غير مسجلة لهذا الصنف — يُحسب صفراً.'
                      : item.factoryForSale === 0
                        ? 'مصنعية البيع غير مسجلة — الرقم الظاهر سالب وهمي، أكمل البيانات للدقة.'
                        : 'مصنعية الشراء غير مسجلة — الربح الظاهر تقديري (أعلى من الحقيقة).'}
                  </p>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
    </>
  )
}

export function ProfitsPage() {
  const activeBranchId = useActiveBranchId()
  const hasValidBranch = activeBranchId != null
  const roles = useAuthStore((s) => s.user?.roles ?? [])
  const isOwner = roles.includes('Owner')

  const [preset, setPreset] = useState<PeriodPreset>('thisMonth')
  const [customRange, setCustomRange] = useState(() => {
    const { startDate, endDate } = resolvePeriod('thisMonth')
    return { startDate, endDate }
  })

  const range = useMemo(
    () =>
      preset === 'custom'
        ? customRange
        : resolvePeriod(preset),
    [preset, customRange],
  )

  const rangeIsValid = range.startDate <= range.endDate

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      factoryProfitQueryKey,
      activeBranchId,
      range.startDate,
      range.endDate,
    ],
    queryFn: () =>
      getFactoryProfit({
        startDate: range.startDate,
        endDate: range.endDate,
        branchId: activeBranchId ?? undefined,
      }),
    enabled: hasValidBranch && rangeIsValid && isOwner,
    retry: false,
  })

  // إجمالي الخادم يُجمَّع قبل حساب أرباح الفواتير فيبقى صفراً، بينما ربح كل
  // فاتورة صحيح — فيُشتق الإجمالي هنا بجمع سطور الفواتير دون تعديل الباك اند.
  const totalMakingProfit = useMemo(
    () => (data?.sales ?? []).reduce((sum, s) => sum + (s.makingProfit ?? 0), 0),
    [data],
  )

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <ShieldCheck className="size-12 text-muted-foreground" />
        <p className="text-[17px] font-semibold text-foreground">
          هذه الصفحة مخصصة لصاحب المحل فقط
        </p>
        <p className="text-sm text-muted-foreground">
          أرباح المصنعية بيانات حساسة ولا تظهر لغير صاحب المحل.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-[20px] font-bold text-foreground">أرباح المصنعية</h1>
          <p className="text-[13px] text-muted-foreground">
            {data?.branchName || 'الفرع النشط'} — ربح المصنعية فقط،{' '}
            <span className="font-semibold text-warning">بدون تكلفة الذهب</span>
          </p>
        </div>
        <Button
          type="button"
          onClick={() => window.print()}
          className="receipt-no-print h-11 shrink-0 gap-2 rounded-full touch-target"
        >
          <Printer className="size-4" />
          طباعة
        </Button>
      </div>

      <Card className="receipt-no-print rounded-[14px] elevation-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-wrap gap-1.5">
              {periodPresets.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPreset(option.value)}
                  className={cn(
                    'h-11 rounded-full border px-4 text-[13px] font-semibold transition-colors touch-target',
                    preset === option.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-black/10 bg-white text-muted-foreground',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {preset === 'custom' && (
              <div className="flex items-end gap-2">
                <div className="flex w-[150px] flex-col gap-1">
                  <label
                    htmlFor="profit-from-date"
                    className="text-[12px] text-muted-foreground"
                  >
                    من تاريخ
                  </label>
                  <Input
                    id="profit-from-date"
                    type="date"
                    value={customRange.startDate}
                    max={toDateInputValue(new Date())}
                    onChange={(e) =>
                      setCustomRange((r) => ({ ...r, startDate: e.target.value }))
                    }
                    className="h-11 touch-target rounded-full"
                  />
                </div>
                <div className="flex w-[150px] flex-col gap-1">
                  <label
                    htmlFor="profit-to-date"
                    className="text-[12px] text-muted-foreground"
                  >
                    إلى تاريخ
                  </label>
                  <Input
                    id="profit-to-date"
                    type="date"
                    value={customRange.endDate}
                    max={toDateInputValue(new Date())}
                    onChange={(e) =>
                      setCustomRange((r) => ({ ...r, endDate: e.target.value }))
                    }
                    className="h-11 touch-target rounded-full"
                  />
                </div>
              </div>
            )}
          </div>

          {!rangeIsValid && (
            <p className="mt-2 text-[13px] font-medium text-error">
              تاريخ البدء لا يمكن أن يكون بعد تاريخ الانتهاء.
            </p>
          )}
        </CardContent>
      </Card>

      {!hasValidBranch ? (
        <p className="text-[14px] text-muted-foreground">
          لا يوجد فرع محدد. اختر فرعاً من أعلى الصفحة لعرض أرباحه.
        </p>
      ) : isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-[14px]" />
          <Skeleton className="h-64 rounded-[14px]" />
        </div>
      ) : isError ? (
        <p className="text-[14px] font-medium text-error">
          تعذّر تحميل كشف الأرباح.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="ربح المصنعية (بدون تكلفة الذهب)"
              value={formatEgp(totalMakingProfit)}
              tone="success"
              hint="مجموع الفروقات × الأوزان × الكميات"
            />
            <StatCard
              label="عدد الفواتير"
              value={formatNumber(data?.salesCount ?? 0)}
              hint="بيع مكتمل فقط"
            />
            <StatCard
              label="إجمالي المبيعات"
              value={formatEgp(data?.totalSales ?? 0)}
              hint="قيمة المبيعات لا الربح"
            />
            <StatCard
              label="القطع / الوزن"
              value={`${formatNumber(data?.totalPieces ?? 0)} قطعة`}
              hint={`${formatNumber(data?.totalWeight ?? 0)} جم`}
            />
          </div>

          <Card className="rounded-[14px] elevation-card">
            <CardContent className="p-4 sm:p-5">
              <p className="mb-3 text-[15px] font-semibold text-foreground">
                تفصيل الفواتير
              </p>

              {data?.sales && data.sales.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>فاتورة</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>العميل</TableHead>
                        <TableHead>الأصناف</TableHead>
                        <TableHead>قيمة البيع</TableHead>
                        <TableHead>ربح المصنعية</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.sales.map((line) => (
                        <SaleRow key={line.saleId} line={line} />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="py-6 text-center text-[14px] text-muted-foreground">
                  لا توجد مبيعات مكتملة في هذه الفترة.
                </p>
              )}
            </CardContent>
          </Card>

          <p className="flex items-start gap-2 rounded-[14px] bg-muted px-3 py-2.5 text-[12px] leading-relaxed text-muted-foreground receipt-no-print">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>
              الرقم محسوب من مصنعية الشراء والبيع والوزن <strong>الحالية</strong>{' '}
              لكل منتج، لا من لقطة وقت البيع — فتعديل مصنعية أو وزن منتج يغيّر
              أرقام فواتير سابقة. والسطور ناقصة البيانات مُعلَّمة بالأصفر —
              أكمل المصنعيتين عند الشراء لدقة الكشف. ولا يشمل تكلفة الذهب، فلا
              يُقرأ كصافي ربح.
            </span>
          </p>

          {/* نسخة مضغوطة لورق الكاشير 80mm — مخفية على الشاشة وتُطبع بدل الصفحة */}
          <div className="receipt-print receipt-paper report-cashier mx-auto p-2">
            <p className="text-center font-bold">أرباح المصنعية</p>
            <p className="text-center">
              {data?.branchName || 'الفرع النشط'} — {formatDay(range.startDate)} ←{' '}
              {formatDay(range.endDate)}
            </p>
            <p className="my-1 border-t border-dashed border-black" />
            <table>
              <tbody>
                <TableRow>
                  <TableCell>ربح المصنعية (بدون تكلفة الذهب)</TableCell>
                  <TableCell className="tabular-nums">
                    {formatEgp(totalMakingProfit)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>عدد الفواتير</TableCell>
                  <TableCell className="tabular-nums">
                    {formatNumber(data?.salesCount ?? 0)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>إجمالي المبيعات</TableCell>
                  <TableCell className="tabular-nums">
                    {formatEgp(data?.totalSales ?? 0)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>القطع / الوزن</TableCell>
                  <TableCell className="tabular-nums">
                    {formatNumber(data?.totalPieces ?? 0)} /{' '}
                    {formatNumber(data?.totalWeight ?? 0)} جم
                  </TableCell>
                </TableRow>
              </tbody>
            </table>
            <p className="my-1 border-t border-dashed border-black" />
            {data?.sales && data.sales.length > 0 ? (
              data.sales.map((line) => (
                <div key={line.saleId} className="py-1">
                  <p className="font-bold">
                    #{line.saleId} — {formatDay(line.date)} — {line.customerName}
                  </p>
                  <p className="tabular-nums">
                    البيع {formatEgp(line.totalAmount)} — الربح{' '}
                    {formatEgp(line.makingProfit)}
                  </p>
                  {line.items.map((item, index) => (
                    <p
                      key={`${line.saleId}-${index}`}
                      className="tabular-nums"
                    >
                      {item.productName} · {formatNumber(item.quantity)} ق ·{' '}
                      {formatNumber(item.weight)} جم · {item.karat}k · مصنعية{' '}
                      {formatNumber(item.factory)} ←{' '}
                      {formatNumber(item.factoryForSale)} ⇒{' '}
                      {formatEgp(item.makingProfit)}
                    </p>
                  ))}
                  <p className="my-1 border-t border-dashed border-black" />
                </div>
              ))
            ) : (
              <p className="py-2 text-center">لا توجد مبيعات مكتملة في هذه الفترة.</p>
            )}
            <p className="text-center">بدون تكلفة الذهب — ليس صافي ربح</p>
          </div>
        </>
      )}
    </div>
  )
}
