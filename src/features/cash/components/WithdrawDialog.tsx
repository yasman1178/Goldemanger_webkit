import { useState } from 'react'
import { Minus } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import type { BranchOption } from './DepositDialog'

export function WithdrawDialog({
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>سحب رصيد</DialogTitle>
          <DialogDescription>
            اسحب مبلغاً نقدياً من الخزينة. تأكد من أن الرصيد كافٍ.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {showBranchPicker && (
            <div className="space-y-1.5">
              <label
                htmlFor="withdraw-branch"
                className="text-[13px] font-semibold leading-[1.35] text-foreground"
              >
                الفرع
              </label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger
                  id="withdraw-branch"
                  className="h-11 w-full rounded-[14px] touch-target"
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
          <div className="space-y-1.5">
            <label
              htmlFor="withdraw-amount"
              className="text-[13px] font-semibold leading-[1.35] text-foreground"
            >
              المبلغ بالجنيه
            </label>
            <Input
              id="withdraw-amount"
              inputMode="decimal"
              placeholder="0.00"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-end text-[20px] font-bold tabular-nums touch-target"
            />
          </div>
          <Button
            type="submit"
            disabled={disabled}
            variant="destructive"
            className="h-11 w-full gap-2 rounded-full touch-target"
          >
            <Minus className="size-4" />
            {submitting ? 'جارٍ السحب...' : 'سحب'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
