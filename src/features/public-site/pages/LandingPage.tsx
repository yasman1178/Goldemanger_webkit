import { useEffect } from 'react'
import { Navbar } from '@/features/public-site/components/Navbar'
import { Hero } from '@/features/public-site/components/Hero'
import { Features } from '@/features/public-site/components/Features'
import { Modules } from '@/features/public-site/components/Modules'
import { HowItWorks } from '@/features/public-site/components/HowItWorks'
import { Pricing } from '@/features/public-site/components/Pricing'
import { Cta } from '@/features/public-site/components/Cta'
import { Footer } from '@/features/public-site/components/Footer'
import { resetPageMeta } from '@/shared/lib/seo'

export function LandingPage() {
  useEffect(() => {
    resetPageMeta()
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Modules />
        <HowItWorks />
        <Pricing />
        <Cta />
      </main>
      <Footer />
    </div>
  )
}
