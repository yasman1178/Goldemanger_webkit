import { Check, Gem } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

type Plan = {
  name: string
  price: string
  period: string
  desc: string
  features: string[]
  featured?: boolean
}

const plans: Plan[] = [
  {
    name: 'الأساسية',
    price: 'مجاناً',
    period: 'لمدة 14 يوم تجريبي',
    desc: 'جرّب النظام بالكامل بدون أي التزام.',
    features: [
      'لوحة تحكم شاملة',
      'إدارة المنتجات والجرد',
      'المبيعات والمشتريات',
      'دعم فني عبر الدردشة',
    ],
  },
  {
    name: 'الاحترافية',
    price: 'اشترك عند الطلب',
    period: 'باقات مرنة',
    desc: 'النظام الكامل لمحل ذهبي واحد أو أكثر.',
    features: [
      'كل ميزات الأساسية',
      'الخزينة والمصروفات والديون',
      'الشركات والفروع المتعددة',
      'التقارير والتصدير',
      'تحديثات أسعار الذهب لحظياً',
      'دعم فني ذات أولوية',
    ],
    featured: true,
  },
  {
    name: 'المؤسسات',
    price: 'حل مخصص',
    period: 'اتصل بنا',
    desc: 'لمجموعات المحلات والشبكات الكبيرة.',
    features: [
      'كل ميزات الاحترافية',
      'مستخدمون وأدوار متقدمة',
      'تكامل مخصص مع أنظمتك',
      'تدريب فريقك على النظام',
    ],
  },
]

export function Pricing() {
  return (
    <section
      id="pricing"
      className="scroll-mt-20 border-t border-black/5 bg-[#f5f5f7]"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wide text-primary">
            الاشتراكات
          </span>
          <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
            باقات تناسب كل محل
          </h2>
          <p className="mt-3 text-foreground/70">
            ابدأ ببساطة وارتقِ بحجم عملك متى شئت.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={cn(
                'relative flex flex-col rounded-[24px] border bg-white p-6',
                p.featured
                  ? 'border-primary shadow-[0_4px_12px_rgba(37,99,235,0.15)] ring-2 ring-primary'
                  : 'border-black/10',
              )}
            >
              {p.featured && (
                <span className="absolute -top-3 right-6 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
                  <Gem className="h-3 w-3" />
                  الأكثر طلباً
                </span>
              )}
              <h3 className="text-lg font-bold text-foreground">{p.name}</h3>
              <p className="mt-1 text-sm text-foreground/60">{p.desc}</p>
              <div className="mt-4">
                <span className="text-2xl font-bold text-foreground">
                  {p.price}
                </span>
                <span className="block text-xs text-foreground/60">
                  {p.period}
                </span>
              </div>
              <ul className="mt-5 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>
              <button
                className={cn(
                  'mt-6 touch-target w-full rounded-full py-3 font-bold transition-colors',
                  p.featured
                    ? 'bg-primary text-white hover:bg-primary/80'
                    : 'border-2 border-primary bg-white text-primary hover:bg-primary/5',
                )}
              >
                اطلب الآن
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
