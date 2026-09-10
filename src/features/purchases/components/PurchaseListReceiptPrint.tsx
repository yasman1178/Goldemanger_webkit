import { useQuery } from '@tanstack/react-query'
import { Printer } from 'lucide-react'

import { getCompanyInfo } from '@/features/purchases/api'
import type { Purchase, PurchaseProduct } from '@/features/purchases/types'
import { purchasePerGram, TAX_AND_STAMP_RATE } from '@/shared/lib/gold'
import { formatEgp, formatNumber } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'

const receiptTypeLabels: Record<number, string> = {
  1: 'جديد',
  2: 'مجدّد',
  3: 'كسر',
  4: 'فضة',
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  purchases: Purchase[]
}

function formatShortDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d)
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000
}

/** نفس حسابات فاتورة الشراء — ليطبع كل سطر بنفس ترتيب الفاتورة. */
function lineTotal(p: PurchaseProduct, gold21: number, stampTaxRate: number): number {
  const weight = p.weight ?? 0
  const quantity = p.quantity ?? 1
  const metal = purchasePerGram(gold21, p.karat ?? 21) * weight * quantity
  const unit = purchasePerGram(gold21, p.karat ?? 21) + (p.factory ?? 0)
  const taxAndStamp = metal * stampTaxRate
  return unit * weight * quantity + taxAndStamp
}

function invoiceTotals(p: Purchase) {
  const gold21 = p.goldPrice21AtPurchase ?? 0
  const stampTaxRate = p.stampTaxRate ?? TAX_AND_STAMP_RATE
  const pieces = p.productsDot ?? []
  const pieceCount = pieces.reduce((sum, x) => sum + (x.quantity ?? 0), 0)
  const totalWeight = pieces.reduce(
    (sum, x) => sum + (x.weight ?? 0) * (x.quantity ?? 1),
    0,
  )
  const goldSubtotal = pieces.reduce((sum, x) => {
    const weight = x.weight ?? 0
    return sum + purchasePerGram(gold21, x.karat ?? 21) * weight * (x.quantity ?? 1)
  }, 0)
  const factorySubtotal = pieces.reduce((sum, x) => {
    const weight = x.weight ?? 0
    return sum + (x.factory ?? 0) * weight * (x.quantity ?? 1)
  }, 0)
  const stampAndTaxSubtotal = goldSubtotal * stampTaxRate
  const total = p.totalAmount > 0 ? p.totalAmount : Math.round(goldSubtotal + factorySubtotal + stampAndTaxSubtotal)
  return { gold21, stampTaxRate, pieces, pieceCount, totalWeight, goldSubtotal, factorySubtotal, stampAndTaxSubtotal, total }
}

