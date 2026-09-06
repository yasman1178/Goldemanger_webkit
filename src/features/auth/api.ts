import api from '@/shared/lib/api'
import type { LoginRequest, LoginResponse } from './types'

export async function loginRequest(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/api/Auth/login', payload)
  return data
}

export async function changeMyPassword(payload: {
  currentPassword: string
  newPassword: string
}): Promise<{ message?: string }> {
  const { data } = await api.put<{ message?: string }>('/api/Auth/changeMyPassword', payload)
  return data
}
