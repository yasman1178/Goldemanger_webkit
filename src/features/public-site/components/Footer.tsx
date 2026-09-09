import { Gem, Phone, MessageCircle } from 'lucide-react'
import { SITE_PHONE_DISPLAY, TEL_LINK, WHATSAPP_LINK } from '@/shared/lib/seo'

export function Footer() {
  const scroll = (id: string) =>
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <footer className="border-t border-neutral-800 bg-[#070709] text-neutral-400">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 shadow-md">
                <Gem className="h-5 w-5 fill-neutral-950" />
              </span>
              <span className="text-xl font-black text-white">جولد ماستر ERP</span>
            </div>

            <p className="text-sm leading-relaxed text-neutral-400 max-w-sm">
              النظام السحابي الأذكى لإدارة محلات ومعارض الذهب والصاغة. حساب كسر ومصنعية الذهب، فواتير اللمس، جرد المخزون، وطباعة الباركود على أجهزة التابلت 10 إنش.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-4 py-2 text-xs font-bold text-emerald-400 transition-colors hover:bg-emerald-950/70"
              >
                <MessageCircle className="size-3.5" />
                واتساب المبيعات والدعم
              </a>
              <a
                href={TEL_LINK}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-700 px-4 py-2 text-xs font-bold text-neutral-300 transition-colors hover:border-amber-400/50 hover:text-white"
              >
                <Phone className="size-3.5 text-amber-400" />
                {SITE_PHONE_DISPLAY}
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">أنظمة البرنامج</h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button onClick={() => scroll('#features')} className="hover:text-amber-300 transition-colors cursor-pointer">
                  واجهة كاشير التابلت 10 إنش
                </button>
              </li>
              <li>
                <button onClick={() => scroll('#features')} className="hover:text-amber-300 transition-colors cursor-pointer">
                  حساب كسر الذهب والمصنعية
                </button>
              </li>
              <li>
                <button onClick={() => scroll('#modules')} className="hover:text-amber-300 transition-colors cursor-pointer">
                  طباعة الباركود والإيصالات الحرارية
                </button>
              </li>
              <li>
                <button onClick={() => scroll('#modules')} className="hover:text-amber-300 transition-colors cursor-pointer">
                  إغلاق الشفت ومطابقة الخزينة
                </button>
              </li>
            </ul>
          </div>

          {/* Support & SEO Links */}
          <div className="md:col-span-4 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">الدعم والمعلومات</h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button onClick={() => scroll('#faq')} className="hover:text-amber-300 transition-colors cursor-pointer">
                  الأسئلة الشائعة حول النظام
                </button>
              </li>
              <li>
                <button onClick={() => scroll('#how')} className="hover:text-amber-300 transition-colors cursor-pointer">
                  دليل البدء والتشغيل
                </button>
              </li>
              <li>
                <button onClick={() => scroll('#pricing')} className="hover:text-amber-300 transition-colors cursor-pointer">
                  خطط وباقات الاشتراك
                </button>
              </li>
              <li>
                <button onClick={() => scroll('#contact')} className="hover:text-amber-300 transition-colors cursor-pointer">
                  طلب عرض توضيحي وتدريب مجاني
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-4">
          <p>© {new Date().getFullYear()} جولد ماستر (Gold Master ERP). جميع الحقوق محفوظة لتجار ومصنعي الذهب والمجوهرات.</p>
          <div className="flex items-center gap-4">
            <span>مصمم خصيصاً لأجهزة التابلت 10"</span>
            <span>•</span>
            <span className="text-amber-400/90 font-medium">سحابي وآمن 100%</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
