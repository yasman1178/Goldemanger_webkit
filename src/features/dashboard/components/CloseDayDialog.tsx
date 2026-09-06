import { Printer, X } from 'lucide-react'

import type { DayCloseSummary } from '@/features/dashboard/types'
import { Button } from '@/shared/components/ui/button'
import { DayCloseReceiptView } from './DayCloseReceiptView'

interface CloseDayDialogProps {
  open: boolean
  summary: DayCloseSummary | null
  onClose: () => void
}

export function CloseDayDialog({ open, summary, onClose }: CloseDayDialogProps) {
  if (!open || !summary) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3">
      <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between gap-3 receipt-no-print">
          <h2 className="text-[16px] font-bold text-foreground">
            تقرير إغلاق اليوم
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

        <DayCloseReceiptView data={summary} />

        <div className="mt-3 flex gap-2 receipt-no-print">
          <Button
            type="button"
            onClick={() => window.print()}
            className="h-11 flex-1 gap-2 rounded-full touch-target"
          >
            <Printer className="size-4" />
            طباعة التقرير
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
    </div>
  )
}
