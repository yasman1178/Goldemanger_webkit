import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard,
  Menu,
  Package,
  ShoppingCart,
  Store,
  LogOut,
  Gem,
  Banknote,
  Boxes,
  Wallet,
  ReceiptText,
  TrendingDown,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  KeyRound,
  TrendingUp,
  Scale,
  Recycle,
} from 'lucide-react'

import { useAuthStore } from '@/shared/stores/auth-store'
import { useCurrencyStore } from '@/shared/stores/currency-store'
import { useTaxStore, SALE_TAX_RATE_KEY } from '@/shared/stores/tax-store'
import { getOverview, getKeyValues } from '@/features/settings/api'
import { BranchSelector } from '@/shared/components/BranchSelector'
import { ConnectionBadge } from '@/shared/components/ConnectionBadge'
import { SidebarInstallButton } from '@/features/public-site/components/InstallAppButton'
import { GoldPriceBar } from '@/features/sales/components/pos/GoldPriceBar'
import { OnboardingBanner } from '@/features/settings/components/OnboardingBanner'
import { ChangePasswordDialog } from '@/features/auth/components/ChangePasswordDialog'
import { logoutRequest } from '@/features/auth/api'
import { Button } from '@/shared/components/ui/button'
import { cn, currencyFromCountry } from '@/shared/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet'

/**
 * أولوية التنقل وفق §47: لوحة التحكم ← المبيعات ← المشتريات ← المنتجات ← الجرد ← الخزينة
 */
type NavItem = {
  to: string
  label: string
  icon: typeof LayoutDashboard
  roles?: string[]
  end?: boolean
}

const navItems: NavItem[] = [
  { to: '/app', label: 'لوحة التحكم', icon: LayoutDashboard },
  { to: '/app/sales', label: 'المبيعات', icon: ShoppingCart },
  { to: '/app/sales/history', label: 'سجلات المبيعات', icon: ReceiptText },
  { to: '/app/purchases', label: 'المشتريات', icon: Store },
  { to: '/app/products', label: 'المنتجات', icon: Package },
  { to: '/app/products/stagnant', label: 'الأصناف الراكدة', icon: Recycle },
  { to: '/app/inventory', label: 'الجرد', icon: Boxes },
  { to: '/app/cash', label: 'الخزينة', icon: Banknote },
  { to: '/app/debts', label: 'المديونيات', icon: Wallet },
  { to: '/app/expenses', label: 'المصروفات والسلف والأجور', icon: TrendingDown },
  { to: '/app/profits', label: 'أرباح المصنعية', icon: TrendingUp, roles: ['Owner'] },
  { to: '/app/price-reviews', label: 'مراجعة الأسعار', icon: Scale, roles: ['Owner', 'Manager'] },
  { to: '/app/settings', label: 'إدارة الشركة', icon: Settings, roles: ['Owner'] },
  { to: '/app/admin', label: 'إدارة النظام', icon: ShieldCheck, roles: ['Responsible'] },
]

function Brand({ collapsed = false, onToggle }: { collapsed?: boolean; onToggle?: () => void }) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 border-b border-black/5 py-3 px-1">
        <div className="flex size-10 items-center justify-center rounded-[12px] bg-primary text-white shadow-xs">
          <Gem className="size-5" />
        </div>
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="توسيع القائمة"
            title="توسيع القائمة"
            onClick={onToggle}
            className="size-8 rounded-lg text-muted-foreground hover:bg-black/5 hover:text-foreground touch-target"
          >
            <PanelLeftOpen className="size-4.5" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-16 items-center justify-between border-b border-black/5 px-3.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-primary text-white shadow-xs">
          <Gem className="size-5" />
        </div>
        <span className="truncate text-[16px] font-bold tracking-tight text-foreground">GOLD POS</span>
      </div>
      {onToggle && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="طي القائمة"
          title="طي القائمة"
          onClick={onToggle}
          className="size-8 shrink-0 rounded-lg text-muted-foreground hover:bg-black/5 hover:text-foreground touch-target"
        >
          <PanelLeftClose className="size-4.5" />
        </Button>
      )}
    </div>
  )
}

function NavLinkItem({
  to,
  label,
  icon: Icon,
  end,
  collapsed = false,
}: {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
  collapsed?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-[12px] transition-colors touch-target',
          collapsed
            ? 'size-11 justify-center mx-auto p-0'
            : 'px-3 py-2.5 text-[14px] font-semibold leading-tight',
          isActive
            ? 'bg-primary text-white shadow-xs'
            : 'text-foreground/80 hover:bg-black/5 hover:text-foreground',
        )
      }
      title={collapsed ? label : undefined}
    >
      <Icon className="size-5 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )
}

