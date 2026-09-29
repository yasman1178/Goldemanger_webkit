import { useId, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeftRight,
  ArrowRight,
  Banknote,
  CheckCircle2,
  Coins,
  ImagePlus,
  Landmark,
  Package,
  Paperclip,
  Plus,
  Save,
  Scale,
  Store,
  Trash2,
  UserPlus,
  Users,
  Sparkles,
} from 'lucide-react'
import { Switch } from '@/shared/components/ui/switch'

import { createPurchase } from '@/features/purchases/api'
import { invalidateAfterPurchase } from '@/shared/lib/invalidateShop'
import { AddPieceDialog, EMPTY_PIECE_DRAFT, type PieceDraft } from '@/features/purchases/components/AddPieceDialog'
import { ExchangePiecePicker } from '@/features/purchases/components/ExchangePiecePicker'
import { PurchaseReceiptDialog } from '@/features/purchases/components/PurchaseReceiptDialog'
import { TwentyOneKConversionBar } from '@/features/purchases/components/TwentyOneKConversionBar'
import type { ReceiptParty } from '@/features/purchases/components/PurchaseReceiptDialog'
import type { GoldExchangeLine, Purchase, PurchaseLineDraft, PurchasePaymentType } from '@/features/purchases/types'
import { getInventoryUnits } from '@/features/inventory/api'
import type { InventoryUnitRecord } from '@/features/inventory/types'
import { getProducts } from '@/features/products/api'
import type { Product } from '@/features/products/types'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { useGoldStore } from '@/shared/stores/gold-store'
import {
  createCustomer,
  createStorage,
  createSupplier,
  fetchLiveGoldPrice,
  getCustomers,
  getLatestGoldPrice,
  getStorages,
  getSuppliers,
} from '@/shared/lib/parties'
import { amountToNumber, BUY_FROM_CUSTOMER_COMMISSION, purchaseLineMath, purchasePerGram } from '@/shared/lib/gold'
import { getOverview } from '@/features/settings/api'
import { cn, formatEgp, formatNumber } from '@/shared/lib/utils'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

const typeOptions = [
  { value: '1', label: 'جديد' },
  { value: '2', label: 'مجدّد' },
  { value: '3', label: 'كسر' },
  { value: '4', label: 'فضة' },
]

let lineKey = 0
let exchangeKey = 0

function toLine(draft: PieceDraft): PurchaseLineDraft {
  return {
    key: lineKey++,
    productName: draft.productName,
    weight: draft.weight,
    karat: draft.karat,
    typegolde: draft.typegolde,
    factory: draft.factory,
    factoryForSale: draft.factoryForSale,
    quantity: draft.quantity,
    size: draft.size,
    imageLink: draft.imageLink,
    storageId: draft.storageId,
    committed: true,
  }
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000
}

function buildExchangeFromUnit(unit: InventoryUnitRecord): GoldExchangeLine {
  const isScrap = unit.products?.typegolde === 3
  return {
    key: exchangeKey++,
    sourceType: isScrap ? 'brokenGold' : 'storeItem',
    productId: unit.productId,
    inventoryUnitId: unit.inventoryUnitId,
    productName: unit.products?.productName,
    weight: String(round3(unit.weight)),
    fromKarat: String(unit.karat || 21),
    toKarat: '21',
    storageId: unit.storageId ? String(unit.storageId) : '',
  }
}

type PartyMode = 'supplier' | 'customer'

type AttachedFile = { file: File; preview: string }

export function PurchaseCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const activeBranchId = useActiveBranchId()

  const [supplierId, setSupplierId] = useState('')
  const [partyMode, setPartyMode] = useState<PartyMode>('supplier')
  const [paymentType, setPaymentType] = useState<PurchasePaymentType>('cash')
  const [stampTaxRate, setStampTaxRate] = useState('1')
  const [exchanges, setExchanges] = useState<GoldExchangeLine[]>([])
  const [exchangeStorage, setExchangeStorage] = useState('all')
  const [isInitialStock, setIsInitialStock] = useState(false)
  const [newSupplierMode, setNewSupplierMode] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [newSupplierPhone, setNewSupplierPhone] = useState('')
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [newCustomerIdCard, setNewCustomerIdCard] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pieceDialogOpen, setPieceDialogOpen] = useState(false)
  const [pieceInitial, setPieceInitial] = useState<PieceDraft>(EMPTY_PIECE_DRAFT)
  const [invoiceImage, setInvoiceImage] = useState<AttachedFile | null>(null)
  const [idCardImage, setIdCardImage] = useState<AttachedFile | null>(null)
  const [lines, setLines] = useState<PurchaseLineDraft[]>([])
  const [previewPiece, setPreviewPiece] = useState<PurchaseLineDraft | null>(null)
  const [savedResult, setSavedResult] = useState<{
    purchase: Purchase
    party: ReceiptParty | null
    isCustomer: boolean
  } | null>(null)
  const [settleMode, setSettleMode] = useState<0 | 1>(0)

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
    enabled: partyMode === 'supplier',
  })

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
    enabled: partyMode === 'customer',
  })

  const { data: storages = [] } = useQuery({
    queryKey: ['storages'],
    queryFn: getStorages,
  })

  const storeGold21 = useGoldStore((s) => s.gold21)
  const storeGold21Buy = useGoldStore((s) => s.gold21Buy)
  const setGold21 = useGoldStore((s) => s.setGold21)
  const setGold21Buy = useGoldStore((s) => s.setGold21Buy)

  // تحديث مباشر لسعري البيع والشراء من المصدر الحي أثناء تواجد المدير في شاشة الشراء
  // حتى لا تُحسب فاتورة شراء من عميل بسعر البيع في غياب زيارة شاشة البيع أولاً.
  useEffect(() => {
    let stopped = false
    const updateLive = async () => {
      const live = await fetchLiveGoldPrice('eg')
      if (!stopped && live && live.gram21Sell > 0) {
        setGold21(live.gram21Sell)
        if (live.gram21Buy && live.gram21Buy > 0) setGold21Buy(live.gram21Buy)
      }
    }
    void updateLive()
    const id = setInterval(updateLive, 60_000)
    return () => {
      stopped = true
      clearInterval(id)
    }
  }, [setGold21, setGold21Buy])

  const { data: serverPrice } = useQuery({
    queryKey: ['gold-price'],
    queryFn: getLatestGoldPrice,
    staleTime: 5 * 60 * 1000,
  })

  // القاعدة الحاسمة: الشراء من عميل يستخدم سعر الشراء (Buy) دائماً ولا يقع على سعر البيع أبداً.
  // عند غياب سعر الشراء يبقى goldPrice = 0 (تحميل) ويمنع الحفظ — بدل حساب بسعر البيع.
  const goldPrice = partyMode === 'customer'
    ? storeGold21Buy
    : (storeGold21 > 0 ? storeGold21 : (serverPrice ?? 0))

  const { data: overview } = useQuery({
    queryKey: ['settings-overview'],
    queryFn: getOverview,
    staleTime: 5 * 60 * 1000,
  })

  const customerCommissionRate = useMemo(() => {
    const list = overview?.branches ?? []
    const found = activeBranchId
      ? list.find((b) => b.branchId === activeBranchId)
      : list[0]
    // القاعدة: الشراء من عميل بسعر الشراء (البيع − العمولة) — لا يُترك 0 أبداً وإلا ظهر سعر البيع.
    return found?.buyFromCustomerCommission ?? BUY_FROM_CUSTOMER_COMMISSION
  }, [overview, activeBranchId])

