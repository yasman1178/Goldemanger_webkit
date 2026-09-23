import { useState, useMemo, useCallback } from 'react'
import {
  ArrowLeftRight,
  Boxes,
  Check,
  CheckCheck,
  Package,
  Plus,
  Scale,
  Search,
  Trash2,
  X,
} from 'lucide-react'

import type { GoldExchangeLine } from '@/features/purchases/types'
import type { InventoryUnitRecord } from '@/features/inventory/types'
import { amountToNumber } from '@/shared/lib/gold'
import { cn, formatNumber } from '@/shared/lib/utils'
import { StoragePicker, type StorageOption } from '@/shared/components/StoragePicker'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

function round3(value: number): number {
  return Math.round(value * 1000) / 1000
}

/** مرجع ثابت لقائمة فارغة — يمنع انهيار المقارنة عند وصول prop غير مصفوفة. */
const EMPTY_UNITS: InventoryUnitRecord[] = []

export interface ExchangePiecePickerProps {
  storages: StorageOption[]
  selectedStorage: string
  onStorageChange: (value: string) => void
  /** كل وحدات الجرد في الفرع — تُفلتر حسب المخزن المختار أو تعرض من كل المخازن. */
  units: InventoryUnitRecord[]
  exchanges: GoldExchangeLine[]
  onAdd: (unit: InventoryUnitRecord) => void
  onAddAll?: (units: InventoryUnitRecord[]) => void
  onRemove: (key: number) => void
  onClearAll?: () => void
  className?: string
}

/**
 * اختيار قطع للاستبدال من مخزن مختار أو من كل المخازن:
 * تدعم اختيار الكل واختيار قطع من أكثر من مخزن في نفس الوقت.
 */
