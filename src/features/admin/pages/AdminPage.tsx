import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Building2,
  CalendarClock,
  Database,
  HardDrive,
  KeyRound,
  Plus,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  Store as StoreIcon,
  TimerReset,
  Users,
} from 'lucide-react'

import { useAuthStore } from '@/shared/stores/auth-store'
import { cn, formatEgp } from '@/shared/lib/utils'
import { extractServerMessage } from '@/shared/lib/serverError'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Skeleton } from '@/shared/components/ui/skeleton'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs'
import {
  addBranch,
  addCompanyEmployee,
  addOwner,
  disableCompanyEmployee,
  extendSubscription,
  getCompanies,
  getCompanyEmployees,
  getOverview,
  getSystemLogs,
  updateCompanyStatus,
  updateCompanyEmployee,
} from '@/features/admin/api'
import type {
  AdminAddEmployeePayload,
  AdminAddBranchPayload,
  AdminCompany,
  AdminEmployee,
  AdminUpdateEmployeePayload,
  SystemLogEntry,
} from '@/features/admin/types'

const ROLE_LABELS: Record<string, string> = {
  Owner: 'صاحب المحل',
  Manager: 'مدير',
  Sale: 'بائع',
  Responsible: 'مسؤول',
}

export function AdminPage() {
  const roles = useAuthStore((s) => s.user?.roles ?? [])
  const isResponsible = roles.includes('Responsible')
  const [ownerOpen, setOwnerOpen] = useState(false)

  const { data: companies, isLoading: companiesLoading } = useQuery({
    queryKey: ['admin-companies'],
    queryFn: getCompanies,
    enabled: isResponsible,
  })
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: getOverview,
    enabled: isResponsible,
    refetchInterval: 30000,
  })

  if (!isResponsible) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <ShieldCheck className="size-12 text-muted-foreground" />
        <p className="text-[17px] font-semibold text-foreground">
          هذه الصفحة مخصصة لمدير النظام فقط
        </p>
      </div>
    )
  }

  const companiesList = companies ?? []
  const active = companiesList.filter((c) => c.isActive).length
  const expired = companiesList.filter((c) => isExpired(c.latestExpiry)).length

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5 pb-20 lg:space-y-6">
      <div className="flex items-center justify-between gap-3 rounded-[18px] border border-black/5 bg-white p-4 elevation-card sm:p-5">
        <div className="flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="size-6" />
        </div>
        <div>
          <h1 className="text-[28px] font-bold leading-[1.2] text-foreground sm:text-[34px]">
            إدارة النظام
          </h1>
          <p className="text-[13px] text-muted-foreground sm:text-[15px]">
            الشركات والاشتراكات والفروع والمستخدمون على مستوى المنصة
          </p>
        </div>
        </div>
        <Button type="button" className="h-11 gap-2 rounded-full touch-target" onClick={() => setOwnerOpen(true)}>
          <Plus className="size-4" />
          إنشاء حساب صاحب محل
        </Button>
      </div>

      <OwnerDialog open={ownerOpen} onOpenChange={setOwnerOpen} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<StoreIcon className="size-4" />}
          tone="primary"
          label="الشركات"
          value={String(overview?.companiesCount ?? companiesList.length)}
          sub={`${active} نشطة`}
          loading={overviewLoading && !overview}
        />
        <StatCard
          icon={<Building2 className="size-4" />}
          tone="secondary"
          label="الفروع"
          value={String(overview?.branchesCount ?? '—')}
          sub="بكل الشركات"
          loading={overviewLoading && !overview}
        />
        <StatCard
          icon={<Users className="size-4" />}
          tone="neutral"
          label="المستخدمون"
          value={String(overview?.employeesCount ?? '—')}
          loading={overviewLoading && !overview}
        />
        <StatCard
          icon={<CalendarClock className="size-4" />}
          tone={expired > 0 ? 'error' : 'success'}
          label="اشتراكات منتهية"
          value={String(expired)}
          sub={expired === 0 ? 'لا يوجد' : 'يحتاج تمديد'}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Database className="size-4" />}
          tone="primary"
          label="إجمالي المبيعات"
          value={overview ? formatEgp(overview.totalSales) : '—'}
          loading={overviewLoading && !overview}
        />
        <StatCard
          icon={<HardDrive className="size-4" />}
          tone="success"
          label="رصيد الكاش الكلي"
          value={overview ? formatEgp(overview.totalCash) : '—'}
          loading={overviewLoading && !overview}
        />
        <StatCard
          icon={<Database className="size-4" />}
          tone="warning"
          label="إجمالي الديون"
          value={overview ? formatEgp(overview.totalDebts) : '—'}
          loading={overviewLoading && !overview}
        />
        <DatabaseSizeCard />
      </div>

      <Tabs defaultValue="companies" dir="rtl" className="items-start md:flex-row">
        <TabsList className="flex h-12 min-h-12 w-full max-w-full shrink-0 justify-start gap-1 overflow-x-auto rounded-2xl bg-white p-1 elevation-card md:h-fit md:w-56 md:flex-col md:items-stretch md:overflow-visible md:rounded-[18px] md:p-2">
          <TabsTrigger value="companies" className="h-11 min-w-max justify-start gap-2 rounded-xl px-4 md:w-full md:flex-none">
            <StoreIcon className="size-4" />
            الشركات
          </TabsTrigger>
          <TabsTrigger value="users" className="h-11 min-w-max justify-start gap-2 rounded-xl px-4 md:w-full md:flex-none">
            <Users className="size-4" />
            المستخدمون
          </TabsTrigger>
          <TabsTrigger value="logs" className="h-11 min-w-max justify-start gap-2 rounded-xl px-4 md:w-full md:flex-none">
            <ScrollText className="size-4" />
            سجل النظام
          </TabsTrigger>
        </TabsList>

        <TabsContent value="companies" className="mt-5">
          <CompaniesTab companies={companiesList} loading={companiesLoading} />
        </TabsContent>

        <TabsContent value="users" className="mt-5">
          <UsersTab companies={companiesList} />
        </TabsContent>

        <TabsContent value="logs" className="mt-5">
          <LogsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function OwnerDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const mutation = useMutation({
    mutationFn: () => addOwner({ fullName, phoneNumber: phone, email, password, role: 'Owner' }),
    onSuccess: () => {
      toast.success('تم إنشاء حساب صاحب المحل. سيُنشئ الشركة والفرع الأول عند دخوله.')
      onOpenChange(false)
      setFullName('')
      setPhone('')
      setEmail('')
      setPassword('')
    },
    onError: (error: unknown) => toast.error(extractServerMessage(error, 'تعذّر إنشاء حساب صاحب المحل')),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>إنشاء حساب صاحب محل</DialogTitle>
          <DialogDescription>
            الحساب يُنشأ بدون شركة أو فرع. صاحب المحل ينشئ بياناتهما عند أول دخول.
          </DialogDescription>
        </DialogHeader>
        <div className="p-5 sm:p-6 space-y-4">
          <Label>الاسم الكامل</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11 rounded-[14px] touch-target" />
          <Label>رقم الهاتف</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" dir="ltr" className="h-11 rounded-[14px] touch-target" />
          <Label>البريد الإلكتروني</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="h-11 rounded-[14px] touch-target" />
          <Label>كلمة المرور</Label>
          <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="h-11 rounded-[14px] touch-target" />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">إلغاء</Button>
          <Button type="button" disabled={mutation.isPending || !fullName.trim() || !phone.trim() || password.length < 6} onClick={() => mutation.mutate()} className="rounded-full">
            {mutation.isPending ? 'جارٍ الإنشاء...' : 'إنشاء الحساب'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CompaniesTab({
  companies,
  loading,
}: {
  companies: AdminCompany[]
  loading: boolean
}) {
  return (
    <Card className="elevation-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[15px] font-bold">
          <StoreIcon className="size-4" />
          الشركات المسجلة
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3 py-3">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : companies.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            لا توجد شركات مسجلة بعد.
          </div>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {companies.map((company) => (
              <CompanyCard key={company.companyId} company={company} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function UsersTab({ companies }: { companies: AdminCompany[] }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(
    companies[0]?.companyId ?? null,
  )
  const effectiveCompanyId = selectedCompanyId ?? companies[0]?.companyId ?? null
  const { data, isLoading } = useQuery({
    queryKey: ['admin-company-employees', effectiveCompanyId],
    queryFn: () => getCompanyEmployees(effectiveCompanyId!),
    enabled: effectiveCompanyId != null,
  })
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AdminEmployee | null>(null)

  // قائمة الفروع مأخوذة من قائمة الشركات المعروضة
  const branches =
    companies.find((c) => c.companyId === effectiveCompanyId)?.branches.map((b) => ({
      branchId: b.branchId,
      branchName: b.branchName,
    })) ?? []

  return (
    <Card className="elevation-card">
      <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-[15px] font-bold">
          <Users className="size-4" />
          المستخدمون
        </CardTitle>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            value={effectiveCompanyId != null ? String(effectiveCompanyId) : ''}
            onValueChange={(v) => {
              setSelectedCompanyId(Number(v))
              setEditTarget(null)
            }}
          >
            <SelectTrigger className="h-11 min-w-[200px] rounded-[14px] touch-target">
              <SelectValue placeholder="اختر الشركة" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((c) => (
                <SelectItem key={c.companyId} value={String(c.companyId)}>
                  {c.name ?? `شركة #${c.companyId}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            className="h-11 gap-2 rounded-full touch-target"
            onClick={() => setAddOpen(true)}
            disabled={effectiveCompanyId == null}
          >
            <Plus className="size-4" />
            إضافة مستخدم
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {effectiveCompanyId == null ? (
          <div className="py-12 text-center text-muted-foreground">
            لا توجد شركات لإدارة مستخدميها.
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : (
          <UsersTable
            companyId={effectiveCompanyId}
            employees={data?.employees ?? []}
            onEdit={(emp) => setEditTarget(emp)}
            onInvalidate={() => {
              queryClient.invalidateQueries({ queryKey: ['admin-company-employees', effectiveCompanyId] })
              queryClient.invalidateQueries({ queryKey: ['admin-overview'] })
            }}
          />
        )}
      </CardContent>

      <EmployeeDialog
        key={addOpen ? 'add-open' : 'add-closed'}
        mode="add"
        companyId={effectiveCompanyId!}
        branches={branches}
        open={addOpen}
        onOpenChange={setAddOpen}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-company-employees', effectiveCompanyId] })
          queryClient.invalidateQueries({ queryKey: ['admin-overview'] })
          setAddOpen(false)
        }}
      />
      <EmployeeDialog
        key={editTarget ? `edit-${editTarget.id}` : 'edit-closed'}
        mode="edit"
        companyId={effectiveCompanyId!}
        employee={editTarget ?? undefined}
        branches={branches}
        open={editTarget != null}
        onOpenChange={(o) => !o && setEditTarget(null)}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-company-employees', effectiveCompanyId] })
          queryClient.invalidateQueries({ queryKey: ['admin-overview'] })
          setEditTarget(null)
        }}
      />
    </Card>
  )
}

const LEVEL_STYLES: Record<string, string> = {
  Info: 'border-blue-500/20 bg-blue-500/10 text-blue-700',
  Warning: 'border-amber-500/20 bg-amber-500/10 text-amber-700',
  Error: 'border-red-500/20 bg-red-500/10 text-red-700',
}

function LogsTab() {
  const [level, setLevel] = useState<string>('all')
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-system-logs'],
    queryFn: () => getSystemLogs(200),
  })

  const logs: SystemLogEntry[] = (data?.logs ?? []).filter(
    (l) => level === 'all' || l.level === level,
  )

  return (
    <Card className="elevation-card">
      <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-[15px] font-bold">
          <ScrollText className="size-4" />
          سجل النظام
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'Info', 'Warning', 'Error'] as const).map((lv) => (
            <button
              key={lv}
              type="button"
              onClick={() => setLevel(lv)}
              className={cn(
                'h-9 rounded-full border px-4 text-[13px] font-semibold touch-target',
                level === lv
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-white text-muted-foreground hover:bg-muted/40',
              )}
            >
              {lv === 'all' ? 'الكل' : lv === 'Info' ? 'معلومات' : lv === 'Warning' ? 'تحذيرات' : 'أخطاء'}
            </button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 gap-2 rounded-full touch-target"
            onClick={() => refetch()}
          >
            <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
            تحديث
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            لا توجد سجلات لعرضها.
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col gap-1 rounded-xl border border-black/5 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
              >
                <div className="flex min-w-0 items-start gap-2">
                  <Badge className={cn('shrink-0 border', LEVEL_STYLES[log.level] ?? LEVEL_STYLES.Info)}>
                    {log.level}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-[13px] leading-snug text-foreground">{log.message}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {log.source} • {new Date(log.timestamp).toLocaleString('ar-EG')}
                    </p>
                  </div>
                </div>
                {log.companyId != null && (
                  <span className="shrink-0 text-[11px] text-muted-foreground sm:ps-2">
                    شركة #{log.companyId}
                    {log.branchId != null ? ` • فرع #${log.branchId}` : ''}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function UsersTable({
  companyId,
  employees,
  onEdit,
  onInvalidate,
}: {
  companyId: number
  employees: AdminEmployee[]
  branches?: { branchId: number; branchName: string }[]
  onEdit: (emp: AdminEmployee) => void
  onInvalidate: () => void
}) {
  if (employees.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        لا يوجد موظفون في هذه الشركة بعد.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-start text-[12px] text-muted-foreground">
            <th className="px-2 py-2 text-start font-semibold">الاسم</th>
            <th className="px-2 py-2 text-start font-semibold">الهاتف</th>
            <th className="px-2 py-2 text-start font-semibold">الدور</th>
            <th className="px-2 py-2 text-end font-semibold">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td className="px-2 py-2 text-[14px] font-semibold text-foreground">{emp.fullName}</td>
              <td className="px-2 py-2 text-[13px] text-muted-foreground">{emp.phone || '—'}</td>
              <td className="px-2 py-2">
                <div className="flex flex-wrap gap-1">
                  {emp.roles.length === 0 ? (
                    <Badge variant="outline">بدون دور</Badge>
                  ) : (
                    emp.roles.map((r) => (
                      <Badge key={r} variant="outline">
                        {ROLE_LABELS[r] ?? r}
                      </Badge>
                    ))
                  )}
                </div>
              </td>
              <td className="px-2 py-2 text-end">
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-full touch-target"
                    onClick={() => onEdit(emp)}
                  >
                    تعديل
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-full text-error hover:text-error touch-target"
                    onClick={() => {
                      if (!window.confirm(`هل تريد تعطيل الموظف "${emp.fullName ?? ''}"؟`)) return
                      void disableCompanyEmployee(companyId, emp.id)
                        .then(() => {
                          toast.success('تم تعطيل الموظف')
                          onInvalidate()
                        })
                        .catch((error: unknown) =>
                          toast.error(extractServerMessage(error, 'تعذّر تعطيل الموظف')),
                        )
                    }}
                  >
                    تعطيل
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DatabaseSizeCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: getOverview,
  })
  const size = data?.database?.databaseSize
  const detail = data?.database
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 elevation-card">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] text-muted-foreground">حجم قاعدة البيانات</p>
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Database className="size-4" />
        </span>
      </div>
      <p className="mt-2 text-[20px] font-bold tabular-nums leading-[1.1] text-foreground">
        {isLoading ? '…' : size ?? '—'}
      </p>
      {detail?.dataSize && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          بيانات {detail.dataSize} · فهرس {detail.indexSize ?? '—'}
        </p>
      )}
      {detail?.error && (
        <p className="mt-1 text-[11px] text-error">{detail.error}</p>
      )}
    </div>
  )
}

type Tone = 'primary' | 'secondary' | 'neutral' | 'success' | 'error' | 'warning'

function StatCard({
  icon,
  tone,
  label,
  value,
  sub,
  loading,
}: {
  icon: React.ReactNode
  tone: Tone
  label: string
  value: string
  sub?: string
  loading?: boolean
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 elevation-card">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] text-muted-foreground">{label}</p>
        <span className={cn('flex size-7 items-center justify-center rounded-lg', toneBadge(tone))}>
          {icon}
        </span>
      </div>
      <p className="mt-2 text-[24px] font-bold tabular-nums leading-[1.1] text-foreground">
        {loading ? '…' : value}
      </p>
      {sub && <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

function toneBadge(tone: Tone) {
  switch (tone) {
    case 'primary':
      return 'bg-primary/10 text-primary'
    case 'secondary':
      return 'bg-secondary/40 text-secondary-foreground'
    case 'success':
      return 'bg-success/10 text-success'
    case 'warning':
      return 'bg-warning/10 text-warning'
    case 'error':
      return 'bg-error/10 text-error'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function CompanyCard({ company }: { company: AdminCompany }) {
  const queryClient = useQueryClient()
  const [extendOpen, setExtendOpen] = useState(false)
  const [addBranchOpen, setAddBranchOpen] = useState(false)
  const statusMutation = useMutation({
    mutationFn: () => updateCompanyStatus(company.companyId, !company.isActive),
    onSuccess: (result) => {
      toast.success(result.message)
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] })
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] })
    },
    onError: (error: unknown) =>
      toast.error(extractServerMessage(error, 'تعذّر تحديث حالة الشركة')),
  })

  const expired = isExpired(company.latestExpiry)
  const daysLeft = daysUntil(company.latestExpiry)
  const earliestExpired = isExpired(company.earliestExpiry)

  return (
    <div className="rounded-2xl border border-black/5 bg-black/[0.02] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[16px] font-bold text-foreground">{company.name ?? `شركة #${company.companyId}`}</p>
            {company.isActive ? (
              <Badge variant="default" className="text-[11px]">نشطة</Badge>
            ) : (
              <Badge variant="outline" className="text-[11px] text-muted-foreground">معطلة</Badge>
            )}
            {company.branchCount === 1 ? (
              <Badge variant="outline" className="gap-1 text-[11px]">
                <Building2 className="size-3" />
                فرع واحد
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-[11px]">
                <Building2 className="size-3" />
                {company.branchCount} فروع
              </Badge>
            )}
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {[company.city, company.phone ? `📞 ${company.phone}` : null]
              .filter(Boolean)
              .join(' — ') || 'لا توجد توجد اتصال'}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="الفروع" value={String(company.branchCount)} />
        <MiniStat label="الموظفون" value={String(company.employeeCount)} />
        <MiniStat label="أبعد انتهاء" value={formatDate(company.latestExpiry)} />
        <MiniStat label="أقرب انتهاء" value={formatDate(company.earliestExpiry)} />
      </div>

      <div
        className={cn(
          'mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-[13px]',
          expired
            ? 'bg-error/10 text-error'
            : earliestExpired
              ? 'bg-warning/10 text-warning'
              : 'bg-success/10 text-success',
        )}
      >
        <CalendarClock className="size-4" />
        <span className="font-semibold">
          {expired
            ? 'انتهى الاشتراك'
            : earliestExpired
              ? `فرع منتهي — متبقي ${daysLeft ?? 0} يوم للأبعد`
              : `الاشتراك ساري — متبقي ${daysLeft ?? 0} يوم`}
        </span>
      </div>

      {company.branches.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {company.branches.map((b) => (
            <Badge key={b.branchId} variant="outline" className="text-[11px]">
              #{b.branchId} {b.branchName}
              {b.city ? ` — ${b.city}` : ''}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={company.isActive ? 'outline' : 'default'}
          className="h-11 gap-2 rounded-full touch-target"
          disabled={statusMutation.isPending}
          onClick={() => statusMutation.mutate()}
        >
          <ShieldCheck className="size-4" />
          {statusMutation.isPending
            ? 'جارٍ التحديث...'
            : company.isActive
              ? 'تعطيل الشركة'
              : 'تفعيل الشركة'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-11 gap-2 rounded-full touch-target"
          onClick={() => setExtendOpen(true)}
        >
          <TimerReset className="size-4" />
          تمديد الاشتراك
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-11 gap-2 rounded-full touch-target"
          onClick={() => setAddBranchOpen(true)}
        >
          <Plus className="size-4" />
          إضافة فرع
        </Button>
      </div>

      <ExtendDialog
        open={extendOpen}
        onOpenChange={setExtendOpen}
        company={company}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-companies'] })
          queryClient.invalidateQueries({ queryKey: ['admin-overview'] })
          setExtendOpen(false)
        }}
      />
      <AddBranchDialog
        open={addBranchOpen}
        onOpenChange={setAddBranchOpen}
        company={company}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-companies'] })
          queryClient.invalidateQueries({ queryKey: ['admin-overview'] })
          setAddBranchOpen(false)
        }}
      />
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-[13px] font-bold tabular-nums text-foreground">{value}</p>
    </div>
  )
}

function ExtendDialog({
  open,
  onOpenChange,
  company,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  company: AdminCompany
  onSaved: () => void
}) {
  const [days, setDays] = useState('30')

  const mutation = useMutation({
    mutationFn: () => extendSubscription(company.companyId, Number(days) || 0),
    onSuccess: () => {
      toast.success(`تم تمديد اشتراك «${company.name ?? ''}» ${days} يومًا`)
      onSaved()
    },
    onError: () => toast.error('تعذّر تمديد الاشتراك'),
  })

  const presets = [30, 90, 180, 365]
  const n = Number(days) || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TimerReset className="size-4 text-primary" />
            تمديد اشتراك {company.name ?? `شركة #${company.companyId}`}
          </DialogTitle>
          <DialogDescription>
            يمدد كل الفروع. إذا انتهى الاشتراك يُمدد من اليوم، وإلا يُضاف لأبعد تاريخ انتهاء.
          </DialogDescription>
        </DialogHeader>
        <div className="p-5 sm:p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[13px] font-semibold">عدد الأيام</Label>
            <Input
              value={days}
              onChange={(e) => setDays(e.target.value)}
              type="number"
              min="1"
              inputMode="numeric"
              dir="ltr"
              className="h-11 rounded-[14px] touch-target"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <Button
                key={p}
                type="button"
                size="sm"
                variant={n === p ? 'default' : 'outline'}
                className="h-9 rounded-full"
                onClick={() => setDays(String(p))}
              >
                {p} يوم
              </Button>
            ))}
          </div>
          <div className="rounded-xl bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
            الفروع الحالية: <span className="font-bold text-foreground">{company.branchCount}</span>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 rounded-full touch-target"
          >
            إلغاء
          </Button>
          <Button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || n <= 0}
            className="h-11 rounded-full touch-target"
          >
            {mutation.isPending ? 'جارٍ التمديد...' : 'تأكيد التمديد'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddBranchDialog({
  open,
  onOpenChange,
  company,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  company: AdminCompany
  onSaved: () => void
}) {
  const [form, setForm] = useState<AdminAddBranchPayload>({
    branchName: '',
    city: company.city ?? '',
  })
  const [commissionPct, setCommissionPct] = useState('1.5')

  const mutation = useMutation({
    mutationFn: () => {
      const pct = Number(commissionPct) || 0
      return addBranch(company.companyId, {
        branchName: form.branchName.trim(),
        city: form.city,
        location: form.location,
        station: form.station,
        buyFromCustomerCommission: Math.max(0, pct / 100),
      })
    },
    onSuccess: () => {
      toast.success(`تمت إضافة فرع جديد لـ «${company.name ?? ''}»`)
      setForm({ branchName: '', city: company.city ?? '' })
      setCommissionPct('1.5')
      onSaved()
    },
    onError: (error: unknown) =>
      toast.error(extractServerMessage(error, 'تعذّر إضافة الفرع')),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-4 text-primary" />
            إضافة فرع لـ «{company.name ?? `شركة #${company.companyId}`}»
          </DialogTitle>
          <DialogDescription>
            الفرع الجديد يحصل تلقائيًا على اشتراك يطابق أبعد تاريخ انتهاء للشركة.
          </DialogDescription>
        </DialogHeader>
        <div className="p-5 sm:p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[13px] font-semibold">اسم الفرع</Label>
            <Input
              value={form.branchName}
              onChange={(e) => setForm({ ...form, branchName: e.target.value })}
              placeholder="مثال: فرع المعادي"
              className="h-11 rounded-[14px] touch-target"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold">المدينة</Label>
              <Input
                value={form.city ?? ''}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="h-11 rounded-[14px] touch-target"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold">المنطقة/المحطة</Label>
              <Input
                value={form.station ?? ''}
                onChange={(e) => setForm({ ...form, station: e.target.value })}
                className="h-11 rounded-[14px] touch-target"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] font-semibold">العنوان</Label>
            <Input
              value={form.location ?? ''}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="h-11 rounded-[14px] touch-target"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] font-semibold">عمولة الشراء من عميل (%)</Label>
            <Input
              value={commissionPct}
              onChange={(e) => setCommissionPct(e.target.value)}
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              dir="ltr"
              className="h-11 rounded-[14px] touch-target"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 rounded-full touch-target"
          >
            إلغاء
          </Button>
          <Button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.branchName.trim()}
            className="h-11 rounded-full touch-target"
          >
            {mutation.isPending ? 'جارٍ الإضافة...' : 'إضافة الفرع'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EmployeeDialog({
  mode,
  companyId,
  employee,
  open,
  onOpenChange,
  branches,
  onSaved,
}: {
  mode: 'add' | 'edit'
  companyId: number
  employee?: AdminEmployee
  open: boolean
  onOpenChange: (v: boolean) => void
  branches: { branchId: number; branchName: string }[]
  onSaved: () => void
}) {
  const initial = (): AdminAddEmployeePayload => {
    if (mode === 'edit' && employee) {
      return {
        fullName: employee.fullName ?? '',
        phoneNumber: employee.phone ?? '',
        email: employee.email ?? '',
        cardNumber: employee.cardNumber ?? '',
        role: (employee.roles[0] as 'Owner' | 'Manager' | 'Sale' | 'Responsible') ?? 'Sale',
        branchId: employee.branchId ?? null,
      }
    }
    return { fullName: '', phoneNumber: '', email: '', cardNumber: '', role: 'Sale', branchId: null }
  }

  const [fullName, setFullName] = useState(() => initial().fullName ?? '')
  const [phone, setPhone] = useState(() => initial().phoneNumber ?? '')
  const [email, setEmail] = useState(() => initial().email ?? '')
  const [cardNumber, setCardNumber] = useState(() => initial().cardNumber ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'Owner' | 'Manager' | 'Sale' | 'Responsible'>(
    () => initial().role ?? 'Sale',
  )
  const [branchId, setBranchId] = useState<string>(() => {
    const v = initial().branchId
    return v != null ? String(v) : ''
  })

  const emp = employee

  const addMutation = useMutation({
    mutationFn: () =>
      addCompanyEmployee(companyId, {
        fullName,
        phoneNumber: phone,
        email,
        cardNumber,
        password,
        role,
        branchId: branchId ? Number(branchId) : null,
      }),
    onSuccess: () => {
      toast.success('تمت إضافة المستخدم')
      onSaved()
    },
    onError: (error: unknown) =>
      toast.error(extractServerMessage(error, 'تعذّرت إضافة المستخدم')),
  })

  const editMutation = useMutation({
    mutationFn: () => {
      if (!emp) throw new Error('no employee')
      const payload: AdminUpdateEmployeePayload = {
        fullName,
        phoneNumber: phone,
        email,
        cardNumber,
        role,
        branchId: branchId ? Number(branchId) : null,
      }
      if (password.trim()) payload.password = password.trim()
      return updateCompanyEmployee(companyId, emp.id, payload)
    },
    onSuccess: () => {
      toast.success('تم حفظ التعديلات')
      onSaved()
    },
    onError: (error: unknown) =>
      toast.error(extractServerMessage(error, 'تعذّر حفظ إعادة')),
  })

  const pending = addMutation.isPending || editMutation.isPending

  function submit() {
    if (!fullName.trim()) {
      toast.error('اكتب الاسم الكامل.')
      return
    }
    if (mode === 'add' && !password.trim()) {
      toast.error('اكتب كلمة مرور لا تقل عن 6 أحرف.')
      return
    }
    if ((mode === 'add' || password.trim()) && password.trim().length < 6) {
      toast.error('كلمة المرور يجب ألا تقل عن 6 أحرف.')
      return
    }
    if (mode === 'edit') editMutation.mutate()
    else addMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'تعديل مستخدم' : 'إضافة مستخدم'}</DialogTitle>
          <DialogDescription>
            مدير النظام يمكنه إنشاء/تعديل أي دور: Owner / Manager / Sale / Responsible.
          </DialogDescription>
        </DialogHeader>
        <div className="p-5 sm:p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[13px] font-semibold">الاسم الكامل</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11 rounded-[14px] touch-target"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold">رقم الهاتف</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                dir="ltr"
                className="h-11 rounded-[14px] touch-target"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold">رقم البطاقة</Label>
              <Input
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="h-11 rounded-[14px] touch-target"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] font-semibold">البريد الإلكتروني</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              inputMode="email"
              dir="ltr"
              className="h-11 rounded-[14px] touch-target"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold">الدور</Label>
              <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                <SelectTrigger className="h-11 w-full rounded-[14px] touch-target">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sale">بائع</SelectItem>
                  <SelectItem value="Manager">مدير</SelectItem>
                  <SelectItem value="Owner">صاحب محل</SelectItem>
                  <SelectItem value="Responsible">مسؤول</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold">الفرع</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger className="h-11 w-full rounded-[14px] touch-target">
                  <SelectValue placeholder="اختر الفرع" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.branchId} value={String(b.branchId)}>
                      #{b.branchId} {b.branchName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] font-semibold">
              {mode === 'edit' ? 'كلمة المرور الجديدة (اتركها فارغة للإبقاء)' : 'كلمة المرور'}
            </Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-[14px] touch-target"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 rounded-full touch-target"
          >
            إلغاء
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={pending || !fullName.trim() || (mode === 'add' && !password.trim())}
            className="h-11 gap-2 rounded-full touch-target"
          >
            <KeyRound className="size-4" />
            {pending ? 'جارٍ الحفظ...' : 'حفظ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function formatDate(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'short' }).format(d)
}

function daysUntil(value?: string | null): number | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  const diffMs = d.getTime() - Date.now()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

function isExpired(value?: string | null): boolean {
  const days = daysUntil(value)
  if (days == null) return false
  return days < 0
}