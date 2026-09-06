import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle2, Copy, Printer } from 'lucide-react'

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

export interface SaleSuccessInfo {
  saleId: number
  customerName: string
  total: number
  paid: number
  change: number
  items: number
  grams: number
  stamp: number
}

interface Props {
  info: SaleSuccessInfo | null
  onClose: () => void
  onNewSale: () => void
}

export function SaleSuccessDialog({ info, onClose, onNewSale }: Props) {
  const [copied, setCopied] = useState(false)

  const saleId = info?.saleId ?? 0

  const { data: shop } = useQuery({
    queryKey: ['company-info'],
    queryFn: getCompanyInfo,
    enabled: Boolean(info),
  })

  const { data: data } = useQuery({
    queryKey: ['sale-print', saleId],
    queryFn: () => getSaleForPrint(saleId),
    enabled: Boolean(info) && saleId > 0,
  })

  if (!info) return null

  const sale = info

  function copyReceipt() {
    const text = [
      `فاتورة بيع #${sale.saleId}`,
      `العميل: ${sale.customerName}`,
      `البنود: ${sale.items} • الوزن: ${sale.grams} جم`,
      `الإجمالي: ${sale.total}`,
      `المدفوع: ${sale.paid}`,
      data?.hasDebt ? `المديونية المتبقية: ${data.amountOwed}` : null,
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
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="size-9 text-success" />
          </div>
          <DialogTitle className="mt-3 text-[20px]">
            تم البيع بنجاح
          </DialogTitle>
          <DialogDescription>
            فاتورة رقم #{info.saleId}
            {info.customerName ? ` — ${info.customerName}` : ''}
          </DialogDescription>
        </DialogHeader>

        {data ? (
          <SaleReceiptView data={data} shop={shop} />
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            جارٍ تجهيز الفاتورة...
          </p>
        )}

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
        <Button
          type="button"
          onClick={onNewSale}
          className="h-12 w-full rounded-full touch-target"
        >
          فاتورة جديدة
        </Button>
      </DialogContent>
    </Dialog>
  )
}
