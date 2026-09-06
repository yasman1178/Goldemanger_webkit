import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ClipboardCheck,
  LockOpen,
  Sparkles,
} from 'lucide-react'
import { getOnboardingStatus, completeOnboarding } from '@/features/settings/api'
import { useAuthStore } from '@/shared/stores/auth-store'
import { Button } from '@/shared/components/ui/button'

export function OnboardingBanner() {
  const queryClient = useQueryClient()
  const roles = useAuthStore((s) => s.user?.roles ?? [])
  const branchId = useAuthStore((s) => s.branchId)
  const isOwner = roles.includes('Owner')

  const { data, isLoading } = useQuery({
    queryKey: ['onboarding-status'],
    queryFn: () => getOnboardingStatus(branchId ?? undefined),
    enabled: branchId != null,
  })

  const completeMutation = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      toast.success('تم إتمام التحويل الابتدائي')
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] })
    },
    onError: () => {
      toast.error('تعذّر إتمام التحويل الابتدائي. حاول مجدداً.')
    },
  })

  if (isLoading || !data || data.completed) return null

  return (
    <div className="flex flex-col gap-3 rounded-[16px] border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          {isOwner ? <ClipboardCheck className="size-5" /> : <LockOpen className="size-5" />}
        </div>
        <div>
          <p className="text-[15px] font-bold leading-[1.4] text-foreground">
            التحويل الابتدائي / الأرصدة الافتتاحية
          </p>
          <p className="mt-0.5 text-[13px] leading-[1.5] text-muted-foreground">
            أدخل مخزونك الحالي وكاشك الافتتاحي عبر فاتورة شراء أولية. أثناء هذه المرحلة
            تُتاح إضافة الأرصدة دون قيود الرصيد حتى اكتمال التفعيل.
          </p>
        </div>
      </div>
      {isOwner ? (
        <Button
          type="button"
          onClick={() => branchId && completeMutation.mutate(branchId)}
          disabled={completeMutation.isPending || !branchId}
          className="h-11 shrink-0 gap-2 rounded-full touch-target"
        >
          <Sparkles className="size-4" />
          {completeMutation.isPending ? 'جارٍ الإنهاء...' : 'إنهاء وضع رصيد أول المدة'}
        </Button>
      ) : (
        <p className="shrink-0 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-muted-foreground">
          ينتظر إتمام صاحب المحل
        </p>
      )}
    </div>
  )
}
