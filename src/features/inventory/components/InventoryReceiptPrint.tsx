import { useMemo } from 'react'
import { Printer } from 'lucide-react'

import type { Product } from '@/features/products/types'
import { formatNumber } from '@/shared/lib/utils'
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
  storageNameOf: (storageId: number | null) => string
}

interface StorageGroup {
  name: string
  products: Product[]
  pieces: number
  weight: number
}

export function InventoryReceiptPrint({
  open,
  onOpenChange,
  title,
  products,
  storageNameOf,
}: Props) {
  const groups = useMemo<StorageGroup[]>(() => {
    const map = new Map<string, StorageGroup>()
    for (const p of products) {
      const key = p.storageId != null ? `s:${p.storageId}` : 'none'
      let group = map.get(key)
      if (!group) {
        group = { name: storageNameOf(p.storageId), products: [], pieces: 0, weight: 0 }
        map.set(key, group)
      }
      group.products.push(p)
      group.pieces += p.quantity ?? 0
      group.weight += (p.quantity ?? 0) * (p.weight ?? 0)
    }
    return Array.from(map.values())
  }, [products, storageNameOf])

  const multiStorage = groups.length > 1
  const totalPieces = groups.reduce((sum, g) => sum + g.pieces, 0)
  const totalWeight = groups.reduce((sum, g) => sum + g.weight, 0)

  const karatTotals = useMemo(() => {
    const map = new Map<number, { pieces: number; weight: number }>()
    for (const p of products) {
      const current = map.get(p.karat) ?? { pieces: 0, weight: 0 }
      map.set(p.karat, {
        pieces: current.pieces + (p.quantity ?? 0),
        weight: current.weight + (p.quantity ?? 0) * (p.weight ?? 0),
      })
    }
    return Array.from(map, ([karat, values]) => ({ karat, ...values }))
      .sort((a, b) => b.karat - a.karat)
  }, [products])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="receipt-no-print">
          <DialogTitle>برنت جرد المخزن</DialogTitle>
        </DialogHeader>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="receipt-print flex justify-center py-2">
          <div className="receipt-paper p-2">
            <div className="text-center">
              <p className="text-[13px] font-bold">GOLD POS</p>
              <p className="text-[12px] font-bold">كشف جرد المخزن</p>
              <p className="text-[11px]">{title}</p>
            </div>
            <div className="my-2 border-t border-dashed border-black" />
            <div className="flex justify-between text-[11px] font-bold">
              <span>إجمالي القطع</span>
              <span>{formatNumber(totalPieces)} قطعة</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold">
              <span>إجمالي الوزن</span>
              <span>{formatNumber(totalWeight)} جم</span>
            </div>
            {multiStorage && (
              <>
                <div className="my-2 border-t border-dashed border-black" />
                <p className="text-[11px] font-bold">توزيع المخازن الفرعية</p>
                {groups.map((group) => (
                  <div key={group.name} className="flex justify-between text-[11px]">
                    <span>{group.name}</span>
                    <span>
                      {formatNumber(group.pieces)} قطعة • {formatNumber(group.weight)} جم
                    </span>
                  </div>
                ))}
              </>
            )}
            <div className="my-2 border-t border-dashed border-black" />
            <p className="text-[11px] font-bold">ملخص العيارات</p>
            <table>
              <thead>
                <tr>
                  <th>العيار</th>
                  <th>العدد</th>
                  <th>الوزن</th>
                </tr>
              </thead>
              <tbody>
                {karatTotals.map((entry) => (
                  <tr key={entry.karat}>
                    <td>{entry.karat}k</td>
                    <td>{formatNumber(entry.pieces)}</td>
                    <td>{formatNumber(entry.weight)} جم</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="my-2 border-t border-dashed border-black" />
            <p className="text-[11px] font-bold">تفاصيل المنتجات المتاحة</p>
            {groups.map((group) => (
              <div key={group.name}>
                {multiStorage && (
                  <p className="mt-1 text-[11px] font-bold">
                    {group.name} — {formatNumber(group.pieces)} قطعة
                  </p>
                )}
                <table>
                  <thead>
                    <tr>
                      <th>المنتج</th>
                      <th>العدد</th>
                      <th>الوزن</th>
                      <th>العيار</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.products.map((p) => (
                      <tr key={p.productId}>
                        <td>{p.productName}</td>
                        <td>{formatNumber(p.quantity ?? 0)}</td>
                        <td>{formatNumber((p.quantity ?? 0) * (p.weight ?? 0))} جم</td>
                        <td>{p.karat}k</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            <div className="my-2 border-t border-dashed border-black" />
            <p className="text-center text-[10px]">الرصيد الفعلي المتاح وقت الطباعة</p>
          </div>
        </div>

          <div className="flex gap-2 receipt-no-print">
            <Button
              type="button"
              onClick={() => window.print()}
              className="h-11 flex-1 gap-2 rounded-full touch-target"
            >
              <Printer className="size-4" />
              طباعة
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
