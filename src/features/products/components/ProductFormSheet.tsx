import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ImagePlus, Info, Loader2, Trash2 } from 'lucide-react'

import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { JEWELRY_ITEM_NAMES } from '@/shared/lib/jewelryItems'
import { preparePiecePhoto } from '@/shared/lib/imageCompress'
import { resolveProductImage } from '@/shared/lib/seo'
import {
  createProduct,
  deleteProductImage,
  getProduct,
  updateProduct,
  uploadProductImages,
} from '@/features/products/api'
import type {
  CreateProductPayload,
  Designgole,
  Product,
  ProductImageRecord,
  Typegolde,
} from '@/features/products/types'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { Switch } from '@/shared/components/ui/switch'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

const typeOptions: { value: Typegolde; label: string }[] = [
  { value: 1, label: 'جديد' },
  { value: 2, label: 'مجدّد' },
  { value: 3, label: 'كسر' },
  { value: 4, label: 'فضة' },
]

const designOptions: { value: Designgole; label: string }[] = [
  { value: 0, label: 'كلاسيك' },
  { value: 1, label: 'بسيط' },
  { value: 2, label: 'مخرّز' },
  { value: 3, label: 'مودرن' },
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
}

export function ProductFormSheet({ open, onOpenChange, product = null }: Props) {
  const activeBranchId = useActiveBranchId()
  const queryClient = useQueryClient()
  const isEdit = Boolean(product)

  const [name, setName] = useState(product?.productName ?? '')
  const [description, setDescription] = useState(product?.productDescription ?? '')
  const [productType, setProductType] = useState(product?.productType ?? '')
  const [size, setSize] = useState(product?.size ? String(product.size) : '')
  const [factory, setFactory] = useState(
    product?.factory ? String(product.factory) : '',
  )
  const [factoryForSale, setFactoryForSale] = useState(
    product?.factoryForSale ? String(product.factoryForSale) : '',
  )
  const [weight, setWeight] = useState(
    product?.weight ? String(product.weight) : '',
  )
  const [karat, setKarat] = useState(
    product?.karat ? String(product.karat) : '',
  )
  const [design, setDesign] = useState<Designgole>(
    (product?.design as Designgole) ?? 0,
  )
  const [typegolde, setTypegolde] = useState<Typegolde>(
    (product?.typegolde as Typegolde) ?? 1,
  )
  const [notes, setNotes] = useState(product?.notes ?? '')
  const [isActive, setIsActive] = useState(product?.isActive ?? true)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<ProductImageRecord[]>(
    product?.images ?? [],
  )
  const [imageBusy, setImageBusy] = useState(false)

  async function handleImagesSelected(fileList: FileList | null) {
    if (!product || !fileList || fileList.length === 0) return
    setImageBusy(true)
    try {
      const prepared = await Promise.all(
        Array.from(fileList).map((file) => preparePiecePhoto(file)),
      )
      await uploadProductImages(product.productId, prepared)
      const fresh = await getProduct(product.productId)
      setImages(fresh.images ?? [])
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('تم رفع الصور بنجاح')
    } catch {
      toast.error('تعذّر رفع الصور. تأكد من الصلاحيات وحاول مرة أخرى.')
    } finally {
      setImageBusy(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDeleteImage(imageId: number) {
    if (!product) return
    setImageBusy(true)
    try {
      await deleteProductImage(imageId)
      setImages((prev) => prev.filter((img) => img.productImageId !== imageId))
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('تم حذف الصورة')
    } catch {
      toast.error('تعذّر حذف الصورة. تأكد من الصلاحيات وحاول مرة أخرى.')
    } finally {
      setImageBusy(false)
    }
  }

  const mutation = useMutation({
    mutationFn: (payload: CreateProductPayload) =>
      isEdit && product
        ? updateProduct(product.productId, payload)
        : createProduct(payload),
    onSuccess: () => {
      toast.success(
        isEdit
          ? 'تم تحديث تعريف المنتج بنجاح'
          : 'تم إنشاء تعريف المنتج بنجاح',
      )
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onOpenChange(false)
    },
    onError: (error: {
      response?: { data?: { errors?: Record<string, string[]>; message?: string } }
    }) => {
      const data = error?.response?.data
      const firstError = data?.errors
        ? Object.values(data.errors)[0]?.[0]
        : undefined
      toast.error(firstError ?? data?.message ?? 'فشل حفظ المنتج. تأكد من البيانات وحاول مرة أخرى.')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim() || !karat || !weight) {
      toast.error('الاسم، العيار والوزن حقول مطلوبة.')
      return
    }

    mutation.mutate({
      productName: name.trim(),
      productDescription: description.trim(),
      productType: productType.trim(),
      size: Number(size) || 0,
      factory: Number(factory) || 0,
      factoryForSale: Number(factoryForSale) || 0,
      weight: Number(weight) || 0,
      karat: Number(karat) || 0,
      design,
      typegolde,
      isActive,
      imageLink: product?.imageLink ?? '',
      notes: notes.trim(),
      branchId: activeBranchId ?? 0,
      storageId: product?.storageId ?? null,
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 bg-white p-0 sm:w-[min(94vw,760px)] sm:max-w-none lg:w-[820px]"
      >
        <SheetHeader className="border-b border-black/5 bg-secondary/40 px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3 pe-10">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Info className="size-5" />
            </span>
            <div className="min-w-0">
              <SheetTitle className="text-[20px] font-semibold">
                {isEdit ? 'تعديل تعريف المنتج' : 'تعريف منتج جديد'}
              </SheetTitle>
              <SheetDescription className="mt-0.5 line-clamp-2">
                {isEdit
                  ? 'عدّل بيانات تعريف المنتج ثم احفظ التغييرات.'
                  : 'أنشئ تعريف المنتج — لا يدخل الجرد هنا حتى تُسجَّل فاتورة شراء.'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-7">
            {!isEdit && (
              <div className="flex items-start gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-[14px] leading-[1.6] text-foreground">
                <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  تعريف المنتج لا يدخل الجرد. سيُستخدم كمرجع لاحقاً في فاتورة الشراء
                  والبيع — الكمية تُحدَّد من سجلات الجرد فقط.
                </span>
              </div>
            )}

            {isEdit && (
              <div className="space-y-3 rounded-2xl border border-black/10 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ImagePlus className="size-4 text-primary" />
                    <Label className="text-[15px] font-semibold">صور المنتج</Label>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImagesSelected(e.target.files)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={imageBusy}
                    onClick={() => fileInputRef.current?.click()}
                    className="h-10 gap-1.5 rounded-full px-4 text-xs font-bold touch-target"
                  >
                    {imageBusy ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <ImagePlus className="size-3.5" />
                    )}
                    إضافة صور
                  </Button>
                </div>

                {images.length === 0 ? (
                  <p className="text-sm text-muted-foreground">لا توجد صور بعد.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {images.map((img) => (
                      <div
                        key={img.productImageId}
                        className="relative overflow-hidden rounded-[12px] border border-black/5 bg-secondary"
                      >
                        <img
                          src={resolveProductImage(img.imageUrl)}
                          alt="صورة المنتج"
                          className="aspect-square w-full object-cover"
                        />
                        {img.isPrimary && (
                          <span className="absolute start-1 top-1 rounded-full bg-primary px-1.5 py-px text-[9px] font-bold text-white">
                            أساسية
                          </span>
                        )}
                        <button
                          type="button"
                          aria-label="حذف الصورة"
                          disabled={imageBusy}
                          onClick={() => handleDeleteImage(img.productImageId)}
                          className="absolute end-1 top-1 flex size-7 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-error touch-target"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  تُضغط الصور تلقائياً ويُضاف شريط اسم المحل كعلامة مائية.
                </p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">اسم المنتج *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: خاتم ذهب 21"
                  className="h-12 touch-target rounded-[14px]"
                />
                <Select
                  value=""
                  onValueChange={(v) => v && setName(v)}
                >
                  <SelectTrigger className="h-11 w-full rounded-[14px] text-xs text-muted-foreground">
                    <SelectValue placeholder="أو اختر من الأصناف الشائعة…" />
                  </SelectTrigger>
                  <SelectContent>
                    {JEWELRY_ITEM_NAMES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="desc">الوصف</Label>
                <Input
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف مختصر"
                  className="h-12 touch-target rounded-[14px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="type">نوع القطعة</Label>
                <Input
                  id="type"
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  placeholder="نوع/صنف"
                  className="h-12 touch-target rounded-[14px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">المقاس</Label>
                <Input
                  id="size"
                  type="number"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="0"
                  className="h-12 touch-target rounded-[14px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="karat">العيار (كارات) *</Label>
                <Input
                  id="karat"
                  type="number"
                  value={karat}
                  onChange={(e) => setKarat(e.target.value)}
                  placeholder="21"
                  className="h-12 touch-target rounded-[14px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">الوزن (جرام) *</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0.00"
                  className="h-12 touch-target rounded-[14px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="factory">المصنعية عند الشراء</Label>
                <Input
                  id="factory"
                  type="number"
                  step="0.01"
                  value={factory}
                  onChange={(e) => setFactory(e.target.value)}
                  placeholder="0.00"
                  className="h-12 touch-target rounded-[14px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="factory-for-sale">المصنعية عند البيع</Label>
                <Input
                  id="factory-for-sale"
                  type="number"
                  step="0.01"
                  value={factoryForSale}
                  onChange={(e) => setFactoryForSale(e.target.value)}
                  placeholder="0.00"
                  className="h-12 touch-target rounded-[14px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>نوع الذهب</Label>
                <Select
                  value={typegolde.toString()}
                  onValueChange={(v) => setTypegolde(Number(v) as Typegolde)}
                >
                  <SelectTrigger className="w-full h-12 rounded-[14px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value.toString()}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>التصميم</Label>
              <Select
                value={design.toString()}
                onValueChange={(v) => setDesign(Number(v) as Designgole)}
              >
                <SelectTrigger className="w-full h-12 rounded-[14px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {designOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value.toString()}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white p-4">
              <div>
                <Label className="text-[15px] font-semibold">الحالة</Label>
                <p className="text-sm text-muted-foreground">
                  {isActive ? 'نشط — متاح للاستخدام' : 'غير نشط'}
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                aria-label="حالة المنتج"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي ملاحظات إضافية"
                className="h-12 touch-target rounded-[14px]"
              />
            </div>
          </div>

          <SheetFooter className="border-t border-black/5 bg-white p-5 sm:px-7">
            <div className="flex w-full gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-12 flex-1 rounded-full touch-target"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="h-12 flex-1 rounded-full touch-target"
              >
                {mutation.isPending
                  ? 'جارٍ الحفظ...'
                  : isEdit
                    ? 'حفظ التعديلات'
                    : 'حفظ التعريف'}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}