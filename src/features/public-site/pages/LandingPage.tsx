import { useEffect } from 'react'
import { Navbar } from '@/features/public-site/components/Navbar'
import { Hero } from '@/features/public-site/components/Hero'
import { SaghaPricesSection } from '@/features/public-site/components/SaghaPricesSection'
import { Features } from '@/features/public-site/components/Features'
import { Modules } from '@/features/public-site/components/Modules'
import { HowItWorks } from '@/features/public-site/components/HowItWorks'
import { Pricing } from '@/features/public-site/components/Pricing'
import { FaqSection } from '@/features/public-site/components/FaqSection'
import { Cta } from '@/features/public-site/components/Cta'
import { Footer } from '@/features/public-site/components/Footer'
import { resetPageMeta } from '@/shared/lib/seo'

export function LandingPage() {
  useEffect(() => {
    resetPageMeta()
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-neutral-100 font-sans selection:bg-amber-500 selection:text-neutral-950">
      <Navbar />
      <main>
        <Hero />
        <SaghaPricesSection />
        <Features />
        <Modules />
        <HowItWorks />
        <Pricing />
        <FaqSection />
        <Cta />
      </main>
      <Footer />
    </div>
  )
}

