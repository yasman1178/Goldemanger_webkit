import { describe, expect, it } from 'vitest'
import { resolvePeriod, toDateInputValue } from './period'

/**
 * تواريخ ثابتة بتوقيت محلي: الهدف منع انزلاق اليوم (toISOString يزيح التوقيت
 * فيحسب «أمس» أو أول الشهر قبله بيوم) وليس اختبار المنطقة الزمنية.
 */
const NOW = new Date(2026, 2, 15, 13, 45) // 15 مارس 2026

describe('toDateInputValue', () => {
  it('pads month and day to two digits', () => {
    expect(toDateInputValue(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('uses the local calendar day, not the UTC one', () => {
    // 23:30 محلياً = قد يكون اليوم التالي بتوقيت UTC إن استُخدم toISOString.
    expect(toDateInputValue(new Date(2026, 8, 9, 23, 30))).toBe('2026-09-09')
  })
})

describe('resolvePeriod', () => {
  it('today is a single-day range', () => {
    expect(resolvePeriod('today', NOW)).toEqual({
      startDate: '2026-03-15',
      endDate: '2026-03-15',
    })
  })

  it('yesterday steps back one day', () => {
    expect(resolvePeriod('yesterday', NOW)).toEqual({
      startDate: '2026-03-14',
      endDate: '2026-03-14',
    })
  })

  it('thisMonth starts on day 1 and ends today', () => {
    expect(resolvePeriod('thisMonth', NOW)).toEqual({
      startDate: '2026-03-01',
      endDate: '2026-03-15',
    })
  })

  it('lastMonth covers the whole previous month', () => {
    expect(resolvePeriod('lastMonth', NOW)).toEqual({
      startDate: '2026-02-01',
      endDate: '2026-02-28',
    })
  })

  it('lastMonth handles a leap February', () => {
    expect(resolvePeriod('lastMonth', new Date(2028, 2, 10))).toEqual({
      startDate: '2028-02-01',
      endDate: '2028-02-29',
    })
  })

  it('crosses the year boundary for lastMonth in January', () => {
    expect(resolvePeriod('lastMonth', new Date(2026, 0, 10))).toEqual({
      startDate: '2025-12-01',
      endDate: '2025-12-31',
    })
  })

  it('falls back to a single day for custom (the page owns custom dates)', () => {
    expect(resolvePeriod('custom', NOW)).toEqual({
      startDate: '2026-03-15',
      endDate: '2026-03-15',
    })
  })

  it('never returns a range whose start is after its end', () => {
    for (const preset of [
      'today',
      'yesterday',
      'thisMonth',
      'lastMonth',
      'custom',
    ] as const) {
      // عيّنات تشمل أول الشهر وآخره حتى تُلتقط انقلابات الشهر/السنة.
      for (const day of [1, 15, 28, 31]) {
        const now = new Date(2026, 1, day)
        const { startDate, endDate } = resolvePeriod(preset, now)
        expect(startDate <= endDate).toBe(true)
      }
    }
  })
})