function NavLinks({ collapsed = false }: { collapsed?: boolean }) {
  const roles = useAuthStore((s) => s.user?.roles ?? [])
  const visible = navItems.filter(
    (item) => !item.roles || item.roles.some((r) => roles.includes(r)),
  )
  return (
    <nav className="flex flex-col gap-1">
      {visible.map((item) => (
        <NavLinkItem
          key={item.to}
          to={item.to}
          label={item.label}
          icon={item.icon}
          end={item.to === '/app'}
          collapsed={collapsed}
        />
      ))}
    </nav>
  )
}

function UserFooter({ collapsed = false }: { collapsed?: boolean }) {
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const initial = user?.userName?.trim().charAt(0) ?? '؟'

  // مسح الحالة في الواجهة لا يكفي بعد الانتقال للكوكيز HttpOnly: لولا نداء
  // الخادم لبقي كوكي الجلسة صالحاً وكل طلب API معتمداً عليه. نُنظّف من
  // الخادم أولاً، ثم نمسح الحالة محلياً دائماً حتى لو فشل النداء.
  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logoutRequest()
    } catch {
      // الخروج محلي يبقى مطلوباً حتى لو تعذّر إبلاغ الخادم
    } finally {
      clearAuth()
      setLoggingOut(false)
    }
  }

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 border-t border-black/5 py-3 px-1">
        <div
          title={user?.userName}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-[14px] font-bold text-foreground"
        >
          {initial}
        </div>
        <div className="flex flex-col gap-1 items-center">
          <Button
            variant="ghost"
            size="icon"
            aria-label="تغيير كلمة المرور"
            title="تغيير كلمة المرور"
            className="size-8 rounded-lg text-muted-foreground hover:text-primary touch-target"
            onClick={() => setPasswordOpen(true)}
          >
            <KeyRound className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="تسجيل الخروج"
            title="تسجيل الخروج"
            className="size-8 rounded-lg text-muted-foreground hover:text-destructive touch-target"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
        <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
      </div>
    )
  }

  return (
    <div className="border-t border-black/5 p-3">
      <div className="flex items-center gap-2.5 rounded-[12px] p-1.5 hover:bg-black/[0.02]">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-[14px] font-bold text-foreground">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold text-foreground">
            {user?.userName}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">{user?.email}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="تغيير كلمة المرور"
          title="تغيير كلمة المرور"
          className="size-8 shrink-0 rounded-lg text-muted-foreground hover:text-primary touch-target"
          onClick={() => setPasswordOpen(true)}
        >
          <KeyRound className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="تسجيل الخروج"
          title="تسجيل الخروج"
          className="size-8 shrink-0 rounded-lg text-muted-foreground hover:text-destructive touch-target"
          onClick={handleLogout}
            disabled={loggingOut}
        >
          <LogOut className="size-4" />
        </Button>
      </div>
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </div>
  )
}

const bottomItems = [
  { to: '/app', label: 'الرئيسية', icon: LayoutDashboard },
  { to: '/app/sales', label: 'المبيعات', icon: ShoppingCart },
  { to: '/app/purchases', label: 'المشتريات', icon: Store },
  { to: '/app/products', label: 'المنتجات', icon: Package },
]

function BottomNav({ onMore }: { onMore: () => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-black/5 bg-white/90 backdrop-blur md:hidden">
      {bottomItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/app'}
          className={({ isActive }) =>
            cn(
              'flex min-w-0 flex-1 flex-col items-center gap-1 px-2 py-2 touch-target',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )
          }
        >
          <item.icon className="size-6" />
          <span className="text-[11px] font-semibold leading-[1.2]">{item.label}</span>
        </NavLink>
      ))}
      <button
        type="button"
        onClick={onMore}
        className="flex min-w-0 flex-1 flex-col items-center gap-1 px-2 py-2 text-muted-foreground touch-target"
      >
        <MoreHorizontal className="size-6" />
        <span className="text-[11px] font-semibold leading-[1.2]">المزيد</span>
      </button>
    </nav>
  )
}

