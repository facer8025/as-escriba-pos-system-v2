import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuthStore } from '@/stores/admin-auth-store'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, totpRequired } = useAdminAuthStore()
  const location = useLocation()

  if (totpRequired) {
    return <Navigate to="/login/2fa" state={{ from: location }} replace />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
