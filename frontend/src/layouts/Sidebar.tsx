import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Truck,
  FileText,
  BarChart3,
  Settings,
  Users,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Boxes,
  Store,
  Receipt,
  RotateCcw,
  ArrowLeftRight,
  AlertTriangle,
  ClipboardList,
  Building2,
  CreditCard,
  BookOpen,
  Banknote,
} from 'lucide-react';

interface NavItem {
  label: string;
  path?: string;
  icon: React.ElementType;
  roles?: string[];
  children?: NavItem[];
}

const navigation: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  {
    label: 'Punto de Venta',
    icon: ShoppingCart,
    children: [
      { label: 'Nueva venta', path: '/pos', icon: ShoppingCart, roles: ['AD', 'CA', 'VE'] },
      { label: 'Ventas del día', path: '/pos/historial', icon: Receipt, roles: ['AD', 'CA'] },
      { label: 'Devoluciones', path: '/pos/devoluciones', icon: RotateCcw, roles: ['AD', 'CA'] },
    ],
  },
  {
    label: 'Inventario',
    icon: Boxes,
    children: [
      { label: 'Resumen', path: '/inventario', icon: ClipboardList },
      { label: 'Entradas', path: '/inventario/entradas/nueva', icon: Package, roles: ['AD', 'BO'] },
      { label: 'Salidas', path: '/inventario/salidas/nueva', icon: Package, roles: ['AD', 'BO'] },
      { label: 'Ajustes', path: '/inventario/ajustes/toma', icon: ArrowLeftRight, roles: ['AD', 'BO'] },
      { label: 'Kardex', path: '/inventario/kardex', icon: BookOpen, roles: ['AD', 'BO'] },
      { label: 'Alertas', path: '/inventario/alertas', icon: AlertTriangle },
    ],
  },
  {
    label: 'Productos',
    icon: Tags,
    children: [
      { label: 'Catálogo', path: '/productos', icon: Package },
      { label: 'Categorías', path: '/productos/categorias', icon: Tags, roles: ['AD'] },
    ],
  },
  {
    label: 'Proveedores',
    icon: Truck,
    children: [
      { label: 'Directorio', path: '/proveedores', icon: Building2 },
      { label: 'Órdenes de compra', path: '/proveedores/ordenes', icon: ClipboardList, roles: ['AD', 'BO'] },
    ],
  },
  {
    label: 'Facturación',
    icon: FileText,
    children: [
      { label: 'Facturas y Tickets', path: '/facturacion/facturas', icon: Receipt },
      { label: 'Configuración DIAN', path: '/facturacion/configuracion', icon: Settings, roles: ['AD'] },
    ],
  },
  { label: 'Clientes', path: '/clientes', icon: Users },
  { label: 'Reportes', path: '/reportes', icon: BarChart3, roles: ['AD', 'BO'] },
  {
    label: 'Configuración',
    icon: Settings,
    roles: ['AD'],
    children: [
      { label: 'Empresa', path: '/configuracion/empresa', icon: Store },
      { label: 'Usuarios', path: '/configuracion/usuarios', icon: Users },
      { label: 'Medios de pago', path: '/configuracion/medios-pago', icon: CreditCard },
      { label: 'Parámetros', path: '/configuracion/parametros', icon: Settings },
      { label: 'Catálogos', path: '/configuracion/catalogos', icon: BookOpen },
    ],
  },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    );
  };

  const isActive = (path?: string) => path && location.pathname === path;
  const isParentActive = (item: NavItem) =>
    item.children?.some((child) => isActive(child.path));

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-[#f7f4f0] dark:bg-[#0d0d24] border-r border-surface-100 dark:border-surface-800 transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-surface-200 dark:border-surface-800">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="font-bold text-lg text-primary-500">ESCRIBA</span>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">E</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navigation.map((item) => {
          // Check role access
          if (item.roles && user && !item.roles.includes(user.role)) return null;

          const hasSubmenu = item.children && item.children.length > 0;
          const isExpanded = expandedMenus.includes(item.label);

          return (
            <div key={item.label}>
              {hasSubmenu ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      isParentActive(item)
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                    )}
                  >
                    <item.icon size={20} className="flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown
                          size={16}
                          className={cn(
                            'transition-transform duration-200',
                            isExpanded && 'rotate-180'
                          )}
                        />
                      </>
                    )}
                  </button>
                  {isExpanded && !sidebarCollapsed && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children!.map((child) => {
                        if (child.roles && user && !child.roles.includes(user.role)) return null;
                        return (
                          <NavLink
                            key={child.path}
                            to={child.path!}
                            className={({ isActive: active }) =>
                              cn(
                                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200',
                                active
                                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                                  : 'text-surface-500 dark:text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800'
                              )
                            }
                          >
                            <child.icon size={16} />
                            <span>{child.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <NavLink
                  to={item.path!}
                  className={({ isActive: active }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      active
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                    )
                  }
                >
                  <item.icon size={20} className="flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-surface-200 dark:border-surface-800 p-2">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-surface-600 dark:text-surface-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all duration-200"
        >
          <LogOut size={20} />
          {!sidebarCollapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
