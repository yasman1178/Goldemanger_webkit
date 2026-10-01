'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2, RefreshCw, WifiOff } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { formatEgp } from '@/shared/lib/utils'

/**
 * نافذة حسم سعر الذهب قبل الفاتورة.
 *
 * حالتان تشتركان في一个问题 ولا يجمعهما حل واحد:
 *
 * - لا سعر على الخادم أصلاً (أو تعذّر جلبه مع بقاء الاتصال): يُطلب إدخال
 *   السعر ويُحفظ على السيرفر كسعر مُدخل (`isManual`)، فلا تُسجَّل فاتورة
 *   بسعر غير محفوظ.
 * - السعر على الشاشة يخالف سعر الخادم بأكثر من عتبة التدقيق: يُعرض الفرق
 *   بوضوح، إما باعتماد سعر الخادم (فتُعاد حسابات السلة) أو بتثبيت السعر
 *   الذي اختاره الكاشير.
 *
 * لا زر «متابعة على_any حال» هنا: معنى تجاوزه فاتورة تُسجَّل برقم لا يستطيع
 * أحد إعادة اشتقاقه لاحقاً.
 */
export type PriceGateMode = 'missing' | 'mismatch'

export interface PriceMismatchDialogProps {
  open: boolean
  mode: PriceGateMode
  /** سعر الفرع على الخادم؛ null في حالة غياب السعر. */
  serverSell: number | null
  serverBuy?: number | null
  /** السعر المعروض على الشاشة وقت ظهور النافذة. */
  screenPrice: number
  /** الفارق بالجنيه، يُعرض بإشارة واضحة حسب اتجاهه. */
  drift?: number
  currency?: string
  onOpenChange: (open: boolean) => void
  /** يُستدعى بعد حفظ السعر على السيرفر وفيه السعر المعتمد. */
  onResolved: (price: { sell: number; buy: number | null }) => Promise<void> | void
  /**
   * اعتماد سعر الخادم كما هو. مسار منفصل عن الحفظ عن قصد: تبنيً على رقم
   * مسجَّل فعلاً ليس إدخالاً يدوياً، فتسميته `isManual` في السجل كذب.
   */
  onUseServerPrice?: () => Promise<void> | void
}

