import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Images, Printer, X } from 'lucide-react'

import { getCompanyInfo } from '@/features/purchases/api'
import { PurchaseImagesDialog } from '@/features/purchases/components/PurchaseImagesDialog'
import type { Purchase } from '@/features/purchases/types'
import { purchasePerGram, TAX_AND_STAMP_RATE } from '@/shared/lib/gold'
import { formatEgp, formatNumber } from '@/shared/lib/utils'
import { getOverview } from '@/features/settings/api'
import { Button } from '@/shared/components/ui/button'

const receiptTypeLabels: Record<number, string> = {
  1: 'جديد',
  2: 'مجدّد',
  3: 'كسر',
  4: 'فضة',
}

export interface ReceiptParty {
  name?: string | null
  phone?: string | null
}

export interface PurchaseReceiptDialogProps {
  open?: boolean
  purchase: Purchase | null
  party?: ReceiptParty | null
  isCustomer?: boolean
  onClose: () => void
}

function formatReceiptDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d)
}

export function PurchaseReceiptDialog({
  open,
  purchase,
  party,
  isCustomer = false,
  onClose,
}: PurchaseReceiptDialogProps) {
  const { data: shop } = useQuery({
    queryKey: ['company-info'],
    queryFn: getCompanyInfo,
    enabled: open,
  })
  const { data: overview } = useQuery({
    queryKey: ['settings-overview'],
    queryFn: getOverview,
    enabled: open && isCustomer,
    staleTime: 5 * 60 * 1000,
  })
  const [imagesOpen, setImagesOpen] = useState(false)

  if (!open || !purchase) return null

  const shopName = shop?.name?.trim() || 'محل الذهب'
  const address = [
    shop?.location?.trim(),
    [shop?.city?.trim(), shop?.station?.trim()].filter(Boolean).join(' — '),
  ]
    .filter(Boolean)
    .join('، ')

  const gold21 = purchase.goldPrice21AtPurchase ?? 0
  const pieces = purchase.productsDot ?? []

  const totalWeight = pieces.reduce(
    (sum, p) => sum + (p.weight ?? 0) * (p.quantity ?? 1),
    0,
  )
  const pieceCount = pieces.reduce(
    (sum, p) => sum + (p.quantity ?? 0),
    0,
  )
  const goldSubtotal = pieces.reduce((sum, p) => {
    const weight = p.weight ?? 0
    const quantity = p.quantity ?? 1
    return sum + purchasePerGram(gold21, p.karat ?? 21) * weight * quantity
  }, 0)

  const commissionRate = isCustomer
    ? (overview?.branches?.find((b) => b.branchId === purchase.branchId)?.buyFromCustomerCommission ?? 0)
    : 0
  const commissionSubtotal = isCustomer ? goldSubtotal * commissionRate : 0

  const computedTotal = pieces.reduce((sum, p) => {
    const weight = p.weight ?? 0
    const quantity = p.quantity ?? 1
    const metal = purchasePerGram(gold21, p.karat ?? 21) * weight * quantity
    const unit =
      purchasePerGram(gold21, p.karat ?? 21) + (p.factory ?? 0)
    const taxAndStamp = isCustomer ? 0 : metal * TAX_AND_STAMP_RATE
    return sum + unit * weight * quantity + taxAndStamp
  }, 0)
  const computedTotalNet = isCustomer
    ? Math.round(computedTotal - commissionSubtotal)
    : Math.round(computedTotal)

  const factorySubtotal = pieces.reduce((sum, p) => {
    const weight = p.weight ?? 0
    const quantity = p.quantity ?? 1
    return sum + (p.factory ?? 0) * weight * quantity
  }, 0)

  const stampAndTaxSubtotal = isCustomer ? 0 : goldSubtotal * TAX_AND_STAMP_RATE

  const saleValueSubtotal = pieces.reduce((sum, p) => {
    const weight = p.weight ?? 0
    const quantity = p.quantity ?? 1
    const metal = purchasePerGram(gold21, p.karat ?? 21) * weight * quantity
    const taxAndStamp = metal * 0.01
    const making =
      (p.factoryForSale ?? p.factory ?? 0) * weight * quantity
    return sum + metal + taxAndStamp + making
  }, 0)

  const total = purchase.totalAmount > 0 ? purchase.totalAmount : computedTotalNet

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3">
      <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between gap-3 receipt-no-print">
          <h2 className="text-[16px] font-bold text-foreground">
            معاينة فاتورة الكاشير
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="إغلاق"
            className="size-9 rounded-full touch-target"
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="mx-auto receipt-paper receipt-print rounded-sm p-2 shadow-sm">
          <div className="text-center">
            {shop?.logoPath && (
              <img
                src={shop.logoPath}
                alt=""
                className="mx-auto mb-1 max-h-10 object-contain"
              />
            )}
            <p className="text-[13px] font-bold">فاتورة شراء</p>
            <p className="mt-0.5 text-[12px] font-bold">{shopName}</p>
            {shop?.branchName && <p>{shop.branchName}</p>}
            {address && <p>{address}</p>}
            {shop?.commercialRegistrationNumber && (
              <p>سجل تجاري: {shop.commercialRegistrationNumber}</p>
            )}
            {shop?.taxCardNumber && (
              <p>سجل ضريبي: {shop.taxCardNumber}</p>
            )}
          </div>

          <div className="mt-2 border-t border-dashed border-black/60 pt-1.5" />

          <div className="flex justify-between gap-2 text-[11px]">
            <span>رقم الفاتورة: #{purchase.id}</span>
            <span>{formatReceiptDate(purchase.date)}</span>
          </div>
          <div className="text-[11px]">
            {party?.name || purchase.supplierName ? (
              <>
                <span className="font-semibold">
                  {party?.name ?? purchase.supplierName}
                </span>
                {party?.phone && <span> — {party.phone}</span>}
              </>
            ) : (
              'شراء نقدي'
            )}
          </div>
          {purchase.goldPrice21AtPurchase != null && (
            <div className="text-[11px]">
              سعر الذهب 21: {formatEgp(purchase.goldPrice21AtPurchase)}
            </div>
          )}
          {purchase.userName && purchase.userName !== 'N/A' && (
            <div className="text-[11px]">
              المسؤول: {purchase.userName}
            </div>
          )}

          <div className="mt-1.5 border-t border-dashed border-black/60" />

          <div className="mt-1">
            <div className="flex items-end justify-between gap-2 text-[11px] font-bold">
              <span className="min-w-0 flex-1 truncate">القطعة</span>
              <span className="w-[26px] text-center">كمية</span>
              <span className="w-[44px] text-center">وزن</span>
              <span className="w-[52px] text-end">الإجمالي</span>
            </div>
            {pieces.length === 0 ? (
              <p className="py-2 text-center text-[11px]">
                لا توجد بنود مفصّلة
              </p>
            ) : (
              pieces.map((p, i) => {
                const weight = p.weight ?? 0
                const quantity = p.quantity ?? 1
                const goldUnit = purchasePerGram(gold21, p.karat ?? 21)
                const factory = p.factory ?? 0
                const unit = goldUnit + factory
                const lineTotal = unit * weight * quantity
                return (
                  <div
                    key={i}
                    className="border-t border-dashed border-black/40 py-1 text-[11px]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{p.productName || 'قطعة'}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {p.karat ?? 21}K — {receiptTypeLabels[p.typegolde ?? 0] ?? '—'}
                        </p>
                      </div>
                      <span className="w-[26px] text-center">{formatNumber(quantity)}</span>
                      <span className="w-[44px] text-center">{formatNumber(weight)} gm</span>
                      <span className="w-[52px] text-end tabular-nums font-semibold">
                        {formatNumber(lineTotal)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px]">
                      <span>ذهب: {formatNumber(goldUnit)}/جم</span>
                      {factory > 0 && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">
                          مصنعية المورد: {formatNumber(factory)}/جم
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px]">
                      {!isCustomer && (
                        <span className="rounded bg-black/5 px-1.5 py-0.5 font-semibold">
                          دمغة وضريبة: +{(goldUnit * TAX_AND_STAMP_RATE).toLocaleString('ar-EG', { maximumFractionDigits: 0 })}/جم
                        </span>
                      )}
                      {isCustomer && commissionRate > 0 && (
                        <span className="rounded bg-error/10 px-1.5 py-0.5 font-semibold text-error">
                          عمولة شراء من عميل: −{(goldUnit * commissionRate).toLocaleString('ar-EG', { maximumFractionDigits: 0 })}/جم ({(commissionRate * 100).toFixed(2)}%)
                        </span>
                      )}
                      <span className="rounded bg-success/10 px-1.5 py-0.5 font-semibold text-success">
                        مصنعية المحل: {formatNumber(p.factoryForSale ?? 0)}/جم
                      </span>
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
            {factorySubtotal > 0 && (
              <div className="flex justify-between text-primary font-semibold">
                <span>مصنعية المورد</span>
                <span>{formatEgp(factorySubtotal)}</span>
              </div>
            )}
            {!isCustomer && stampAndTaxSubtotal > 0 && (
              <div className="flex justify-between">
                <span>دمغة وضريبة (1%)</span>
                <span>{formatEgp(Math.round(stampAndTaxSubtotal))}</span>
              </div>
            )}
            {isCustomer && commissionSubtotal > 0 && (
              <div className="flex justify-between">
                <span>
                  عمولة الشراء من عميل ({(commissionRate * 100).toFixed(2)}%)
                </span>
                <span>−{formatEgp(Math.round(commissionSubtotal))}</span>
              </div>
            )}
            {saleValueSubtotal > 0 && (
              <div className="flex justify-between border-t border-dashed border-black/40 pt-1">
                <span>قيمة البيع المتوقعة (شامل الدمغة والضريبة والمصنعية)</span>
                <span className="font-semibold tabular-nums">
                  {formatEgp(Math.round(saleValueSubtotal))}
                </span>
              </div>
            )}
            <div className="mt-1 flex justify-between border-t border-black/20 pt-1 text-[12px] font-bold">
              <span>الإجمالي</span>
              <span>{formatEgp(total)}</span>
            </div>
          </div>

          <div className="mt-2 border-t border-dashed border-black/60 pt-1.5 text-center text-[10px]">
            <p>شكراً لتعاملكم معنا</p>
          </div>
        </div>

        {(purchase.hasDocuments ||
          (purchase.documentsCount ?? 0) > 0 ||
          purchase.image ||
          purchase.idCardImage) && (
          <div className="mt-3 receipt-no-print">
            <Button
              type="button"
              variant="outline"
              onClick={() => setImagesOpen(true)}
              className="w-full gap-2 rounded-full touch-target"
            >
              <Images className="size-4" />
              عرض الصور
              {(purchase.documentsCount ?? 0) > 0 && (
                <span className="tabular-nums">({purchase.documentsCount})</span>
              )}
            </Button>
          </div>
        )}

        <div className="mt-3 flex gap-2 receipt-no-print">
          <Button
            type="button"
            onClick={() => window.print()}
            className="h-11 flex-1 gap-2 rounded-full touch-target"
          >
            <Printer className="size-4" />
            طباعة الفاتورة
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-11 flex-1 rounded-full touch-target"
          >
            إغلاق
          </Button>
        </div>
      </div>

      {imagesOpen && purchase && (
        <PurchaseImagesDialog
          purchaseId={purchase.id}
          legacyImages={(() => {
            const arr: { label: string; path: string }[] = []
            if (purchase.image) arr.push({ label: 'فاتورة الشراء', path: purchase.image })
            if (purchase.idCardImage) arr.push({ label: 'بطاقة العميل', path: purchase.idCardImage })
            return arr
          })()}
          onClose={() => setImagesOpen(false)}
        />
      )}
    </div>
  )
}