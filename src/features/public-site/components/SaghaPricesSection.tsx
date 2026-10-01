import { useState, useMemo, useEffect } from 'react'
import {
  TrendingUp,
  Clock,
  RefreshCw,
  Coins,
  Scale,
  ShieldCheck,
  Calculator,
  ChevronRight,
  Info,
  Sparkles,
  ArrowUpRight,
  Receipt,
  FileCheck2,
} from 'lucide-react'
import { useSaghaPrices } from '@/shared/lib/sagha-prices'
import { WHATSAPP_LINK, setSaghaPricesSchema, removeJsonLd } from '@/shared/lib/seo'
import { goldBullionImg } from '@/assets/images'

export function SaghaPricesSection() {
  const { prices, loading, refreshPrices } = useSaghaPrices()
  const [activeTab, setActiveTab] = useState<'karats' | 'bullions' | 'scrap'>('karats')

  // تحديث سكيما محركات البحث (Schema.org JSON-LD) بأسعار الصاغة الحية
  useEffect(() => {
    setSaghaPricesSchema(prices)
    return () => {
      removeJsonLd('sagha-prices-live')
    }
  }, [prices])

  // حاسبة الذهب بالصاغة
  const [calcWeight, setCalcWeight] = useState<number>(15)
  const [calcKarat, setCalcKarat] = useState<number>(21)
  const [calcType, setCalcType] = useState<'jewelry' | 'luxury' | 'bullion' | 'scrap'>('jewelry')
  const [customMaking, setCustomMaking] = useState<string>('')

  // حسابات المصنعية التقديرية بناءً على نوع المشغول في السوق المصري
  const derivedMaking = useMemo(() => {
    if (customMaking && !isNaN(Number(customMaking))) {
      return Math.max(0, Number(customMaking))
    }
    switch (calcType) {
      case 'scrap':
        return 0 // كسر الذهب بدون مصنعية
      case 'bullion':
        return calcKarat === 24 ? 55 : 65 // سبائك
      case 'luxury':
        return calcKarat === 18 ? 180 : 140 // ماركات وفصوص
      case 'jewelry':
      default:
        return calcKarat === 21 ? 110 : calcKarat === 18 ? 145 : 80
    }
  }, [calcType, calcKarat, customMaking])

  // السعر الخام للجرام حسب العيار المحدد
  const rawGramPrice = useMemo(() => {
    switch (calcKarat) {
      case 24:
        return prices.gold24Sell
      case 22:
        return prices.gold22Sell
      case 18:
        return prices.gold18Sell
      case 14:
        return prices.gold14Sell
      case 21:
      default:
        return prices.gold21Sell
    }
  }, [calcKarat, prices])

  // إجمالي الحساب
  const rawTotal = (calcWeight || 0) * rawGramPrice
  const makingTotal = calcType === 'scrap' ? 0 : (calcWeight || 0) * derivedMaking
  // ضريبة ودمغة تقريبية في مصر 1% على المصنعية أو الذهب
  const stampFee = calcType === 'scrap' ? 0 : Math.round((calcWeight || 0) * 8)
  const grandTotal = Math.round(rawTotal + makingTotal + stampFee)
  const equivalent21Grams = Number((((calcWeight || 0) * calcKarat) / 21).toFixed(3))

  return (
    <section
      id="sagha-prices"
      className="scroll-mt-16 relative border-t border-amber-500/20 bg-gradient-to-b from-[#0e0e12] via-[#0a0a0c] to-[#0d0d11] text-white py-16 lg:py-24 overflow-hidden"
    >
      {/* Dynamic Background Lighting */}
      <div className="pointer-events-none absolute -top-32 right-1/3 h-[500px] w-[500px] rounded-full bg-amber-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-[500px] w-[500px] rounded-full bg-yellow-600/10 blur-[140px]" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header & Main SEO Target Query */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1.5 text-xs sm:text-sm font-bold text-amber-300 backdrop-blur-md shadow-inner">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <TrendingUp className="h-4 w-4 text-amber-400" />
            <span>بورصة الصاغة المصرية اليوم • تحديث لحظي مباشر</span>
          </div>

          <h2 className="mt-4 text-2xl font-black tracking-tight sm:text-4xl lg:text-5xl text-white">
            أسعار الذهب اليوم في مصر بالصاغة مباشر
            <span className="block mt-2 text-xl sm:text-3xl font-bold bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              سعر الذهب عيار 21 والجنيه الذهب (بيع وشراء)
            </span>
          </h2>

          <p className="mt-4 text-sm sm:text-base leading-relaxed text-neutral-300">
            تابع لحظة بلحظة <strong className="text-amber-400 font-semibold">أسعار الذهب الآن في محلات الصاغة</strong> وسوق الذهب بمصر بدون مصنعية وبالمصنعية والدمغة. أسعار عيار 24، 22، 21، 18، سبائك BTC والجنيه الذهب مع حاسبة الصاغة التفاعلية.
          </p>

          {/* Top Search Trends Chips / Badges for SEO Rich Indexing */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
            {[
              'سعر الذهب اليوم في مصر',
              'سعر الذهب عيار 21 بالمصنعية',
              'سعر الجنيه الذهب اليوم',
              'سعر الذهب اليوم بيع وشراء',
              'سعر سبيكة الذهب BTC',
              'اسعار كسر الذهب عيار 21',
            ].map((keyword) => (
              <span
                key={keyword}
                className="rounded-lg border border-neutral-800 bg-neutral-900/80 px-2.5 py-1 text-neutral-300 font-medium hover:border-amber-500/40 hover:text-amber-300 transition-colors"
              >
                #{keyword}
              </span>
            ))}
          </div>

          {/* Refresh & Live Timestamp Bar */}
          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/90 px-4 py-2 text-xs text-neutral-400 shadow-md">
            <div className="flex items-center gap-1.5 font-medium text-neutral-200">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span>آخر تحديث بالصاغة:</span>
              <strong className="text-amber-400 tabular-nums">{prices.lastUpdatedFormatted}</strong>
            </div>
            <span className="h-3 w-px bg-neutral-700" />
            <button
              type="button"
              onClick={() => refreshPrices()}
              disabled={loading}
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-amber-200 cursor-pointer disabled:opacity-50 transition-colors"
              title="تحديث أسعار الذهب الآن"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'جاري التحديث...' : 'تحديث الأسعار الآن'}</span>
            </button>
          </div>
        </div>

        {/* 4 Core Real-Time Metric Cards (Hero Highlights) — Sleek, compact & balanced */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Gram 21 Card */}
          <div className="group relative overflow-hidden rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-500/15 via-neutral-900/90 to-neutral-950 p-3.5 shadow-md hover:border-amber-400 transition-all">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[11px] font-black text-amber-300 border border-amber-500/30">
                عيار 21
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-500/20">
                الأكثر تداولاً
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-[11px] text-neutral-400">سعر البيع:</span>
              <div className="text-xl sm:text-2xl font-black text-white tabular-nums">
                {prices.gold21Sell.toLocaleString('ar-EG')}{' '}
                <span className="text-xs font-bold text-amber-400">ج.م</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
              <span className="text-neutral-400">الشراء (كسر):</span>
              <span className="font-bold text-neutral-200 tabular-nums">
                {prices.gold21Buy.toLocaleString('ar-EG')} ج.م
              </span>
            </div>
          </div>

          {/* 2. Gold Pound Card */}
          <div className="group relative overflow-hidden rounded-xl border border-neutral-800 bg-gradient-to-b from-neutral-900/90 to-neutral-950 p-3.5 shadow-md hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-yellow-500/15 px-2 py-0.5 text-[11px] font-black text-yellow-300 border border-yellow-500/30">
                الجنيه الذهب
              </span>
              <span className="text-[10px] text-neutral-400 font-medium">8 جرام عيار 21</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-[11px] text-neutral-400">سعر البيع:</span>
              <div className="text-xl sm:text-2xl font-black text-white tabular-nums">
                {prices.goldPoundSell.toLocaleString('ar-EG')}{' '}
                <span className="text-xs font-bold text-yellow-400">ج.م</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
              <span className="text-neutral-400">الشراء:</span>
              <span className="font-bold text-neutral-200 tabular-nums">
                {prices.goldPoundBuy.toLocaleString('ar-EG')} ج.م
              </span>
            </div>
          </div>

          {/* 3. Bullion 10g 24K Card */}
          <div className="group relative overflow-hidden rounded-xl border border-neutral-800 bg-gradient-to-b from-neutral-900/90 to-neutral-950 p-3.5 shadow-md hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-amber-400/15 px-2 py-0.5 text-[11px] font-black text-amber-300 border border-amber-400/30">
                سبيكة 10g BTC
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold">24K نقي</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-[11px] text-neutral-400">بالغلاف:</span>
              <div className="text-xl sm:text-2xl font-black text-white tabular-nums">
                {(prices.gold24Sell * 10 + 580).toLocaleString('ar-EG')}{' '}
                <span className="text-xs font-bold text-amber-400">ج.م</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
              <span className="text-neutral-400">كاش باك:</span>
              <span className="font-bold text-emerald-400 tabular-nums">260 ج.م</span>
            </div>
          </div>

          {/* 4. Gram 18 & Scrap Card */}
          <div className="group relative overflow-hidden rounded-xl border border-neutral-800 bg-gradient-to-b from-neutral-900/90 to-neutral-950 p-3.5 shadow-md hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-blue-500/15 px-2 py-0.5 text-[11px] font-black text-blue-300 border border-blue-500/30">
                عيار 18
              </span>
              <span className="text-[10px] text-neutral-400">مشغولات</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-[11px] text-neutral-400">سعر البيع:</span>
              <div className="text-xl sm:text-2xl font-black text-white tabular-nums">
                {prices.gold18Sell.toLocaleString('ar-EG')}{' '}
                <span className="text-xs font-bold text-blue-400">ج.م</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
              <span className="text-neutral-400">الشراء (كسر):</span>
              <span className="font-bold text-neutral-200 tabular-nums">
                {prices.gold18Buy.toLocaleString('ar-EG')} ج.م
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation for Detailed Tables */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('karats')}
              className={`touch-target px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'karats'
                  ? 'bg-amber-500 text-neutral-950 shadow-md font-extrabold'
                  : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              جدول عيارات ومشغولات الذهب (24، 22، 21، 18، 14)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bullions')}
              className={`touch-target px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'bullions'
                  ? 'bg-amber-500 text-neutral-950 shadow-md font-extrabold'
                  : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              الجنيهات وسبائك BTC الاستثمارية
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('scrap')}
              className={`touch-target px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'scrap'
                  ? 'bg-amber-500 text-neutral-950 shadow-md font-extrabold'
                  : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              أسعار كسر الذهب والأونصة العالمية
            </button>
          </div>

          <div className="text-xs text-neutral-400">
            <span>الأسعار بالجنيه المصري (EGP)</span>
          </div>
        </div>

        {/* Tab 1: Karats Full Table */}
        {activeTab === 'karats' && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/80 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-900/90 text-neutral-400 font-bold">
                    <th className="py-3.5 px-4 sm:px-6">العيار / المشغول</th>
                    <th className="py-3.5 px-3 sm:px-4">سعر البيع (للمستهلك)</th>
                    <th className="py-3.5 px-3 sm:px-4">سعر الشراء (كسر)</th>
                    <th className="py-3.5 px-3 sm:px-4">متوسط المصنعية والدمغة</th>
                    <th className="py-3.5 px-3 sm:px-4">السعر التقديري بالمصنعية</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">التغير اليومي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900 text-neutral-200">
                  {prices.karats.map((k) => (
                    <tr
                      key={k.karat}
                      className="hover:bg-neutral-900/50 transition-colors font-medium"
                    >
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 text-xs font-black">
                            {k.karat}
                          </span>
                          <div>
                            <span className="block">{k.name}</span>
                            <span className="text-[11px] text-neutral-500 font-normal">
                              {k.alias}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 font-black text-amber-400 tabular-nums text-base sm:text-lg">
                        {k.sellPrice.toLocaleString('ar-EG')} ج.م
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 font-bold text-neutral-300 tabular-nums">
                        {k.buyPrice.toLocaleString('ar-EG')} ج.م
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 text-neutral-400 tabular-nums">
                        {k.averageMaking.min} - {k.averageMaking.max} ج.م
                      </td>
                      <td className="py-3.5 px-3 sm:px-4 font-bold text-emerald-400 tabular-nums">
                        {k.totalWithMakingMin.toLocaleString('ar-EG')} -{' '}
                        {k.totalWithMakingMax.toLocaleString('ar-EG')} ج.م
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 text-xs font-bold text-emerald-400">
                          <ArrowUpRight className="h-3 w-3" />
                          <span>{k.changePercent}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-neutral-900/60 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400">
              <div className="flex items-center gap-1.5">
                <Info className="h-4 w-4 text-amber-400 shrink-0" />
                <span>
                  ملاحظة: تختلف قيمة المصنعية والدمغة من محل لآخر ومن ورشة لأخرى بحسب دقة المشغول
                  والفصوص والماركة (لازوردي، كيروز، إيطالي).
                </span>
              </div>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline font-bold"
              >
                استفسر عن أسعار الجملة للصاغة ←
              </a>
            </div>
          </div>
        )}

        {/* Tab 2: Bullions & Coins */}
        {activeTab === 'bullions' && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bullions Table */}
            <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/80">
              <div className="border-b border-neutral-800 bg-neutral-900/80 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">سبائك الذهب عيار 24 (BTC ومعتمدة)</h3>
                </div>
                <span className="text-[11px] text-amber-400 font-semibold">استثمار وادخار</span>
              </div>
              <div className="divide-y divide-neutral-900">
                {prices.bullions.map((b) => (
                  <div key={b.name} className="p-4 flex items-center justify-between hover:bg-neutral-900/40">
                    <div>
                      <div className="font-bold text-white text-sm">{b.name}</div>
                      <div className="text-[11px] text-neutral-500">{b.company}</div>
                    </div>
                    <div className="text-left">
                      <div className="font-black text-amber-400 tabular-nums text-base">
                        {b.price.toLocaleString('ar-EG')} ج.م
                      </div>
                      <div className="text-[11px] text-emerald-400 font-medium">
                        كاش باك: {b.cashback} ج.م
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coins Table */}
            <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/80">
              <div className="border-b border-neutral-800 bg-neutral-900/80 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-yellow-400" />
                  <h3 className="text-sm font-bold text-white">الجنيهات الذهبية عيار 21 (BTC / صاغة)</h3>
                </div>
                <span className="text-[11px] text-yellow-400 font-semibold">أوزان مختلفة</span>
              </div>
              <div className="divide-y divide-neutral-900">
                {prices.coins.map((c) => (
                  <div key={c.name} className="p-4 flex items-center justify-between hover:bg-neutral-900/40">
                    <div>
                      <div className="font-bold text-white text-sm">{c.name}</div>
                      <div className="text-[11px] text-neutral-500">عيار 21 صافي • وزن {c.weight} جرام</div>
                    </div>
                    <div className="text-left">
                      <div className="font-black text-white tabular-nums text-base">
                        {c.sellPrice.toLocaleString('ar-EG')} ج.م
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        شراء: {c.buyPrice.toLocaleString('ar-EG')} ج.م
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Scrap & Global Ounce */}
        {activeTab === 'scrap' && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/80 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  أسعار شراء كسر الذهب اليوم في الصاغة (بدون مصنعية)
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  كسر الذهب هو الذهب القديم أو المستعمل أو السبائك المفتوحة التي يبيعها المواطن لمحل الصاغة. يتم شراؤه بالسعر الخام بدون احتساب أي مصنعية وفق وزن الميزان الحساس الحقيقي.
                </p>

                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/70 border border-neutral-800">
                    <span className="font-bold text-sm text-neutral-200">سعر كسر عيار 21 اليوم:</span>
                    <span className="text-lg font-black text-amber-400 tabular-nums">
                      {prices.gold21Buy.toLocaleString('ar-EG')} ج.م / جرام
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/70 border border-neutral-800">
                    <span className="font-bold text-sm text-neutral-200">سعر كسر عيار 18 اليوم:</span>
                    <span className="text-lg font-black text-neutral-200 tabular-nums">
                      {prices.gold18Buy.toLocaleString('ar-EG')} ج.م / جرام
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/70 border border-neutral-800">
                    <span className="font-bold text-sm text-neutral-200">سعر كسر عيار 24 اليوم:</span>
                    <span className="text-lg font-black text-neutral-200 tabular-nums">
                      {prices.gold24Buy.toLocaleString('ar-EG')} ج.م / جرام
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t md:border-t-0 md:border-r border-neutral-800 pt-4 md:pt-0 md:pe-6">
                <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  سعر أونصة الذهب عالمياً (Gold Spot XAU/USD)
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  الأونصة الدولية تعادل 31.1035 جرام من الذهب الخالص عيار 24، وهي المقياس الأساسي لتسعير الذهب في بورصات لندن ونيويورك.
                </p>

                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400">سعر الأونصة بالدولار:</span>
                    <span className="text-xl font-black text-emerald-300 tabular-nums">
                      ${prices.ounceUsd.toLocaleString()} USD
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-emerald-500/20 pt-2">
                    <span className="text-xs text-neutral-400">سعر الأونصة بالجنيه المصري:</span>
                    <span className="text-xl font-black text-white tabular-nums">
                      {prices.ounceEgp.toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-neutral-400 bg-neutral-900 p-3 rounded-xl border border-neutral-800">
                  ⚡ يقوم نظام <strong>جولد ماستر</strong> بتحديث أسعار الذهب وكسر الذهب أوتوماتيكياً كل 60 ثانية لربط مبيعات ومشتريات الكاشير بأحدث سعر بالصاغة.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Sagha Making & Total Price Calculator */}
        <div className="mt-14 rounded-3xl border border-amber-500/30 bg-gradient-to-b from-neutral-900/90 via-neutral-950 to-neutral-950 p-6 sm:p-8 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Calculator Left: Inputs */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    حاسبة سعر الذهب التفاعلية بالمصنعية والدمغة
                  </h3>
                  <p className="text-xs text-neutral-400">
                    احسب التكلفة الإجمالية لشراء أو بيع أي قطعة ذهب بالصاغة في ثوانٍ
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Weight Input */}
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    وزن القطعة (جرام):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0.1"
                      step="0.01"
                      value={calcWeight}
                      onChange={(e) => setCalcWeight(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-base font-black text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 tabular-nums"
                      placeholder="15.0"
                    />
                    <span className="absolute left-3 top-3 text-xs text-neutral-500 font-bold">جرام</span>
                  </div>
                </div>

                {/* Karat Selection */}
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                    العيار:
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[24, 21, 18, 14].map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setCalcKarat(k)}
                        className={`touch-target py-2.5 rounded-xl text-xs font-bold transition-all border ${
                          calcKarat === k
                            ? 'bg-amber-500 text-neutral-950 border-amber-400 font-black shadow-md'
                            : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:border-neutral-500'
                        }`}
                      >
                        {k}K
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Type / Making Selector */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  نوع المشغول / المصنعية التقديرية:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'jewelry', label: 'مشغول عادي (سلاسل/خواتم)', fee: '110 ج.م' },
                    { id: 'luxury', label: 'مجوهرات لازوردي / فصوص', fee: '180 ج.م' },
                    { id: 'bullion', label: 'سبيكة ذهب BTC', fee: '55 ج.م' },
                    { id: 'scrap', label: 'كسر ذهب (بدون مصنعية)', fee: '0 ج.م' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setCalcType(t.id as 'jewelry' | 'luxury' | 'bullion' | 'scrap')
                        setCustomMaking('')
                      }}
                      className={`p-2.5 rounded-xl text-right text-xs font-medium border transition-all ${
                        calcType === t.id && !customMaking
                          ? 'bg-amber-400/15 border-amber-400 text-amber-300 font-bold'
                          : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      <div className="font-bold text-white text-[11px]">{t.label}</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">{t.fee}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Making Optional Override */}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs text-neutral-400">أو حدد مصنعية يدوياً:</span>
                <input
                  type="number"
                  placeholder="المصنعية/جم"
                  value={customMaking}
                  onChange={(e) => setCustomMaking(e.target.value)}
                  className="w-32 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-xs text-white font-bold placeholder:text-neutral-600 focus:border-amber-400 focus:outline-none"
                />
                <span className="text-xs text-neutral-500 font-medium">ج.م / جرام</span>
              </div>
            </div>

            {/* Calculator Right: Result Breakdown Receipt */}
            <div className="lg:col-span-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-neutral-900 to-neutral-950 p-6 shadow-inner space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    كشف حساب الفاتورة التقديرية
                  </span>
                </div>
                <span className="text-[11px] text-amber-400 font-mono">
                  {calcWeight}g • عيار {calcKarat}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-neutral-300">
                  <span>سعر الجرام الخام (عيار {calcKarat}):</span>
                  <span className="font-bold tabular-nums text-white">
                    {rawGramPrice.toLocaleString('ar-EG')} ج.م
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-300">
                  <span>قيمة الذهب الصافي ({calcWeight}g × {rawGramPrice}):</span>
                  <span className="font-bold tabular-nums text-white">
                    {Math.round(rawTotal).toLocaleString('ar-EG')} ج.م
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-300">
                  <span>إجمالي المصنعية ({derivedMaking} ج.م/جم):</span>
                  <span className="font-bold tabular-nums text-amber-400">
                    +{Math.round(makingTotal).toLocaleString('ar-EG')} ج.م
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                  <span>الدمغة وضريبة القيمة المضافة التقريبية:</span>
                  <span className="tabular-nums">+{stampFee.toLocaleString('ar-EG')} ج.م</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400 text-[11px] border-t border-neutral-800/80 pt-2">
                  <span>المعادل الصافي لعيار 21:</span>
                  <span className="text-amber-300 font-bold tabular-nums">
                    {equivalent21Grams} جرام 21
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-neutral-950/90 border border-amber-500/40 p-4 text-center mt-4">
                <span className="text-xs text-neutral-400 font-medium block">
                  الإجمالي النهائي المتوقع للفاتورة
                </span>
                <div className="text-3xl font-black text-emerald-400 tabular-nums mt-1">
                  {grandTotal.toLocaleString('ar-EG')}{' '}
                  <span className="text-sm font-bold text-white">ج.م</span>
                </div>
                <span className="text-[10px] text-neutral-500 block mt-1">
                  شامل الذهب والمصنعية والدمغة الرسمية
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sagha Advice & Golden Rules for Buyers and Jewelers */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-sm">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-400 grid place-items-center mb-3">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-sm text-white mb-1.5">كيف تتأكد من سلامة الفاتورة؟</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              تأكد من تدوين الوزن بدقة رقمين بعد الفاصلة، والعيار، وقيمة المصنعية مفصولة عن سعر الذهب الخام، مع ختم المحل والباركود الخاص بالقطعة.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-sm">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-400 grid place-items-center mb-3">
              <Coins className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-sm text-white mb-1.5">الفرق بين سعر البيع وسعر الشراء</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              يسمى في الصاغة (السبريد Spread)، وهو هامش الربح لتجار التجزئة، ويتراوح عادة بين 20 إلى 30 جنيهاً في الجرام لعيار 21، بالإضافة لاسترداد الكاش باك في السبائك.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-sm">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-400 grid place-items-center mb-3">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-sm text-white mb-1.5">لأصحاب محلات الصاغة والورش</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              نظام <strong>جولد ماستر</strong> يمنع الأخطاء الحسابية نهائياً: تحديث لحظي للأسعار، وزن باللمس، حساب كسر الذهب أوتوماتيكياً، وطباعة باركود 35×10mm.
            </p>
          </div>
        </div>

        {/* SEO Sagha Gold FAQs with Structured Semantic Markup */}
        <div className="mt-14 rounded-3xl border border-neutral-800 bg-neutral-950/70 p-6 sm:p-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h3 className="text-xl sm:text-2xl font-black text-white">
              أهم التساؤلات عن <span className="text-amber-400">سعر الذهب في الصاغة المصرية</span>
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 mt-2">
              إجابات دقيقة ومحدثة وفق حركة السوق وتداولات شعبة الذهب
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800/80">
              <h4 className="font-bold text-sm text-amber-300 mb-2">
                س: كم سعر مصنعية جرام الذهب عيار 21 اليوم؟
              </h4>
              <p className="text-xs text-neutral-300 leading-relaxed">
                ج: تتراوح مصنعية جرام الذهب عيار 21 في محلات الصاغة المصرية بين <strong>80 إلى 150 جنيهاً</strong> للجرام، وتصل إلى 180 جنيهاً في الماركات الشهيرة والمشغولات المحتوية على فصوص وأحجار زركون.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800/80">
              <h4 className="font-bold text-sm text-amber-300 mb-2">
                س: ما الفرق بين سعر الذهب عيار 21 وعيار 18؟
              </h4>
              <p className="text-xs text-neutral-300 leading-relaxed">
                ج: عيار 21 يحتوي على 87.5% ذهب نقي وهو الأكثر طلباً بمصر للادخار، بينما عيار 18 يحتوي على 75% ذهب نقي ويتميز بالصلابة والتصميمات العصرية الإيطالية الفاخرة.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800/80">
              <h4 className="font-bold text-sm text-amber-300 mb-2">
                س: كيف يتم حساب سعر بيع كسر الذهب القديم؟
              </h4>
              <p className="text-xs text-neutral-300 leading-relaxed">
                ج: يحسب كسر الذهب بضرب الوزن الصافي في سعر الشراء المعلن في الصاغة لنفس العيار، بدون إضافة أو خصم أي مصنعية، بعد خصم وزن الفصوص غير الثمينة إن وجدت.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800/80">
              <h4 className="font-bold text-sm text-amber-300 mb-2">
                س: هل السبائك الذهبية أفضل للاستثمار أم الجنيه الذهب؟
              </h4>
              <p className="text-xs text-neutral-300 leading-relaxed">
                ج: كلاهما ممتاز، ولكن السبائك تتميز بأنها عيار 24 بنسبة نقاء 999.9% ومصنعيتها أقل مع ميزة استرداد (كاش باك)، بينما الجنيه الذهب عيار 21 وسهل التداول في أي محل صاغة.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Banner to Gold Master ERP */}
        <div className="mt-12 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/60 via-neutral-900 to-neutral-950 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={goldBullionImg}
              alt="سبائك ذهب"
              className="h-16 w-16 rounded-2xl object-cover border border-amber-500/30 shadow-lg shrink-0 hidden sm:block"
            />
            <div>
              <h4 className="text-base sm:text-lg font-black text-white">
                صاحب محل صاغة؟ اضبط مبيعاتك وحسابات كسر الذهب بدقة 100%
              </h4>
              <p className="text-xs text-neutral-300 mt-1">
                جرب نظام <strong>جولد ماستر</strong> مجاناً لمدة 14 يوماً مع دعم فني متواصل وتدريب كامل للبائعين.
              </p>
            </div>
          </div>

          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target shrink-0 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-bold text-neutral-950 shadow-lg hover:brightness-110 active:scale-95 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            <span>طلب تجربة مجانية للنظام</span>
            <ChevronRight className="h-4 w-4 rotate-180" />
          </a>
        </div>
      </div>
    </section>
  )
}
