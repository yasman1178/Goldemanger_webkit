import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

import { getGoldPriceSnapshot, type GoldPriceSnapshot } from '@/shared/lib/parties'
import { DEVIATION_TOLERANCE_EGP } from '@/shared/lib/audit'
import { useConnectionStore } from '@/shared/stores/connection-store'

/**
 * بوابة سعر الذهب — تحسم سؤالاً واحداً قبل أي فاتورة:
 * «هل الرقم الذي سيُسجَّل على الخادم هو نفسه الرقم المعروض للكاشير؟»
 *
 * ثلاث حالات لا رابع لها:
 *
 * - `offline`: السيرفر لا يرد. لا بيع ولا شراء — بلا استثناء وبلا طابور
 *   إرسال لاحق. فاتورة تُحفظ محلياً وتصل بلا رادع تُفسد المخزون والخزينة.
 * - `needs-price`: السيرفر يرد لكن لا سعر مسجَّل لهذا الفرع. لا بد من إدخال
 *   سعر، ويُحفظ على السيرفر كسعر مُدخل.
 * - `live`: يوجد سعر مسجَّل. إن كان فرقه عن سعر الشاشة أكبر من عتبة
 *   التدقيق، فالفاتورة ستُسجَّل بسعر لا يراه أحد لاحقاً، فيُحسم الأمر قبل
 *   الإرسال لا بعده.
 */
export type PriceGateStatus = 'loading' | 'live' | 'needs-price' | 'offline'

/**
 * أيّ رقم من الخادم تقارن عليه الشاشة.
 *
 * `sell` للبيع وللشراء من مورد. أما الشراء من عميل فيُسعَّر بسعر الشراء لا
 * بسعر البيع أبداً — فمقارنة رقم العميل بسعر البيع تُظهر انحرافاً وهمياً
 * بحجم عمولة الشراء كله، وتُفتح نافذة حسم على أمر لا وجود له.
 */
export type PriceBasis = 'sell' | 'buy'

export interface GoldPriceGate {
  status: PriceGateStatus
  snapshot: GoldPriceSnapshot | null
  /** سعر بيع الفرع على الخادم، أو null إن لم يوجد سعر مسجَّل. */
  serverSell: number | null
  serverBuy: number | null
  /** السعر المرجعي المستخدَم في حساب الانحراف، حسب `basis`. */
  serverReference: number | null
  /** رقم لقطة السعر — يُرسل مع الفاتورة ليُربط سجلها بسعرها. */
  priceUpdateGoldeId: number | null
  /** فرق السعر بين الشاشة والخادم؛ موجب = الشاشة أعلى. */
  drift: number
  /** هل الفرق يستوجب إيقاف الفاتورة وطلب حسم بشري؟ */
  driftNeedsDecision: boolean
  /** رسالة جاهزة للعرض للمستخدم عند المنع. */
  blockReason: string | null
  refetch: () => void
}

/**
 * فرق السعر عن الخادم مقارنةً بما على الشاشة.
 *
 * العتبة نفسها التي يستعملها الخادم في `InvoiceAudit.Tolerance`: فرقٌ داخلها
 * لا يُسجَّل أصلاً، فالحكم به قبل الإرسال بلا داعٍ، وتجاوزها يُصير «انحراف
 * سعر» في تقرير المراجعة بسبب شاشة لم تُزامن.
 */
export function priceDrift(
  screenPrice: number,
  serverReference: number | null,
): { drift: number; needsDecision: boolean } {
  if (!serverReference || serverReference <= 0 || screenPrice <= 0) {
    return { drift: 0, needsDecision: false }
  }

  const drift = Number((screenPrice - serverReference).toFixed(2))
  return {
    drift,
    needsDecision: Math.abs(drift) > DEVIATION_TOLERANCE_EGP,
  }
}

export function useGoldPriceGate(
  branchId: number | null | undefined,
  screenPrice = 0,
  basis: PriceBasis = 'sell',
): GoldPriceGate {
  const serverStatus = useConnectionStore((s) => s.serverStatus)

  const query = useQuery({
    queryKey: ['gold-price-snapshot', branchId ?? null],
    queryFn: () => getGoldPriceSnapshot(branchId),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  })

  const snapshot = query.data ?? null
  const serverSell = snapshot && snapshot.sell > 0 ? snapshot.sell : null
  const serverBuy = snapshot && snapshot.buy > 0 ? snapshot.buy : serverSell

  // انقطاع حقيقي هو غياب `response`: يعني أن الطلب لم يصل. أما وجود رد
  // (حتى خطأ 500) فيبقى اتصالاً قائماً، والفرق بينهما يغيّر الحل كاملاً:
  // الأول يمنع الفاتورة، والثاني يطلب سعراً يدوياً.
  const transportFailed =
    serverStatus === 'offline' ||
    (query.error != null &&
      (axios.isAxiosError(query.error) ? !query.error.response : true))

  const status: PriceGateStatus = transportFailed
    ? 'offline'
    : query.isPending
      ? 'loading'
      : serverSell == null
        ? 'needs-price'
        : 'live'

  const serverReference = basis === 'buy' ? serverBuy : serverSell
  const { drift, needsDecision } = priceDrift(screenPrice, serverReference)

  return {
    status,
    snapshot,
    serverSell,
    serverBuy,
    /** السعر المرجعي المستخدَم في حساب الانحراف، حسب نوع العملية. */
    serverReference,
    priceUpdateGoldeId: snapshot?.priceUpdateGoldeId ?? null,
    drift,
    driftNeedsDecision: needsDecision,
    blockReason:
      status === 'offline'
        ? 'لا يمكن تسجيل فاتورة بدون السيرفر: سعر الذهب يُحفظ على الخادم، والفاتورة غير المسجَّلة لا يعلم بها أحد لاحقاً.'
        : null,
    refetch: () => {
      void query.refetch()
    },
  }
}