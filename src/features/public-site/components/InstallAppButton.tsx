import { useState } from 'react'
import { Download, Smartphone } from 'lucide-react'
import { usePwaInstall } from '@/shared/hooks/usePwaInstall'

/**
 * زر تحميل/تثبيت البرنامج (PWA) على الكمبيوتر أو التابلت.
 * - تستخدم المطالبة الأصلية للمتصفح عند توفرها.
 * - على iOS وغير المدعومة تعرض تعليمات التثبيت اليدوي.
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