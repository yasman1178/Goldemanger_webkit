import { useMemo } from 'react'
import { ArrowLeftRight, Check, Package, Plus, Scale, Trash2 } from 'lucide-react'

import type { GoldExchangeLine } from '@/features/purchases/types'
import type { InventoryUnitRecord } from '@/features/inventory/types'
import { amountToNumber } from '@/shared/lib/gold'
import { cn, formatNumber } from '@/shared/lib/utils'
import { StoragePicker, type StorageOption } from '@/shared/components/StoragePicker'
import { Label } from '@/shared/components/ui/label'

function round3(value: number): number {
  return Math.round(value * 1000) / 1000
}

/** مرجع ثابت لقائمة فارغة — يمنع انهيار المقارنة عند وصول prop غير مصفوفة. */
const EMPTY_UNITS: InventoryUnitRecord[] = []

export interface ExchangePiecePickerProps {
  storages: StorageOption[]
  selectedStorage: string
  onStorageChange: (value: string) => void
  /** كل وحدات الجرد في الفرع — تُفلتر حسب المخزن المختار. */
  units: InventoryUnitRecord[]
  exchanges: GoldExchangeLine[]
  onAdd: (unit: InventoryUnitRecord) => void
  onRemove: (key: number) => void
  className?: string
}

/**
 * اختيار قطعة للاستبدال من مخزن مختار (الافتراضي مخزن الكسر):
 * كل قطعة تُختار تُضاف إلى رصيد الاستبدال وتدخل في حساب التسوية تلقائياً.
 */
