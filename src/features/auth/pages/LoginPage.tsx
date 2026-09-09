import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Loader2,
  Gem,
  ShieldAlert,
  Eye,
  EyeOff,
  Phone,
  Lock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  MessageCircle,
} from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { loginRequest } from '@/features/auth/api'
import type { User } from '@/shared/stores/auth-store'
import { useAuthStore } from '@/shared/stores/auth-store'
import { extractServerMessage } from '@/shared/lib/serverError'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { WHATSAPP_LINK } from '@/shared/lib/seo'
import { goldVaultSecurityImg } from '@/assets/images'

interface LoginFormData {
  phone: string
  password: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState<LoginFormData>(() => {
    let savedPhone = ''
    try {
      savedPhone = localStorage.getItem('gold_saved_phone') || ''
    } catch {
      // ignore
    }
    return { phone: savedPhone, password: '' }
  })
  const [showPassword, setShowPassword] = useState(false)
  const [rememberPhone, setRememberPhone] = useState(true)
  const [error, setError] = useState('')
  const [expired, setExpired] = useState(false)

  const mutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      if (rememberPhone && form.phone) {
        try {
          localStorage.setItem('gold_saved_phone', form.phone)
        } catch {
          // ignore
        }
      } else {
        try {
          localStorage.removeItem('gold_saved_phone')
        } catch {
          // ignore
        }
      }

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
        'فشل تسجيل الدخول. تأكد من صحة رقم الهاتف وكلمة المرور وحاول مجدداً.',
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

  return (
    <div className="flex min-h-screen bg-[#0a0a0d] text-neutral-100">
      {/* 3D Visual Showcase Side (Desktop & Large Tablet) */}
      <div className="hidden w-1/2 flex-col justify-between border-e border-neutral-800 bg-gradient-to-br from-neutral-950 via-[#0d0d12] to-amber-950/30 p-10 lg:flex relative overflow-hidden">
        {/* Background glow effects */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-80 w-80 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

        {/* Top bar with back to home link */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/80 px-4 py-2 text-xs font-bold text-neutral-300 transition-colors hover:border-amber-400/40 hover:text-white"
          >
            <ArrowRight className="h-4 w-4 text-amber-400" />
            <span>العودة للموقع التعريفي</span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-amber-400/90 font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            <span>إصدار التابلت 10 إنش 2026</span>
          </div>
        </div>

        {/* 3D Image & Value Banner */}
        <div className="relative z-10 my-auto max-w-lg mx-auto text-center space-y-6">
          <div className="relative mx-auto w-72 sm:w-80 group">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber-500 to-yellow-500 opacity-30 blur-xl group-hover:opacity-50 transition-opacity" />
            <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-neutral-950 shadow-2xl">
              <img
                src={goldVaultSecurityImg}
                alt="3D Gold Security Vault"
                referrerPolicy="no-referrer"
                className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute bottom-3 right-3 left-3 rounded-xl bg-neutral-950/85 backdrop-blur-md p-2.5 border border-amber-500/20 text-right">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <ShieldCheck className="h-4 w-4 text-amber-400" />
                  <span>خزينة إلكترونية مشفرة بأعلى معايير الأمان</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold text-white">
              جولد ماستر <span className="text-amber-400">Gold Master ERP</span>
            </h1>
            <p className="text-sm text-neutral-300 leading-relaxed max-w-md mx-auto">
              إدارة دقيقة لمخزون الذهب والمشغولات، كاشير اللمس، حسابات الكسر والمصنعية، وفواتير الصاغة في منظومة سحابية واحدة.
            </p>
          </div>
        </div>

        {/* Footer badges */}
        <div className="relative z-10 flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-800/80 pt-4">
          <span>دعم فني مستمر 24/7</span>
          <span className="text-amber-400 font-bold">نسخ احتياطي سحابي تلقائي</span>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Back button & Brand */}
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-white"
            >
              <ArrowRight className="h-4 w-4 text-amber-400" />
              <span>الرئيسية</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950">
                <Gem className="h-4 w-4 fill-neutral-950" />
              </span>
              <span className="font-bold text-white">جولد ماستر</span>
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300 mb-3">
              <Lock className="h-3.5 w-3.5 text-amber-400" />
              <span>تسجيل دخول آمن للموظفين والمديرين</span>
            </div>
            <h2 className="text-3xl font-black text-white">تسجيل الدخول للنظام</h2>
            <p className="mt-2 text-sm text-neutral-400">
              أدخل رقم الهاتف وكلمة المرور للوصول إلى لوحة تحكم محلك.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div
                role="alert"
                className={cn(
                  'rounded-2xl border p-4 text-sm backdrop-blur-sm',
                  expired
                    ? 'border-red-500/40 bg-red-950/40 text-red-300'
                    : 'border-red-500/30 bg-red-950/30 text-red-300',
                )}
              >
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                  <div className="flex-1">
                    {expired ? (
                      <div>
                        <strong className="block font-bold text-red-200">انتهت فترة اشتراك الشركة</strong>
                        <p className="mt-1 text-xs text-red-300/90 leading-relaxed">{error}</p>
                        <a
                          href={WHATSAPP_LINK}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-900/60 border border-red-500/40 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-900"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          تجديد الاشتراك فوراً عبر واتساب
                        </a>
                      </div>
                    ) : (
                      <span>{error}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Phone input */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs font-bold text-neutral-300">
                رقم الهاتف (اسم المستخدم)
              </Label>
              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  required
                  autoFocus
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="01xxxxxxxxx"
                  className="h-12 rounded-xl border-neutral-700 bg-neutral-900/90 text-white placeholder:text-neutral-500 pe-10 focus:border-amber-400 focus:ring-amber-400 tabular-nums"
                />
                <Phone className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-neutral-500" />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold text-neutral-300">
                  كلمة المرور
                </Label>
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-amber-400/90 hover:text-amber-300 transition-colors"
                >
                  نسيت كلمة المرور؟
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="h-12 rounded-xl border-neutral-700 bg-neutral-900/90 text-white placeholder:text-neutral-500 pe-10 ps-10 focus:border-amber-400 focus:ring-amber-400"
                />
                <Lock className="pointer-events-none absolute right-3 top-3.5 h-5 w-5 text-neutral-500" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="touch-target absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-lg text-neutral-400 hover:text-white"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember phone on tablet */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 text-xs text-neutral-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberPhone}
                  onChange={(e) => setRememberPhone(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-400"
                />
                <span>تذكر رقم الهاتف على هذا الجهاز (التابلت)</span>
              </label>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              size="lg"
              disabled={mutation.isPending}
              className="touch-target h-12 w-full rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 font-bold text-neutral-950 shadow-[0_4px_20px_rgba(245,158,11,0.35)] transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {mutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  تسجيل الدخول إلى المحل
                </span>
              )}
            </Button>
          </form>

          {/* Quick Help Footer */}
          <div className="mt-8 pt-6 border-t border-neutral-800 text-center space-y-3">
            <p className="text-xs text-neutral-400">
              ليس لديك حساب بعد أو ترغب في الاشتراك؟
            </p>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>تواصل مع المبيعات لتفعيل حساب محلك فوراً</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
