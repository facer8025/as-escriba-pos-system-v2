import { useEffect } from 'react'
import { useAdminAuthStore } from '@/stores/admin-auth-store'
import { useAdminUiStore } from '@/stores/ui-store'
import { AdminRouter } from '@/routes/admin-router'
import { ToastContainer } from '@/lib/toast'

export default function App() {
  const { isAuthenticated } = useAdminAuthStore()
  const { setTheme } = useAdminUiStore()

  // Initialize theme
  useEffect(() => {
    const saved = localStorage.getItem('admin-escriba-theme') as 'light' | 'dark' | 'system' | null
    if (saved) setTheme(saved)
  }, [setTheme])

  // Auto-login check: if tokens exist but no user, try to get profile
  useEffect(() => {
    if (isAuthenticated && !useAdminAuthStore.getState().user) {
      fetch('/api/v1/admin/auth/me', {
        headers: {
          Authorization: `Bearer ${useAdminAuthStore.getState().accessToken}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Error al obtener perfil')
          return res.json()
        })
        .then((response) => {
          // Desempaquetar ApiResponse wrapper: { success, data: AdminUserResponse }
          const data = response.data
          if (data && data.id) useAdminAuthStore.getState().setUser(data)
        })
        .catch(() => {
          // If profile fetch fails, logout
          useAdminAuthStore.getState().logout()
        })
    }
  }, [isAuthenticated])

  return (
    <>
      <AdminRouter />
      <ToastContainer />
    </>
  )
}
