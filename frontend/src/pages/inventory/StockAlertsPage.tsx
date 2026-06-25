import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatCurrency, formatNumber, cn } from '@/lib/utils';
import { AlertTriangle, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import type { ApiResponse, Product, PageResponse } from '@/types';

export default function StockAlertsPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'critical' | 'out'>('critical');

  const { data, isLoading } = useQuery({
    queryKey: ['products', user?.companyId],
    queryFn: () => api.get<ApiResponse<PageResponse<Product>>>('/products', {
      params: { companyId: user?.companyId, page: 0, size: 100, sortBy: 'currentStock', sortDir: 'asc' },
    }),
    enabled: !!user?.companyId,
    refetchInterval: 30000,
  });

  const products = data?.data?.data?.content || [];
  const critical = products.filter(p => p.currentStock > 0 && p.currentStock <= p.stockMin);
  const outOfStock = products.filter(p => p.currentStock <= 0);

  const list = tab === 'critical' ? critical : outOfStock;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Alertas de stock</h1>
          <p className="text-surface-500 text-sm mt-1">{critical.length + outOfStock.length} productos requieren atención</p>
        </div>
        <button className="btn-primary"><ShoppingCart size={16} /> Orden masiva</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-surface-500">Stock crítico</p>
          <p className="text-2xl font-bold text-yellow-600">{critical.length}</p>
        </div>
        <div className="card p-4 border-l-4 border-red-500">
          <p className="text-sm text-surface-500">Sin stock</p>
          <p className="text-2xl font-bold text-red-600">{outOfStock.length}</p>
        </div>
        <div className="card p-4 border-l-4 border-primary-500">
          <p className="text-sm text-surface-500">Total productos</p>
          <p className="text-2xl font-bold">{products.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('critical')}
          className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all',
            tab === 'critical' ? 'bg-yellow-500 text-white' : 'bg-surface-100 text-surface-600')}>
          Stock crítico ({critical.length})
        </button>
        <button onClick={() => setTab('out')}
          className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all',
            tab === 'out' ? 'bg-red-500 text-white' : 'bg-surface-100 text-surface-600')}>
          Sin stock ({outOfStock.length})
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Código</th>
              <th>Categoría</th>
              <th>Stock actual</th>
              <th>Stock mínimo</th>
              <th>Diferencia</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-8 text-surface-400">Cargando...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-surface-400">
                <TrendingUp size={48} className="mx-auto mb-3 opacity-30 text-accent-500" />
                <p className="text-accent-600 font-medium">Todos los productos tienen stock suficiente</p>
              </td></tr>
            ) : (
              list.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className={p.currentStock <= 0 ? 'text-red-500' : 'text-yellow-500'} />
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="font-mono text-xs">{p.internalCode || '-'}</td>
                  <td><span className="badge-neutral">{p.categoryName || '-'}</span></td>
                  <td className={cn('font-bold', p.currentStock <= 0 ? 'text-red-600' : 'text-yellow-600')}>
                    {p.currentStock.toFixed(2)}
                  </td>
                  <td>{p.stockMin.toFixed(0)}</td>
                  <td className={cn('font-medium', (p.currentStock - p.stockMin) < 0 ? 'text-red-500' : 'text-accent-500')}>
                    {(p.currentStock - p.stockMin).toFixed(2)}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn-ghost text-xs py-1 px-2 text-accent-600"><ShoppingCart size={12} /> Pedir</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
