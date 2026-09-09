import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Scale } from 'lucide-react'

import { getInventoryUnits } from '@/features/inventory/api'
import { amountToNumber } from '@/shared/lib/gold'
import { cn, formatNumber } from '@/shared/lib/utils'
import { Skeleton } from '@/shared/components/ui/skeleton'

function round3(value: number): number {
  return Math.round(value * 1000) / 1000
}

export interface ScrapAvailabilityCardProps {
  storageId?: string | number
  branchId?: number
  className?: string
  scope?: 'storage' | 'store'
  deduct21?: number
}

/**
 * رصيد الكسر (خردة الذهب) المتاح.
 * scope="storage" (الافتراضي): في مخزن معين حسب كل عيار — يُستهلك عند استبدال ذهب بنوع "كسر".
 * scope="store": على مستوى المحل كاملاً بمعادل عيار 21، مع خصم القطع المشتراة المضافة.
 */
export function ScrapAvailabilityCard({
  storageId,
  branchId,
  className,
  scope = 'storage',
  deduct21,
}: ScrapAvailabilityCardProps) {
  const storageNumber = amountToNumber(String(storageId ?? ''))
  const { data: units = [], isLoading } = useQuery({
    queryKey: ['purchase-scrap-units', branchId],
    queryFn: () => getInventoryUnits(branchId ?? undefined),
  })

  const balances = useMemo(() => {
    if (scope === 'storage' && storageNumber <= 0) return []
    const map = new Map<number, number>()
    for (const unit of units) {
      if (unit.status !== 'AVAILABLE') continue
      if (unit.products?.typegolde !== 3) continue
      if (scope === 'storage' && unit.storageId !== storageNumber) continue
      if (unit.karat <= 0) continue
      map.set(unit.karat, round3((map.get(unit.karat) ?? 0) + unit.weight))
    }
    return [...map.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([karat, weight]) => ({ karat, weight }))
  }, [units, storageNumber, scope])

  const storeBalance21 = useMemo(() => {
    if (scope !== 'store') return 0
    return round3(balances.reduce((sum, b) => sum + (b.weight * b.karat) / 21, 0))
  }, [balances, scope])

  if (scope === 'storage' && storageNumber <= 0) return null

  if (scope === 'store') {
    const added = deduct21 ?? 0
    const remaining = round3(storeBalance21 - added)
    return (
      <div
        className={cn(
          'space-y-1.5 rounded-xl border border-black/10 bg-secondary/40 p-2.5 sm:col-span-2',
          className,
        )}
      >
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground">
          <Scale className="size-3.5 text-primary" />
          رصيد كسر الذهب بالمحل
          <span className="font-normal">(معادل عيار 21)</span>
        </div>
        {isLoading ? (
          <Skeleton className="h-7 w-full" />
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between rounded-lg bg-white/80 px-2.5 py-1.5 text-[13px]">
              <span className="text-muted-foreground">رصيد الكسر المتاح</span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatNumber(storeBalance21)} gm
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white/80 px-2.5 py-1.5 text-[13px]">
              <span className="text-muted-foreground">
                القطع المشتراة المضافة
              </span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatNumber(added)} gm
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white/80 px-2.5 py-1.5 text-[13px]">
              <span className="text-muted-foreground">المتبقي بعد الخصم</span>
              <span
                className={cn(
                  'font-bold tabular-nums',
                  remaining < 0 ? 'text-error' : 'text-foreground',
                )}
              >
                {formatNumber(remaining)} gm
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'space-y-1.5 rounded-xl border border-black/10 bg-secondary/40 p-2.5 sm:col-span-2',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground">
        <Scale className="size-3.5 text-primary" />
        رصيد الكسر المتاح
        <span className="font-normal">(يُخصم عند الاستبدال)</span>
      </div>
      {isLoading ? (
        <Skeleton className="h-7 w-full" />
      ) : balances.length === 0 ? (
        <p className="text-[12px] text-muted-foreground">
          لا يوجد كسر متاح في هذا المخزن.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {balances.map(({ karat, weight }) => (
            <div
              key={karat}
              className="flex items-center justify-between rounded-lg bg-white/80 px-2.5 py-1.5 text-[13px]"
            >
              <span className="text-muted-foreground">{karat}k</span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatNumber(weight)} gm
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}