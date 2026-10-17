import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Printer, X } from 'lucide-react'

import { getCompanyInfo } from '@/features/purchases/api'
import { getSaleForPrint } from '@/features/sales/api'
import { getKeyValues } from '@/features/settings/api'
import { SaleReceiptView } from '@/features/sales/components/pos/SaleReceiptView'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { Button } from '@/shared/components/ui/button'
import {
  getSaleSnapshot,
  deduceAndFreezeLegacySnapshot,
  type SaleSnapshot,
} from '@/shared/lib/sale-snapshots'
import { useTaxStore } from '@/shared/stores/tax-store'

interface SaleReceiptDialogProps {
  open: boolean
  saleId: number
  onClose: () => void
  onNewSale?: () => void
  successMode?: boolean
}

export function SaleReceiptDialog({
  open,
  saleId,
  onClose,
  onNewSale,
  successMode,
}: SaleReceiptDialogProps) {
  const activeBranchId = useActiveBranchId()

  const { data: shop } = useQuery({
    queryKey: ['company-info'],
    queryFn: getCompanyInfo,
    enabled: open,
  })

  const { data: keyValues } = useQuery({
    queryKey: ['settings-keyvalues'],
    queryFn: getKeyValues,
    enabled: open,
  })

  const { data: data, isLoading } = useQuery({
    queryKey: ['sale-print', saleId, activeBranchId],
    queryFn: () => getSaleForPrint(saleId, activeBranchId ?? undefined),
    enabled: open && saleId > 0,
  })

  const [snapshot, setSnapshot] = useState<SaleSnapshot | null>(null)

  useEffect(() => {
    if (!data?.saleId) return
    let active = true
    void getSaleSnapshot(data.saleId, keyValues).then((res) => {
      if (!active) return
      if (res) {
        setSnapshot(res)
      } else {
        const deduced = deduceAndFreezeLegacySnapshot(data, useTaxStore.getState().stampAndTaxRate)
        setSnapshot(deduced)
      }
    })
    return () => {
      active = false
    }
  }, [data, keyValues])

  // تفاصيل القطعة (المصنعية والضريبة والدمغة) مخفية افتراضياً — تُفتح يدوياً
  // ولا تُطبع إلا وهي ظاهرة، نفس سلوك فاتورة الشراء.
  const [showDetails, setShowDetails] = useState(false)

  if (!open || !data) {
    if (!open) return null
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-xl">
          <p className="text-[15px] font-semibold text-foreground">
            {isLoading ? 'جارٍ تجهيز الفاتورة...' : 'تعذّر تحميل الفاتورة.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3">
      <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between gap-3 receipt-no-print">
          <h2 className="text-[16px] font-bold text-foreground">
            فاتورة بيع #{data.saleId}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails((v) => !v)}
              className="rounded-full text-[12px] font-semibold text-muted-foreground touch-target"
            >
              {showDetails ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
            </Button>
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
        </div>

        <SaleReceiptView data={data} shop={shop} snapshot={snapshot} showDetails={showDetails} />

        <div className="mt-3 flex gap-2 receipt-no-print">
          <Button
            type="button"
            onClick={() => window.print()}
            className="h-11 flex-1 gap-2 rounded-full touch-target"
          >
            <Printer className="size-4" />
            {successMode ? 'طباعة الفاتورة' : 'إعادة طباعة'}
          </Button>
          {onNewSale && (
            <Button
              type="button"
              onClick={onNewSale}
              className="h-11 flex-1 rounded-full touch-target"
            >
              فاتورة جديدة
            </Button>
          )}
          <Button
            type="button"
            variant={onNewSale ? 'outline' : 'ghost'}
            onClick={onClose}
            className="h-11 rounded-full touch-target"
          >
            إغلاق
          </Button>
        </div>
      </div>
    </div>
  )
}
