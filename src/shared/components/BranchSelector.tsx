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

/**
 * محدد الفرع العام — يظهر لصاحب المحل (Owner) فقط.
 * اختيار الفرع هنا يطبَّق على كل الأقسام (قراءة وعمليات) عبر فرعٍ فاعل مشترك.
 */
export function BranchSelector() {
  const roles = useAuthStore((s) => s.user?.roles ?? [])
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId)
  const setSelectedBranchId = useAuthStore((s) => s.setSelectedBranchId)
  const isOwner = roles.includes('Owner')

  const { data: overview, isLoading } = useQuery({
    queryKey: ['overview'],
    queryFn: getOverview,
    enabled: isOwner,
  })

  const branches = useMemo(() => overview?.branches ?? [], [overview])
  const value = selectedBranchId != null ? String(selectedBranchId) : undefined

  if (!isOwner) return null

  return (
    <div className="flex items-center gap-2 bg-white px-4 py-2.5 border-b border-black/5">
      <Store className="size-4 shrink-0 text-primary" />
      <span className="shrink-0 text-[13px] font-semibold text-muted-foreground">
        محدد الفرع
      </span>
      {isLoading ? (
        <Skeleton className="h-9 w-40 rounded-lg" />
      ) : (
        <Select value={value} onValueChange={(v) => setSelectedBranchId(Number(v))}>
          <SelectTrigger aria-label="اختيار الفرع" className="h-9 w-auto min-w-40 rounded-full">
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
