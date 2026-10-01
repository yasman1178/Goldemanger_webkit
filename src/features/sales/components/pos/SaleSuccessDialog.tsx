import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle2, Copy, Printer, Clock } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { getCompanyInfo } from '@/features/purchases/api'
import { getSaleForPrint } from '@/features/sales/api'
import { SaleReceiptView } from '@/features/sales/components/pos/SaleReceiptView'
import { formatNumber } from '@/shared/lib/utils'

export interface SaleSuccessInfo {
  saleId: number
  customerName: string
  total: number
  paid: number
  change: number
  items: number
  grams: number
  stamp: number
  held?: boolean
  grams21?: number
}

interface Props {
  info: SaleSuccessInfo | null
  onClose: () => void
  onNewSale: () => void
}

export function SaleSuccessDialog({ info, onClose, onNewSale }: Props) {
  const [copied, setCopied] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const saleId = info?.saleId ?? 0

  const { data: shop } = useQuery({
    queryKey: ['company-info'],
    queryFn: getCompanyInfo,
    enabled: Boolean(info) && !info?.held,
  })

  const { data: data } = useQuery({
    queryKey: ['sale-print', saleId],
    queryFn: () => getSaleForPrint(saleId),
    enabled: Boolean(info) && !info?.held && saleId > 0,
  })

  if (!info) return null

  const sale = info

  function copyReceipt() {
    const text = [
      sale.held
        ? `فاتورة معلّقة #${sale.saleId}`
        : `فاتورة بيع #${sale.saleId}`,
      `العميل: ${sale.customerName}`,
      `البنود: ${sale.items} • الوزن: ${sale.grams} جم`,
      sale.held ? `المديونية (معادل 21): ${formatNumber(sale.grams21 ?? 0)} جم` : `الإجمالي: ${sale.total}`,
      !sale.held ? `المدفوع: ${sale.paid}` : null,
      !sale.held && data?.hasDebt ? `المديونية المتبقية: ${data.amountOwed}` : null,
    ]
      .filter(Boolean)
      .join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      toast.success('تم نسخ ملخص الفاتورة')
    })
  }

  return (
    <Dialog open={!!info} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm max-h-[92vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <div
            className={
              'mx-auto flex size-16 items-center justify-center rounded-full ' +
              (sale.held ? 'bg-warning/10' : 'bg-success/10')
            }
          >
            {sale.held ? (
              <Clock className="size-9 text-warning" />
            ) : (
              <CheckCircle2 className="size-9 text-success" />
            )}
          </div>
          <DialogTitle className="mt-3 text-[20px]">
            {sale.held ? 'تم تعليق الفاتورة' : 'تم البيع بنجاح'}
          </DialogTitle>
          <DialogDescription>
            {sale.held
              ? `فاتورة معلّقة #${sale.saleId} — القطع محجوزة`
              : `فاتورة رقم #${info.saleId}`}
            {info.customerName ? ` — ${info.customerName}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 sm:p-6 space-y-4">
          {sale.held ? (
            <div className="space-y-2">
              <div className="rounded-xl border-2 border-warning/25 bg-warning/5 p-3">
                <p className="flex items-center gap-2 text-[14px] font-bold text-warning">
                  <Clock className="size-4" />
                  المديونية على العميل بالجرامات
                </p>
                <p className="mt-1 text-[15px] text-foreground">
                  {formatNumber(sale.grams21 ?? 0)} جم{' '}
                  <span className="text-[12px] font-semibold text-muted-foreground">(معادل عيار 21)</span>
                </p>
              </div>
              <p className="rounded-xl bg-black/5 p-3 text-[13px] leading-relaxed text-muted-foreground">
                لن تُخصم القطع من المخزون المتاح حتى يُبت فيها من تبويب «المعلقات» في شاشة البيع —
                تعديل، إتمام، أو إلغاء.
              </p>
            </div>
          ) : data ? (
            <>
              <div className="flex justify-end receipt-no-print">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails((v) => !v)}
                  className="rounded-full text-[12px] font-semibold text-muted-foreground touch-target"
                >
                  {showDetails ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                </Button>
              </div>
              <SaleReceiptView data={data} shop={shop} showDetails={showDetails} />
            </>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              جارٍ تجهيز الفاتورة...
            </p>
          )}

          {!sale.held && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.print()}
                className="h-11 flex-1 gap-2 rounded-full touch-target"
              >
                <Printer className="size-4" />
                طباعة
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={copyReceipt}
                className="h-11 flex-1 rounded-full touch-target"
              >
                <Copy className="size-4" />
                {copied ? 'تم النسخ' : 'مشاركة'}
              </Button>
            </div>
          )}
          <Button
            type="button"
            onClick={onNewSale}
            className="h-12 w-full rounded-full touch-target"
          >
            فاتورة جديدة
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
