import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Banknote,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Save,
  ShieldAlert,
  ShoppingBag,
  Store as StoreIcon,
  Users,
} from 'lucide-react'

import { useAuthStore } from '@/shared/stores/auth-store'
import {
  getStoreProfile,
  updateStoreProfile,
  getOverview,
  getEmployees,
  addEmployee,
  updateEmployee,
  updateEmployeeRoles,
  disableEmployee,
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

export function CompanyManagePage() {
  const roles = useAuthStore((s) => s.user?.roles ?? [])
  const isOwner = roles.includes('Owner')

  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<EmployeeItem | null>(null)

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <ShieldAlert className="size-12 text-muted-foreground" />
        <p className="text-[17px] font-semibold text-foreground">
          هذه الصفحة مخصصة لصاحب المحل فقط
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5 pb-20 lg:space-y-6">
      <div className="flex items-center gap-3 rounded-[18px] border border-black/5 bg-white p-4 elevation-card sm:p-5">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <StoreIcon className="size-6" />
        </div>
        <div>
          <h1 className="text-[28px] font-bold leading-[1.2] text-foreground sm:text-[34px]">
            إدارة الشركة
          </h1>
          <p className="text-[13px] text-muted-foreground sm:text-[15px]">
            سعر الذهب وإدارة الموظفين وإحصائيات الشركة
          </p>
        </div>
      </div>

      <CompanyStats />

      <Card className="elevation-card">
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-[15px] font-bold">
            <Users className="size-4" />
            المستخدمون
          </CardTitle>
          <Button
            type="button"
            size="sm"
            className="gap-2 rounded-full touch-target"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="size-4" />
            إضافة موظف
          </Button>
        </CardHeader>
        <CardContent>
          <UsersTable onEdit={setEditTarget} />
        </CardContent>
      </Card>

      <Card className="elevation-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[15px] font-bold">
            <StoreIcon className="size-4" />
            بيانات المحل
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StoreSection />
        </CardContent>
      </Card>

      <EmployeeDialogs
        addOpen={addOpen}
        setAddOpen={setAddOpen}
        editTarget={editTarget}
        setEditTarget={setEditTarget}
      />
    </div>
  )
}

function CompanyStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['settings-overview'],
    queryFn: getOverview,
  })

  if (isLoading || !data) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    )
  }

  const totalSales = data.branches.reduce((s, b) => s + b.totalSales, 0)
  const totalCash = data.branches.reduce((s, b) => s + b.cash, 0)
  const totalEmployees = data.branches.reduce((s, b) => s + b.employees.length, 0)
  const totalBranches = data.branches.length

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <StatTile
        icon={<ShoppingBag className="size-4" />}
        tone="primary"
        label="إجمالي المبيعات"
        value={formatEgp(totalSales)}
      />
      <StatTile
        icon={<Banknote className="size-4" />}
        tone="success"
        label="رصيد الخزينة"
        value={formatEgp(totalCash)}
      />
      <StatTile
        icon={<Users className="size-4" />}
        tone="neutral"
        label="الموظفون"
        value={String(totalEmployees)}
        sub={`${totalBranches} فروع`}
      />
    </div>
  )
}

function StatTile({
  icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  tone: 'primary' | 'success' | 'neutral'
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 elevation-card">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] text-muted-foreground">{label}</p>
        <span
          className={cn(
            'flex size-7 items-center justify-center rounded-lg',
            tone === 'primary' && 'bg-primary/10 text-primary',
            tone === 'success' && 'bg-success/10 text-success',
            tone === 'neutral' && 'bg-muted text-muted-foreground',
          )}
        >
          {icon}
        </span>
      </div>
      <p className="mt-2 text-[24px] font-bold tabular-nums leading-[1.1] text-foreground">
        {value}
      </p>
      {sub && <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

function UsersTable({ onEdit }: { onEdit: (emp: EmployeeItem) => void }) {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['settings-employees'],
    queryFn: getEmployees,
  })

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    )
  }

  const employees = data ?? []
  if (employees.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        لا يوجد موظفون بعد. أضف أول موظف من الزر بالأعلى.
      </div>
    )
  }

  return (
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
          {employees.map((emp) => (
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
                    onClick={() => onEdit(emp)}
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
                          toast.error(extractServerMessage(error, 'تعذّر تعطيل الموظف')),
                        )
                    }}
                  >
                    <KeyRound className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
    onError: (error: unknown) =>
      toast.error(extractServerMessage(error, 'تعذّر حفظ بيانات المحل')),
  })

  if (isLoading) return <Skeleton className="h-32 w-full rounded-2xl" />

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <StoreField
        label="اسم المحل"
        value={current.name ?? ''}
        onChange={(v) => setForm({ ...(form ?? {}), name: v })}
      />
      <StoreField
        label="هاتف المحل"
        value={current.phone ?? ''}
        onChange={(v) => setForm({ ...(form ?? {}), phone: v })}
        placeholder="01xxxxxxxxx"
        inputMode="tel"
        dir="ltr"
      />
      <StoreField
        label="المدينة"
        value={current.city ?? ''}
        onChange={(v) => setForm({ ...(form ?? {}), city: v })}
      />
      <StoreField
        label="العنوان"
        value={current.location ?? ''}
        onChange={(v) => setForm({ ...(form ?? {}), location: v })}
      />
      <StoreField
        label="السجل التجاري"
        value={current.commercialRegistrationNumber ?? ''}
        onChange={(v) =>
          setForm({ ...(form ?? {}), commercialRegistrationNumber: v })
        }
      />
      <StoreField
        label="البطاقة الضريبية"
        value={current.taxCardNumber ?? ''}
        onChange={(v) => setForm({ ...(form ?? {}), taxCardNumber: v })}
      />
      <div className="sm:col-span-2 flex justify-end">
        <Button
          type="button"
          onClick={() => mutation.mutate(current)}
          disabled={mutation.isPending}
          className="h-11 gap-2 rounded-full touch-target"
        >
          {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          حفظ بيانات المحل
        </Button>
      </div>
    </div>
  )
}