const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products', activeBranchId],
    queryFn: () => getProducts(activeBranchId ?? undefined),
  })

  const { data: inventoryUnits = [] } = useQuery({
    queryKey: ['inventory-units', activeBranchId],
    queryFn: () => getInventoryUnits(activeBranchId ?? undefined),
  })

  const defaultScrapStorage = useMemo(() => {
    let best = ''
    let bestWeight = 0
    for (const u of inventoryUnits) {
      if (u.status !== 'AVAILABLE' || u.products?.typegolde !== 3) continue
      const sid = u.storageId ?? 0
      if (sid <= 0) continue
      if (u.weight > bestWeight) {
        bestWeight = u.weight
        best = String(sid)
      }
    }
    if (best) return best
    // fallback مقصود: مخزن الكسر قد يحوي قطعاً نوعها «جديد» (سلوك معتمد) —
    // عند غياب أي وحدة كسر (typegolde===3) نختار المخزن صاحب أكبر إجمالي وزن متاح
    // حتى لا يبقى «مخزن الاستبدال» فارغاً ويظن المستخدم أن المخزن خالٍ.
    const totals = new Map<number, number>()
    for (const u of inventoryUnits) {
      if (u.status !== 'AVAILABLE' || !(u.weight > 0)) continue
      const sid = u.storageId ?? 0
      if (sid <= 0) continue
      totals.set(sid, (totals.get(sid) ?? 0) + u.weight)
    }
    for (const [sid, total] of totals) {
      if (total > bestWeight) {
        bestWeight = total
        best = String(sid)
      }
    }
    return best
  }, [inventoryUnits])

  const effectiveExchangeStorage = exchangeStorage || defaultScrapStorage || 'all'

  const totalWeight = useMemo(() => {
    return lines.reduce(
      (sum, l) =>
        sum +
        amountToNumber(l.weight) * (amountToNumber(l.quantity) || 1),
      0,
    )
  }, [lines])

  const pieceCount = useMemo(() => {
    return lines.reduce(
      (sum, l) => sum + (amountToNumber(l.quantity) || 0),
      0,
    )
  }, [lines])

  const totalAmount = useMemo(() => {
    if (!goldPrice) return 0
    const isCustomer = partyMode === 'customer'
    const includeTax = !isCustomer
    const taxRate = amountToNumber(stampTaxRate) / 100
    let total = 0
    for (const line of lines) {
      const weight = amountToNumber(line.weight)
      const quantity = amountToNumber(line.quantity)
      if (weight <= 0 || quantity <= 0) continue
      const m = purchaseLineMath(
        goldPrice,
        amountToNumber(line.karat),
        weight,
        quantity,
        amountToNumber(line.factory),
        includeTax,
        isCustomer ? customerCommissionRate : 0,
        taxRate,
      )
      total += m.total
    }
    return Math.round(total)
  }, [lines, goldPrice, partyMode, customerCommissionRate, stampTaxRate])

  const byKarat = useMemo(() => {
    const map = new Map<number, { pieces: number; weight: number }>()
    for (const line of lines) {
      const karat = amountToNumber(line.karat)
      if (karat <= 0) continue
      const entry = map.get(karat) ?? { pieces: 0, weight: 0 }
      const quantity = amountToNumber(line.quantity) || 1
      entry.pieces += amountToNumber(line.quantity) || 0
      entry.weight += amountToNumber(line.weight) * quantity
      map.set(karat, entry)
    }
    return [...map.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([karat, e]) => ({ karat, pieces: e.pieces, weight: e.weight }))
  }, [lines])

  const committedLines = lines

