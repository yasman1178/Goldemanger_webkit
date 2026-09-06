import type { DayCloseSummary } from '@/features/dashboard/types'
import { formatEgp, formatNumber } from '@/shared/lib/utils'

function formatReceiptDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d)
}

interface Props {
  data: DayCloseSummary
}

export function DayCloseReceiptView({ data }: Props) {
  const shopName = data.shopName || 'محل الذهب'
  const address = data.address || ''
  const netDay = data.closingBalance - data.openingBalance

  return (
    <div className="mx-auto receipt-paper receipt-print rounded-sm p-2 shadow-sm">
      <div className="text-center">
        <p className="text-[13px] font-bold">تقرير إغلاق اليوم</p>
        <p className="mt-0.5 text-[12px] font-bold">{shopName}</p>
        {data.branchName && <p className="text-[11px]">{data.branchName}</p>}
        {address && <p className="text-[11px]">{address}</p>}
        {data.commercialRegistration && (
          <p className="text-[11px]">سجل تجاري: {data.commercialRegistration}</p>
        )}
        {data.taxCard && (
          <p className="text-[11px]">سجل ضريبي: {data.taxCard}</p>
        )}
      </div>

      <div className="mt-2 border-t border-dashed border-black/60 pt-1.5" />

      <div className="flex justify-between gap-2 text-[11px]">
        <span>تاريخ الإغلاق:</span>
        <span>{formatReceiptDate(data.date + 'T' + new Date().toTimeString().slice(0, 8))}</span>
      </div>

      <div className="mt-1.5 border-t border-dashed border-black/60" />

      {/* ── ملخص الأرصدة ── */}
      <div className="mt-1.5 space-y-1 text-[11px]">
        <div className="flex justify-between font-bold">
          <span>رصيد أول المدة</span>
          <span className="tabular-nums">{formatEgp(data.openingBalance)}</span>
        </div>

        <div className="mt-1 border-t border-dashed border-black/40 pt-1">
          <p className="mb-1 text-center font-bold">العمليات</p>
          <div className="flex justify-between">
            <span>إجمالي المبيعات ({formatNumber(data.sales.length)} فاتورة)</span>
            <span className="tabular-nums text-success">{formatEgp(data.totalSales)}</span>
          </div>
          <div className="flex justify-between">
            <span>إجمالي المشتريات ({formatNumber(data.purchases.length)} فاتورة)</span>
            <span className="tabular-nums text-error">{formatEgp(data.totalPurchases)}</span>
          </div>
          <div className="flex justify-between">
            <span>إجمالي المصروفات ({formatNumber(data.expenses.length)} عملية)</span>
            <span className="tabular-nums text-error">{formatEgp(data.totalExpenses)}</span>
          </div>
        </div>

        <div className="mt-1 border-t border-dashed border-black/40 pt-1">
          <div className="flex justify-between font-bold">
            <span>صافي اليوم</span>
            <span className={`tabular-nums ${netDay >= 0 ? 'text-success' : 'text-error'}`}>
              {netDay >= 0 ? '+' : ''}{formatEgp(netDay)}
            </span>
          </div>
        </div>

        <div className="mt-1 border-t border-black/20 pt-1 text-[12px] font-bold">
          <div className="flex justify-between">
            <span>رصيد الإغلاق</span>
            <span className="tabular-nums">{formatEgp(data.closingBalance)}</span>
          </div>
        </div>
      </div>

      {/* ── تفاصيل المبيعات ── */}
      {data.sales.length > 0 && (
        <div className="mt-2 border-t border-dashed border-black/60 pt-1.5">
          <p className="mb-1 text-center text-[11px] font-bold">تفاصيل المبيعات</p>
          <div className="flex items-end justify-between gap-2 text-[10px] font-bold">
            <span className="min-w-0 flex-1">الفاتورة</span>
            <span className="w-[36px] text-center">القطع</span>
            <span className="w-[52px] text-end">المبلغ</span>
          </div>
          {data.sales.map((s) => (
            <div
              key={s.saleId}
              className="border-t border-dashed border-black/40 py-0.5 text-[10px]"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1 truncate">
                  <span className="font-semibold">#{s.saleId}</span>
                  <span className="ms-1 text-muted-foreground">
                    {s.customerName?.trim() || 'نقدي'}
                  </span>
                </div>
                <span className="w-[36px] text-center">{formatNumber(s.itemCount)}</span>
                <span className="w-[52px] text-end tabular-nums">
                  {formatEgp(Math.round(s.totalAmount))}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── تفاصيل المشتريات ── */}
      {data.purchases.length > 0 && (
        <div className="mt-2 border-t border-dashed border-black/60 pt-1.5">
          <p className="mb-1 text-center text-[11px] font-bold">تفاصيل المشتريات</p>
          <div className="flex items-end justify-between gap-2 text-[10px] font-bold">
            <span className="min-w-0 flex-1">الفاتورة</span>
            <span className="w-[36px] text-center">القطع</span>
            <span className="w-[52px] text-end">المبلغ</span>
          </div>
          {data.purchases.map((p) => (
            <div
              key={p.id}
              className="border-t border-dashed border-black/40 py-0.5 text-[10px]"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1 truncate">
                  <span className="font-semibold">#{p.id}</span>
                  <span className="ms-1 text-muted-foreground">
                    {p.supplierName?.trim() || 'نقدي'}
                  </span>
                </div>
                <span className="w-[36px] text-center">{formatNumber(p.pieceCount)}</span>
                <span className="w-[52px] text-end tabular-nums">
                  {formatEgp(Math.round(p.totalAmount))}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── تفاصيل المصروفات ── */}
      {data.expenses.length > 0 && (
        <div className="mt-2 border-t border-dashed border-black/60 pt-1.5">
          <p className="mb-1 text-center text-[11px] font-bold">تفاصيل المصروفات</p>
          {data.expenses.map((e) => (
            <div
              key={e.expenseId}
              className="border-t border-dashed border-black/40 py-0.5 text-[10px]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 flex-1 truncate">
                  {e.descraption?.trim() || 'مصروف'}
                </span>
                <span className="tabular-nums">{formatEgp(Math.round(e.amount))}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 border-t border-dashed border-black/60 pt-1.5 text-center text-[10px]">
        <p>شكراً لتعاملكم معنا</p>
        <p className="mt-1 font-semibold text-black">
          لا يعتد بها بدون ختم المحل
        </p>
      </div>
    </div>
  )
}
