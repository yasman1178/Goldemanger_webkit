import { useEffect, useRef, useState } from 'react'
import { RefreshCw, Pencil, Loader2, Gem } from 'lucide-react'
import { toast } from 'sonner'

import { fetchLiveGoldPrice, saveGoldPrice } from '@/shared/lib/parties'
import { purchasePerGram, salePerGram } from '@/shared/lib/gold'
import { FormatEg } from './Money'
import { useGoldStore } from '@/shared/stores/gold-store'
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

export function GoldPriceBar({ hidePriceRefresh = false }: { hidePriceRefresh?: boolean } = {}) {
  const gold21 = useGoldStore((s) => s.gold21)
  const setGold21 = useGoldStore((s) => s.setGold21)
  const setLastFetchTime = useGoldStore((s) => s.setLastFetchTime)
  const lastFetchTime = useGoldStore((s) => s.lastFetchTime)
  const freezeGold = useGoldStore((s) => s.freezeGold)
  const [editOpen, setEditOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const gold21Ref = useRef(gold21)
  useEffect(() => {
    gold21Ref.current = gold21
  }, [gold21])

  const onPriceChangeRef = useRef(setGold21)
  useEffect(() => {
    onPriceChangeRef.current = setGold21
  }, [setGold21])

  const editOpenRef = useRef(editOpen)
  useEffect(() => {
    editOpenRef.current = editOpen
  }, [editOpen])

  const freezeRef = useRef(freezeGold)
  useEffect(() => {
    freezeRef.current = freezeGold
  }, [freezeGold])

  async function pull() {
    const data = await fetchLiveGoldPrice()
    if (!data || data.gram21 <= 0) {
      toast.error('تعذّر الحصول على سعر الذهب من المصدر.')
      return false
    }
    setLastFetchTime(
      new Date().toLocaleString('ar-EG', { timeStyle: 'short' }),
    )
    if (
      !freezeRef.current &&
      !editOpenRef.current &&
      Math.abs(data.gram21 - gold21Ref.current) > 0.1
    ) {
      await saveGoldPrice(data.gram21, 'update')
    }
    if (!freezeRef.current) {
      onPriceChangeRef.current(data.gram21)
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
        const data = await fetchLiveGoldPrice()
        if (!stopped && data && data.gram21 > 0) {
          setLastFetchTime(
            new Date().toLocaleString('ar-EG', { timeStyle: 'short' }),
          )
          if (
            !freezeRef.current &&
            !editOpenRef.current &&
            Math.abs(data.gram21 - gold21Ref.current) > 0.1
          ) {
            await saveGoldPrice(data.gram21, 'update')
          }
          if (!freezeRef.current) {
            onPriceChangeRef.current(data.gram21)
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
  }, [setLastFetchTime, hidePriceRefresh])

  async function refresh() {
    setRefreshing(true)
    const ok = await pull()
    setRefreshing(false)
    if (ok) toast.success('تم تحديث سعر الذهب من المصدر')
  }

  return (
    <div className="flex h-[50px] shrink-0 items-center gap-2 overflow-hidden rounded-[14px] bg-white px-2 elevation-card sm:gap-3 sm:px-3 xl:px-4">
      {!hidePriceRefresh && (
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          title="جلب السعر من zahabprice.com"
          className="flex h-9 shrink-0 touch-target items-center gap-1.5 rounded-full bg-primary px-2.5 text-[12px] font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {refreshing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          <span>جلب السعر</span>
        </button>
      )}

      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1">
        {KARATS.map((k) => (
          <PriceChip
            key={k}
            karat={k}
            buy={purchasePerGram(gold21, k)}
            sell={salePerGram(gold21, k)}
          />
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {lastFetchTime && (
          <span className="hidden text-[11px] text-muted-foreground xl:inline">
            آخر جلب: {lastFetchTime}
          </span>
        )}
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          title="تعديل سعر الذهب"
          className="flex size-9 shrink-0 touch-target items-center justify-center rounded-full bg-secondary text-foreground hover:bg-black/5"
          aria-label="تعديل السعر"
        >
          <Pencil className="size-3.5" />
        </button>
      </div>

      <GoldPriceEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        gold21={gold21}
        onSave={setGold21}
      />
    </div>
  )
}

function PriceChip({
  karat,
  buy,
  sell,
}: {
  karat: number
  buy: number
  sell: number
}) {
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-[10px] border border-black/5 bg-black/[0.03] px-2 py-1">
      <span className="flex size-5 shrink-0 items-center justify-center rounded-[7px] bg-gradient-to-b from-amber-300 to-amber-500">
        <Gem className="size-3 text-white" />
      </span>
      <span className="text-[12px] font-bold text-foreground">{karat}K</span>
      <span className="flex flex-col leading-none">
        <span className="text-[9px] font-medium text-muted-foreground">
          شراء
        </span>
        <span className="tabular-nums text-[12px] font-bold text-foreground">
          <FormatEg value={buy} />
        </span>
      </span>
      <span className="flex h-4 w-px bg-black/10" />
      <span className="flex flex-col leading-none">
        <span className="text-[9px] font-medium text-muted-foreground">
          بيع
        </span>
        <span className="tabular-nums text-[12px] font-bold text-primary">
          <FormatEg value={sell} />
        </span>
      </span>
    </div>
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
    toast.success(`تم تحديث سعر الذهب إلى ${draftValue} ج.م`)
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

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="gold-draft">سعر الجرام عيار 21 (ج.م)</Label>
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