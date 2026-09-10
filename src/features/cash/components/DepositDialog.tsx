import { useState } from 'react'
import { ArrowDownLeft } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

export interface BranchOption {
  branchId: number
  branchName: string
}

const QUICK_AMOUNTS = [5000, 10000, 25000, 50000]

export function DepositDialog({
  open,
  onOpenChange,
  submitting,
  onSubmit,
  branches,
  defaultBranchId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  submitting: boolean
  onSubmit: (amount: number, branchId?: number) => void
  branches?: BranchOption[]
  defaultBranchId?: number | null
}) {
  const [amount, setAmount] = useState('')
  const [branchId, setBranchId] = useState<string>(
    defaultBranchId != null ? String(defaultBranchId) : '',
  )

  const showBranchPicker = branches && branches.length > 1

  function reset() {
    setAmount('')
    setBranchId(defaultBranchId != null ? String(defaultBranchId) : '')
  }

  function handleOpenChange(next: boolean) {
    if (!next && !submitting) reset()
    onOpenChange(next)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) return
    const selectedBranch = branchId ? Number(branchId) : undefined
    onSubmit(value, selectedBranch)
  }

  const disabled = submitting || !(Number(amount) > 0)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex size-9 items-center justify-center rounded-[12px] bg-emerald-500/15 text-emerald-600">
              <ArrowDownLeft className="size-5" />
            </div>
            <DialogTitle>إيداع رصيد في الخزينة</DialogTitle>
          </div>
          <DialogDescription>
            إضافة سيولة نقدية فورية إلى الخزينة لتغطية مدفوعات شراء الذهب والعمليات اليومية.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 space-y-4">
            {showBranchPicker && (
              <div className="space-y-1.5">
                <label
                  htmlFor="deposit-branch"
                  className="text-[13px] font-semibold leading-[1.35] text-foreground"
                >
                  الفرع المستفيد
                </label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger
                    id="deposit-branch"
                    className="h-11 w-full rounded-[14px] touch-target focus:border-emerald-500 focus:ring-emerald-500/20"
                  >
                    <SelectValue placeholder="اختر الفرع" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.branchId} value={String(b.branchId)}>
                        {b.branchName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="deposit-amount"
                className="text-[13px] font-semibold leading-[1.35] text-foreground"
              >
                المبلغ المراد إيداعه (ج.م)
              </label>
              <div className="relative">
                <Input
                  id="deposit-amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  autoFocus
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-13 pe-12 text-end text-[22px] font-bold tabular-nums rounded-[14px] touch-target focus:border-emerald-500 focus:ring-emerald-500/20"
                />
                <span className="absolute start-4 top-1/2 -translate-y-1/2 text-[13px] font-bold text-muted-foreground">
                  ج.م
                </span>
              </div>

              {/* Quick Amount Suggestion Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-muted-foreground me-1">مبالغ سريعة:</span>
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(String(amt))}
                    className="rounded-[10px] border border-black/5 bg-slate-100/80 px-2.5 py-1 text-[11.5px] font-bold text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                  >
                    +{amt.toLocaleString('ar-EG')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="h-11 rounded-[14px] px-5 font-bold touch-target"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={disabled}
              className="h-11 rounded-[14px] bg-emerald-600 hover:bg-emerald-700 text-white px-6 font-bold shadow-sm touch-target gap-2"
            >
              <ArrowDownLeft className="size-4" />
              {submitting ? 'جارٍ تأكيد الإيداع...' : 'تأكيد الإيداع'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
