import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Building2,
  FileText,
  Key,
  CreditCard,
  Puzzle,
  Users,
  Ticket,
  Megaphone,
  Activity,
  Shield,
  Settings,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdminUiStore } from '@/stores/ui-store'
import { useAdminAuthStore } from '@/stores/admin-auth-store'
import type { AdminRoleCode } from '@/types/admin'

interface MenuItem {
  label: string
  icon: React.ReactNode
  path?: string
  roles: AdminRoleCode[]
  children?: { label: string; path: string; roles: AdminRoleCode[] }[]
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    path: '/',
    roles: ['SA', 'AC', 'AF', 'ST', 'AU'],
  },
  {
    label: 'Gestión de empresas',
    icon: <Building2 className="h-5 w-5" />,
    roles: ['SA', 'AC', 'ST', 'AU'],
    children: [
      { label: 'Todas las empresas', path: '/empresas', roles: ['SA', 'AC', 'ST', 'AU'] },
      { label: 'Crear empresa', path: '/empresas/nueva', roles: ['SA', 'AC'] },
    ],
  },
  {
    label: 'Planes y precios',
    icon: <FileText className="h-5 w-5" />,
    roles: ['SA', 'AC', 'AF', 'AU'],
    children: [
      { label: 'Catálogo de planes', path: '/planes', roles: ['SA', 'AC', 'AF', 'AU'] },
      { label: 'Nuevo plan', path: '/planes/nuevo', roles: ['SA', 'AC'] },
    ],
  },
  {
    label: 'Licencias',
    icon: <Key className="h-5 w-5" />,
    path: '/licencias',
    roles: ['SA', 'AC', 'AF', 'AU'],
  },
  {
    label: 'Facturación y cobros',
    icon: <CreditCard className="h-5 w-5" />,
    path: '/facturacion',
    roles: ['SA', 'AF', 'AU'],
  },
  {
    label: 'Módulos y features',
    icon: <Puzzle className="h-5 w-5" />,
    path: '/modulos',
    roles: ['SA', 'AC', 'ST', 'AU'],
  },
  {
    label: 'Usuarios admin',
    icon: <Users className="h-5 w-5" />,
    path: '/usuarios-admin',
    roles: ['SA', 'AU'],
  },
  {
    label: 'Soporte y tickets',
    icon: <Ticket className="h-5 w-5" />,
    roles: ['SA', 'ST', 'AC', 'AU'],
    children: [
      { label: 'Bandeja de tickets', path: '/soporte', roles: ['SA', 'ST', 'AC', 'AU'] },
      { label: 'Reportes', path: '/soporte/reportes', roles: ['SA', 'ST', 'AC', 'AU'] },
    ],
  },
  {
    label: 'Comunicaciones',
    icon: <Megaphone className="h-5 w-5" />,
    path: '/comunicaciones',
    roles: ['SA', 'AC', 'AU'],
  },
  {
    label: 'Monitoreo',
    icon: <Activity className="h-5 w-5" />,
    path: '/monitoreo',
    roles: ['SA', 'ST', 'AU'],
  },
  {
    label: 'Auditoría',
    icon: <Shield className="h-5 w-5" />,
    path: '/auditoria',
    roles: ['SA', 'AU'],
  },
  {
    label: 'Configuración',
    icon: <Settings className="h-5 w-5" />,
    path: '/configuracion',
    roles: ['SA', 'AU'],
  },
]

function SidebarItem({ item, collapsed }: { item: MenuItem; collapsed: boolean }) {
  const location = useLocation()
  const { user } = useAdminAuthStore()
  const [expanded, setExpanded] = useState(() => {
    if (!item.children) return false
    return item.children.some((child) => location.pathname.startsWith(child.path))
  })

  // Check if user has access to this item
  const userRole = user?.role as AdminRoleCode
  const hasAccess = userRole === 'AU' || item.roles.includes(userRole)
  if (!hasAccess) return null

  const isActive = item.path
    ? location.pathname === item.path
    : item.children?.some((child) => location.pathname.startsWith(child.path))

  if (item.children) {
    // Filter children by role
    const visibleChildren = item.children.filter((child) => userRole === 'AU' || child.roles.includes(userRole))
    if (visibleChildren.length === 0) return null

    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
            isActive
              ? 'bg-escriba-50 text-escriba-700 dark:bg-escriba-900/20 dark:text-escriba-400'
              : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? item.label : undefined}
        >
          <span className="shrink-0">{item.icon}</span>
          {!collapsed && (
            <>
              <span className="ml-3 flex-1 text-left">{item.label}</span>
              <motion.span
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4" />
              </motion.span>
            </>
          )}
        </button>
        <AnimatePresence>
          {expanded && !collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="ml-8 mt-1 space-y-0.5">
                {visibleChildren.map((child) => (
                  <NavLink
                    key={child.path}
                    to={child.path}
                    className={({ isActive }) =>
                      cn(
                        'block px-3 py-2 rounded-lg text-sm transition-all duration-200',
                        isActive
                          ? 'bg-escriba-50 text-escriba-700 font-medium dark:bg-escriba-900/20 dark:text-escriba-400'
                          : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-800'
                      )
                    }
                  >
                    {child.label}
                  </NavLink>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <NavLink
      to={item.path!}
      className={({ isActive }) =>
        cn(
          'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-escriba-50 text-escriba-700 dark:bg-escriba-900/20 dark:text-escriba-400'
            : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800',
          collapsed && 'justify-center px-2'
        )
      }
      title={collapsed ? item.label : undefined}
    >
      <span className="shrink-0">{item.icon}</span>
      {!collapsed && <span className="ml-3">{item.label}</span>}
    </NavLink>
  )
}

export function AdminSidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAdminUiStore()

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 64 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 z-40 flex flex-col overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <motion.div
          animate={{ width: sidebarCollapsed ? 32 : 160 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3 overflow-hidden"
        >
          <div className="h-8 w-8 rounded-lg bg-escriba-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            E
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                ESCRIBA
              </span>
              <span className="text-[10px] text-escriba-600 dark:text-escriba-400 leading-tight font-medium">
                Admin
              </span>
            </div>
          )}
        </motion.div>
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="ml-auto p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-300 cursor-pointer"
          >
            <ChevronDown className="h-4 w-4 rotate-90" />
          </button>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {menuItems.map((item) => (
          <SidebarItem key={item.label} item={item} collapsed={sidebarCollapsed} />
        ))}
      </nav>

      {/* Collapse toggle */}
      {sidebarCollapsed && (
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center w-full p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            <ChevronDown className="h-4 w-4 -rotate-90" />
          </button>
        </div>
      )}
    </motion.aside>
  )
}
