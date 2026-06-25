import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { Search, Bell, Moon, Sun, Monitor, Menu, X, CheckCheck, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { formatDate } from '@/lib/utils';
import type { ApiResponse } from '@/types';
import toast from 'react-hot-toast';

interface AppNotification {
  id: string;
  title: string;
  message?: string;
  icon?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export default function Header() {
  const { sidebarCollapsed, toggleSidebar, theme, setTheme } = useUIStore();
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch unread count
  const { data: notifCountData, refetch: refetchCount } = useQuery({
    queryKey: ['notif-count', user?.companyId, user?.userId],
    queryFn: () =>
      api.get<ApiResponse<{ count: number }>>('/notifications/unread-count', {
        params: { companyId: user?.companyId, userId: user?.userId },
      }),
    enabled: !!user?.companyId && !!user?.userId,
    refetchInterval: 30000,
  });

  // Fetch notifications list
  const { data: notifData, refetch: refetchNotifs } = useQuery({
    queryKey: ['notifications', user?.companyId],
    queryFn: () =>
      api.get<ApiResponse<{ content: AppNotification[] }>>('/notifications', {
        params: { companyId: user?.companyId, userId: user?.userId, page: 0, size: 10 },
      }),
    enabled: !!user?.companyId && !!user?.userId,
  });

  const unreadCount = notifCountData?.data?.data?.count || 0;
  const notifications = notifData?.data?.data?.content || [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 bg-[#f7f4f0]/90 dark:bg-[#0d0d24]/80 backdrop-blur-xl border-b border-surface-100 dark:border-surface-800 transition-all duration-300',
        sidebarCollapsed ? 'left-16' : 'left-60'
      )}
    >
      <div className="flex items-center justify-between h-full px-6">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 lg:hidden"
          >
            <Menu size={20} />
          </button>

          {/* Global Search */}
          <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-surface-100 dark:bg-surface-800 rounded-lg min-w-[300px]">
            <Search size={16} className="text-surface-400" />
            <input
              type="text"
              placeholder="Busca productos, clientes, órdenes...  (/)"
              className="bg-transparent border-none outline-none text-sm text-surface-700 dark:text-surface-300 placeholder:text-surface-400 w-full"
            />
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-xs bg-surface-200 dark:bg-surface-700 rounded text-surface-500">
              /
            </kbd>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[380px] bg-white dark:bg-[#1a1a35] rounded-xl shadow-soft border border-surface-200 dark:border-surface-700 overflow-hidden animate-scale-in">
                <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-700">
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-white">Notificaciones</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={async () => {
                        try {
                          await api.post(`/notifications/read-all?companyId=${user?.companyId}&userId=${user?.userId}`);
                          refetchCount();
                          refetchNotifs();
                          toast.success('Notificaciones marcadas como leídas');
                        } catch {}
                      }}
                      className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1"
                    >
                      <CheckCheck size={14} />
                      Marcar todas leídas
                    </button>
                  )}
                </div>

                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-surface-400">
                      <Bell size={32} className="mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No hay notificaciones</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          'flex items-start gap-3 px-4 py-3 border-b border-surface-50 dark:border-surface-800/50 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors cursor-pointer',
                          !n.isRead && 'bg-primary-50/50 dark:bg-primary-900/10'
                        )}
                        onClick={async () => {
                          if (!n.isRead) {
                            try {
                              await api.post(`/notifications/${n.id}/read`);
                              refetchCount();
                              refetchNotifs();
                            } catch {}
                          }
                        }}
                      >
                        <div className={cn(
                          'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                          n.isRead ? 'bg-transparent' : 'bg-primary-500'
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-sm truncate',
                            n.isRead ? 'text-surface-600 dark:text-surface-400' : 'text-surface-900 dark:text-white font-medium'
                          )}>
                            {n.title}
                          </p>
                          {n.message && (
                            <p className="text-xs text-surface-400 mt-0.5 line-clamp-2">{n.message}</p>
                          )}
                          <p className="text-[10px] text-surface-400 mt-1">
                            {formatDate(n.createdAt, 'relative')}
                          </p>
                        </div>
                        {n.link && (
                          <ExternalLink size={12} className="text-surface-400 flex-shrink-0 mt-1" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                <a
                  href="/configuracion/notificaciones"
                  className="block text-center text-xs text-primary-500 hover:text-primary-600 font-medium py-3 border-t border-surface-100 dark:border-surface-700"
                >
                  Configurar notificaciones
                </a>
              </div>
            )}
          </div>

          {/* Theme selector */}
          <div className="relative" ref={themeMenuRef}>
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 transition-colors"
            >
              <ThemeIcon size={20} />
            </button>
            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-[#1a1a35] rounded-xl shadow-soft border border-surface-200 dark:border-surface-700 py-1 animate-scale-in">
                {[
                  { value: 'light', label: 'Claro', icon: Sun },
                  { value: 'dark', label: 'Oscuro', icon: Moon },
                  { value: 'system', label: 'Sistema', icon: Monitor },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => { setTheme(value as any); setShowThemeMenu(false); }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                      theme === value
                        ? 'bg-primary-500 text-white shadow-soft dark:bg-primary-600 dark:text-white'
                        : 'text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800'
                    )}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  {user?.fullName || 'Usuario'}
                </p>
                <p className="text-xs text-surface-400">{user?.roleName}</p>
              </div>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1a1a35] rounded-xl shadow-soft border border-surface-200 dark:border-surface-700 py-1 animate-scale-in">
                <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-700">
                  <p className="text-sm font-medium">{user?.fullName}</p>
                  <p className="text-xs text-surface-400">{user?.email}</p>
                </div>
                <a href="/perfil" className="block px-4 py-2 text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800">
                  Mi perfil
                </a>
                <a href="/perfil" className="block px-4 py-2 text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800">
                  Preferencias
                </a>
                <div className="border-t border-surface-100 dark:border-surface-700 mt-1 pt-1">
                  <button
                    onClick={() => { logout(); window.location.href = '/login'; }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
