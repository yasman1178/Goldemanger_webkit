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
  HandCoins,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  KeyRound,
} from 'lucide-react'

import { useAuthStore } from '@/shared/stores/auth-store'
import { useCurrencyStore } from '@/shared/stores/currency-store'
import { getOverview } from '@/features/settings/api'
import { BranchSelector } from '@/shared/components/BranchSelector'
import { GoldPriceBar } from '@/features/sales/components/pos/GoldPriceBar'
import { OnboardingBanner } from '@/features/settings/components/OnboardingBanner'
import { ChangePasswordDialog } from '@/features/auth/components/ChangePasswordDialog'
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
  { to: '/app/inventory', label: 'الجرد', icon: Boxes },
  { to: '/app/cash', label: 'الخزينة', icon: Banknote },
  { to: '/app/debts', label: 'المديونيات', icon: Wallet },
  { to: '/app/expenses', label: 'المصروفات', icon: TrendingDown },
  { to: '/app/employee-debts', label: 'سلف الموظفين', icon: HandCoins },
  { to: '/app/settings', label: 'إدارة الشركة', icon: Settings, roles: ['Owner'] },
  { to: '/app/admin', label: 'إدارة النظام', icon: ShieldCheck, roles: ['Responsible'] },
]

function Brand({ collapsed = false, onToggle }: { collapsed?: boolean; onToggle?: () => void }) {
  return (
    <div className={cn('flex items-center gap-2 py-4 md:max-lg:justify-center md:max-lg:px-2', collapsed ? 'justify-center px-2' : 'px-4')}>
      <div className="flex size-9 items-center justify-center rounded-[14px] bg-primary">
        <Gem className="size-5 text-white" />
      </div>
      {!collapsed && <span className="text-[17px] font-semibold text-foreground md:max-lg:hidden">Gold Master</span>}
      {onToggle && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={collapsed ? 'إظهار القائمة' : 'إخفاء القائمة'}
          onClick={onToggle}
          className="ms-auto rounded-full text-muted-foreground touch-target md:max-lg:ms-0"
        >
          {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
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
          'flex items-center gap-3 rounded-[14px] px-3 py-3 text-[15px] font-semibold leading-[1.45] transition-colors touch-target',
          collapsed && 'justify-center px-0',
          'md:max-lg:justify-center md:max-lg:px-0',
          isActive ? 'bg-primary text-white' : 'text-foreground hover:bg-muted',
        )
      }
    >
      <Icon className="size-5 shrink-0" />
      {!collapsed && <span className="md:max-lg:hidden">{label}</span>}
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
  const initial = user?.userName?.trim().charAt(0) ?? '؟'

  return (
    <div className="border-t border-black/5 px-3 py-3">
      <div className={cn('flex items-center gap-3 rounded-[14px] py-2 md:max-lg:justify-center md:max-lg:px-0', collapsed ? 'justify-center px-0' : 'px-2')}>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-[17px] font-bold text-foreground">
          {initial}
        </div>
        {!collapsed && <div className="min-w-0 flex-1 md:max-lg:hidden">
          <p className="truncate text-[15px] font-semibold text-foreground">
            {user?.userName}
          </p>
          <p className="truncate text-[13px] text-muted-foreground">{user?.email}</p>
        </div>}
        <Button
          variant="ghost"
          size="icon"
          aria-label="تغيير كلمة المرور"
          title="تغيير كلمة المرور"
          className="shrink-0 rounded-full text-muted-foreground hover:text-primary touch-target"
          onClick={() => setPasswordOpen(true)}
        >
          <KeyRound className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="تسجيل الخروج"
          className="shrink-0 rounded-full text-muted-foreground hover:text-destructive touch-target"
          onClick={clearAuth}
        >
          <LogOut className="size-5" />
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { pathname } = useLocation()
  const branchName = useAuthStore((s) => s.branchDetails?.branchName)
  const branchDetails = useAuthStore((s) => s.branchDetails)
  const roles = useAuthStore((s) => s.user?.roles ?? [])
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId)
  const setCurrency = useCurrencyStore((s) => s.setCurrency)
  const isOwner = roles.includes('Owner')

  const { data: overview } = useQuery({
    queryKey: ['overview'],
    queryFn: getOverview,
    enabled: isOwner,
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
      <aside className={cn('hidden shrink-0 border-e border-black/5 bg-white transition-[width] duration-300 md:block md:w-[88px] lg:w-[280px]', sidebarCollapsed ? 'lg:w-[88px]' : 'lg:w-[280px]')}>
        <div className="sticky top-0 flex h-screen flex-col">
          <Brand collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((value) => !value)} />
          <div className="flex-1 overflow-y-auto px-3 py-2">
            <NavLinks collapsed={sidebarCollapsed} />
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
        <SheetContent side="right" className="w-72 border-0 bg-white p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>القائمة</SheetTitle>
          </SheetHeader>
          <div className="flex h-full flex-col">
            <Brand />
            <div className="flex-1 overflow-y-auto px-3 py-2">
              <NavLinks />
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
        </div>
        <div className={cn('flex flex-1 flex-col gap-3 p-4 md:p-6', !isPos && 'pb-24 md:pb-6')}>
          <BranchSelector />
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