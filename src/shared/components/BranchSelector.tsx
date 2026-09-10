import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Store } from 'lucide-react'

import { useAuthStore } from '@/shared/stores/auth-store'
import { getOverview } from '@/features/settings/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'

interface BranchSelectorProps {
  collapsed?: boolean
  inSidebar?: boolean
  className?: string
}

/**
 * محدد الفرع الفاعل — مدمج في القائمة الجانبية (الاسليد) وفق مواصفات DESIGN.md
 * يتيح لصاحب المحل التبديل السريع بين الفروع، ويعرض للموظف الفرع الحالي المخصص له.
 */
export function BranchSelector({
  collapsed = false,
  inSidebar = false,
  className,
}: BranchSelectorProps) {
  const roles = useAuthStore((s) => s.user?.roles ?? [])
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId)
  const setSelectedBranchId = useAuthStore((s) => s.setSelectedBranchId)
  const defaultBranchName = useAuthStore((s) => s.branchDetails?.branchName)
  const isOwner = roles.includes('Owner')

  const { data: overview, isLoading } = useQuery({
    queryKey: ['overview'],
    queryFn: getOverview,
    enabled: isOwner,
  })

  const branches = useMemo(() => overview?.branches ?? [], [overview])
  const activeBranch = branches.find((b) => b.branchId === selectedBranchId)
  const activeName = activeBranch?.branchName ?? defaultBranchName ?? 'الفرع الرئيسي'
  const value = selectedBranchId != null ? String(selectedBranchId) : undefined

  // في حالة طي القائمة الجانبية (الديسكتوب والتابلت)
  if (collapsed) {
    if (!isOwner) {
      return (
        <div className="flex justify-center py-1">
          <div
            title={`الفرع الحالي: ${activeName}`}
            className="flex size-10 items-center justify-center rounded-[12px] bg-primary/10 text-primary transition-colors hover:bg-primary/20"
          >
            <Store className="size-5" />
          </div>
        </div>
      )
    }

    return (
      <div className="flex justify-center py-1">
        <Select value={value} onValueChange={(v) => setSelectedBranchId(Number(v))}>
          <SelectTrigger
            aria-label="اختيار الفرع"
            title={`الفرع الفاعل: ${activeName} (اضغط للتغيير)`}
            className="flex size-10 items-center justify-center rounded-[12px] border-0 bg-primary/10 p-0 text-primary shadow-none transition-all hover:bg-primary/20 [&>svg]:hidden"
          >
            <Store className="size-5" />
          </SelectTrigger>
          <SelectContent side="left" align="start" className="min-w-48">
            <div className="px-2.5 py-1.5 text-[11px] font-bold text-muted-foreground border-b border-black/5">
              تبديل الفرع الفاعل
            </div>
            {branches.map((b) => (
              <SelectItem
                key={b.branchId}
                value={String(b.branchId)}
                className="text-[13px] font-semibold"
              >
                {b.branchName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  // عرض القائمة الجانبية المفتوحة (الاسليد سواء ديسكتوب أو موبايل)
  if (inSidebar) {
    return (
      <div
        className={cn(
          'rounded-[14px] border border-black/5 bg-secondary/80 p-2.5 transition-all',
          className,
        )}
      >
        <div className="mb-1.5 flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
            <Store className="size-3.5 text-primary" />
            <span>الفرع الفاعل</span>
          </div>
          {isOwner ? (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              تغيير متاح
            </span>
          ) : (
            <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              فرعك الحالي
            </span>
          )}
        </div>

        {isOwner ? (
          isLoading ? (
            <Skeleton className="h-9 w-full rounded-[10px]" />
          ) : (
            <Select
              value={value}
              onValueChange={(v) => setSelectedBranchId(Number(v))}
            >
              <SelectTrigger
                aria-label="اختيار الفرع"
                className="h-9 w-full rounded-[10px] border-black/10 bg-white px-2.5 text-[13px] font-bold text-foreground shadow-none hover:bg-black/[0.02]"
              >
                <SelectValue placeholder="اختر الفرع">
                  <span className="truncate">{activeName}</span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent side="bottom" align="start" className="max-h-64">
                {branches.map((b) => (
                  <SelectItem
                    key={b.branchId}
                    value={String(b.branchId)}
                    className="flex items-center justify-between text-[13px] font-semibold"
                  >
                    <span>{b.branchName}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        ) : (
          <div className="flex h-9 items-center rounded-[10px] border border-black/5 bg-white px-2.5 text-[13px] font-bold text-foreground">
            <span className="truncate">{activeName}</span>
          </div>
        )}
      </div>
    )
  }

  // في حال استدعائه كعنصر مستقل خارج القائمة
  if (!isOwner) return null

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-[14px] border border-black/5 bg-white px-3 py-2 elevation-card',
        className,
      )}
    >
      <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Store className="size-4" />
      </div>
      <span className="shrink-0 text-[12px] font-semibold text-muted-foreground">
        الفرع:
      </span>
      {isLoading ? (
        <Skeleton className="h-8 w-36 rounded-lg" />
      ) : (
        <Select value={value} onValueChange={(v) => setSelectedBranchId(Number(v))}>
          <SelectTrigger aria-label="اختيار الفرع" className="h-8 min-w-36 rounded-full text-[12px] font-semibold">
            <SelectValue placeholder="اختر فرعاً" />
          </SelectTrigger>
          <SelectContent>
            {branches.map((b) => (
              <SelectItem key={b.branchId} value={String(b.branchId)}>
                {b.branchName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
