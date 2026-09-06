import type { CompanyInfo } from '@/features/purchases/types'
import type { SalePrintData } from '@/features/sales/api'
import { purchasePerGram } from '@/shared/lib/gold'
import { formatEgp, formatNumber } from '@/shared/lib/utils'

const receiptTypeLabels: Record<number, string> = {
  1: 'جديد',
  2: 'مجدّد',
  3: 'كسر',
  4: 'فضة',
}

function formatReceiptDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d)
}

interface Props {
  data: SalePrintData
  shop?: CompanyInfo
}

export function SaleReceiptView({ data, shop }: Props) {
  const shopName = shop?.name?.trim() || 'محل الذهب'
  const address = [
    shop?.location?.trim(),
    [shop?.city?.trim(), shop?.station?.trim()].filter(Boolean).join(' — '),
  ]
    .filter(Boolean)
    .join('، ')

  const items = data.saleItems ?? []
  const gold21 = data.gold21Price ?? 0
  const pieceCount = items.reduce((sum, i) => sum + (i.quantity ?? 0), 0)
  const totalWeight = items.reduce(
    (sum, i) => sum + (i.weight ?? 0) * (i.quantity ?? 0),
    0,
  )
  const goldSubtotal = items.reduce((sum, i) => {
    const grams = (i.weight ?? 0) * (i.quantity ?? 0)
    return sum + purchasePerGram(gold21, i.karat ?? 21) * grams
  }, 0)
  const rounded = Math.round(data.totalAmount ?? 0)
  const paid = Math.round(data.paid ?? 0)
  const remaining = Math.round(data.amountOwed ?? 0)

  return (
    <div className="mx-auto receipt-paper receipt-print rounded-sm p-2 shadow-sm">
      <div className="text-center">
        {shop?.logoPath && (
          <img
            src={shop.logoPath}
            alt=""
            className="mx-auto mb-1 max-h-10 object-contain"
          />
        )}
        <p className="text-[13px] font-bold">فاتورة بيع</p>
        <p className="mt-0.5 text-[12px] font-bold">{shopName}</p>
        {shop?.branchName && <p>{shop.branchName}</p>}
        {address && <p>{address}</p>}
        {shop?.commercialRegistrationNumber && (
          <p>سجل تجاري: {shop.commercialRegistrationNumber}</p>
        )}
        {shop?.taxCardNumber && <p>سجل ضريبي: {shop.taxCardNumber}</p>}
      </div>

      <div className="mt-2 border-t border-dashed border-black/60 pt-1.5" />

      <div className="flex justify-between gap-2 text-[11px]">
        <span>رقم الفاتورة: #{data.saleId}</span>
        <span>{formatReceiptDate(data.saleDate)}</span>
      </div>
      <div className="text-[11px]">
        <span className="font-semibold">
          {data.customerName?.trim() || 'عميل نقدي'}
        </span>
      </div>
      {data.employeeName && (
        <div className="text-[11px]">المسؤول: {data.employeeName}</div>
      )}
      {gold21 > 0 && (
        <div className="text-[11px]">سعر الذهب 21: {formatEgp(gold21)}</div>
      )}

      <div className="mt-1.5 border-t border-dashed border-black/60" />

      <div className="mt-1">
        <div className="flex items-end justify-between gap-2 text-[11px] font-bold">
          <span className="min-w-0 flex-1 truncate">القطعة</span>
          <span className="w-[26px] text-center">كمية</span>
          <span className="w-[44px] text-center">وزن</span>
          <span className="w-[52px] text-end">الإجمالي</span>
        </div>
        {items.length === 0 ? (
          <p className="py-2 text-center text-[11px]">لا توجد بنود</p>
        ) : (
          items.map((i, idx) => {
            const grams = (i.weight ?? 0) * (i.quantity ?? 0)
            const goldUnit = purchasePerGram(gold21, i.karat ?? 21)
            const makingUnit = i.factory ?? 0
            const lineTotal = (goldUnit + makingUnit) * grams
            return (
              <div
                key={idx}
                className="border-t border-dashed border-black/40 py-1 text-[11px]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {i.productName?.trim() || 'قطعة'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {i.karat ?? 21}K
                      {i.typegolde != null &&
                        ` — ${receiptTypeLabels[i.typegolde as number] ?? '—'}`}
                    </p>
                  </div>
                  <span className="w-[26px] text-center">
                    {formatNumber(i.quantity ?? 0)}
                  </span>
                  <span className="w-[44px] text-center">
                    {formatNumber(i.weight ?? 0)} gm
                  </span>
                  <span className="w-[52px] text-end tabular-nums font-semibold">
                    {formatNumber(lineTotal)}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[10px]">
                  <span>ذهب: {formatNumber(goldUnit)}/جم</span>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="mt-1 border-t border-dashed border-black/60 pt-1.5 text-[11px]">
        <div className="flex justify-between">
          <span>عدد القطع</span>
          <span>{formatNumber(pieceCount)}</span>
        </div>
        <div className="flex justify-between">
          <span>الوزن الكلي</span>
          <span>{formatNumber(totalWeight)} gm</span>
        </div>
        {goldSubtotal > 0 && (
          <div className="flex justify-between">
            <span>قيمة الذهب</span>
            <span>{formatEgp(goldSubtotal)}</span>
          </div>
        )}
        {data.discount > 0 && (
          <div className="flex justify-between">
            <span>الخصم</span>
            <span className="text-error">-{formatEgp(data.discount)}</span>
          </div>
        )}
        <div className="mt-1 flex justify-between border-t border-black/20 pt-1 text-[12px] font-bold">
          <span>الإجمالي</span>
          <span>{formatEgp(rounded)}</span>
        </div>
      </div>

      <div className="mt-1.5 border-t border-dashed border-black/60 pt-1.5">
        <div className="mt-0.5 space-y-0.5 text-[11px]">
          <div className="flex justify-between font-bold">
            <span>المدفوع</span>
            <span>{formatEgp(paid)}</span>
          </div>
          {data.hasDebt && (
            <div className="flex justify-between font-bold text-error">
              <span>المديونية المتبقية</span>
              <span>{formatEgp(remaining)}</span>
            </div>
          )}
        </div>
      </div>

      {data.payments && data.payments.length > 0 && (
        <div className="mt-1.5 border-t border-dashed border-black/60 pt-1.5">
          <p className="text-center text-[11px] font-bold">
            سجل عمليات الدفع على الفاتورة
          </p>
          <div className="mt-1 space-y-0.5 text-[11px]">
            {data.payments.map((pm, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2"
              >
                <span>
                  {pm.type === 'sale' ? 'دفع عند البيع' : 'دفعة مديونية'}
                </span>
                <span className="tabular-nums">
                  {formatEgp(Math.round(pm.amount))}
                </span>
                <span className="tabular-nums text-black/60">
                  {formatReceiptDate(pm.date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-2 border-t border-dashed border-black/60 pt-1.5 text-center text-[10px]">
        <p>شكراً لتعاملكم معنا</p>
        <p className="mt-1 text-[10px] font-semibold text-black">
          لا يعتد بها بدون ختم المحل
        </p>
      </div>
    </div>
  )
}
