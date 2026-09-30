/**
 * مُنتقي الفترة المشترك للتقارير (أرباح المصنعية، الأجور).
 * الاختصارات تُحسب محلياً (لا سؤال للسيرفر) والتواريخ تُرسَل بصيغة yyyy-MM-dd
 * لأن <input type="date"> يعطي هذه الصيغة في كل المتصفحات.
 *
 * ملاحظة: تاريخ النهاية شامل (inclusive) على كل التواريخ التي تُعيدها هذه الوحدة؛
 * فالسيرفر يحوّله داخلياً إلى حدّ أعلى حصري.
 */

export type PeriodPreset = 'today' | 'yesterday' | 'thisMonth' | 'lastMonth' | 'custom'

export const periodPresets: { value: PeriodPreset; label: string }[] = [
  { value: 'today', label: 'اليوم' },
  { value: 'yesterday', label: 'أمس' },
  { value: 'thisMonth', label: 'هذا الشهر' },
  { value: 'lastMonth', label: 'الشهر الماضي' },
  { value: 'custom', label: 'فترة مخصصة' },
]

/** يحوّل Date إلى yyyy-MM-dd بالتوقيت المحلي (toISOString يزيح التوقيت ⇒ يوم خاطئ). */
export function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function resolvePeriod(
  preset: PeriodPreset,
  now: Date = new Date(),
): { startDate: string; endDate: string } {
  const day = (d: Date) => toDateInputValue(d)

  switch (preset) {
    case 'yesterday': {
      const y = new Date(now)
      y.setDate(y.getDate() - 1)
      return { startDate: day(y), endDate: day(y) }
    }
    case 'thisMonth':
      return {
        startDate: day(new Date(now.getFullYear(), now.getMonth(), 1)),
        endDate: day(now),
      }
    case 'lastMonth': {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const last = new Date(now.getFullYear(), now.getMonth(), 0)
      return { startDate: day(first), endDate: day(last) }
    }
    case 'today':
    case 'custom':
    default:
      return { startDate: day(now), endDate: day(now) }
  }
}
