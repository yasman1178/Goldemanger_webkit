import { useState, useMemo, useCallback } from 'react'
import {
  ArrowLeftRight,
  Boxes,
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

export interface ExchangePiecePickerProps {
  storages: StorageOption[]
  selectedStorage?: string
  onStorageChange: (storageId: string) => void
  units: InventoryUnitRecord[]
  exchanges: GoldExchangeLine[]
  onAdd: (unit: InventoryUnitRecord) => void
  onAddAll?: (units: InventoryUnitRecord[]) => void
  onRemove: (key: number) => void
  onClearAll?: () => void
  className?: string
}

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

  const safeUnits = useMemo(() => (Array.isArray(units) ? units : []), [units])

  const targetStorageId = useMemo(() => {
    if (!selectedStorage || selectedStorage === 'all') return null
    const n = Number(selectedStorage)
    return Number.isFinite(n) ? n : null
  }, [selectedStorage])

  const isAllStorages = targetStorageId == null

  const storageName = useCallback(
    (storageId: number | null | undefined): string => {
      if (storageId == null) return 'بدون مخزن'
      const found = storages.find((s) => s.id === storageId)
      return found?.name || found?.location || `مخزن #${storageId}`
    },
    [storages],
  )

  // مجموعة معرّفات القطع المختارة حالياً
  const alreadyAddedUnitIds = useMemo(() => {
    const set = new Set<number>()
    for (const e of exchanges) {
      if (e.inventoryUnitId) set.add(e.inventoryUnitId)
    }
    return set
  }, [exchanges])

  // خريطة للوصول السريع لمفتاح exchange بناءً على inventoryUnitId
  const unitIdToExchangeKey = useMemo(() => {
    const map = new Map<number, number>()
    for (const e of exchanges) {
      if (e.inventoryUnitId) {
        map.set(e.inventoryUnitId, e.key)
      }
    }
    return map
  }, [exchanges])

  // القطع المتاحة في المخزن المختار (مع عرض القطع المختارة بأعلى القائمة)
  const unitsInCurrentStorage = useMemo(() => {
    return safeUnits
      .filter((u) => {
        if (u.status !== 'AVAILABLE' || !(u.weight > 0)) return false
        if (!isAllStorages && u.storageId !== targetStorageId) return false
        return true
      })
      .sort((a, b) => {
        // نضع القطع المختارة أولاً لتكون بارزة
        const aSelected = a.inventoryUnitId != null && alreadyAddedUnitIds.has(a.inventoryUnitId) ? 1 : 0
        const bSelected = b.inventoryUnitId != null && alreadyAddedUnitIds.has(b.inventoryUnitId) ? 1 : 0
        if (aSelected !== bSelected) return bSelected - aSelected

        const aScrap = a.products?.typegolde === 3 ? 1 : 0
        const bScrap = b.products?.typegolde === 3 ? 1 : 0
        if (aScrap !== bScrap) return bScrap - aScrap
        if (b.karat !== a.karat) return b.karat - a.karat
        return (a.products?.productName ?? '').localeCompare(b.products?.productName ?? '')
      })
  }, [safeUnits, isAllStorages, targetStorageId, alreadyAddedUnitIds])

  // تطبيق البحث على القطع
  const displayedUnits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return unitsInCurrentStorage
    return unitsInCurrentStorage.filter((u) => {
      const name = (u.products?.productName ?? '').toLowerCase()
      const karat = String(u.karat)
      const stName = storageName(u.storageId).toLowerCase()
      return name.includes(q) || karat.includes(q) || stName.includes(q)
    })
  }, [unitsInCurrentStorage, searchQuery, storageName])

  // القطع غير المختارة بعد من بين المعروضة (لتحديد الكل)
  const unselectedDisplayedUnits = useMemo(() => {
    return displayedUnits.filter(
      (u) => u.inventoryUnitId != null && !alreadyAddedUnitIds.has(u.inventoryUnitId),
    )
  }, [displayedUnits, alreadyAddedUnitIds])

  // إجمالي وزن الذهب معادل 21 للقطع المختارة
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

  // إجمالي الوزن الفعلي للقطع المختارة
  const totalWeight = useMemo(
    () =>
      round3(
        exchanges.reduce((sum, e) => {
          const weight = amountToNumber(e.weight)
          return sum + (weight > 0 ? weight : 0)
        }, 0),
      ),
    [exchanges],
  )

  // عدد المخازن المختلفة التي جرى الاختيار منها
  const distinctStorages = useMemo(() => {
    const map = new Map<string, string>()
    for (const e of exchanges) {
      if (e.storageId) {
        map.set(String(e.storageId), storageName(Number(e.storageId)))
      }
    }
    return Array.from(map.values())
  }, [exchanges, storageName])

  function handleSelectAll() {
    if (unselectedDisplayedUnits.length === 0) return
    if (onAddAll) {
      onAddAll(unselectedDisplayedUnits)
    } else {
      unselectedDisplayedUnits.forEach((u) => onAdd(u))
    }
  }

  function handleClearAll() {
    if (onClearAll) {
      onClearAll()
    } else {
      exchanges.forEach((e) => onRemove(e.key))
    }
  }

  function handleRemoveByUnit(unit: InventoryUnitRecord) {
    if (unit.inventoryUnitId == null) return
    const key = unitIdToExchangeKey.get(unit.inventoryUnitId)
    if (key != null) {
      onRemove(key)
    }
  }

  const currentStorageLabel = isAllStorages
    ? 'كل المخازن'
    : storageName(targetStorageId)

  return (
    <div className={cn('space-y-3.5 rounded-2xl border border-black/10 bg-white p-4 elevation-card', className)}>
      {/* Header Bar with Summary & Clear Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ArrowLeftRight className="size-4" />
          </span>
          <div>
            <h3 className="text-[15px] font-bold text-foreground">
              القطع المختارة للاستبدال
            </h3>
            <p className="text-[11px] text-muted-foreground">
              يمكنك اختيار قطع من أكثر من مخزن — تغيير المخزن لا يحذف ما تم اختياره
            </p>
          </div>
        </div>

        {exchanges.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="h-8 gap-1.5 rounded-full border-error/30 text-error hover:bg-error/10 hover:text-error touch-target font-bold"
              title="مسح كافة القطع المضافة للاستبدال"
            >
              <Trash2 className="size-3.5" />
              <span>مسح القطع المضافة ({exchanges.length})</span>
            </Button>
          </div>
        )}
      </div>

      {/* Summary Chips */}
      {exchanges.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/[0.04] px-3.5 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-[12px] font-bold text-white tabular-nums">
              {exchanges.length} قطع مختارة
            </span>
            <span className="text-[12px] font-semibold text-foreground tabular-nums">
              الوزن: <span className="font-bold text-primary">{formatNumber(totalWeight)} جم</span>
            </span>
            <span className="text-[12px] font-semibold text-foreground tabular-nums">
              (معادل 21: <span className="font-bold text-amber-600">{formatNumber(input21)} جم</span>)
            </span>
          </div>

          {distinctStorages.length > 1 && (
            <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-semibold text-foreground">
              من {distinctStorages.length} مخازن ({distinctStorages.join('، ')})
            </span>
          )}
        </div>
      )}

      {/* Storage Filter Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-[13px] font-semibold text-foreground">
            تصفية بالمخزن:
          </Label>
          <span className="text-[11px] text-muted-foreground">
            تغيير المخزن لا يحذف القطع المختارة
          </span>
        </div>
        <StoragePicker
          value={selectedStorage || 'all'}
          storages={storages}
          onChange={onStorageChange}
          allowAll={true}
          allLabel="كل المخازن (عرض المتاح في جميع المخازن)"
          allowCreate={false}
          placeholder="اختر المخزن"
          triggerClassName="w-full h-11 rounded-[14px] border border-black/10 bg-white text-[14px] font-medium text-foreground"
        />
      </div>

      {/* Pieces List Section */}
      <div className="space-y-2 pt-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Label className="text-[13px] font-bold text-foreground">
              القطع المختارة والمتاحة ({unitsInCurrentStorage.length})
            </Label>
            <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-foreground">
              {currentStorageLabel}
            </span>
          </div>

          {unselectedDisplayedUnits.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="h-8 gap-1 rounded-full border-primary/30 bg-primary/5 px-3 text-[11px] font-bold text-primary hover:bg-primary/10 touch-target"
              title="إضافة كل القطع غير المختارة دفعة واحدة"
            >
              <CheckCheck className="size-3.5" />
              <span>تحديد الكل ({unselectedDisplayedUnits.length})</span>
            </Button>
          )}
        </div>

        {/* Search */}
        {unitsInCurrentStorage.length > 3 && (
          <div className="relative">
            <Search className="absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`ابحث بالاسم أو العيار أو المخزن...`}
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

        {/* Units list */}
        {unitsInCurrentStorage.length === 0 ? (
          <div className="rounded-xl border border-black/5 bg-black/[0.02] p-4 text-center text-[13px] text-muted-foreground">
            لا توجد قطع في <span className="font-semibold text-foreground">{currentStorageLabel}</span>.
          </div>
        ) : displayedUnits.length === 0 ? (
          <p className="rounded-xl bg-black/5 px-3 py-3 text-center text-[12px] text-muted-foreground">
            لا توجد نتائج تطابق «{searchQuery}».
          </p>
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto pe-1">
            {displayedUnits.map((unit) => {
              const isScrap = unit.products?.typegolde === 3
              const isSelected = unit.inventoryUnitId != null && alreadyAddedUnitIds.has(unit.inventoryUnitId)

              return (
                <div
                  key={unit.inventoryUnitId}
                  className={cn(
                    'flex w-full items-center justify-between gap-2.5 rounded-xl border p-2.5 transition-colors',
                    isSelected
                      ? 'border-primary/50 bg-primary/[0.04] shadow-sm'
                      : 'border-black/10 bg-white hover:border-primary/30 hover:bg-black/[0.01]',
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg',
                        isSelected
                          ? 'bg-primary text-white'
                          : isScrap
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-primary/10 text-primary',
                      )}
                    >
                      {isScrap ? <Scale className="size-4" /> : <Package className="size-4" />}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-bold text-foreground">
                          {unit.products?.productName ?? `منتج #${unit.productId}`}
                        </span>
                        {isSelected && (
                          <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.2 text-[10px] font-bold text-primary">
                            تم الاختيار
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground">{unit.karat}k</span>
                        <span>•</span>
                        <span>{isScrap ? 'كسر' : 'قطعة مخزن'}</span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-secondary/80 px-1.5 py-0.2 text-[10px] font-medium text-foreground">
                          <Boxes className="size-3 text-primary" />
                          {storageName(unit.storageId)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[13px] font-bold tabular-nums text-foreground">
                      {formatNumber(unit.weight)} gm
                    </span>

                    {isSelected ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveByUnit(unit)}
                        className="h-8 gap-1 rounded-full border-error/30 bg-error/5 px-2.5 text-[11px] font-bold text-error hover:bg-error hover:text-white touch-target"
                        title="إلغاء اختيار هذه القطعة من الاستبدال"
                      >
                        <Trash2 className="size-3.5" />
                        <span>إلغاء الاختيار</span>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => onAdd(unit)}
                        className="h-8 gap-1 rounded-full px-3 text-[11px] font-bold touch-target"
                      >
                        <Plus className="size-3.5" />
                        <span>اختيار</span>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
