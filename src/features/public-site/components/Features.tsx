import {
  Tablet,
  Gauge,
  ShieldCheck,
  CloudRain,
  Languages,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

type Feature = {
  icon: LucideIcon
  title: string
  desc: string
}

const features: Feature[] = [
  {
    icon: Tablet,
    title: 'مصمم للتابلت',
    desc: 'واجهة واضحة وأزرار لمس كبيرة تتناسب مع شاشات التابلت 10 إنش، لتُؤدّي عملك بنقرة أو لمستين.',
  },
  {
    icon: Gauge,
    title: 'سرعات عالية',
    desc: 'فواتير سريعة وحركات لحظية، بدون تعقيد ولا انتظار، ليبقى تركيزك على زبائنك.',
  },
  {
    icon: ShieldCheck,
    title: 'صلاحيات دقيقة',
    desc: 'أدوار متعددة (مالك، مدير، بائع، مسؤول) مع تحكم كامل بصلاحيات كل مستخدم.',
  },
  {
    icon: CloudRain,
    title: 'سحابي وآمن',
    desc: 'بياناتك محفوظة على خوادم آمنة، مع تسجيل كامل للحركات ونسخ احتياطي.',
  },
  {
    icon: Languages,
    title: 'عربي كامل',
    desc: 'واجهة عربية من اليمين إلى اليسار بخط واضح وسهل القراءة، مع دعم إنجليزي.',
  },
  {
    icon: Sparkles,
    title: 'تقارير ذكية',
    desc: 'أرباح، مبيعات، مشتريات وخزينة — تقارير دقيقة تُظهر صحة محلك بلمحة واحدة.',
  },
]

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-black/5 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wide text-primary">
            المميزات
          </span>
          <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
            كل ما يحتاجه محلك الذهبي
          </h2>
          <p className="mt-3 text-foreground/70">
            أدوات مدرّبة على واقع محلات الذهب، بدءاً من إدارة القطع وصولاً إلى
            متابعة الأسعار والخزينة.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-[18px] border border-black/5 bg-[#fafafc] p-6 transition-colors hover:border-primary/40 hover:bg-[#f5f5f7]"
            >
              <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-primary text-white shadow-sm transition-transform group-hover:scale-105">
                <f.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-foreground">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
