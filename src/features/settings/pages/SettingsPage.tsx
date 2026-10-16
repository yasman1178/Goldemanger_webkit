import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Banknote,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react'

import { useAuthStore } from '@/shared/stores/auth-store'
import {
  useTaxStore,
  SALE_TAX_RATE_KEY,
  KARAT_MAKING_KEYS,
} from '@/shared/stores/tax-store'
import { useActiveBranchId } from '@/shared/hooks/useActiveBranchId'
import { invalidateShopData } from '@/shared/lib/invalidateShop'
import { depositCash, withdrawCash } from '@/features/cash/api'
import { DepositDialog } from '@/features/cash/components/DepositDialog'
import { WithdrawDialog } from '@/features/cash/components/WithdrawDialog'
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
  const setBranchId = useAuthStore((s) => s.setBranchId)
  const setSelectedBranchId = useAuthStore((s) => s.setSelectedBranchId)

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['settings-overview'],
    queryFn: getOverview,
    enabled: isOwner,
    retry: false,
  })

  // إذا كان المالك ليس لديه branchId مسجل ولكن الفروع موجودة بالفعل في السيرفر،
  // يتم ضبط أول فرع كفرع فاعل تلقائياً بدلاً من إظهار شاشة إعداد الشركة لأول مرة
  useEffect(() => {
    if (overview?.branches && overview.branches.length > 0) {
      const firstBranch = overview.branches[0]
      if (!branchId || branchId <= 0) {
        setBranchId(firstBranch.branchId)
        setSelectedBranchId(firstBranch.branchId)
      }
    }
  }, [overview, branchId, setBranchId, setSelectedBranchId])

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

  if (overviewLoading) {
    return <LoadingCard />
  }

  // لا تظهر شاشة إعداد الشركة لأول مرة إلا إذا كان السيرفر لا يحتوي على فروع نهائياً
  const hasExistingBranches = (overview?.branches?.length ?? 0) > 0
  if (!branchId && !hasExistingBranches) return <InitialCompanySetup />

  const totalBranchesCash = overview?.branches.reduce((acc, b) => acc + (b.cash ?? 0), 0) ?? 0
  const totalBranchesSales = overview?.branches.reduce((acc, b) => acc + (b.totalSales ?? 0), 0) ?? 0
  const totalBranchesCount = overview?.branches.length ?? 0
  const totalEmployeesCount = overview?.branches.reduce((acc, b) => acc + (b.employees?.length ?? 0), 0) ?? 0

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 pb-24">
      {/* Executive Hero Banner */}
      <div className="relative overflow-hidden rounded-[22px] border border-amber-500/25 bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 p-5 text-white shadow-lg sm:p-6">
        <div className="absolute -left-16 -top-16 size-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 size-56 rounded-full bg-primary/15 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-13 shrink-0 items-center justify-center rounded-[18px] border border-amber-400/30 bg-amber-400/15 text-amber-300 shadow-inner">
              <Settings2 className="size-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-[24px] font-bold text-white sm:text-[30px] leading-tight">
                  إعدادات المنظومة والفروع
                </h1>
                {overview?.companyName && (
                  <span className="rounded-full border border-amber-400/35 bg-amber-400/15 px-3 py-0.5 text-[11.5px] font-bold text-amber-200">
                    {overview.companyName}
                  </span>
                )}
              </div>
              <p className="text-[13px] text-slate-300 sm:text-[14px]">
                إدارة شبكة الفروع، الخزينة والسيولة النقدية، بيانات المنشأة، وصلاحيات فريق العمل.
              </p>
            </div>
          </div>

          {/* Quick Metrics Pills */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5">
            <div className="rounded-[14px] border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-xs">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <Building2 className="size-3.5 text-amber-400" />
                <span>الفروع</span>
              </div>
              <p className="mt-0.5 text-[16px] font-bold text-white tabular-nums">
                {totalBranchesCount} <span className="text-[11px] font-normal text-slate-300">فرع</span>
              </p>
            </div>

            <div className="rounded-[14px] border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-xs">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <Banknote className="size-3.5 text-emerald-400" />
                <span>إجمالي الخزينة</span>
              </div>
              <p className="mt-0.5 text-[15px] font-bold text-emerald-300 tabular-nums">
                {formatEgp(totalBranchesCash)}
              </p>
            </div>

            <div className="col-span-2 sm:col-span-1 rounded-[14px] border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-xs">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <TrendingUp className="size-3.5 text-primary" />
                <span>إجمالي المبيعات</span>
              </div>
              <p className="mt-0.5 text-[15px] font-bold text-primary tabular-nums">
                {formatEgp(totalBranchesSales)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Segmented Navigation Buttons */}
      <Tabs defaultValue="branches" dir="rtl" className="flex flex-col gap-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 w-full h-auto bg-transparent p-0 border-0 shadow-none overflow-visible after:hidden">
          {/* 1. الفروع والخزينة */}
          <TabsTrigger
            value="branches"
            className="group relative flex h-auto min-h-[76px] sm:min-h-[82px] w-full flex-col items-start justify-between rounded-[18px] border border-black/8 bg-white p-3 sm:p-3.5 text-start transition-all duration-200 after:hidden hover:border-black/20 hover:bg-slate-50/90 active:scale-[0.98] focus-visible:outline-hidden shadow-xs data-[state=active]:border-slate-950 data-[state=active]:bg-gradient-to-br data-[state=active]:from-slate-950 data-[state=active]:via-slate-900 data-[state=active]:to-slate-950 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-slate-950/20 data-[state=active]:ring-2 data-[state=active]:ring-amber-400/40"
          >
            <div className="flex w-full items-center justify-between gap-2">
              <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-[12px] bg-slate-100 text-slate-700 transition-all duration-200 group-hover:scale-105 group-data-[state=active]:bg-amber-400/20 group-data-[state=active]:text-amber-300 group-data-[state=active]:ring-1 group-data-[state=active]:ring-amber-400/40">
                <Building2 className="size-4.5 sm:size-5" />
              </div>
              {totalBranchesCount > 0 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-slate-700 group-data-[state=active]:bg-amber-400/20 group-data-[state=active]:text-amber-300">
                  {totalBranchesCount} فرع
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-col min-w-0">
              <span className="font-bold text-[13.5px] sm:text-[14px] leading-tight text-foreground group-data-[state=active]:text-white">
                الفروع والخزينة
              </span>
              <span className="text-[11px] text-muted-foreground group-data-[state=active]:text-slate-300 leading-tight mt-1 truncate">
                السيولة وشبكة الفروع
              </span>
            </div>
          </TabsTrigger>

          {/* 2. بيانات المتجر */}
          <TabsTrigger
            value="store"
            className="group relative flex h-auto min-h-[76px] sm:min-h-[82px] w-full flex-col items-start justify-between rounded-[18px] border border-black/8 bg-white p-3 sm:p-3.5 text-start transition-all duration-200 after:hidden hover:border-black/20 hover:bg-slate-50/90 active:scale-[0.98] focus-visible:outline-hidden shadow-xs data-[state=active]:border-slate-950 data-[state=active]:bg-gradient-to-br data-[state=active]:from-slate-950 data-[state=active]:via-slate-900 data-[state=active]:to-slate-950 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-slate-950/20 data-[state=active]:ring-2 data-[state=active]:ring-amber-400/40"
          >
            <div className="flex w-full items-center justify-between gap-2">
              <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-[12px] bg-slate-100 text-slate-700 transition-all duration-200 group-hover:scale-105 group-data-[state=active]:bg-amber-400/20 group-data-[state=active]:text-amber-300 group-data-[state=active]:ring-1 group-data-[state=active]:ring-amber-400/40">
                <Store className="size-4.5 sm:size-5" />
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-slate-700 group-data-[state=active]:bg-amber-400/20 group-data-[state=active]:text-amber-300">
                المنشأة
              </span>
            </div>
            <div className="mt-2 flex flex-col min-w-0">
              <span className="font-bold text-[13.5px] sm:text-[14px] leading-tight text-foreground group-data-[state=active]:text-white">
                بيانات المتجر
              </span>
              <span className="text-[11px] text-muted-foreground group-data-[state=active]:text-slate-300 leading-tight mt-1 truncate">
                السجل التجاري والضريبي
              </span>
            </div>
          </TabsTrigger>

          {/* 3. المستخدمون والصلاحيات */}
          <TabsTrigger
            value="employees"
            className="group relative flex h-auto min-h-[76px] sm:min-h-[82px] w-full flex-col items-start justify-between rounded-[18px] border border-black/8 bg-white p-3 sm:p-3.5 text-start transition-all duration-200 after:hidden hover:border-black/20 hover:bg-slate-50/90 active:scale-[0.98] focus-visible:outline-hidden shadow-xs data-[state=active]:border-slate-950 data-[state=active]:bg-gradient-to-br data-[state=active]:from-slate-950 data-[state=active]:via-slate-900 data-[state=active]:to-slate-950 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-slate-950/20 data-[state=active]:ring-2 data-[state=active]:ring-amber-400/40"
          >
            <div className="flex w-full items-center justify-between gap-2">
              <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-[12px] bg-slate-100 text-slate-700 transition-all duration-200 group-hover:scale-105 group-data-[state=active]:bg-amber-400/20 group-data-[state=active]:text-amber-300 group-data-[state=active]:ring-1 group-data-[state=active]:ring-amber-400/40">
                <Users className="size-4.5 sm:size-5" />
              </div>
              {totalEmployeesCount > 0 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-slate-700 group-data-[state=active]:bg-amber-400/20 group-data-[state=active]:text-amber-300">
                  {totalEmployeesCount} موظف
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-col min-w-0">
              <span className="font-bold text-[13.5px] sm:text-[14px] leading-tight text-foreground group-data-[state=active]:text-white">
                المستخدمون والصلاحيات
              </span>
              <span className="text-[11px] text-muted-foreground group-data-[state=active]:text-slate-300 leading-tight mt-1 truncate">
                فريق العمل وكاشير الفروع
              </span>
            </div>
          </TabsTrigger>

          {/* 4. إعدادات عامة */}
          <TabsTrigger
            value="settings"
            className="group relative flex h-auto min-h-[76px] sm:min-h-[82px] w-full flex-col items-start justify-between rounded-[18px] border border-black/8 bg-white p-3 sm:p-3.5 text-start transition-all duration-200 after:hidden hover:border-black/20 hover:bg-slate-50/90 active:scale-[0.98] focus-visible:outline-hidden shadow-xs data-[state=active]:border-slate-950 data-[state=active]:bg-gradient-to-br data-[state=active]:from-slate-950 data-[state=active]:via-slate-900 data-[state=active]:to-slate-950 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-slate-950/20 data-[state=active]:ring-2 data-[state=active]:ring-amber-400/40"
          >
            <div className="flex w-full items-center justify-between gap-2">
              <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-[12px] bg-slate-100 text-slate-700 transition-all duration-200 group-hover:scale-105 group-data-[state=active]:bg-amber-400/20 group-data-[state=active]:text-amber-300 group-data-[state=active]:ring-1 group-data-[state=active]:ring-amber-400/40">
                <Settings2 className="size-4.5 sm:size-5" />
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-slate-700 group-data-[state=active]:bg-amber-400/20 group-data-[state=active]:text-amber-300">
                النظام
              </span>
            </div>
            <div className="mt-2 flex flex-col min-w-0">
              <span className="font-bold text-[13.5px] sm:text-[14px] leading-tight text-foreground group-data-[state=active]:text-white">
                إعدادات عامة
              </span>
              <span className="text-[11px] text-muted-foreground group-data-[state=active]:text-slate-300 leading-tight mt-1 truncate">
                الفواتير، الطباعة والضرائب
              </span>
            </div>
          </TabsTrigger>

          {/* 5. التحويل الابتدائي */}
          <TabsTrigger
            value="onboarding"
            className="col-span-2 sm:col-span-1 group relative flex h-auto min-h-[76px] sm:min-h-[82px] w-full flex-col items-start justify-between rounded-[18px] border border-black/8 bg-white p-3 sm:p-3.5 text-start transition-all duration-200 after:hidden hover:border-black/20 hover:bg-slate-50/90 active:scale-[0.98] focus-visible:outline-hidden shadow-xs data-[state=active]:border-slate-950 data-[state=active]:bg-gradient-to-br data-[state=active]:from-slate-950 data-[state=active]:via-slate-900 data-[state=active]:to-slate-950 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-slate-950/20 data-[state=active]:ring-2 data-[state=active]:ring-amber-400/40"
          >
            <div className="flex w-full items-center justify-between gap-2">
              <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-[12px] bg-slate-100 text-slate-700 transition-all duration-200 group-hover:scale-105 group-data-[state=active]:bg-amber-400/20 group-data-[state=active]:text-amber-300 group-data-[state=active]:ring-1 group-data-[state=active]:ring-amber-400/40">
                <ClipboardCheck className="size-4.5 sm:size-5" />
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-slate-700 group-data-[state=active]:bg-amber-400/20 group-data-[state=active]:text-amber-300">
                افتتاحي
              </span>
            </div>
            <div className="mt-2 flex flex-col min-w-0">
              <span className="font-bold text-[13.5px] sm:text-[14px] leading-tight text-foreground group-data-[state=active]:text-white">
                التحويل الابتدائي
              </span>
              <span className="text-[11px] text-muted-foreground group-data-[state=active]:text-slate-300 leading-tight mt-1 truncate">
                الأرصدة والمخزون الافتتاحي
              </span>
            </div>
          </TabsTrigger>
        </TabsList>

        <div className="w-full min-w-0">
          <TabsContent value="branches" className="m-0 focus-visible:outline-hidden">
            <BranchesSection />
          </TabsContent>
          <TabsContent value="store" className="m-0 focus-visible:outline-hidden">
            <StoreSection />
          </TabsContent>
          <TabsContent value="employees" className="m-0 focus-visible:outline-hidden">
            <EmployeesSection />
          </TabsContent>
          <TabsContent value="settings" className="m-0 focus-visible:outline-hidden space-y-6">
            <BranchPricingAndTaxCard />
            <KeyValuesSection />
          </TabsContent>
          <TabsContent value="onboarding" className="m-0 focus-visible:outline-hidden">
            <OnboardingSection />
          </TabsContent>
        </div>
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
  const navigate = useNavigate()
  const activeBranchId = useActiveBranchId()
  const setSelectedBranchId = useAuthStore((s) => s.setSelectedBranchId)
  const branchId = useAuthStore((s) => s.branchId)

  const { data, isLoading } = useQuery({
    queryKey: ['settings-overview'],
    queryFn: getOverview,
  })

  const [dialog, setDialog] = useState<{ mode: 'add' } | { mode: 'edit'; branch: BranchSummary } | null>(null)
  const [depositOpen, setDepositOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)

  const branches = useMemo(
    () =>
      data?.branches.map((b) => ({
        branchId: b.branchId,
        branchName: b.branchName,
      })) ?? [],
    [data?.branches],
  )

  const depositMutation = useMutation({
    mutationFn: ({ amount, targetBranchId }: { amount: number; targetBranchId?: number }) =>
      depositCash(amount, targetBranchId),
    onSuccess: () => {
      toast.success('تم إيداع الرصيد في الخزينة بنجاح')
      invalidateShopData(queryClient)
      queryClient.invalidateQueries({ queryKey: ['settings-overview'] })
      setDepositOpen(false)
    },
    onError: () => {
      toast.error('فشل إيداع الرصيد. تأكد من إدخال المبلغ.')
    },
  })

  const withdrawMutation = useMutation({
    mutationFn: ({ amount, targetBranchId }: { amount: number; targetBranchId?: number }) =>
      withdrawCash(amount, targetBranchId),
    onSuccess: () => {
      toast.success('تم سحب الرصيد من الخزينة بنجاح')
      invalidateShopData(queryClient)
      queryClient.invalidateQueries({ queryKey: ['settings-overview'] })
      setWithdrawOpen(false)
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? 'فشل سحب الرصيد. تأكد من الرصيد المتاح.')
    },
  })

  const totalCash = data?.branches.reduce((acc, b) => acc + (b.cash ?? 0), 0) ?? 0
  const activeBranch = data?.branches.find((b) => b.branchId === activeBranchId) ?? data?.branches[0]

  return (
    <div className="space-y-6">
      {/* Treasury & Liquidity Control Card */}
      <div className="relative overflow-hidden rounded-[20px] border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.06] via-white to-amber-500/[0.04] p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-[16px] border border-emerald-500/25 bg-emerald-500/15 text-emerald-600">
              <Banknote className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-bold text-foreground sm:text-[19px]">
                  رصيد الخزينة والسيولة النقدية
                </h2>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700">
                  صاحب المحل
                </span>
              </div>
              <p className="text-[13px] text-muted-foreground">
                إيداع وسحب السيولة النقدية المركزية أو تغذية خزائن الفروع المختلفة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => setDepositOpen(true)}
              className="h-10 gap-2 rounded-[12px] bg-emerald-600 px-4 text-[13px] font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-[0.98] touch-target"
            >
              <ArrowDownLeft className="size-4" />
              إيداع رصيد
            </Button>
            <Button
              type="button"
              onClick={() => setWithdrawOpen(true)}
              variant="outline"
              className="h-10 gap-2 rounded-[12px] border-rose-200 bg-rose-50/60 px-4 text-[13px] font-bold text-rose-600 hover:bg-rose-100 hover:text-rose-700 active:scale-[0.98] touch-target"
            >
              <ArrowUpRight className="size-4" />
              سحب رصيد
            </Button>
          </div>
        </div>

        {/* Treasury Metrics Grid */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-[14px] border border-black/5 bg-white p-3.5 shadow-2xs">
            <span className="text-[12px] font-medium text-muted-foreground">إجمالي النقدية بالفروع</span>
            <p className="mt-1 text-[20px] font-bold tabular-nums text-emerald-600">
              {formatEgp(totalCash)}
            </p>
          </div>

          <div className="rounded-[14px] border border-black/5 bg-white p-3.5 shadow-2xs">
            <span className="text-[12px] font-medium text-muted-foreground">الفرع الحالي النشط</span>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-[15px] font-bold text-foreground truncate">
                {activeBranch?.branchName ?? '—'}
              </p>
              <span className="text-[14px] font-bold tabular-nums text-primary">
                {formatEgp(activeBranch?.cash ?? 0)}
              </span>
            </div>
          </div>

          <div className="rounded-[14px] border border-black/5 bg-white p-3.5 shadow-2xs sm:col-span-2 lg:col-span-1">
            <span className="text-[12px] font-medium text-muted-foreground">العمليات النقدية</span>
            <p className="mt-1 text-[13px] font-semibold text-foreground/85">
              تنعكس فوراً على تقارير كشف حركة الخزينة وإغلاق اليوم
            </p>
          </div>
        </div>
      </div>

      {/* كارت إعدادات الضريبة ومصنعيات العيارات في البيع */}
      <BranchPricingAndTaxCard />

      {/* Branches Network Section */}
      <div className="rounded-[20px] border border-black/5 bg-white p-5 shadow-xs sm:p-6 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-black/5 pb-4">
          <div>
            <h3 className="text-[17px] font-bold text-foreground flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              شبكة الفروع والمحلات
              {data?.companyName && (
                <span className="text-[13px] font-normal text-muted-foreground">
                  ({data.companyName})
                </span>
              )}
            </h3>
            <p className="text-[12.5px] text-muted-foreground">
              يمكنك إضافة فروع جديدة، متابعة مبيعاتها وكاش الخزينة، وتحديد الفرع النشط لمبيعات الكاشير.
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            className="gap-2 rounded-[12px] bg-primary text-white h-9.5 px-3.5 text-[12.5px] font-bold shadow-xs hover:bg-primary/90 touch-target"
            onClick={() => setDialog({ mode: 'add' })}
          >
            <Plus className="size-4" />
            إضافة فرع جديد
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3 py-3">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : !data || data.branches.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            لا توجد فروع مسجلة بعد. أضف أول فرع لشركتك.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {data.branches.map((branch) => {
              const isCurrentActive = branch.branchId === activeBranchId
              return (
                <div
                  key={branch.branchId}
                  className={cn(
                    'group relative rounded-[16px] border p-4 sm:p-5 transition-all duration-200',
                    isCurrentActive
                      ? 'border-primary/40 bg-gradient-to-br from-primary/[0.03] to-white shadow-xs ring-1 ring-primary/20'
                      : 'border-black/6 bg-slate-50/40 hover:bg-white hover:border-black/12 hover:shadow-xs',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[16px] font-bold text-foreground">
                          {branch.branchName}
                        </p>
                        {isCurrentActive && (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-500/20">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            الفرع النشط حالياً
                          </span>
                        )}
                      </div>
                      <p className="flex items-center gap-1 text-[12.5px] text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0" />
                        {[branch.city, branch.location, branch.station]
                          .filter(Boolean)
                          .join(' — ') || 'لا يوجد عنوان مسجل'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label="تعديل الفرع"
                        className="rounded-full touch-target hover:bg-muted"
                        onClick={() => setDialog({ mode: 'edit', branch })}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label="حذف الفرع"
                        className="rounded-full text-error hover:bg-error/10 hover:text-error touch-target"
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
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Financial Stats Grid */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-[12px] bg-white p-2.5 border border-black/5">
                      <span className="text-[11px] text-muted-foreground">المبيعات</span>
                      <p className="mt-0.5 text-[14px] font-bold tabular-nums text-foreground">
                        {formatEgp(branch.totalSales)}
                      </p>
                    </div>
                    <div className="rounded-[12px] bg-white p-2.5 border border-black/5">
                      <span className="text-[11px] text-muted-foreground">الخزينة</span>
                      <p className="mt-0.5 text-[14px] font-bold tabular-nums text-emerald-600">
                        {formatEgp(branch.cash)}
                      </p>
                    </div>
                    <div className="rounded-[12px] bg-white p-2.5 border border-black/5">
                      <span className="text-[11px] text-muted-foreground">الموظفون</span>
                      <p className="mt-0.5 text-[14px] font-bold tabular-nums text-foreground">
                        {branch.employees.length}
                      </p>
                    </div>
                  </div>

                  {/* Commission and Actions */}
                  <div className="mt-3 flex flex-col gap-2 pt-2 border-t border-black/5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-[12px] text-muted-foreground">
                      عمولة الشراء من عميل:{' '}
                      <span className="font-bold text-foreground tabular-nums">
                        {branch.buyFromCustomerCommission != null
                          ? `${(branch.buyFromCustomerCommission * 100).toFixed(2)}%`
                          : '1.50%'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isCurrentActive ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBranchId(branch.branchId)
                            toast.success(`تم التبديل إلى ${branch.branchName}`)
                          }}
                          className="h-8 rounded-[10px] text-[11px] font-bold text-foreground gap-1.5 touch-target"
                        >
                          <CheckCircle2 className="size-3.5 text-muted-foreground" />
                          تعيين كفرع حالي
                        </Button>
                      ) : null}

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setSelectedBranchId(branch.branchId)
                          navigate('/app/sales')
                        }}
                        className="h-8 rounded-[10px] bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold gap-1.5 touch-target"
                      >
                        <ExternalLink className="size-3" />
                        نقطة البيع (POS)
                      </Button>
                    </div>
                  </div>

                  {/* Staff Pills */}
                  {branch.employees.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1 pt-1">
                      {branch.employees.map((emp) => (
                        <Badge key={emp.id} variant="outline" className="gap-1 text-[10.5px] py-0">
                          {emp.fullName}
                          {emp.roles[0] && (
                            <span className="text-muted-foreground text-[10px]">
                              ({roleLabels[emp.roles[0]] ?? emp.roles[0]})
                            </span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <BranchDialog
        key={dialog?.mode === 'edit' ? `edit-${dialog.branch.branchId}` : dialog === null ? 'closed' : 'add'}
        dialog={dialog}
        onClose={() => setDialog(null)}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['settings-overview'] })
          setDialog(null)
        }}
      />

      <DepositDialog
        open={depositOpen}
        onOpenChange={setDepositOpen}
        submitting={depositMutation.isPending}
        onSubmit={(amount, targetBranchId) =>
          depositMutation.mutate({ amount, targetBranchId })
        }
        branches={branches}
        defaultBranchId={branchId}
      />

      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        submitting={withdrawMutation.isPending}
        onSubmit={(amount, targetBranchId) =>
          withdrawMutation.mutate({ amount, targetBranchId })
        }
        branches={branches}
        defaultBranchId={branchId}
      />
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
      toast.success(isEdit ? 'تم تعديل الفرع بنجاح' : 'تمت إضافة الفرع بنجاح')
      onSaved()
    },
    onError: () => toast.error('تعذّر حفظ الفرع'),
  })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex size-9 items-center justify-center rounded-[12px] bg-amber-500/15 text-amber-600">
              <Building2 className="size-5" />
            </div>
            <DialogTitle>{isEdit ? 'تعديل بيانات الفرع' : 'إضافة فرع جديد'}</DialogTitle>
          </div>
          <DialogDescription>
            {isEdit
              ? 'تحديث بيانات الموقع، المدينة وعمولة الشراء الخاصة بالفرع.'
              : 'أدخل تفاصيل الفرع الجديد لربطه بالنظام والخزينة المركزية.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 space-y-4">
          <FieldRow label="اسم الفرع">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: فرع وسط البلد"
              className="h-11 rounded-[14px] touch-target focus:border-amber-500 focus:ring-amber-500/20"
            />
          </FieldRow>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FieldRow label="المدينة">
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="مثال: القاهرة"
                className="h-11 rounded-[14px] touch-target focus:border-amber-500 focus:ring-amber-500/20"
              />
            </FieldRow>
            <FieldRow label="المنطقة / المحطة">
              <Input
                value={station}
                onChange={(e) => setStation(e.target.value)}
                placeholder="مثال: الصاغة"
                className="h-11 rounded-[14px] touch-target focus:border-amber-500 focus:ring-amber-500/20"
              />
            </FieldRow>
          </div>
          <FieldRow label="العنوان بالتفصيل">
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="مثال: شارع المعز، مبنى 12"
              className="h-11 rounded-[14px] touch-target focus:border-amber-500 focus:ring-amber-500/20"
            />
          </FieldRow>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FieldRow label="دولة التشغيل / العملة">
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="h-11 w-full rounded-[14px] touch-target focus:border-amber-500 focus:ring-amber-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EG">مصر — جنيه مصري (ج.م)</SelectItem>
                  <SelectItem value="SA">السعودية — ريال سعودي (ر.س)</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="عمولة الشراء من عميل (%)">
              <Input
                value={commissionPct}
                onChange={(e) => setCommissionPct(e.target.value)}
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                dir="ltr"
                placeholder="1.5"
                className="h-11 rounded-[14px] touch-target focus:border-amber-500 focus:ring-amber-500/20"
              />
            </FieldRow>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-11 rounded-[14px] px-5 font-bold touch-target"
          >
            إلغاء
          </Button>
          <Button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !name.trim()}
            className="h-11 rounded-[14px] bg-slate-900 hover:bg-slate-800 text-white px-6 font-bold shadow-sm touch-target"
          >
            {mutation.isPending ? 'جارٍ الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إضافة الفرع'}
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex size-9 items-center justify-center rounded-[12px] bg-sky-500/15 text-sky-600">
              <UserCog className="size-5" />
            </div>
            <DialogTitle>{isEdit ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}</DialogTitle>
          </div>
          <DialogDescription>
            {isEdit
              ? 'تحديث بيانات الحساب، تعيين الفرع أو كلمة المرور للموظف.'
              : 'أدخل بيانات الموظف وصلاحيته وحدد الفرع التابع له.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 space-y-4">
          <FieldRow label="الاسم الكامل">
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: أحمد محمد محمود"
              className="h-11 rounded-[14px] touch-target focus:border-sky-500 focus:ring-sky-500/20"
            />
          </FieldRow>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FieldRow label="رقم الهاتف">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010xxxxxxxx"
                className="h-11 rounded-[14px] touch-target focus:border-sky-500 focus:ring-sky-500/20"
              />
            </FieldRow>
            <FieldRow label="رقم البطاقة الشخصية">
              <Input
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="الرقم القومي"
                className="h-11 rounded-[14px] touch-target focus:border-sky-500 focus:ring-sky-500/20"
              />
            </FieldRow>
          </div>
          <FieldRow label="البريد الإلكتروني (لتسجيل الدخول)">
            <Input
              value={email}
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@jeweler.com"
              className="h-11 rounded-[14px] touch-target focus:border-sky-500 focus:ring-sky-500/20"
            />
          </FieldRow>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FieldRow label="الفرع">
              <Select
                value={branchId}
                onValueChange={(v) => setBranchId(v)}
              >
                <SelectTrigger className="h-11 w-full rounded-[14px] touch-target focus:border-sky-500 focus:ring-sky-500/20">
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
            <FieldRow label="الدور والصلاحية">
              <Select
                value={roleDraft}
                onValueChange={(v) => {
                  setRoleDraft(v)
                  setRole(v)
                }}
                disabled={rolesLocked}
              >
                <SelectTrigger className="h-11 w-full rounded-[14px] touch-target focus:border-sky-500 focus:ring-sky-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sale">بائع / كاشير</SelectItem>
                  <SelectItem value="Manager">مدير فرع</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>
          </div>
          <FieldRow
            label={isEdit ? 'كلمة المرور الجديدة (اتركها فارغة لإبقائها كما هي)' : 'كلمة المرور'}
          >
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isEdit && Boolean(emp?.roles.includes('Owner'))}
              placeholder={isEdit ? '••••••••' : 'أدخل كلمة مرور قوية'}
              className="h-11 rounded-[14px] touch-target focus:border-sky-500 focus:ring-sky-500/20"
            />
          </FieldRow>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-11 rounded-[14px] px-5 font-bold touch-target"
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
            className="h-11 rounded-[14px] bg-slate-900 hover:bg-slate-800 text-white px-6 font-bold shadow-sm touch-target"
          >
            {pending ? 'جارٍ الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إضافة الموظف'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BranchPricingAndTaxCard() {
  const queryClient = useQueryClient()
  const { data: keyValues, isLoading } = useQuery({
    queryKey: ['settings-keyvalues'],
    queryFn: getKeyValues,
  })

  const stampAndTaxRate = useTaxStore((s) => s.stampAndTaxRate)
  const setStampAndTaxRate = useTaxStore((s) => s.setStampAndTaxRate)
  const karatMakingFees = useTaxStore((s) => s.karatMakingFees)
  const setKaratMakingFees = useTaxStore((s) => s.setKaratMakingFees)

  // قراءة القيم المسجلة من السيرفر كأولوية
  const serverTaxRate = useMemo(() => {
    if (!Array.isArray(keyValues)) return null
    const found = keyValues.find((it) => it.key === SALE_TAX_RATE_KEY)
    return found?.value != null && found.value.trim() !== '' ? found.value : null
  }, [keyValues])

  const serverFee14 = useMemo(() => {
    if (!Array.isArray(keyValues)) return null
    return keyValues.find((it) => it.key === KARAT_MAKING_KEYS[14])?.value ?? null
  }, [keyValues])
  const serverFee18 = useMemo(() => {
    if (!Array.isArray(keyValues)) return null
    return keyValues.find((it) => it.key === KARAT_MAKING_KEYS[18])?.value ?? null
  }, [keyValues])
  const serverFee21 = useMemo(() => {
    if (!Array.isArray(keyValues)) return null
    return keyValues.find((it) => it.key === KARAT_MAKING_KEYS[21])?.value ?? null
  }, [keyValues])
  const serverFee24 = useMemo(() => {
    if (!Array.isArray(keyValues)) return null
    return keyValues.find((it) => it.key === KARAT_MAKING_KEYS[24])?.value ?? null
  }, [keyValues])

  const [taxRateDraft, setTaxRateDraft] = useState<string | null>(null)
  const [fee14Draft, setFee14Draft] = useState<string | null>(null)
  const [fee18Draft, setFee18Draft] = useState<string | null>(null)
  const [fee21Draft, setFee21Draft] = useState<string | null>(null)
  const [fee24Draft, setFee24Draft] = useState<string | null>(null)

  const taxInput = taxRateDraft ?? serverTaxRate ?? (stampAndTaxRate * 100).toString()
  const fee14Input = fee14Draft ?? serverFee14 ?? (karatMakingFees[14] || 0).toString()
  const fee18Input = fee18Draft ?? serverFee18 ?? (karatMakingFees[18] || 0).toString()
  const fee21Input = fee21Draft ?? serverFee21 ?? (karatMakingFees[21] || 0).toString()
  const fee24Input = fee24Draft ?? serverFee24 ?? (karatMakingFees[24] || 0).toString()

  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const parsedTax = Math.max(0, Math.min(100, parseFloat(taxInput) || 0))
      const f14 = Math.max(0, parseFloat(fee14Input) || 0)
      const f18 = Math.max(0, parseFloat(fee18Input) || 0)
      const f21 = Math.max(0, parseFloat(fee21Input) || 0)
      const f24 = Math.max(0, parseFloat(fee24Input) || 0)

      // حفظ القيم في السيرفر لجميع الأجهزة والتابلت
      await Promise.all([
        upsertKeyValue({ key: SALE_TAX_RATE_KEY, value: parsedTax.toString() }),
        upsertKeyValue({ key: KARAT_MAKING_KEYS[14], value: f14.toString() }),
        upsertKeyValue({ key: KARAT_MAKING_KEYS[18], value: f18.toString() }),
        upsertKeyValue({ key: KARAT_MAKING_KEYS[21], value: f21.toString() }),
        upsertKeyValue({ key: KARAT_MAKING_KEYS[24], value: f24.toString() }),
      ])

      // تحديث المتجر المحلي فوراً
      setStampAndTaxRate(parsedTax / 100)
      setKaratMakingFees({ 14: f14, 18: f18, 21: f21, 24: f24 })

      toast.success('تم حفظ وتطبيق نسبة الضريبة ومصنعيات العيارات في البيع بنجاح!')
      queryClient.invalidateQueries({ queryKey: ['settings-keyvalues'] })
      queryClient.invalidateQueries({ queryKey: ['server-tax-rate'] })
    } catch {
      toast.error('تعذّر حفظ الإعدادات، يرجى المحاولة ثانية')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl elevation-card border-black/5 bg-white mb-6">
      <CardHeader className="border-b border-black/5 bg-amber-500/[0.04]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-[12px] bg-amber-500/15 text-amber-700">
              <Banknote className="size-5" />
            </div>
            <div>
              <CardTitle className="text-[16px] font-bold text-foreground">
                إعدادات الضريبة والدمغة ومصنعيات العيارات في البيع
              </CardTitle>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                تحديد نسبة الدمغة والضريبة ومصنعية الجرام لكل عيار وتطبيقها إلزامياً في فواتير ونقاط البيع
              </p>
            </div>
          </div>
          <span className="rounded-full bg-amber-100 border border-amber-300/80 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
            تطبيق إلزامي في الـ POS
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : (
          <>
            {/* 1. نسبة الدمغة والضريبة */}
            <div className="rounded-2xl border border-amber-300/60 bg-amber-50/50 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Label className="text-[14px] font-bold text-foreground">
                    نسبة الدمغة والضريبة على فاتورة البيع (%)
                  </Label>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    النسبة المئوية التي تُحتسب على قيمة الذهب في فواتير البيع (الافتراضي 1%، أو 1.5% أو 2%).
                  </p>
                </div>
                <span className="rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-[13px] font-black text-amber-900 tabular-nums">
                  النسبة: {taxInput || '1'}%
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={taxInput}
                  onChange={(e) => setTaxRateDraft(e.target.value)}
                  type="number"
                  step="0.05"
                  min="0"
                  max="100"
                  className="h-11 w-32 rounded-[14px] bg-white text-center font-bold tabular-nums text-foreground touch-target"
                  placeholder="1.0"
                />
                <div className="flex flex-wrap items-center gap-1.5">
                  {['0', '0.5', '1', '1.25', '1.5', '2'].map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setTaxRateDraft(preset)}
                      className={cn(
                        'h-9 rounded-full text-[12px] font-bold tabular-nums touch-target',
                        taxInput === preset && 'bg-primary text-white border-primary shadow-xs',
                      )}
                    >
                      {preset}%
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. مصنعيات العيارات الافتراضية */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[14px] font-bold text-foreground">
                    أسعار المصنعية للعيارات في البيع (ج.م / جرام)
                  </Label>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    تُطبق هذه المصنعية إلزامياً على المشغولات حسب العيار عند البيع وفي كروت المعروضات
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-black/8 bg-secondary/30 p-3 space-y-1.5">
                  <span className="text-[12px] font-bold text-foreground">مصنعية عيار 14</span>
                  <div className="relative">
                    <Input
                      value={fee14Input}
                      onChange={(e) => setFee14Draft(e.target.value)}
                      type="number"
                      min="0"
                      step="5"
                      className="h-10 pe-9 bg-white text-center font-bold tabular-nums touch-target"
                      placeholder="0"
                    />
                    <span className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">
                      ج.م
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-black/8 bg-secondary/30 p-3 space-y-1.5">
                  <span className="text-[12px] font-bold text-foreground">مصنعية عيار 18</span>
                  <div className="relative">
                    <Input
                      value={fee18Input}
                      onChange={(e) => setFee18Draft(e.target.value)}
                      type="number"
                      min="0"
                      step="5"
                      className="h-10 pe-9 bg-white text-center font-bold tabular-nums touch-target"
                      placeholder="0"
                    />
                    <span className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">
                      ج.م
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-black/8 bg-secondary/30 p-3 space-y-1.5 ring-1 ring-amber-400/40">
                  <span className="text-[12px] font-black text-amber-900">مصنعية عيار 21</span>
                  <div className="relative">
                    <Input
                      value={fee21Input}
                      onChange={(e) => setFee21Draft(e.target.value)}
                      type="number"
                      min="0"
                      step="5"
                      className="h-10 pe-9 bg-white text-center font-bold tabular-nums touch-target border-amber-300"
                      placeholder="0"
                    />
                    <span className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[10px] text-amber-800 font-bold">
                      ج.م
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-black/8 bg-secondary/30 p-3 space-y-1.5">
                  <span className="text-[12px] font-bold text-foreground">مصنعية عيار 24</span>
                  <div className="relative">
                    <Input
                      value={fee24Input}
                      onChange={(e) => setFee24Draft(e.target.value)}
                      type="number"
                      min="0"
                      step="5"
                      className="h-10 pe-9 bg-white text-center font-bold tabular-nums touch-target"
                      placeholder="0"
                    />
                    <span className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">
                      ج.م
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* زر الحفظ والتطبيق */}
            <div className="pt-2 flex justify-end">
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="h-11 px-8 rounded-full font-bold bg-primary hover:bg-primary/90 text-white gap-2 touch-target shadow-xs"
              >
                {saving ? 'جارٍ الحفظ...' : 'حفظ وتطبيق فوراً على فواتير البيع'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
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
