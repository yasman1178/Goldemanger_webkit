import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/shared/stores/auth-store'
import type { Role } from '@/features/auth/types'

interface ProtectedRouteProps {
  roles?: Role[]
}

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && roles.length > 0) {
    const hasRole = user.roles.some((r) => roles.includes(r as Role))
    if (!hasRole) {
      return <Navigate to="/app" replace />
    }
  }

  return <Outlet />
}
