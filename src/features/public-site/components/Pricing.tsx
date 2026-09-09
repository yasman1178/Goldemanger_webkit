import { Check, Gem, Sparkles, MessageCircle } from 'lucide-react'
import { WHATSAPP_LINK } from '@/shared/lib/seo'

type Plan = {
  name: string
  price: string
  period: string
  desc: string
  features: string[]
  featured?: boolean
  badge?: string
}

const plans: Plan[] = [
  {
    name: 'باقة التجربة المجانية',
    price: '0 ج.م',
    period: 'لمدة 14 يوماً مجاناً',
    desc: 'جرّب النظام بالكامل بكامل ميزاته واكتشف كيف يسهل عملك اليومي.',
    features: [
      'واجهة كاشير لمس كاملة للتابلت 10 إنش',
      'إدارة المشغولات والمخزون والجرد',
      'المبيعات والمشتريات وحساب الكسر',
      'طباعة الباركود والإيصالات الحرارية',
      'دعم فني وتدريب مجاني على التثبيت',
    ],
  },
  {
    name: 'الباقة الاحترافية (الأكثر طلباً)',
    price: 'باقات مرنة',
    period: 'شهري أو سنوي ميسر',
    desc: 'الحل الشامل والمفضل لأصحاب محلات ومعارض الصاغة المستقلة.',
    features: [
      'كل ميزات باقة التجربة المجانية',
      'إدارة الخزينة ومطابقة الشفتات والإغلاق',
      'دفتر ديون العملاء والورش والموردين',
      'تحديثات أسعار الذهب التلقائية',
      'نسخ احتياطي سحابي مشفر يومياً',
      'دعم فني ذو أولوية 24/7 عبر واتساب',
    ],
    featured: true,
    badge: 'الأفضل قيمة',
  },
  {
    name: 'باقة السلاسل والمعارض الكبرى',
    price: 'حل مخصص',
    period: 'وفق حجم الفروع',
    desc: 'لشبكات المحلات المتعددة والفروع والورش الكبيرة ذات الحجم المرتفع.',
    features: [
      'فروع ومخازن وخزائن غير محدودة',
      'صلاحيات مستخدمين وأدوار مخصصة',
      'ربط شبكي مركزي بين جميع الفروع',
      'تقارير تحليلية ومقارنات فروع متقدمة',
      'مدير حساب خاص وتدريب شامل لطاقم العمل',
    ],
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 border-t border-neutral-800 bg-[#0a0a0c] text-white py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs sm:text-sm font-semibold text-amber-300">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>خيارات اشتراك واضحة بدون أي رسوم خفية</span>
          </div>

          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl text-white">
            اختر الخطة المناسبة لمحلك
          </h2>
          <p className="mt-3 text-neutral-300 text-sm sm:text-base">
            ابدأ بتجربة مجانية مدتها 14 يوماً مع كافة الميزات الفعالة، ثم اختر الباقة التي تلبي احتياجاتك.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-3 items-stretch">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col justify-between rounded-3xl p-7 transition-all duration-300 ${
                p.featured
                  ? 'border-2 border-amber-400 bg-gradient-to-b from-amber-500/15 via-neutral-900 to-neutral-950 shadow-[0_10px_40px_rgba(245,158,11,0.2)] lg:-translate-y-2'
                  : 'border border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
              }`}
            >
              {p.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-1 text-xs font-black text-neutral-950 shadow-md">
                  {p.badge}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">{p.name}</h3>
                  {p.featured && <Gem className="h-5 w-5 text-amber-400" />}
                </div>

                <p className="mt-2 text-xs sm:text-sm text-neutral-300">{p.desc}</p>

                <div className="mt-6 mb-6 pb-6 border-b border-neutral-800">
                  <span className="text-3xl font-black text-amber-300">{p.price}</span>
                  <span className="text-xs text-neutral-400 block mt-1">{p.period}</span>
                </div>

                <ul className="space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-200">
                      <Check className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4">
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`touch-target inline-flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition-all ${
                    p.featured
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-neutral-950 shadow-lg hover:brightness-110 active:scale-95'
                      : 'border border-neutral-700 bg-neutral-800/80 text-white hover:bg-neutral-800 hover:border-amber-400/40'
                  }`}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>تواصل لطلب الباقة</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
