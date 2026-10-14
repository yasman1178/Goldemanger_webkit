import { useMemo, useState } from 'react'
import { Scale, RotateCcw, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { cn, formatNumber } from '@/shared/lib/utils'

export interface WeightRange {
  min: number | null
  max: number | null
}

interface ProductWeightItem {
  weight?: number
  storageId?: number | null
  quantity?: number
  isActive?: boolean
}

interface WeightFilterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  range: WeightRange
  onApply: (range: WeightRange) => void
  items?: ProductWeightItem[]
  currentStorageId?: string
  storageName?: string
  maxAvailableWeight?: number
}

const PRESET_RANGES: { label: string; min: number; max: number | null }[] = [
  { label: 'أقل من 2 جم', min: 0, max: 2 },
  { label: 'من 2 إلى 5 جم', min: 2, max: 5 },
  { label: 'من 5 إلى 10 جم', min: 5, max: 10 },
  { label: 'من 10 إلى 20 جم', min: 10, max: 20 },
  { label: 'أكثر من 20 جم', min: 20, max: null },
]

export function WeightFilterDialog({
  open,
  onOpenChange,
  range,
  onApply,
  items = [],
  currentStorageId = 'all',
  storageName = 'كل المخازن',
  maxAvailableWeight = 50,
}: WeightFilterDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <WeightFilterForm
          onOpenChange={onOpenChange}
          range={range}
          onApply={onApply}
          items={items}
          currentStorageId={currentStorageId}
          storageName={storageName}
          maxAvailableWeight={maxAvailableWeight}
        />
      )}
    </Dialog>
  )
}

function WeightFilterForm({
  onOpenChange,
  range,
  onApply,
  items = [],
  currentStorageId = 'all',
  storageName = 'كل المخازن',
  maxAvailableWeight = 50,
}: Omit<WeightFilterDialogProps, 'open'>) {
  const [minVal, setMinVal] = useState<string>(
    range.min != null ? String(range.min) : '',
  )
  const [maxVal, setMaxVal] = useState<string>(
    range.max != null ? String(range.max) : '',
  )

  const parsedMin =
    minVal.trim() !== '' && !isNaN(Number(minVal)) ? Number(minVal) : null
  const parsedMax =
    maxVal.trim() !== '' && !isNaN(Number(maxVal)) ? Number(maxVal) : null

  // Calculate matching items count in real-time
  const matchCount = useMemo(() => {
    if (!items.length) return 0
    return items.filter((item) => {
      if (item.isActive === false) return false
      if ((item.quantity ?? 0) <= 0) return false
      if (
        currentStorageId !== 'all' &&
        item.storageId != null &&
        String(item.storageId) !== currentStorageId
      ) {
        return false
      }
      const w = item.weight ?? 0
      if (parsedMin != null && w < parsedMin) return false
      if (parsedMax != null && w > parsedMax) return false
      return true
    }).length
  }, [items, currentStorageId, parsedMin, parsedMax])

  const sliderMax = Math.max(50, Math.ceil(maxAvailableWeight / 10) * 10)

  const handleSliderMin = (val: number) => {
    const safeMin = Math.min(val, parsedMax ?? sliderMax)
    setMinVal(safeMin > 0 ? String(safeMin) : '')
  }

  const handleSliderMax = (val: number) => {
    const safeMax = Math.max(val, parsedMin ?? 0)
    setMaxVal(safeMax < sliderMax ? String(safeMax) : '')
  }

  const handlePreset = (presetMin: number, presetMax: number | null) => {
    setMinVal(presetMin > 0 ? String(presetMin) : '')
    setMaxVal(presetMax != null ? String(presetMax) : '')
  }

  const handleReset = () => {
    setMinVal('')
    setMaxVal('')
    onApply({ min: null, max: null })
    onOpenChange(false)
  }

  const handleConfirm = () => {
    onApply({
      min: parsedMin,
      max: parsedMax,
    })
    onOpenChange(false)
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
            <Scale className="size-5" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold">فلترة بالوزن (جرام)</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              حدد نطاق الوزن لعرض القطع المتوافقة في{' '}
              <span className="font-semibold text-foreground">{storageName}</span>
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-4 py-2">
        {/* خانتي الإدخال المباشر */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-muted-foreground">
              الحد الأدنى للوزن (جم)
            </label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.0"
                value={minVal}
                onChange={(e) => setMinVal(e.target.value)}
                className="h-11 rounded-[12px] pe-8 text-start font-bold tabular-nums"
              />
              <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                جم
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-muted-foreground">
              الحد الأقصى للوزن (جم)
            </label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="مثال 5.0"
                value={maxVal}
                onChange={(e) => setMaxVal(e.target.value)}
                className="h-11 rounded-[12px] pe-8 text-start font-bold tabular-nums"
              />
              <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                جم
              </span>
            </div>
          </div>
        </div>

        {/* سلايدر نطاق مزدوج تفاعلي */}
        <div className="space-y-2 rounded-[14px] bg-secondary/60 p-3.5">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>شريط التحديد السريع</span>
            <span className="tabular-nums font-bold text-foreground">
              {parsedMin ?? 0} جم — {parsedMax ?? sliderMax} جم
            </span>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <span className="w-12 text-[11px] text-muted-foreground">من:</span>
              <input
                type="range"
                min="0"
                max={sliderMax}
                step="0.25"
                value={parsedMin ?? 0}
                onChange={(e) => handleSliderMin(Number(e.target.value))}
                className="h-2 w-full cursor-pointer accent-primary"
              />
              <span className="w-12 text-end text-[11px] font-bold tabular-nums">
                {parsedMin ?? 0}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-12 text-[11px] text-muted-foreground">إلى:</span>
              <input
                type="range"
                min="0"
                max={sliderMax}
                step="0.25"
                value={parsedMax ?? sliderMax}
                onChange={(e) => handleSliderMax(Number(e.target.value))}
                className="h-2 w-full cursor-pointer accent-primary"
              />
              <span className="w-12 text-end text-[11px] font-bold tabular-nums">
                {parsedMax ?? sliderMax}
              </span>
            </div>
          </div>
        </div>

        {/* اختيارات جاهزة وسريعة */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground">نطاقات شائعة:</span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_RANGES.map((preset) => {
              const isActive =
                parsedMin === (preset.min > 0 ? preset.min : null) &&
                parsedMax === preset.max
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePreset(preset.min, preset.max)}
                  className={cn(
                    'touch-target h-8 rounded-full px-3 text-[11px] font-semibold transition-colors cursor-pointer',
                    isActive
                      ? 'bg-primary text-white shadow-xs'
                      : 'border border-black/10 bg-white text-muted-foreground hover:border-black/25 hover:text-foreground',
                  )}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* مؤشر القطع المطابقة الفوري المتكامل مع المخزن */}
        <div className="flex items-center justify-between rounded-[12px] border border-amber-200/80 bg-amber-50/70 px-3.5 py-2.5 text-xs text-amber-900">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="size-2 rounded-full bg-amber-500" />
            القطع المتاحة المطابقة:
          </span>
          <span className="font-extrabold tabular-nums text-amber-800 text-sm">
            {formatNumber(matchCount)} قطعة
          </span>
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          className="touch-target h-11 gap-1.5 rounded-[12px]"
        >
          <RotateCcw className="size-3.5" />
          إلغاء الفلتر
        </Button>

        <Button
          type="button"
          onClick={handleConfirm}
          className="touch-target h-11 gap-1.5 rounded-[12px] bg-primary text-white hover:bg-primary/90 font-bold"
        >
          <Check className="size-4" />
          تطبيق ({formatNumber(matchCount)} قطعة)
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
