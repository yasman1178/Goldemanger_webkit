import { UserPlus, Package, ShoppingCart, TrendingUp, Sparkles } from 'lucide-react'

const steps = [
  {
    icon: UserPlus,
    step: '01',
    title: 'أنشئ حساب محلك وفروعك',
    desc: 'سجّل حسابك وحدّد فروع المعرض، خزائن الحفظ، والمستخدمين بصلاحياتهم خلال دقيقتين.',
  },
  {
    icon: Package,
    step: '02',
    title: 'سجّل المشغولات واطبع الباركود',
    desc: 'أدخل القطع بأوزانها وعياراتها، واطبع استيكرات الباركود 35×10mm بضغطة زر واحدة.',
  },
  {
    icon: ShoppingCart,
    step: '03',
    title: 'بِع باللمس وسجّل الكسر',
    desc: 'مسح الباركود بالكاميرا أو القارئ، احتساب المصنعية وفارق الكسر، وطباعة إيصال الفاتورة.',
  },
  {
    icon: TrendingUp,
    step: '04',
    title: 'قفل اليومية وتابع أرباحك',
    desc: 'إصدار تقرير إغلاق الشفت، مطابقة النقدية مع الذهب الفعلي، ومراقبة مؤشرات الأرباح اليومية.',
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-t border-neutral-800 bg-[#0d0d11] text-white py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs sm:text-sm font-semibold text-amber-300">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>انطلاقة سريعة بدون أي تعقيد</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl text-white">
            4 خطوات بسيطة لتنظيم محلك الذهبي
          </h2>
          <p className="mt-3 text-neutral-300 text-sm sm:text-base">
            تم تصميم تجربة الاستخدام لتكون واضحة وفورية للبائعين وأصحاب المعارض دون الحاجة لتدريب معقد.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div
              key={s.step}
              className="relative flex flex-col items-center text-center rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 backdrop-blur-sm transition-all hover:border-amber-500/40"
            >
              <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-400 border border-amber-500/30 shadow-[0_4px_16px_rgba(245,158,11,0.2)]">
                <s.icon className="h-7 w-7" />
                <span className="absolute -top-2 -right-2 grid h-7 w-7 place-items-center rounded-full border border-amber-400/60 bg-amber-500 text-xs font-black text-neutral-950 shadow-md">
                  {s.step}
                </span>
              </div>
              <h3 className="mt-5 text-base font-bold text-white">
                {s.title}
              </h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-neutral-300">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
