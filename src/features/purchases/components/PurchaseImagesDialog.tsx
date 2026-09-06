import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileDown, Images } from 'lucide-react'

import {
  downloadPurchaseImagesPdf,
  getPurchaseImages,
} from '@/features/purchases/api'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Skeleton } from '@/shared/components/ui/skeleton'

const KIND_LABEL: Record<number, string> = {
  0: 'فاتورة الشراء',
  1: 'بطاقة العميل',
}

interface Props {
  purchaseId: number | null
  /** صور URL القديمة (للقراءة فقط) تُعرض عند غياب مستندات DB */
  legacyImages?: { label: string; path: string }[]
  onClose: () => void
}

export function PurchaseImagesDialog({ purchaseId, legacyImages = [], onClose }: Props) {
  const activeBranchId = useActiveBranchId()
  const [pdfLoading, setPdfLoading] = useState(false)

  const { data: docs, isLoading } = useQuery({
    queryKey: ['purchase-images', purchaseId, activeBranchId],
    queryFn: () => getPurchaseImages(purchaseId!, activeBranchId ?? undefined),
    enabled: purchaseId != null,
  })

  const hasDbDocs = (docs?.length ?? 0) > 0

  async function handlePdf() {
    if (purchaseId == null) return
    setPdfLoading(true)
    try {
      await downloadPurchaseImagesPdf(purchaseId, activeBranchId ?? undefined)
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <Dialog open={purchaseId != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Images className="size-5" />
            صور الفاتورة #{purchaseId}
          </DialogTitle>
        </DialogHeader>

        {purchaseId == null ? null : isLoading ? (
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        ) : hasDbDocs ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {docs!.map((doc) => (
                <figure
                  key={doc.kindValue}
                  className="overflow-hidden rounded-xl border border-black/10 bg-white"
                >
                  <img
                    src={doc.dataUrl}
                    alt={KIND_LABEL[doc.kindValue] ?? doc.kind}
                    loading="lazy"
                    className="h-64 w-full object-contain bg-black/5"
                  />
                  <figcaption className="flex items-center justify-between p-2 text-[12px]">
                    <span className="font-semibold">
                      {KIND_LABEL[doc.kindValue] ?? doc.kind}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {(doc.sizeBytes / 1024).toFixed(0)}KB
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <Button
              type="button"
              onClick={handlePdf}
              disabled={pdfLoading}
              className="w-full gap-2 rounded-full touch-target"
            >
              <FileDown className="size-4" />
              {pdfLoading ? 'جارٍ تجهيز PDF...' : 'تصدير الصور PDF'}
            </Button>
          </div>
        ) : legacyImages.length > 0 ? (
          <div className="space-y-3">
            <p className="text-[13px] text-muted-foreground">
              صور أرشيفية (URL قديم للقراءة فقط) — الفواتير الجديدة تُخزن مضغوطة في قاعدة البيانات.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {legacyImages.map((img) => {
                const url = img.path.startsWith('http')
                  ? img.path
                  : `${import.meta.env.VITE_API_URL ?? ''}${img.path}`
                return (
                  <figure
                    key={img.path}
                    className="overflow-hidden rounded-xl border border-black/10 bg-white"
                  >
                    <img
                      src={url}
                      alt={img.label}
                      loading="lazy"
                      className="h-64 w-full object-contain bg-black/5"
                    />
                    <figcaption className="p-2 text-[12px] font-semibold">{img.label}</figcaption>
                  </figure>
                )
              })}
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-[14px] text-muted-foreground">
            لا توجد صور مخزنة لهذه الفاتورة.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
