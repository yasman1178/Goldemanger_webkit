import { describe, it, expect, beforeEach } from 'vitest'
import {
  getSnapshotKey,
  deduceAndFreezeLegacySnapshot,
  saveSaleSnapshot,
  getSaleSnapshot,
  type SaleSnapshot,
} from './sale-snapshots'
import type { SalePrintData } from '@/features/sales/api'

describe('sale-snapshots', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('generates consistent snapshot keys', () => {
    expect(getSnapshotKey(73)).toBe('sale_snapshot_73')
    expect(getSnapshotKey(105)).toBe('sale_snapshot_105')
  })

  it('saves and retrieves snapshots from localStorage and keyValues list', async () => {
    const snapshot: SaleSnapshot = {
      saleId: 73,
      branchId: 1,
      saleDate: '2026-10-17T01:13:00Z',
      totalAmount: 8616,
      discount: 0,
      gold21Price: 6250,
      stampAndTaxRate: 0.015,
      karatMakingFees: { 18: 300 },
      createdAt: '2026-10-17T01:13:00Z',
    }

    await saveSaleSnapshot(snapshot)

    // Retrieve via cache
    const cached = await getSaleSnapshot(73)
    expect(cached).not.toBeNull()
    expect(cached?.stampAndTaxRate).toBe(0.015)
    expect(cached?.totalAmount).toBe(8616)

    // Retrieve via simulated server keyValues list
    const serverList = [
      { key: 'sale_snapshot_73', value: JSON.stringify(snapshot) },
    ]
    const fromServer = await getSaleSnapshot(73, serverList)
    expect(fromServer?.stampAndTaxRate).toBe(0.015)
  })

  it('accurately deduces legacy invoice snapshot from totalAmount and gold price', () => {
    const legacyPrintData: SalePrintData = {
      saleId: 73,
      branchId: 1,
      customerId: 10,
      customerName: 'صلاح محمد',
      saleDate: '2026-10-17T01:13:00Z',
      totalAmount: 8616,
      discount: 0,
      gold21Price: 6250,
      paid: 8616,
      amountOwed: 0,
      hasDebt: false,
      payments: [],
      saleItems: [
        {
          saleItemId: 1,
          productId: 12,
          productName: 'خاتم',
          quantity: 1,
          price: 8616,
          weight: 1.5,
          karat: 18,
          factory: 300,
          typegolde: 1,
        },
      ],
    }

    const deduced = deduceAndFreezeLegacySnapshot(legacyPrintData, 0.01)
    expect(deduced.saleId).toBe(73)
    expect(deduced.totalAmount).toBe(8616)
    // 6250 * 18 / 21 * 1.5 = 8035.714
    // 8485.714 with making -> tax = ~130.286 -> resolved to matching standard rate (0.015)
    expect(deduced.stampAndTaxRate).toBe(0.015)
    expect(deduced.items).toHaveLength(1)
    expect(deduced.items?.[0].makingPerGram).toBe(300)
  })
})
