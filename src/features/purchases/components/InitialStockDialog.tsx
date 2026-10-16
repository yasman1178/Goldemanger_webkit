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
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { createPurchase } from '@/features/purchases/api'
import { verifySensitivePassword } from '@/features/auth/api'
import { depositCash } from '@/features/cash/api'
import { invalidateAfterPurchase } from '@/shared/lib/invalidateShop'
import { createStorage, getStorages, getSuppliers } from '@/shared/lib/parties'
import { amountToNumber } from '@/shared/lib/gold'
import { useGoldStore } from '@/shared/stores/gold-store'
import { formatEgp, formatNumber } from '@/shared/lib/utils'
import { extractServerMessage } from '@/shared/lib/serverError'
import {
  AddPieceDialog,
  type PieceDraft,
} from '@/features/purchases/components/AddPieceDialog'

/** صنف رصيد أول المدة — نفس PieceDraft المستخدم في ديالوج المشتريات. */
interface InitialStockPiece {
  id: string
  draft: PieceDraft
}

const TYPE_LABELS: Record<string, string> = {
  '1': 'جديد',
  '2': 'مجدّد',
  '3': 'كسر',
  '4': 'فضة',
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

  // بضاعة أول المدة — تُضاف عبر ديالوج المشتريات نفسه (AddPieceDialog)
  const [pieces, setPieces] = useState<InitialStockPiece[]>([])
  const [pieceDialogOpen, setPieceDialogOpen] = useState(false)

  const { data: storages = [] } = useQuery({
    queryKey: ['storages', activeBranchId],
    queryFn: () => getStorages(activeBranchId ?? undefined),
    enabled: open && isUnlocked,
  })

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
    enabled: open && isUnlocked,
  })

  // الفحص الحقيقي على الخادم بكلمة مرور صاحب الجلسة. الفحص المحلي كان مظهراً:
