import { useEffect, useId, useState } from 'react'
import { Camera, ChevronDown, ImagePlus, Plus } from 'lucide-react'

import { amountToNumber, purchaseLineMath } from '@/shared/lib/gold'
import { formatEgp } from '@/shared/lib/utils'
import { JEWELRY_ITEM_NAMES } from '@/shared/lib/jewelryItems'
import { preparePiecePhoto } from '@/shared/lib/imageCompress'
import { uploadPieceImage } from '@/features/purchases/api'
import { StoragePicker, type StorageOption } from '@/shared/components/StoragePicker'
import { ScrapAvailabilityCard } from '@/features/purchases/components/ScrapAvailabilityCard'
import { TwentyOneKConversionBar } from '@/features/purchases/components/TwentyOneKConversionBar'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'

export interface PieceDraft {
  productName: string
  weight: string
  karat: string
  typegolde: string
  factory: string
  factoryForSale: string
  quantity: string
  imageLink?: string
  storageId?: string
}

export const EMPTY_PIECE_DRAFT: PieceDraft = {
  productName: '',
  weight: '',
  karat: '21',
  typegolde: '1',
  factory: '',
  factoryForSale: '',
  quantity: '1',
}

const typeOptions = [
  { value: '1', label: 'جديد' },
  { value: '2', label: 'مجدّد' },
  { value: '3', label: 'كسر' },
  { value: '4', label: 'فضة' },
]

const KARAT_OPTIONS = ['18', '21', '22', '24'] as const

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  goldPrice: number
  initial?: PieceDraft
  includeTax?: boolean
  commissionRate?: number
  taxRate?: number
  storages?: StorageOption[]
  defaultStorageId?: string
  /** عند التبريد: إجمالي الذهب المستبدل مكافئ 21 (تعرض المعادلة كاملة). */
  input21?: number
  /** عند التبريد: إجمالي القطع الملتزمة مكافئ 21 قبل هذه القطعة. */
  output21?: number
  branchId?: number
  onConfirm: (draft: PieceDraft) => void
}

