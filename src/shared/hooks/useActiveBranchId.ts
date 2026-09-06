import { useAuthStore } from '@/shared/stores/auth-store'

/**
 * يُرجع رقم الفرع الفعّال الحالي.
 * - للمالك: الفرع المختار من المحدد العام (selectedBranchId) — يعود لفرعه عند عدم الاختيار.
 * - لغير المالك: فرعه الثابت دائماً.
 */
export function useActiveBranchId(): number | null {
  const branchId = useAuthStore((s) => s.branchId)
  const selectedBranchId = useAuthStore((s) => s.selectedBranchId)
  return selectedBranchId ?? branchId ?? null
}
