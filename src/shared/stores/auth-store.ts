import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { BranchDetails } from '@/features/auth/types'

export interface User {
  id: string
  userName: string
  email: string
  roles: string[]
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  branchDetails: BranchDetails | null
  branchId: number | null
  selectedBranchId: number | null
  isAuthenticated: boolean
  setAuth: (
    user: User,
    accessToken: string,
    refreshToken: string,
    branchDetails: BranchDetails,
    branchId: number,
  ) => void
  setSelectedBranchId: (branchId: number | null) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      branchDetails: null,
      branchId: null,
      selectedBranchId: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken, branchDetails, branchId) => {
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)
        set({
          user,
          accessToken,
          refreshToken,
          branchDetails,
          branchId,
          selectedBranchId: branchId,
          isAuthenticated: true,
        })
      },
      setSelectedBranchId: (branchId) => set({ selectedBranchId: branchId }),
      clearAuth: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          branchDetails: null,
          branchId: null,
          selectedBranchId: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // فحص ذاتي: إن كانت الحالة المحفوظة تدّعي تسجيل الدخول
        // لكن لا يوجد أي توكن خام في localStorage (حالة فقدان تزامن حدثت
        // من تسجيل خروج سابق لم يُحدّث الحالة المحفوظة) تُعاد الحالة إلى
        // غير مسجّل حتى لا تفتح /app ثم تُطرد فوراً إلى /login.
        try {
          const persistedHasToken = !!state?.accessToken || !!state?.refreshToken
          const hasRawToken = !!localStorage.getItem('access_token')
          if (persistedHasToken && !hasRawToken) {
            useAuthStore.getState().clearAuth()
          }
        } catch {
          // تجاهل أي خطأ في القراءة
        }
      },
    },
  ),
)