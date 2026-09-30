import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from './auth-store'

const BRANCH = { totalCash: 100, totalDebts: 20, totalExpenses: 10, totalSales: 200, branchName: 'الفرع الرئيسي' }
const USER = { id: '1', userName: 'test', email: '', roles: ['Manager'] }

describe('auth store', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
    localStorage.clear()
  })

  it('has initial unauthenticated state', () => {
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
  })

  it('setAuth marks the session authenticated without storing any token', () => {
    useAuthStore.getState().setAuth(USER, BRANCH, 7)

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user?.userName).toBe('test')
    expect(state.branchDetails?.totalCash).toBe(100)
    expect(state.branchId).toBe(7)
    expect(state.selectedBranchId).toBe(7)
  })

  /**
   * انحدار: كان الخادم ينقل التوكنين إلى كوكيز HttpOnly ويزيلهما من جسم
   * الاستجابة، بينما الواجهة كانت تقرأ data.token undefined وتحفظه — فيصير
   * localStorage فيه النص الحرفي "undefined" ثم يُرسل كـ `Bearer undefined`
   * فيرفضه الخادم رغم صحة الكوكي ⇒ طرد المستخدم بعد أول 401.
   * التوكنات لا تُخزَّن في الواجهة إطلاقاً بعد هذا الإصلاح.
   */
  it('never writes a token into localStorage (guards the "undefined" regression)', () => {
    useAuthStore.getState().setAuth(USER, BRANCH, 7)

    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
    expect(JSON.stringify(localStorage)).not.toContain('undefined')
  })

  it('setSession restores identity and branch after a reload', () => {
    useAuthStore.getState().setSession(USER, BRANCH, 12)

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.branchId).toBe(12)
    expect(state.selectedBranchId).toBe(12)
  })

  it('clearAuth resets every field', () => {
    useAuthStore.getState().setAuth(USER, BRANCH, 7)
    useAuthStore.getState().clearAuth()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.branchDetails).toBeNull()
    expect(state.branchId).toBeNull()
    expect(state.selectedBranchId).toBeNull()
  })
})
