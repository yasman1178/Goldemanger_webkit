import { Minus, Plus, Trash2, ShoppingCart, Tag, Save } from 'lucide-react'

import { TAX_AND_STAMP_RATE, cartLineMath } from '@/shared/lib/gold'
import { cn, currencySymbol, formatNumber } from '@/shared/lib/utils'
import { useCurrencyStore } from '@/shared/stores/currency-store'
import type { CartLine, CartTotals } from './types'
import { karatLabel } from './types'
import { typeLabels } from '@/features/products/types'
import { FormatEg } from './Money'

interface Props {
  cart: CartLine[]
  totals: CartTotals
  goldPrice: number
  onChangeQty: (key: number, delta: number) => void
  onRemove: (key: number) => void
  onClear: () => void
  onCheckout: () => void
  onDiscount: () => void
  editingHeldLabel?: string
  onSaveHeld?: () => void
  savingHeld?: boolean
}

export function CurrentCart({
  cart,
  totals,
  goldPrice,
  onChangeQty,
  onRemove,
  onClear,
  onCheckout,
  onDiscount,
  editingHeldLabel,
  onSaveHeld,
  savingHeld = false,
}: Props) {
  const currency = useCurrencyStore((s) => s.currency)
  const metalIncludingMaking = totals.metal + totals.making
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[15px] font-semibold text-foreground">الفاتورة</p>
          <p className="text-[13px] text-muted-foreground">
            {editingHeldLabel ?? 'بيع جديد'}
          </p>
        </div>
        {cart.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="h-11 touch-target rounded-full px-3 text-[13px] font-semibold text-error hover:bg-error/10"
          >
            إلغاء الفاتورة
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <ShoppingCart className="size-12 text-muted-foreground" />
          <p className="text-[17px] font-semibold text-foreground">الفاتورة فارغة</p>
          <p className="text-sm text-muted-foreground">
            أضف قطعة لبدء عملية البيع
          </p>
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
            {cart.map((line) => (
              <CartItemRow
                key={line.key}
                line={line}
                goldPrice={goldPrice}
                onChangeQty={onChangeQty}
                onRemove={onRemove}
              />
            ))}
          </div>

          <div className="space-y-1.5 rounded-[10px] border border-black/5 bg-white p-3 elevation-card">
            <TotalRow label={`الوزن الإجمالي (${formatNumber(totals.grams)} جم)`} />
            <TotalRow
              label="قيمة الذهب (شاملة المصنعية)"
              value={metalIncludingMaking}
            />
            <TotalRow
              label={`الدمغة والضريبة (${TAX_AND_STAMP_RATE * 100}%)`}
              value={totals.taxAndStamp}
            />
            {totals.discount > 0 && (
              <TotalRow label="الخصم (على المصنعية)" value={-totals.discount} sign />
            )}
            <div className="my-1 h-px bg-border" />
            <div className="flex items-baseline justify-between">
              <span className="text-[12px] font-bold text-foreground">الإجمالي</span>
              <span className="tab-nums text-[24px] font-bold leading-none text-foreground">
                <FormatEg value={totals.total} />
                <span className="text-[11px] text-muted-foreground"> {currencySymbol(currency)}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={onDiscount}
              className="flex h-11 w-full touch-target items-center justify-center gap-2 rounded-full border border-black/10 text-[12px] font-semibold text-foreground hover:bg-black/5"
            >
              <Tag className="size-4" />
              {totals.discount > 0 ? 'تعديل الخصم' : 'تطبيق خصم'}
            </button>

            {onSaveHeld ? (
              <button
                type="button"
                onClick={onSaveHeld}
                disabled={savingHeld}
                className="flex h-11 w-full touch-target items-center justify-center gap-2 rounded-full border border-warning bg-warning/10 text-[13px] font-bold text-warning hover:bg-warning/20 disabled:opacity-60"
              >
                <Save className="size-4" />
                {savingHeld ? 'جارٍ الحفظ...' : 'حفظ التعليق'}
              </button>
            ) : null}

            <button
              type="button"
              disabled={savingHeld}
              onClick={onCheckout}
              className="h-11 w-full touch-target rounded-full bg-primary px-6 text-[13px] font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {editingHeldLabel ? 'إتمام البيع المعلّق' : 'إتمام البيع'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function TotalRow({
  label,
  value,
  sign = false,
}: {
  label: string
  value?: number
  sign?: boolean
}) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      {value != null && (
        <span
          className={cn(
            'tabular-nums font-semibold',
            sign ? 'text-error' : 'text-foreground',
          )}
        >
          {value < 0 ? '-' : ''}
          <FormatEg value={Math.abs(value)} />
          <span className="text-muted-foreground"> ج</span>
        </span>
      )}
    </div>
  )
}

function CartItemRow({
  line,
  goldPrice,
  onChangeQty,
  onRemove,
}: {
  line: CartLine
  goldPrice: number
  onChangeQty: (key: number, delta: number) => void
  onRemove: (key: number) => void
}) {
  const m = cartLineMath(
    goldPrice,
    line.product.karat,
    line.product.weight * line.quantity,
    line.product.factoryForSale || line.product.factory,
  )
  const stock = line.product.quantity ?? 0
  const atStock = line.quantity >= stock

  return (
    <div className="rounded-[10px] border border-black/5 bg-white p-2 elevation-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="break-words text-[12px] font-semibold leading-snug text-foreground">
            {line.product.productName}
          </p>
          <p className="mt-0.5 break-words text-[11px] leading-snug text-muted-foreground">
            {typeLabels[line.product.typegolde as keyof typeof typeLabels] ?? '—'} •{' '}
            {karatLabel(line.product.karat)} • {formatNumber(line.product.weight)} جم
          </p>
        </div>
        <button
          type="button"
          aria-label="حذف البند"
          onClick={() => onRemove(line.key)}
          className="flex size-9 shrink-0 touch-target items-center justify-center rounded-full text-muted-foreground hover:bg-error/10 hover:text-error"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="إنقاص"
            onClick={() => onChangeQty(line.key, -1)}
            className="flex size-10 touch-target items-center justify-center rounded-full bg-secondary text-foreground"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center tabular-nums text-[17px] font-bold text-foreground">
            {line.quantity}
          </span>
          <button
            type="button"
            aria-label="زيادة"
            disabled={atStock}
            onClick={() => onChangeQty(line.key, 1)}
            className="flex size-10 touch-target items-center justify-center rounded-full bg-secondary text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
        {stock > 0 && (
          <span className="text-[11px] text-muted-foreground">
            الرصيد: {stock}
          </span>
        )}
        <span className="tabular-nums text-[17px] font-bold text-foreground">
          <FormatEg value={m.total} />
          <span className="text-[12px] font-semibold text-muted-foreground"> ج</span>
        </span>
      </div>
    </div>
  )
}