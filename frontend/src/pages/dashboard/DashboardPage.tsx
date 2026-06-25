import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  TrendingUp, TrendingDown, Package, AlertTriangle,
  ShoppingCart, DollarSign, BarChart3, Clock, RotateCcw, Truck, Loader2,
} from 'lucide-react';
import type { ApiResponse, DashboardSummary } from '@/types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: summary, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard', user?.companyId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<DashboardSummary>>('/dashboard/summary', {
        params: { companyId: user?.companyId },
      });
      return response.data; // ApiResponse<DashboardSummary>
    },
    enabled: !!user?.companyId,
    refetchInterval: 30000,
    retry: 2,
  });

  // summary is ApiResponse<DashboardSummary>, so summary.data is DashboardSummary
  const stats = summary?.data;

  // Log de depuración (visible en consola del navegador)
  console.log('[Dashboard] API response:', summary);
  console.log('[Dashboard] Stats:', stats);

  const widgets = [
    {
      title: 'Ventas del día',
      value: stats?.todaySales !== undefined ? formatCurrency(stats.todaySales) : '$0',
      icon: DollarSign,
      trend: stats?.salesTrend,
      trendLabel: 'vs ayer',
      color: 'from-accent-500 to-accent-600',
      bg: 'bg-accent-50 dark:bg-accent-900/20',
    },
    {
      title: 'Transacciones',
      value: stats?.todayTransactions !== undefined ? formatNumber(stats.todayTransactions) : '0',
      icon: ShoppingCart,
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Valor inventario',
      value: formatCurrency(stats?.inventoryValue ?? 0),
      icon: Package,
      color: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Sin stock',
      value: formatNumber(stats?.outOfStock ?? 0),
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      bg: 'bg-red-50 dark:bg-red-900/20',
      alert: (stats?.outOfStock ?? 0) > 0,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Dashboard</h1>
          <p className="text-surface-500 mt-1">Cargando información...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6">
              <div className="skeleton h-4 w-24 mb-4" />
              <div className="skeleton h-8 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    console.error('[Dashboard] Error:', error);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-surface-500 mt-1">
          Resumen operativo de {user?.companyName || 'tu empresa'}
        </p>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {widgets.map((widget, i) => (
          <div
            key={i}
            className="card p-6 hover:shadow-card-hover transition-all duration-300 animate-slide-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${widget.bg}`}>
                <widget.icon size={22} className="text-surface-600 dark:text-surface-300" />
              </div>
              {widget.trend !== undefined && (
                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                  widget.trend >= 0
                    ? 'bg-accent-50 dark:bg-accent-900/20 text-accent-600'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-600'
                }`}>
                  {widget.trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {Math.abs(widget.trend).toFixed(1)}%
                </div>
              )}
            </div>
            <p className="text-sm text-surface-500 mb-1">{widget.title}</p>
            <p className="text-2xl font-bold text-surface-900 dark:text-white">
              {widget.value}
            </p>
            {widget.trendLabel && widget.trend !== undefined && (
              <p className="text-xs text-surface-400 mt-1">{widget.trendLabel}</p>
            )}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="card p-6 lg:col-span-2 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-white">
                Ventas del día
              </h3>
              <p className="text-sm text-surface-500">Últimas 12 horas</p>
            </div>
            <BarChart3 size={20} className="text-surface-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={[
                  { hour: '6am', value: 120000 },
                  { hour: '8am', value: 250000 },
                  { hour: '10am', value: 450000 },
                  { hour: '12pm', value: 380000 },
                  { hour: '2pm', value: 520000 },
                  { hour: '4pm', value: 480000 },
                  { hour: '6pm', value: 600000 },
                ]}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSalesDark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#dee2e6" />
                <XAxis dataKey="hour" stroke="#868e96" fontSize={12} />
                <YAxis
                  stroke="#868e96"
                  fontSize={12}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e9ecef',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#818cf8"
                  strokeWidth={2}
                  fill="url(#colorSales)"
                  className="dark:hidden"
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#818cf8"
                  strokeWidth={2}
                  fill="url(#colorSalesDark)"
                  className="hidden dark:block"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6 animate-slide-up">
          <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
            Acceso rápido
          </h3>
          <div className="space-y-3">
            {[
              { icon: ShoppingCart, label: 'Nueva venta', path: '/pos', color: 'text-accent-500' },
              { icon: Package, label: 'Nuevo producto', path: '/productos/nuevo', color: 'text-blue-500' },
              { icon: Truck, label: 'Nueva orden', path: '/proveedores/ordenes/nueva', color: 'text-purple-500' },
              { icon: AlertTriangle, label: 'Alertas de stock', path: '/inventario/alertas', color: 'text-red-500' },
            ].map((action, i) => (
              <a
                key={i}
                href={action.path}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800
                         transition-all duration-200 group"
              >
                <div className={`p-2 rounded-lg bg-surface-100 dark:bg-surface-800 group-hover:scale-110 transition-transform`}>
                  <action.icon size={18} className={action.color} />
                </div>
                <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  {action.label}
                </span>
              </a>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="mt-6 pt-6 border-t border-surface-100 dark:border-surface-800">
            <h4 className="text-sm font-medium text-surface-500 mb-3">
              Actividad reciente
            </h4>
            <div className="space-y-3">
              {[
                { icon: ShoppingCart, text: 'Venta #1234 - $45,000', time: 'hace 3 min', color: 'text-accent-500' },
                { icon: Package, text: 'Entrada 20 und. Arroz Diana', time: 'hace 15 min', color: 'text-blue-500' },
                { icon: RotateCcw, text: 'Devolución #5 - $12,000', time: 'hace 1h', color: 'text-orange-500' },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <activity.icon size={14} className={`${activity.color} mt-1`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-surface-700 dark:text-surface-300 truncate">
                      {activity.text}
                    </p>
                    <p className="text-xs text-surface-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
