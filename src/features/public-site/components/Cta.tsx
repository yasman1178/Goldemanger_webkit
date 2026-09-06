import { Tablet, MessageCircle, Phone } from 'lucide-react'
import { SITE_PHONE_DISPLAY, TEL_LINK, WHATSAPP_LINK } from '@/shared/lib/seo'

export function Cta() {
  return (
    <section id="contact" className="scroll-mt-20 border-t border-black/5 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="relative overflow-hidden rounded-[24px] bg-primary p-8 text-center shadow-[0_4px_12px_rgba(37,99,235,0.2)] sm:p-12">
          <div className="pointer-events-none absolute -top-10 -left-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-black/20 blur-2xl" />

          <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold text-white">
            <Tablet className="h-4 w-4" />
            جاهز لتجربته على تابلتك الآن
          </span>
          <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
            حوّل إدارة محلك الذهبي إلى تجربة سهلة
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/90">
            تحدّث معنا لتجربة مجانية كاملة، أو اطرح أسئلتك — فريقنا جاهز لمساعدتك
            في كل خطوة.
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-8 py-4 font-bold text-primary shadow-lg transition-transform hover:-translate-y-0.5 sm:w-auto"
            >
              <MessageCircle className="h-5 w-5" />
              تواصل عبر الواتساب
            </a>
            <a
              href={TEL_LINK}
              className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-white/40 px-8 py-4 font-bold text-white transition-colors hover:bg-white/10 sm:w-auto"
            >
              <Phone className="h-5 w-5" />
              اتصل: {SITE_PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
