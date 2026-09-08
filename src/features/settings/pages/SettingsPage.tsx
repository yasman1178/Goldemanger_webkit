import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Building2,
  ClipboardCheck,
  Settings2,
  Store,
  UserCog,
  Users,
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
} from 'lucide-react'

import { useAuthStore } from '@/shared/stores/auth-store'
import {
  getStoreProfile,
  updateStoreProfile,
  getOverview,
  addBranch,
  updateBranch,
  deleteBranch,
  getEmployees,
  addEmployee,
  updateEmployee,
  updateEmployeeRoles,
  disableEmployee,
  getKeyValues,
  upsertKeyValue,
  getOnboardingStatus,
  completeOnboarding,
  createInitialCompany,
} from '@/features/settings/api'
import type {
  BranchSummary,
  EmployeeItem,
  StoreProfile,
} from '@/features/settings/types'
import { cn, formatEgp } from '@/shared/lib/utils'
import { extractServerMessage } from '@/shared/lib/serverError'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { Skeleton } from '@/shared/components/ui/skeleton'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'

const roleLabels: Record<string, string> = {
  Owner: 'صاحب المحل',
  Manager: 'مدير',
  Sale: 'بائع',
  Responsible: 'مسؤول',
}

function roleBadge(role: string) {
  if (role === 'Owner') return 'default' as const
  if (role === 'Manager') return 'secondary' as const
  return 'outline' as const
}

