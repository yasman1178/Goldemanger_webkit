import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw, Pencil, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { fetchLiveGoldPrice, saveGoldPrice } from '@/shared/lib/parties'
import type { LiveGoldPrice } from '@/shared/lib/parties'
import { purchasePerGram, salePerGram, buyPerGram } from '@/shared/lib/gold'
import { FormatEg } from './Money'
import { useGoldStore } from '@/shared/stores/gold-store'
import { useCurrencyStore } from '@/shared/stores/currency-store'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { currencySymbol } from '@/shared/lib/utils'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'

const KARATS = [24, 21, 18]

/**
 * شريط وكروت أسعار الذهب المدمجة والأنيقة — تصميم فائق الرشاقة (Compact & Modern)
 * يوفر مساحة الشاشة للتابلت والمبيعات مع إبراز واضح للبيع والشراء بالـ tabular-nums.
 */
export function GoldPriceBar({ hidePriceRefresh = false }: { hidePriceRefresh?: boolean } = {}) {
  const gold21 = useGoldStore((s) => s.gold21)
  const setGold21 = useGoldStore((s) => s.setGold21)
  const setGold21Buy = useGoldStore((s) => s.setGold21Buy)
  const setLastFetchTime = useGoldStore((s) => s.setLastFetchTime)
  const lastFetchTime = useGoldStore((s) => s.lastFetchTime)
  const freezeGold = useGoldStore((s) => s.freezeGold)
  const currency = useCurrencyStore((s) => s.currency)
  const [editOpen, setEditOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [livePrices, setLivePrices] = useState<LiveGoldPrice | null>(null)
  const activeBranchId = useActiveBranchId()

  const persistSnapshot = useCallback(
    async (
      sell: number,
      buy: number | null | undefined,
      isManual: boolean,
    ): Promise<boolean> => {
      try {
        await saveGoldPrice({ sell, buy, isManual, branchId: activeBranchId })
        return true
      } catch {
        toast.error('تعذّر حفظ سعر الذهب على السيرفر — الرقم على الشاشة غير محفوظ بعد.')
        return false
      }
    },
    [activeBranchId],
  )

  const persistRef = useRef(persistSnapshot)
  useEffect(() => {
    persistRef.current = persistSnapshot
  }, [persistSnapshot])

  const country = currency === 'SAR' ? 'sa' : 'eg'
  const symbol = currencySymbol(currency)

  const live = livePrices && Math.abs(livePrices.gram21Sell - gold21) < 0.1 ? livePrices : null

  const gold21Ref = useRef(gold21)
  useEffect(() => {
    gold21Ref.current = gold21
  }, [gold21])

  const onPriceChangeRef = useRef(setGold21)
  useEffect(() => {
    onPriceChangeRef.current = setGold21
  }, [setGold21])

  const onPriceChangeBuyRef = useRef(setGold21Buy)
  useEffect(() => {
    onPriceChangeBuyRef.current = setGold21Buy
  }, [setGold21Buy])

  const editOpenRef = useRef(editOpen)
  useEffect(() => {
    editOpenRef.current = editOpen
  }, [editOpen])

  const freezeRef = useRef(freezeGold)
  useEffect(() => {
    freezeRef.current = freezeGold
  }, [freezeGold])

  async function pull() {
    const data = await fetchLiveGoldPrice(country)
    if (!data || data.gram21Sell <= 0) {
      toast.error('تعذّر الحصول على سعر الذهب من المصدر.')
      return false
    }
    setLivePrices(data)
    setLastFetchTime(
      new Date().toLocaleString('ar-EG', { timeStyle: 'short' }),
    )
    if (
      !freezeRef.current &&
      !editOpenRef.current &&
      Math.abs(data.gram21Sell - gold21Ref.current) > 0.1
    ) {
      await persistSnapshot(data.gram21Sell, data.gram21Buy, false)
    }
    if (!freezeRef.current) {
      onPriceChangeRef.current(data.gram21Sell)
      if (data.gram21Buy && data.gram21Buy > 0) {
        onPriceChangeBuyRef.current(data.gram21Buy)
      }
    }
    return true
  }

  useEffect(() => {
    let stopped = false
    let busy = false
    async function poll() {
      if (busy) return
      busy = true
      try {
        const data = await fetchLiveGoldPrice(country)
        if (!stopped && data && data.gram21Sell > 0) {
          setLivePrices(data)
          setLastFetchTime(
            new Date().toLocaleString('ar-EG', { timeStyle: 'short' }),
          )
          if (
            !freezeRef.current &&
            !editOpenRef.current &&
            Math.abs(data.gram21Sell - gold21Ref.current) > 0.1
          ) {
            await persistRef.current(data.gram21Sell, data.gram21Buy, false)
          }
          if (!freezeRef.current) {
            onPriceChangeRef.current(data.gram21Sell)
            if (data.gram21Buy && data.gram21Buy > 0) {
              onPriceChangeBuyRef.current(data.gram21Buy)
            }
          }
        }
      } finally {
        busy = false
      }
    }
    poll()
    if (hidePriceRefresh) return () => {
      stopped = true
    }
    const id = setInterval(poll, 60_000)
    return () => {
      stopped = true
      clearInterval(id)
    }
  }, [setLastFetchTime, hidePriceRefresh, country, activeBranchId])

  async function refresh() {
    setRefreshing(true)
    const ok = await pull()
    setRefreshing(false)
    if (ok) toast.success('تم تحديث سعر الذهب من البورصة بنجاح')
  }

  return (
    <>
      <div className="rounded-[14px] border border-black/5 bg-white p-2 sm:p-2.5 shadow-xs elevation-card transition-all">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          {/* كروت الأسعار الثلاثة المدمجة والأنيقة */}
          <div className="grid grid-cols-3 gap-2 flex-1">
            {/* 1. عيار 24 (السبائك النقية) */}
            <div className="flex items-center justify-between rounded-[10px] border border-slate-200/80 bg-slate-50/70 px-2.5 py-1.5 transition-all hover:bg-slate-100/70">
              <div className="flex items-center gap-1.5">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-[6px] bg-slate-900 text-white text-[10px] font-black">
                  24K
                </span>
                <div className="leading-tight hidden sm:block">
                  <p className="text-[11px] font-bold text-foreground">عيار 24</p>
                  <span className="text-[9px] text-muted-foreground">سبائك</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5 tabular-nums">
                <span className="inline-flex items-center gap-1 text-[11px] sm:text-[12px] font-black text-primary whitespace-nowrap">
                  <span className="text-[9px] font-semibold text-muted-foreground">بيع:</span>
                  <FormatEg value={live?.gram24Sell ?? salePerGram(gold21, 24)} />
                  <span className="text-[8px] font-normal text-muted-foreground">{symbol}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-foreground whitespace-nowrap">
                  <span className="text-[8px] font-semibold text-muted-foreground">شراء:</span>
                  <FormatEg value={live?.gram24Buy ?? buyPerGram(gold21, 24)} />
                  <span className="text-[8px] font-normal text-muted-foreground">{symbol}</span>
                </span>
              </div>
            </div>

            {/* 2. عيار 21 (العيار الأساسي — بارز بلمسة ذهبية راقية) */}
            <div className="flex items-center justify-between rounded-[10px] border-2 border-amber-400 bg-gradient-to-r from-amber-50/90 via-white to-amber-50/90 px-2.5 py-1.5 shadow-xs transition-all ring-1 ring-amber-400/20">
              <div className="flex items-center gap-1.5">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-[6px] bg-amber-500 text-white text-[10px] font-black shadow-xs">
                  21K
                </span>
                <div className="leading-tight hidden sm:block">
                  <p className="text-[11px] font-bold text-amber-950">عيار 21</p>
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600">
                    <span className="relative flex size-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                    </span>
                    الرئيسي
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5 tabular-nums">
                <span className="inline-flex items-center gap-1 text-[12px] sm:text-[13px] font-black text-amber-700 whitespace-nowrap">
                  <span className="text-[9px] font-semibold text-amber-900/70">بيع:</span>
                  <FormatEg value={live?.gram21Sell ?? salePerGram(gold21, 21)} />
                  <span className="text-[8px] font-normal text-amber-900/60">{symbol}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[10.5px] sm:text-[11.5px] font-bold text-emerald-700 whitespace-nowrap">
                  <span className="text-[8px] font-semibold text-emerald-900/70">شراء:</span>
                  <FormatEg value={live?.gram21Buy ?? buyPerGram(gold21, 21)} />
                  <span className="text-[8px] font-normal text-emerald-900/60">{symbol}</span>
                </span>
              </div>
            </div>

            {/* 3. عيار 18 (المشغولات) */}
            <div className="flex items-center justify-between rounded-[10px] border border-slate-200/80 bg-slate-50/70 px-2.5 py-1.5 transition-all hover:bg-slate-100/70">
              <div className="flex items-center gap-1.5">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-[6px] bg-amber-700 text-white text-[10px] font-black">
                  18K
                </span>
                <div className="leading-tight hidden sm:block">
                  <p className="text-[11px] font-bold text-foreground">عيار 18</p>
                  <span className="text-[9px] text-muted-foreground">مشغولات</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5 tabular-nums">
                <span className="inline-flex items-center gap-1 text-[11px] sm:text-[12px] font-black text-primary whitespace-nowrap">
                  <span className="text-[9px] font-semibold text-muted-foreground">بيع:</span>
                  <FormatEg value={live?.gram18Sell ?? salePerGram(gold21, 18)} />
                  <span className="text-[8px] font-normal text-muted-foreground">{symbol}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-foreground whitespace-nowrap">
                  <span className="text-[8px] font-semibold text-muted-foreground">شراء:</span>
                  <FormatEg value={live?.gram18Buy ?? buyPerGram(gold21, 18)} />
                  <span className="text-[8px] font-normal text-muted-foreground">{symbol}</span>
                </span>
              </div>
            </div>
          </div>

          {/* أزرار الإجراءات السريعة ووقت التحديث */}
          <div className="flex items-center justify-between md:justify-end gap-2 border-t md:border-t-0 border-black/5 pt-1.5 md:pt-0 shrink-0">
            {lastFetchTime && (
              <span className="text-[10px] text-muted-foreground tabular-nums">
                آخر تحديث: <strong className="text-foreground">{lastFetchTime}</strong>
              </span>
            )}

            <div className="flex items-center gap-1.5 ms-auto md:ms-0">
              {!hidePriceRefresh && (
                <button
                  type="button"
                  onClick={refresh}
                  disabled={refreshing}
                  title="تحديث من البورصة"
                  className="inline-flex items-center justify-center gap-1 h-8 rounded-[9px] bg-secondary px-2.5 text-primary hover:bg-primary/10 transition-colors text-[11px] font-bold touch-target disabled:opacity-60 cursor-pointer"
                >
                  {refreshing ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="size-3.5" />
                  )}
                  <span className="hidden sm:inline">تحديث</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setEditOpen(true)}
                title="تعديل السعر يدوياً"
                className="inline-flex items-center justify-center gap-1 h-8 rounded-[9px] bg-amber-500 hover:bg-amber-600 text-white px-3 text-[11px] font-bold shadow-xs transition-colors touch-target cursor-pointer"
              >
                <Pencil className="size-3.5" />
                <span>إدخال السعر</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <GoldPriceEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        gold21={gold21}
        onSave={setGold21}
      />
    </>
  )
}

function GoldPriceEditDialog({
  open,
  onOpenChange,
  gold21,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  gold21: number
  onSave: (price: number) => void
}) {
  const [draft, setDraft] = useState(String(gold21))
  const [saving, setSaving] = useState(false)
  const [prevOpen, setPrevOpen] = useState(open)
  const currency = useCurrencyStore((s) => s.currency)
  const activeBranchId = useActiveBranchId()

  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setDraft(String(gold21))
      setSaving(false)
    }
  }

  const draftValue = Number(draft)

  async function commit() {
    if (!draftValue || draftValue <= 0) {
      toast.error('أدخل سعراً صحيحاً للجرام عيار 21.')
      return
    }
    setSaving(true)
    try {
      await saveGoldPrice({ sell: draftValue, isManual: true, branchId: activeBranchId })
    } catch {
      setSaving(false)
      toast.error('تعذّر حفظ السعر لدى النظام — لم يُسجَّل على السيرفر.')
      return
    }
    setSaving(false)
    onSave(draftValue)
    onOpenChange(false)
    toast.success(`تم تحديث سعر الذهب إلى ${draftValue} ${currencySymbol(currency)}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تعديل سعر الذهب</DialogTitle>
          <DialogDescription>
            حدد سعر الجرام عيار 21 — وستُشتق أسعار 24 و18 تلقائياً
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="gold-draft">سعر الجرام عيار 21 ({currencySymbol(currency)})</Label>
            <Input
              id="gold-draft"
              type="number"
              min="1"
              step="0.01"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="0.00"
              className="h-12 touch-target rounded-[14px]"
            />
          </div>

          <div className="space-y-1.5 rounded-2xl bg-black/5 p-3">
            {KARATS.map((k) => (
              <div
                key={k}
                className="flex items-center justify-between text-[14px]"
              >
                <span className="font-semibold text-foreground">{k}K</span>
                <span className="flex items-center gap-3 tabular-nums text-muted-foreground">
                  <span>
                    شراء {draftValue > 0 ? <FormatEg value={purchasePerGram(draftValue, k)} /> : '—'}
                  </span>
                  <span className="font-semibold text-primary">
                    بيع {draftValue > 0 ? <FormatEg value={salePerGram(draftValue, k)} /> : '—'}
                  </span>
                </span>
              </div>
            ))}
          </div>
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
            disabled={saving}
            onClick={commit}
            className="h-11 rounded-full px-6 touch-target"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : 'حفظ السعر'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
