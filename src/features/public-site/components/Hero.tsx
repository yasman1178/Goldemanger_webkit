import { Gem, ArrowDown } from 'lucide-react'
import {
  LayoutDashboard,
  Package,
  ReceiptText,
  Wallet,
  TrendingUp,
} from 'lucide-react'

const statCards = [
  {
    icon: LayoutDashboard,
    title: 'لوحة تحكم',
    desc: 'ملخص اليوم وأسعار الذهب مباشرة',
  },
  {
    icon: Package,
    title: 'مخزون',
    desc: 'أرصدة المنتجات بدقة لحظية',
  },
  {
    icon: ReceiptText,
    title: 'مبيعات',
    desc: 'فواتير سريعة متعددة البنود',
  },
  {
    icon: Wallet,
    title: 'خزينة',
    desc: 'حركات نقدية وتقارير شاملة',
  },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.12),transparent_60%)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex touch-target items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-bold text-primary">
            <TrendingUp className="h-4 w-4" />
            لأجهزة التابلت 10 إنش — يعمل باللمس
          </span>
          <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
            نظامك الذكي لإدارة
            <span className="block text-primary">محلك الذهبي</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-foreground/70 sm:text-lg">
            جولد ماستر نظام ERP متكامل يدير مخزونك ومبيعاتك ومشترياتك وخزينتك
            وأسعار الذهب في مكان واحد، مصمم بعناية ليركض بسلاسة على تابلتك بقياس
            10 إنش.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={() =>
                document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="touch-target w-full rounded-full bg-primary px-8 py-4 text-lg font-bold text-white shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 hover:bg-primary/80 sm:w-auto"
            >
              <span className="inline-flex items-center gap-2">
                <Gem className="h-5 w-5" />
                ابدأ الآن مجاناً
              </span>
            </button>
            <button
              onClick={() =>
                document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary bg-white/60 px-8 py-4 text-lg font-bold text-primary transition-colors hover:bg-primary/5 sm:w-auto"
            >
              <ArrowDown className="h-5 w-5" />
              شاهد المميزات
            </button>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center">
          <div className="flex items-center justify-center gap-4">
            <div className="rounded-[24px] border border-black/10 border-b-8 bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.08)] sm:p-6">
              <div className="mb-4 flex items-center justify-between border-b border-black/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-white">
                    <Gem className="h-4 w-4" />
                  </span>
                  <span className="font-bold text-foreground">جولد ماستر</span>
                </div>
                <span className="text-xs font-bold text-primary">اليوم</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {statCards.map((c) => (
                  <div
                    key={c.title}
                    className="flex flex-col gap-1 rounded-[14px] border border-black/5 bg-[#fafafc] p-3"
                  >
                    <c.icon className="h-5 w-5 text-primary" />
                    <span className="text-sm font-bold text-foreground">
                      {c.title}
                    </span>
                    <span className="text-xs text-foreground/60">{c.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