export function SettingsPage() {
  const roles = useAuthStore((s) => s.user?.roles ?? [])
  const branchId = useAuthStore((s) => s.branchId)
  const isOwner = roles.includes('Owner')

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <ShieldCheck className="size-12 text-muted-foreground" />
        <p className="text-[17px] font-semibold text-foreground">
          هذه الصفحة مخصصة لصاحب المحل فقط
        </p>
      </div>
    )
  }

  if (!branchId) return <InitialCompanySetup />

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5 pb-20 lg:space-y-6">
      <div className="flex items-center gap-3 rounded-[18px] border border-black/5 bg-white p-4 elevation-card sm:p-5">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Settings2 className="size-6" />
        </div>
        <div>
          <h1 className="text-[28px] font-bold leading-[1.2] text-foreground sm:text-[34px]">
            الإعدادات
          </h1>
          <p className="text-[13px] text-muted-foreground sm:text-[15px]">
            إدارة بيانات المحل والفروع والموظفين
          </p>
        </div>
      </div>

      <Tabs defaultValue="store" dir="rtl" className="items-start md:flex-row">
        <TabsList className="flex h-12 min-h-12 w-full max-w-full shrink-0 justify-start gap-1 overflow-x-auto rounded-2xl bg-white p-1 elevation-card md:h-fit md:w-56 md:flex-col md:items-stretch md:overflow-visible md:rounded-[18px] md:p-2">
          <TabsTrigger value="store" className="h-11 min-w-max justify-start gap-2 rounded-xl px-4 md:w-full md:flex-none">
            <Store className="size-4" />
            بيانات المحل
          </TabsTrigger>
          <TabsTrigger value="branches" className="h-11 min-w-max justify-start gap-2 rounded-xl px-4 md:w-full md:flex-none">
            <Building2 className="size-4" />
            الفروع والمحلات
          </TabsTrigger>
          <TabsTrigger value="employees" className="h-11 min-w-max justify-start gap-2 rounded-xl px-4 md:w-full md:flex-none">
            <Users className="size-4" />
            المستخدمون
          </TabsTrigger>
          <TabsTrigger value="settings" className="h-11 min-w-max justify-start gap-2 rounded-xl px-4 md:w-full md:flex-none">
            <Settings2 className="size-4" />
            إعدادات عامة
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="h-11 min-w-max justify-start gap-2 rounded-xl px-4 md:w-full md:flex-none">
            <ClipboardCheck className="size-4" />
            التحويل الابتدائي
          </TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="mt-5">
          <StoreSection />
        </TabsContent>
        <TabsContent value="branches" className="mt-5">
          <BranchesSection />
        </TabsContent>
        <TabsContent value="employees" className="mt-5">
          <EmployeesSection />
        </TabsContent>
        <TabsContent value="settings" className="mt-5">
          <KeyValuesSection />
        </TabsContent>
        <TabsContent value="onboarding" className="mt-5">
          <OnboardingSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InitialCompanySetup() {
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const [companyName, setCompanyName] = useState('')
  const [branchName, setBranchName] = useState('')
  const [city, setCity] = useState('')
  const [location, setLocation] = useState('')
  const [country, setCountry] = useState('EG')
  const mutation = useMutation({
    mutationFn: () =>
      createInitialCompany({ companyName, branchName, city, location, country }),
    onSuccess: () => {
      toast.success('تم إنشاء الشركة والفرع الأول. سجّل الدخول مجددًا بعد تفعيل الاشتراك.')
      clearAuth()
    },
    onError: (error: unknown) =>
      toast.error(extractServerMessage(error, 'تعذّر إنشاء الشركة والفرع الأول')),
  })

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 pb-20">
      <Card className="elevation-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[20px]">
            <Building2 className="size-5 text-primary" />
            إعداد الشركة لأول مرة
          </CardTitle>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            أنشئ بيانات الشركة والفرع الأول. بعد ذلك يراجع مدير النظام الشركة ويفعّلها
            ويضيف الاشتراك.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldRow label="اسم الشركة">
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="h-12 rounded-[14px] touch-target" />
          </FieldRow>
          <FieldRow label="اسم الفرع الأول">
            <Input value={branchName} onChange={(e) => setBranchName(e.target.value)} className="h-12 rounded-[14px] touch-target" />
          </FieldRow>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldRow label="المدينة">
              <Input value={city} onChange={(e) => setCity(e.target.value)} className="h-12 rounded-[14px] touch-target" />
            </FieldRow>
            <FieldRow label="العنوان">
              <Input value={location} onChange={(e) => setLocation(e.target.value)} className="h-12 rounded-[14px] touch-target" />
            </FieldRow>
          </div>
          <FieldRow label="دولة التشغيل / العملة">
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="h-12 w-full rounded-[14px] touch-target">
                <SelectValue placeholder="اختر الدولة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EG">مصر — جنيه مصري (ج.م)</SelectItem>
                <SelectItem value="SA">السعودية — ريال سعودي (ر.س)</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
          <Button
            type="button"
            className="h-12 w-full rounded-full touch-target"
            disabled={mutation.isPending || !companyName.trim() || !branchName.trim()}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'جارٍ إنشاء الشركة...' : 'إنشاء الشركة والفرع الأول'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function StoreSection() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['settings-store'],
    queryFn: getStoreProfile,
  })
  const [form, setForm] = useState<Partial<StoreProfile> | null>(null)
  const current = form ?? data ?? {}

  const mutation = useMutation({
    mutationFn: updateStoreProfile,
    onSuccess: () => {
      toast.success('تم حفظ بيانات المحل')
      queryClient.invalidateQueries({ queryKey: ['settings-store'] })
      setForm(null)
    },
    onError: () => toast.error('تعذّر حفظ بيانات المحل'),
  })

  if (isLoading) return <LoadingCard />

  function setField(key: keyof StoreProfile, value: string) {
    setForm({ ...(form ?? {}), [key]: value })
  }

  return (
    <Card className="w-full max-w-4xl elevation-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[15px] font-bold">
          <Store className="size-4" />
          بيانات المحل
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FieldRow label="اسم المحل">
          <Input
            value={current.name ?? ''}
            onChange={(e) => setField('name', e.target.value)}
            className="h-11 rounded-[14px] touch-target"
          />
        </FieldRow>
        <FieldRow label="هاتف المحل (يظهر في صور المشاركة)">
          <Input
            value={current.phone ?? ''}
            onChange={(e) => setField('phone', e.target.value)}
            placeholder="01xxxxxxxxx"
            inputMode="tel"
            dir="ltr"
            className="h-11 rounded-[14px] touch-target"
          />
        </FieldRow>
        <FieldRow label="العنوان">
          <Input
            value={current.location ?? ''}
            onChange={(e) => setField('location', e.target.value)}
            className="h-11 rounded-[14px] touch-target"
          />
        </FieldRow>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldRow label="المدينة">
            <Input
              value={current.city ?? ''}
              onChange={(e) => setField('city', e.target.value)}
              className="h-11 rounded-[14px] touch-target"
            />
          </FieldRow>
          <FieldRow label="المنطقة/المحطة">
            <Input
              value={current.station ?? ''}
              onChange={(e) => setField('station', e.target.value)}
              className="h-11 rounded-[14px] touch-target"
            />
          </FieldRow>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldRow label="السجل التجاري">
            <Input
              value={current.commercialRegistrationNumber ?? ''}
              onChange={(e) => setField('commercialRegistrationNumber', e.target.value)}
              className="h-11 rounded-[14px] touch-target"
            />
          </FieldRow>
          <FieldRow label="البطاقة الضريبية">
            <Input
              value={current.taxCardNumber ?? ''}
              onChange={(e) => setField('taxCardNumber', e.target.value)}
              className="h-11 rounded-[14px] touch-target"
            />
          </FieldRow>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            onClick={() => mutation.mutate(current)}
            disabled={mutation.isPending}
            className="h-11 rounded-full touch-target"
          >
            {mutation.isPending ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function FieldRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-semibold">{label}</Label>
      {children}
    </div>
  )
}

