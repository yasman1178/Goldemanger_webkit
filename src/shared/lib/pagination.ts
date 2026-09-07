export const PAGE_SIZE = 10

export interface PaginatedResult<T> {
  data: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  carryAmount?: number | null
}

export function totalPages(totalCount: number, pageSize: number = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(totalCount / Math.max(1, pageSize)))
}

/**
 * حالة صفحة للترقيم الحقيقي (Server-Side): الصفحة/هي القارة webapp و state،
 * وهو يـ clamp ويحسب عدد الصفحات من totalCount الذي يصل بعد الاستعلام.
 * اتصل به بعد `useQuery` الذي يعتمد على `page`.
 */
export function usePaginablePage(
  totalCount: number,
  page: number,
  pageSize: number = PAGE_SIZE,
  setPage: (next: number) => void,
) {
  const pageCount = totalPages(totalCount, pageSize)
  const safePage = Math.min(Math.max(1, page), pageCount)
  const goToPage = (next: number) => setPage(Math.min(Math.max(1, next), pageCount))
  const reset = () => setPage(1)
  return { page: safePage, pageCount, goToPage, reset }
}