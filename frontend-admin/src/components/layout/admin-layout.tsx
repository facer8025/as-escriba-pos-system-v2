import { Outlet } from 'react-router-dom'
import { AdminSidebar } from './admin-sidebar'
import { AdminHeader } from './admin-header'
import { useAdminUiStore } from '@/stores/ui-store'
import { useEffect } from 'react'

export function AdminLayout() {
  const { sidebarCollapsed } = useAdminUiStore()

  useEffect(() => {
    const sidebarWidth = sidebarCollapsed ? 64 : 260
    document.documentElement.style.setProperty('--admin-sidebar-width', `${sidebarWidth}px`)
  }, [sidebarCollapsed])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <AdminSidebar />
      <AdminHeader />

      <main
        className="pt-16 min-h-screen transition-all duration-300"
        style={{ marginLeft: 'var(--admin-sidebar-width)' }}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
