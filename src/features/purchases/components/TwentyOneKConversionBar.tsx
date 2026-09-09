import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Scale } from 'lucide-react'

import { getInventoryUnits } from '@/features/inventory/api'
import { cn, formatNumber } from '@/shared/lib/utils'
import { Skeleton } from '@/shared/components/ui/skeleton'

function round3(value: number): number {
  return Math.round(value * 1000) / 1000
}

export interface TwentyOneKConversionBarProps {
  /** الفرع — لجلب رصيد الكسر المتاح بالمحل. */
  branchId?: number
  /** القطع المشتراة المضافة مجمّعة حسب كل عيار. */
  purchasedByKarat?: Array<{ karat: number; weight: number }>
  /** مكافئ عيار 21 للقطع المشتراة (المُشترى). */
  purchased21?: number
  /** وضع مدمج: الرصيد المعطى حتى الآن (كل عيار 21) — يُستخدم في معاينة القطعة داخل النموذج. */
  input21?: number
  /** وضع مدمج: الرصيد مع القطعة الحالية (كل عيار 21). */
  output21?: number
  /** وضع مدمج: سعر جرام 21 لحساب فرق النقد المقابل. */
  goldPrice?: number
  className?: string
}

/**
 * معادلة عيار 21:
 * — الوضع الكامل: رصيد الكسر بالمحل (كل العيارات → 21) مقابل القطع المشتراة مع الفرق.
 * — الوضع المدمج (عند تمرير input21): معاينة حيّة للرصيد الحالي مقابل القطعة الجارية.
 */
export function TwentyOneKConversionBar(props: TwentyOneKConversionBarProps) {
  if (typeof props.input21 === 'number') {
    return <CompactBar {...props} />
  }
  return <FullBar {...props} />
}

