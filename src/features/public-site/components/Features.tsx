import {
  Tablet,
  Printer,
  Scale,
  TrendingUp,
  Boxes,
  Users,
  Sparkles,
  CheckCircle,
} from 'lucide-react'
import { goldBullionImg } from '@/assets/images'

const coreFeatures = [
  {
    icon: Tablet,
    title: 'واجهة كاشير POS باللمس للتابلت',
    desc: 'مخصصة بالكامل لتناسب شاشات التابلت 10 إنش. أزرار كبيرة وسريعة لإضافة القطع بالسكانر أو الباركود، وإنهاء الفاتورة في ثوانٍ دون انتظار الزبون.',
    tag: 'سرعة قياسية',
  },
  {
    icon: Scale,
    title: 'حساب كسر ومصنعية الذهب تلقائياً',
    desc: 'محرك حسابي ذكي يحول أي وزن من عيار 18 أو 24 لمعادل عيار 21 تلقائياً، مع احتساب المصنعية الصافية وفارق التبديل في نفس الفاتورة.',
    tag: 'دقة الصاغة',
  },
  {
    icon: Printer,
    title: 'طباعة فورية للباركود 35×10mm والإيصالات',
    desc: 'توليد وطباعة استيكرات ليبيل المجوهرات المقاومة للحرارة بقياس 35×10mm متضمنة الوزن والعيار والباركود، مع إيصالات حرارية 80mm.',
    tag: 'توافق كامل',
  },
  {
    icon: Boxes,
    title: 'جرد لحظي وتوزيع المخزن والفروع',
    desc: 'تتبع رصيد كل قطعة ووزنها بالجرام، وتوزيع المخزون على أكثر من فرع أو خزنة أو واجهة عرض داخل المحل بدقة تامة.',
    tag: 'حماية المخزون',
  },
  {
    icon: Users,
    title: 'دفتر حسابات الذهب للعملاء والورش',
    desc: 'إدارة ديون ومستحقات تجار الجملة وورش التصنيع والزبائن بالنقدية وجرامات الذهب (حساب ذهب ونقدية منفصلين ومطابقين).',
    tag: 'حسابات دقيقة',
  },
  {
    icon: TrendingUp,
    title: 'تقارير الأرباح وتقفيل اليومية والشفت',
    desc: 'تقرير شامل لنهاية كل شفت يشمل صافي المبيعات، حركات الخزينة، أوزان الذهب المباع والمشترى، مع إيصال إغلاق رسمي ومطابقة.',
    tag: 'رقابة مشددة',
  },
]

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-neutral-800 bg-[#0d0d10] text-white py-20 lg:py-28 relative overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute top-1/2 -right-40 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 -left-40 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs sm:text-sm font-semibold text-amber-300">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>مميزات صُممت خصيصاً لواقع تجارة الصاغة</span>
          </div>

          <h2 className="mt-5 text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
            كل ما تحتاجه لإدارة محلك الذهبي
            <span className="block mt-2 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              بأعلى درجات الدقة والأمان
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-300 leading-relaxed">
            تم بناء نظام جولد ماستر بالتعاون المباشر مع أصحاب محلات الصاغة والورش في مصر والخليج لحل جميع التعقيدات اليومية: من حساب المصنعية حتى تقفيل الشفت.
          </p>
        </div>

        {/* 3D Visual Feature Showcase Spotlight */}
        <div className="mt-14 mb-16 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-neutral-900/90 via-neutral-950 to-neutral-900 p-6 sm:p-10 shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-5">
              <span className="inline-block px-3 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                قوة الإدارة المتكاملة
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                وداعاً لخسائر المصنعية وحسابات الكسر المعقدة
              </h3>
              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
                في تجارة الذهب، كل جزء من المائة من الجرام له ثمن. يمنحك نظام جولد ماستر موازنة لحظية بين أوزان الذهب الحقيقية وأرصدة الخزينة، مع منع أي خطأ بشري أثناء احتساب سعر الجرام أو تبديل الذهب القديم بالجديد.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-500/20 text-amber-400 mt-0.5">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <p className="text-sm text-neutral-200 font-medium">
                    توليد فوري لباركود القطع مع حفظ صورة القطعة والعيار والوزن الدقيق.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-500/20 text-amber-400 mt-0.5">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <p className="text-sm text-neutral-200 font-medium">
                    تسجيل تلقائي لحركات الصرف والتوريد وتصفية ديون الزبائن والورش.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-500/20 text-amber-400 mt-0.5">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <p className="text-sm text-neutral-200 font-medium">
                    شاشات لمس تفاعلية لا تتطلب أي خبرة مسبقة في الحاسوب.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative group overflow-hidden rounded-2xl border border-amber-500/30 shadow-2xl">
                <img
                  src={goldBullionImg}
                  alt="3D Gold bullion bars and luxury diamond jewelry"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-4 right-4 left-4 p-4 rounded-xl bg-neutral-950/80 backdrop-blur-md border border-amber-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-neutral-400">إدارة المشغولات والسبائك</p>
                      <h4 className="text-sm font-bold text-amber-300">أرصدة عيارات 18 و 21 و 24 بدقة لحظية</h4>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded bg-amber-400 text-neutral-950">
                      دقة 100%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6 Feature Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coreFeatures.map((f) => (
            <div
              key={f.title}
              className="group relative rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:bg-neutral-900/90 hover:shadow-[0_10px_30px_rgba(245,158,11,0.15)]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-400 border border-amber-500/30 shadow-sm transition-transform group-hover:scale-110">
                  <f.icon className="h-6 w-6" />
                </div>
                <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                  {f.tag}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                {f.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-neutral-300">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
