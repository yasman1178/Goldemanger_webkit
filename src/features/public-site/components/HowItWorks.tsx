import { UserPlus, Package, ShoppingCart, TrendingUp } from 'lucide-react'

const steps = [
  {
    icon: UserPlus,
    step: '1',
    title: 'أنشئ حسابك',
    desc: 'سجّل كمالك أو مدير، وحدّد فروع الشركة من لوحة برنامج بسيطة.',
  },
  {
    icon: Package,
    step: '2',
    title: 'أضف منتجاتك',
    desc: 'سجّل القطع مع الصور والكارات والنوع، ورتّبها في أماكن التخزين.',
  },
  {
    icon: ShoppingCart,
    step: '3',
    title: 'بِع بنقرة',
    desc: 'أنشئ الفاتورة بسرعة، ويتحدّث الجرد والخزينة تلقائياً.',
  },
  {
    icon: TrendingUp,
    step: '4',
    title: 'تابع واقرأ',
    desc: 'راقب الأرباح والمبيعات وأسعار الذهب من تقارير دقيقة وفورية.',
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-t border-black/5 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wide text-primary">
            كيف يعمل
          </span>
          <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
            أربع خطوات تفصلك عن إدارة أسهل
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.step} className="relative flex flex-col items-center text-center">
              <div className="relative grid h-16 w-16 place-items-center rounded-full bg-primary text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)]">
                <s.icon className="h-7 w-7" />
                <span className="absolute -top-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-foreground text-xs font-bold text-white">
                  {s.step}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-foreground">
                {s.title}
              </h3>
              <p className="mt-2 max-w-[220px] text-sm text-foreground/65">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
