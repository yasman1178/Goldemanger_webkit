import { useState, useEffect } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { setJsonLd, removeJsonLd } from '@/shared/lib/seo'

interface FaqItem {
  q: string
  a: string
}

const faqs: FaqItem[] = [
  {
    q: 'هل يدعم نظام جولد ماستر العمل باللمس على أجهزة التابلت 10 إنش؟',
    a: 'نعم، تم تصميم وبرمجة واجهة نقطة البيع (POS) وإدارة المخزون من الأساس لتلائم شاشات التابلت 10 بوصة وأجهزة اللمس الحديثة. الأزرار كبيرة، والحركات سريعة ومرنة لتمكين البائع من خدمة الزبون في ثوانٍ.',
  },
  {
    q: 'كيف يتعامل النظام مع شراء كسر الذهب والمبادلات وحساب المصنعية؟',
    a: 'يحتوي جولد ماستر على محرك ذكي متخصص في كسر الذهب يقوم بتحويل أي وزن أو عيار (18، 21، 24) تلقائياً لمعادل عيار 21 الصافي وفق معادلات الصاغة المعتمدة، مع احتساب المصنعية وفارق التبديل في الفاتورة نفسها وتحديث أرصدة الخزينة والمخزون فورياً.',
  },
  {
    q: 'هل يدعم البرنامج طباعة باركود الذهب 35×10mm وإيصالات الكاشير الحرارية 80mm؟',
    a: 'نعم، يدعم النظام طباعة استيكرات ليبيل الذهب المقاومة للحرارة بالقياس القياسي 35×10 ملم مع الباركود وتفاصيل القطعة بدقة، بالإضافة لطباعة فواتير وإيصالات الكاشير الحرارية بمقاس 80 ملم وإيصالات استلام الذهب الكسر.',
  },
  {
    q: 'كيف يتم تقفيل شفت الكاشير وإغلاق اليومية؟',
    a: 'يوفر النظام ميزة إغلاق اليومية والشفتات، حيث يقوم بمطابقة النقدية الموجودة بالدرج مع المبيعات والمشتريات والمصروفات، وإصدار إيصال إغلاق رسمي يوضح حركة الذهب والسيولة والعجز أو الزيادة إن وجد.',
  },
  {
    q: 'هل يمكن إدارة أكثر من فرع أو مخزن لنفس المعرض؟',
    a: 'بالتأكيد، يدعم جولد ماستر تعدد الفروع وتعدد أماكن التخزين (فترينة العرض، الخزنة الرئيسية، ورشة الصيانة)، مع نقل المشغولات بين الفروع والأماكن ومتابعة أرصدة كل فرع لحظياً من أي مكان.',
  },
  {
    q: 'هل بياناتي وأسعار المشغولات مؤمنة ومحفوظة؟',
    a: 'البيانات مشفرة بأحدث بروتوكولات الأمان SSL 256-bit، مع نسخ احتياطي سحابي تلقائي لضمان عدم فقدان أي فاتورة أو حركة مخزون حتى في حال تلف جهاز التابلت أو انقطاع التيار.',
  },
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  // حقن Schema FAQPage في الـ head لدعم محركات بحث Google
  useEffect(() => {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.a,
        },
      })),
    }

    setJsonLd('faq-schema', faqSchema)
    return () => removeJsonLd('faq-schema')
  }, [])

  return (
    <section id="faq" className="scroll-mt-20 border-t border-neutral-800 bg-[#0a0a0c] text-white py-20 lg:py-24 relative">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs sm:text-sm font-semibold text-amber-300">
            <HelpCircle className="h-4 w-4 text-amber-400" />
            <span>إجابات على أكثر التساؤلات شيوعاً</span>
          </div>

          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
            الأسئلة الشائعة حول <span className="text-amber-400">جولد ماستر</span>
          </h2>
          <p className="mt-3 text-neutral-300 text-sm sm:text-base">
            كل ما تود معرفته عن توافق النظام مع محلك، الطابعات، وإدارة الذهب اليومية.
          </p>
        </div>

        <div className="mt-12 space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx
            return (
              <div
                key={faq.q}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full touch-target px-6 py-4 flex items-center justify-between text-right font-bold text-base sm:text-lg text-white hover:text-amber-300 transition-colors"
                >
                  <span className="flex-1 ms-2">{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-amber-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-sm sm:text-base leading-relaxed text-neutral-300 border-t border-neutral-800/60 bg-neutral-950/40">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
