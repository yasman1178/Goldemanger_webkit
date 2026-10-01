import { TAX_AND_STAMP_RATE, purchaseLineMath, type PurchaseLineMath } from '@/shared/lib/gold'

/**
 * طبقة تدقيق الفاتورة على الواجهة.
 *
 * الغرض منها ليس إعادة التحقق من صحة بُنيانا هيّا (فإن كنا نُنتج الرقم الخطأ
 * فسنتحقق منه خطأً)، بل مطابقة ما هيّا نُرسله مع ما سيحسبه الخادم، وإيقاف
 * الفاتورة مبكراً برسالة واضحة قبل أن ترتدّ من الخادم بـ 400 غامض.
 *
 * الخادم هو المرجع النهائي (`GoldeManger/Helpers/InvoiceAudit.cs`). أي تعديل
 * هنا يستلزم تعديل ما يقابله هناك، وإلا صار التحقق المزدوج مستحيلاً.
 */

/** عتبة الرفض: فرق مطلق بالجنيه فوقها يُعدّ انحرافاً جوهرياً. */
export const DEVIATION_TOLERANCE_EGP = 1

export interface PurchaseAuditLine {
  productName: string
  karat: number
  weight: number
  quantity: number
  making: number
  taxAndStamp: number
  commission: number
  lineTotal: number
}

export interface PurchaseAuditResult {
  expectedTotal: number
  actualTotal: number
  diff: number
  lines: PurchaseAuditLine[]
  /** سبب الاختلاف بصيغة تفهمها الواجهة، أو null إذا كان الرقم مطابقاً. */
  message: string | null
}

export interface SaleAuditLine {
  productName: string
  karat: number
  grams: number
  quantity: number
  making: number
  taxAndStamp: number
  lineTotal: number
}

export interface SaleAuditResult {
  expectedTotal: number
  actualTotal: number
  diff: number
  lines: SaleAuditLine[]
  message: string | null
}

export interface PurchaseAuditInput {
  lines: Array<{
    productName: string
    karat: number
    weight: number
    quantity: number
    factory: number
  }>
  gold21: number
  totalAmount: number
  /** الشراء من عميل: تُستبدل الدمغة (1%) بعمولة شراء (1.5%) تُخصم. */
  fromCustomer: boolean
  commissionRate: number
  stampTaxRate: number
  isInitialStock?: boolean
}

export interface SaleAuditInput {
  lines: Array<{
    productName: string
    karat: number
    weight: number
    quantity: number
    factory: number
    factoryForSale: number
  }>
  gold21: number
  discount: number
  totalAmount: number
}

function diffMessage(diff: number, kind: 'purchase' | 'sale'): string {
  const subject = kind === 'purchase' ? 'فاتورة الشراء' : 'فاتورة البيع'
  return `مجموع بنود ${subject} لا يطابق الإجمالي المسجَّل بفارق ${Math.abs(diff).toFixed(2)} ج.م.`
}

/**
 * يحسب الإجمالي المتوقَّع لفاتورة الشراء بنفس ترتيب عمليات الخادم:
 * جمع غير مقرَّب ثم تقريب واحد. التقريب لكل سطر ثم مرة ثانية (كما كان
 * في SalesPage) ينتج انحرافاً يقارب 0.5 ج.م لكل سطر.
 */
export function auditPurchase(input: PurchaseAuditInput): PurchaseAuditResult {
  const { lines, gold21, fromCustomer, commissionRate, stampTaxRate } = input
  const actualTotal = input.totalAmount

  // رصيد أول المدة ليس فاتورة شراء: قيمته صفر عمداً، فلا يُدقَّق.
  if (input.isInitialStock) {
    return {
      expectedTotal: 0,
      actualTotal,
      diff: 0,
      lines: [],
      message: null,
    }
  }

  const math: PurchaseLineMath[] = lines.map((l) =>
    purchaseLineMath(
      gold21,
      l.karat,
      l.weight,
      l.quantity,
      l.factory,
      !fromCustomer,
      commissionRate,
      stampTaxRate > 0 ? stampTaxRate : TAX_AND_STAMP_RATE,
    ),
  )

  const expectedTotal = Math.round(math.reduce((sum, m) => sum + m.total, 0))
  const diff = Math.round((actualTotal - expectedTotal) * 100) / 100

  return {
    expectedTotal,
    actualTotal,
    diff,
    lines: lines.map((l, i) => ({
      productName: l.productName,
      karat: l.karat,
      weight: l.weight,
      quantity: l.quantity,
      making: round2(math[i].making),
      taxAndStamp: round2(math[i].taxAndStamp),
      commission: round2(math[i].commission),
      lineTotal: round2(math[i].total),
    })),
    message: Math.abs(diff) > DEVIATION_TOLERANCE_EGP ? diffMessage(diff, 'purchase') : null,
  }
}

/**
 * يحسب الإجمالي المتوقَّع لفاتورة البيع بنفس ترتيب عمليات الخادم
 * (`ComputeSaleLinePrices`) ونفس ترتيب عمليات SalesPage:
 * نجمع القيم غير المقرَّبة ثم نقرّب مرة واحدة، ثم الخصم محدود بالمصنعية.
 *
 * التقريب لكل سطر ثم مرة ثانية ينتج انحرافاً وهمياً يقارب 0.5 ج.م عن كل
 * سطر — أي 2 ج.م عند 4 أسطر — ولأن الإجمالي المُرسل هو رقم الكاشير لا
 * مجموع الأرقام المقربة، صار ذلك «انحراف سعر» على فاتورة سليمة.
 */
export function auditSale(input: SaleAuditInput): SaleAuditResult {
  const { lines, gold21, discount } = input
  const actualTotal = input.totalAmount

  let gross = 0
  let makingTotal = 0
  const detail: SaleAuditLine[] = lines.map((l) => {
    const grams = l.weight * l.quantity
    const perGram = gold21 > 0 && l.karat > 0 ? (gold21 * l.karat) / 21 : 0
    const metal = perGram * grams
    const making = (l.factoryForSale || l.factory) * grams
    const taxAndStamp = metal * TAX_AND_STAMP_RATE

    gross += metal + making + taxAndStamp
    makingTotal += making

    return {
      productName: l.productName,
      karat: l.karat,
      grams: round2(grams),
      quantity: l.quantity,
      making: round2(making),
      taxAndStamp: round2(taxAndStamp),
      lineTotal: round2(metal + making + taxAndStamp),
    }
  })

  const discountCap = Math.min(Math.max(discount, 0), makingTotal)
  const expectedTotal = Math.round(gross - discountCap)
  const diff = Math.round((actualTotal - expectedTotal) * 100) / 100

  return {
    expectedTotal,
    actualTotal,
    diff,
    lines: detail,
    message: Math.abs(diff) > DEVIATION_TOLERANCE_EGP ? diffMessage(diff, 'sale') : null,
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}