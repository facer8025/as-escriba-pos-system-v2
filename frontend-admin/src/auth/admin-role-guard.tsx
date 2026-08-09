import { useAdminAuthStore } from '@/stores/admin-auth-store'
import type { AdminRoleCode } from '@/types/admin'

interface AdminRoleGuardProps {
  children: React.ReactNode
  roles: AdminRoleCode[]
  fallback?: React.ReactNode
}

/**
 * Role guard for admin panel.
 * Auditor (AU) always has read-only access to all modules.
 */
export function AdminRoleGuard({ children, roles, fallback }: AdminRoleGuardProps) {
  const { user } = useAdminAuthStore()

  if (!user) return null

  // AU (Auditor) has read-only access everywhere
  const hasAccess = user.role === 'AU' || roles.includes(user.role as AdminRoleCode)

  if (!hasAccess) {
    if (fallback) return <>{fallback}</>
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-full bg-danger-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.364A9 9 0 1112 3a9 9 0 017.364 4.636z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          Acceso denegado
        </h2>
        <p className="text-neutral-500 max-w-md">
          No tienes permisos suficientes para acceder a este módulo.
          Contacta a un Super Admin si necesitas acceso.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
