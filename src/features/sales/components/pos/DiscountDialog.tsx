import { useState } from 'react'
import { Tag } from 'lucide-react'
import { Label } from '@/shared/components/ui/label'
import { cn } from '@/shared/lib/utils'
import { formatNumber } from '@/shared/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { FormatEg } from './Money'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  maxMaking: number
  discount: number
  onApply: (amount: number) => void
  onClear: () => void
}

export function DiscountDialog({
  open,
  onOpenChange,
  maxMaking,
  discount,
  onApply,
  onClear,
}: Props) {
  const [value, setValue] = useState('')

  const entered = Number(value) || 0
  const valid = entered > 0 && entered <= maxMaking

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>خصم الفاتورة</DialogTitle>
          <DialogDescription>
            الخصم يُحسم من إجمالي المصنعية ({formatNumber(maxMaking)} ج.م)
          </DialogDescription>
        </DialogHeader>

        {discount > 0 && (
          <button
            type="button"
            onClick={() => {
              onClear()
              onOpenChange(false)
            }}
            className="flex h-12 w-full touch-target items-center justify-between rounded-[14px] border border-black/10 bg-success/10 px-4 text-[15px] text-success"
          >
            <span>الخصم الحالي: <FormatEg value={discount} /> ج.م — إزالته</span>
            <span className="text-[13px] underline">إزالة</span>
          </button>
        )}

        <div className="space-y-2 rounded-2xl border-2 border-primary/30 bg-primary/5 p-3 shadow-[0_8px_24px_rgba(37,99,235,0.12)]">
          <Label
            htmlFor="discount"
            className="flex items-center gap-2 text-[15px] font-bold text-primary"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-white">
              <Tag className="size-4" />
            </span>
            قيمة الخصم
          </Label>
          <input
            id="discount"
            type="number"
            min="0"
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0.00"
            autoFocus
            className={cn(
              'h-14 w-full touch-target rounded-xl border-2 bg-white px-4 text-[22px] font-bold tabular-nums text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-4 focus-visible:ring-primary/25',
              valid ? 'border-primary shadow-[0_0_0_3px_rgba(37,99,235,0.12)]' : 'border-primary/40',
            )}
          />
          {!valid && entered > 0 && (
            <p className="text-[13px] text-error">
              الخصم لا يتجاوز إجمالي المصنعية ({formatNumber(maxMaking)} ج.م)
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 rounded-full px-6 touch-target"
          >
            إلغاء
          </Button>
          <Button
            type="button"
            disabled={!valid}
            onClick={() => {
              onApply(entered)
              onOpenChange(false)
            }}
            className="h-11 rounded-full px-6 touch-target"
          >
            تطبيق الخصم
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}