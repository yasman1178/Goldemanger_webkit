/**
 * مفاتيح TanStack Query الموحدة + مساعد إبطال مركزي.
 * الهدف: أي عملية بيع/شراء/حركة خزينة تُبطل كل القوائم المتأثرة
 * حتى لا تبقى صفحة تعرض بيانات قديمة بعد التنقل.
 */

export const shopQueryPrefixes = [
  ['sales'],
  ['held-sales'],
  ['purchases'],
  ['products'],
  ['inventory-units'],
  ['stocks'],
  ['dashboard-stats'],
  ['cash-today'],
  ['cash-current'],
  ['cash-opening'],
  ['debts'],
  ['overview'],
] as const

type InvalidateClient = {
  invalidateQueries: (filters: { queryKey: readonly string[] }) => unknown
}

/** يُبطل كل قوائم المحل (بيع/شراء/مخزون/خزينة/ديون/لوحة). يستخدم prefix فيطابق أي branchId. */
export function invalidateShopData(queryClient: InvalidateClient): void {
  for (const queryKey of shopQueryPrefixes) {
    queryClient.invalidateQueries({ queryKey: [...queryKey] })
  }
}

/** alias دلالي للبيع — نفس الإبطال الشامل. */
export function invalidateAfterSale(queryClient: InvalidateClient): void {
  invalidateShopData(queryClient)
}

/** alias دلالي للشراء — نفس الإبطال الشامل. */
export function invalidateAfterPurchase(queryClient: InvalidateClient): void {
  invalidateShopData(queryClient)
}

/** alias دلالي لحركة الخزينة — نفس الإبطال الشامل. */
export function invalidateAfterCash(queryClient: InvalidateClient): void {
  invalidateShopData(queryClient)
}
