import type { LucideIcon } from 'lucide-react'
import {
  Package,
  ReceiptText,
  Truck,
  Wallet,
  Coins,
  Users,
  Boxes,
  MapPin,
  TrendingUp,
  Handshake,
  Building2,
  UserCog,
  ScrollText,
} from 'lucide-react'

type Module = {
  icon: LucideIcon
  title: string
  desc: string
}

const modules: Module[] = [
  {
    icon: Package,
    title: 'المنتجات',
    desc: 'قطع جديدة، مجددة، كسر وفضة مع إدارة الصور والكارات والأنواع.',
  },
  {
    icon: ReceiptText,
    title: 'المبيعات',
    desc: 'إنشاء فواتير متعددة البنود بسرعة مع تحديث الخزينة تلقائياً.',
  },
  {
    icon: Truck,
    title: 'المشتريات',
    desc: 'فواتير شراء محكمة مرتبطة بأسعار الذهب المحدّثة لحظياً.',
  },
  {
    icon: Wallet,
    title: 'الخزينة',
    desc: 'حركات نقدية كاملة وتقرير مفصّل عن كل وارد وصادر.',
  },
  {
    icon: Coins,
    title: 'المصروفات',
    desc: 'حصر مصروفات المحل بدقة وتوزيعها على الفترة الصحيحة.',
  },
  {
    icon: Users,
    title: 'العملاء والموردون',
    desc: 'سجل شامل للتعاملات مع ديون كل طرف ومتابعتها.',
  },
  {
    icon: Boxes,
    title: 'الجرد',
    desc: 'أرصدة المنتجات في أماكن التخزين بدقة لحظية.',
  },
  {
    icon: MapPin,
    title: 'أماكن التخزين',
    desc: 'تنظيم القطع في مواقع متعددة داخل المحل أو الفروع.',
  },
  {
    icon: TrendingUp,
    title: 'أسعار الذهب',
    desc: 'تحديث أسعار الذهب ومتابعة تغيّراتها عبر الزمن.',
  },
  {
    icon: Handshake,
    title: 'الديون',
    desc: 'متابعة المديونية للعملاء والموردين وتحصيلها بسهولة.',
  },
  {
    icon: Building2,
    title: 'الشركات والفروع',
    desc: 'إدارة أكثر من فرع وشركة من نظام مركزي واحد.',
  },
  {
    icon: UserCog,
    title: 'المستخدمون والأدوار',
    desc: 'إدارة الموظفين وصلاحياتهم وأدوارهم داخل النظام.',
  },
  {
    icon: ScrollText,
    title: 'التقارير',
    desc: 'مبيعات، مشتريات، خزينة وأرباح — تقارير دقيقة قابلة للتصدير.',
  },
  {
    icon: TrendingUp,
    title: 'أسعار وتحديثات',
    desc: 'مركز لأسعار الذهب وأي تحديثات على المنتجات.',
  },
]

export function Modules() {
  return (
    <section
      id="modules"
      className="scroll-mt-20 border-t border-black/5 bg-[#f5f5f7]"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wide text-primary">
            أنظمة البرنامج
          </span>
          <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
            نظام متكامل لكل أركان محلك
          </h2>
          <p className="mt-3 text-foreground/70">
            وحدات مترابطة تعمل معاً بسلاسة لتغطي إدارة المحل من الألف إلى الياء.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {modules.map((m) => (
            <div
              key={m.title}
              className="flex flex-col gap-2 rounded-[18px] border border-black/5 bg-white p-4 transition-shadow hover:shadow-md"
            >
              <m.icon className="h-6 w-6 text-primary" />
              <h3 className="text-sm font-bold text-foreground">{m.title}</h3>
              <p className="text-xs leading-relaxed text-foreground/60">
                {m.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
