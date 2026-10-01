import { WifiOff } from 'lucide-react'

import { useConnectionStore } from '@/shared/stores/connection-store'
import { cn } from '@/shared/lib/utils'

/**
 * مؤشّر الاتصال بالسيرفر: الكاشير يجب أن يعرف قبل الدفع لا بعده أن الفاتورة
 * لن تُسجَّل. يظهر فقط عند الانقطاع المؤكد — الحالة «المجهولة» قبل أول طلب
 * لا تُعرض حتى لا يُمنع المستخدم على حدس.
 */
export function ConnectionBadge({ className }: { className?: string }) {
  const serverStatus = useConnectionStore((s) => s.serverStatus)

  if (serverStatus !== 'offline') return null

  return (
    <span
      role="status"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-error/10 px-2.5 py-1 text-[12px] font-bold text-error',
        className,
      )}
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-error" />
      </span>
      <WifiOff className="size-3.5" />
      غير متصل — الفواتير متوقفة
    </span>
  )
}