export function AddPieceDialog({ open, onOpenChange, goldPrice, initial, includeTax = true, commissionRate = 0, taxRate = 0.01, storages = [], defaultStorageId, input21, output21, branchId, onConfirm }: Props) {
  // إعادة تهيئة النموذج عند كل فتح عبر remount (key) بدل useEffect — متوافق مع react-hooks/set-state-in-effect.
  const formKey = open ? JSON.stringify(initial ?? EMPTY_PIECE_DRAFT) : 'closed'
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <PieceForm key={formKey} goldPrice={goldPrice} initial={initial} includeTax={includeTax} commissionRate={commissionRate} taxRate={taxRate} storages={storages} defaultStorageId={defaultStorageId} input21={input21} output21={output21} branchId={branchId} onConfirm={onConfirm} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function PieceForm({
  goldPrice,
  initial,
  includeTax = true,
  commissionRate = 0,
  taxRate = 0.01,
  storages = [],
  defaultStorageId,
  input21,
  output21,
  branchId,
  onConfirm,
  onCancel,
}: {
  goldPrice: number
  initial?: PieceDraft
  includeTax?: boolean
  commissionRate?: number
  taxRate?: number
  storages?: StorageOption[]
  defaultStorageId?: string
  input21?: number
  output21?: number
  branchId?: number
  onConfirm: (draft: PieceDraft) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<PieceDraft>({
    ...(initial ?? EMPTY_PIECE_DRAFT),
    storageId: initial?.storageId ?? defaultStorageId,
  })
  const [error, setError] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [customNameDraft, setCustomNameDraft] = useState('')

  useEffect(
    () => () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    },
    [photoPreview],
  )

  function handlePhoto(blob: Blob) {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    const objectUrl = URL.createObjectURL(blob)
    setPhotoPreview(objectUrl)
    if (blob instanceof File) setPhotoFile(blob)
  }

  async function handlePhotoInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const prepared = await preparePiecePhoto(file)
    handlePhoto(prepared)
    setError('')
  }

  function clearPhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(null)
    setPhotoFile(null)
  }

  function set<K extends keyof PieceDraft>(key: K, value: PieceDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function openNamePicker() {
    setCustomNameDraft(
      JEWELRY_ITEM_NAMES.some((n) => n === draft.productName) ? '' : draft.productName,
    )
    setPickerOpen(true)
  }

  const weight = amountToNumber(draft.weight)
  const quantity = amountToNumber(draft.quantity) || 1
  const karat = amountToNumber(draft.karat)
  const supplierMaking = amountToNumber(draft.factory)
  const storeMaking = amountToNumber(draft.factoryForSale)
  const m = purchaseLineMath(
    goldPrice,
    karat,
    weight,
    quantity,
    supplierMaking,
    includeTax,
    includeTax ? 0 : commissionRate,
    taxRate,
  )
  const goldValue = m.metal
  const stampAndTax = m.taxAndStamp
  const commission = m.commission
  const lineTotal = m.total
  const showSummary = weight > 0 && goldPrice > 0
  const piece21 =
    weight > 0 && karat > 0
      ? Math.round(((weight * quantity * karat) / 21) * 1000) / 1000
      : 0

  async function confirmWithPhoto() {
    if (!draft.productName.trim()) {
      setError('اختر اسم القطعة أو اكتبه.')
      return
    }
    if (weight <= 0) {
      setError('أدخل وزناً صالحاً أكبر من صفر.')
      return
    }
    if (!photoFile) {
      onConfirm(draft)
      onCancel()
      return
    }
    setUploading(true)
    setError('')
    try {
      const uploaded = await uploadPieceImage(photoFile)
      onConfirm({ ...draft, imageLink: uploaded.url })
      onCancel()
    } catch {
      setError('تعذّر رفع الصورة إلى الاستضافة. تأكد من الاتصال وحاول مرة أخرى.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Plus className="size-6" />
            </span>
            <div>
              <DialogTitle className="text-[18px]">إضافة قطعة جديدة</DialogTitle>
              <DialogDescription>
                املأ بيانات القطعة ثم أكّد إضافتها للفاتورة.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2 rounded-[14px] border border-primary/25 bg-primary/[0.04] p-3">
            <Label className="text-[13px] font-semibold">اسم القطعة *</Label>
            <button
              type="button"
              onClick={openNamePicker}
              className="flex h-12 w-full touch-target items-center justify-between gap-2 rounded-[14px] border border-primary/20 bg-white px-3 text-[14px]"
            >
              <span
                className={
                  draft.productName
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground'
                }
              >
                {draft.productName || 'اختر اسم القطعة…'}
              </span>
              <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-2 rounded-[14px] bg-secondary/60 p-3">
            <p className="text-[13px] font-semibold text-muted-foreground">
              العيار والنوع
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[13px]">العيار</Label>
                <div className="grid grid-cols-2 gap-2">
                  {KARAT_OPTIONS.map((k) => {
                    const selected = draft.karat === k
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => set('karat', k)}
                        className={`touch-target rounded-[14px] border px-2 py-2.5 text-[13px] font-medium transition-colors ${
                          selected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-black/10 bg-white text-foreground'
                        }`}
                      >
                        {k} ك
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[13px]">النوع</Label>
                <div className="grid grid-cols-2 gap-2">
                  {typeOptions.map((o) => {
                    const selected = draft.typegolde === o.value
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => set('typegolde', o.value)}
                        className={`touch-target rounded-[14px] border px-2 py-2.5 text-[13px] font-medium transition-colors ${
                          selected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-black/10 bg-white text-foreground'
                        }`}
                      >
                        {o.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-[13px]">الوزن (جم) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={draft.weight}
                onChange={(e) => set('weight', e.target.value)}
                placeholder="0.00"
                className="h-11 touch-target rounded-[14px]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[13px]">مصنعية المورد/جم</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={draft.factory}
                onChange={(e) => set('factory', e.target.value)}
                placeholder="0.00"
                className="h-11 touch-target rounded-[14px]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[13px]">العدد</Label>
              <Input
                type="number"
                min="1"
                value={draft.quantity}
                onChange={(e) => set('quantity', e.target.value)}
                placeholder="1"
                className="h-11 touch-target rounded-[14px]"
              />
            </div>
          </div>

          <div className="space-y-2 rounded-[14px] bg-secondary/60 p-3">
            <p className="text-[13px] font-semibold text-muted-foreground">
              صورة القطعة (اختياري)
            </p>
            {photoPreview ? (
              <div className="flex items-center gap-3 rounded-[14px] border border-black/10 bg-white p-2">
                <img
                  src={photoPreview}
                  alt="صورة القطعة"
                  className="size-16 shrink-0 rounded-[10px] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-foreground">
                    {photoFile?.name ?? 'صورة مضغوطة وموقع بعلامة مائية'}
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    ستُرفع إلى الاستضافة عند تأكيد القطعة.
                  </p>
                  <button
                    type="button"
                    onClick={clearPhoto}
                    disabled={uploading}
                    className="mt-1 text-[13px] font-semibold text-error touch-target disabled:opacity-50"
                  >
                    إزالة الصورة
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <PhotoPickInput
                  label="التقاط صورة"
                  icon={<Camera className="size-5" />}
                  capture="environment"
                  onChange={handlePhotoInput}
                />
                <PhotoPickInput
                  label="من المعرض"
                  icon={<ImagePlus className="size-5" />}
                  onChange={handlePhotoInput}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[13px]">مصنعية المورد/جم</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={draft.factory}
                onChange={(e) => set('factory', e.target.value)}
                placeholder="0.00"
                className="h-11 touch-target rounded-[14px]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[13px]">العدد</Label>
              <Input
                type="number"
                min="1"
                value={draft.quantity}
                onChange={(e) => set('quantity', e.target.value)}
                placeholder="1"
                className="h-11 touch-target rounded-[14px]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[13px]">مصنعية المحل/جم (أسعار البيع — لا تُضاف)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={draft.factoryForSale}
              onChange={(e) => set('factoryForSale', e.target.value)}
              placeholder="0.00"
              className="h-11 touch-target rounded-[14px]"
            />
          </div>

          {storages.length > 0 && (
            <div className="space-y-2 rounded-[14px] bg-secondary/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Label className="text-[13px] font-semibold">المخزن</Label>
                  <p className="text-[11px] text-muted-foreground">
                    يُخصم الذهب من هذا المخزن. فارغ = مخزن الفاتورة.
                  </p>
                </div>
                <StoragePicker
                  value={draft.storageId ?? ''}
                  storages={storages}
                  onChange={(v) => set('storageId', v === 'all' ? undefined : v)}
                  allowAll={false}
                  allowCreate={false}
                  placeholder="المخزن"
                  triggerClassName="bg-white"
                />
              </div>
            </div>
          )}

          {typeof input21 === 'number' && (
            <div className="space-y-2">
              <TwentyOneKConversionBar
                input21={input21}
                output21={(output21 ?? 0) + piece21}
                goldPrice={goldPrice}
              />
              <ScrapAvailabilityCard
                storageId={draft.storageId}
                branchId={branchId}
              />
            </div>
          )}

          {showSummary && (
            <div className="space-y-1 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">سعر الذهب — {draft.karat}k</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {formatEgp(goldValue)}
                </span>
              </div>
              {includeTax && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    دمغة وضريبة ({(taxRate * 100).toFixed(2)}%)
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatEgp(stampAndTax)}
                  </span>
                </div>
              )}
              {!includeTax && commissionRate > 0 && commission > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    عمولة الشراء من عميل ({(commissionRate * 100).toFixed(2)}%)
                  </span>
                  <span className="font-semibold tabular-nums text-error">
                    −{formatEgp(commission)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">مصنعية المورد (تُضاف للفاتورة)</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {formatEgp(supplierMaking * weight * quantity)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-primary/20 pt-1">
                <span className="font-semibold text-primary">إجمالي القطعة</span>
                <span className="text-[17px] font-bold tabular-nums text-primary">
                  {formatEgp(lineTotal)}
                </span>
              </div>
              {storeMaking > 0 && (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>مصنعية المحل (لا تُضاف)</span>
                  <span className="tabular-nums">
                    {formatEgp(storeMaking * weight * quantity)}
                  </span>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="rounded-xl bg-error/10 px-3 py-2 text-[13px] font-semibold text-error">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={uploading}
              className="h-12 flex-1 rounded-full touch-target"
            >
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={() => void confirmWithPhoto()}
              disabled={uploading}
              className="h-12 flex-1 gap-2 rounded-full touch-target"
            >
              {uploading ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  جارٍ رفع الصورة...
                </>
              ) : (
                <>
                  <Plus className="size-5" />
                  إضافة القطعة
                </>
              )}
            </Button>
          </div>
        </div>

        <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[16px]">اختر اسم القطعة</DialogTitle>
              <DialogDescription>
                اختر الصنف من القائمة أو اكتب اسم القطعة مباشرة.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {JEWELRY_ITEM_NAMES.map((name) => {
                  const selected = draft.productName === name
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        set('productName', name)
                        setPickerOpen(false)
                      }}
                      className={`touch-target rounded-[14px] border px-3 py-2.5 text-[13px] font-medium transition-colors ${
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-black/10 bg-white text-foreground'
                      }`}
                    >
                      {name}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-end gap-2 border-t border-dashed border-black/10 pt-3">
                <div className="flex-1 space-y-1">
                  <Label className="text-[12px] text-muted-foreground">اسم مخصص</Label>
                  <Input
                    value={customNameDraft}
                    onChange={(e) => setCustomNameDraft(e.target.value)}
                    placeholder="اكتب اسم القطعة"
                    className="h-11 touch-target rounded-[14px] bg-white"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    if (customNameDraft.trim()) {
                      set('productName', customNameDraft.trim())
                      setPickerOpen(false)
                    }
                  }}
                  className="h-11 touch-target rounded-[14px] px-4"
                >
                  اختيار
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </>
  )
}

function PhotoPickInput({
  label,
  icon,
  capture,
  onChange,
}: {
  label: string
  icon: React.ReactNode
  capture?: 'user' | 'environment'
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  const inputId = useId()
  return (
    <label
      htmlFor={inputId}
      className="flex h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-[14px] border border-dashed border-black/10 bg-white text-muted-foreground transition-colors hover:bg-black/5"
    >
      {icon}
      <span className="text-[12px] font-medium">{label}</span>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        capture={capture}
        className="hidden"
        onChange={onChange}
      />
    </label>
  )
}
