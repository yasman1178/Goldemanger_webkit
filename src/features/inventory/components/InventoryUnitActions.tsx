import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftRight, Check, Printer, X } from 'lucide-react'

import { getStorages } from '@/shared/lib/parties'
import type { StorageLocation } from '@/shared/types/api'
import { transferUnit, verifyUnitCount } from '@/features/inventory/api'
import { invalidateShopData } from '@/shared/lib/invalidateShop'
import type { InventoryUnitRecord } from '@/features/inventory/types'
import { formatNumber } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

interface Props {
  unit: InventoryUnitRecord
  onPrint?: (unit: InventoryUnitRecord) => void
}

export function InventoryUnitActions({ unit, onPrint }: Props) {
  const queryClient = useQueryClient()
  const [transferOpen, setTransferOpen] = useState(false)
  const [countOpen, setCountOpen] = useState(false)
  const [targetStorageId, setTargetStorageId] = useState('')
  const [countFound, setCountFound] = useState(true)
  const [countStorageId, setCountStorageId] = useState('')
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const { data: storages = [] } = useQuery({
    queryKey: ['storages'],
    queryFn: getStorages,
  })

  const targetOptions = storages.filter((s) => s.id !== unit.storageId)

  function reset() {
    setMessage(null)
    setTargetStorageId('')
    setCountFound(true)
    setCountStorageId('')
  }

  const transferMutation = useMutation({
    mutationFn: (storageId: number) => transferUnit(unit.inventoryUnitId, storageId),
    onSuccess: () => {
      setMessage({
        type: 'success',
        text: `تم نقل القطعة ${unit.inventoryNumber} بنجاح.`,
      })
      setTargetStorageId('')
      invalidateShopData(queryClient)
    },
    onError: () => {
      setMessage({ type: 'error', text: 'تعذّر نقل القطعة.' })
    },
  })

  const countMutation = useMutation({
    mutationFn: (payload: { found: boolean; storageId?: number }) =>
      verifyUnitCount(
        unit.inventoryUnitId,
        payload.found,
        payload.storageId,
      ),
    onSuccess: (result) => {
      setMessage({
        type: 'success',
        text: result.locationChanged
          ? `تم تسجيل الجرد: القطعة في ${result.actualLocation ?? 'موقع جديد'}.`
          : `تم تسجيل الجرد: القطعة موجودة${
              result.found ? '' : ' (غير موجودة)'
            }.`,
      })
      setCountStorageId('')
      invalidateShopData(queryClient)
    },
    onError: () => {
      setMessage({ type: 'error', text: 'تعذّر تسجيل الجرد.' })
    },
  })

  return (
    <>
      <div className="flex items-center justify-end gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-[13px]"
          disabled={unit.status !== 'AVAILABLE'}
          onClick={() => {
            reset()
            setTransferOpen(true)
          }}
        >
          <ArrowLeftRight className="size-3.5" />
          نقل
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-[13px]"
          disabled={unit.status !== 'AVAILABLE'}
          onClick={() => {
            reset()
            setCountOpen(true)
          }}
        >
          <Check className="size-3.5" />
          جرد
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-[13px]"
          onClick={() => onPrint?.(unit)}
        >
          <Printer className="size-3.5" />
          طباعة
        </Button>
      </div>

      <Dialog open={transferOpen} onOpenChange={(o) => !o && setTransferOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>نقل القطعة</DialogTitle>
            <DialogDescription>
              <span dir="ltr" className="font-mono">
                {unit.inventoryNumber}
              </span>{' '}
              · {unit.products?.productName ?? `منتج #${unit.productId}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-[14px]">
              <span className="text-muted-foreground">المخزن الحالي</span>
              <span className="font-semibold text-foreground">
                {unit.storage?.location ?? '—'}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[14px] font-medium text-foreground">
                المخزن الوجهة
              </label>
              <Select value={targetStorageId} onValueChange={setTargetStorageId}>
                <SelectTrigger className="h-11 w-full rounded-full border-black/10 bg-white">
                  <SelectValue placeholder="اختر المخزن الوجهة" />
                </SelectTrigger>
                <SelectContent>
                  {targetOptions.map((s: StorageLocation) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {targetOptions.length === 0 && (
                <p className="text-[13px] text-warning">
                  لا توجد مخازن أخرى لنقل القطعة إليها.
                </p>
              )}
            </div>

            {message && (
              <p
                className={`rounded-lg px-3 py-2 text-[13px] font-medium ${
                  message.type === 'success'
                    ? 'bg-success/10 text-success'
                    : 'bg-error/10 text-error'
                }`}
              >
                {message.text}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                className="h-11 flex-1 gap-2 rounded-full touch-target"
                disabled={!targetStorageId || transferMutation.isPending}
                onClick={() =>
                  transferMutation.mutate(Number(targetStorageId))
                }
              >
                <ArrowLeftRight className="size-4" />
                {transferMutation.isPending ? 'جارٍ النقل...' : 'تأكيد النقل'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-full touch-target"
                onClick={() => setTransferOpen(false)}
              >
                إغلاق
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={countOpen} onOpenChange={(o) => !o && setCountOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>جرد القطعة</DialogTitle>
            <DialogDescription>
              <span dir="ltr" className="font-mono">
                {unit.inventoryNumber}
              </span>{' '}
              · {unit.products?.productName ?? `منتج #${unit.productId}`}
              {' · '}
              {formatNumber(unit.weight)} gm · {unit.karat}k
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-[14px]">
              <span className="text-muted-foreground">الموقع المتوقع</span>
              <span className="font-semibold text-foreground">
                {unit.storage?.location ?? '—'}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[14px] font-medium text-foreground">
                الحالة الفعلية
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCountFound(true)}
                  className={`flex h-11 items-center justify-center gap-2 rounded-full border text-[14px] font-semibold transition-colors ${
                    countFound
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-black/10 bg-white text-muted-foreground'
                  }`}
                >
                  <Check className="size-4" />
                  موجود
                </button>
                <button
                  type="button"
                  onClick={() => setCountFound(false)}
                  className={`flex h-11 items-center justify-center gap-2 rounded-full border text-[14px] font-semibold transition-colors ${
                    !countFound
                      ? 'border-error bg-error/10 text-error'
                      : 'border-black/10 bg-white text-muted-foreground'
                  }`}
                >
                  <X className="size-4" />
                  غير موجود
                </button>
              </div>
            </div>

            {countFound && (
              <div className="space-y-1.5">
                <label className="text-[14px] font-medium text-foreground">
                  الموقع الفعلي (إن اختلف)
                </label>
                <Select
                  value={countStorageId}
                  onValueChange={setCountStorageId}
                >
                  <SelectTrigger className="h-11 w-full rounded-full border-black/10 bg-white">
                    <SelectValue placeholder="نفس الموقع المتوقع" />
                  </SelectTrigger>
                  <SelectContent>
                    {storages
                      .filter((s) => s.id !== unit.storageId)
                      .map((s: StorageLocation) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {message && (
              <p
                className={`rounded-lg px-3 py-2 text-[13px] font-medium ${
                  message.type === 'success'
                    ? 'bg-success/10 text-success'
                    : 'bg-error/10 text-error'
                }`}
              >
                {message.text}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                className="h-11 flex-1 gap-2 rounded-full touch-target"
                disabled={countMutation.isPending}
                onClick={() =>
                  countMutation.mutate({
                    found: countFound,
                    storageId: countStorageId
                      ? Number(countStorageId)
                      : undefined,
                  })
                }
              >
                <Check className="size-4" />
                {countMutation.isPending ? 'جارٍ التسجيل...' : 'تسجيل نتيجة الجرد'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-full touch-target"
                onClick={() => setCountOpen(false)}
              >
                إغلاق
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
