import { useEffect, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/shared/stores/auth-store'
import type { User as AuthUser } from '@/shared/stores/auth-store'
import { restoreSession } from '@/features/auth/api'
import type { Role } from '@/features/auth/types'

interface ProtectedRouteProps {
  roles?: Role[]
}

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const setSession = useAuthStore((s) => s.setSession)
  const [verifying, setVerifying] = useState(false)
  const verifiedRef = useRef(false)

  // التوكنات في كوكيز HttpOnly لا تصل الجافاسكربت، فالمsaved في localStorage
  // لا يثبت أن الجلسة حيّة. نتحقق مرة واحدة عند الإقلاع من داخل /app:
  // 200 ⇒ نُحدّث الفروع والأرصدة، 401 ⇒ clearAuth فيوديك ProtectedRoute إلى /login.
  useEffect(() => {
    if (!isAuthenticated || verifiedRef.current) return
    verifiedRef.current = true
    setVerifying(true)

    restoreSession()
      .then((data) => {
        const rawBranchId = Number(data.employeeDetails.branchId)
        const validBranchId = !isNaN(rawBranchId) && rawBranchId > 0 ? rawBranchId : 0
        const restored: AuthUser = {
          id: data.employeeDetails.employeeId,
          userName: data.employeeDetails.employeeName,
          email: '',
          roles: [data.role],
        }
        setSession(restored, data.branchDetails, validBranchId)
      })
      .catch(() => clearAuth())
      .finally(() => setVerifying(false))
  }, [isAuthenticated, setSession, clearAuth])

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (verifying) {
    return null
  }

  if (roles && roles.length > 0) {
    const hasRole = user.roles.some((r) => roles.includes(r as Role))
    if (!hasRole) {
      return <Navigate to="/app" replace />
    }
  }

  return <Outlet />
}