function StoreField({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  inputMode?: 'tel' | 'text' | 'email'
  dir?: 'ltr' | 'rtl'
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-semibold">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-[14px] touch-target"
        {...rest}
      />
    </div>
  )
}

function EmployeeDialogs({
  addOpen,
  setAddOpen,
  editTarget,
  setEditTarget,
}: {
  addOpen: boolean
  setAddOpen: (v: boolean) => void
  editTarget: EmployeeItem | null
  setEditTarget: (v: EmployeeItem | null) => void
}) {
  const queryClient = useQueryClient()
  const { data: branches } = useQuery({
    queryKey: ['settings-overview'],
    queryFn: getOverview,
  })

  return (
    <>
      <EmployeeDialog
        key="add"
        mode="add"
        open={addOpen}
        onOpenChange={setAddOpen}
        branches={branches?.branches ?? []}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['settings-employees'] })
          queryClient.invalidateQueries({ queryKey: ['settings-overview'] })
          setAddOpen(false)
        }}
      />
      <EmployeeDialog
        key={editTarget ? `edit-${editTarget.id}` : 'edit-closed'}
        mode="edit"
        employee={editTarget ?? undefined}
        open={editTarget != null}
        onOpenChange={(o) => !o && setEditTarget(null)}
        branches={branches?.branches ?? []}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['settings-employees'] })
          queryClient.invalidateQueries({ queryKey: ['settings-overview'] })
          setEditTarget(null)
        }}
      />
    </>
  )
}

function EmployeeDialog({
  mode,
  employee,
  open,
  onOpenChange,
  branches,
  onSaved,
}: {
  mode: 'add' | 'edit'
  employee?: EmployeeItem
  open: boolean
  onOpenChange: (v: boolean) => void
  branches: BranchSummary[]
  onSaved: () => void
}) {
  const initial = (): {
    fullName: string
    phone: string
    email: string
    cardNumber: string
    role: 'Sale' | 'Manager'
    branchId: string
  } => {
    if (mode === 'edit' && employee) {
      return {
        fullName: employee.fullName ?? '',
        phone: employee.phone ?? '',
        email: employee.email ?? '',
        cardNumber: employee.cardNumber ?? '',
        role: employee.roles.includes('Manager') ? 'Manager' : 'Sale',
        branchId: employee.branchId != null ? String(employee.branchId) : '',
      }
    }
    return { fullName: '', phone: '', email: '', cardNumber: '', role: 'Sale', branchId: '' }
  }

  const [fullName, setFullName] = useState(() => initial().fullName)
  const [phone, setPhone] = useState(() => initial().phone)
  const [email, setEmail] = useState(() => initial().email)
  const [cardNumber, setCardNumber] = useState(() => initial().cardNumber)
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'Sale' | 'Manager'>(() => initial().role)
  const [branchId, setBranchId] = useState(() => initial().branchId)

  const emp = employee
  const rolesLocked = Boolean(
    mode === 'edit' && emp && (emp.roles.includes('Owner') || emp.roles.includes('Responsible')),
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
      const nextRoles = [role]
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
    if ((mode === 'add' || password.trim()) && password.trim().length < 6) {
      toast.error(
        mode === 'edit'
          ? 'كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف (أو اتركها فارغة لإبقائها).'
          : 'اكتب كلمة مرور لا تقل عن 6 أحرف.',
      )
      return
    }
    if (mode === 'edit') editMutation.mutate()
    else addMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'تعديل موظف' : 'إضافة موظف'}</DialogTitle>
          <DialogDescription>
            أدخل بيانات الموظف ودوره في الشركة. الفرع مرتبط بحسابك تلقائياً.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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
              <Label className="text-[13px] font-semibold">الفرع</Label>
              <Select value={branchId} onValueChange={setBranchId}>
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
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold">الدور</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as 'Sale' | 'Manager')}
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
              disabled={mode === 'edit' && Boolean(emp?.roles.includes('Owner'))}
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
            disabled={
              pending ||
              !fullName.trim() ||
              !branchId ||
              (mode === 'add' && !password.trim())
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