import { useMemo } from 'react'
import { Scale } from 'lucide-react'

import { cn, formatEgp, formatNumber } from '@/shared/lib/utils'

function round3(value: number): number {
  return Math.round(value * 1000) / 1000
}

export interface TwentyOneKConversionBarProps {
  /** القطع المشتراة المضافة مجمّعة حسب كل عيار. */
  purchasedByKarat?: Array<{ karat: number; weight: number }>
  /** مكافئ عيار 21 للقطع المشتراة (المُشترى). */
  purchased21?: number
  /** القطع المبدلة المختارة من المخزن مجمّعة حسب كل عيار. */
  givenByKarat?: Array<{ karat: number; weight: number }>
  /** مكافئ عيار 21 للقطع المبدلة (المُستبدل). */
  given21?: number
  /** سعر جرام 21 لحساب فرق النقد المقابل. */
  goldPrice?: number
  /** مصنعية + دمغة/ضريبة (بقيمة نقدية) غير المغطاة بذهب المستبدل. */
  settlementResidual?: number
  /** وضع مدمج: الرصيد المعطى حتى الآن (كل عيار 21) — يُستخدم في معاينة القطعة داخل النموذج. */
  input21?: number
  /** وضع مدمج: الرصيد مع القطعة الحالية (كل عيار 21). */
  output21?: number
  className?: string
}

/**
 * معادلة عيار 21:
 * — الوضع الكامل: القطع المبدلة المختارة (المستبدل → 21) مقابل القطع المشتراة مع الفرق والمصنعية/الضريبة.
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
  purchasedByKarat = [],
  purchased21,
  givenByKarat = [],
  given21,
  goldPrice,
  settlementResidual = 0,
  className,
}: TwentyOneKConversionBarProps) {
  const given = useMemo(() => {
    return [...givenByKarat]
      .filter((g) => g.karat > 0)
      .sort((a, b) => b.karat - a.karat)
  }, [givenByKarat])

  const purchases = useMemo(() => {
    return [...purchasedByKarat]
      .filter((p) => p.karat > 0)
      .sort((a, b) => b.karat - a.karat)
  }, [purchasedByKarat])

  const givenTotal21 =
    given21 ?? round3(given.reduce((sum, g) => sum + (g.weight * g.karat) / 21, 0))

  const purchasedTotal21 =
    purchased21 ??
    round3(purchases.reduce((sum, p) => sum + (p.weight * p.karat) / 21, 0))

  const diff = round3(purchasedTotal21 - givenTotal21)
  const cash = goldPrice && goldPrice > 0 ? round3(Math.abs(diff) * goldPrice) : 0
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
          القطع المبدلة المختارة ← مقابل المشتراة
        </span>
      </div>

      <div className="space-y-1.5">
        {/* ① المستبدل — القطع المختارة → 21 */}
        <div className="rounded-xl bg-secondary/60 p-2.5">
          <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
            <span>1. المستبدل (القطع المختارة)</span>
            <span>وزن + معادل 21</span>
          </div>
          {given.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">لم تُختر قطع بدل بعد.</p>
          ) : (
            <div className="space-y-0.5 text-[12px]">
              {given.map(({ karat, weight }) => (
                <div key={karat} className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">{karat}k</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatNumber(weight)} gm
                    <span className="ms-1 font-normal text-muted-foreground">
                      • معادل {formatNumber(round3((weight * karat) / 21))} gm
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-dashed border-black/10 pt-1 text-[12px] font-bold">
            <span className="text-muted-foreground">معادل عيار 21</span>
            <span className="tabular-nums text-primary">{formatNumber(givenTotal21)} gm</span>
          </div>
        </div>

        {/* ② المشتري — القطع المضافة → 21 */}
        <div className="rounded-xl bg-secondary/60 p-2.5">
          <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
            <span>2. المشتري (القطع المضافة)</span>
            <span>وزن + معادل 21</span>
          </div>
          {purchases.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">لم تُضف قطع بعد.</p>
          ) : (
            <div className="space-y-0.5 text-[12px]">
              {purchases.map(({ karat, weight }) => (
                <div key={karat} className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">{karat}k</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatNumber(weight)} gm
                    <span className="ms-1 font-normal text-muted-foreground">
                      • معادل {formatNumber(round3((weight * karat) / 21))} gm
                    </span>
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

        {/* ③ الخلاصة — المعادلات والفارق والمصنعية/الضريبة */}
        <div
          className={cn(
            'space-y-1 rounded-xl px-3 py-2.5 text-[12px]',
            positive
              ? 'bg-blue-500/10 ring-1 ring-blue-500/30'
              : negative
                ? 'bg-error/10 ring-1 ring-error/30'
                : 'bg-secondary/60',
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">المعادل للإجمالي (المستبدل)</span>
            <span className="font-semibold tabular-nums text-foreground">
              {formatNumber(givenTotal21)} gm
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">المعادل للمشتريات</span>
            <span className="font-semibold tabular-nums text-foreground">
              {formatNumber(purchasedTotal21)} gm
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-dashed border-black/10 pt-1 font-bold">
            <span className="text-muted-foreground">الفارق عيار 21</span>
            <span
              className={cn(
                'tabular-nums',
                positive ? 'text-blue-600' : negative ? 'text-error' : 'text-foreground',
              )}
            >
              {diff > 0 ? '+' : ''}
              {formatNumber(diff)} gm
              {cash > 0 && (
                <span className="ms-1 font-normal text-muted-foreground">
                  — {formatEgp(cash)}
                </span>
              )}
            </span>
          </div>
          {settlementResidual > 0 && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">مصنعية ودمغة</span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatEgp(settlementResidual)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}