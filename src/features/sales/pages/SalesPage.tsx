import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useBlocker } from 'react-router-dom'
import { ShoppingCart, AlertTriangle } from 'lucide-react'

import { getProducts } from '@/features/products/api'
import { invalidateAfterSale } from '@/shared/lib/invalidateShop'
import type { Product } from '@/features/products/types'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { getLatestGoldPrice, getStorages } from '@/shared/lib/parties'
import type { StorageLocation } from '@/shared/types/api'
import { useGoldStore } from '@/shared/stores/gold-store'
import { cartLineMath } from '@/shared/lib/gold'
import { formatEgp, formatNumber } from '@/shared/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

import { ProductGrid } from '@/features/sales/components/pos/ProductGrid'
import { CurrentCart } from '@/features/sales/components/pos/CurrentCart'
import { PaymentDialog } from '@/features/sales/components/pos/PaymentDialog'
import { DiscountDialog } from '@/features/sales/components/pos/DiscountDialog'
import {
  SaleSuccessDialog,
  type SaleSuccessInfo,
} from '@/features/sales/components/pos/SaleSuccessDialog'
import type { CartLine, CartTotals } from '@/features/sales/components/pos/types'

export function SalesPage() {
  const queryClient = useQueryClient()
  const activeBranchId = useActiveBranchId()
  const nextKey = useRef(1)

  const [cart, setCart] = useState<CartLine[]>([])
  const [discount, setDiscount] = useState(0)
  const [customerId, setCustomerId] = useState<number | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [discountOpen, setDiscountOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [success, setSuccess] = useState<SaleSuccessInfo | null>(null)

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    return (
      cart.length > 0 && currentLocation.pathname !== nextLocation.pathname
    )
  })

  const blocked = blocker.state === 'blocked'

  function discardSale() {
    clearSale()
    setCancelOpen(false)
    if (blocked) blocker.proceed?.()
  }

  const gold21 = useGoldStore((s) => s.gold21)
  const freezeGold = useGoldStore((s) => s.freezeGold)
  const setFreezeGold = useGoldStore((s) => s.setFreezeGold)

  useEffect(() => {
    setFreezeGold(true)
    return () => setFreezeGold(false)
  }, [setFreezeGold])

  const { data: products = [] } = useQuery({
    queryKey: ['products', activeBranchId],
    queryFn: () => getProducts(activeBranchId ?? undefined),
  })

  const { data: storages = [] } = useQuery<StorageLocation[]>({
    queryKey: ['storages'],
    queryFn: getStorages,
  })

  const { data: serverPrice } = useQuery({
    queryKey: ['gold-price'],
    queryFn: getLatestGoldPrice,
    staleTime: 5 * 60 * 1000,
  })

  const effectiveGold = gold21 > 0 ? gold21 : serverPrice ?? 0

  function addToCart(product: Product) {
    setCart((prev) => {
      const stock = product.quantity ?? 0
      if (stock <= 0) return prev
      const existing = prev.find((l) => l.product.productId === product.productId)
      if (existing) {
        if (existing.quantity >= stock) return prev
        return prev.map((l) =>
          l.product.productId === product.productId
            ? { ...l, quantity: l.quantity + 1 }
            : l,
        )
      }
      return [...prev, { key: nextKey.current++, product, quantity: 1 }]
    })
  }

  function changeQty(key: number, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => {
          if (l.key !== key) return l
          const stock = l.product.quantity ?? 0
          const next = Math.max(0, l.quantity + delta)
          const capped = next > stock ? stock : next
          return { ...l, quantity: capped }
        })
        .filter((l) => l.quantity > 0),
    )
  }

  function removeLine(key: number) {
    setCart((prev) => prev.filter((l) => l.key !== key))
  }

  const totals: CartTotals = useMemo(() => {
    const acc = { grams: 0, metal: 0, margin: 0, making: 0, taxAndStamp: 0, gross: 0 }
    for (const l of cart) {
      const m = cartLineMath(
        effectiveGold,
        l.product.karat,
        l.product.weight * l.quantity,
        l.product.factoryForSale || l.product.factory,
      )
      acc.grams += m.grams
      acc.metal += m.metal
      acc.margin += m.margin
      acc.making += m.making
      acc.taxAndStamp += m.taxAndStamp
      acc.gross += m.total
    }
    const discountCap = Math.min(discount, acc.making)
    return {
      grams: acc.grams,
      metal: acc.metal,
      margin: acc.margin,
      making: acc.making,
      taxAndStamp: acc.taxAndStamp,
      beforeDiscount: acc.gross,
      discount: discountCap,
      total: Math.round(acc.gross - discountCap),
    }
  }, [cart, effectiveGold, discount])

  function clearSale() {
    setCart([])
    setDiscount(0)
    setCustomerId(null)
  }

  function resetForNewInvoice() {
    clearSale()
    setSuccess(null)
    invalidateAfterSale(queryClient)
  }

  const cartItemsCount = cart.reduce((s, l) => s + l.quantity, 0)

  return (
    <div className="flex h-[calc(100dvh-10.25rem)] min-h-0 flex-col gap-3 lg:h-[calc(100dvh-8.25rem)]">
      <div className="hidden min-h-0 flex-1 gap-3 xl:flex">
        <div className="flex min-h-0 flex-[1.4] flex-col">
          <ProductGrid
            products={products}
            cart={cart}
            goldPrice={effectiveGold}
            onAdd={addToCart}
            freezeGold={freezeGold}
            onToggleFreezeGold={() => setFreezeGold(!freezeGold)}
            storages={storages}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <CurrentCart
            cart={cart}
            totals={totals}
            goldPrice={effectiveGold}
            onChangeQty={changeQty}
            onRemove={removeLine}
            onClear={() => setCancelOpen(true)}
            onCheckout={() => setPaymentOpen(true)}
            onDiscount={() => setDiscountOpen(true)}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col xl:hidden">
        <ProductGrid
          products={products}
          cart={cart}
          goldPrice={effectiveGold}
          onAdd={addToCart}
          freezeGold={freezeGold}
          onToggleFreezeGold={() => setFreezeGold(!freezeGold)}
          storages={storages}
        />
      </div>

      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-black/5 bg-white px-4 py-3 xl:hidden',
          cartItemsCount === 0 && 'hidden',
        )}
      >
        <div className="min-w-0">
          <p className="text-[13px] text-muted-foreground">
            {formatNumber(totals.grams)} جم • {cartItemsCount} قطعة
          </p>
          <p className="truncate text-[20px] font-bold tabular-nums text-foreground">
            {formatEgp(totals.total)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="flex h-[52px] touch-target items-center gap-2 rounded-full bg-primary px-6 text-[16px] font-bold text-white"
        >
          <ShoppingCart className="size-5" />
          عرض الفاتورة
        </button>
      </div>

      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>الفاتورة</DialogTitle>
          </DialogHeader>
          <div className="h-[65vh]">
            <CurrentCart
              cart={cart}
              totals={totals}
              goldPrice={effectiveGold}
              onChangeQty={changeQty}
              onRemove={removeLine}
              onClear={() => setCancelOpen(true)}
              onCheckout={() => {
                setCartOpen(false)
                setPaymentOpen(true)
              }}
              onDiscount={() => {
                setCartOpen(false)
                setDiscountOpen(true)
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <DiscountDialog
        open={discountOpen}
        onOpenChange={setDiscountOpen}
        maxMaking={totals.making}
        discount={totals.discount}
        onApply={(amount) => setDiscount(amount)}
        onClear={() => setDiscount(0)}
      />

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        customerId={customerId}
        onCustomerChange={setCustomerId}
        discount={totals.discount}
        totals={totals}
        lines={cart.map((l) => ({ productId: l.product.productId, quantity: l.quantity }))}
        onSuccess={({ saleId, paid }) => {
          setSuccess({
            saleId,
            customerName: customerId != null ? `عميل #${customerId}` : '',
            total: totals.total,
            paid,
            change: Math.round(Math.max(0, paid - totals.total)),
            items: cart.length,
            grams: totals.grams,
            stamp: totals.taxAndStamp,
          })
          setCart([])
          setDiscount(0)
          invalidateAfterSale(queryClient)
        }}
      />

      <SaleSuccessDialog
        info={success}
        onClose={() => setSuccess(null)}
        onNewSale={resetForNewInvoice}
      />

      <CancelSaleDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onConfirm={discardSale}
      />

      <UnsavedSaleDialog
        blocked={blocked}
        onContinue={() => blocker?.reset?.()}
        onDiscard={() => {
          clearSale()
          blocker?.proceed?.()
        }}
        disabled={success !== null}
      />
    </div>
  )
}

function CancelSaleDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onOpenChange(false)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[18px]">
            <AlertTriangle className="size-5 text-error" />
            إلغاء الفاتورة؟
          </DialogTitle>
        </DialogHeader>
        <p className="text-[15px] text-muted-foreground">
          سيتم حذف كل القطع المضافة من الفاتورة الحالية.
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 flex-1 rounded-full touch-target"
          >
            متابعة البيع
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            className="h-11 flex-1 rounded-full touch-target"
          >
            إلغاء الفاتورة
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function UnsavedSaleDialog({
  blocked,
  onContinue,
  onDiscard,
  disabled,
}: {
  blocked: boolean
  onContinue: () => void
  onDiscard: () => void
  disabled: boolean
}) {
  return (
    <Dialog open={blocked && !disabled} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[18px]">
            لديك عملية بيع غير مكتملة
          </DialogTitle>
        </DialogHeader>
        <p className="text-[15px] text-muted-foreground">
          لديك قطع غير محفوظة في الفاتورة. هل تريد الخروج دون حفظها؟
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onContinue}
            className="h-11 flex-1 rounded-full touch-target"
          >
            متابعة البيع
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onDiscard}
            className="h-11 flex-1 rounded-full touch-target"
          >
            تجاهل الفاتورة
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
