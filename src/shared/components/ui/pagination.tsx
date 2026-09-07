import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

interface PaginationBarProps {
  page: number
  pageCount: number
  totalCount: number
  onChange: (page: number) => void
}

type PageItem = number | 'ellipsis-s' | 'ellipsis-e'

function pageWindow(page: number, pageCount: number): PageItem[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1)
  }
  const items: PageItem[] = [1]
  if (page > 3) items.push('ellipsis-s')
  const start = Math.max(2, page - 1)
  const end = Math.min(pageCount - 1, page + 1)
  for (let p = start; p <= end; p++) items.push(p)
  if (page < pageCount - 2) items.push('ellipsis-e')
  items.push(pageCount)
  return items
}

export function PaginationBar({ page, pageCount, totalCount, onChange }: PaginationBarProps) {
  if (pageCount <= 1) return null

  const items = pageWindow(page, pageCount)

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="h-11 w-11 rounded-full touch-target"
        aria-label="الصفحة السابقة"
      >
        <ChevronRight className="size-4" />
      </Button>

      {items.map((item) =>
        item === 'ellipsis-s' || item === 'ellipsis-e' ? (
          <span key={item} className="w-4 text-center text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={item}
            type="button"
            variant={item === page ? 'default' : 'outline'}
            onClick={() => onChange(item)}
            className={cn('h-11 w-11 rounded-full touch-target tabular-nums')}
          >
            {item}
          </Button>
        ),
      )}

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
        className="h-11 w-11 rounded-full touch-target"
        aria-label="الصفحة التالية"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <span className="w-full pt-0.5 text-center text-[12px] font-medium text-muted-foreground">
        صفحة {page} من {pageCount} — إجمالي {totalCount}
      </span>
    </div>
  )
}