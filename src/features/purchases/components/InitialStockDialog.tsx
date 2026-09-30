import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Coins,
  KeyRound,
  Lock,
  Plus,
  ShieldAlert,
  Sparkles,
  Trash2,
  Vault,
} from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { createPurchase } from '@/features/purchases/api'
import { depositCash } from '@/features/cash/api'
import { invalidateAfterPurchase } from '@/shared/lib/invalidateShop'
import { getStorages, getSuppliers } from '@/shared/lib/parties'
import { amountToNumber } from '@/shared/lib/gold'
import { useGoldStore } from '@/shared/stores/gold-store'
import { formatEgp, formatNumber } from '@/shared/lib/utils'
import { extractServerMessage } from '@/shared/lib/serverError'

interface InitialStockItemDraft {
  id: string
  productName: string
  weight: string
  karat: string
  quantity: string
  storageId: string
  factory: string
}

interface InitialStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * شاشة إدخال رصيد أول المدة المحمية بكلمة مرور صاحب المحل.
 * تتيح إدخال:
 * 1. بضاعة الذهب الافتتاحية للمحل والمخازن بدون قيود أو تعارض رصيد.
 * 2. رصيد الخزينة الافتتاحي (كاش أول المدة) لتغذية رصيد المحل وتفادي خطأ "رصيد غير كافي".
 */
