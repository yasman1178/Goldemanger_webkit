import { useQuery } from '@tanstack/react-query'
import { Printer, X, FileSpreadsheet, Loader2 } from 'lucide-react'

import { getCompanyInfo } from '@/features/purchases/api'
import { getCashFiltered, getOpeningBalance, getCurrentCash } from '@/features/cash/api'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { useAuthStore } from '@/shared/stores/auth-store'
import { Button } from '@/shared/components/ui/button'
import { CashDayStatementPrint } from './CashDayStatementPrint'

interface CashDayStatementDialogProps {
  open: boolean
  onClose: () => void
  date?: string
}

export function CashDayStatementDialog({
  open,
  onClose,
  date,
}: CashDayStatementDialogProps) {
  const activeBranchId = useActiveBranchId()
  const user = useAuthStore((s) => s.user)
  const branchDetails = useAuthStore((s) => s.branchDetails)

  const selectedDate = date || new Date().toISOString().slice(0, 10)

  const { data: shop } = useQuery({
    queryKey: ['company-info'],
    queryFn: getCompanyInfo,
    enabled: open,
  })

  const { data: openingBalance = 0, isLoading: openingLoading } = useQuery({
    queryKey: ['cash-opening-balance', selectedDate, activeBranchId],
    queryFn: () => getOpeningBalance(selectedDate, activeBranchId ?? undefined),
    enabled: open && !!activeBranchId,
  })

  const { data: records = [], isLoading: recordsLoading } = useQuery({
    queryKey: ['cash-filtered-all', selectedDate, activeBranchId],
    queryFn: () =>
      getCashFiltered({
        date: selectedDate,
        branchId: activeBranchId ?? undefined,
      }),
    enabled: open && !!activeBranchId,
  })

  const { data: currentCash } = useQuery({
    queryKey: ['cash-current', activeBranchId],
    queryFn: () => getCurrentCash(activeBranchId ?? undefined),
    enabled: open && !!activeBranchId,
  })

  const isLoading = openingLoading || recordsLoading

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between gap-3 receipt-no-print">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileSpreadsheet className="size-5" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-foreground">
                كشف حركة الخزينة اليومي
              </h2>
              <p className="text-[12px] text-muted-foreground">{selectedDate}</p>
            </div>
          </div>

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

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-[14px] font-semibold text-foreground">
              جارٍ إعداد كشف حركة الخزينة...
            </p>
          </div>
        ) : (
          <CashDayStatementPrint
            date={selectedDate}
            openingBalance={openingBalance}
            records={records}
            shop={shop}
            currentBalance={currentCash?.amount}
            branchName={branchDetails?.branchName}
            employeeName={user?.userName}
          />
        )}

        <div className="mt-4 flex gap-2 receipt-no-print">
          <Button
            type="button"
            onClick={() => window.print()}
            disabled={isLoading}
            className="h-11 flex-1 gap-2 rounded-full font-bold touch-target shadow-xs"
          >
            <Printer className="size-4" />
            طباعة الكشف (80مم)
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-11 rounded-full px-5 font-semibold touch-target"
          >
            إغلاق
          </Button>
        </div>
      </div>
    </div>
  )
}
