import { describe, expect, it, vi } from 'vitest'
import {
  invalidateAfterCash,
  invalidateAfterPurchase,
  invalidateAfterSale,
  invalidateShopData,
  shopQueryPrefixes,
} from './invalidateShop'

function fakeClient() {
  return { invalidateQueries: vi.fn() }
}

describe('invalidateShop', () => {
  it('يُبطل كل بادئات قوائم المحل', () => {
    const qc = fakeClient()
    invalidateShopData(qc)
    expect(qc.invalidateQueries).toHaveBeenCalledTimes(shopQueryPrefixes.length)
    for (const prefix of shopQueryPrefixes) {
      expect(qc.invalidateQueries).toHaveBeenCalledWith({ queryKey: [...prefix] })
    }
  })

  it('aliases البيع والشراء والخزينة تستخدم نفس الإبطال الشامل', () => {
    for (const fn of [invalidateAfterSale, invalidateAfterPurchase, invalidateAfterCash]) {
      const qc = fakeClient()
      fn(qc)
      expect(qc.invalidateQueries).toHaveBeenCalledTimes(shopQueryPrefixes.length)
    }
  })
})
