import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Gem, LogIn, Sparkles, MessageCircle } from 'lucide-react'
import { WHATSAPP_LINK } from '@/shared/lib/seo'

const navLinks = [
  { href: '#features', label: 'المميزات' },
  { href: '#modules', label: 'الأنظمة والوحدات' },
  { href: '#how', label: 'كيف يعمل' },
  { href: '#pricing', label: 'الاشتراكات' },
  { href: '#faq', label: 'الأسئلة الشائعة' },
  { href: '#contact', label: 'تواصل معنا' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)

  const scroll = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
    setOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800/80 bg-neutral-950/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <a
          href="#"
          className="flex items-center gap-2.5 group"
          onClick={(e) => {
            e.preventDefault()
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-neutral-950 shadow-[0_2px_12px_rgba(245,158,11,0.35)] transition-transform group-hover:scale-105">
            <Gem className="h-5 w-5 fill-neutral-950" />
          </span>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              جولد ماستر
              <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                ERP
              </span>
            </span>
            <span className="text-[10px] text-neutral-400 font-medium">نظام إدارة محلات الذهب الذكي</span>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <ul className="hidden items-center gap-6 lg:flex">
          {navLinks.map((l) => (
            <li key={l.href}>
              <button
                onClick={() => scroll(l.href)}
                className="touch-target text-sm font-semibold text-neutral-300 transition-colors hover:text-amber-400 cursor-pointer"
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Action Controls */}
        <div className="hidden items-center gap-3 md:flex">
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex touch-target items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1.5 text-xs font-bold text-emerald-400 transition-colors hover:bg-emerald-950/70"
          >
            <MessageCircle className="size-3.5" />
            واتساب
          </a>

          <Link
            to="/login"
            className="inline-flex touch-target items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-bold text-amber-300 transition-all hover:bg-amber-400/20 hover:border-amber-400"
          >
            <LogIn className="size-4" />
            دخول النظام
          </Link>

          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2 text-sm font-bold text-neutral-950 shadow-md transition-all hover:brightness-110 active:scale-95"
          >
            <Sparkles className="size-3.5" />
            تجربة مجانية
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="touch-target inline-flex items-center justify-center rounded-xl p-2 text-neutral-300 hover:bg-neutral-800 md:hidden"
          aria-label="القائمة الرئيسية"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      {open && (
        <div className="border-t border-neutral-800 bg-neutral-950 px-4 py-6 md:hidden">
          <ul className="flex flex-col gap-3">
            {navLinks.map((l) => (
              <li key={l.href}>
                <button
                  onClick={() => scroll(l.href)}
                  className="touch-target w-full text-right text-base font-bold text-neutral-200 py-2 hover:text-amber-400"
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-3 pt-4 border-t border-neutral-800">
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="inline-flex touch-target w-full items-center justify-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 py-3 text-sm font-bold text-amber-300"
            >
              <LogIn className="size-4" />
              تسجيل الدخول للنظام
            </Link>

            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex touch-target w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-sm font-bold text-neutral-950"
            >
              <MessageCircle className="size-4" />
              تواصل عبر واتساب
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