function BranchesSection() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['settings-overview'],
    queryFn: getOverview,
  })
  const [dialog, setDialog] = useState<{ mode: 'add' } | { mode: 'edit'; branch: BranchSummary } | null>(null)

  return (
    <Card className="elevation-card">
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-[15px] font-bold">
          <Building2 className="size-4" />
          الفروع والمحلات
          {data?.companyName ? ` — ${data.companyName}` : ''}
        </CardTitle>
        <Button
          type="button"
          size="sm"
          className="gap-2 rounded-full touch-target"
          onClick={() => setDialog({ mode: 'add' })}
        >
          <Plus className="size-4" />
          إضافة فرع
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-[13px] leading-relaxed text-foreground">
          <Building2 className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            يمكنك إضافة الفروع من هذا الحساب بعد تفعيل الشركة واشتراكها بواسطة مدير النظام.
            كل فرع جديد يحصل على نفس تاريخ انتهاء الاشتراك الحالي.
          </p>
        </div>
        {isLoading ? (
          <div className="space-y-3 py-3">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : !data || data.branches.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            لا توجد فروع بعد. أضف أول فرع.
          </div>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {data.branches.map((branch) => (
              <div
                key={branch.branchId}
                className="rounded-2xl border border-black/5 bg-black/[0.02] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[15px] font-bold text-foreground">
                      {branch.branchName}
                    </p>
                    <p className="text-[13px] text-muted-foreground">
                      {[branch.city, branch.location, branch.station]
                        .filter(Boolean)
                        .join(' — ') || 'لا يوجد عنوان'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label="تعديل الفرع"
                      className="rounded-full touch-target"
                      onClick={() => setDialog({ mode: 'edit', branch })}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label="حذف الفرع"
                      className="rounded-full text-error hover:text-error touch-target"
                      onClick={() => {
                        if (!window.confirm(`هل تريد حذف فرع «${branch.branchName}»؟`)) return
                        void deleteBranch(branch.branchId)
                          .then(() => {
                            toast.success('تم حذف الفرع')
                            queryClient.invalidateQueries({ queryKey: ['settings-overview'] })
                          })
                          .catch(() => toast.error('تعذّر حذف الفرع. قد يكون مرتبطاً ببيانات.'))
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Stat label="المبيعات" value={formatEgp(branch.totalSales)} />
                  <Stat label="الكاش" value={formatEgp(branch.cash)} positive />
                  <Stat label="الموظفون" value={String(branch.employees.length)} />
                </div>

                {branch.buyFromCustomerCommission != null && (
                  <p className="mt-2 text-[12px] text-muted-foreground">
                    عمولة الشراء من عميل:{' '}
                    <span className="font-bold text-foreground tabular-nums">
                      {(branch.buyFromCustomerCommission * 100).toFixed(2)}%
                    </span>
                  </p>
                )}

                {branch.employees.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {branch.employees.map((emp) => (
                      <Badge key={emp.id} variant="outline" className="gap-1">
                        {emp.fullName}
                        {emp.roles[0] && (
                          <span className="text-muted-foreground">
                            ({roleLabels[emp.roles[0]] ?? emp.roles[0]})
                          </span>
                        )}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <BranchDialog
        key={dialog?.mode === 'edit' ? `edit-${dialog.branch.branchId}` : dialog === null ? 'closed' : 'add'}
        dialog={dialog}
        onClose={() => setDialog(null)}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['settings-overview'] })
          setDialog(null)
        }}
      />
    </Card>
  )
}

function Stat({
  label,
  value,
  positive,
}: {
  label: string
  value: string
  positive?: boolean
}) {
  return (
    <div className="rounded-xl bg-white p-3">
      <p className="text-[12px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          'text-[16px] font-bold tabular-nums',
          positive ? 'text-success' : 'text-foreground',
        )}
      >
        {value}
      </p>
    </div>
  )
}

function BranchDialog({
  dialog,
  onClose,
  onSaved,
}: {
  dialog: { mode: 'add' } | { mode: 'edit'; branch: BranchSummary } | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = dialog?.mode === 'edit'
  const branch = isEdit ? (dialog as { mode: 'edit'; branch: BranchSummary }).branch : null
  const [name, setName] = useState(() => (branch ? (branch.branchName ?? '') : ''))
  const [city, setCity] = useState(() => (branch ? (branch.city ?? '') : ''))
  const [location, setLocation] = useState(() => (branch ? (branch.location ?? '') : ''))
  const [station, setStation] = useState(() => (branch ? (branch.station ?? '') : ''))
  const [country, setCountry] = useState(() => (branch?.country ? branch.country : 'EG'))
  const [commissionPct, setCommissionPct] = useState(() => {
    const v = branch?.buyFromCustomerCommission
    if (v == null) return '1.5'
    return String(Math.round(v * 10000) / 100)
  })

  const open = dialog !== null

  const mutation = useMutation({
    mutationFn: () => {
      const pct = Number(commissionPct) || 0
      const payload = {
        branchName: name,
        citey: city,
        location,
        station,
        country,
        buyFromCustomerCommission: Math.max(0, pct / 100),
      }
      return isEdit && branch
        ? updateBranch(branch.branchId, payload)
        : addBranch(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'تم تعديل الفرع' : 'تمت إضافة الفرع')
      onSaved()
    },
    onError: () => toast.error('تعذّر حفظ الفرع'),
  })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'تعديل فرع' : 'إضافة فرع'}</DialogTitle>
          <DialogDescription>أدخل بيانات الفرع</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FieldRow label="اسم الفرع">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: فرع وسط البلد"
              className="h-11 rounded-[14px] touch-target"
            />
          </FieldRow>
          <FieldRow label="المدينة">
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="h-11 rounded-[14px] touch-target"
            />
          </FieldRow>
          <FieldRow label="العنوان">
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-11 rounded-[14px] touch-target"
            />
          </FieldRow>
          <FieldRow label="المنطقة/المحطة">
            <Input
              value={station}
              onChange={(e) => setStation(e.target.value)}
              className="h-11 rounded-[14px] touch-target"
            />
          </FieldRow>
          <FieldRow label="دولة التشغيل / العملة">
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="h-11 w-full rounded-[14px] touch-target">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EG">مصر — جنيه مصري (ج.م)</SelectItem>
                <SelectItem value="SA">السعودية — ريال سعودي (ر.س)</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label="عمولة الشراء من عميل (% من سعر الذهب)">
            <Input
              value={commissionPct}
              onChange={(e) => setCommissionPct(e.target.value)}
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              dir="ltr"
              placeholder="1.5"
              className="h-11 rounded-[14px] touch-target"
            />
          </FieldRow>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-11 rounded-full touch-target"
          >
            إلغاء
          </Button>
          <Button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !name.trim()}
            className="h-11 rounded-full touch-target"
          >
            {mutation.isPending ? 'جارٍ الحفظ...' : 'حفظ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EmployeesSection() {
  const queryClient = useQueryClient()
  const { data: branches } = useQuery({
    queryKey: ['settings-overview'],
    queryFn: getOverview,
  })
  const { data, isLoading } = useQuery({
    queryKey: ['settings-employees'],
    queryFn: getEmployees,
  })
  const [dialog, setDialog] = useState<{
    mode: 'add'
  } | { mode: 'edit'; employee: EmployeeItem } | null>(null)

  return (
    <Card className="elevation-card">
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-[15px] font-bold">
          <UserCog className="size-4" />
          المستخدمون والأدوار
        </CardTitle>
        <Button
          type="button"
          size="sm"
          className="gap-2 rounded-full touch-target"
          onClick={() => setDialog({ mode: 'add' })}
        >
          <Plus className="size-4" />
          إضافة موظف
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3 py-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            لا يوجد موظفون بعد.
          </div>
        ) : (
          <div className="overflow-x-auto">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead className="text-end">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-semibold text-foreground">
                    {emp.fullName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {emp.phone || '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {emp.roles.length === 0 ? (
                        <Badge variant="outline">بدون دور</Badge>
                      ) : (
                        emp.roles.map((r) => (
                          <Badge key={r} variant={roleBadge(r)}>
                            {roleLabels[r] ?? r}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label="تعديل"
                        className="rounded-full touch-target"
                        onClick={() => setDialog({ mode: 'edit', employee: emp })}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label="تعطيل"
                        className="rounded-full text-error hover:text-error touch-target"
                        onClick={() => {
                          if (!window.confirm(`هل تريد تعطيل الموظف «${emp.fullName ?? ''}»؟`)) return
                          void disableEmployee(emp.id)
                            .then(() => {
                              toast.success('تم تعطيل الموظف')
                              queryClient.invalidateQueries({ queryKey: ['settings-employees'] })
                              queryClient.invalidateQueries({ queryKey: ['settings-overview'] })
                            })
                            .catch((error: unknown) =>
                              toast.error(
                                extractServerMessage(error, 'تعذّر تعطيل الموظف'),
                              ),
                            )
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          </div>
        )}
      </CardContent>

      <EmployeeDialog
        key={dialog?.mode === 'edit' ? `edit-${dialog.employee.id}` : dialog === null ? 'closed' : 'add'}
        dialog={dialog}
        branches={branches?.branches ?? []}
        onClose={() => setDialog(null)}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['settings-employees'] })
          queryClient.invalidateQueries({ queryKey: ['settings-overview'] })
          setDialog(null)
        }}
      />
    </Card>
  )
}

function EmployeeDialog({
  dialog,
  branches,
  onClose,
  onSaved,
}: {
  dialog: { mode: 'add' } | { mode: 'edit'; employee: EmployeeItem } | null
  branches: BranchSummary[]
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = dialog?.mode === 'edit'
  const emp = isEdit
    ? (dialog as { mode: 'edit'; employee: EmployeeItem }).employee
    : null
  const [fullName, setFullName] = useState(() => (emp ? (emp.fullName ?? '') : ''))
  const [phone, setPhone] = useState(() => (emp ? (emp.phone ?? '') : ''))
  const [email, setEmail] = useState(() => (emp ? (emp.email ?? '') : ''))
  const [cardNumber, setCardNumber] = useState(() => (emp ? (emp.cardNumber ?? '') : ''))
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('Sale')
  const [roleDraft, setRoleDraft] = useState(() => (emp ? (emp.roles.includes('Manager') ? 'Manager' : 'Sale') : 'Sale'))
  const [branchId, setBranchId] = useState(() => (emp ? (emp.branchId != null ? String(emp.branchId) : '') : ''))

  const open = dialog !== null

  // أدوار Owner/Responsible محمية في الـ Backend (Forbid) — لا نحاول تغييرها أصلاً
  const rolesLocked = Boolean(
    isEdit && emp && (emp.roles.includes('Owner') || emp.roles.includes('Responsible')),
  )

  const addMutation = useMutation({
    mutationFn: () =>
      addEmployee({
        fullName,
        phoneNumber: phone,
        email,
        cardNumber,
        password,
        role,
        branchId: branchId ? Number(branchId) : null,
      }),
    onSuccess: () => {
      toast.success('تمت إضافة الموظف')
      onSaved()
    },
    onError: (error: unknown) => {
      toast.error(extractServerMessage(error, 'تعذّرت إضافة الموظف'))
    },
  })

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!emp) return
      await updateEmployee(emp.id, {
        fullName,
        phoneNumber: phone,
        email,
        cardNumber,
        branchId: branchId ? Number(branchId) : null,
        password: password.trim() ? password.trim() : undefined,
      })
      const nextRoles = [roleDraft]
      if (!rolesLocked && JSON.stringify(nextRoles) !== JSON.stringify(emp.roles)) {
        await updateEmployeeRoles(emp.id, nextRoles)
      }
    },
    onSuccess: () => {
      toast.success('تم حفظ التعديلات')
      onSaved()
    },
    onError: (error: unknown) => {
      toast.error(extractServerMessage(error, 'تعذّر حفظ التعديلات'))
    },
  })

  const pending = addMutation.isPending || editMutation.isPending

  function submit() {
    if (!fullName.trim()) {
      toast.error('اكتب الاسم الكامل للموظف.')
      return
    }
    if (!branchId) {
      toast.error('اختر فرع الموظف.')
      return
    }
    if ((!isEdit || password.trim()) && password.trim().length < 6) {
      toast.error(
        isEdit
          ? 'كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف (أو اتركها فارغة لإبقائها).'
          : 'اكتب كلمة مرور لا تقل عن 6 أحرف.',
      )
      return
    }
    if (isEdit) editMutation.mutate()
    else addMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'تعديل موظف' : 'إضافة موظف'}</DialogTitle>
          <DialogDescription>أدخل بيانات الموظف وأدواره</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FieldRow label="الاسم الكامل">
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11 rounded-[14px] touch-target"
            />
          </FieldRow>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldRow label="رقم الهاتف">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11 rounded-[14px] touch-target"
              />
            </FieldRow>
            <FieldRow label="رقم البطاقة">
              <Input
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="h-11 rounded-[14px] touch-target"
              />
            </FieldRow>
          </div>
          <FieldRow label="البريد الإلكتروني">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-[14px] touch-target"
            />
          </FieldRow>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldRow label="الفرع">
              <Select
                value={branchId}
                onValueChange={(v) => setBranchId(v)}
              >
                <SelectTrigger className="h-11 w-full rounded-[14px] touch-target">
                  <SelectValue placeholder="اختر الفرع" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.branchId} value={String(b.branchId)}>
                      {b.branchName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="الدور">
              <Select
                value={roleDraft}
                onValueChange={(v) => {
                  setRoleDraft(v)
                  setRole(v)
                }}
                disabled={rolesLocked}
              >
                <SelectTrigger className="h-11 w-full rounded-[14px] touch-target">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sale">بائع</SelectItem>
                  <SelectItem value="Manager">مدير</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>
          </div>
          <FieldRow
            label={isEdit ? 'كلمة المرور الجديدة (اتركها فارغة لإبقائها)' : 'كلمة المرور'}
          >
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isEdit && Boolean(emp?.roles.includes('Owner'))}
              className="h-11 rounded-[14px] touch-target"
            />
          </FieldRow>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-11 rounded-full touch-target"
          >
            إلغاء
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={
              pending ||
              !fullName.trim() ||
              !branchId ||
              (!isEdit && !password.trim())
            }
            className="h-11 rounded-full touch-target"
          >
            {pending ? 'جارٍ الحفظ...' : 'حفظ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function KeyValuesSection() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['settings-keyvalues'],
    queryFn: getKeyValues,
  })
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')

  const mutation = useMutation({
    mutationFn: upsertKeyValue,
    onSuccess: () => {
      toast.success('تم حفظ الإعداد')
      setKey('')
      setValue('')
      queryClient.invalidateQueries({ queryKey: ['settings-keyvalues'] })
    },
    onError: () => toast.error('تعذّر حفظ الإعداد'),
  })

  return (
    <Card className="w-full max-w-4xl elevation-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[15px] font-bold">
          <Settings2 className="size-4" />
          الإعدادات العامة (مفتاح/قيمة)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <FieldRow label="المفتاح">
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="مثال: MinimumStock"
              className="h-11 rounded-[14px] touch-target"
            />
          </FieldRow>
          <FieldRow label="القيمة">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="مثال: 10"
              className="h-11 rounded-[14px] touch-target"
            />
          </FieldRow>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={() => mutation.mutate({ key, value })}
              disabled={mutation.isPending || !key.trim()}
              className="h-11 rounded-full touch-target"
            >
              {mutation.isPending ? 'جارٍ الحفظ...' : 'إضافة'}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 py-3">
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            لا توجد إعدادات عامة بعد.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المفتاح</TableHead>
                <TableHead>القيمة</TableHead>
                <TableHead className="text-end">آخر تعديل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.key}>
                  <TableCell className="font-mono text-[13px] font-semibold">
                    {item.key}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.value ?? '—'}
                  </TableCell>
                  <TableCell className="text-end text-[13px] text-muted-foreground">
                    {item.updatedByName
                      ? `${item.updatedByName}`
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function OnboardingSection() {
  const queryClient = useQueryClient()
  const currentBranchId = useAuthStore((s) => s.branchId)
  const { data: overview } = useQuery({
    queryKey: ['settings-overview'],
    queryFn: getOverview,
  })
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null)
  const effectiveBranchId = selectedBranchId ?? overview?.branches[0]?.branchId ?? currentBranchId ?? null

  const { data, isLoading } = useQuery({
    queryKey: ['onboarding-status', effectiveBranchId],
    queryFn: () => getOnboardingStatus(effectiveBranchId ?? undefined),
    enabled: effectiveBranchId != null,
  })

  const completeMutation = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      toast.success('تم إتمام التحويل الابتدائي')
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] })
    },
    onError: () => toast.error('تعذّر إتمام التحويل الابتدائي'),
  })

  return (
    <Card className="w-full max-w-4xl elevation-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[15px] font-bold">
          <ClipboardCheck className="size-4" />
          التحويل الابتدائي / الأرصدة الافتتاحية
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3 py-3">
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-4">
            <FieldRow label="الفرع المستهدف">
              <Select
                value={effectiveBranchId != null ? String(effectiveBranchId) : ''}
                onValueChange={(value) => setSelectedBranchId(Number(value))}
              >
                <SelectTrigger className="h-11 w-full rounded-[14px] touch-target">
                  <SelectValue placeholder="اختر الفرع" />
                </SelectTrigger>
                <SelectContent>
                  {(overview?.branches ?? []).map((branch) => (
                    <SelectItem key={branch.branchId} value={String(branch.branchId)}>
                      {branch.branchName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
            {data?.completed ? (
              <div className="rounded-2xl bg-success/10 p-4 text-success">
                <p className="font-bold">تم إتمام التحويل الابتدائي لهذا الفرع</p>
                {data.completedBy && (
                  <p className="mt-1 text-[13px]">
                    بواسطة: {data.completedBy}
                    {data.completedAt
                      ? ` — ${new Intl.DateTimeFormat('ar-EG', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(data.completedAt))}`
                      : ''}
                  </p>
                )}
              </div>
            ) : (
              <>
                <p className="text-[14px] text-muted-foreground">
                  أدخل مخزون هذا الفرع وكاشه الافتتاحي عبر فاتورة شراء أولية. أثناء هذه المرحلة
                  تُتاح إضافة الأرصدة دون قيود الرصيد حتى اكتمال التفعيل.
                </p>
                <Button
                  type="button"
                  onClick={() => selectedBranchId != null && completeMutation.mutate(selectedBranchId)}
                  disabled={completeMutation.isPending || selectedBranchId == null}
                  className="h-11 gap-2 self-start rounded-full touch-target"
                >
                  <ClipboardCheck className="size-4" />
                  {completeMutation.isPending ? 'جارٍ الإنهاء...' : 'إنهاء وضع رصيد أول المدة'}
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function LoadingCard() {
  return (
    <Card className="elevation-card max-w-2xl">
      <CardContent>
        <div className="py-12 text-center text-muted-foreground">جارٍ التحميل...</div>
      </CardContent>
    </Card>
  )
}
