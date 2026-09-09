import { MessageCircle, Phone, Sparkles } from 'lucide-react'
import { SITE_PHONE_DISPLAY, TEL_LINK, WHATSAPP_LINK } from '@/shared/lib/seo'

export function Cta() {
  return (
    <section id="contact" className="scroll-mt-20 border-t border-neutral-800 bg-[#0d0d10] text-white py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-950/70 via-neutral-950 to-neutral-900 p-8 sm:p-14 text-center shadow-[0_20px_50px_rgba(245,158,11,0.2)]">
          {/* Decorative ambient glows */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-yellow-500/20 blur-3xl" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1.5 text-xs sm:text-sm font-bold text-amber-300">
              <Sparkles className="h-4 w-4 text-amber-400" />
              جاهز لتجربته على تابلتك الآن
            </span>

            <h2 className="mt-5 text-3xl font-black text-white sm:text-4xl lg:text-5xl leading-tight">
              ابدأ نقلة نوعية في إدارة <span className="bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">محلك الذهبي</span> اليوم
            </h2>

            <p className="mt-4 text-sm sm:text-base text-neutral-300 leading-relaxed">
              فريقنا المتخصص في برمجيات الصاغة جاهز لتركيب النظام وتدريب فريقك وربط طابعات الباركود والإيصالات خلال دقائق معدودة.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="touch-target inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 px-8 py-4 text-base font-extrabold text-neutral-950 shadow-[0_4px_20px_rgba(245,158,11,0.4)] transition-all hover:scale-105 active:scale-95"
              >
                <MessageCircle className="h-5 w-5 fill-neutral-950" />
                <span>تواصل عبر واتساب مباشرة</span>
              </a>

              <a
                href={TEL_LINK}
                className="touch-target inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-neutral-700 bg-neutral-900/80 px-8 py-4 text-base font-bold text-white transition-colors hover:border-amber-400/50 hover:bg-neutral-800"
              >
                <Phone className="h-5 w-5 text-amber-400" />
                <span>اتصل بنا: {SITE_PHONE_DISPLAY}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
