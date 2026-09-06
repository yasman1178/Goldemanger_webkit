import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Gem, ShieldAlert } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { loginRequest } from '@/features/auth/api'
import type { User } from '@/shared/stores/auth-store'
import { useAuthStore } from '@/shared/stores/auth-store'
import { extractServerMessage } from '@/shared/lib/serverError'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'

interface LoginFormData {
  phone: string
  password: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState<LoginFormData>({ phone: '', password: '' })
  const [error, setError] = useState('')
  const [expired, setExpired] = useState(false)

  const mutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      const user: User = {
        id: data.employeeDetails.employeeId,
        userName: data.employeeDetails.employeeName,
        email: '',
        roles: [data.role],
      }
      setAuth(
        user,
        data.token,
        data.refreshToken,
        data.branchDetails,
        Number(data.employeeDetails.branchId),
      )
      navigate('/app')
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 402) setExpired(true)
      const msg = extractServerMessage(
        err,
        'فشل تسجيل الدخول. تأكد من البيانات وحاول مرة أخرى.',
      )
      setError(msg)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setExpired(false)
    mutation.mutate({ phoneNumber: form.phone, password: form.password })
  }

  function handleDemoLogin() {
    const user: User = {
      id: 'demo',
      userName: 'مدير تجريبي',
      email: 'demo@goldmaster.local',
      roles: ['Manager'],
    }
    setAuth(
      user,
      'demo-token',
      'demo-refresh',
      { totalCash: 0, totalDebts: 0, totalExpenses: 0, totalSales: 0, branchName: 'فرع تجريبي' },
      1,
    )
    navigate('/app')
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden w-1/2 flex-col justify-center bg-[#0a0a0a] p-12 text-white lg:flex">
        <div className="mx-auto max-w-md">
          <div className="mb-6 flex size-14 items-center justify-center rounded-[18px] bg-primary">
            <Gem className="size-7 text-white" />
          </div>
          <h1 className="text-[40px] font-bold leading-[1.15]">Gold Master</h1>
          <p className="mt-4 text-[17px] leading-[1.6] text-[#cccccc]">
            نظام الجرد الذكي لإدارة المنتجات والمبيعات والمشتريات والخزينة
            لمحلات الذهب والمجوهرات.
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-[14px] bg-primary">
              <Gem className="size-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">Gold Master</span>
          </div>

          <h2 className="text-[34px] font-bold leading-[1.2] text-foreground">
            تسجيل الدخول
          </h2>
          <p className="mb-8 text-muted-foreground">
            أدخل بياناتك للوصول إلى لوحة التحكم
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div
                role="alert"
                className={cn(
                  'flex items-start gap-2 rounded-[14px] border px-3 py-3 text-sm',
                  expired
                    ? 'border-error/40 bg-error/10 text-error'
                    : 'border-error/30 bg-error/5 text-error',
                )}
              >
                {expired && <ShieldAlert className="mt-0.5 size-4 shrink-0" />}
                <span className="flex-1">
                  {expired ? (
                    <>
                      <span className="block font-bold">انتهى اشتراك الشركة</span>
                      <span className="mt-1 block text-[13px]">{error}</span>
                    </>
                  ) : (
                    error
                  )}
                </span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="01xxxxxxxxx"
                className="h-12 touch-target rounded-[14px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="h-12 touch-target rounded-[14px]"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={mutation.isPending}
              className="h-12 w-full rounded-full touch-target"
            >
              {mutation.isPending && <Loader2 className="animate-spin" />}
              تسجيل الدخول
            </Button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[13px] text-muted-foreground">أو</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={handleDemoLogin}
              className="h-12 w-full rounded-full border-primary text-primary touch-target hover:bg-primary/5"
            >
              دخول تجريبي
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
