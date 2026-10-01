import { create } from 'zustand'

/**
 * حالة الاتصال بالسيرفر — يفرّق بين نوعَي الانقطاع اللذين يختلف
 * أثرهما في الفاتورة اختلافاً جوهرياً:
 *
 * - `offline`: السيرفر لا يرد إطلاقاً (لا شبكة، أو السيرفر مطفيّ). لا فاتورة
 *   تُسجَّل: لا حجز ذهب، ولا خصم مخزون، ولا قفزة في الخزينة — ولا طابور
 *   إعادة إرسال. فاتورة تسجّل نفسها محلياً ثم تصل متأخرة بلا يعلمها أحد
 *   أرخص وأخطر من رفضها.
 * - `online` مع سعر قديم أو غائب: السيرفر يعمل لكن السعر لم يُجلب. هنا
 *   الحلّ إدخال السعر يدوياً ويُحفظ على السيرفر كسعر مُدخل (`isManual`).
 *
 * التمييز بينهما ليس ترفاً: الأول كان يُحسب من ذاكرة الجهاز، والثاني
 * معقول أن يُكمل به الكاشير بسعره.
 */
export type ServerStatus = 'unknown' | 'online' | 'offline'

interface ConnectionState {
  serverStatus: ServerStatus
  lastContactAt: string | null
  markOnline: () => void
  markOffline: () => void
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  // unknown قبل أول طلب: لا نمنع المستخدم على حدس، بل ننتظر أول إشارة.
  serverStatus: 'unknown',
  lastContactAt: null,
  markOnline: () =>
    set({ serverStatus: 'online', lastContactAt: new Date().toISOString() }),
  markOffline: () => set({ serverStatus: 'offline' }),
}))

/** قراءة الحالة خارج React (مثلاً داخل اعتراض axios). */
export const connection = {
  markOnline: () => useConnectionStore.getState().markOnline(),
  markOffline: () => useConnectionStore.getState().markOffline(),
  get isOnline() {
    return useConnectionStore.getState().serverStatus !== 'offline'
  },
}