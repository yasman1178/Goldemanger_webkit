import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useBlocker } from 'react-router-dom'
import { toast } from 'sonner'
import { ShoppingCart, AlertTriangle, Clock } from 'lucide-react'

import { getProducts } from '@/features/products/api'
import { invalidateAfterSale } from '@/shared/lib/invalidateShop'
import type { Product } from '@/features/products/types'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { getLatestGoldPrice, getStorages } from '@/shared/lib/parties'
import type { StorageLocation } from '@/shared/types/api'
import { useGoldStore } from '@/shared/stores/gold-store'
import { cartLineMath } from '@/shared/lib/gold'
import { formatEgp, formatNumber, cn } from '@/shared/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'

import { ProductGrid } from '@/features/sales/components/pos/ProductGrid'
import { CurrentCart } from '@/features/sales/components/pos/CurrentCart'
import { PaymentDialog } from '@/features/sales/components/pos/PaymentDialog'
import { DiscountDialog } from '@/features/sales/components/pos/DiscountDialog'
import {
  SaleSuccessDialog,
  type SaleSuccessInfo,
} from '@/features/sales/components/pos/SaleSuccessDialog'
import { HeldSalesList } from '@/features/sales/components/HeldSalesList'
import type { CartLine, CartTotals } from '@/features/sales/components/pos/types'
import {
  cancelHeldSale,
  getHeldSales,
  updateHeldSale,
} from '@/features/sales/api'
import type { HeldSale } from '@/features/sales/types'

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

  const [view, setView] = useState<'pos' | 'held'>('pos')
  const [payingHeld, setPayingHeld] = useState<HeldSale | null>(null)
  const [editingHeld, setEditingHeld] = useState<HeldSale | null>(null)
  const [cancellingHeld, setCancellingHeld] = useState<HeldSale | null>(null)
  const [savingHeld, setSavingHeld] = useState(false)

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

  const { data: heldSales = [] } = useQuery({
    queryKey: ['held-sales', activeBranchId],
    queryFn: () => getHeldSales(activeBranchId ?? undefined),
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

  function grams21Of(list: CartLine[]): number {
    const total = list.reduce(
      (s, l) => s + l.quantity * l.product.weight * (l.product.karat / 21),
      0,
    )
    return Math.round(total * 1000) / 1000
  }

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

  function exitEditMode() {
    clearSale()
    setEditingHeld(null)
    setSavingHeld(false)
    invalidateAfterSale(queryClient)
  }

  const cartItemsCount = cart.reduce((s, l) => s + l.quantity, 0)

  function openEdit(sale: HeldSale) {
    if (cart.length > 0) {
      toast.error('أكمِل الفاتورة الحالية أولاً أو ألغِها قبل فتح فاتورة معلّقة.')
      return
    }
    const lines: CartLine[] = []
    for (const item of sale.saleItems) {
      const product = products.find((p) => p.productId === item.productId)
      if (!product) {
        toast.error('لا يمكن فتح الفاتورة — أحد الأصناف غير موجود حالياً.')
        return
      }
      lines.push({ key: nextKey.current++, product, quantity: item.quantity })
    }
    setCart(lines)
    setCustomerId(sale.customerId)
    setDiscount(sale.discount ?? 0)
    setEditingHeld(sale)
    setView('pos')
  }

  function openCompleteFromList(sale: HeldSale) {
    setCustomerId(sale.customerId)
    setPayingHeld(sale)
    setPaymentOpen(true)
  }

  async function flushHeldEdit(): Promise<boolean> {
    if (!editingHeld) return false
    setSavingHeld(true)
    try {
      await updateHeldSale({
        saleId: editingHeld.saleId,
        customerId: customerId ?? 0,
        saleDate: new Date().toISOString(),
        discount,
        totalAmount: totals.total,
        paidAmount: 0,
        amountOwed: 0,
        isHold: true,
        saleItems: cart.map((l) => ({
          productId: l.product.productId,
          quantity: l.quantity,
        })),
        branchId: activeBranchId ?? undefined,
      })
      invalidateAfterSale(queryClient)
      return true
    } catch (error: { response?: { data?: { message?: string } } } | unknown) {
      const msg =
        typeof error === 'object' && error != null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      toast.error(msg ?? 'تعذّر حفظ تعديلات الفاتورة المعلّقة.')
      return false
    } finally {
      setSavingHeld(false)
    }
  }

  function handleSaveHeld() {
    void (async () => {
      const ok = await flushHeldEdit()
      if (!ok) return
      const id = editingHeld?.saleId
      exitEditMode()
      if (id != null) toast.success(`تم تحديث الفاتورة المعلّقة #${id}`)
    })()
  }

  function checkoutHeldEdit() {
    void (async () => {
      const ok = await flushHeldEdit()
      if (!ok) return
      setPayingHeld(editingHeld)
      setPaymentOpen(true)
    })()
  }

  async function handleCancelHeld(sale: HeldSale) {
    try {
      await cancelHeldSale(sale.saleId)
      toast.success(`أُلغيت الفاتورة المعلّقة #${sale.saleId} ورُجعت القطع للمخزون`)
      setCancellingHeld(null)
      invalidateAfterSale(queryClient)
    } catch {
      toast.error('تعذّر إلغاء الفاتورة المعلّقة.')
      setCancellingHeld(null)
    }
  }

  const payingFromEdit =
    payingHeld != null && editingHeld != null && payingHeld.saleId === editingHeld.saleId

  const paymentTotal = payingFromEdit ? totals.total : (payingHeld?.totalAmount ?? totals.total)
  const paymentLines = payingFromEdit
    ? cart.map((l) => ({ productId: l.product.productId, quantity: l.quantity }))
    : payingHeld?.saleItems.map((i) => ({ productId: i.productId, quantity: i.quantity })) ??
      cart.map((l) => ({ productId: l.product.productId, quantity: l.quantity }))
  const paymentGrams21 = payingFromEdit
    ? grams21Of(cart)
    : payingHeld?.heldGrams ?? grams21Of(cart)

  function handlePaymentSuccess({
    saleId,
    paid,
    held,
  }: {
    saleId: number
    paid: number
    held?: boolean
  }) {
    if (held) {
      setSuccess({
        saleId,
        customerName: customerId != null ? `عميل #${customerId}` : '',
        total: totals.total,
        paid: 0,
        change: 0,
        items: cart.length,
        grams: totals.grams,
        stamp: totals.taxAndStamp,
        held: true,
        grams21: grams21Of(cart),
      })
    } else {
      setSuccess({
        saleId,
        customerName: payingHeld?.customerName ?? (customerId != null ? `عميل #${customerId}` : ''),
        total: paymentTotal,
        paid,
        change: Math.max(0, paid - paymentTotal),
        items: paymentLines.length,
        grams: 0,
        stamp: 0,
      })
    }
    clearSale()
    setEditingHeld(null)
    setPayingHeld(null)
    invalidateAfterSale(queryClient)
  }

  const cartProps =
    Object.assign({}, {
      cart,
      totals,
      goldPrice: effectiveGold,
      onChangeQty: changeQty,
      onRemove: removeLine,
      onClear: () => setCancelOpen(true),
      onDiscount: () => setDiscountOpen(true),
      editingHeldLabel: editingHeld ? `تعديل معلّقة #${editingHeld.saleId}` : undefined,
      onSaveHeld: editingHeld ? handleSaveHeld : undefined,
      savingHeld,
    })

  return (
    <div className="flex h-[calc(100dvh-10.25rem)] min-h-0 flex-col gap-3 lg:h-[calc(100dvh-8.25rem)]">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setView('pos')}
          className={cn(
            'h-10 touch-target rounded-full px-4 text-[13px] font-bold transition-colors',
            view === 'pos'
              ? 'bg-primary text-white'
              : 'bg-black/5 text-muted-foreground hover:bg-black/10',
          )}
        >
          شاشة البيع
        </button>
        <button
          type="button"
          onClick={() => setView('held')}
          className={cn(
            'flex h-10 touch-target items-center gap-2 rounded-full px-4 text-[13px] font-bold transition-colors',
            view === 'held'
              ? 'bg-warning text-white'
              : 'bg-black/5 text-muted-foreground hover:bg-black/10',
          )}
        >
          <Clock className="size-4" />
          المعلقات
          {heldSales.length > 0 ? (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px]',
                view === 'held' ? 'bg-white/20' : 'bg-warning/10 text-warning',
              )}
            >
              {heldSales.length}
            </span>
          ) : null}
        </button>
      </div>

      {view === 'held' ? (
        <div className="min-h-0 flex-1 rounded-2xl border border-black/5 bg-white p-3">
          <HeldSalesList
            sales={heldSales}
            onEdit={openEdit}
            onComplete={openCompleteFromList}
            onCancel={setCancellingHeld}
            onBack={() => setView('pos')}
          />
        </div>
      ) : (
        <>
          <div className="hidden min-h-0 flex-1 gap-3 lg:flex">
            <div className="flex min-h-0 flex-[1.3] flex-col">
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
                {...cartProps}
                onCheckout={editingHeld ? checkoutHeldEdit : () => setPaymentOpen(true)}
              />
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col lg:hidden">
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
              'fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-black/5 bg-white px-4 py-3 lg:hidden',
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
                  {...cartProps}
                  onCheckout={() => {
                    if (editingHeld) {
                      checkoutHeldEdit()
                      setCartOpen(false)
                    } else {
                      setCartOpen(false)
                      setPaymentOpen(true)
                    }
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}

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
        onOpenChange={(o) => {
          setPaymentOpen(o)
          if (!o) setPayingHeld(null)
        }}
        customerId={customerId}
        onCustomerChange={setCustomerId}
        discount={payingFromEdit ? totals.discount : (payingHeld?.discount ?? 0)}
        totals={{ total: paymentTotal }}
        lines={paymentLines}
        grams21={paymentGrams21}
        heldSaleId={payingHeld ? payingHeld.saleId : null}
        onSuccess={handlePaymentSuccess}
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

      <CancelHeldDialog
        sale={cancellingHeld}
        onOpenChange={(o) => !o && setCancellingHeld(null)}
        onConfirm={() => {
          if (cancellingHeld) void handleCancelHeld(cancellingHeld)
        }}
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

function CancelHeldDialog({
  sale,
  onOpenChange,
  onConfirm,
}: {
  sale: HeldSale | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={sale != null} onOpenChange={(o) => !o && onOpenChange(false)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[18px]">
            <AlertTriangle className="size-5 text-error" />
            إلغاء فاتورة معلّقة؟
          </DialogTitle>
        </DialogHeader>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          {sale ? `سيتم تحرير قطع فاتورة #${sale.saleId} (${formatNumber(sale.heldGrams)} جم/21)
          والعودة للمخزون المتاح، وحذف المديونية الذهبية للعميل.` : ''}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 flex-1 rounded-full touch-target"
          >
            تراجع
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            className="h-11 flex-1 rounded-full touch-target"
          >
            إلغاء وإرجاع القطع
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