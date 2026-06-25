import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Search, Package, ArrowLeft, FileDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ApiResponse, Product, PageResponse, InventoryMovement } from '@/types';

export default function KardexPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: products } = useQuery({
    queryKey: ['kardex-products', user?.companyId, search],
    queryFn: () => api.get<ApiResponse<PageResponse<Product>>>('/products', {
      params: { companyId: user?.companyId, search, page: 0, size: 10 },
    }),
    enabled: search.length >= 2 && !!user?.companyId,
  });

  const { data: movements } = useQuery({
    queryKey: ['kardex-movements', selectedProduct?.id],
    queryFn: () => api.get<ApiResponse<InventoryMovement[]>>(`/inventory/kardex/${selectedProduct!.id}`),
    enabled: !!selectedProduct?.id,
  });

  const productList = products?.data?.data?.content || [];
  const movs = movements?.data?.data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/inventario')} className="btn-ghost p-2"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Kardex de producto</h1>
          <p className="text-surface-500 text-sm">Movimientos históricos de inventario</p>
        </div>
      </div>

      {/* Product search */}
      <div className="card p-4">
        {selectedProduct ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package size={20} className="text-surface-400" />
              <div>
                <p className="font-medium">{selectedProduct.name}</p>
                <p className="text-xs text-surface-400">{selectedProduct.internalCode}</p>
              </div>
            </div>
            <button onClick={() => setSelectedProduct(null)} className="btn-ghost text-sm">Cambiar</button>
          </div>
        ) : (
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input type="text" placeholder="Busca el producto..." value={search}
              onChange={e => setSearch(e.target.value)} className="input pl-9" autoFocus />
            {search.length >= 2 && productList.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#13132b] border rounded-xl shadow-soft z-10">
                {productList.map(p => (
                  <button key={p.id} onClick={() => { setSelectedProduct(p); setSearch(''); }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-surface-50 text-sm border-b last:border-0">
                    <Package size={16} className="text-surface-400" />
                    <span className="font-medium">{p.name}</span>
                    <span className="text-surface-400 ml-auto text-xs">Stock: {p.currentStock.toFixed(0)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Movements table */}
      {selectedProduct && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Referencia</th>
                <th>Entradas</th>
                <th>Salidas</th>
                <th>Saldo</th>
                <th>Costo und.</th>
                <th>Valor mov.</th>
              </tr>
            </thead>
            <tbody>
              {movs.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-surface-400">Sin movimientos</td></tr>
              ) : (
                movs.map(m => (
                  <tr key={m.id}>
                    <td className="text-sm">{formatDate(m.createdAt)}</td>
                    <td><span className={cn('badge text-[10px]',
                      m.movementType.includes('ENTRY') || m.movementType.includes('POSITIVE') || m.movementType === 'INITIAL' ? 'badge-success' :
                      'badge-danger')}>{m.movementType}</span></td>
                    <td className="text-xs text-surface-400">{m.referenceType} {m.referenceId?.slice(0,8)}</td>
                    <td className={cn('text-center font-medium', m.quantity > 0 ? 'text-accent-600' : '')}>
                      {m.quantity > 0 ? `+${m.quantity.toFixed(2)}` : ''}</td>
                    <td className={cn('text-center font-medium', m.quantity < 0 ? 'text-red-600' : '')}>
                      {m.quantity < 0 ? `${m.quantity.toFixed(2)}` : ''}</td>
                    <td className="text-center font-bold">{m.stockAfter.toFixed(2)}</td>
                    <td className="text-right text-sm">{m.unitCost ? formatCurrency(m.unitCost) : '—'}</td>
                    <td className="text-right text-sm">{formatCurrency(Math.abs(m.quantity) * (m.unitCost || 0))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!selectedProduct && (
        <div className="card p-12 text-center text-surface-400">
          <Package size={48} className="mx-auto mb-4 opacity-30" />
          <p>Selecciona un producto para ver su kardex</p>
        </div>
      )}
    </div>
  );
}