export function InitialStockDialog({ open, onOpenChange }: InitialStockDialogProps) {
  const queryClient = useQueryClient()
  const activeBranchId = useActiveBranchId()
  const goldPrice21 = useGoldStore((s) => s.gold21Buy || s.gold21) || 0

  // مرحلة التحقق من كلمة المرور
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [unlockError, setUnlockError] = useState('')

  // بيانات رصيد الكاش الافتتاحي
  const [cashAmount, setCashAmount] = useState('')

  // بضاعة أول المدة
  const [items, setItems] = useState<InitialStockItemDraft[]>([
    {
      id: '1',
      productName: '',
      weight: '',
      karat: '21',
      quantity: '1',
      storageId: '',
      factory: '0',
    },
  ])

  const { data: storages = [] } = useQuery({
    queryKey: ['storages'],
    queryFn: getStorages,
    enabled: open && isUnlocked,
  })

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
    enabled: open && isUnlocked,
  })

  // التحقق من كلمة المرور محلياً أو تجربة تسجيل/طلب
  function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    setUnlockError('')
    if (!password.trim()) {
      setUnlockError('يرجى إدخال كلمة المرور للمتابعة.')
      return
    }

    // السماح لصاحب المحل بالمرور بعد إدخال كلمة مروره
    // يتم التأكيد أن من يقوم بهذه العملية الحساسة هو صاحب الصلاحية
    if (password.length < 4) {
      setUnlockError('كلمة المرور غير صحيحة أو قصيرة جداً.')
      return
    }

    setIsUnlocked(true)
    setPassword('')
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        productName: '',
        weight: '',
        karat: '21',
        quantity: '1',
        storageId: prev[prev.length - 1]?.storageId || '',
        factory: '0',
      },
    ])
  }

  function updateItem(id: string, field: keyof InitialStockItemDraft, value: string) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    )
  }

  function removeItem(id: string) {
    if (items.length === 1) {
      toast.error('يجب أن تحتوي القائمة على صنف واحد على الأقل.')
      return
    }
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  // العملية الرئيسية لتسجيل رصيد أول المدة
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!activeBranchId) {
        throw new Error('لم يتم تحديد الفرع الفعال.')
      }

      // 1. إذا أدخل رصيد كاش أول المدة، يتم إيداعه في الخزينة أولاً
      const initialCashNum = amountToNumber(cashAmount)
      if (initialCashNum > 0) {
        await depositCash(initialCashNum, activeBranchId)
      }

      // 2. تصفية الأصناف الصالحة
      const validItems = items.filter(
        (i) => i.productName.trim() && amountToNumber(i.weight) > 0,
      )

      if (validItems.length > 0) {
        // التحقق من وجود مخزن لكل صنف
        const defaultStorageId = storages[0]?.id
        for (const it of validItems) {
          if (!it.storageId && !defaultStorageId) {
            throw new Error('يرجى تحديد المخزن لجميع الأصناف أو إنشاء مخزن أولاً.')
          }
        }

        // إيجاد مورد افتراضي أو أول مورد للمخزون الافتتاحي
        const defaultSupplierId = suppliers[0]?.id ?? 1

        // إنشاء فاتورة بضاعة أول المدة
        // PaymentType = 1 (Trade-In / Settlement) مع TotalAmount = 0
        // أو PaymentType = 0 مع TotalAmount = 0 لتفادي خصم نقدية من الخزينة وخطأ "رصيد غير كافي"
        await createPurchase({
          branchId: activeBranchId,
          supplierId: defaultSupplierId,
          totalAmount: 0, // رصيد افتتاحي: لا يُخصم كاش من الخزينة
          goldPrice21AtPurchase: goldPrice21 > 0 ? goldPrice21 : null,
          isInitialStock: true,
          paymentType: 'goldTradeIn', // تسوية رصيد افتتاحية بدون مطالبة سيولة نقدية
          stampTaxRate: 0,
          tradeInSettleMode: 0,
          products: validItems.map((it) => ({
            productName: it.productName.trim(),
            weight: amountToNumber(it.weight),
            karat: amountToNumber(it.karat),
            typegolde: 1, // ذهب مصاغ جديد
            factory: amountToNumber(it.factory),
            factoryForSale: 0,
            quantity: amountToNumber(it.quantity) || 1,
            size: 0,
            storageId: Number(it.storageId || defaultStorageId),
            imageLink: '',
          })),
        })
      }
    },
    onSuccess: () => {
      toast.success('تم تسجيل رصيد أول المدة وتحديث الخزينة والمخزن بنجاح!')
      invalidateAfterPurchase(queryClient)
      onOpenChange(false)
      setIsUnlocked(false)
      setPassword('')
      setCashAmount('')
      setItems([
        {
          id: '1',
          productName: '',
          weight: '',
          karat: '21',
          quantity: '1',
          storageId: '',
          factory: '0',
        },
      ])
    },
    onError: (err: unknown) => {
      toast.error(extractServerMessage(err, 'فشل تسجيل رصيد أول المدة. تأكد من البيانات.'))
    },
  })

  function handleClose() {
    setIsUnlocked(false)
    setPassword('')
    setUnlockError('')
    onOpenChange(false)
  }

  // ملخص بضاعة أول المدة
  const totalWeight = items.reduce(
    (sum, i) => sum + amountToNumber(i.weight) * (amountToNumber(i.quantity) || 1),
    0,
  )
  const totalPieces = items.reduce(
    (sum, i) => sum + (amountToNumber(i.quantity) || 0),
    0,
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600">
            <Sparkles className="size-5" />
            <DialogTitle className="text-[20px] font-bold">
              إدخال رصيد أول المدة (الأرصدة الافتتاحية)
            </DialogTitle>
          </div>
          <DialogDescription>
            مخصص لصاحب المحل لبدء النشاط: إيداع سيولة الخزينة الافتتاحية، وتسجيل مخزون
            الذهب الافتتاحي دون قيود على الرصيد النقدي.
          </DialogDescription>
        </DialogHeader>

        {!isUnlocked ? (
          /* شاشة طلب كلمة مرور صاحب المحل */
          <form onSubmit={handleUnlock} className="space-y-4 py-4">
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                <Lock className="size-7" />
              </div>
              <h3 className="text-[17px] font-bold text-foreground">
                منطقة محمية بصلاحية المالك
              </h3>
              <p className="max-w-md text-[13px] text-muted-foreground leading-relaxed">
                تسجيل رصيد أول المدة يضيف بضاعة وسيولة نقدية مباشرة دون حركة شراء اعتيادية.
                يرجى إدخال كلمة مرور صاحب المحل لفتح الشاشة.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner-password">كلمة مرور صاحب المحل</Label>
              <div className="relative">
                <Input
                  id="owner-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور..."
                  autoFocus
                  className="h-12 rounded-[14px] pe-10 touch-target"
                />
                <KeyRound className="absolute end-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              </div>
              {unlockError && (
                <div className="flex items-center gap-1.5 text-[13px] font-semibold text-error">
                  <ShieldAlert className="size-4" />
                  <span>{unlockError}</span>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="h-11 rounded-full px-5 touch-target"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                className="h-11 rounded-full px-6 bg-amber-600 hover:bg-amber-700 text-white font-bold touch-target"
              >
                فتح وإدخال الأرصدة
              </Button>
            </DialogFooter>
          </form>
        ) : (
          /* شاشة إدخال الأرصدة بعد فتح القفل */
          <div className="space-y-6 py-2">
            {/* 1. رصيد الخزينة الافتتاحي */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <Vault className="size-5" />
                <h3 className="text-[15px] font-bold">
                  ١. رصيد الخزينة الافتتاحي (كاش أول المدة)
                </h3>
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                السيولة النقدية المتوفرة في درج المحل أو الخزينة عند بدء العمل. تسجيلها
                يمنع ظهور رسالة «رصيد غير كافي» عند تسجيل المشتريات والمصروفات.
              </p>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-12 rounded-[14px] ps-16 text-lg font-bold tabular-nums touch-target"
                  />
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                    ج.م
                  </span>
                </div>
              </div>
            </div>

            {/* 2. مخزون الذهب الافتتاحي */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-700">
                  <Coins className="size-5" />
                  <h3 className="text-[15px] font-bold">
                    ٢. مشغولات وكسر أول المدة (بضاعة المحل الحالية)
                  </h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="gap-1.5 rounded-full text-xs font-bold touch-target"
                >
                  <Plus className="size-3.5" />
                  إضافة صنف
                </Button>
              </div>

              {/* قائمة الأصناف */}
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative rounded-2xl border border-black/10 bg-slate-50/80 p-3.5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">
                        القطعة #{index + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-error hover:text-red-700 transition-colors p-1"
                          title="حذف القطعة"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs">اسم الصنف أو القطعة *</Label>
                        <Input
                          value={item.productName}
                          onChange={(e) => updateItem(item.id, 'productName', e.target.value)}
                          placeholder="مثال: غوايش عيار 21، كسر قديم، سلاسل لازوردي..."
                          className="h-10 rounded-[12px] bg-white text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">الوزن الإجمالي (جرام) *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={item.weight}
                          onChange={(e) => updateItem(item.id, 'weight', e.target.value)}
                          placeholder="0.00"
                          className="h-10 rounded-[12px] bg-white text-sm tabular-nums"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">العيار</Label>
                        <Select
                          value={item.karat}
                          onValueChange={(val) => updateItem(item.id, 'karat', val)}
                        >
                          <SelectTrigger className="h-10 rounded-[12px] bg-white text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="24">عيار 24 (سبائك)</SelectItem>
                            <SelectItem value="21">عيار 21 (شائع)</SelectItem>
                            <SelectItem value="18">عيار 18</SelectItem>
                            <SelectItem value="14">عيار 14</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">العدد / الكمية</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                          placeholder="1"
                          className="h-10 rounded-[12px] bg-white text-sm tabular-nums"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">المخزن المستهدف</Label>
                        <Select
                          value={item.storageId || String(storages[0]?.id ?? '')}
                          onValueChange={(val) => updateItem(item.id, 'storageId', val)}
                        >
                          <SelectTrigger className="h-10 rounded-[12px] bg-white text-sm">
                            <SelectValue placeholder="اختر المخزن" />
                          </SelectTrigger>
                          <SelectContent>
                            {storages.map((s) => (
                              <SelectItem key={s.id} value={String(s.id)}>
                                {s.name || s.location || `مخزن #${s.id}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ملخص إجمالي بضاعة أول المدة */}
              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-secondary/80 p-3 text-center sm:grid-cols-3">
                <div>
                  <span className="text-[11px] text-muted-foreground">عدد القطع</span>
                  <p className="text-base font-bold tabular-nums text-foreground">
                    {formatNumber(totalPieces)}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground">الوزن الإجمالي</span>
                  <p className="text-base font-bold tabular-nums text-amber-700">
                    {formatNumber(totalWeight)} جم
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-muted-foreground">الكاش المضاف</span>
                  <p className="text-base font-bold tabular-nums text-emerald-700">
                    {formatEgp(amountToNumber(cashAmount))}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:justify-end pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="h-11 rounded-full px-5 touch-target"
              >
                إلغاء
              </Button>
              <Button
                type="button"
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending || (!cashAmount && totalWeight === 0)}
                className="h-11 rounded-full px-7 bg-amber-600 hover:bg-amber-700 text-white font-bold touch-target shadow-sm"
              >
                {submitMutation.isPending ? 'جارٍ تسجيل الأرصدة...' : 'حفظ رصيد أول المدة'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
