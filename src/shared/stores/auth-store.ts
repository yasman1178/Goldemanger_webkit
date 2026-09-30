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
  branchDetails: BranchDetails | null
  branchId: number | null
  selectedBranchId: number | null
  isAuthenticated: boolean
  setAuth: (
    user: User,
    branchDetails: BranchDetails,
    branchId: number,
  ) => void
  setSession: (
    user: User,
    branchDetails: BranchDetails,
    branchId: number,
  ) => void
  setSelectedBranchId: (branchId: number | null) => void
  clearAuth: () => void
}

/**
 * لا `accessToken`/`refreshToken` في الحالة ولا في localStorage: التوكنات في
 * كوكيز HttpOnly لا تصل الجافاسكربت. ما يُحفظ هنا هو هوية المستخدم وأرقام
 * الفروع فقط (ليعرف التطبيق أي فرع يعرض)، وحيوية الجلسة يتحقق منها الخادم
 * عبر POST /api/Auth/verifyToken عند الإقلاع — انظر restoreSession في
 * features/auth/api.ts.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      branchDetails: null,
      branchId: null,
      selectedBranchId: null,
      isAuthenticated: false,
      setAuth: (user, branchDetails, branchId) =>
        set({
          user,
          branchDetails,
          branchId,
          selectedBranchId: branchId,
          isAuthenticated: true,
        }),
      // نفس setAuth: استعادة الجلسة بعد إعادة التحميل تمر بنفس المسار حتى
      // لا يتفرّع السلوك بين دخول جديد واستعادة قديمة.
      setSession: (user, branchDetails, branchId) =>
        set({
          user,
          branchDetails,
          branchId,
          selectedBranchId: branchId,
          isAuthenticated: true,
        }),
      setSelectedBranchId: (branchId) => set({ selectedBranchId: branchId }),
      clearAuth: () =>
        set({
          user: null,
          branchDetails: null,
          branchId: null,
          selectedBranchId: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // لا فحص ذاتي هنا: الكوكي HttpOnly غير مرئي من localStorage بال design،
      // فأي فحص لـ localStorage كان يمسح جلسة سليمة عند كل إعادة تحميل.
      // التحقق الحقيقي يحدث عبر verifyToken بعد استعادة الحالة.
    },
  ),
)
