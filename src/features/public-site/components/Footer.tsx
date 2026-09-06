import { Gem, Phone } from 'lucide-react'
import { SITE_PHONE_DISPLAY, TEL_LINK, WHATSAPP_LINK } from '@/shared/lib/seo'

const cols = [
  {
    title: 'المنتج',
    links: ['المميزات', 'أنظمة البرنامج', 'الاشتراكات', 'كيف يعمل'],
  },
  {
    title: 'الدعم',
    links: ['مركز المساعدة', 'دليل البدء', 'الأسئلة الشائعة', 'تواصل معنا'],
  },
]

export function Footer() {
  const scroll = (id: string) =>
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <footer className="border-t border-black/5 bg-[#0a0a0a] text-[#cccccc]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-2">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-white">
                <Gem className="h-5 w-5" />
              </span>
              <span className="text-xl font-bold text-white">جولد ماستر</span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#cccccc]">
              نظام ERP ذكي لإدارة محلات الذهب — مخزون، مبيعات، مشتريات، خزينة
              وتقارير، مصمم ليعمل بسلاسة على التابلت بقياس 10 إنش.
            </p>
            <a
              href={TEL_LINK}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/10"
            >
              <Phone className="size-4 text-primary" />
              {SITE_PHONE_DISPLAY}
            </a>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <h3 className="text-sm font-bold text-white">{c.title}</h3>
              <ul className="mt-3 space-y-2">
                {c.links.map((l) => (
                  <li key={l}>
                    <button
                      onClick={() =>
                        l === 'المميزات'
                          ? scroll('#features')
                          : l === 'أنظمة البرنامج'
                            ? scroll('#modules')
                            : l === 'الاشتراكات'
                              ? scroll('#pricing')
                              : l === 'كيف يعمل'
                                ? scroll('#how')
                                : scroll('#contact')
                      }
                      className="touch-target text-sm text-[#cccccc] transition-colors hover:text-white"
                    >
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-[#cccccc] sm:flex-row">
          <span>© 2026 جولد ماستر — جميع الحقوق محفوظة.</span>
          <span className="flex items-center gap-2">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-white transition-colors hover:text-primary"
            >
              تواصل عبر واتساب
            </a>
            <span>·</span>
            <a href={TEL_LINK} className="font-bold text-white transition-colors hover:text-primary">
              {SITE_PHONE_DISPLAY}
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
