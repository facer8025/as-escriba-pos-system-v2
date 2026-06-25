import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  BarChart3, Package, DollarSign, ShoppingCart, TrendingUp,
  Users, Truck, AlertTriangle, ClipboardList, FileText,
} from 'lucide-react';
import type { ApiResponse } from '@/types';

export default function ReportsHubPage() {
  const { user } = useAuthStore();

  const { data: generalData } = useQuery({
    queryKey: ['reports-general', user?.companyId],
    queryFn: () => api.get<ApiResponse<any>>('/reports/general', { params: { companyId: user?.companyId } }),
    enabled: !!user?.companyId,
  });

  const g = generalData?.data?.data || {};

  const categories = [
    {
      title: 'Ventas',
      icon: BarChart3,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      reports: [
        { label: 'Ventas por período', desc: 'Detalle de todas las ventas con filtros', path: '/reportes/ventas', icon: ShoppingCart },
        { label: 'Cierre de caja', desc: 'Resumen de un turno de caja', path: '/reportes/cierre-caja', icon: DollarSign },
      ],
    },
    {
      title: 'Inventario',
      icon: Package,
      color: 'text-accent-500',
      bg: 'bg-accent-50 dark:bg-accent-900/20',
      reports: [
        { label: 'Stock actual', desc: 'Inventario valorizado en tiempo real', path: '/reportes/inventario', icon: ClipboardList },
        { label: 'Kardex por producto', desc: 'Movimientos históricos de un producto', path: '/inventario/kardex', icon: FileText },
      ],
    },
    {
      title: 'Compras',
      icon: Truck,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      reports: [
        { label: 'Compras por proveedor', desc: 'Órdenes y recepciones', path: '/proveedores/ordenes', icon: Truck },
      ],
    },
  ];

  const stats = [
    { label: 'Ventas hoy', value: formatCurrency(g.todaySales || 0), icon: TrendingUp, color: 'text-accent-500' },
    { label: 'Transacciones', value: formatNumber(g.todayTransactions || 0), icon: ShoppingCart, color: 'text-blue-500' },
    { label: 'Clientes', value: formatNumber(g.totalCustomers || 0), icon: Users, color: 'text-purple-500' },
    { label: 'Proveedores', value: formatNumber(g.totalSuppliers || 0), icon: Truck, color: 'text-orange-500' },
    { label: 'Órdenes activas', value: formatNumber(g.activeOrders || 0), icon: AlertTriangle, color: 'text-yellow-500' },
    { label: 'Valor inventario', value: formatCurrency(g.inventoryValue || 0), icon: DollarSign, color: 'text-accent-500' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Reportes</h1>
        <p className="text-surface-500 mt-1">Indicadores y reportes del sistema</p>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="card p-4 text-center hover:shadow-card-hover transition-all">
            <s.icon size={20} className={`${s.color} mx-auto mb-2`} />
            <p className="text-lg font-bold text-surface-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-surface-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Report categories */}
      {categories.map((cat, i) => (
        <div key={i}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-1.5 rounded-lg ${cat.bg}`}>
              <cat.icon size={16} className={cat.color} />
            </div>
            <h2 className="font-semibold text-surface-900 dark:text-white">{cat.title}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cat.reports.map((r, j) => (
              <Link key={j} to={r.path}
                className="card-hover p-5 flex items-start gap-4 group">
                <div className={`p-2.5 rounded-xl ${cat.bg} group-hover:scale-110 transition-transform`}>
                  <r.icon size={20} className={cat.color} />
                </div>
                <div>
                  <h3 className="font-medium text-surface-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">
                    {r.label}
                  </h3>
                  <p className="text-sm text-surface-500 mt-1">{r.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