const givenByKarat = useMemo(() => {
    const map = new Map<number, number>()
    for (const e of exchanges) {
      const weight = amountToNumber(e.weight)
      const karat = amountToNumber(e.fromKarat)
      if (weight <= 0 || karat <= 0) continue
      map.set(karat, (map.get(karat) ?? 0) + weight)
    }
    return [...map.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([karat, weight]) => ({ karat, weight }))
  }, [exchanges])

  const given21 = useMemo(() => {
    return round3(
      exchanges.reduce((sum, e) => {
        const weight = amountToNumber(e.weight)
        const karat = amountToNumber(e.fromKarat)
        if (weight <= 0 || karat <= 0) return sum
        return sum + (weight * karat) / 21
      }, 0),
    )
  }, [exchanges])

  const received21 = useMemo(() => {
    return round3(
      lines.reduce((sum, l) => {
        const weight = amountToNumber(l.weight)
        const quantity = amountToNumber(l.quantity) || 1
        const karat = amountToNumber(l.karat)
        if (weight <= 0 || karat <= 0) return sum
        return sum + (weight * quantity * karat) / 21
      }, 0),
    )
  }, [lines])

  const diff21 = round3(received21 - given21)
  const diffCash = goldPrice > 0 ? round3(Math.abs(diff21) * goldPrice) : 0
  const diffCashSigned =
    goldPrice > 0 && diff21 !== 0 ? Math.round(diff21 * goldPrice * 100) / 100 : 0

  // المصنعية + الدمغة/الضريبة التي لا يغطيها الذهب المستبدل (بما يطابق حساب الـ Backend).
  const settlementResidual = useMemo(() => {
    if (!goldPrice) return 0
    const taxRate = amountToNumber(stampTaxRate) / 100
    let making = 0
    let metalValue = 0
    for (const line of lines) {
      const weight = amountToNumber(line.weight)
      const quantity = amountToNumber(line.quantity) || 1
      const karat = amountToNumber(line.karat)
      if (weight <= 0 || karat <= 0) continue
      making += amountToNumber(line.factory) * weight * quantity
      metalValue += weight * quantity * ((goldPrice * karat) / 21)
    }
    return Math.round((making + metalValue * taxRate) * 100) / 100
  }, [lines, goldPrice, stampTaxRate])

  const mutation = useMutation({
    mutationFn: async () => {
      let resolvedSupplierId = Number(supplierId)
      if (newSupplierMode) {
        const created = await createSupplier({
          name: newSupplierName.trim(),
          phone: newSupplierPhone.trim(),
        })
        resolvedSupplierId = created.id
      }

return createPurchase({
        branchId: activeBranchId ?? 0,
        supplierId: resolvedSupplierId,
        totalAmount,
        goldPrice21AtPurchase: goldPrice || null,
        isInitialStock,
        paymentType,
        stampTaxRate: amountToNumber(stampTaxRate) / 100,
        tradeInSettleMode: paymentType === 'goldTradeIn' ? settleMode : 0,
        goldExchanges:
          paymentType === 'goldTradeIn'
            ? exchanges.map((e) => ({
                sourceType: e.sourceType,
                productId: e.productId,
                storageId: Number(e.storageId),
                weight: amountToNumber(e.weight),
                fromKarat: amountToNumber(e.fromKarat),
                toKarat: amountToNumber(e.toKarat ?? ''),
              }))
            : undefined,
        invoiceImageFile: invoiceImage?.file ?? null,
        idCardImageFile:
          partyMode === 'customer' ? (idCardImage?.file ?? null) : null,
        products: lines
          .filter((l) => l.productName.trim() && amountToNumber(l.weight) > 0)
          .map((l) => ({
            productName: l.productName.trim(),
            weight: amountToNumber(l.weight),
            karat: amountToNumber(l.karat),
            typegolde: Number(l.typegolde),
            factory: amountToNumber(l.factory),
            factoryForSale: amountToNumber(l.factoryForSale),
            quantity: amountToNumber(l.quantity) || 1,
            size: Math.trunc(amountToNumber(l.size ?? '')),
            storageId: Number(l.storageId),
            imageLink: l.imageLink?.trim() || '',
          })),
      })
    },
    onSuccess: (data) => {
      const party: ReceiptParty | null = (() => {
        if (newSupplierMode)
          return {
            name: newSupplierName.trim() || null,
            phone: newSupplierPhone.trim() || null,
          }
        if (!supplierId) return null
        const list = partyMode === 'customer' ? customers : suppliers
        const found = list.find((s) => String(s.id) === supplierId)
        return found
          ? { name: found.name, phone: found.phone ?? null }
          : null
      })()
      setSavedResult({ purchase: data, party, isCustomer: partyMode === 'customer' })
      toast.success('تم تسجيل عملية الشراء بنجاح وحدث الجرد')
      setLines([])
      setSupplierId('')
      setPartyMode('supplier')
      setPaymentType('cash')
      setSettleMode(0)
      setStampTaxRate('1')
      setExchanges([])
      setNewSupplierMode(false)
      setNewSupplierName('')
      setNewSupplierPhone('')
      setInvoiceImage(null)
      setIdCardImage(null)
      invalidateAfterPurchase(queryClient)
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(
        error.response?.data?.message ?? 'فشل تسجيل الشراء. تأكد من البيانات.',
      )
    },
  })

  function openBlankPieceDialog() {
    setPieceInitial(EMPTY_PIECE_DRAFT)
    setPieceDialogOpen(true)
  }

  function confirmPiece(draft: PieceDraft) {
    setLines((prev) => [...prev, toLine(draft)])
    toast.success('أُضيفت القطعة للفاتورة')
  }

  function removeLine(key: number) {
    setLines((prev) => prev.filter((l) => l.key !== key))
  }

  function addExchangeFromUnit(unit: InventoryUnitRecord) {
    setExchanges((prev) => [...prev, buildExchangeFromUnit(unit)])
  }

  function addAllExchangeUnits(unitsToAdd: InventoryUnitRecord[]) {
    const existing = new Set(exchanges.map((e) => e.inventoryUnitId).filter(Boolean))
    const toAdd = unitsToAdd.filter((u) => !existing.has(u.inventoryUnitId))
    if (toAdd.length === 0) return
    const newLines = toAdd.map((u) => buildExchangeFromUnit(u))
    setExchanges((prev) => [...prev, ...newLines])
    toast.success(`تمت إضافة ${newLines.length} قطعة للاستبدال`)
  }

  function clearAllExchanges() {
    if (exchanges.length === 0) return
    setExchanges([])
    toast.info('تم تفريغ قطع الاستبدال')
  }

  function removeExchange(key: number) {
    setExchanges((prev) => prev.filter((e) => e.key !== key))
  }

  function pickProduct(p: Product) {
    setPieceInitial({
      productName: p.productName,
      weight: String(p.weight || ''),
      karat: String(p.karat || 21),
      typegolde: String(p.typegolde ?? 1),
      factory: p.factory ? String(p.factory) : '',
      factoryForSale: p.factoryForSale ? String(p.factoryForSale) : '',
      quantity: '1',
      size: p.size ? String(p.size) : '',
    })
    setPickerOpen(false)
    setPieceDialogOpen(true)
  }

  async function handleCreateCustomer() {
    const name = newCustomerName.trim()
    const idcard = newCustomerIdCard.trim()
    if (!name) {
      toast.error('اكتب اسم العميل.')
      return
    }
    if (!idcard) {
      toast.error('اكتب رقم البطاقة — يُعرّف العميل بنظام المحل.')
      return
    }
    try {
      const created = await createCustomer({
        name,
        phone: newCustomerPhone.trim(),
        idcard,
      })
      setSupplierId(String(created.id))
      setCustomerDialogOpen(false)
      setNewCustomerName('')
      setNewCustomerPhone('')
      setNewCustomerIdCard('')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('تم إنشاء العميل ' + created.name + ' واختياره في الفاتورة')
    } catch {
      toast.error('فشل إنشاء العميل.')
    }
  }

  async function handleCreateStorage(name: string) {
    const created = await createStorage(name, activeBranchId ?? undefined)
    queryClient.invalidateQueries({ queryKey: ['storages'] })
    toast.success('تم إنشاء المخزن ' + (created.name || created.location || name))
    return created
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (newSupplierMode && !newSupplierName.trim()) {
      toast.error('اكتب اسم المورد الجديد.')
      return
    }
if (!newSupplierMode && !supplierId) {
      toast.error(
        partyMode === 'customer'
          ? 'اختر العميل أو أنشئ عميلاً جديداً.'
          : 'اختر المورد أو فعّل "مورد جديد".',
      )
      return
    }
    if (!invoiceImage) {
      toast.error('أرفق صورة فاتورة الشراء — إلزامية.')
      return
    }
    if (partyMode === 'customer' && !idCardImage) {
      toast.error('أرفق صورة البطاقة الشخصية للعميل — إلزامية.')
      return
    }
    if (partyMode === 'customer' && (!goldPrice || goldPrice <= 0)) {
      toast.error('لم يصل سعر الشراء بعد — انتظر لحظة ثم أعد المحاولة.')
      return
    }
    const validLines = lines.filter(
      (l) => l.productName.trim() && amountToNumber(l.weight) > 0,
    )
    if (validLines.length === 0) {
      toast.error('أضف قطعة واحدة على الأقل (اسم + وزن صالح).')
      return
    }
    if (validLines.some((l) => !l.storageId)) {
      toast.error('حدّد مخزن التخزين لكل قطعة.')
      return
    }
if (paymentType === 'goldTradeIn') {
      if (exchanges.length === 0) {
        toast.error('اختر قطعة استبدال واحدة على الأقل.')
        return
      }
      for (const e of exchanges) {
        if (!e.storageId) {
          toast.error('حدّد مخزن الاستبدال لكل قطعة قبل الحفظ.')
          return
        }
        if (amountToNumber(e.weight) <= 0 || amountToNumber(e.fromKarat) <= 0) {
          toast.error('تأكد من صلاحية وزن وعيار كل قطعة استبدال.')
          return
        }
        if (e.sourceType === 'storeItem' && !e.productId) {
          toast.error('اختر القطعة من المخزن لبند الاستبدال.')
          return
        }
      }
    }

    mutation.mutate()
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            onClick={() => navigate('/app/purchases')}
            className="size-11 shrink-0 rounded-full border-black/10 bg-white touch-target"
            aria-label="العودة للمشتريات"
          >
            <ArrowRight className="size-5" />
          </Button>
          <div>
            <h1 className="text-[24px] font-bold leading-[1.2] text-foreground sm:text-[28px]">
              فاتورة شراء جديدة
            </h1>
            <p className="text-muted-foreground">
              سجّل القطع المشتراة — يُحدَّث الجرد تلقائياً.
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="hidden h-12 gap-2 rounded-full px-6 touch-target sm:inline-flex"
        >
          <Save className="size-5" />
          {mutation.isPending ? 'جارٍ الحفظ...' : 'حفظ الفاتورة'}
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
          <div className="min-w-0 space-y-4">
            <div className="space-y-4 rounded-2xl border border-black/10 bg-white p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>طريقة الدفع</Label>
                <div className="mt-1.5 flex items-center gap-1 rounded-full border border-black/10 bg-black/5 p-1">
                  <button
                    type="button"
                    onClick={() => setPaymentType('cash')}
                    className={cn(
                      'flex h-9 flex-1 touch-target items-center justify-center gap-1.5 rounded-full text-[14px] font-semibold transition-colors',
                      paymentType === 'cash'
                        ? 'bg-primary text-white'
                        : 'text-muted-foreground hover:bg-black/5',
                    )}
                  >
                    <Coins className="size-4" />
                    شراء كاش
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (partyMode === 'customer') {
                        setPartyMode('supplier')
                        setNewSupplierMode(false)
                        setSupplierId('')
                      }
                      setPaymentType('goldTradeIn')
                    }}
                    className={cn(
                      'flex h-9 flex-1 touch-target items-center justify-center gap-1.5 rounded-full text-[14px] font-semibold transition-colors',
                      paymentType === 'goldTradeIn'
                        ? 'bg-primary text-white'
                        : 'text-muted-foreground hover:bg-black/5',
                    )}
                  >
                    <ArrowLeftRight className="size-4" />
                    تبديل رصيد ذهب
                  </button>
                </div>
                {paymentType === 'goldTradeIn' && (
                  <p className="mt-2 text-[13px] leading-[1.6] text-muted-foreground">
                    تُسلَّم ذهب قديم (كسر أو قطع من المخزن) بدل قيمة الفاتورة —
                    مع تحويل العيار وجني الفارق نقداً أو كمديونية للطرف الآخر.
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
                  <div className="space-y-0.5 pe-3">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="size-4 text-amber-600" />
                      <span className="text-[13.5px] font-bold text-foreground">
                        رصيد أول المدة (بضاعة افتتاحية)
                      </span>
                    </div>
                    <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                      عند التفعيل، تُضاف القطع كبضاعة افتتاحية إلى المخزن دون خصم نقدية من الخزينة.
                    </p>
                  </div>
                  <Switch
                    checked={isInitialStock}
                    onCheckedChange={setIsInitialStock}
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <Label>نوع الشراء</Label>
                <div className="mt-1.5 flex items-center gap-1 rounded-full border border-black/10 bg-black/5 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPartyMode('supplier')
                      setNewSupplierMode(false)
                      setSupplierId('')
                    }}
                    className={cn(
                      'flex h-9 flex-1 touch-target items-center justify-center gap-1.5 rounded-full text-[14px] font-semibold transition-colors',
                      partyMode === 'supplier'
                        ? 'bg-primary text-white'
                        : 'text-muted-foreground hover:bg-black/5',
                    )}
                  >
                    <Store className="size-4" />
                    شراء من مورد
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPartyMode('customer')
                      setNewSupplierMode(false)
                      setSupplierId('')
                      setPaymentType('cash')
                    }}
                    className={cn(
                      'flex h-9 flex-1 touch-target items-center justify-center gap-1.5 rounded-full text-[14px] font-semibold transition-colors',
                      partyMode === 'customer'
                        ? 'bg-primary text-white'
                        : 'text-muted-foreground hover:bg-black/5',
                    )}
                  >
                    <Users className="size-4" />
                    شراء من عميل
                  </button>
                </div>
              </div>

              {partyMode === 'supplier' ? (
                <div className="space-y-2">
                  <Label>المورد</Label>
                  <Select
                    value={supplierId}
                    onValueChange={setSupplierId}
                    disabled={newSupplierMode}
                  >
                    <SelectTrigger className="w-full h-12 rounded-[14px]">
                      <SelectValue placeholder="اختر المورد" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 gap-1.5 rounded-full px-3 text-sm text-primary hover:bg-primary/10 hover:text-primary touch-target"
                    onClick={() => setNewSupplierMode((v) => !v)}
                  >
                    <Store className="size-4" />
                    {newSupplierMode ? 'اختيار مورد موجود' : 'مورد جديد'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>العميل *</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger className="w-full h-12 rounded-[14px]">
                      <SelectValue placeholder="اختر العميل" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.length === 0 ? (
                        <p className="py-3 text-center text-[13px] text-muted-foreground">
                          لا يوجد عملاء — استخدم «عميل جديد» لإنشائه من هنا.
                        </p>
                      ) : (
                        customers.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCustomerDialogOpen(true)}
                    className="h-9 gap-1.5 rounded-full px-3 text-sm text-primary hover:bg-primary/10 hover:text-primary touch-target"
                  >
                    <UserPlus className="size-4" />
                    عميل جديد
                  </Button>
                </div>
              )}

              {partyMode === 'supplier' && (
                <div className="space-y-2">
                  <Label htmlFor="stamp-tax-rate">نسبة الدمغة والضريبة (%)</Label>
                  <Input
                    id="stamp-tax-rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={stampTaxRate}
                    onChange={(e) => setStampTaxRate(e.target.value)}
                    placeholder="1.00"
                    className="h-12 touch-target rounded-[14px]"
                  />
                  <p className="text-[12px] leading-[1.5] text-muted-foreground">
                    نُسبة تُطبق على سعر الذهب في كل سطر. الافتراضي 1%.
                  </p>
                </div>
              )}

              {partyMode === 'supplier' && newSupplierMode && (
                <div className="sm:col-span-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-supplier-name">اسم المورد *</Label>
                    <Input
                      id="new-supplier-name"
                      value={newSupplierName}
                      onChange={(e) => setNewSupplierName(e.target.value)}
                      placeholder="مثال: شركة الذهب الأبيض"
                      className="h-12 touch-target rounded-[14px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-supplier-phone">الهاتف</Label>
                    <Input
                      id="new-supplier-phone"
                      value={newSupplierPhone}
                      onChange={(e) => setNewSupplierPhone(e.target.value)}
                      placeholder="01xxxxxxxxx"
                      dir="ltr"
                      className="h-12 touch-target rounded-[14px] text-start"
                    />
                  </div>
              </div>
              )}

              <div className="border-t border-black/10 pt-4">
              <div className="mb-3 flex items-center gap-2">
                <Paperclip className="size-4 text-muted-foreground" />
                <Label className="text-[15px] font-semibold">
                  مرفقات الفاتورة
                </Label>
              </div>
              <div className={cn(
                'grid grid-cols-1 gap-3',
                partyMode === 'customer' && 'sm:grid-cols-2',
              )}>
<AttachmentInput
                  label="صورة فاتورة الشراء (مطلوب)"
                  required
                  value={invoiceImage}
                  onChange={setInvoiceImage}
                />
                {partyMode === 'customer' && (
                  <AttachmentInput
                    label="صورة البطاقة الشخصية للعميل (مطلوب)"
                    required
                    value={idCardImage}
                    onChange={setIdCardImage}
                  />
                )}
              </div>
              </div>
            </div>

            {paymentType === 'goldTradeIn' && (
              <div className="space-y-3 rounded-2xl border border-primary/30 bg-primary/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Scale className="size-5" />
                    </span>
                    <div>
                      <Label className="text-[16px] font-semibold">
                        الذهب المستبدل (Trade-In)
                      </Label>
                      <p className="text-[13px] text-muted-foreground">
                        الذهب الذي يُسلَّم بدل قيمة الفاتورة — يُحسب تحويل العيار
تلقائياً ويُخصم من المخزن.
                      </p>
                    </div>
                  </div>
                </div>

<TwentyOneKConversionBar
                  purchasedByKarat={byKarat}
                  purchased21={received21}
                  givenByKarat={givenByKarat}
                  given21={given21}
                  goldPrice={goldPrice}
                  settlementResidual={settlementResidual}
                />

                <div className="space-y-2 rounded-2xl border border-primary/25 bg-primary/[0.04] p-3">
                  <Label className="text-[13px] font-semibold">
                    أداة تسوية الفاتورة
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSettleMode(0)}
                      className={cn(
                        'touch-target rounded-[16px] border p-3 text-start transition-colors',
                        settleMode === 0
                          ? 'border-primary bg-primary/10'
                          : 'border-black/10 bg-white hover:bg-black/5',
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            'flex size-4 items-center justify-center rounded-full border-2',
                            settleMode === 0
                              ? 'border-primary'
                              : 'border-black/30',
                          )}
                        >
                          {settleMode === 0 && (
                            <span className="size-2 rounded-full bg-primary" />
                          )}
                        </span>
                        <Landmark
                          className={cn(
                            'size-4',
                            settleMode === 0
                              ? 'text-primary'
                              : 'text-muted-foreground',
                          )}
                        />
                        <span className="text-[13px] font-bold text-foreground">
                          مديونية
                        </span>
                      </span>
                      <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">
                        فارق الذهب ذهباً، والمصنعية والدمغة نقداً لصالح المحل
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettleMode(1)}
                      className={cn(
                        'touch-target rounded-[16px] border p-3 text-start transition-colors',
                        settleMode === 1
                          ? 'border-primary bg-primary/10'
                          : 'border-black/10 bg-white hover:bg-black/5',
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            'flex size-4 items-center justify-center rounded-full border-2',
                            settleMode === 1
                              ? 'border-primary'
                              : 'border-black/30',
                          )}
                        >
                          {settleMode === 1 && (
                            <span className="size-2 rounded-full bg-primary" />
                          )}
                        </span>
                        <Banknote
                          className={cn(
                            'size-4',
                            settleMode === 1
                              ? 'text-primary'
                              : 'text-muted-foreground',
                          )}
                        />
                        <span className="text-[13px] font-bold text-foreground">
                          تسديد نقدي
                        </span>
                      </span>
                      <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">
                        الفارق + المصنعية والدمغة من/إلى الخزينة دفعة واحدة
                      </span>
                    </button>
                  </div>

                  <div className="space-y-1 rounded-xl bg-black/5 px-3 py-2 text-[12px]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-muted-foreground">فارق عيار 21</span>
                      <span
                        className={cn(
                          'font-bold tabular-nums',
                          diff21 > 0
                            ? 'text-success'
                            : diff21 < 0
                              ? 'text-error'
                              : 'text-foreground',
                        )}
                      >
                        {diff21 > 0 ? '+' : ''}
                        {formatNumber(diff21)} gm
                        {goldPrice > 0 && diffCash !== 0 && (
                          <span className="font-normal text-muted-foreground">
                            {' '}
                            — {formatEgp(diffCash)}
                          </span>
                        )}
                      </span>
                    </div>
                    {settlementResidual > 0 && (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-muted-foreground">
                          مصنعية ودمغة
                        </span>
                        <span className="font-semibold tabular-nums text-foreground">
                          {formatEgp(settlementResidual)}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-black/10 pt-1">
                      <span className="text-muted-foreground">
                        {settleMode === 0 ? 'يُسجَّل كالتالي' : 'إجمالي التسوية النقدية'}
                      </span>
                      <span className="font-bold tabular-nums text-primary">
                        {settleMode === 0
                          ? `ذهب ${diff21 > 0 ? '+' : ''}${formatNumber(diff21)} جم` +
                            (settlementResidual > 0
                              ? ` + نقد ${formatEgp(settlementResidual)}`
                              : '')
                          : diffCashSigned + settlementResidual > 0
                            ? `تستحق من الخزينة ${formatEgp(diffCashSigned + settlementResidual)}`
                            : diffCashSigned + settlementResidual < 0
                              ? `مستحقة للمحل ${formatEgp(Math.abs(diffCashSigned + settlementResidual))}`
                              : 'صفر — متوازن'}
                      </span>
                    </div>
                  </div>
                </div>

                <ExchangePiecePicker
                  storages={storages}
                  selectedStorage={effectiveExchangeStorage}
                  onStorageChange={setExchangeStorage}
                  units={inventoryUnits}
                  exchanges={exchanges}
                  onAdd={addExchangeFromUnit}
                  onAddAll={addAllExchangeUnits}
                  onRemove={removeExchange}
                  onClearAll={clearAllExchanges}
                />
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/70 p-3">
                <Label className="text-[16px] font-semibold">
                  القطع المشتراة *
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPickerOpen(true)}
                    className="h-10 gap-1.5 rounded-full px-4 text-sm touch-target"
                  >
                    <Package className="size-4" />
                    من التعريفات
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={openBlankPieceDialog}
                    className="h-10 gap-1.5 rounded-full px-4 text-sm touch-target"
                  >
                    <Plus className="size-4" />
                    إضافة قطعة
                  </Button>
                </div>
              </div>

              <div className="space-y-3 px-1">
                {committedLines.length === 0 && (
                  <button
                    type="button"
                    onClick={openBlankPieceDialog}
                    className="flex w-full flex-col items-center gap-2 rounded-[14px] border border-dashed border-primary/30 bg-primary/[0.04] p-6 text-center transition-colors hover:bg-primary/[0.08] touch-target"
                  >
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Plus className="size-6" />
                    </span>
                    <span className="text-[15px] font-bold text-foreground">
                      لم تُضف قطع بعد
                    </span>
                    <span className="text-[13px] text-muted-foreground">
                      اضغط هنا لفتح نافذة إضافة قطعة
                    </span>
                  </button>
                )}

                {committedLines.map((line, index) => (
                  <CommittedLineRow
                    key={line.key}
                    line={line}
                    index={index}
                    goldPrice={goldPrice}
                    includeTax={partyMode !== 'customer'}
                    commissionRate={partyMode === 'customer' ? customerCommissionRate : 0}
                    taxRate={amountToNumber(stampTaxRate) / 100}
                    onRemove={removeLine}
                    onPreview={line.imageLink ? () => setPreviewPiece(line) : undefined}
                  />
                ))}
              </div>
            </div>
          </div>

          </div>

          <div className="xl:sticky xl:top-6 xl:self-start">
            <div className="space-y-4 rounded-2xl border border-black/10 bg-white p-4 elevation-card">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Package className="size-5" />
                </span>
                <h2 className="text-[17px] font-bold text-foreground">
                  ملخص الفاتورة
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-secondary p-3">
                  <p className="text-[12px] text-muted-foreground">عدد القطع</p>
                  <p className="mt-1 text-[20px] font-bold tabular-nums text-foreground">
                    {formatNumber(pieceCount)}
                  </p>
                </div>
                <div className="rounded-xl bg-secondary p-3">
                  <p className="text-[12px] text-muted-foreground">الوزن الكلي</p>
                  <p className="mt-1 text-[20px] font-bold tabular-nums text-foreground">
                    {formatNumber(totalWeight)} <span className="text-[12px] font-semibold">gm</span>
                  </p>
                </div>
              </div>
              <div className="space-y-2.5 text-[15px]">
                <div className="space-y-1.5 border-t border-dashed border-black/10 pt-2.5">
                  <p className="text-[13px] font-semibold text-muted-foreground">
                    تفصيل حسب العيار
                  </p>
                  {byKarat.length === 0 ? (
                    <p className="text-[13px] text-muted-foreground">
                      أدخل سطراً بعيار صحيح
                    </p>
                  ) : (
byKarat.map((row) => (
                        <div
                          key={row.karat}
                          className="flex items-center justify-between text-[13px]"
                        >
                          <span className="font-semibold tabular-nums text-foreground">
                            {row.karat}K
                          </span>
                          <span className="tabular-nums text-muted-foreground">
                            {formatNumber(row.pieces)} قطعة •{' '}
                            {formatNumber(row.weight)} gm • معادل{' '}
                            {formatNumber(round3((row.weight * row.karat) / 21))} gm
                          </span>
                        </div>
                      ))
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">سعر الذهب (21)</span>
                  {goldPrice ? (
                    <span className="font-semibold tabular-nums text-foreground">
                      {formatEgp(purchasePerGram(goldPrice, 21))}
                    </span>
                  ) : (
                    <Skeleton className="h-5 w-20" />
                  )}
                </div>
                {goldPrice ? (
                  <div className="rounded-xl bg-black/5 p-2.5 text-[13px] text-muted-foreground">
                    سعر الشراء/جم —{' '}
                    <span className="font-semibold tabular-nums text-foreground">
                      18K {formatEgp(purchasePerGram(goldPrice, 18))}
                    </span>
                    {' • '}
                    <span className="font-semibold tabular-nums text-foreground">
                      21K {formatEgp(purchasePerGram(goldPrice, 21))}
                    </span>
                    {' • '}
                    <span className="font-semibold tabular-nums text-foreground">
                      24K {formatEgp(purchasePerGram(goldPrice, 24))}
                    </span>
                  </div>
                ) : null}
                <div className="mt-1 rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-bold text-primary">
                      الإجمالي
                    </span>
                    <span className="rounded-lg bg-primary px-2.5 py-1 text-[20px] font-bold tabular-nums text-white shadow-sm">
                      {formatEgp(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={mutation.isPending}
                className="h-12 w-full gap-2 rounded-full touch-target text-[15px] font-semibold"
              >
                <Save className="size-5" />
                {mutation.isPending ? 'جارٍ الحفظ...' : 'حفظ الفاتورة'}
              </Button>
            </div>
          </div>
        </div>
      </form>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>اختر منتجاً من التعريفات</DialogTitle>
            <DialogDescription>
              سيُفتح ديلوج إضافة قطعة مملوءاً ببياناته للمراجعة والتأكيد.
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 sm:p-6 space-y-2">
            {productsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
              </div>
            ) : products.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                لا توجد تعريفات منتجات بعد — أنشئها من صفحة المنتجات أولاً.
              </p>
            ) : (
              <div className="space-y-2">
                {products.map((p) => (
                  <button
                    key={p.productId}
                    type="button"
                    onClick={() => pickProduct(p)}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white p-3 text-start transition-colors hover:border-primary/40 hover:bg-primary/5 touch-target"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-foreground">
                        {p.productName}
                      </p>
                      <p className="text-[13px] text-muted-foreground">
                        عيار {p.karat}k • وزن {formatNumber(p.weight)} gm
                      </p>
                    </div>
                    <Plus className="size-5 shrink-0 text-primary" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إنشاء عميل جديد</DialogTitle>
            <DialogDescription>
              أنشئ العميل في سجلات المحل ثم سيُختار تلقائياً في هذه الفاتورة.
            </DialogDescription>
          </DialogHeader>
          <div className="p-5 sm:p-6 space-y-3">
            <div className="space-y-1">
              <Label className="text-[13px]">اسم العميل *</Label>
              <Input
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="مثال: أحمد محمد"
                className="h-11 touch-target rounded-[14px]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[13px]">رقم الهاتف</Label>
              <Input
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="h-11 touch-target rounded-[14px]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[13px]">رقم البطاقة *</Label>
              <Input
                value={newCustomerIdCard}
                onChange={(e) => setNewCustomerIdCard(e.target.value)}
                placeholder="الرقم القومي / رقم البطاقة"
                className="h-11 touch-target rounded-[14px]"
              />
            </div>
            <Button
              type="button"
              onClick={handleCreateCustomer}
              className="h-12 w-full gap-2 rounded-full touch-target"
            >
              <UserPlus className="size-5" />
              إنشاء العميل واختياره
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AddPieceDialog
        open={pieceDialogOpen}
        onOpenChange={setPieceDialogOpen}
        goldPrice={goldPrice}
        initial={pieceInitial}
        includeTax={partyMode !== 'customer'}
        commissionRate={partyMode === 'customer' ? customerCommissionRate : 0}
        taxRate={amountToNumber(stampTaxRate) / 100}
        storages={storages}
        onCreateStorage={handleCreateStorage}
        input21={paymentType === 'goldTradeIn' ? given21 : undefined}
        output21={paymentType === 'goldTradeIn' ? received21 : undefined}
        branchId={activeBranchId ?? undefined}
        onConfirm={confirmPiece}
      />

      <Dialog open={previewPiece != null} onOpenChange={(open) => !open && setPreviewPiece(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[18px]">
              صورة القطعة — {previewPiece?.productName}
            </DialogTitle>
            <DialogDescription>
              {previewPiece ? (
                <>
                  {amountToNumber(previewPiece.karat) || 0}K •{' '}
                  {formatNumber(amountToNumber(previewPiece.weight) * (amountToNumber(previewPiece.quantity) || 1))} gm•{' '}
                  {formatNumber(amountToNumber(previewPiece.quantity) || 1)} قطعة
                </>
              ) : (
                ''
              )}
            </DialogDescription>
          </DialogHeader>
          {previewPiece?.imageLink && (
            <div className="p-5 sm:p-6 pt-0">
              <div className="overflow-hidden rounded-2xl border border-black/10 bg-black/5">
                <img
                  src={previewPiece.imageLink}
                  alt={previewPiece.productName}
                  className="max-h-[65vh] w-full object-contain"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PurchaseReceiptDialog
        open={savedResult != null}
        purchase={savedResult?.purchase ?? null}
        party={savedResult?.party ?? null}
        isCustomer={savedResult?.isCustomer ?? false}
        onClose={() => setSavedResult(null)}
      />
    </div>
  )
}

function CommittedLineRow({
  line,
  index,
  goldPrice,
  includeTax,
  commissionRate = 0,
  taxRate = 0.01,
  onRemove,
  onPreview,
}: {
  line: PurchaseLineDraft
  index: number
  goldPrice: number
  includeTax: boolean
  commissionRate?: number
  taxRate?: number
  onRemove: (key: number) => void
  onPreview?: () => void
}) {
  const weight = amountToNumber(line.weight)
  const quantity = amountToNumber(line.quantity) || 1
  const supplierMaking = amountToNumber(line.factory)
  const storeMaking = amountToNumber(line.factoryForSale)
  const m = purchaseLineMath(
    goldPrice,
    amountToNumber(line.karat),
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
  const typeLabel =
    typeOptions.find((o) => o.value === line.typegolde)?.label ?? '—'

  return (
    <div className="rounded-2xl border border-black/5 bg-secondary/40 p-3 elevation-card">
      <div className="flex items-center justify-between gap-2 border-b border-black/10 pb-2">
        <span className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-muted-foreground">
          {line.imageLink && onPreview ? (
            <button
              type="button"
              onClick={onPreview}
              aria-label={`عرض صورة القطعة ${index + 1}: ${line.productName}`}
              className="flex size-10 shrink-0 touch-target items-center justify-center overflow-hidden rounded-xl border border-black/10 bg-white"
            >
              <img
                src={line.imageLink}
                alt=""
                className="size-full object-cover"
              />
            </button>
          ) : (
            <CheckCircle2 className="size-4 shrink-0 text-success" />
          )}
          القطعة {index + 1}
          <span className="truncate text-foreground">{line.productName}</span>
        </span>
        <button
          type="button"
          aria-label={`حذف القطعة ${index + 1}`}
          onClick={() => onRemove(line.key)}
          className="flex size-8 shrink-0 touch-target items-center justify-center rounded-full text-error hover:bg-error/10"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[13px] sm:grid-cols-3">
        <p>
          <span className="text-muted-foreground">العيار: </span>
          <span className="font-semibold tabular-nums text-foreground">
            {amountToNumber(line.karat) || 0}K
          </span>
        </p>
        <p>
          <span className="text-muted-foreground">النوع: </span>
          <span className="font-semibold text-foreground">{typeLabel}</span>
        </p>
        {amountToNumber(line.size ?? '') > 0 && (
          <p>
            <span className="text-muted-foreground">المقاس: </span>
            <span className="font-semibold tabular-nums text-foreground">
              {formatNumber(amountToNumber(line.size ?? ''))}
            </span>
          </p>
        )}
        <p>
          <span className="text-muted-foreground">الكمية: </span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatNumber(quantity)} قطعة
          </span>
        </p>
        <p>
          <span className="text-muted-foreground">الوزن الكلي: </span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatNumber(weight * quantity)} gm
          </span>
        </p>
        <p>
          <span className="text-muted-foreground">مصنعية المورد/جم: </span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatNumber(supplierMaking)}
          </span>
        </p>
      </div>

      <div className="mt-3 space-y-1 rounded-xl bg-white px-3 py-2 text-[13px]">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">سعر الذهب</span>
          <span className="font-semibold tabular-nums text-foreground">
            {goldPrice > 0 ? formatEgp(goldValue) : '—'}
          </span>
        </div>
        {includeTax && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              دمغة وضريبة ({(taxRate * 100).toFixed(2)}%)
            </span>
            <span className="font-semibold tabular-nums text-foreground">
              {goldPrice > 0 ? formatEgp(stampAndTax) : '—'}
            </span>
          </div>
        )}
        {!includeTax && commissionRate > 0 && commission > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              عمولة الشراء من عميل ({(commissionRate * 100).toFixed(2)}%)
            </span>
            <span className="font-semibold tabular-nums text-error">
              −{goldPrice > 0 ? formatEgp(commission) : '—'}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">مصنعية المورد (تُضاف)</span>
          <span className="font-semibold tabular-nums text-foreground">
            {formatEgp(supplierMaking * weight * quantity)}
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

      <div className="mt-3 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
        <span className="text-[13px] font-semibold text-primary">إجمالي السطر</span>
        <span className="text-[17px] font-bold tabular-nums text-primary">
          {formatEgp(lineTotal)}
        </span>
      </div>
    </div>
  )
}

function AttachmentInput({
  label,
  required = false,
  value,
  onChange,
}: {
  label: string
  required?: boolean
  value: AttachedFile | null
  onChange: (value: AttachedFile | null) => void
}) {
  const inputId = useId()

  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1 text-[13px]">
        {label}
        {required && (
          <span className="text-error" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {value ? (
        <div className="flex items-center gap-3 rounded-[14px] border border-black/10 bg-white p-2">
          <img
            src={value.preview}
            alt=""
            className="size-14 shrink-0 rounded-[10px] object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-foreground">
              {value.file.name}
            </p>
            <button
              type="button"
              onClick={() => {
                URL.revokeObjectURL(value.preview)
                onChange(null)
              }}
              className="mt-0.5 text-[13px] font-semibold text-error touch-target"
            >
              إزالة الصورة
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="flex h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-[14px] border border-dashed border-black/10 bg-black/[0.02] text-muted-foreground transition-colors hover:bg-black/5"
        >
          <ImagePlus className="size-5" />
          <span className="text-[13px] font-medium">
            اضغط لاختيار صورة من الجهاز
          </span>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onChange({ file, preview: URL.createObjectURL(file) })
            }}
          />
        </label>
      )}
    </div>
  )
}