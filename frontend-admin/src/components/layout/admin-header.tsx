import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronDown,
  LogOut,
  User,
  Moon,
  Sun,
  Monitor,
  Menu,
} from 'lucide-react'
import { useAdminAuthStore } from '@/stores/admin-auth-store'
import { useAdminUiStore } from '@/stores/ui-store'
import { getAdminRoleName } from '@/lib/utils'

export function AdminHeader() {
  const { user, logout } = useAdminAuthStore()
  const { theme, setTheme, sidebarCollapsed, toggleSidebar } = useAdminUiStore()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)

  const themeIcon = {
    light: <Sun className="h-4 w-4" />,
    dark: <Moon className="h-4 w-4" />,
    system: <Monitor className="h-4 w-4" />,
  }

  const nextTheme: Record<string, 'light' | 'dark' | 'system'> = {
    light: 'dark',
    dark: 'system',
    system: 'light',
  }

  return (
    <header
      className="fixed top-0 right-0 left-0 z-30 h-16 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800"
      style={{ left: 'var(--admin-sidebar-width, 260px)' }}
    >
      <div className="flex items-center justify-between h-full px-6 gap-4">
        {/* Left */}
        <div className="flex items-center gap-3">
          {sidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          {/* Breadcrumb area */}
          <div>
            <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Panel Administrativo
            </h2>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(nextTheme[theme])}
            className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title={`Tema: ${theme}`}
          >
            {themeIcon[theme]}
          </button>

          {/* Notifications */}
          <button className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors relative cursor-pointer">
            <Bell className="h-5 w-5" />
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-escriba-100 dark:bg-escriba-900/30 flex items-center justify-center text-escriba-700 dark:text-escriba-400 font-semibold text-sm shrink-0">
                {user?.firstName?.charAt(0)?.toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 leading-tight">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] text-neutral-400 leading-tight">
                  {user?.roleName || getAdminRoleName(user?.role || '')}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-neutral-400 hidden md:block" />
            </button>
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden"
                >
                  <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-neutral-400">{user?.email}</p>
                  </div>
                  <div className="p-3">
                    <button
                      onClick={() => { setProfileOpen(false); navigate('/perfil') }}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 w-full transition-colors cursor-pointer"
                    >
                      <User className="h-4 w-4" />
                      Mi perfil
                    </button>
                  </div>
                  <div className="border-t border-neutral-200 dark:border-neutral-800 p-3">
                    <button
                      onClick={() => {
                        logout()
                        window.location.href = '/login'
                      }}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-red-900/20 w-full transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}
