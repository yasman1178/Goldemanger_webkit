import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from './auth-store'

describe('auth store', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
    localStorage.clear()
  })

  it('has initial unauthenticated state', () => {
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(localStorage.getItem('access_token')).toBeNull()
  })

  it('setAuth stores tokens and user', () => {
    useAuthStore
      .getState()
      .setAuth(
        { id: '1', userName: 'test', email: '', roles: ['Manager'] },
        'access',
        'refresh',
        { totalCash: 100, totalDebts: 20, totalExpenses: 10, totalSales: 200, branchName: 'الفرع الرئيسي' },
        7,
      )

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user?.userName).toBe('test')
    expect(state.branchDetails?.totalCash).toBe(100)
    expect(state.branchId).toBe(7)
    expect(localStorage.getItem('access_token')).toBe('access')
    expect(localStorage.getItem('refresh_token')).toBe('refresh')
  })

  it('clearAuth removes tokens', () => {
    useAuthStore
      .getState()
      .setAuth(
        { id: '1', userName: 'test', email: '', roles: ['Manager'] },
        'access',
        'refresh',
        { totalCash: 100, totalDebts: 0, totalExpenses: 0, totalSales: 0, branchName: 'الفرع الرئيسي' },
        7,
      )
    useAuthStore.getState().clearAuth()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.branchDetails).toBeNull()
    expect(localStorage.getItem('access_token')).toBeNull()
  })
})
