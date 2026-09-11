import { describe, expect, it, vi } from 'vitest'

import { extractArray, extractPage } from './api'

describe('extractArray', () => {
  it('يمرّر المصفوفة المباشرة كما هي', () => {
    const payload = [{ inventoryUnitId: 1 }]
    expect(extractArray(payload, 'test')).toBe(payload)
  })

  it('يفكّ غلاف ApiResponse بشكل { data: [...] }', () => {
    expect(
      extractArray({ data: [{ inventoryUnitId: 3 }] }, 'test'),
    ).toEqual([{ inventoryUnitId: 3 }])
  })

  it('يعيد [] مع تحذير عند الشكل الغريب بدل الانهيار (units.filter)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      expect(extractArray({ success: false, message: 'x' }, 'test')).toEqual([])
      expect(extractArray('<html>…', 'test')).toEqual([])
      expect(extractArray(null, 'test')).toEqual([])
      expect(extractArray(undefined, 'test')).toEqual([])
      expect(warn).toHaveBeenCalled()
    } finally {
      warn.mockRestore()
    }
  })
})

describe('extractPage', () => {
  it('يقبل الصفحة المباشرة والصفحة المغلفة', () => {
    const bare = { data: [1], totalCount: 1, pageNumber: 1, pageSize: 10 }
    expect(extractPage(bare, 'test')).toBe(bare)
    expect(
      extractPage({ data: bare }, 'test'),
    ).toBe(bare)
  })
})
