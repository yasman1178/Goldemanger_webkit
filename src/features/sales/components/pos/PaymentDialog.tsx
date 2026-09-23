import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, User, Loader2, CheckCircle2, Zap, Clock } from 'lucide-react'

import { completeHeldSale, createSale } from '@/features/sales/api'
import { invalidateAfterSale } from '@/shared/lib/invalidateShop'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import type { PaymentMethod } from './types'
import { createCustomer, getCustomers } from '@/shared/lib/parties'
import { amountToNumber } from '@/shared/lib/gold'
import { formatEgp, formatNumber } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { cn } from '@/shared/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: number | null
  onCustomerChange: (id: number) => void
  discount: number
  totals: { total: number }
  lines: Array<{ productId: number; quantity: number }>
  grams21?: number
  heldSaleId?: number | null
  onSuccess: (result: { saleId: number; paid: number; held?: boolean }) => void
}

const methods: { key: PaymentMethod; label: string }[] = [
  { key: 'cash', label: 'نقدي' },
  { key: 'card', label: 'بطاقة' },
  { key: 'transfer', label: 'تحويل' },
  { key: 'hold', label: 'معلقة' },
]

export function PaymentDialog({
  open,
  onOpenChange,
  customerId,
  onCustomerChange,
  discount,
  totals,
  lines,
  grams21 = 0,
  heldSaleId,
  onSuccess,
}: Props) {
  const queryClient = useQueryClient()
  const activeBranchId = useActiveBranchId()
  const [paid, setPaid] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [showCustomer, setShowCustomer] = useState(false)

  const isCompletion = (heldSaleId ?? 0) > 0

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
    enabled: open,
  })

  const cashCustomer = customers.find(
    (c) => c.name.includes('نقدي') || (c.idcard ?? '').toUpperCase() === 'CASH',
  )

  const paidValue = Math.round(amountToNumber(paid))
  const change = Math.max(0, paidValue - totals.total)
  const cashToCollect = Math.max(0, totals.total - paidValue)

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setMethod('cash')
      setPaid('')
    }
    onOpenChange(open)
  }

  const selectMethod = (next: PaymentMethod) => {
    setMethod(next)
    if (next === 'cash') {
      if (paid === String(totals.total)) setPaid('')
    } else if (next !== 'hold' && !paid) {
      setPaid(String(totals.total))
    }
  }

  const isCash = method === 'cash'
  const isHold = method === 'hold'
  const effectivePaid = Math.min(paidValue, totals.total)

  const mutation = useMutation({
    mutationFn: async () => {
      if (!customerId) throw new Error('لا يوجد عميل')

      if (isCompletion) {
        return completeHeldSale(heldSaleId!, {
          paidAmount: isCash ? paidValue : effectivePaid,
          paymentMethod: method as 'cash' | 'card' | 'transfer',
        })
      }

      return createSale({
        customerId,
        saleDate: new Date().toISOString(),
        discount,
        totalAmount: totals.total,
        paidAmount: isHold ? 0 : isCash ? paidValue : effectivePaid,
        amountOwed: isHold ? 0 : isCash ? Math.max(0, totals.total - paidValue) : 0,
        paymentMethod: method,
        saleItems: lines,
        branchId: activeBranchId ?? undefined,
        isHold,
      })
    },
    onSuccess: (sale) => {
      toast.success(
        isCompletion
          ? 'تم إتمام البيع المعلّق'
          : isHold
            ? 'تم تعليق الفاتورة — القطع محجوزة والمديونية بالجرامات'
            : 'تمت عملية البيع بنجاح',
      )
      invalidateAfterSale(queryClient)
      onOpenChange(false)
      onSuccess({
        saleId: isCompletion ? heldSaleId! : sale.saleId,
        paid: isHold ? 0 : isCash ? paidValue : effectivePaid,
        held: isHold,
      })
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(
        error.response?.data?.message ??
          (isHold
            ? 'تعذّر تعليق الفاتورة.'
            : isCompletion
              ? 'تعذّر إتمام البيع المعلّق.'
              : 'تعذّر إتمام البيع.'),
      )
    },
  })

  const holdRequiresRealCustomer =
    isHold && cashCustomer != null && customerId === cashCustomer.id

  const canConfirm =
    !!customerId &&
    lines.length > 0 &&
    !holdRequiresRealCustomer &&
    (method !== 'cash' || paidValue > 0)

  const visibleMethods = isCompletion
    ? methods.filter((m) => m.key !== 'hold')
    : methods

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[min(92vh,780px)] gap-3.5 overflow-y-auto p-5 sm:p-6 sm:max-w-[28rem]">
        <DialogHeader>
          <DialogTitle>{isCompletion ? 'إتمام البيع المعلّق' : 'إتمام البيع'}</DialogTitle>
          <DialogDescription>
            {isCompletion
              ? `فاتورة معلّقة #${heldSaleId} — القطع محجوزة وتُسلَّم الآن`
              : isHold
                ? 'القطع تُحبس (HELD) وتُنزَل مديونية ذهبية بالجرامات على العميل'
                : undefined}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-3">
          <span className="text-[13px] font-semibold text-primary">الإجمالي</span>
          <span className="rounded-lg bg-primary px-2.5 py-1 text-[14px] font-bold tabular-nums text-white shadow-sm">
            {formatEgp(totals.total)}
          </span>
        </div>

        <div className="space-y-1.5 rounded-xl border border-primary/20 bg-primary/5 p-2">
          <Label className="flex items-center gap-2 text-[13px] font-bold text-primary">
            <User className="size-4" />
            العميل
          </Label>
          <CustomerPicker
            customerId={customerId}
            onCustomerChange={(id) => {
              onCustomerChange(id)
              setShowCustomer(false)
            }}
            open={showCustomer}
            onOpenChange={setShowCustomer}
          />

          {cashCustomer ? (
            <button
              type="button"
              onClick={() => onCustomerChange(cashCustomer.id)}
              className={cn(
                'flex w-full touch-target items-center justify-between rounded-2xl border px-4 py-3 text-start transition-colors',
                customerId === cashCustomer.id
                  ? 'border-primary bg-primary/5'
                  : 'border-black/10',
              )}
            >
              <span className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
                <Zap className="size-4 text-primary" />
                عميل نقدي — بيع بدون حفظ بيانات
              </span>
              {customerId === cashCustomer.id && (
                <CheckCircle2 className="size-5 shrink-0 text-primary" />
              )}
            </button>
          ) : null}

          {holdRequiresRealCustomer ? (
            <p className="flex items-center gap-2 rounded-xl bg-warning/10 px-3 py-2 text-[12px] font-semibold text-warning">
              <Clock className="size-4 shrink-0" />
              لا يمكن تعليق فاتورة على «عميل نقدي» — اختر عميلاً حقيقياً لتُنزَل عليه المديونية الذهبية.
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5 rounded-xl border border-black/10 bg-black/[0.02] p-2">
          <Label className="text-[13px] font-bold text-foreground">طريقة الدفع</Label>
          <div className="grid grid-cols-4 gap-1.5 rounded-xl bg-white p-1">
            {visibleMethods.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => selectMethod(m.key)}
                className={cn(
                  'h-11 touch-target rounded-lg border text-[13px] font-semibold transition-all',
                  method === m.key
                    ? 'border-primary bg-primary text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)]'
                    : m.key === 'hold'
                      ? 'border-warning/30 text-warning hover:bg-warning/5'
                      : 'border-transparent text-muted-foreground hover:border-black/10 hover:bg-black/5',
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {isHold ? (
          <div className="space-y-2 rounded-xl border-2 border-warning/25 bg-warning/5 p-3">
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 size-5 shrink-0 text-warning" />
              <div className="text-[13px] leading-relaxed text-foreground">
                {grams21 > 0 ? (
                  <>
                    تُنزَل{' '}
                    <span className="font-bold text-warning">{formatNumber(grams21)} جم</span>{' '}
                    (معادل عيار 21) في مديونية العميل، وتُحبس القطع في المخزون حتى الإتمام أو الإلغاء.
                  </>
                ) : (
                  <>سوف تُنزَل المديونية الذهبية في حساب العميل وتُحبس القطع في المخزون.</>
                )}
              </div>
            </div>
            <p className="text-[12px] font-semibold text-muted-foreground">
              يمكنك العدول لحظياً من تبويب «المعلقات» — تعديل، إتمام، أو إلغاء.
            </p>
          </div>
        ) : (
          <div className="space-y-2 rounded-xl border-2 border-success/25 bg-success/5 p-2">
            <div className="space-y-1.5">
              <Label htmlFor="paid" className="text-[13px] font-bold text-success">
                {method === 'cash'
                  ? 'المدفوع'
                  : method === 'card'
                    ? 'المدفوع بالبطاقة'
                    : 'المدفوع تحويلاً/محفظة'}
              </Label>
              <Input
                id="paid"
                type="number"
                min="0"
                value={paid}
                onChange={(e) => setPaid(e.target.value)}
                placeholder="0.00"
                className="no-number-spin h-11 touch-target rounded-lg border-success/40 bg-white text-[15px] font-bold tabular-nums focus-visible:ring-success/30"
              />
            </div>
            <div className="flex items-center justify-between text-[12px]">
              {method === 'cash' ? (
                <>
                  <span className="text-muted-foreground">المتبقي للعميل</span>
                  <span className="tabular-nums font-bold text-success">
                    {formatEgp(change)}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-muted-foreground">المتبقي سيُدفع نقداً</span>
                  <span className={'tabular-nums font-bold ' + (cashToCollect > 0 ? 'text-warning' : 'text-success')}>
                    {formatEgp(cashToCollect)}
                  </span>
                </>
              )}
            </div>
            {method !== 'cash' && cashToCollect <= 0 && (
              <p className="flex items-center gap-1 text-[12px] font-semibold text-success">
                <CheckCircle2 className="size-3.5" />
                تسوية كاملة — لا توجد مديونية.
              </p>
            )}
          </div>
        )}

        <DialogFooter className="sticky bottom-0 -mx-2 -mb-2 bg-muted/95 p-2 backdrop-blur-sm">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 rounded-full px-6 touch-target"
          >
            رجوع
          </Button>
          <Button
            type="button"
            disabled={!canConfirm || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="h-11 rounded-full px-6 touch-target"
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isCompletion ? (
              'تأكيد الإتمام'
            ) : isHold ? (
              'تعليق الفاتورة'
            ) : (
              'تأكيد وإصدار الفاتورة'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CustomerPicker({
  customerId,
  onCustomerChange,
  open,
  onOpenChange,
}: {
  customerId: number | null
  onCustomerChange: (id: number) => void
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const queryClient = useQueryClient()
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
    enabled: open,
  })

  const selected = customers.find((c) => c.id === customerId)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [idcard, setIdcard] = useState('')

  const create = useMutation({
    mutationFn: () =>
      createCustomer({ name: name.trim(), phone: phone.trim(), idcard: idcard.trim() }),
    onSuccess: (c) => {
      onCustomerChange(c.id)
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('تم إنشاء العميل')
      setAdding(false)
      setName('')
      setPhone('')
      setIdcard('')
      onOpenChange(false)
    },
    onError: () => toast.error('فشل إنشاء العميل. تأكد من البيانات.'),
  })

  return (
    <>
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className={cn(
          'flex h-12 w-full touch-target items-center justify-between rounded-xl border-2 px-4 text-[15px] transition-all',
          selected
            ? 'border-primary bg-white shadow-[0_4px_12px_rgba(37,99,235,0.12)]'
            : 'border-primary/30 bg-white hover:border-primary/60',
        )}
      >
        <span className="flex items-center gap-2 font-semibold text-foreground">
          <User className="size-4 text-primary" />
          {selected ? selected.name : 'اختار العميل'}
        </span>
        <span className="font-semibold text-primary">تغيير</span>
      </button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>اختيار العميل</DialogTitle>
            <DialogDescription>
              اختر من القائمة أو أنشئ عميلاً جديداً
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 sm:p-6 space-y-2">
            {adding ? (
              <div className="space-y-3 rounded-2xl bg-black/5 p-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">الاسم *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="الاسم الكامل"
                    className="h-12 touch-target rounded-[14px] bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">الهاتف</Label>
                    <Input
                      id="phone"
                      dir="ltr"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01xxxx"
                      className="h-12 touch-target rounded-[14px] bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="idcard">رقم البطاقة *</Label>
                    <Input
                      id="idcard"
                      dir="ltr"
                      value={idcard}
                      onChange={(e) => setIdcard(e.target.value)}
                      placeholder="الرقم القومي"
                      className="h-12 touch-target rounded-[14px] bg-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAdding(false)}
                    className="h-11 flex-1 rounded-full touch-target"
                  >
                    رجوع
                  </Button>
                  <Button
                    type="button"
                    disabled={!name.trim() || !idcard.trim() || create.isPending}
                    onClick={() => create.mutate()}
                    className="h-11 flex-1 rounded-full touch-target"
                  >
                    {create.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      'حفظ العميل'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {customers.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      لا يوجد عملاء بعد — أنشئ أول عميل
                    </p>
                  ) : (
                    customers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onCustomerChange(c.id)}
                        className="flex w-full touch-target items-center justify-between rounded-[14px] border border-black/5 bg-white px-4 py-3 text-start hover:bg-black/5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-semibold text-foreground">
                            {c.name}
                          </p>
                          <p className="truncate text-[13px] text-muted-foreground" dir="ltr">
                            {c.phone || c.idcard || ''}
                          </p>
                        </div>
                        {customerId === c.id && (
                          <CheckCircle2 className="size-5 shrink-0 text-primary" />
                        )}
                      </button>
                    ))
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAdding(true)}
                  className="h-11 w-full rounded-full touch-target"
                >
                  <Plus className="size-4" />
                  إضافة عميل جديد
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}