// يكفي أربعة أحرف لفتح شاشة تزرع أرقاماً في المخزون والخزينة.
  const unlockMutation = useMutation({
    mutationFn: async (pwd: string) => verifySensitivePassword(pwd, 'initial-stock'),
    onSuccess: (result) => {
      if (result.verified) {
        setIsUnlocked(true)
        setPassword('')
        setUnlockError('')
        return
      }
      setUnlockError('كلمة المرور غير صحيحة.')
    },
    onError: (err: unknown) => {
      setUnlockError(extractServerMessage(err, 'تعذّر التحقق من كلمة المرور.'))
    },
  })

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    setUnlockError('')
    if (!password.trim()) {
      setUnlockError('يرجى إدخال كلمة المرور للمتابعة.')
      return
    }
    unlockMutation.mutate(password)
  }

  function confirmPiece(draft: PieceDraft) {
    setPieces((prev) => [...prev, { id: `${Date.now()}-${prev.length}`, draft }])
    toast.success('أُضيفت القطعة لرصيد أول المدة')
  }

  function removePiece(id: string) {
    setPieces((prev) => prev.filter((p) => p.id !== id))
  }

  function storageName(storageId?: string): string {
    const found = storages.find((s) => String(s.id) === String(storageId ?? ''))
    return found?.name || found?.location || '—'
  }

  async function handleCreateStorage(name: string) {
    const created = await createStorage(name, activeBranchId ?? undefined)
    queryClient.invalidateQueries({ queryKey: ['storages'] })
    toast.success('تم إنشاء المخزن ' + (created.name || created.location || name))
    return created
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

      // 2. تصفية الأصناف الصالحة (الديالوج يضمن الاسم والوزن والمخزن)
      const validPieces = pieces.filter(
        (p) => p.draft.productName.trim() && amountToNumber(p.draft.weight) > 0,
      )

      if (validPieces.length > 0) {
        // التحقق من وجود مخزن لكل صنف
        const defaultStorageId = storages[0]?.id
        for (const p of validPieces) {
          if (!p.draft.storageId && !defaultStorageId) {
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
          products: validPieces.map(({ draft }) => ({
            productName: draft.productName.trim(),
            weight: amountToNumber(draft.weight),
            karat: amountToNumber(draft.karat) || 21,
            typegolde: Number(draft.typegolde) || 1,
            factory: amountToNumber(draft.factory),
            factoryForSale: amountToNumber(draft.factoryForSale),
            quantity: amountToNumber(draft.quantity) || 1,
            size: amountToNumber(draft.size ?? '') || 0,
            storageId: Number(draft.storageId || defaultStorageId),
            imageLink: draft.imageLink ?? '',
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
      setPieces([])
    },
    onError: (err: unknown) => {
      toast.error(extractServerMessage(err, 'فشل تسجيل رصيد أول المدة. تأكد من البيانات.'))
    },
  })

  function handleClose() {
    setIsUnlocked(false)
    setPassword('')
    setUnlockError('')
    setPieceDialogOpen(false)
    onOpenChange(false)
  }

  // ملخص بضاعة أول المدة
  const totalWeight = pieces.reduce(
    (sum, p) =>
      sum + amountToNumber(p.draft.weight) * (amountToNumber(p.draft.quantity) || 1),
    0,
  )
  const totalPieces = pieces.reduce(
    (sum, p) => sum + (amountToNumber(p.draft.quantity) || 0),
    0,
  )

  return (
    <>
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
                disabled={unlockMutation.isPending}
                className="h-11 rounded-full px-6 bg-amber-600 hover:bg-amber-700 text-white font-bold touch-target"
              >
                {unlockMutation.isPending ? 'جارٍ التحقق...' : 'فتح وإدخال الأرصدة'}
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
                  onClick={() => setPieceDialogOpen(true)}
                  className="gap-1.5 rounded-full text-xs font-bold touch-target"
                >
                  <Plus className="size-3.5" />
                  إضافة صنف
                </Button>
              </div>

              {/* قائمة الأصناف — تُضاف عبر ديالوج المشتريات نفسه */}
              <div className="space-y-3">
                {pieces.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-black/10 bg-white px-4 py-8 text-center">
                    <p className="text-[14px] font-semibold text-foreground">
                      لا توجد قطع بعد
                    </p>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      اضغط «إضافة صنف» لإدخال القطعة بنفس بيانات المشتريات
                      (المصنعية، المخزن، الصورة).
                    </p>
                  </div>
                )}
                {pieces.map(({ id, draft }, index) => (
                  <div
                    key={id}
                    className="relative rounded-2xl border border-black/10 bg-slate-50/80 p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-500">
                        القطعة #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePiece(id)}
                        className="text-error hover:text-red-700 transition-colors p-1"
                        title="حذف القطعة"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <p className="text-[14px] font-bold text-foreground">
                      {draft.productName}
                    </p>
                    <p className="text-[12px] tabular-nums text-muted-foreground">
                      {formatNumber(amountToNumber(draft.weight))} جم ·{' '}
                      {draft.karat}k · {TYPE_LABELS[draft.typegolde] ?? 'جديد'} ·{' '}
                      {formatNumber(amountToNumber(draft.quantity) || 1)} ق ·{' '}
                      {storageName(draft.storageId)}
                    </p>
                    <p className="text-[12px] tabular-nums text-muted-foreground">
                      مصنعية المورد {formatNumber(amountToNumber(draft.factory))} ·
                      مصنعية المحل {formatNumber(amountToNumber(draft.factoryForSale))}
                    </p>
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

    {/* ديالوج المشتريات نفسه لإضافة القطعة — شقيق لا متداخل لتفادي تزاحم الفوكس */}
    <AddPieceDialog
      open={pieceDialogOpen}
      onOpenChange={setPieceDialogOpen}
      goldPrice={goldPrice21}
      includeTax={false}
      commissionRate={0}
      taxRate={0}
      storages={storages}
      onCreateStorage={handleCreateStorage}
      branchId={activeBranchId ?? undefined}
      onConfirm={confirmPiece}
    />
    </>
  )
}