export function ExchangePiecePicker({
  storages,
  selectedStorage,
  onStorageChange,
  units,
  exchanges,
  onAdd,
  onAddAll,
  onRemove,
  onClearAll,
  className,
}: ExchangePiecePickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const safeUnits = Array.isArray(units) ? units : EMPTY_UNITS

  const isAllStorages = !selectedStorage || selectedStorage === 'all'
  const targetStorageId = Number(selectedStorage)

  const storageName = useCallback(
    (id: number | string | undefined | null) => {
      if (id == null) return 'بدون مخزن'
      const n = Number(id)
      const found = storages.find((s) => s.id === n)
      return found?.name || found?.location || `مخزن #${n}`
    },
    [storages],
  )

  const availableUnits = useMemo(() => {
    return safeUnits
      .filter((u) => {
        if (u.status !== 'AVAILABLE' || !(u.weight > 0)) return false
        if (!isAllStorages && u.storageId !== targetStorageId) return false
        return true
      })
      .sort((a, b) => {
        const aScrap = a.products?.typegolde === 3 ? 1 : 0
        const bScrap = b.products?.typegolde === 3 ? 1 : 0
        if (aScrap !== bScrap) return bScrap - aScrap
        if (b.karat !== a.karat) return b.karat - a.karat
        return (a.products?.productName ?? '').localeCompare(b.products?.productName ?? '')
      })
  }, [safeUnits, isAllStorages, targetStorageId])

  const displayedUnits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return availableUnits
    return availableUnits.filter((u) => {
      const name = (u.products?.productName ?? '').toLowerCase()
      const karat = String(u.karat)
      const stName = storageName(u.storageId).toLowerCase()
      return name.includes(q) || karat.includes(q) || stName.includes(q)
    })
  }, [availableUnits, searchQuery, storages])

  const alreadyAdded = useMemo(() => {
    const set = new Set<number>()
    for (const e of exchanges) {
      if (e.inventoryUnitId) set.add(e.inventoryUnitId)
    }
    return set
  }, [exchanges])

  const notAddedInView = useMemo(() => {
    return displayedUnits.filter(
      (u) => u.inventoryUnitId != null && !alreadyAdded.has(u.inventoryUnitId),
    )
  }, [displayedUnits, alreadyAdded])

  const allInViewAdded = displayedUnits.length > 0 && notAddedInView.length === 0

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

  const distinctStoragesCount = useMemo(() => {
    const s = new Set<string>()
    for (const e of exchanges) {
      if (e.storageId) s.add(String(e.storageId))
    }
    return s.size
  }, [exchanges])

  function handleSelectAll() {
    if (notAddedInView.length === 0) return
    if (onAddAll) {
      onAddAll(notAddedInView)
    } else {
      notAddedInView.forEach((u) => onAdd(u))
    }
  }

  function handleRemoveAllInView() {
    const viewUnitIds = new Set(displayedUnits.map((u) => u.inventoryUnitId).filter(Boolean))
    const toRemove = exchanges.filter(
      (e) => e.inventoryUnitId && viewUnitIds.has(e.inventoryUnitId),
    )
    toRemove.forEach((e) => onRemove(e.key))
  }

  return (
    <div className={cn('space-y-3 rounded-2xl border border-black/10 bg-white p-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[14px] font-bold text-foreground">
          <ArrowLeftRight className="size-4 text-primary" />
          رصيد الاستبدال (استبدال ذهب)
        </span>
        <span className="text-[11px] text-muted-foreground">
          يمكنك اختيار قطع من أكثر من مخزن
        </span>
      </div>

      <div className="space-y-1">
        <Label className="text-[13px] font-semibold">مخزن الاستبدال</Label>
        <p className="text-[11px] text-muted-foreground">
          اختر «كل المخازن» لاختيار قطع من مخازن متعددة، أو حدّد مخزناً بعينه.
        </p>
        <StoragePicker
          value={selectedStorage || 'all'}
          storages={storages}
          onChange={onStorageChange}
          allowAll={true}
          allLabel="كل المخازن (اختيار حر من كل المخازن)"
          allowCreate={false}
          placeholder="اختر المخزن"
          triggerClassName="w-full h-11 rounded-[14px] border border-black/10 bg-white text-[14px] font-medium text-foreground"
        />
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Label className="text-[13px] font-bold text-foreground">
              القطع المتاحة للاستبدال ({availableUnits.length})
            </Label>
            {isAllStorages && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                من كل المخازن
              </span>
            )}
          </div>

          {displayedUnits.length > 0 && (
            <div className="flex items-center gap-1.5">
              {!allInViewAdded ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-8 gap-1 rounded-full border-primary/30 bg-primary/5 px-3 text-[11px] font-bold text-primary hover:bg-primary/10 touch-target"
                  title="إضافة كل القطع المتاحة حالياً للاستبدال"
                >
                  <CheckCheck className="size-3.5" />
                  <span>تحديد الكل ({notAddedInView.length})</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveAllInView}
                  className="h-8 gap-1 rounded-full px-2.5 text-[11px] font-semibold text-muted-foreground hover:text-error touch-target"
                  title="إلغاء تحديد كل القطع المعروضة"
                >
                  <X className="size-3.5" />
                  <span>إلغاء تحديد الكل</span>
                </Button>
              )}
            </div>
          )}
        </div>

        {availableUnits.length > 5 && (
          <div className="relative">
            <Search className="absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم أو العيار أو المخزن..."
              className="h-9 rounded-xl ps-8 pe-8 text-[12px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        )}

        {availableUnits.length === 0 ? (
          <p className="rounded-xl bg-black/5 px-3 py-2.5 text-[12px] text-muted-foreground">
            لا توجد قطع متاحة للاستبدال{' '}
            {!isAllStorages ? `في ${storageName(targetStorageId)}` : 'في المخازن'}.
            <span className="block text-[11px] opacity-80">
              الوحدات بالفرع: {safeUnits.length} — تأكد أن حالتها «متاح» ووزنها أكبر من صفر.
            </span>
          </p>
        ) : displayedUnits.length === 0 ? (
          <p className="rounded-xl bg-black/5 px-3 py-2 text-[12px] text-muted-foreground">
            لا توجد نتائج تطابق بحثك.
          </p>
        ) : (
          <div className="max-h-60 space-y-1.5 overflow-y-auto pe-0.5">
            {displayedUnits.map((unit) => {
              const isScrap = unit.products?.typegolde === 3
              const added = unit.inventoryUnitId != null && alreadyAdded.has(unit.inventoryUnitId)
              return (
                <button
                  key={unit.inventoryUnitId}
                  type="button"
                  disabled={added}
                  onClick={() => onAdd(unit)}
                  className={cn(
                    'flex w-full touch-target items-center justify-between gap-2 rounded-xl border p-2 text-start transition-colors',
                    added
                      ? 'border-success/30 bg-success/5 opacity-75'
                      : 'border-black/10 bg-white hover:border-primary/40 hover:bg-primary/[0.03]',
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg',
                        isScrap ? 'bg-amber-100 text-amber-800' : 'bg-primary/10 text-primary',
                      )}
                    >
                      {isScrap ? <Scale className="size-4" /> : <Package className="size-4" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold text-foreground">
                        {unit.products?.productName ?? `منتج #${unit.productId}`}
                      </span>
                      <span className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground">{unit.karat}k</span>
                        <span>•</span>
                        <span>{isScrap ? 'كسر' : 'قطعة مخزن'}</span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-secondary/80 px-1.5 py-0.2 text-[10px] font-medium text-foreground">
                          <Boxes className="size-3 text-primary" />
                          {storageName(unit.storageId)}
                        </span>
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-[13px] font-bold tabular-nums text-foreground">
                      {formatNumber(unit.weight)} gm
                    </span>
                    {added ? (
                      <span className="flex size-6 items-center justify-center rounded-full bg-success/15 text-success">
                        <Check className="size-3.5" />
                      </span>
                    ) : (
                      <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Plus className="size-3.5" />
                      </span>
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
            اختر قطعة أو اضغط «تحديد الكل» لإضافة قطع من أي مخزن.
          </span>
        </div>
      ) : (
        <div className="space-y-1.5 border-t border-black/10 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-[13px] font-bold">
                القطع المختارة ({exchanges.length})
              </Label>
              {distinctStoragesCount > 1 && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                  من {distinctStoragesCount} مخازن
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold tabular-nums text-primary">
                معادل 21: {formatNumber(input21)} gm
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={
                  onClearAll
                    ? onClearAll
                    : () => exchanges.forEach((e) => onRemove(e.key))
                }
                className="h-7 px-2 text-[11px] text-error hover:bg-error/10 touch-target"
              >
                مسح الكل
              </Button>
            </div>
          </div>

          <div className="max-h-48 space-y-1 overflow-y-auto pe-0.5">
            {exchanges.map((e) => {
              const karat = amountToNumber(e.fromKarat)
              const weight = amountToNumber(e.weight)
              return (
                <div
                  key={e.key}
                  className="flex items-center justify-between gap-2 rounded-xl border border-black/10 bg-secondary/35 px-2.5 py-1.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-bold text-foreground">
                      {e.productName || (e.sourceType === 'storeItem' ? 'قطعة مخزن' : 'كسر')}
                    </span>
                    <span className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span>{e.sourceType === 'storeItem' ? 'قطعة مخزن' : 'كسر'}</span>
                      <span>•</span>
                      <span className="font-semibold text-foreground">{karat}k</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-0.5 font-medium text-foreground">
                        <Boxes className="size-3 text-primary" />
                        {storageName(e.storageId)}
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-[12px] font-bold tabular-nums text-foreground">
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