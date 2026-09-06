import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Language = 'ar' | 'en'

interface LanguageState {
  language: Language
  dir: 'rtl' | 'ltr'
  setLanguage: (lang: Language) => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'ar',
      dir: 'rtl',
      setLanguage: (lang) => {
        const dir = lang === 'ar' ? 'rtl' : 'ltr'
        document.documentElement.dir = dir
        document.documentElement.lang = lang
        set({ language: lang, dir })
      },
    }),
    {
      name: 'language-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.dir = state.dir
          document.documentElement.lang = state.language
        }
      },
    },
  ),
)
