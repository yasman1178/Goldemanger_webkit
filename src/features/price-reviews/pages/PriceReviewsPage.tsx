import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CalendarDays, CheckCheck, Filter, Scale, SearchX } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Switch } from '@/shared/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { PAGE_SIZE, usePaginablePage } from '@/shared/lib/pagination'
import { PaginationBar } from '@/shared/components/ui/pagination'
import { useAuthStore } from '@/shared/stores/auth-store'
import { getOverview } from '@/features/settings/api'
import { formatEgp, formatNumber } from '@/shared/lib/utils'
import { extractServerMessage } from '@/shared/lib/serverError'
import { acknowledgeDeviation, getPriceDeviations } from '@/features/price-reviews/api'
import type { PriceDeviation } from '@/features/price-reviews/types'

/**
 * مراجعة انحرافات الأسعار: السجل الذي يكتبه الخادم لكل فاتورة تجاوز فيها
 * الفرق العتبة. المراقبة التي لا تُقرأ ليست مراقبة — هذه الشاشة هي عينها.
 *
 * الاعتماد هنا يختم السجل ولا يحذفه: الفرق بين «راجعت ووافقت» و«لم أرَ شيئاً»
 * هو ما يفرّق خطأ الحساب عن التلاعب عند أول جرد جدّي.
 */