export function PurchaseListReceiptPrint({ open, onOpenChange, title, purchases }: Props) {
  const { data: shop } = useQuery({
    queryKey: ['company-info'],
    queryFn: getCompanyInfo,
    enabled: open,
  })

  const totals = purchases.reduce(
    (acc, p) => {
      const t = invoiceTotals(p)
      acc.pieces += t.pieceCount
      acc.weight += t.totalWeight
      acc.amount += t.total
      return acc
    },
    { pieces: 0, weight: 0, amount: 0 },
  )

  const shopName = shop?.name?.trim() || 'GOLD POS'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-md">
        <DialogHeader className="receipt-no-print">
          <DialogTitle>سجل فواتير الشراء — طباعة</DialogTitle>
        </DialogHeader>

        <div className="receipt-print mx-auto w-full">
          <div className="receipt-paper rounded-sm p-2 shadow-sm">
            <div className="text-center">
              <p className="text-[13px] font-bold">{shopName}</p>
              <p className="text-[12px] font-bold">سجل فواتير الشراء</p>
              {title && <p className="text-[10px]">{title}</p>}
            </div>

            <div className="mt-1.5 border-t border-dashed border-black/60 pt-1.5">
              <div className="flex justify-between text-[11px]">
                <span>عدد الفواتير</span>
                <span>{formatNumber(purchases.length)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>إجمالي القطع</span>
                <span>{formatNumber(totals.pieces)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>إجمالي الوزن</span>
                <span>{formatNumber(round3(totals.weight))} جم</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold">
                <span>إجمالي المبالغ</span>
                <span>{formatEgp(totals.amount)}</span>
              </div>
            </div>

            {purchases.map((purchase) => {
              const t = invoiceTotals(purchase)
              return (
                <div key={purchase.id} className="mt-2 border-t border-dashed border-black/60 pt-1.5">
                  <div className="flex justify-between gap-2 text-[11px] font-bold">
                    <span>فاتورة شراء #{purchase.id}</span>
                    <span>{formatShortDate(purchase.date)}</span>
                  </div>
                  {(purchase.supplierName ?? purchase.supplierPhone) ? (
                    <div className="text-[11px]">
                      <span className="font-semibold">{purchase.supplierName ?? '—'}</span>
                      {purchase.supplierPhone && <span> — {purchase.supplierPhone}</span>}
                    </div>
                  ) : (
                    <div className="text-[11px]">شراء نقدي</div>
                  )}
                  {purchase.goldPrice21AtPurchase != null && (
                    <div className="text-[11px]">
                      سعر الذهب 21: {formatEgp(purchase.goldPrice21AtPurchase)}
                    </div>
                  )}
                  {purchase.userName && purchase.userName !== 'N/A' && (
                    <div className="text-[11px]">المسؤول: {purchase.userName}</div>
                  )}

                  <div className="mt-1 text-[11px] font-bold">
                    <div className="flex items-end justify-between gap-2">
                      <span className="min-w-0 flex-1">القطعة</span>
                      <span className="w-[22px] text-center">كمية</span>
                      <span className="w-[38px] text-center">وزن</span>
                      <span className="w-[48px] text-end">الإجمالي</span>
                    </div>
                  </div>
                  {t.pieces.length === 0 ? (
                    <p className="py-1 text-center text-[10px]">لا توجد بنود مفصّلة</p>
                  ) : (
                    t.pieces.map((p, i) => {
                      const weight = p.weight ?? 0
                      const quantity = p.quantity ?? 1
                      const line = lineTotal(p, t.gold21, t.stampTaxRate)
                      return (
                        <div key={i} className="border-t border-dashed border-black/40 py-1 text-[11px]">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold">{p.productName || 'قطعة'}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {p.karat ?? 21}K — {receiptTypeLabels[p.typegolde ?? 0] ?? '—'}
                              </p>
                            </div>
                            <span className="w-[22px] text-center">{formatNumber(quantity)}</span>
                            <span className="w-[38px] text-center">{formatNumber(weight)} جم</span>
                            <span className="w-[48px] text-end tabular-nums font-semibold">
                              {formatNumber(line)}
                            </span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px]">
                            <span>ذهب: {formatNumber(purchasePerGram(t.gold21, p.karat ?? 21))}/جم</span>
                            {(p.factory ?? 0) > 0 && (
                              <span className="rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">
                                مصنعية المورد: {formatNumber(p.factory ?? 0)}/جم
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}

                  <div className="mt-1 border-t border-dashed border-black/40 pt-1 text-[11px]">
                    <div className="flex justify-between">
                      <span>عدد القطع</span>
                      <span>{formatNumber(t.pieceCount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الوزن الكلي</span>
                      <span>{formatNumber(t.totalWeight)} جم</span>
                    </div>
                    {t.goldSubtotal > 0 && (
                      <div className="flex justify-between">
                        <span>قيمة الذهب</span>
                        <span>{formatEgp(t.goldSubtotal)}</span>
                      </div>
                    )}
                    {t.factorySubtotal > 0 && (
                      <div className="flex justify-between font-semibold text-foreground">
                        <span>مصنعية المورد</span>
                        <span>{formatEgp(t.factorySubtotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>دمغة وضريبة (1%)</span>
                      <span>{formatEgp(Math.round(t.stampAndTaxSubtotal))}</span>
                    </div>
                    <div className="flex justify-between border-t border-black/20 pt-0.5 text-[12px] font-bold">
                      <span>الإجمالي</span>
                      <span>{formatEgp(t.total)}</span>
                    </div>
                  </div>
                </div>
              )
            })}

            <div className="mt-2 border-t border-dashed border-black/60 pt-1.5 text-center text-[10px]">
              <p>شكراً لتعاملكم معنا</p>
            </div>
          </div>
        </div>

        <div className="mt-3 flex gap-2 receipt-no-print">
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
            className="h-11 flex-1 rounded-full touch-target"
          >
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}