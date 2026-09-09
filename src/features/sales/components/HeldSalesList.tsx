import { Clock, Edit3, Ban, CheckCircle2, ArrowRight, User } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { cn, formatNumber } from '@/shared/lib/utils'
import { typeLabels } from '@/features/products/types'
import type { HeldSale } from '@/features/sales/types'

interface Props {
  sales: HeldSale[]
  onEdit: (sale: HeldSale) => void
  onComplete: (sale: HeldSale) => void
  onCancel: (sale: HeldSale) => void
  onBack: () => void
}

export function HeldSalesList({ sales, onEdit, onComplete, onCancel, onBack }: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 touch-target items-center gap-2 rounded-full border border-black/10 px-4 text-[13px] font-semibold text-foreground hover:bg-black/5"
          >
            <ArrowRight className="size-4" />
            شاشة البيع
          </button>
        </div>
        <div className="flex items-center gap-2 text-[14px] font-bold text-foreground">
          <Clock className="size-4 text-warning" />
          المعلقات
          {sales.length > 0 ? (
            <span className="rounded-full bg-warning/10 px-2.5 py-0.5 text-[12px] font-bold text-warning">
              {sales.length}
            </span>
          ) : null}
        </div>
      </div>

      {sales.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <Clock className="size-12 text-muted-foreground" />
          <p className="text-[17px] font-semibold text-foreground">لا توجد فواتير معلّقة</p>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            عند تعليق فاتورة تُحبس القطع وتُنزَل المديونية الذهبية (بالجرامات) على العميل،
            وتظهر هنا لتُعدَّل أو تُتمَّ أو تُلغى.
          </p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
          {sales.map((sale) => (
            <div
              key={sale.saleId}
              className="rounded-2xl border border-black/5 bg-white p-3 elevation-card"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-[15px] font-bold text-foreground">
                    فاتورة معلّقة #{sale.saleId}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                      sale.heldGrams > 0
                        ? 'bg-warning/10 text-warning'
                        : 'bg-black/5 text-muted-foreground',
                    )}
                  >
                    {formatNumber(sale.heldGrams)} جم / 21
                  </span>
                </div>
                <span className="text-[12px] text-muted-foreground" dir="ltr">
  {new Date(sale.saleDate).toLocaleString('ar-EG')}
</span>
              </div>

              <div className="mt-2 flex items-center gap-2 text-[13px] text-muted-foreground">
                <User className="size-4 text-primary" />
                <span className="truncate font-semibold text-foreground">
                  {sale.customerName ?? '—'}
                </span>
              </div>

              <div className="mt-2 space-y-1">
                {sale.saleItems.map((item) => (
                  <div
                    key={item.saleItemId}
                    className="flex items-center justify-between gap-2 rounded-xl bg-black/[0.03] px-3 py-2 text-[12px]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {item.productName ?? `صنف #${item.productId}`}
                        {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                      </p>
                      <p className="truncate text-muted-foreground">
                        {typeLabels[item.typegolde as keyof typeof typeLabels] ?? '—'} • {item.karat}K{' '}
                        • {formatNumber((item.weight ?? 0) * item.quantity)} جم
                      </p>
                    </div>
                    <span className="shrink-0 tabular-nums font-bold text-warning">
                      {formatNumber(item.grams21 ?? 0)} جم/21
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onEdit(sale)}
                  className="h-11 gap-2 rounded-full text-[12px] touch-target"
                >
                  <Edit3 className="size-4" />
                  فتح للتعديل
                </Button>
                <Button
                  type="button"
                  onClick={() => onComplete(sale)}
                  className="h-11 gap-2 rounded-full text-[12px] touch-target"
                >
                  <CheckCircle2 className="size-4" />
                  إتمام
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => onCancel(sale)}
                  className="h-11 gap-2 rounded-full text-[12px] touch-target"
                >
                  <Ban className="size-4" />
                  إلغاء
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}