import { useMemo, useState } from 'react'
import { Printer, Filter } from 'lucide-react'

import type { Product } from '@/features/products/types'
import { typeLabels } from '@/features/products/types'
import { formatNumber } from '@/shared/lib/utils'
import { useTaxStore } from '@/shared/stores/tax-store'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  products: Product[]
  storageNameOf: (storageId: number | null, fallbackName?: string | null) => string
}

interface StorageGroup {
  name: string
  products: Product[]
  pieces: number
  weight: number
  grams21: number
  totalMaking: number
}

export function InventoryReceiptPrint({
  open,
  onOpenChange,
  title,
  products,
  storageNameOf,
}: Props) {
  const [groupBy, setGroupBy] = useState<'storage' | 'flat'>('storage')

  const groups = useMemo<StorageGroup[]>(() => {
    const map = new Map<string, StorageGroup>()
    for (const p of products) {
      const key = p.storageId != null ? `s:${p.storageId}` : 'none'
      let group = map.get(key)
      if (!group) {
        group = {
          name: storageNameOf(p.storageId, p.storageName),
          products: [],
          pieces: 0,
          weight: 0,
          grams21: 0,
          totalMaking: 0,
        }
        map.set(key, group)
      }
      const qty = p.quantity ?? 0
      const w = qty * (p.weight ?? 0)
      const g21 = w * ((p.karat || 21) / 21)
      const makingFee = useTaxStore
        .getState()
        .getEffectiveMakingFee(p.karat, p.factoryForSale || p.factory)
      group.products.push(p)
      group.pieces += qty
      group.weight += w
      group.grams21 += g21
      group.totalMaking += makingFee * w
    }
    return Array.from(map.values())
  }, [products, storageNameOf])

  const multiStorage = groups.length > 1
  const totalPieces = groups.reduce((sum, g) => sum + g.pieces, 0)
  const totalWeight = groups.reduce((sum, g) => sum + g.weight, 0)
  const totalGrams21 = groups.reduce((sum, g) => sum + g.grams21, 0)
  const totalMaking = groups.reduce((sum, g) => sum + g.totalMaking, 0)

  const karatTotals = useMemo(() => {
    const map = new Map<
      number,
      { pieces: number; weight: number; grams21: number; making: number }
    >()
    for (const p of products) {
      const current = map.get(p.karat) ?? {
        pieces: 0,
        weight: 0,
        grams21: 0,
        making: 0,
      }
      const qty = p.quantity ?? 0
      const w = qty * (p.weight ?? 0)
      const g21 = w * ((p.karat || 21) / 21)
      const fee = useTaxStore
        .getState()
        .getEffectiveMakingFee(p.karat, p.factoryForSale || p.factory)
      map.set(p.karat, {
        pieces: current.pieces + qty,
        weight: current.weight + w,
        grams21: current.grams21 + g21,
        making: current.making + fee * w,
      })
    }
    return Array.from(map, ([karat, values]) => ({ karat, ...values })).sort(
      (a, b) => b.karat - a.karat,
    )
  }, [products])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="receipt-no-print">
          <div className="flex items-center justify-between">
            <DialogTitle>برنت كشف جرد المخزن (80mm)</DialogTitle>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant={groupBy === 'storage' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGroupBy('storage')}
                className="h-7 text-[11px] rounded-full px-2.5 font-bold"
              >
                تجميع بالمخزن
              </Button>
              <Button
                type="button"
                variant={groupBy === 'flat' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGroupBy('flat')}
                className="h-7 text-[11px] rounded-full px-2.5 font-bold"
              >
                سرد الأصناف
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="receipt-print flex justify-center py-1">
            <div className="receipt-paper p-2 w-[80mm] max-w-[80mm] bg-white text-black text-[10.5px] leading-tight font-sans">
              <div className="text-center space-y-0.5">
                <p className="text-[14px] font-black tracking-tight">جولد ماستر — GOLD POS</p>
                <p className="text-[12px] font-bold">كشف جرد الأصناف والمخزن</p>
                <p className="text-[11px] font-semibold text-neutral-800">{title}</p>
                <p className="text-[9.5px] text-neutral-500">
                  تاريخ الطباعة: {new Date().toLocaleString('ar-EG')}
                </p>
              </div>

              {/* صندوق الإجماليات البارز */}
              <div className="my-2 border-t border-b border-dashed border-black py-1.5 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>إجمالي عدد القطع:</span>
                  <span className="tabular-nums">{formatNumber(totalPieces)} قطعة</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>إجمالي الوزن الفعلي:</span>
                  <span className="tabular-nums">{formatNumber(totalWeight)} جم</span>
                </div>
                <div className="flex justify-between font-black text-neutral-900">
                  <span>إجمالي معادل عيار 21:</span>
                  <span className="tabular-nums font-black">
                    {formatNumber(totalGrams21)} جم/21
                  </span>
                </div>
                {totalMaking > 0 && (
                  <div className="flex justify-between text-neutral-700 font-semibold">
                    <span>إجمالي الأجرات (المصنعية):</span>
                    <span className="tabular-nums">{formatNumber(totalMaking)} ج.م</span>
                  </div>
                )}
              </div>

              {/* توزيع المخازن في حال تعدد المخازن */}
              {multiStorage && (
                <div className="mb-2">
                  <p className="font-bold text-[11px] mb-1">توزيع المخازن:</p>
                  <div className="space-y-0.5">
                    {groups.map((group) => (
                      <div key={group.name} className="flex justify-between text-[10px]">
                        <span className="font-semibold">{group.name}</span>
                        <span className="tabular-nums">
                          {formatNumber(group.pieces)} ق • {formatNumber(group.weight)} جم
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="my-1.5 border-t border-dashed border-black" />
                </div>
              )}

              {/* ملخص العيارات */}
              <div className="mb-2">
                <p className="font-bold text-[11px] mb-1">ملخص العيارات والمعادل:</p>
                <table className="w-full text-start text-[10px]">
                  <thead>
                    <tr className="border-b border-black font-bold">
                      <th className="text-start pb-0.5">العيار</th>
                      <th className="text-center pb-0.5">القطع</th>
                      <th className="text-end pb-0.5">الوزن</th>
                      <th className="text-end pb-0.5">معادل 21</th>
                    </tr>
                  </thead>
                  <tbody>
                    {karatTotals.map((entry) => (
                      <tr key={entry.karat} className="border-b border-black/20">
                        <td className="font-bold">{entry.karat}k</td>
                        <td className="text-center tabular-nums">{formatNumber(entry.pieces)}</td>
                        <td className="text-end tabular-nums">{formatNumber(entry.weight)} جم</td>
                        <td className="text-end tabular-nums font-semibold">
                          {formatNumber(entry.grams21)} جم
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* تفاصيل المنتجات المتاحة مع الحالة والمخزن */}
              <div className="my-2 border-t border-dashed border-black pt-1">
                <p className="font-bold text-[11px] mb-1">
                  {groupBy === 'storage' ? 'تفاصيل الأصناف حسب المخزن:' : 'سرد كافة الأصناف:'}
                </p>
                {groups.map((group) => (
                  <div key={group.name} className="mb-2">
                    {groupBy === 'storage' && multiStorage && (
                      <p className="font-bold text-[10.5px] bg-black/5 px-1 py-0.5 mb-1">
                        {group.name} ({formatNumber(group.pieces)} قطعة)
                      </p>
                    )}
                    <table className="w-full text-start text-[9px]">
                      <thead>
                        <tr className="border-b border-black font-bold">
                          <th className="text-start pb-0.5">الصنف</th>
                          <th className="text-center pb-0.5">العيار</th>
                          <th className="text-center pb-0.5">الحالة</th>
                          <th className="text-center pb-0.5">العدد</th>
                          <th className="text-end pb-0.5">الوزن</th>
                          <th className="text-end pb-0.5">معادل 21</th>
                          <th className="text-end pb-0.5">الأجرة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.products.map((p) => {
                          const qty = p.quantity ?? 0
                          const w = qty * (p.weight ?? 0)
                          const g21 = w * ((p.karat || 21) / 21)
                          const conditionLabel =
                            typeLabels[p.typegolde as keyof typeof typeLabels] ||
                            (p.typegolde === 2 ? 'مجدد' : p.typegolde === 3 ? 'كسر' : 'جديد')
                          const makingFee = useTaxStore
                            .getState()
                            .getEffectiveMakingFee(p.karat, p.factoryForSale || p.factory)
                          return (
                            <tr key={p.productId} className="border-b border-black/10">
                              <td className="py-0.5">
                                <span className="font-semibold block truncate max-w-[24mm]">
                                  {p.productName}
                                </span>
                              </td>
                              <td className="text-center py-0.5">{p.karat}k</td>
                              <td className="text-center py-0.5">{conditionLabel}</td>
                              <td className="text-center tabular-nums py-0.5">
                                {formatNumber(qty)}
                              </td>
                              <td className="text-end tabular-nums py-0.5">
                                {formatNumber(w)}
                              </td>
                              <td className="text-end tabular-nums font-semibold py-0.5">
                                {formatNumber(g21)}
                              </td>
                              <td className="text-end tabular-nums py-0.5">
                                {makingFee > 0 ? `${formatNumber(makingFee)} ج` : '—'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>

              <div className="my-2 border-t border-dashed border-black pt-1" />
              <p className="text-center text-[9px] text-neutral-600">
                الرصيد الفعلي المتاح وقت الطباعة — نظام جولد ماستر ERP
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 gap-2 border-t border-black/[0.05] px-5 pt-3 pb-5 sm:px-6 sm:pb-6 receipt-no-print">
          <Button
            type="button"
            onClick={() => window.print()}
            className="h-11 flex-1 gap-2 rounded-full touch-target font-bold"
          >
            <Printer className="size-4" />
            طباعة الكشف (80mm)
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 rounded-full touch-target"
          >
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