export function ExchangePiecePicker({
  storages,
  selectedStorage,
  onStorageChange,
  units,
  exchanges,
  onAdd,
  onRemove,
  className,
}: ExchangePiecePickerProps) {
  const storageNumber = amountToNumber(selectedStorage)
  // تحصين: أي شكل غير مصفوفة (رد مغلف/نص خطأ) يُعامل كقائمة فارغة بدل الانهيار.
  const safeUnits = Array.isArray(units) ? units : EMPTY_UNITS

  const availableUnits = useMemo(() => {
    if (storageNumber <= 0) return []
    return safeUnits
      .filter((u) => u.storageId === storageNumber && u.status === 'AVAILABLE' && u.weight > 0)
      .sort((a, b) => {
        const aScrap = a.products?.typegolde === 3 ? 1 : 0
        const bScrap = b.products?.typegolde === 3 ? 1 : 0
        if (aScrap !== bScrap) return bScrap - aScrap
        if (b.karat !== a.karat) return b.karat - a.karat
        return (a.products?.productName ?? '').localeCompare(b.products?.productName ?? '')
      })
  }, [safeUnits, storageNumber])

  const alreadyAdded = useMemo(() => {
    const set = new Set<number>()
    for (const e of exchanges) {
      if (e.inventoryUnitId) set.add(e.inventoryUnitId)
    }
    return set
  }, [exchanges])

  const input21 = useMemo(
    () =>
      round3(
        exchanges.reduce((sum, e) => {
          const weight = amountToNumber(e.weight)
          const karat = amountToNumber(e.fromKarat)
          if (weight <= 0 || karat <= 0) return sum
          return sum + (weight * karat) / 21
        }, 0),
      ),
    [exchanges],
  )

  const storageName = (id: number | string) => {
    const n = Number(id)
    return storages.find((s) => s.id === n)?.location ?? `مخزن #${n}`
  }

  const canAddMore = exchanges.length < availableUnits.length

  return (
    <div className={cn('space-y-2.5 rounded-2xl border border-black/10 bg-white p-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
          <ArrowLeftRight className="size-4 text-primary" />
          رصيد الاستبدال
        </span>
        <span className="text-[11px] text-muted-foreground">
          اختر قطعة تُسلَّم بدل الفاتورة
        </span>
      </div>

      <div className="space-y-1">
        <Label className="text-[13px]">مخزن الاستبدال</Label>
        <p className="text-[11px] text-muted-foreground">
          تُعرض هنا قطع «هذا المخزن» المحفوظة بحالة متاح — قطع الفاتورة الحالية تظهر بعد حفظها.
        </p>
        <StoragePicker
          value={selectedStorage}
          storages={storages}
          onChange={onStorageChange}
          allowAll={false}
          allowCreate={false}
          placeholder="اختر المخزن"
          triggerClassName="w-full h-11 rounded-[14px] border border-black/10 bg-white text-[14px] font-medium text-foreground"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-[13px]">اختيار قطعة</Label>
        {storageNumber <= 0 ? (
          <p className="rounded-xl bg-black/5 px-3 py-2 text-[12px] text-muted-foreground">
            اختر المخزن أولاً لعرض القطع المتاحة.
          </p>
        ) : availableUnits.length === 0 ? (
          <p className="rounded-xl bg-black/5 px-3 py-2 text-[12px] text-muted-foreground">
            لا توجد قطع متاحة في هذا المخزن.
            <span className="block text-[11px] opacity-80">
              الوحدات المحمّلة للفرع: {safeUnits.length} — تحقق أن القطع محفوظة (ليست مسودة) وحالتها «متاح».
            </span>
          </p>
        ) : !canAddMore ? (
          <p className="rounded-xl bg-success/10 px-3 py-2 text-[12px] text-success">
            تم إضافة كل القطع المتاحة لهذا المخزن.
          </p>
        ) : (
          <div className="max-h-56 space-y-1 overflow-y-auto pe-0.5">
            {availableUnits.map((unit) => {
              const isScrap = unit.products?.typegolde === 3
              const added = unit.inventoryUnitId != null && alreadyAdded.has(unit.inventoryUnitId)
              return (
                <button
                  key={unit.inventoryUnitId}
                  type="button"
                  disabled={added}
                  onClick={() => onAdd(unit)}
                  className={cn(
                    'flex w-full touch-target items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-start transition-colors',
                    added
                      ? 'border-success/30 bg-success/5 opacity-70'
                      : 'border-black/10 bg-white hover:bg-primary/5',
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-lg',
                        isScrap ? 'bg-primary/10 text-primary' : 'bg-black/5 text-muted-foreground',
                      )}
                    >
                      {isScrap ? <Scale className="size-3.5" /> : <Package className="size-3.5" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-foreground">
                        {unit.products?.productName ?? `منتج #${unit.productId}`}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        {isScrap ? 'كسر' : 'قطعة مخزن'} — {unit.karat}k
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-[12px] font-semibold tabular-nums text-foreground">
                      {formatNumber(unit.weight)} gm
                    </span>
                    {added ? (
                      <Check className="size-4 text-success" />
                    ) : (
                      <Plus className="size-4 text-primary" />
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {exchanges.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-primary/30 bg-primary/[0.04] p-4 text-center">
          <span className="text-[13px] font-semibold text-foreground">
            لم تُضف قطع استبدال بعد
          </span>
          <span className="text-[12px] text-muted-foreground">
            أضف قطعة واحدة على الأقل من مخزن الكسر أو من مخزن آخر.
          </span>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-[13px]">القطع المختارة ({exchanges.length})</Label>
            <span className="text-[12px] font-bold tabular-nums text-primary">
              معادل 21: {formatNumber(input21)} gm
            </span>
          </div>
          <div className="space-y-1">
            {exchanges.map((e) => {
              const karat = amountToNumber(e.fromKarat)
              const weight = amountToNumber(e.weight)
              return (
                <div
                  key={e.key}
                  className="flex items-center justify-between gap-2 rounded-xl border border-black/10 bg-secondary/40 px-2.5 py-1.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-semibold text-foreground">
                      {e.productName || (e.sourceType === 'storeItem' ? 'قطعة مخزن' : 'كسر')}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {e.sourceType === 'storeItem' ? 'قطعة مخزن' : 'كسر'} — {karat}k —{' '}
                      {storageName(e.storageId)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-[12px] font-semibold tabular-nums text-foreground">
                      {formatNumber(weight)} gm
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemove(e.key)}
                      aria-label="إزالة القطعة"
                      className="flex size-7 shrink-0 touch-target items-center justify-center rounded-full text-error hover:bg-error/10"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}