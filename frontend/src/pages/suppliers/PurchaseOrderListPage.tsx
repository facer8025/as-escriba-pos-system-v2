import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import {
  Plus, Search, Filter, ChevronDown, ChevronRight, Truck, Package, Send, XCircle, CheckCircle, Clock
} from 'lucide-react';
import type { ApiResponse, PageResponse, PurchaseOrder } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; class: string; icon: any }> = {
  DRAFT: { label: 'Borrador', class: 'badge-neutral', icon: Clock },
  SENT: { label: 'Enviada', class: 'badge-info', icon: Send },
  CONFIRMED: { label: 'Confirmada', class: 'badge-warning', icon: CheckCircle },
  IN_TRANSIT: { label: 'En camino', class: 'badge-warning', icon: Truck },
  PARTIALLY_RECEIVED: { label: 'Recibida parcial', class: 'badge-warning', icon: Package },
  RECEIVED: { label: 'Recibida', class: 'badge-success', icon: Package },
  CANCELLED: { label: 'Cancelada', class: 'badge-danger', icon: XCircle },
};

export default function PurchaseOrderListPage() {
  const { user } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', user?.companyId, page, statusFilter],
    queryFn: () =>
      api.get<ApiResponse<PageResponse<PurchaseOrder>>>('/purchase-orders', {
        params: { companyId: user?.companyId, page, size: 25, status: statusFilter || undefined },
      }),
    enabled: !!user?.companyId,
  });

  const orders = data?.data?.data?.content || [];
  const totalElements = data?.data?.data?.totalElements || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Órdenes de compra</h1>
          <p className="text-surface-500 mt-1">{totalElements} órdenes registradas</p>
        </div>
        <Link to="/proveedores/ordenes/nueva" className="btn-primary">
          <Plus size={16} /> Nueva orden
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[250px] relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input type="text" placeholder="Buscar por N° orden o proveedor..." value={search}
              onChange={e => setSearch(e.target.value)} className="input pl-9" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} className="input w-auto min-w-[160px]">
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>N° Orden</th>
              <th>Proveedor</th>
              <th>Fecha</th>
              <th>Entrega esperada</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-12 text-surface-400">Cargando...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-surface-400">
                <Package size={48} className="mx-auto mb-3 opacity-30" />
                <p>No hay órdenes de compra</p>
                <Link to="/proveedores/ordenes/nueva" className="btn-primary mt-4 inline-flex">Crear primera orden</Link>
              </td></tr>
            ) : (
              orders.map(order => {
                const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.DRAFT;
                const Icon = sc.icon;
                return (
                  <tr key={order.id} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors">
                    <td className="font-mono text-sm font-medium">{order.orderNumber}</td>
                    <td>
                      <div>
                        <p className="font-medium text-surface-900 dark:text-white">{order.supplier?.businessName || '—'}</p>
                        <p className="text-xs text-surface-400">{order.supplier?.documentNumber || ''}</p>
                      </div>
                    </td>
                    <td className="text-sm">{formatDate(order.orderDate)}</td>
                    <td className="text-sm text-surface-500">{order.expectedDate ? formatDate(order.expectedDate) : '—'}</td>
                    <td className="font-medium">{formatCurrency(order.total)}</td>
                    <td><span className={`badge ${sc.class} flex items-center gap-1 w-fit`}><Icon size={12} />{sc.label}</span></td>
                    <td>
                      <div className="flex items-center gap-1">
                        {(order.status === 'SENT' || order.status === 'CONFIRMED') && (
                          <Link to={`/proveedores/ordenes/${order.id}/recibir`} className="btn-ghost p-1.5 text-accent-600" title="Recibir mercancía">
                            <Package size={16} />
                          </Link>
                        )}
                        <Link to={`/proveedores/ordenes/${order.id}`} className="btn-ghost p-1.5" title="Ver detalle">
                          <ChevronRight size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalElements > 25 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-surface-400">Mostrando 1-{Math.min(25, totalElements)} de {totalElements}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0} className="btn-ghost p-2">Anterior</button>
            <button onClick={() => setPage(p => p+1)} disabled={(page+1)*25 >= totalElements} className="btn-ghost p-2">Siguiente</button>
          </div>
        </div>
      )}
    </div>
  );
}
