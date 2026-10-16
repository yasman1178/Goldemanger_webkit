import { useMemo } from 'react'
import type { CompanyInfo } from '@/features/purchases/types'
import {
  transactionLabels,
  type CashRecord,
} from '@/shared/types/api'
import { formatEgp, formatNumber } from '@/shared/lib/utils'

function formatReceiptDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d)
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('ar-EG', {
    timeStyle: 'short',
  }).format(d)
}

interface Props {
  date: string
  openingBalance: number
  records: CashRecord[]
  shop?: CompanyInfo | null
  currentBalance?: number
  branchName?: string
  employeeName?: string
}

interface ComputedStatement {
  rows: Array<{
    record: CashRecord
    delta: number
    balanceAfter: number
  }>
  totalIn: number
  totalOut: number
  netDay: number
  finalBalance: number
}

function computeDayStatementRows(
  records: CashRecord[],
  openingBalance: number,
  currentBalance?: number,
): ComputedStatement {
  const sorted = [...records].sort(
    (a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime(),
  )

  let running = openingBalance
  let inSum = 0
  let outSum = 0

  const computedRows = sorted.map((r, index) => {
    const prevAmount = index === 0 ? openingBalance : sorted[index - 1].amount
    let delta = r.amount - prevAmount

    if (delta === 0) {
      if (
        ['Sale', 'Deposit', 'AmountOwed', 'EmployeeRepayment', 'PurchaseRefund'].includes(
          r.transactionType,
        )
      ) {
        delta = r.paidAmount ?? r.amountOwed ?? 0
      } else if (
        ['Purchase', 'Expense', 'Withdrawal', 'EmployeeAdvance'].includes(r.transactionType)
      ) {
        delta = -(r.paidAmount ?? 0)
      }
    }

    if (delta >= 0) {
      inSum += delta
    } else {
      outSum += Math.abs(delta)
    }
    running += delta

    return {
      record: r,
      delta,
      balanceAfter: r.amount || running,
    }
  })

  const net = inSum - outSum
  const final = currentBalance != null ? currentBalance : openingBalance + net

  return {
    rows: computedRows,
    totalIn: inSum,
    totalOut: outSum,
    netDay: net,
    finalBalance: final,
  }
}

export function CashDayStatementPrint({
  date,
  openingBalance,
  records,
  shop,
  currentBalance,
  branchName,
  employeeName,
}: Props) {
  const shopName = shop?.name?.trim() || 'محل الذهب'
  const address = [
    shop?.location?.trim(),
    [shop?.city?.trim(), shop?.station?.trim()].filter(Boolean).join(' — '),
  ]
    .filter(Boolean)
    .join('، ')

  const { rows, totalIn, totalOut, netDay, finalBalance } = useMemo(
    () => computeDayStatementRows(records, openingBalance, currentBalance),
    [records, openingBalance, currentBalance],
  )

  return (
    <div className="mx-auto receipt-paper receipt-print rounded-sm p-2 shadow-sm text-foreground">
      {/* ── الترويسة ── */}
      <div className="text-center">
        {shop?.logoPath && (
          <img
            src={shop.logoPath}
            alt=""
            className="mx-auto mb-1 max-h-10 object-contain"
          />
        )}
        <p className="text-[13px] font-bold">كشف حركة الخزينة اليومي</p>
        <p className="mt-0.5 text-[12px] font-bold">{shopName}</p>
        {(branchName || shop?.branchName) && (
          <p className="text-[11px]">{branchName || shop?.branchName}</p>
        )}
        {address && <p className="text-[10px] text-muted-foreground">{address}</p>}
        {shop?.commercialRegistrationNumber && (
          <p className="text-[10px]">س.ت: {shop.commercialRegistrationNumber}</p>
        )}
        {shop?.taxCardNumber && (
          <p className="text-[10px]">ب.ض: {shop.taxCardNumber}</p>
        )}
      </div>

      <div className="mt-2 border-t border-dashed border-black/60 pt-1.5" />

      {/* ── بيانات اليوم والكاشير ── */}
      <div className="flex justify-between gap-2 text-[11px]">
        <span>تاريخ اليوم:</span>
        <span className="font-semibold">{date || formatReceiptDate(new Date().toISOString())}</span>
      </div>
      <div className="flex justify-between gap-2 text-[11px]">
        <span>وقت الطباعة:</span>
        <span className="tabular-nums">{formatReceiptDate(new Date().toISOString())}</span>
      </div>
      {employeeName && (
        <div className="text-[11px]">
          <span>المسؤول: </span>
          <span className="font-semibold">{employeeName}</span>
        </div>
      )}

      <div className="mt-1.5 border-t border-dashed border-black/60" />

      {/* ── ملخص الأرصدة والسيولة ── */}
      <div className="mt-1.5 space-y-1 text-[11px]">
        <div className="flex justify-between font-bold">
          <span>رصيد أول المدة (الافتتاحي)</span>
          <span className="tabular-nums">{formatEgp(openingBalance)}</span>
        </div>

        <div className="mt-1 border-t border-dashed border-black/40 pt-1 space-y-0.5">
          <div className="flex justify-between">
            <span>إجمالي المقبوضات (الوارد)</span>
            <span className="tabular-nums font-bold text-success">
              +{formatEgp(totalIn)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>إجمالي المدفوعات (المنصرف)</span>
            <span className="tabular-nums font-bold text-error">
              -{formatEgp(totalOut)}
            </span>
          </div>
          <div className="flex justify-between font-bold">
            <span>صافي حركة اليوم</span>
            <span
              className={`tabular-nums ${netDay >= 0 ? 'text-success' : 'text-error'}`}
            >
              {netDay >= 0 ? '+' : ''}{formatEgp(netDay)}
            </span>
          </div>
        </div>

        <div className="mt-1.5 border-t border-black/40 pt-1 text-[12px] font-bold">
          <div className="flex justify-between">
            <span>الرصيد الدفتري الحالي</span>
            <span className="tabular-nums text-foreground">
              {formatEgp(finalBalance)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 border-t border-dashed border-black/60 pt-1.5" />

      {/* ── جدول الحركات التفصيلي ── */}
      <div className="mt-1">
        <div className="flex items-center justify-between gap-1 text-[10.5px] font-bold pb-1 border-b border-black/40">
          <span className="w-12">الوقت</span>
          <span className="flex-1 min-w-0">العملية / البيان</span>
          <span className="w-14 text-end">المبلغ</span>
          <span className="w-16 text-end">الرصيد</span>
        </div>

        {rows.length === 0 ? (
          <p className="py-3 text-center text-[11px] text-muted-foreground">
            لا توجد حركات مسجلة في هذا اليوم
          </p>
        ) : (
          rows.map(({ record: r, delta, balanceAfter }, idx) => {
            const isPositive = delta >= 0
            const typeLabel = transactionLabels[r.transactionType] ?? r.transactionType
            const refText = r.description
              ? r.description
              : r.saleId
                ? `فاتورة بيع #${r.saleId}`
                : r.purchaseId
                  ? `فاتورة شراء #${r.purchaseId}`
                  : r.expenseId
                    ? `إيصال مصروف #${r.expenseId}`
                    : typeLabel

            return (
              <div
                key={idx}
                className="border-b border-dashed border-black/30 py-1 text-[10px]"
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="w-12 tabular-nums text-muted-foreground shrink-0">
                    {formatTime(r.transactionDate)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold">{refText}</p>
                    <p className="text-[9px] text-muted-foreground">
                      {typeLabel}
                      {r.userName ? ` • ${r.userName}` : ''}
                    </p>
                  </div>
                  <span
                    className={`w-14 text-end tabular-nums font-bold shrink-0 ${
                      isPositive ? 'text-success' : 'text-error'
                    }`}
                  >
                    {isPositive ? '+' : '-'}{formatEgp(Math.abs(delta))}
                  </span>
                  <span className="w-16 text-end tabular-nums font-semibold shrink-0">
                    {formatEgp(balanceAfter)}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── إجمالي عدد العمليات ── */}
      <div className="mt-2 border-t border-dashed border-black/60 pt-1.5 text-[10.5px]">
        <div className="flex justify-between">
          <span>إجمالي عدد العمليات:</span>
          <span className="font-bold tabular-nums">{formatNumber(rows.length)} حركة</span>
        </div>
      </div>

      <div className="mt-2 border-t border-dashed border-black/60 pt-1.5 text-center text-[10px]">
        <p>جولد ماستر — كشف حركة الخزينة الرسمي</p>
        <p className="mt-0.5 font-semibold text-black">
          يعتمد بإمضاء المسؤول وختم الفرع
        </p>
      </div>
    </div>
  )
}