export function AppLayout() {
  const [open, setOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024
    }
    return false
  })
  const { pathname } = useLocation()
  const branchName = useAuthStore((s) => s.branchDetails?.branchName)
  const branchDetails = useAuthStore((s) => s.branchDetails)
  const roles = useAuthStore((s) => s.user?.roles ?? [])
  const branchId = useAuthStore((s) => s.branchId)
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId)
  const setCurrency = useCurrencyStore((s) => s.setCurrency)
  const isOwner = roles.includes('Owner')
  const hasBranch = Boolean(branchId && branchId > 0)

  const { data: overview } = useQuery({
    queryKey: ['overview'],
    queryFn: getOverview,
    enabled: isOwner && hasBranch,
    retry: false,
  })

  const setStampAndTaxRate = useTaxStore((s) => s.setStampAndTaxRate)

  // مزامنة نسبة الدمغة والضريبة من السيرفر لجميع الأجهزة تلقائياً
  useQuery({
    queryKey: ['server-tax-rate', branchId],
    queryFn: async () => {
      try {
        const items = await getKeyValues()
        const found = items.find((it) => it.key === SALE_TAX_RATE_KEY)
        if (found && found.value != null && found.value.trim() !== '') {
          const parsed = parseFloat(found.value)
          if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 100) {
            setStampAndTaxRate(parsed / 100)
          }
        }
        return items
      } catch {
        return null
      }
    },
    enabled: hasBranch,
    staleTime: 60 * 1000,
  })

  useEffect(() => {
    let active = branchDetails?.currency ?? branchDetails?.country
    if (isOwner && selectedBranchId != null && overview) {
      const branch = overview.branches.find((b) => b.branchId === selectedBranchId)
      active = branch?.currency ?? branch?.country ?? active
    }
    setCurrency(currencyFromCountry(active))
  }, [isOwner, selectedBranchId, overview, branchDetails?.currency, branchDetails?.country, setCurrency])
  const isPos = pathname === '/app/sales'

  return (
    <div className="flex min-h-screen bg-secondary">
      <aside
        className={cn(
          'hidden shrink-0 border-e border-black/5 bg-white transition-[width] duration-300 md:block',
          sidebarCollapsed ? 'w-[76px]' : 'w-[260px] lg:w-[280px]',
        )}
      >
        <div className="sticky top-0 flex h-screen flex-col">
          <Brand collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((value) => !value)} />
          <div className="px-2.5 pb-2">
            <BranchSelector inSidebar collapsed={sidebarCollapsed} />
            {!sidebarCollapsed && (
              <div className="mt-2 flex justify-center">
                <ConnectionBadge />
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-2.5 py-2">
            <NavLinks collapsed={sidebarCollapsed} />
          </div>
          <div className="px-2.5 py-2">
            <SidebarInstallButton collapsed={sidebarCollapsed} />
          </div>
          <UserFooter collapsed={sidebarCollapsed} />
        </div>
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon-lg"
            className="absolute top-4 end-4 z-50 bg-white md:hidden touch-target"
          >
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80 border-0 bg-white p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>القائمة</SheetTitle>
          </SheetHeader>
          <div className="flex h-full flex-col">
            <Brand />
            <div className="px-3 pb-2">
              <BranchSelector inSidebar />
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2">
              <NavLinks />
            </div>
            <div className="px-3 py-2">
              <SidebarInstallButton />
            </div>
            <UserFooter />
          </div>
        </SheetContent>
      </Sheet>

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-black/5 bg-white px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-[12px] bg-primary">
              <Gem className="size-4 text-white" />
            </div>
            <span className="font-bold text-foreground">Gold Master</span>
            {branchName && <span className="text-sm text-muted-foreground">| {branchName}</span>}
          </div>
          <ConnectionBadge />
        </div>
        <div
          className={cn(
            'flex flex-1 flex-col gap-3.5 p-3.5 sm:p-4 md:p-5 lg:p-6 min-w-0 max-w-full overflow-x-hidden',
            !isPos && 'pb-24 md:pb-6',
          )}
        >
          <GoldPriceBar hidePriceRefresh={isPos} />
          <OnboardingBanner />
          <Outlet />
        </div>
      </main>

      {!isPos && <BottomNav onMore={() => setOpen(true)} />}

      <Toaster
        position="top-center"
        richColors
        closeButton
        dir="rtl"
        toastOptions={{
          style: {
            fontFamily: 'inherit',
            fontSize: '15px',
            fontWeight: 600,
            borderRadius: '14px',
          },
        }}
      />
    </div>
  )
}