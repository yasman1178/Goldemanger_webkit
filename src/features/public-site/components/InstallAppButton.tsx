import { useState } from 'react'
import { Download, Smartphone, CheckCircle2, Laptop } from 'lucide-react'
import { usePwaInstall } from '@/shared/hooks/usePwaInstall'

/**
 * زر تحميل/تثبيت البرنامج الأصلي
 */
export function InstallAppButton() {
  const { canPrompt, isIosDevice, isInstalled, install } = usePwaInstall()
  const [showHint, setShowHint] = useState(false)

  if (isInstalled) return null

  const handleClick = async () => {
    if (canPrompt) {
      await install()
      return
    }
    setShowHint(true)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        className="touch-target inline-flex items-center gap-2 rounded-full border-2 border-primary/30 bg-white/70 px-5 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/5"
      >
        {isIosDevice ? <Smartphone className="size-4" /> : <Download className="size-4" />}
        ثبّت البرنامج على جهازك
      </button>
      {showHint && !canPrompt && (
        <p className="max-w-xs text-center text-xs leading-relaxed text-foreground/60">
          {isIosDevice ? (
            <>
              على الآيفون/الآيباد: من متصفح سافاري اضغط{' '}
              <span className="font-bold">زر المشاركة ← إضافة إلى الشاشة الرئيسية</span>
            </>
          ) : (
            <>
              افتح الموقع من متصفح <span className="font-bold">كروم أو إيدج</span> ثم اضغط أيقونة
              التثبيت في شريط العنوان، أو استخدم زر «ثبّت» عند ظهوره.
            </>
          )}
        </p>
      )}
    </div>
  )
}

/**
 * مكون تحميل البرنامج المخصص للدرج والقائمة الجانبية (Slide Drawer / Sidebar)
 * وفق متطلبات design.md: متناسق تماماً مع مساحة القائمة ومريح للمس السريع.
 */
export function SidebarInstallButton({ collapsed = false }: { collapsed?: boolean }) {
  const { canPrompt, isIosDevice, isInstalled, install } = usePwaInstall()
  const [showHint, setShowHint] = useState(false)

  const handleClick = async () => {
    if (canPrompt) {
      await install()
      return
    }
    setShowHint((prev) => !prev)
  }

  if (isInstalled) {
    if (collapsed) {
      return (
        <div
          title="البرنامج مثبت"
          className="flex justify-center py-1 text-emerald-600"
        >
          <div className="flex size-9 items-center justify-center rounded-[12px] bg-emerald-50">
            <CheckCircle2 className="size-4" />
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 rounded-[12px] border border-emerald-500/20 bg-emerald-50/60 px-3 py-2 text-[12px] font-semibold text-emerald-700">
        <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
        <span className="truncate">البرنامج مثبت على هذا الجهاز</span>
      </div>
    )
  }

  if (collapsed) {
    return (
      <div className="flex justify-center py-1">
        <button
          type="button"
          onClick={handleClick}
          title="تحميل البرنامج وتثبيته على الجهاز"
          className="flex size-10 items-center justify-center rounded-[12px] bg-primary text-white shadow-sm transition-transform hover:scale-105 active:scale-95 touch-target"
        >
          {isIosDevice ? <Smartphone className="size-5" /> : <Download className="size-5" />}
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-[14px] border border-primary/20 bg-gradient-to-br from-primary/[0.08] to-primary/[0.02] p-3 transition-all hover:border-primary/30">
      <div className="flex items-start gap-2.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-primary text-white shadow-sm">
          {isIosDevice ? <Smartphone className="size-4" /> : <Download className="size-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-foreground leading-tight">
            تحميل البرنامج
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">
            تثبيت التطبيق على جهازك للعمل السريع
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleClick}
        className="mt-2.5 flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] bg-primary px-3 text-[12px] font-bold text-white shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] touch-target"
      >
        <Laptop className="size-3.5" />
        <span>تثبيت الآن</span>
      </button>

      {showHint && !canPrompt && (
        <div className="mt-2 rounded-lg bg-white/90 p-2 text-[10px] leading-relaxed text-foreground/75 border border-black/5">
          {isIosDevice ? (
            <span>من سفاري اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية».</span>
          ) : (
            <span>من شريط متصفح كروم اضغط على أيقونة التثبيت (⊕) أو القائمة ثم «تثبيت التطبيق».</span>
          )}
        </div>
      )}
    </div>
  )
}
