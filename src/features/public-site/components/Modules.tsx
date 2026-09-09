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
  ScrollText,
  Sparkles,
} from 'lucide-react'

type Module = {
  icon: LucideIcon
  title: string
  desc: string
}

const modules: Module[] = [
  {
    icon: Package,
    title: 'المنتجات والمشغولات',
    desc: 'قطع جديدة، مجددة، كسر وفضة مع إدارة الصور والأوزان والعيارات بدقة.',
  },
  {
    icon: ReceiptText,
    title: 'نقطة البيع (POS)',
    desc: 'إنشاء فواتير لمس متعددة البنود بسرعة مع تحديث الخزينة والمخزن تلقائياً.',
  },
  {
    icon: Truck,
    title: 'المشتريات والكسر',
    desc: 'فواتير شراء محكمة مرتبطة بأسعار الذهب اللحظية ومعادل عيار 21 الصافي.',
  },
  {
    icon: Wallet,
    title: 'الخزينة والشفتات',
    desc: 'حركات نقدية كاملة، تقفيل اليومية، وتفصيل كل وارد وصادر بالدرج.',
  },
  {
    icon: Coins,
    title: 'المصروفات التشغيلية',
    desc: 'حصر مصروفات المحل والورش بدقة وتوزيعها على الفترات الزمنية.',
  },
  {
    icon: Users,
    title: 'العملاء والورش',
    desc: 'سجل شامل للتعاملات مع ديون كل طرف ومتابعتها نقداً أو بجرامات الذهب.',
  },
  {
    icon: Boxes,
    title: 'الجرد بالباركود',
    desc: 'أرصدة القطع بالجرامات في أماكن التخزين وطباعة استيكرات 35×10mm.',
  },
  {
    icon: MapPin,
    title: 'أماكن التخزين',
    desc: 'تنظيم القطع بين فترينات العرض، الخزائن الرئيسية، وورش الصيانة.',
  },
  {
    icon: TrendingUp,
    title: 'أسعار الذهب اللحظية',
    desc: 'تحديث أسعار عيارات 18 و 21 و 24 ومتابعة تغيّراتها ومصنعياتها.',
  },
  {
    icon: Handshake,
    title: 'دفتر الديون والأقساط',
    desc: 'متابعة مديونيات الزبائن والموردين وسندات القبض والصرف الرسمية.',
  },
  {
    icon: Building2,
    title: 'الشركات والفروع',
    desc: 'ربط وإدارة فروع متعددة للمحل من لوحة تحكم سحابية موحدة.',
  },
  {
    icon: ScrollText,
    title: 'التقارير والأرباح',
    desc: 'كشوفات أرباح المصنعية، حركة المبيعات، ومطابقة حركة الذهب اليومية.',
  },
]

export function Modules() {
  return (
    <section id="modules" className="scroll-mt-20 border-t border-neutral-800 bg-[#0a0a0d] text-white py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs sm:text-sm font-semibold text-amber-300">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>نظام برمجي متكامل ومترابط</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl text-white">
            12 نظاماً متكاملاً لإدارة كل زاوية في محلك
          </h2>
          <p className="mt-3 text-neutral-300 text-sm sm:text-base">
            كل وحدة مصممة لتتصل بسلاسة مع باقي الوحدات، بدون الحاجة لإعادة إدخال أي بيان يدوياً.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((m) => (
            <div
              key={m.title}
              className="group flex flex-col gap-2 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 transition-all duration-300 hover:border-amber-500/40 hover:bg-neutral-900 hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
                  <m.icon className="h-5 w-5" />
                </div>
              </div>
              <h3 className="mt-2 text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                {m.title}
              </h3>
              <p className="text-xs leading-relaxed text-neutral-300">
                {m.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
