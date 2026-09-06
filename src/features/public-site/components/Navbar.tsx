import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Gem, Phone, LogIn } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { SITE_PHONE_DISPLAY, TEL_LINK } from '@/shared/lib/seo'

const navLinks = [
  { href: '#features', label: 'المميزات' },
  { href: '#modules', label: 'أنظمة البرنامج' },
  { href: '#how', label: 'كيف يعمل' },
  { href: '#pricing', label: 'الاشتراكات' },
  { href: '#contact', label: 'تواصل معنا' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)

  const scroll = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
    setOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a
          href="#"
          className="flex items-center gap-2"
          onClick={(e) => {
            e.preventDefault()
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-white">
            <Gem className="h-5 w-5" />
          </span>
          <span className="text-xl font-bold text-foreground">جولد ماستر</span>
        </a>

        <ul className="hidden items-center gap-7 md:flex">
          {navLinks.map((l) => (
            <li key={l.href}>
              <button
                onClick={() => scroll(l.href)}
                className="touch-target text-sm font-semibold text-foreground/80 transition-colors hover:text-primary"
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href={TEL_LINK}
            className="inline-flex touch-target items-center gap-2 rounded-full border border-black/10 bg-secondary/60 px-4 py-2 text-sm font-bold text-foreground transition-colors hover:text-primary"
          >
            <Phone className="size-4 text-primary" />
            {SITE_PHONE_DISPLAY}
          </a>
          <Link
            to="/login"
            className="inline-flex touch-target items-center gap-2 rounded-full border border-primary/40 px-5 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/5"
          >
            <LogIn className="size-4" />
            دخول
          </Link>
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault()
              scroll('#contact')
            }}
            className="touch-target rounded-full bg-primary px-5 font-bold text-white shadow-sm transition-colors hover:bg-primary/80"
          >
            اطلب النسخة
          </a>
        </div>

        <button
          className="grid h-11 w-11 place-items-center rounded-lg text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="القائمة"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      <div
        className={cn(
          'grid overflow-hidden transition-all duration-300 md:hidden',
          open ? 'grid-rows-[1fr] border-t border-black/5' : 'grid-rows-[0fr]',
        )}
      >
        <ul className="min-h-0 flex flex-col bg-white px-4 py-2">
          {navLinks.map((l) => (
            <li key={l.href}>
              <button
                onClick={() => scroll(l.href)}
                className="w-full touch-target text-start text-base font-semibold text-foreground/90"
              >
                {l.label}
              </button>
            </li>
          ))}
          <li className="py-3">
            <Link
              to="/login"
              className="block touch-target rounded-full border border-primary/40 px-5 py-2 text-center font-bold text-primary"
            >
              دخول
            </Link>
          </li>
          <li className="py-3">
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault()
                scroll('#contact')
              }}
              className="block touch-target rounded-full bg-primary px-5 text-center font-bold text-white"
            >
              اطلب النسخة
            </a>
          </li>
        </ul>
      </div>
    </header>
  )
}
