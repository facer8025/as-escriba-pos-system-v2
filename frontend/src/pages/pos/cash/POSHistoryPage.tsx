import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  DollarSign, ShoppingCart, TrendingUp, Receipt,
  Search, Filter, X, Printer, RotateCcw, Eye,
  ChevronLeft, ChevronRight, ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ApiResponse, PageResponse, Sale } from '@/types';

export default function POSHistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data, isLoading } = useQuery({
    queryKey: ['pos-history', user?.companyId, page, statusFilter],
    queryFn: () =>
      api.get<ApiResponse<PageResponse<Sale>>>('/sales', {
        params: {
          companyId: user?.companyId,
          page, size: 25,
          status: statusFilter || undefined,
        },
      }),
    enabled: !!user?.companyId,
  });

  const sales = data?.data?.data?.content || [];
  const totalElements = data?.data?.data?.totalElements || 0;

  const totalAmount = sales.reduce((s, sale) => s + sale.total, 0);
  const avgTicket = sales.length > 0 ? totalAmount / sales.length : 0;
  const maxSale = sales.reduce((max, s) => Math.max(max, s.total), 0);

  const summaryCards = [
    { label: 'Total vendido', value: formatCurrency(totalAmount), icon: DollarSign, color: 'text-accent-500', bg: 'bg-accent-50' },
    { label: 'Ventas del día', value: totalElements, icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Ticket promedio', value: formatCurrency(avgTicket), icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Mayor venta', value: formatCurrency(maxSale), icon: Receipt, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/pos')} className="btn-ghost p-2"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Ventas del día</h1>
            <p className="text-surface-500 text-sm">{todayStart.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((s, i) => (
          <div key={i} className="card p-5">
            <div className={`p-2.5 w-fit rounded-xl ${s.bg} mb-3`}><s.icon size={20} className={s.color} /></div>
            <p className="text-2xl font-bold text-surface-900 dark:text-white">{s.value}</p>
            <p className="text-sm text-surface-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} className="input w-auto">
            <option value="">Todas las ventas</option>
            <option value="COMPLETED">Completadas</option>
            <option value="CANCELLED">Anuladas</option>
          </select>
          <select className="input w-auto">
            <option>Todos los tipos</option>
            <option>Ticket POS</option>
            <option>Factura electrónica</option>
          </select>
          <span className="text-sm text-surface-400 ml-auto">{totalElements} ventas hoy</span>
        </div>
      </div>

      {/* Sales table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>N° Venta</th>
              <th>Hora</th>
              <th>Cliente</th>
              <th>Ítems</th>
              <th>Medio de pago</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-12 text-surface-400">Cargando...</td></tr>
            ) : sales.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-surface-400">
                <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
                <p>No hay ventas registradas hoy</p>
              </td></tr>
            ) : (
              sales.map(sale => (
                <tr key={sale.id} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30 cursor-pointer" onClick={() => setSelectedSale(sale)}>
                  <td className="font-mono text-sm font-medium">{sale.saleNumber}</td>
                  <td className="text-sm">{new Date(sale.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{sale.customer?.name || 'CF'}</td>
                  <td className="text-center">{sale.items?.length || 0}</td>
                  <td>
                    {sale.payments?.map((p, i) => (
                      <span key={i} className="badge-neutral text-[10px] mr-1">
                        {p.paymentMethod?.name || '—'}
                      </span>
                    ))}
                  </td>
                  <td className="font-medium">{formatCurrency(sale.total)}</td>
                  <td>
                    <span className={cn('badge', sale.status === 'COMPLETED' ? 'badge-success' : 'badge-danger')}>
                      {sale.status === 'COMPLETED' ? 'Completada' : 'Anulada'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button className="btn-ghost p-1.5" title="Ver detalle" onClick={() => setSelectedSale(sale)}><Eye size={14} /></button>
                      <button className="btn-ghost p-1.5" title="Reimprimir"><Printer size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalElements > 25 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-surface-400">Página {page + 1} de {Math.ceil(totalElements / 25)}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0} className="btn-ghost p-2"><ChevronLeft size={16} /> Anterior</button>
            <button onClick={() => setPage(p => p+1)} disabled={(page+1)*25 >= totalElements} className="btn-ghost p-2">Siguiente <ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {/* Sale detail modal */}
      {selectedSale && (
        <div className="modal-overlay" onClick={() => setSelectedSale(null)}>
          <div className="modal-content w-[500px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Venta {selectedSale.saleNumber}</h2>
              <button onClick={() => setSelectedSale(null)} className="btn-ghost p-1"><X size={18} /></button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-surface-400">Fecha</span><span>{formatDate(selectedSale.createdAt, 'long')}</span></div>
              <div className="flex justify-between"><span className="text-surface-400">Cliente</span><span>{selectedSale.customer?.name || 'Consumidor Final'}</span></div>
              <div className="flex justify-between"><span className="text-surface-400">Vendedor</span><span>{selectedSale.seller?.fullName || '—'}</span></div>
              <div className="flex justify-between"><span className="text-surface-400">Tipo doc.</span><span>{selectedSale.documentType === 'POS' ? 'Ticket POS' : selectedSale.documentType}</span></div>
            </div>

            <div className="border-t my-4 pt-4">
              <h3 className="font-medium mb-2">Ítems</h3>
              <div className="space-y-2">
                {selectedSale.items?.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.product?.name} x{item.quantity}</span>
                    <span className="font-medium">{formatCurrency(item.total)}</span>
                  </div>
                )) || <p className="text-surface-400 text-sm">Sin ítems</p>}
              </div>
            </div>

            <div className="border-t pt-4 space-y-1">
              <div className="flex justify-between text-sm"><span className="text-surface-400">Subtotal</span><span>{formatCurrency(selectedSale.subtotal)}</span></div>
              {selectedSale.discountTotal > 0 && (
                <div className="flex justify-between text-sm text-red-500"><span>Descuento</span><span>-{formatCurrency(selectedSale.discountTotal)}</span></div>
              )}
              <div className="flex justify-between text-sm"><span className="text-surface-400">IVA</span><span>{formatCurrency(selectedSale.taxTotal)}</span></div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-primary-600 dark:text-primary-400">{formatCurrency(selectedSale.total)}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button className="btn-primary flex-1"><Printer size={16} /> Reimprimir</button>
              <button className="btn-secondary flex-1"><RotateCcw size={16} /> Devolución</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
