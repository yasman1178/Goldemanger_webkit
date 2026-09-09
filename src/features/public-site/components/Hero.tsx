import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Gem,
  TrendingUp,
  Tablet,
  Printer,
  Scale,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Calculator,
  MessageCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react'
import { WHATSAPP_LINK } from '@/shared/lib/seo'
import { goldTabletPosImg } from '@/assets/images'

// أسعار الذهب التقديرية الحية للسوق
const livePrices = [
  { karat: 'عيار 24', price: '4,480 ج.م', change: '+15 ج.م', up: true },
  { karat: 'عيار 21 (الأكثر تداولاً)', price: '3,920 ج.م', change: '+12 ج.م', up: true },
  { karat: 'عيار 18', price: '3,360 ج.م', change: '+10 ج.م', up: true },
  { karat: 'الأونصة عالمياً', price: '$2,885 USD', change: '+0.4%', up: true },
]

export function Hero() {
  const [calcWeight, setCalcWeight] = useState<number>(10)
  const [calcKarat, setCalcKarat] = useState<24 | 21 | 18>(18)

  // حساب التحويل التلقائي لعيار 21 (معادلة الصاغة القياسية: الوزن * العيار / 21)
  const weight21 = ((calcWeight || 0) * calcKarat) / 21
  const estimatedValue = Math.round(weight21 * 3920)

  return (
    <section className="relative overflow-hidden bg-[#0a0a0c] text-white pt-6 pb-20 lg:pt-10 lg:pb-28">
      {/* 3D Atmospheric Background Glows */}
      <div className="pointer-events-none absolute -top-40 right-1/4 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-amber-500/20 via-yellow-600/10 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/4 h-[450px] w-[450px] rounded-full bg-blue-600/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />

      {/* Live Gold Ticker Strip */}
      <div className="relative mx-auto max-w-6xl px-4 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-neutral-900/80 to-neutral-950/80 p-2.5 sm:px-5 backdrop-blur-md shadow-[0_4px_20px_rgba(217,119,6,0.12)]">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-400">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <TrendingUp className="h-4 w-4" />
            <span>مؤشر أسعار الذهب لحظة بلحظة:</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm">
            {livePrices.map((item) => (
              <div key={item.karat} className="flex items-center gap-1.5 font-medium">
                <span className="text-neutral-400">{item.karat}:</span>
                <span className="font-bold text-white tabular-nums">{item.price}</span>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  {item.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Main Heading & Value Proposition */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs sm:text-sm font-semibold text-amber-300 backdrop-blur-md shadow-inner">
            <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
            <span>الجيل الأحدث 2026 — مصمم خصيصاً لشاشات التابلت 10 بوصة باللمس</span>
          </div>

          <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            نظام <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">ERP الذكي</span>
            <br />
            لإدارة محلات الذهب والصاغة
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-neutral-300 sm:text-lg">
            ودّع دفاتر الحسابات والأخطاء اليدوية. <strong className="text-amber-400 font-bold">جولد ماستر</strong> يجمع لك إدارة فواتير البيع باللمس،
            حساب كسر الذهب والمصنعية، جرد المخزون بالجرام والكيلو، وطباعة الباركود والإيصالات في ثوانٍ معدودة.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex touch-target w-full sm:w-auto items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 px-8 py-4 text-base font-bold text-neutral-950 shadow-[0_4px_25px_rgba(245,158,11,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_30px_rgba(245,158,11,0.5)] active:scale-95"
            >
              <MessageCircle className="h-5 w-5 fill-neutral-950" />
              <span>طلب تجربة مجانية 14 يوماً</span>
            </a>

            <Link
              to="/login"
              className="inline-flex touch-target w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-neutral-700 bg-neutral-900/80 px-8 py-4 text-base font-bold text-white backdrop-blur-md transition-all hover:border-amber-400/50 hover:bg-neutral-800"
            >
              <span>دخول النظام التجريبي</span>
              <ArrowLeft className="h-5 w-5 text-amber-400" />
            </Link>
          </div>

          {/* Trust points */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-neutral-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-amber-400" />
              <span>معتمد لدى أكثر من 150+ محل صاغة</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-amber-400" />
              <span>دعم طابعات الباركود والإيصال 80mm</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-amber-400" />
              <span>ربط الخزينة والشفتات بدون أي عجز</span>
            </div>
          </div>
        </div>

        {/* 3D Visual Centerpiece Stage */}
        <div className="mt-14 relative">
          <div className="relative mx-auto max-w-5xl rounded-3xl p-1 bg-gradient-to-b from-amber-500/40 via-neutral-800/60 to-transparent shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
            <div className="relative overflow-hidden rounded-[22px] bg-neutral-950/90 border border-neutral-800">
              {/* Top simulated tablet bezel bar */}
              <div className="flex items-center justify-between border-b border-neutral-800/80 bg-neutral-900/70 px-4 py-3 text-xs text-neutral-400">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                  <span className="ms-2 font-mono text-[11px] text-neutral-400">Gold Master POS • 10-inch Tablet View</span>
                </div>
                <div className="flex items-center gap-2 font-medium text-amber-400">
                  <Gem className="h-4 w-4" />
                  <span>نظام إدارة محلات الذهب 2026</span>
                </div>
              </div>

              {/* 3D Image Mockup & Interactive Showcase */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                {/* Visual 3D Tablet Mockup */}
                <div className="lg:col-span-7 relative overflow-hidden bg-neutral-950 flex items-center justify-center p-4 sm:p-6">
                  <div className="relative group w-full overflow-hidden rounded-2xl border border-amber-500/20 shadow-2xl">
                    <img
                      src={goldTabletPosImg}
                      alt="Gold Master 3D Tablet POS System Mockup"
                      referrerPolicy="no-referrer"
                      className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* 3D Floating Highlights */}
                    <div className="absolute top-4 right-4 rounded-xl border border-amber-400/40 bg-neutral-950/80 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-amber-300 shadow-lg flex items-center gap-1.5">
                      <Tablet className="h-3.5 w-3.5 text-amber-400" />
                      <span>نقطة بيع لمس سريعة</span>
                    </div>

                    <div className="absolute bottom-4 left-4 rounded-xl border border-emerald-400/40 bg-neutral-950/85 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-emerald-300 shadow-lg flex items-center gap-1.5">
                      <Scale className="h-3.5 w-3.5 text-emerald-400" />
                      <span>دقة 0.01 جرام لحظياً</span>
                    </div>
                  </div>
                </div>

                {/* Interactive Real-Time Gold Converter for Jewelers */}
                <div className="lg:col-span-5 bg-gradient-to-b from-neutral-900/90 to-neutral-950 p-5 sm:p-7 flex flex-col justify-between border-t lg:border-t-0 lg:border-r border-neutral-800">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <Calculator className="h-4 w-4" />
                        </div>
                        <div>
                          <h2 className="text-sm font-bold text-white">حاسبة كسر الذهب التفاعلية</h2>
                          <p className="text-[11px] text-neutral-400">معادلة الصاغة التلقائية في النظام</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                        مباشر
                      </span>
                    </div>

                    <div className="mt-5 space-y-4">
                      {/* Weight input */}
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                          وزن القطعة أو الكسر (جرام):
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0.1"
                            step="0.01"
                            value={calcWeight}
                            onChange={(e) => setCalcWeight(parseFloat(e.target.value) || 0)}
                            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-sm font-bold text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 tabular-nums"
                            placeholder="مثال: 15.5"
                          />
                          <span className="absolute left-3 top-2.5 text-xs text-neutral-500 font-bold">جرام</span>
                        </div>
                      </div>

                      {/* Karat selection */}
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                          العيار المراد تحويله:
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {([18, 21, 24] as const).map((k) => (
                            <button
                              key={k}
                              type="button"
                              onClick={() => setCalcKarat(k)}
                              className={`touch-target py-2 rounded-xl text-xs font-bold transition-all border ${
                                calcKarat === k
                                  ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md font-extrabold'
                                  : 'bg-neutral-800/60 text-neutral-300 border-neutral-700 hover:border-neutral-500'
                              }`}
                            >
                              عيار {k}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Result Box with 3D Depth */}
                      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-neutral-900 to-neutral-950 p-4 shadow-inner">
                        <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                          <span>المعادل الصافي عيار 21:</span>
                          <span className="text-amber-400 font-bold">({calcWeight}g × {calcKarat} / 21)</span>
                        </div>
                        <div className="text-2xl font-black text-amber-300 tabular-nums">
                          {weight21.toFixed(3)} <span className="text-sm font-bold text-white">جرام 21</span>
                        </div>

                        <div className="mt-3 pt-3 border-t border-neutral-800 flex items-center justify-between">
                          <span className="text-xs text-neutral-400">القيمة التقديرية بالجنيه:</span>
                          <span className="text-lg font-bold text-emerald-400 tabular-nums">
                            {estimatedValue.toLocaleString('ar-EG')} ج.م
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      يُحسب ويُخصم فوراً بالفاتورة
                    </span>
                    <span className="text-amber-400 font-bold">طباعة سريعة</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Core Pillars of Gold Master */}
        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 backdrop-blur-sm transition-all hover:border-amber-500/40 hover:bg-neutral-900">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-400 mb-3 border border-amber-500/20">
              <Tablet className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-white">واجهة كاشير 10 إنش</h3>
            <p className="mt-1 text-xs text-neutral-400 leading-relaxed">أزرار لمس كبيرة مصممة لراحة البائع وسرعة إتمام الفاتورة للزبون.</p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 backdrop-blur-sm transition-all hover:border-amber-500/40 hover:bg-neutral-900">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-400 mb-3 border border-amber-500/20">
              <Scale className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-white">إدارة كسر ومصنعية الذهب</h3>
            <p className="mt-1 text-xs text-neutral-400 leading-relaxed">حساب التبديل والكسر والذهب القديم مع تحويله تلقائياً لعيار 21.</p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 backdrop-blur-sm transition-all hover:border-amber-500/40 hover:bg-neutral-900">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-400 mb-3 border border-amber-500/20">
              <Printer className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-white">باركود وإيصالات حرارية</h3>
            <p className="mt-1 text-xs text-neutral-400 leading-relaxed">طباعة ليبيل القطع 35×10mm وإيصالات الكاشير 80mm بضغطة زر.</p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 backdrop-blur-sm transition-all hover:border-amber-500/40 hover:bg-neutral-900">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-400 mb-3 border border-amber-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-white">إغلاق شفت وخزينة محكمة</h3>
            <p className="mt-1 text-xs text-neutral-400 leading-relaxed">تقفيل اليومية واستخراج إيصال الجرد ومطابقة النقدية مع الذهب الفعلي.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
