import { useEffect, useRef, useState } from 'react'
import { RefreshCw, Pencil, Loader2, Gem, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'

import { fetchLiveGoldPrice, saveGoldPrice } from '@/shared/lib/parties'
import type { LiveGoldPrice } from '@/shared/lib/parties'
import { purchasePerGram, salePerGram, buyPerGram } from '@/shared/lib/gold'
import { FormatEg } from './Money'
import { useGoldStore } from '@/shared/stores/gold-store'
import { useCurrencyStore } from '@/shared/stores/currency-store'
import { currencySymbol, cn } from '@/shared/lib/utils'
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
 * شريط وكروت أسعار الذهب اللحظية — إعادة تصميم شاملة وفق DESIGN.md
 * تضمن إبراز الأسعار بأعلى درجات الوضوح والشفافية للكاشير وصاحب المحل، مع تفريق قاطع بين البيع والشراء.
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
      await saveGoldPrice(data.gram21Sell, 'update')
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
            await saveGoldPrice(data.gram21Sell, 'update')
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
  }, [setLastFetchTime, hidePriceRefresh, country])

  async function refresh() {
    setRefreshing(true)
    const ok = await pull()
    setRefreshing(false)
    if (ok) toast.success('تم تحديث سعر الذهب من البورصة بنجاح')
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
        {/* كارت عيار 24 (السبائك النقية) */}
        <div className="flex flex-col justify-between rounded-[14px] border border-black/5 bg-white p-2 sm:p-2.5 shadow-xs elevation-card transition-all duration-200 hover:shadow-sm">
          {/* ترويسة الكارت */}
          <div className="flex items-center justify-between pb-1 border-b border-black/5">
            <div className="flex items-center gap-1.5">
              <span className="flex size-5.5 items-center justify-center rounded-[6px] bg-slate-900 text-white text-[10px] font-black">
                24K
              </span>
              <p className="text-[12px] font-bold text-foreground leading-none">ذهب نقي 24</p>
            </div>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-700">
              999.9
            </span>
          </div>

          {/* أسعار البيع والشراء */}
          <div className="my-1.5 flex flex-col gap-1 rounded-[10px] bg-secondary/50 p-1.5 sm:p-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary">
                <ArrowUpRight className="size-2.5" />
                بيع
              </span>
              <span className="tabular-nums font-black text-[13px] sm:text-[14px] text-primary whitespace-nowrap">
                <FormatEg value={live?.gram24Sell ?? salePerGram(gold21, 24)} />
                <span className="ms-0.5 text-[9px] font-normal text-muted-foreground">{symbol}</span>
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-black/5 pt-1">
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600">
                <ArrowDownLeft className="size-2.5" />
                شراء
              </span>
              <span className="tabular-nums font-bold text-[12px] text-foreground whitespace-nowrap">
                <FormatEg value={live?.gram24Buy ?? buyPerGram(gold21, 24)} />
                <span className="ms-0.5 text-[9px] font-normal text-muted-foreground">{symbol}</span>
              </span>
            </div>
          </div>

          {/* تذييل الكارت */}
          <div className="mt-auto flex h-7 items-center justify-between border-t border-black/5 pt-1 text-[9px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-medium text-slate-600">
              <Gem className="size-2.5 text-slate-400" />
              سبائك وجنيهات
            </span>
            <span className="font-semibold text-slate-500">نقاء 100%</span>
          </div>
        </div>

        {/* كارت عيار 21 (العيار الرئيسي المرجعي) */}
        <div className="relative flex flex-col justify-between rounded-[14px] border-2 border-amber-400/80 bg-gradient-to-b from-amber-50/60 via-white to-amber-50/20 p-2 sm:p-2.5 shadow-xs elevation-card transition-all duration-200 hover:shadow-sm">
          {/* ترويسة الكارت */}
          <div className="flex items-center justify-between pb-1 border-b border-amber-200/60">
            <div className="flex items-center gap-1.5">
              <span className="flex size-5.5 items-center justify-center rounded-[6px] bg-amber-500 text-white text-[10px] font-black shadow-xs">
                21K
              </span>
              <p className="text-[12px] font-bold text-amber-950 leading-none">ذهب رئيسي 21</p>
            </div>
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-black text-amber-800">
              الأساسي
            </span>
          </div>

          {/* أسعار البيع والشراء */}
          <div className="my-1.5 flex flex-col gap-1 rounded-[10px] bg-amber-100/40 border border-amber-200/50 p-1.5 sm:p-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-900">
                <ArrowUpRight className="size-2.5 text-amber-600" />
                بيع
              </span>
              <span className="tabular-nums font-black text-[13px] sm:text-[14px] text-amber-600 dark:text-amber-400 whitespace-nowrap">
                <FormatEg value={live?.gram21Sell ?? salePerGram(gold21, 21)} />
                <span className="ms-0.5 text-[9px] font-normal text-muted-foreground">{symbol}</span>
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-amber-200/50 pt-1">
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700">
                <ArrowDownLeft className="size-2.5" />
                شراء
              </span>
              <span className="tabular-nums font-bold text-[12px] text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                <FormatEg value={live?.gram21Buy ?? buyPerGram(gold21, 21)} />
                <span className="ms-0.5 text-[9px] font-normal text-muted-foreground">{symbol}</span>
              </span>
            </div>
          </div>

          {/* تذييل الكارت */}
          <div className="mt-auto flex h-7 items-center justify-between border-t border-amber-200/60 pt-1 text-[9px] text-amber-900/80">
            <span className="inline-flex items-center gap-1 font-medium">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
              </span>
              بث حي
            </span>
            <span className="font-semibold text-amber-800">
              {lastFetchTime ? `تحديث ${lastFetchTime}` : 'لحظي'}
            </span>
          </div>
        </div>

        {/* كارت عيار 18 (المشغولات الذهبية) مع أزرار الإدخال والتحديث */}
        <div className="flex flex-col justify-between rounded-[14px] border border-black/5 bg-white p-2 sm:p-2.5 shadow-xs elevation-card transition-all duration-200 hover:shadow-sm">
          {/* ترويسة الكارت */}
          <div className="flex items-center justify-between pb-1 border-b border-black/5">
            <div className="flex items-center gap-1.5">
              <span className="flex size-5.5 items-center justify-center rounded-[6px] bg-amber-700 text-white text-[10px] font-black">
                18K
              </span>
              <p className="text-[12px] font-bold text-foreground leading-none">ذهب مشغول 18</p>
            </div>
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 border border-amber-200/50">
              750
            </span>
          </div>

          {/* أسعار البيع والشراء */}
          <div className="my-1.5 flex flex-col gap-1 rounded-[10px] bg-secondary/50 p-1.5 sm:p-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary">
                <ArrowUpRight className="size-2.5" />
                بيع
              </span>
              <span className="tabular-nums font-black text-[13px] sm:text-[14px] text-primary whitespace-nowrap">
                <FormatEg value={live?.gram18Sell ?? salePerGram(gold21, 18)} />
                <span className="ms-0.5 text-[9px] font-normal text-muted-foreground">{symbol}</span>
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-black/5 pt-1">
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600">
                <ArrowDownLeft className="size-2.5" />
                شراء
              </span>
              <span className="tabular-nums font-bold text-[12px] text-foreground whitespace-nowrap">
                <FormatEg value={live?.gram18Buy ?? buyPerGram(gold21, 18)} />
                <span className="ms-0.5 text-[9px] font-normal text-muted-foreground">{symbol}</span>
              </span>
            </div>
          </div>

          {/* أزرار الإدخال والتحديث في أسفل آخر كارت */}
          <div className="mt-auto flex h-7 items-center gap-1.5 border-t border-black/5 pt-1">
            {!hidePriceRefresh && (
              <button
                type="button"
                onClick={refresh}
                disabled={refreshing}
                title="تحديث من البورصة"
                className="flex-1 inline-flex items-center justify-center gap-1 h-7 rounded-[8px] bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-[10px] font-bold touch-target disabled:opacity-60"
              >
                {refreshing ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <RefreshCw className="size-3" />
                )}
                <span>تحديث</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setEditOpen(true)}
              title="إدخال أو تعديل السعر يدوياً"
              className={cn(
                'inline-flex items-center justify-center gap-1 h-7 rounded-[8px] bg-amber-500 text-white hover:bg-amber-600 transition-all text-[10px] font-bold shadow-xs touch-target',
                hidePriceRefresh ? 'w-full' : 'flex-1',
              )}
            >
              <Pencil className="size-3" />
              <span>إدخال السعر</span>
            </button>
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
    const saved = await saveGoldPrice(draftValue, 'update')
    setSaving(false)
    if (!saved) {
      toast.error('تعذّر حفظ السعر لدى النظام.')
      return
    }
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
