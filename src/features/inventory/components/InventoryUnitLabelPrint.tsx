import { Printer } from 'lucide-react'
import Barcode from 'react-barcode'

import type { InventoryUnitRecord } from '@/features/inventory/types'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'

interface Props {
  unit: InventoryUnitRecord | null
  onClose: () => void
}

export function InventoryUnitLabelPrint({ unit, onClose }: Props) {
  return (
    <Dialog open={Boolean(unit)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>طباعة Label القطعة</DialogTitle>
          <DialogDescription>
            معاينة الـ Label قبل الطباعة على ورق 35×10mm.
          </DialogDescription>
        </DialogHeader>

        {unit && (
          <>
            <div className="receipt-label-print flex justify-center py-2">
              <div
                className="receipt-label rounded-md border border-black/30 p-1 text-center"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div dir="ltr" className="font-mono text-[11px] font-bold leading-none">
                  {unit.inventoryNumber}
                </div>
                <div className="leading-none">
                  <Barcode
                    value={unit.products?.barcode ?? unit.inventoryNumber}
                    format="CODE128"
                    width={1}
                    height={14}
                    displayValue={false}
                    margin={0}
                    background="transparent"
                    lineColor="#000000"
                  />
                </div>
              </div>
            </div>

            <p className="text-center text-[11px] text-muted-foreground">
              {unit.products?.productName ?? `منتج #${unit.productId}`} • {unit.karat}k • {unit.weight} جم
            </p>
            <p className="-mt-1 text-center text-[10px] text-muted-foreground">
              {unit.storage?.location ?? ''}
            </p>

            <div className="flex gap-2 receipt-no-print">
              <Button
                type="button"
                onClick={() => window.print()}
                className="h-11 flex-1 gap-2 rounded-full touch-target"
              >
                <Printer className="size-4" />
                طباعة الـ Label
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-11 rounded-full touch-target"
              >
                إغلاق
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
