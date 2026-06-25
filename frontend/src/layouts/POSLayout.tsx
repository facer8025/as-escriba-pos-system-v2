import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { 
  Clock, LayoutDashboard, ArrowLeft, ShoppingCart, 
  History, RotateCcw, XCircle, User, LogOut, ChevronDown,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

const POS_NAV = [
  { label: 'Nueva venta', path: '/pos', icon: ShoppingCart },
  { label: 'Ventas del día', path: '/pos/historial', icon: History },
  { label: 'Devoluciones', path: '/pos/devoluciones', icon: RotateCcw },
  { label: 'Cierre de caja', path: '/pos/cierre', icon: XCircle },
  { label: 'Apertura de caja', path: '/pos/apertura', icon: XCircle },
];

export default function POSLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    navigate('/login');
  };

  const currentPage = POS_NAV.find(n => n.path === location.pathname);
  const pageTitle = currentPage?.label || 'Punto de Venta';

  return (
    <div className="h-screen bg-surface-50 dark:bg-[#0a0a1a] flex flex-col">
      {/* POS Header */}
      <header className="h-14 bg-[#f7f4f0] dark:bg-[#0d0d24] border-b border-surface-100 dark:border-surface-800 flex items-center justify-between px-4 flex-shrink-0 shadow-sm">
        {/* Left - Navigation back */}
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg 
                       bg-primary-50 dark:bg-primary-900/20 
                       text-primary-600 dark:text-primary-400 
                       hover:bg-primary-100 dark:hover:bg-primary-900/40
                       transition-all duration-200 font-medium text-sm
                       group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Menú principal</span>
          </Link>

          <div className="h-6 w-px bg-surface-200 dark:bg-surface-700" />

          {/* POS branding */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-500 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">E</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-semibold text-sm text-primary-500">ESCRIBA POS</span>
              <span className="text-xs text-surface-400 ml-2">— {pageTitle}</span>
            </div>
          </div>
        </div>

        {/* Center - POS Sub-nav */}
        <div className="hidden md:flex items-center gap-1">
          {POS_NAV.slice(0, 3).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                location.pathname === item.path
                  ? 'bg-primary-500 text-white shadow-soft'
                  : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800'
              )}
            >
              <item.icon size={14} />
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-surface-400">
            <Clock size={14} />
            {currentTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="h-6 w-px bg-surface-200 dark:bg-surface-700 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2 relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-all"
            >
              <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {user?.fullName?.charAt(0) || 'U'}
                </span>
              </div>
              <span className="text-sm text-surface-500">{user?.fullName}</span>
              <ChevronDown size={14} className="text-surface-400" />
            </button>

            {showUserMenu && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-[#13132b] border border-surface-200 dark:border-surface-700 rounded-xl shadow-lg py-1 z-50 animate-fade-in">
                <div className="px-3 py-2 border-b border-surface-100 dark:border-surface-800">
                  <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{user?.fullName}</p>
                  <p className="text-xs text-surface-400 truncate">{user?.email}</p>
                </div>
                <Link
                  to="/perfil"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                >
                  <User size={14} />
                  Mi perfil
                </Link>
                <Link
                  to="/"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                >
                  <LayoutDashboard size={14} />
                  Menú principal
                </Link>
                <div className="border-t border-surface-100 dark:border-surface-800 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={14} />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#f7f4f0] dark:bg-[#0d0d24] border-t border-surface-100 dark:border-surface-800 flex items-center justify-around px-2 py-2">
        <Link to="/" className="flex flex-col items-center gap-0.5 text-surface-400 hover:text-primary-500 transition-colors px-3 py-1">
          <LayoutDashboard size={18} />
          <span className="text-[10px]">Menú</span>
        </Link>
        {POS_NAV.slice(0, 3).map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex flex-col items-center gap-0.5 transition-colors px-3 py-1',
              location.pathname === item.path
                ? 'text-primary-500'
                : 'text-surface-400 hover:text-surface-600'
            )}
          >
            <item.icon size={18} />
            <span className="text-[10px]">{item.label.split(' ')[0]}</span>
          </Link>
        ))}
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-hidden pb-16 md:pb-0">
        <Outlet />
      </div>
    </div>
  );
}