export function PriceMismatchDialog({
  open,
  mode,
  serverSell,
  serverBuy,
  screenPrice,
  drift = 0,
  currency = 'ج.م',
  onOpenChange,
  onResolved,
  onUseServerPrice,
}: PriceMismatchDialogProps) {
  const [sell, setSell] = useState('')
  const [buy, setBuy] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // تهيئة الحقول عند كل فتح ببيانات جديدة، بلا useEffect: ضبط الحالة أثناء
  // العرض لهذا الغرض نمط معتمد من React («تخزين معلومات من العروض السابقة»)،
  // ويتجنّب إعادة العرض المتتالية التي يحذّر منها lint في الأثر الجانبي.
  const [seedKey, setSeedKey] = useState<string | null>(null)
  const currentKey = open
    ? `${mode}|${serverSell ?? ''}|${serverBuy ?? ''}|${screenPrice}`
    : null
  if (currentKey !== seedKey) {
    setSeedKey(currentKey)
    if (currentKey != null) {
      const seed = mode === 'mismatch' ? screenPrice : (serverSell ?? 0)
      setSell(seed > 0 ? String(seed) : '')
      setBuy(serverBuy && serverBuy > 0 ? String(serverBuy) : '')
      setSaving(false)
      setError(null)
    }
  }

  const sellValue = Number(sell)
  const buyValue = Number(buy)
  const sellValid = Number.isFinite(sellValue) && sellValue > 0
  const buyValid = buy === '' || (Number.isFinite(buyValue) && buyValue > 0)

  async function persist() {
    setSaving(true)
    setError(null)
    try {
      await onResolved({ sell: sellValue, buy: buy === '' ? null : buyValue })
      onOpenChange(false)
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : 'تعذّر حفظ السعر على السيرفر. لن تُسجَّل الفاتورة قبل نجاح الحفظ.',
      )
    } finally {
      setSaving(false)
    }
  }

  const driftDirection = drift > 0 ? 'أعلى' : 'أقل'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'missing' ? (
              <WifiOff className="size-5 text-warning" />
            ) : (
              <AlertTriangle className="size-5 text-warning" />
            )}
            {mode === 'missing' ? 'سعر الذهب غير مسجَّل' : 'السعر على الشاشة يخالف الخادم'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'missing'
              ? 'لا يوجد سعر ذهب مسجَّل لهذا الفرع على السيرفر. أدخل السعر ليُحفظ ويصبح مرجع الفاتورة.'
              : `الفرق ${formatEgp(Math.abs(drift))} — أدناه. ستُسجَّل الفاتورة بالسعر الذي تعتمدونه، ولا يمكن التراجع عن ذلك بالسجل.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-5 py-2 sm:px-6">
          {mode === 'mismatch' ? (
            <div className="grid grid-cols-2 gap-2 rounded-[14px] bg-black/[0.03] p-3 text-[13px]">
              <div>
                <p className="text-muted-foreground">سعر الخادم</p>
                <p className="font-bold tabular-nums text-foreground">
                  {serverSell != null ? `${formatEgp(serverSell)} ${currency}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">السعر على الشاشة</p>
                <p className="font-bold tabular-nums text-warning">
                  {screenPrice > 0 ? `${formatEgp(screenPrice)} ${currency}` : '—'}
                  {drift !== 0 && (
                    <span className="ms-1 text-[11px] font-semibold">
                      ({driftDirection})
                    </span>
                  )}
                </p>
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="gate-sell">سعر بيع جرام عيار 21 ({currency})</Label>
            <Input
              id="gate-sell"
              type="number"
              min="1"
              step="0.01"
              inputMode="decimal"
              value={sell}
              onChange={(e) => setSell(e.target.value)}
              className="h-12 touch-target rounded-[14px] text-[16px] font-bold tabular-nums"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gate-buy">سعر شراء جرام عيار 21 ({currency})</Label>
            <Input
              id="gate-buy"
              type="number"
              min="1"
              step="0.01"
              inputMode="decimal"
              value={buy}
              onChange={(e) => setBuy(e.target.value)}
              placeholder="اتركه فارغاً للاحتفاظ بالسعر المسجَّل"
              className="h-12 touch-target rounded-[14px] text-[16px] font-bold tabular-nums"
            />
          </div>

          <p className="rounded-xl bg-black/[0.03] p-2.5 text-[12px] leading-relaxed text-muted-foreground">
            سيُحفظ السعر على السيرفر باسم المستخدم ووقته، ويُوسم أنه مُدخل يدوياً
            لتسهيل المراجعة لاحقاً.
          </p>

          {error ? (
            <p className="rounded-xl bg-error/10 p-2.5 text-[12px] font-semibold text-error">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 flex-1 rounded-full touch-target"
          >
            إلغاء
          </Button>
          {mode === 'mismatch' && serverSell != null && onUseServerPrice ? (
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={async () => {
                setSaving(true)
                setError(null)
                try {
                  await onUseServerPrice()
                  onOpenChange(false)
                } catch (e) {
                  setError(
                    e instanceof Error && e.message
                      ? e.message
                      : 'تعذّر اعتماد سعر الخادم.',
                  )
                } finally {
                  setSaving(false)
                }
              }}
              className="h-11 flex-1 rounded-full touch-target"
            >
              <RefreshCw className="size-4" />
              اعتماد سعر الخادم
            </Button>
          ) : null}
          <Button
            type="button"
            disabled={!sellValid || !buyValid || saving}
            onClick={persist}
            className="h-11 flex-1 rounded-full touch-target"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'حفظ ومتابعة'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}