function CompactBar({
  input21,
  output21,
  goldPrice,
  className,
}: TwentyOneKConversionBarProps) {
  const out21 = round3(output21 ?? 0)
  const diff = round3(out21 - input21!)
  const cash = goldPrice && goldPrice > 0 ? Math.abs(diff) * goldPrice : 0
  return (
    <div className={cn('rounded-2xl border border-black/10 bg-white p-3', className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[13px] font-bold text-foreground">
          <Scale className="size-4 text-primary" />
          معادلة عيار 21
        </span>
        <span className="text-[11px] text-muted-foreground">مع القطعة الحالية</span>
      </div>
      <div className="space-y-1 text-[12px]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">رصيد الاستبدال الحالي</span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatNumber(input21!)} gm
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">بعد إضافة القطعة</span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatNumber(out21)} gm
          </span>
        </div>
        <div
          className={cn(
            'flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 font-bold',
            diff > 0.001
              ? 'bg-blue-500/10 text-blue-600'
              : diff < -0.001
                ? 'bg-error/10 text-error'
                : 'bg-secondary/60 text-foreground',
          )}
        >
          <span className="text-muted-foreground">فرق العيار 21</span>
          <span className="tabular-nums">
            {diff > 0 ? '+' : ''}
            {formatNumber(diff)} gm
            {cash > 0 && (
              <span className="ms-1 font-normal text-muted-foreground">
                — {formatNumber(cash)} ج.م
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}

function FullBar({
  branchId,
  purchasedByKarat = [],
  purchased21,
  className,
}: TwentyOneKConversionBarProps) {
  const { data: units = [], isLoading } = useQuery({
    queryKey: ['purchase-scrap-units', branchId],
    queryFn: () => getInventoryUnits(branchId ?? undefined),
  })

  const balances = useMemo(() => {
    const map = new Map<number, number>()
    for (const unit of units) {
      if (unit.status !== 'AVAILABLE') continue
      if (unit.products?.typegolde !== 3) continue
      if (unit.karat <= 0) continue
      map.set(unit.karat, round3((map.get(unit.karat) ?? 0) + unit.weight))
    }
    return [...map.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([karat, weight]) => ({ karat, weight }))
  }, [units])

  const balance21 = useMemo(
    () => round3(balances.reduce((sum, b) => sum + (b.weight * b.karat) / 21, 0)),
    [balances],
  )

  const purchased = useMemo(() => {
    return [...purchasedByKarat]
      .filter((p) => p.karat > 0)
      .sort((a, b) => b.karat - a.karat)
  }, [purchasedByKarat])

  const purchasedTotal21 =
    purchased21 ?? round3(purchased.reduce((sum, p) => sum + (p.weight * p.karat) / 21, 0))

  const diff = round3(balance21 - purchasedTotal21)
  const positive = diff > 0.001
  const negative = diff < -0.001

  return (
    <div className={cn('rounded-2xl border border-black/10 bg-white p-3', className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[13px] font-bold text-foreground">
          <Scale className="size-4 text-primary" />
          معادلة عيار 21
        </span>
        <span className="text-[11px] text-muted-foreground">
          رصيد الكسر ← مقابل القطع المشتراة
        </span>
      </div>

      <div className="space-y-1.5">
        {/* ① الرصيد — جميع العيارات → 21 */}
        <div className="rounded-xl bg-secondary/60 p-2.5">
          <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
            <span>1. الرصيد (جميع العيارات)</span>
            <span>كسر المحل المتاح</span>
          </div>
          {isLoading ? (
            <Skeleton className="h-6 w-full" />
          ) : balances.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">لا يوجد كسر متاح بالمحل.</p>
          ) : (
            <div className="space-y-0.5 text-[12px]">
              {balances.map(({ karat, weight }) => (
                <div key={karat} className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">{karat}k</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatNumber(weight)} gm
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-dashed border-black/10 pt-1 text-[12px] font-bold">
            <span className="text-muted-foreground">معادل عيار 21</span>
            <span className="tabular-nums text-primary">{formatNumber(balance21)} gm</span>
          </div>
        </div>

        {/* ② المشتري — القطع المضافة → 21 */}
        <div className="rounded-xl bg-secondary/60 p-2.5">
          <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
            <span>2. المشتري (القطع المضافة)</span>
            <span>بنفس عياراتها</span>
          </div>
          {purchased.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">لم تُضف قطع بعد.</p>
          ) : (
            <div className="space-y-0.5 text-[12px]">
              {purchased.map(({ karat, weight }) => (
                <div key={karat} className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">{karat}k</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatNumber(weight)} gm
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-dashed border-black/10 pt-1 text-[12px] font-bold">
            <span className="text-muted-foreground">معادل عيار 21</span>
            <span className="tabular-nums text-foreground">{formatNumber(purchasedTotal21)} gm</span>
          </div>
        </div>

        {/* ③ الفرق — رصيد − المشتري */}
        <div
          className={cn(
            'rounded-xl px-3 py-2.5',
            positive
              ? 'bg-blue-500/10 ring-1 ring-blue-500/30'
              : negative
                ? 'bg-error/10 ring-1 ring-error/30'
                : 'bg-secondary/60',
          )}
        >
          <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-muted-foreground">
            <span>3. الفرق (رصيد − المشتري)</span>
            {positive || negative ? (
              <span>بمعادل عيار 21</span>
            ) : null}
          </div>
          <div className="mt-0.5 flex items-end justify-between gap-2">
            <span
              className={cn(
                'text-[22px] font-bold leading-none tabular-nums',
                positive ? 'text-blue-600' : negative ? 'text-error' : 'text-foreground',
              )}
            >
              {positive ? '+' : ''}
              {formatNumber(diff)}
              <span className="ms-1 text-[12px] font-semibold text-muted-foreground">gm</span>
            </span>
            <span className="pb-0.5 text-[11px] leading-snug text-muted-foreground">
              {positive
                ? 'فائض — رصيد الكسر يغطي المشتريات'
                : negative
                  ? 'عجز — يُكمَّل من التسوية'
                  : 'متوازن'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}