export function PriceReviewsPage() {
  const queryClient = useQueryClient()
  const roles = useAuthStore((s) => s.user?.roles ?? [])
  const canReview = roles.includes('Owner') || roles.includes('Manager')
  const isOwner = roles.includes('Owner')

  const [page, setPage] = useState(1)
  const [kind, setKind] = useState<'' | 'Sale' | 'Purchase'>('')
  const [branchFilter, setBranchFilter] = useState('')
  const [unackOnly, setUnackOnly] = useState(true)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [ackTarget, setAckTarget] = useState<PriceDeviation | null>(null)
  const [ackNote, setAckNote] = useState('')

  const { data: overview } = useQuery({
    queryKey: ['settings-overview'],
    queryFn: getOverview,
    staleTime: 5 * 60 * 1000,
    enabled: canReview,
  })
  const branches = overview?.branches ?? []

  const branchId =
    branchFilter === '' || branchFilter === 'all'
      ? undefined
      : Number(branchFilter)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      'price-deviations',
      branchId ?? null,
      kind,
      unackOnly,
      from,
      to,
      page,
    ],
    queryFn: () =>
      getPriceDeviations({
        branchId,
        kind,
        unacknowledgedOnly: unackOnly,
        from: from || undefined,
        to: to || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    enabled: canReview,
  })

  const items = data?.data ?? []
  const totalCount = data?.totalCount ?? 0
  const { page: safePage, pageCount, goToPage } = usePaginablePage(
    totalCount,
    page,
    PAGE_SIZE,
    setPage,
  )

  const ackMutation = useMutation({
    mutationFn: (target: { id: number; note: string }) =>
      acknowledgeDeviation(target.id, target.note),
    onSuccess: () => {
      toast.success('تم اعتماد الانحراف وختمه في السجل.')
      setAckTarget(null)
      setAckNote('')
      void queryClient.invalidateQueries({ queryKey: ['price-deviations'] })
    },
    onError: (err: unknown) => {
      toast.error(extractServerMessage(err, 'تعذّر اعتماد الانحراف.'))
    },
  })

  if (!canReview) {
    return (
      <div className="space-y-6 pb-20">
        <h1 className="text-[34px] font-bold leading-[1.2] text-foreground">
          مراجعة انحرافات الأسعار
        </h1>
        <Card className="rounded-[14px] elevation-card">
          <CardContent className="p-6 text-center text-[14px] text-muted-foreground">
            هذه الشاشة من صلاحية صاحب المحل والمدير فقط.
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeFilterCount =
    (kind ? 1 : 0) +
    (branchFilter && branchFilter !== 'all' ? 1 : 0) +
    (unackOnly ? 0 : 0) +
    (from ? 1 : 0) +
    (to ? 1 : 0)

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[34px] font-bold leading-[1.2] text-foreground">
            مراجعة انحرافات الأسعار
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            فواتير تجاوز فيها الإجمالي المُرسَل حساب الخادم بأكثر من جنيه واحد.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setFiltersOpen(true)}
          className="h-12 gap-2 rounded-full px-5 touch-target"
        >
          <Filter className="size-5" />
          <span>الفلاتر</span>
          {activeFilterCount > 0 && (
            <span className="tabular-nums rounded-full bg-primary px-2 py-0.5 text-[12px] font-bold text-white">
              {formatNumber(activeFilterCount)}
            </span>
          )}
        </Button>
      </div>

      {isError && (
        <Card className="rounded-[14px] elevation-card border-error/40">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <span className="text-[14px] font-semibold text-error">
              تعذّر تحميل السجل.
            </span>
            <Button
              type="button"
              variant="outline"
              onClick={() => refetch()}
              className="h-11 rounded-full px-5 touch-target"
            >
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-[14px]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="rounded-[14px] elevation-card">
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <SearchX className="size-8 text-muted-foreground" />
            <p className="text-[15px] font-bold text-foreground">
              لا توجد انحرافات مسجَّلة
            </p>
            <p className="text-[13px] text-muted-foreground">
              {unackOnly
                ? 'كل الفواتير المراجَعة مطابقة — أو لم يُسجَّل أي انحراف بعد.'
                : 'لم يُسجَّل أي انحراف ضمن هذه الفلاتر.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((d) => (
            <Card
              key={d.id}
              className="rounded-[14px] elevation-card"
            >
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={d.kind === 'Sale' ? 'default' : 'secondary'}
                      className="rounded-full"
                    >
                      {d.kind === 'Sale' ? 'بيع' : 'شراء'}
                    </Badge>
                    {d.documentId != null && (
                      <span className="text-[12px] text-muted-foreground tabular-nums">
                        فاتورة #{formatNumber(d.documentId)}
                      </span>
                    )}
                  </div>
                  {d.isAcknowledged ? (
                    <Badge
                      variant="outline"
                      className="gap-1 rounded-full text-success border-success/40"
                    >
                      <CheckCheck className="size-3.5" />
                      معتمَد
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="rounded-full text-warning border-warning/40"
                    >
                      بانتظار المراجعة
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[11px] text-muted-foreground">المُرسَل</p>
                    <p className="text-[15px] font-bold tabular-nums text-foreground">
                      {formatEgp(d.actualAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">حساب الخادم</p>
                    <p className="text-[15px] font-bold tabular-nums text-foreground">
                      {formatEgp(d.expectedAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">الفرق</p>
                    <p className="text-[15px] font-bold tabular-nums text-error">
                      {d.difference > 0 ? '+' : ''}
                      {formatEgp(d.difference)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
                  {d.serverGold21 != null && d.serverGold21 > 0 && (
                    <span className="tabular-nums">
                      سعر الخادم 21: {formatEgp(d.serverGold21)}
                    </span>
                  )}
                  {d.clientGold21 != null && d.clientGold21 > 0 && (
                    <span className="tabular-nums">
                      سعر الواجهة 21: {formatEgp(d.clientGold21)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <CalendarDays className="size-3.5" />
                    {new Date(d.createdAt).toLocaleString('ar-EG')}
                  </span>
                </div>

                {d.userNote && (
                  <p className="rounded-[10px] bg-secondary/70 px-3 py-2 text-[12px] text-foreground">
                    {d.userNote}
                  </p>
                )}

                {!d.isAcknowledged && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setAckTarget(d)
                      setAckNote('')
                    }}
                    className="h-11 w-full gap-2 rounded-full touch-target"
                  >
                    <CheckCheck className="size-4" />
                    اعتماد بعد المراجعة
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <PaginationBar
          page={safePage}
          pageCount={pageCount}
          totalCount={totalCount}
          onChange={goToPage}
        />
      )}

      {/* الفلاتر في حوار — لا صفوف تستهلك مساحة الشاشة */}
      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-bold">
              فلاتر سجل الانحرافات
            </DialogTitle>
            <DialogDescription>
              تضييق السجل حسب نوع الفاتورة والفرع والفترة.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>نوع الفاتورة</Label>
              <Select
                value={kind || 'all'}
                onValueChange={(v) => {
                  setKind(v === 'all' ? '' : (v as 'Sale' | 'Purchase'))
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-12 rounded-[14px] touch-target">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="Sale">بيع</SelectItem>
                  <SelectItem value="Purchase">شراء</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isOwner && branches.length > 1 && (
              <div className="space-y-1.5">
                <Label>الفرع</Label>
                <Select
                  value={branchFilter || 'all'}
                  onValueChange={(v) => {
                    setBranchFilter(v === 'all' ? '' : v)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="h-12 rounded-[14px] touch-target">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الفروع</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.branchId} value={String(b.branchId)}>
                        {b.branchName || `فرع #${b.branchId}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 rounded-[14px] border border-black/10 px-3 py-2">
              <Label htmlFor="unack-only" className="text-[13px] font-semibold">
                غير المعتمَدة فقط
              </Label>
              <Switch
                id="unack-only"
                checked={unackOnly}
                onCheckedChange={(v) => {
                  setUnackOnly(v)
                  setPage(1)
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dev-from">من تاريخ</Label>
                <Input
                  id="dev-from"
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value)
                    setPage(1)
                  }}
                  className="h-12 rounded-[14px] touch-target"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dev-to">إلى تاريخ</Label>
                <Input
                  id="dev-to"
                  type="date"
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value)
                    setPage(1)
                  }}
                  className="h-12 rounded-[14px] touch-target"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="h-11 rounded-full px-6 touch-target"
            >
              تم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* الاعتماد بملاحظة موثقة — لا حذف للسجل أبداً */}
      <Dialog
        open={ackTarget != null}
        onOpenChange={(o) => {
          if (!o) setAckTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-bold">
              اعتماد الانحراف
            </DialogTitle>
            <DialogDescription>
              {ackTarget && (
                <>
                  فاتورة {ackTarget.kind === 'Sale' ? 'بيع' : 'شراء'}
                  {ackTarget.documentId != null &&
                    ` #${ackTarget.documentId}`} بفرق{' '}
                  <span className="tabular-nums font-bold text-error">
                    {formatEgp(ackTarget.difference)}
                  </span>
                  . الاعتماد يختم السجل ولا يحذفه.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label htmlFor="ack-note">ملاحظة المراجعة (اختيارية)</Label>
            <Textarea
              id="ack-note"
              value={ackNote}
              onChange={(e) => setAckNote(e.target.value)}
              placeholder="مثال: سعر يدوي معتمد هاتفياً من العميل قبل الإرسال."
              className="min-h-24 rounded-[14px]"
            />
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAckTarget(null)}
              className="h-11 rounded-full px-5 touch-target"
            >
              إلغاء
            </Button>
            <Button
              type="button"
              disabled={ackMutation.isPending || ackTarget == null}
              onClick={() =>
                ackTarget &&
                ackMutation.mutate({ id: ackTarget.id, note: ackNote })
              }
              className="h-11 gap-2 rounded-full px-6 touch-target"
            >
              <Scale className="size-4" />
              {ackMutation.isPending ? 'جارٍ الاعتماد...' : 'اعتماد وختم'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
